import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, setSessionCookie, getClientIp } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
    }
    const { email, password } = parsed.data
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    await db.userActivity.create({
      data: { userId: user.id, action: 'login', detail: 'Logged in', ip: getClientIp(req), userAgent: req.headers.get('user-agent') || '' },
    })
    await setSessionCookie(user.id)
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
