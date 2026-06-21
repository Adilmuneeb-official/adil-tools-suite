import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, checkPasswordStrength, setSessionCookie, getClientIp } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { name, email, password } = parsed.data
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }
    const strength = checkPasswordStrength(password)
    if (!strength.isStrong) {
      return NextResponse.json({ error: strength.message }, { status: 400 })
    }
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash: hashPassword(password),
        plan: 'free',
      },
    })
    await db.userActivity.create({
      data: { userId: user.id, action: 'register', detail: 'Account created', ip: getClientIp(req), userAgent: req.headers.get('user-agent') || '' },
    })
    await setSessionCookie(user.id)
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
