import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getClientIp } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, subject, message } = body
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    await db.contactMessage.create({
      data: {
        name, email, subject: subject || '', message,
        ip: getClientIp(req),
        userAgent: req.headers.get('user-agent') || '',
      },
    })
    return NextResponse.json({ success: true, message: 'Message sent!' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
