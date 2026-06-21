import { NextRequest, NextResponse } from 'next/server'
import { handleStripeWebhook } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature') || ''
  const result = await handleStripeWebhook(payload, signature)
  if (result.received) return NextResponse.json({ received: true })
  return NextResponse.json({ error: result.error }, { status: 400 })
}
