import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const body = await req.json()
  const { slug, title, data } = body
  if (!slug || !data) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const saved = await db.savedResult.create({
    data: {
      userId: user.id,
      toolSlug: slug,
      title: title || `Result ${new Date().toLocaleString()}`,
      preview: (data || '').slice(0, 500),
      data,
    },
  })
  return NextResponse.json({ success: true, id: saved.id })
}
