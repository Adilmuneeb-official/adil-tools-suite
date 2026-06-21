import { NextRequest, NextResponse } from 'next/server'
import { capturePaypalOrder } from '@/lib/payments'

// GET: PayPal redirects here after user approval → capture the order
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') // PayPal order ID
  const userId = url.searchParams.get('userId') || ''
  const plan = (url.searchParams.get('plan') || 'pro') as 'pro' | 'agency'
  const cycle = url.searchParams.get('cycle') || 'monthly'
  if (!token) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/pricing?payment=error`)
  const result = await capturePaypalOrder(token, userId, plan, cycle)
  if (result.ok) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?payment=success`)
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/pricing?payment=failed`)
}
