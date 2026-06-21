import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createPaypalOrder } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const body = await req.json()
  const { plan, cycle, coupon } = body
  if (!['pro', 'agency'].includes(plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  const result = await createPaypalOrder(user.id, plan, cycle || 'monthly', coupon)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ orderId: result.orderId, url: result.url })
}
