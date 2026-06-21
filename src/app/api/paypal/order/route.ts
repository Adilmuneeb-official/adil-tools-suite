import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createPaypalOrder } from '@/lib/payments'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
    const body = await req.json()
    const plan = String(body.plan || '')
    const cycle = String(body.cycle || 'monthly')
    const coupon = body.coupon ? String(body.coupon).trim() : undefined

    if (!['pro', 'agency'].includes(plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    if (!['monthly', 'quarterly', 'yearly'].includes(cycle)) return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 })
    if (user.plan === plan) return NextResponse.json({ error: 'You are already on this plan' }, { status: 400 })

    const result = await createPaypalOrder(user.id, plan as 'pro' | 'agency', cycle, coupon)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ orderId: result.orderId, url: result.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'PayPal checkout failed' }, { status: 500 })
  }
}
