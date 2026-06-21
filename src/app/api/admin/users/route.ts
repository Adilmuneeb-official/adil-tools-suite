import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { computeExpiry, setUserPlan, type Plan } from '@/lib/membership'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return { error: NextResponse.json({ error: 'Login required' }, { status: 401 }) }
  if (user.role !== 'admin') return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  return { user }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const query = req.nextUrl.searchParams.get('q')?.trim()
  const users = await db.user.findMany({
    where: query ? {
      OR: [
        { email: { contains: query } },
        { name: { contains: query } },
      ],
    } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
      _count: { select: { toolUsage: true, savedResults: true, subscriptions: true } },
    },
  })

  return NextResponse.json({
    users: users.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      planExpiresAt: u.planExpiresAt?.toISOString() || null,
    })),
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const body = await req.json()
  const userId = String(body.userId || '')
  const plan = String(body.plan || '') as Plan
  const role = String(body.role || '')

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  if (plan && !['free', 'pro', 'agency'].includes(plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  if (role && !['user', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  if (plan) {
    await setUserPlan(userId, plan, plan === 'free' ? undefined : computeExpiry('monthly'))
  }

  if (role) {
    await db.user.update({ where: { id: userId }, data: { role } })
    await db.userActivity.create({ data: { userId, action: 'role_change', detail: `Role set to ${role}` } })
  }

  return NextResponse.json({ ok: true })
}
