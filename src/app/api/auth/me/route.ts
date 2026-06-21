import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hashPassword, verifyPassword, checkPasswordStrength, clearSessionCookie } from '@/lib/auth'
import { getUserPlan } from '@/lib/membership'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null })
  const plan = await getUserPlan(user.id)
  const start = new Date(); start.setHours(0,0,0,0)
  const end = new Date(); end.setHours(23,59,59,999)
  const today = await db.toolUsage.count({ where: { userId: user.id, createdAt: { gte: start, lte: end } } })
  const savedCount = await db.savedResult.count({ where: { userId: user.id } })
  const favCount = await db.favorite.count({ where: { userId: user.id } })
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      whatsapp: user.whatsapp,
      plan,
      planExpiresAt: user.planExpiresAt,
      role: user.role,
      todayUsage: today,
      savedCount,
      favCount,
    },
  })
}

// PATCH — update profile
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  const body = await req.json()
  const { name, phone, whatsapp } = body
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(whatsapp !== undefined && { whatsapp }),
    },
  })
  await db.userActivity.create({ data: { userId: user.id, action: 'profile_update', detail: 'Profile updated' } })
  return NextResponse.json({ success: true, user: { id: updated.id, email: updated.email, name: updated.name } })
}

// PUT — change password
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  const body = await req.json()
  const { currentPassword, newPassword } = body
  if (!user.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }
  const strength = checkPasswordStrength(newPassword)
  if (!strength.isStrong) {
    return NextResponse.json({ error: strength.message }, { status: 400 })
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword) } })
  await db.userActivity.create({ data: { userId: user.id, action: 'password_change', detail: 'Password changed' } })
  return NextResponse.json({ success: true })
}

// DELETE — delete account
export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  if (user.role === 'admin') return NextResponse.json({ error: 'Admins cannot self-delete' }, { status: 400 })
  await db.user.delete({ where: { id: user.id } })
  await clearSessionCookie()
  return NextResponse.json({ success: true })
}
