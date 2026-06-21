import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const body = await req.json()
  const slug = body.slug
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  const existing = await db.favorite.findUnique({ where: { userId_toolSlug: { userId: user.id, toolSlug: slug } } })
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ isFavorite: false })
  }
  await db.favorite.create({ data: { userId: user.id, toolSlug: slug } })
  return NextResponse.json({ isFavorite: true })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ favorites: [] })
  const favs = await db.favorite.findMany({ where: { userId: user.id }, select: { toolSlug: true } })
  return NextResponse.json({ favorites: favs.map(f => f.toolSlug) })
}
