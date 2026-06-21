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
import type { ToolDefinition } from '@/lib/tools/registry'

const MAX_FILE_BYTES = 10 * 1024 * 1024

type ParsedToolRequest = {
  slug: string
  values: Record<string, any>
}

async function parseToolRequest(req: NextRequest): Promise<ParsedToolRequest> {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    const body = await req.json()
    return { slug: String(body.slug || ''), values: body }
  }

  const formData = await req.formData()
  const slug = String(formData.get('slug') || '')
  const values: Record<string, any> = { slug }

  for (const [key, value] of formData.entries()) {
    if (key === 'slug') continue
    if (value instanceof File) {
      const fileInfo = {
        name: value.name,
        type: value.type || 'application/octet-stream',
        size: value.size,
      }
      const current = values[key]
      values[key] = current ? ([] as any[]).concat(current, fileInfo) : fileInfo
    } else {
      values[key] = String(value)
    }
  }

  return { slug, values }
}

function validateAndSanitize(tool: ToolDefinition, values: Record<string, any>): { inputs: Record<string, any>; errors: string[] } {
  const inputs: Record<string, any> = {}
  const errors: string[] = []

  for (const f of tool.fields) {
    const raw = values[f.name]
    const isEmpty = raw === undefined || raw === null || raw === ''

    if (f.required && isEmpty) {
      errors.push(`${f.label} is required.`)
      continue
    }

    if (f.type === 'number') {
      const parsed = raw === undefined || raw === '' ? '' : Number(raw)
      if (parsed !== '' && Number.isNaN(parsed)) errors.push(`${f.label} must be a number.`)
      if (typeof parsed === 'number' && f.min !== undefined && parsed < f.min) errors.push(`${f.label} must be at least ${f.min}.`)
      if (typeof parsed === 'number' && f.max !== undefined && parsed > f.max) errors.push(`${f.label} must be at most ${f.max}.`)
      inputs[f.name] = parsed === '' ? '' : String(parsed)
    } else if (f.type === 'checkbox') {
      inputs[f.name] = raw === true || raw === 'true' || raw === 'on' || raw === 1
    } else if (f.type === 'select') {
      const value = raw !== undefined ? String(raw) : ''
      if (value && f.options?.length && !f.options.some(o => o.value === value)) {
        errors.push(`${f.label} has an invalid option.`)
      }
      inputs[f.name] = value
    } else if (f.type === 'url') {
      const value = raw !== undefined ? String(raw).trim() : ''
      if (value) {
        try { new URL(value) } catch { errors.push(`${f.label} must be a valid URL.`) }
      }
      inputs[f.name] = value
    } else if (f.type === 'email') {
      const value = raw !== undefined ? String(raw).trim() : ''
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`${f.label} must be a valid email.`)
      inputs[f.name] = value
    } else if (f.type === 'file') {
      const files = Array.isArray(raw) ? raw : raw ? [raw] : []
      for (const file of files) {
        if (file.size > MAX_FILE_BYTES) errors.push(`${file.name || f.label} is larger than 10MB.`)
        if (f.accept && file.type && !f.accept.split(',').map(x => x.trim()).includes(file.type)) {
          errors.push(`${file.name || f.label} must match ${f.accept}.`)
        }
      }
      inputs[f.name] = f.multiple ? files : (files[0] || null)
    } else {
      const value = raw !== undefined ? String(raw) : ''
      if (f.minLength !== undefined && value.length < f.minLength) errors.push(`${f.label} must be at least ${f.minLength} characters.`)
      if (f.maxLength !== undefined && value.length > f.maxLength) errors.push(`${f.label} must be at most ${f.maxLength} characters.`)
      inputs[f.name] = value
    }
  }

  return { inputs, errors }
}

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
    const { slug, values } = await parseToolRequest(req)
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

    const { inputs, errors } = validateAndSanitize(tool, values)
    if (errors.length) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 })
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
