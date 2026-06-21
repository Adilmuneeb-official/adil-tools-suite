/**
 * Stripe + PayPal payment helpers.
 * Webhook signature verification is enforced.
 */
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { setUserPlan, computeExpiry, planPrice } from './membership'
import { applyCoupon, incrementCouponUsage, validateCoupon } from './coupons'
import { alreadyProcessed, savePaymentEvent } from './billing/webhooks'

let stripeInstance: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
    stripeInstance = new Stripe(key)
  }
  return stripeInstance
}

export async function createStripeCheckoutSession(
  userId: string,
  plan: 'pro' | 'agency',
  cycle: string,
  couponCode?: string
): Promise<{ url?: string; error?: string }> {
  try {
    const stripe = getStripe()
    let price = planPrice(plan, cycle)
    let coupon: any = null
    if (couponCode) {
      const v = await validateCoupon(couponCode, plan)
      if (v.valid) {
        coupon = v
        const applied = applyCoupon(price, v)
        price = applied.final
      }
    }
    const unitAmount = Math.round(price * 100)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: { name: `Adil Tools ${plan.toUpperCase()} (${cycle})` },
          recurring: { interval: cycle === 'yearly' ? 'year' : cycle === 'quarterly' ? 'month' : 'month', interval_count: cycle === 'yearly' ? 1 : cycle === 'quarterly' ? 3 : 1 },
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success&plan=${plan}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?payment=cancelled`,
      client_reference_id: userId,
      metadata: { userId, plan, cycle, coupon: coupon?.code || '' },
    })
    return { url: session.url || undefined }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function handleStripeWebhook(payload: string | Buffer, signature: string): Promise<{ received: boolean; error?: string }> {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return { received: false, error: 'Webhook secret not configured' }
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret)
  } catch (err: any) {
    return { received: false, error: `Invalid signature: ${err.message}` }
  }
  if (await alreadyProcessed('stripe', event.id)) return { received: true }
  await savePaymentEvent('stripe', event.id, event.type, event)
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id || session.metadata?.userId
      const plan = session.metadata?.plan as 'pro' | 'agency'
      const cycle = session.metadata?.cycle || 'monthly'
      const couponCode = session.metadata?.coupon
      if (!userId || !plan) break
      const expires = computeExpiry(cycle)
      await setUserPlan(userId, plan, expires, session.subscription as string)
      // Record subscription row
      const sub = await db.subscription.create({
        data: {
          userId,
          plan,
          gateway: 'stripe',
          subscriptionId: session.subscription as string,
          status: 'active',
          billingCycle: cycle,
          amount: (session.amount_total || 0) / 100,
          currency: (session.currency || 'USD').toUpperCase(),
          expiresAt: expires,
        },
      })
      // Transaction
      const txn = await db.transaction.create({
        data: {
          userId,
          subscriptionId: sub.id,
          transactionType: 'payment',
          gateway: 'stripe',
          plan,
          amount: (session.amount_total || 0) / 100,
          currency: (session.currency || 'USD').toUpperCase(),
          status: 'completed',
          transactionId: session.id,
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
          billingCycle: cycle,
          couponCode: couponCode || '',
          description: `Stripe checkout for ${plan} (${cycle})`,
        },
      })
      // Invoice
      await db.invoice.create({
        data: {
          userId,
          transactionId: txn.id,
          invoiceNumber: txn.invoiceNumber,
          plan,
          amount: (session.amount_total || 0) / 100,
          currency: (session.currency || 'USD').toUpperCase(),
          billingCycle: cycle,
          status: 'paid',
          paidAt: new Date(),
        },
      })
      if (couponCode) {
        const c = await validateCoupon(couponCode, plan)
        if (c.valid && c.id) await incrementCouponUsage(c.id)
      }
      await db.userActivity.create({
        data: { userId, action: 'subscription_created', detail: `Stripe ${plan} (${cycle})` },
      })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const local = await db.subscription.findFirst({ where: { subscriptionId: sub.id, gateway: 'stripe' } })
      if (local) {
        await db.subscription.update({
          where: { id: local.id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        })
        await setUserPlan(local.userId, 'free')
        await db.userActivity.create({
          data: { userId: local.userId, action: 'subscription_cancelled', detail: `Stripe sub ${sub.id}` },
        })
      }
      break
    }
  }
  return { received: true }
}

// ===== PayPal =====

export async function createPaypalOrder(userId: string, plan: 'pro' | 'agency', cycle: string, couponCode?: string): Promise<{ orderId?: string; url?: string; error?: string }> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) return { error: 'PayPal not configured' }
  let price = planPrice(plan, cycle)
  if (couponCode) {
    const v = await validateCoupon(couponCode, plan)
    if (v.valid) price = applyCoupon(price, v).final
  }
  const isSandbox = true // toggle as needed
  const base = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
  const tokenResp = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const tokenData = await tokenResp.json() as any
  const accessToken = tokenData.access_token
  if (!accessToken) return { error: 'Failed to get PayPal access token' }

  const orderResp = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `adil-${userId}-${plan}-${cycle}`,
        amount: { currency_code: 'USD', value: price.toFixed(2) },
        description: `Adil Tools ${plan.toUpperCase()} (${cycle})`,
      }],
      application_context: {
        return_url: `${process.env.NEXTAUTH_URL}/api/webhooks/paypal?gateway=paypal&userId=${userId}&plan=${plan}&cycle=${cycle}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pricing?payment=cancelled`,
        brand_name: 'Adil Tools',
        user_action: 'PAY_NOW',
      },
    }),
  })
  const order = await orderResp.json() as any
  if (!order.id) return { error: order.error?.message || 'PayPal order failed' }
  const approveUrl = order.links?.find((l: any) => l.rel === 'approve')?.href
  return { orderId: order.id, url: approveUrl }
}

export async function capturePaypalOrder(orderId: string, userId: string, plan: 'pro' | 'agency', cycle: string): Promise<{ ok: boolean; error?: string }> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) return { ok: false, error: 'PayPal not configured' }
  const base = 'https://api-m.sandbox.paypal.com'
  const tokenResp = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const tokenData = await tokenResp.json() as any
  const accessToken = tokenData.access_token
  const captureResp = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  })
  const capture = await captureResp.json() as any
  if (capture.status !== 'COMPLETED') return { ok: false, error: 'Capture failed' }
  const amount = parseFloat(capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0')
  const expires = computeExpiry(cycle)
  await setUserPlan(userId, plan, expires, orderId)
  const sub = await db.subscription.create({
    data: { userId, plan, gateway: 'paypal', subscriptionId: orderId, status: 'active', billingCycle: cycle, amount, currency: 'USD', expiresAt: expires },
  })
  const txn = await db.transaction.create({
    data: {
      userId, subscriptionId: sub.id, transactionType: 'payment', gateway: 'paypal', plan, amount, currency: 'USD',
      status: 'completed', transactionId: orderId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
      billingCycle: cycle, description: `PayPal order for ${plan} (${cycle})`,
    },
  })
  await db.invoice.create({
    data: {
      userId, transactionId: txn.id, invoiceNumber: txn.invoiceNumber, plan, amount, currency: 'USD',
      billingCycle: cycle, status: 'paid', paidAt: new Date(),
    },
  })
  await db.userActivity.create({
    data: { userId, action: 'subscription_created', detail: `PayPal ${plan} (${cycle})` },
  })
  return { ok: true }
}
