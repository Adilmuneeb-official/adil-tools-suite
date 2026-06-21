import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { setUserPlan } from '@/lib/membership'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  if (!user.subscriptionId) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }
  // Try cancel at Stripe
  if (user.subscriptionId.startsWith('sub_') && process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      await stripe.subscriptions.del(user.subscriptionId)
    } catch (e) {
      console.error('Stripe cancel error', e)
    }
  }
  // Update DB
  const sub = await db.subscription.findFirst({ where: { subscriptionId: user.subscriptionId }, orderBy: { createdAt: 'desc' } })
  if (sub) {
    await db.subscription.update({ where: { id: sub.id }, data: { status: 'cancelled', cancelledAt: new Date() } })
  }
  await setUserPlan(user.id, 'free')
  await db.userActivity.create({
    data: { userId: user.id, action: 'subscription_cancelled', detail: `Subscription ${user.subscriptionId} cancelled` },
  })
  return NextResponse.json({ success: true })
}
