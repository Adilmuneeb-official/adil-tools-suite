import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return { error: NextResponse.json({ error: 'Login required' }, { status: 401 }) }
  if (user.role !== 'admin') return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  return { user }
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    users,
    proUsers,
    agencyUsers,
    toolRuns,
    runsToday,
    savedResults,
    activeSubscriptions,
    transactions,
    coupons,
    recentUsage,
    recentMessages,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: 'pro' } }),
    db.user.count({ where: { plan: 'agency' } }),
    db.toolUsage.count(),
    db.toolUsage.count({ where: { createdAt: { gte: today } } }),
    db.savedResult.count(),
    db.subscription.count({ where: { status: 'active' } }),
    db.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    db.coupon.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    db.toolUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { user: { select: { email: true, name: true } } },
    }),
    db.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
  ])

  const topToolsRaw = await db.toolUsage.groupBy({
    by: ['toolSlug'],
    _count: { toolSlug: true },
    orderBy: { _count: { toolSlug: 'desc' } },
    take: 10,
  })

  const revenue = transactions
    .filter(t => ['paid', 'succeeded', 'completed'].includes(t.status))
    .reduce((sum, t) => sum + t.amount, 0)

  return NextResponse.json({
    metrics: {
      users,
      proUsers,
      agencyUsers,
      freeUsers: Math.max(0, users - proUsers - agencyUsers),
      toolRuns,
      runsToday,
      savedResults,
      activeSubscriptions,
      revenue,
    },
    topTools: topToolsRaw.map(t => ({ slug: t.toolSlug, runs: t._count.toolSlug })),
    recentUsage: recentUsage.map(u => ({
      id: u.id,
      toolSlug: u.toolSlug,
      toolCategory: u.toolCategory,
      executionTimeMs: u.executionTimeMs,
      createdAt: u.createdAt.toISOString(),
      user: u.user.name || u.user.email,
    })),
    coupons: coupons.map(c => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      usedCount: c.usedCount,
      maxUses: c.maxUses,
      isActive: c.isActive,
    })),
    messages: recentMessages.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      subject: m.subject,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
    })),
  })
}
