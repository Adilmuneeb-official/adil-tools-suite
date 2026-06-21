/**
 * GET /api/tools — list all tools
 * GET /api/tools?slug=... — get single tool
 * POST /api/tools/run — execute a tool
 */
import { NextRequest, NextResponse } from 'next/server'
import '@/lib/modules'
import { getAllTools, getTool } from '@/lib/tools/registry'
import { getCurrentUser } from '@/lib/auth'
import { canUserAccessTool } from '@/lib/membership'
import { db } from '@/lib/db'
import { getClientIp } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (slug) {
    const tool = getTool(slug)
    if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    const user = await getCurrentUser()
    const access = await canUserAccessTool(user?.id || null, slug, tool.accessLevel)
    return NextResponse.json({ tool, access })
  }
  const tools = getAllTools().map(t => ({
    slug: t.slug,
    title: t.title,
    category: t.category,
    description: t.description,
    icon: t.icon,
    accessLevel: t.accessLevel,
    fields: t.fields,
    tags: t.tags || [],
  }))
  return NextResponse.json({ count: tools.length, tools })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slug = body.slug
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    const tool = getTool(slug)
    if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })

    const user = await getCurrentUser()
    const access = await canUserAccessTool(user?.id || null, slug, tool.accessLevel)

    if (!access.allowed) {
      let msg = 'Access denied'
      if (access.reason === 'login_required') msg = 'Please log in first'
      else if (access.reason === 'upgrade_required') msg = `Upgrade to ${access.upgradeTo} required`
      else if (access.reason === 'limit_reached') msg = `Daily limit reached (${access.usedToday}/${access.limit})`
      return NextResponse.json({ error: msg, reason: access.reason, used: access.usedToday, limit: access.limit, upgradeTo: access.upgradeTo }, { status: 403 })
    }

    // Sanitize input based on field definitions
    const inputs: Record<string, any> = {}
    for (const f of tool.fields) {
      const raw = body[f.name]
      if (f.type === 'number') inputs[f.name] = raw !== undefined ? String(raw) : ''
      else if (f.type === 'checkbox') inputs[f.name] = raw === true || raw === 'true' || raw === 'on' || raw === 1
      else if (f.type === 'file') inputs[f.name] = raw // for demo, we don't actually handle files
      else inputs[f.name] = raw !== undefined ? String(raw) : ''
    }

    // Execute
    const start = Date.now()
    const result = await tool.handler(inputs)
    const elapsedMs = Date.now() - start

    // Log usage
    if (user) {
      const ip = getClientIp(req)
      const ua = req.headers.get('user-agent') || ''
      // Truncate inputs for logging
      const logInput: Record<string, any> = {}
      for (const f of tool.fields) {
        const v = inputs[f.name]
        if (typeof v === 'string' && v.length > 200) logInput[f.name] = v.slice(0, 200) + '…[truncated]'
        else logInput[f.name] = v
      }
      await db.toolUsage.create({
        data: {
          userId: user.id,
          toolSlug: slug,
          toolCategory: tool.category,
          inputData: JSON.stringify(logInput),
          outputData: (result.output || '').slice(0, 2000),
          executionTimeMs: elapsedMs,
          ip,
          userAgent: ua,
        },
      })
    }

    return NextResponse.json({
      success: true,
      output: result.output,
      extra: result.extra,
      elapsedMs,
      usedToday: user ? access.usedToday + 1 : 0,
      limit: access.limit,
    })
  } catch (e: any) {
    console.error('[tools POST error]', e)
    return NextResponse.json({ error: e.message || 'Tool execution failed' }, { status: 500 })
  }
}
