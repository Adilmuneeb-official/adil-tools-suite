/**
 * Membership & plans — single source of truth.
 */
import { db } from '@/lib/db'

export type Plan = 'free' | 'pro' | 'agency'
export type AccessLevel = 'free' | 'pro' | 'agency'

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    period: 'forever',
    tagline: 'For trying things out',
    dailyTools: 5,
    dailyDownloads: 2,
    monthlyAudits: 1,
    maxSaved: 10,
    premiumTools: false,
    advancedReports: false,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: false,
    features: [
      '5 tools / day',
      '2 downloads / day',
      '1 audit / month',
      '10 saved results',
    ],
  },
  pro: {
    name: 'Pro',
    price: 12.99,
    currency: 'USD',
    period: '/ month',
    tagline: 'For freelancers & solo builders',
    dailyTools: 100,
    dailyDownloads: 25,
    monthlyAudits: 20,
    maxSaved: 200,
    premiumTools: true,
    advancedReports: true,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: false,
    features: [
      '100 tools / day',
      '25 downloads / day',
      '20 audits / month',
      '200 saved results',
      'Premium tools unlocked',
      'Advanced reports',
    ],
  },
  agency: {
    name: 'Agency',
    price: 59.00,
    currency: 'USD',
    period: '/ month',
    tagline: 'For teams & agencies',
    dailyTools: 0, // unlimited
    dailyDownloads: 0,
    monthlyAudits: 0,
    maxSaved: 0,
    premiumTools: true,
    advancedReports: true,
    whiteLabel: true,
    apiAccess: true,
    prioritySupport: true,
    features: [
      'Unlimited tools & downloads',
      'Unlimited audits',
      'Unlimited saved results',
      'White-label exports',
      'API access',
      'Priority support',
    ],
  },
} as const

export function getPlanInfo(plan: string) {
  return (PLANS as any)[plan] || PLANS.free
}

export function planRank(plan: string): number {
  return { free: 0, pro: 1, agency: 2 }[plan as Plan] ?? 0
}

export async function getUserPlan(userId: string): Promise<Plan> {
  if (!userId) return 'free'
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true, role: true } })
  if (!user) return 'free'
  if (user.role === 'admin') return 'agency'
  if (user.planExpiresAt && user.planExpiresAt < new Date() && user.plan !== 'free') {
    // Plan expired → downgrade
    await db.user.update({
      where: { id: userId },
      data: { plan: 'free', planExpiresAt: null, subscriptionId: null },
    })
    await db.userActivity.create({
      data: { userId, action: 'plan_expired', detail: `Plan ${user.plan} expired → downgraded to free` },
    })
    return 'free'
  }
  return (user.plan as Plan) || 'free'
}

export async function canUserAccessTool(
  userId: string | null,
  toolSlug: string,
  accessLevel: AccessLevel
): Promise<{ allowed: boolean; reason: string; usedToday: number; limit: number; upgradeTo?: string }> {
  if (!userId) {
    // Anonymous users: only free tools
    if (accessLevel === 'free') return { allowed: true, reason: '', usedToday: 0, limit: 0 }
    return { allowed: false, reason: 'login_required', usedToday: 0, limit: 0, upgradeTo: accessLevel }
  }
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role === 'admin') return { allowed: true, reason: '', usedToday: 0, limit: 0 }

  const plan = await getUserPlan(userId)
  const info = getPlanInfo(plan)

  // Plan-level access
  if (planRank(plan) < planRank(accessLevel)) {
    return {
      allowed: false,
      reason: 'upgrade_required',
      upgradeTo: accessLevel,
      usedToday: 0,
      limit: info.dailyTools,
    }
  }

  // Daily tool cap
  if (info.dailyTools > 0) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const usedToday = await db.toolUsage.count({
      where: { userId, createdAt: { gte: start, lte: end } },
    })
    if (usedToday >= info.dailyTools) {
      return { allowed: false, reason: 'limit_reached', usedToday, limit: info.dailyTools }
    }
    return { allowed: true, reason: '', usedToday, limit: info.dailyTools }
  }
  return { allowed: true, reason: '', usedToday: 0, limit: 0 }
}

export async function setUserPlan(userId: string, plan: Plan, expiresAt?: Date, subscriptionId?: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      plan,
      planExpiresAt: expiresAt,
      subscriptionId: subscriptionId ?? undefined,
    },
  })
  await db.userActivity.create({
    data: { userId, action: 'plan_change', detail: `Plan set to ${plan}${expiresAt ? ` until ${expiresAt.toISOString()}` : ''}` },
  })
}

export function computeExpiry(cycle: string): Date {
  const now = new Date()
  if (cycle === 'yearly') return new Date(now.getTime() + 365 * 86400 * 1000)
  if (cycle === 'quarterly') return new Date(now.getTime() + 90 * 86400 * 1000)
  return new Date(now.getTime() + 30 * 86400 * 1000)
}

export function planPrice(plan: Plan, cycle: string = 'monthly'): number {
  const base = PLANS[plan].price
  if (cycle === 'quarterly') return Math.round(base * 0.9 * 100) / 100
  if (cycle === 'yearly') return Math.round(base * 0.8 * 100) / 100
  return base
}
