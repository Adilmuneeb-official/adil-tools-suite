import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ items: [] })
  const items = await db.savedResult.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({
    items: items.map(i => ({
      id: i.id,
      toolSlug: i.toolSlug,
      title: i.title,
      preview: (i.preview || '').slice(0, 200),
      createdAt: i.createdAt.toISOString(),
    })),
  })
}
