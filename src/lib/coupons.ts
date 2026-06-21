/**
 * Coupons — validate & apply.
 */
import { db } from '@/lib/db'

export interface CouponValidation {
  valid: boolean
  message: string
  code?: string
  type?: string
  value?: number
  id?: string
}

export async function validateCoupon(code: string, plan: string): Promise<CouponValidation> {
  const trimmed = (code || '').trim().toUpperCase()
  if (!trimmed) return { valid: false, message: 'Enter a coupon code' }
  const coupon = await db.coupon.findUnique({ where: { code: trimmed } })
  if (!coupon || !coupon.isActive) {
    return { valid: false, message: 'Coupon not found or inactive' }
  }
  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, message: 'Coupon not yet active' }
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, message: 'Coupon has expired' }
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: 'Coupon usage limit reached' }
  }
  if (coupon.applicablePlans) {
    const plans = coupon.applicablePlans.split(',').map(s => s.trim())
    if (plans.length > 0 && !plans.includes(plan)) {
      return { valid: false, message: `Coupon valid only for: ${plans.join(', ')}` }
    }
  }
  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    id: coupon.id,
    message: 'Coupon applied',
  }
}

export function applyCoupon(amount: number, coupon: CouponValidation): { discount: number; final: number } {
  if (!coupon.valid) return { discount: 0, final: amount }
  let discount = 0
  if (coupon.type === 'percentage') {
    discount = Math.round(amount * (coupon.value! / 100) * 100) / 100
  } else if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value!, amount)
  }
  return { discount, final: Math.max(0, Math.round((amount - discount) * 100) / 100) }
}

export async function incrementCouponUsage(couponId: string) {
  await db.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } },
  })
}
