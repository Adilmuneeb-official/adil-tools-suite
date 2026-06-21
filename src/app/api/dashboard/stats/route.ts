import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getUserPlan, getPlanInfo } from '@/lib/membership'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const plan = await getUserPlan(user.id)
  const info = getPlanInfo(plan)
  const start = new Date(); start.setHours(0,0,0,0)
  const end = new Date(); end.setHours(23,59,59,999)
  const today = await db.toolUsage.count({ where: { userId: user.id, createdAt: { gte: start, lte: end } } })
  const savedToday = await db.savedResult.count({ where: { userId: user.id, createdAt: { gte: start, lte: end } } })
  const savedTotal = await db.savedResult.count({ where: { userId: user.id } })
  const favs = await db.favorite.findMany({ where: { userId: user.id }, select: { toolSlug: true } })
  // Weekly chart
  const weekly: number[] = []
  const labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const ds = new Date(); ds.setDate(ds.getDate() - i); ds.setHours(0,0,0,0)
    const de = new Date(); de.setDate(de.getDate() - i); de.setHours(23,59,59,999)
    const count = await db.toolUsage.count({ where: { userId: user.id, createdAt: { gte: ds, lte: de } } })
    weekly.push(count)
    labels.push(ds.toLocaleDateString('en', { weekday: 'short' }))
  }
  const recent = await db.userActivity.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  return NextResponse.json({
    plan,
    planInfo: info,
    planExpiresAt: user.planExpiresAt,
    todayUsage: today,
    dailyLimit: info.dailyTools,
    savedToday,
    savedTotal,
    favCount: favs.length,
    favorites: favs.map(f => f.toolSlug),
    weekly,
    weeklyLabels: labels,
    recent: recent.map(a => ({
      action: a.action,
      detail: a.detail,
      createdAt: a.createdAt.toISOString(),
    })),
  })
}
