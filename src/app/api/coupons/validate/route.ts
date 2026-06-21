import { NextRequest, NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/coupons'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const code = String(body.code || '')
    const plan = String(body.plan || '')
    if (!['pro', 'agency'].includes(plan)) {
      return NextResponse.json({ valid: false, message: 'Choose a paid plan before applying a coupon' }, { status: 400 })
    }
    const result = await validateCoupon(code, plan)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ valid: false, message: 'Coupon validation failed' }, { status: 500 })
  }
}
