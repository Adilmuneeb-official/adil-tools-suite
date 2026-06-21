import { NextRequest, NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/coupons'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { code, plan } = body
  const result = await validateCoupon(code, plan)
  return NextResponse.json(result)
}
