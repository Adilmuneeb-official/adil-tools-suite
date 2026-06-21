/**
 * Auth helpers — password hashing, JWT, session.
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production'
const COOKIE_NAME = 'adil_session'

export function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, 12)
}

export function verifyPassword(pw: string, hash: string): boolean {
  try { return bcrypt.compareSync(pw, hash) }
  catch { return false }
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId, iat: Date.now() }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded?.sub ? { sub: decoded.sub } : null
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    const payload = verifyToken(token)
    if (!payload) return null
    const user = await db.user.findUnique({ where: { id: payload.sub } })
    return user
  } catch {
    return null
  }
}

export async function setSessionCookie(userId: string) {
  const token = signToken(userId)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export function checkPasswordStrength(pw: string): { score: number; isStrong: boolean; message: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return {
    score,
    isStrong: score >= 4,
    message: score < 4 ? 'Password too weak. Use 8+ chars with upper, lower, numbers, symbols.' : '',
  }
}

export function getClientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return '0.0.0.0'
}
