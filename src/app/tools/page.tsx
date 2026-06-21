'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Heart, Lock, Copy, Save, Play, Sparkles, UploadCloud, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import * as Icons from 'lucide-react'

interface Tool {
  slug: string
  title: string
  category: string
  description: string
  icon: string
  accessLevel: 'free' | 'pro' | 'agency'
  fields: any[]
  tags?: string[]
}

interface Category {
  slug: string
  name: string
  icon: string
  sortOrder: number
}

function ToolsPortalInner() {
  const params = useSearchParams()
  const initialCat = params.get('cat') || 'all'
  const initialTool = params.get('tool')

  const [tools, setTools] = useState<Tool[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [user, setUser] = useState<any>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [activeCat, setActiveCat] = useState(initialCat)
  const [search, setSearch] = useState('')
  const [activeTool, setActiveTool] = useState<Tool | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ output: string; extra?: any; elapsedMs?: number } | null>(null)
  const [accessDenied, setAccessDenied] = useState<{ reason: string; upgradeTo?: string; usedToday?: number; limit?: number } | null>(null)
  const [formError, setFormError] = useState('')

  // Load tools + categories + user
  useEffect(() => {
    fetch('/api/tools').then(r => r.json()).then(d => {
      setTools(d.tools || [])
    })
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setUser(d.user || null)
    })
    fetch('/api/favorites/toggle').then(r => r.json()).then(d => {
      setFavorites(d.favorites || [])
    })
    // Categories are derived from the unique set in tools
  }, [])

  useEffect(() => {
    if (tools.length) {
      const seen = new Map<string, Category>()
      const catIcons: Record<string, string> = {
        developer: 'Code', seo: 'Search', marketing: 'Megaphone', content: 'PenTool',
        'local-seo': 'MapPin', 'it-tools': 'Server', utility: 'Wrench',
        'pdf-tools': 'FileText', 'google-business': 'Store', 'ai-tools': 'Sparkles',
      }
      const order: Record<string, number> = {
        developer: 10, seo: 20, marketing: 30, content: 40, 'local-seo': 50,
        'it-tools': 60, utility: 70, 'pdf-tools': 80, 'google-business': 90, 'ai-tools': 100,
      }
      const names: Record<string, string> = {
        developer: 'Developer', seo: 'SEO', marketing: 'Marketing', content: 'Content',
        'local-seo': 'Local SEO', 'it-tools': 'IT Tools', utility: 'Utility',
        'pdf-tools': 'PDF Tools', 'google-business': 'Google Business', 'ai-tools': 'AI Tools',
      }
      for (const t of tools) {
        if (!seen.has(t.category)) {
          seen.set(t.category, {
            slug: t.category, name: names[t.category] || t.category,
            icon: catIcons[t.category] || 'Wrench', sortOrder: order[t.category] || 999,
          })
        }
      }
      setCats(Array.from(seen.values()).sort((a, b) => a.sortOrder - b.sortOrder))
    }
  }, [tools])

  // Auto-open tool if ?tool=slug
  useEffect(() => {
    if (initialTool && tools.length) {
      const t = tools.find(x => x.slug === initialTool)
      if (t) {
        setActiveTool(t)
        setResult(null)
        setAccessDenied(null)
        const defaults: Record<string, any> = {}
        for (const f of t.fields) {
          if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue
        }
        setFormValues(defaults)
        setModalOpen(true)
      }
    }
  }, [initialTool, tools])


  const filtered = tools.filter(t => {
    if (activeCat !== 'all' && t.category !== activeCat) return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q) && !t.slug.toLowerCase().includes(q)) return false
    }
    return true
  })

  const openTool = (tool: Tool) => {
    setActiveTool(tool)
    setResult(null)
    setAccessDenied(null)
    setFormValues({})
    // Pre-fill defaults
    const defaults: Record<string, any> = {}
    for (const f of tool.fields) {
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue
    }
    setFormValues(defaults)
    setModalOpen(true)
  }

  const runTool = async () => {
    if (!activeTool) return
    setRunning(true)
    setResult(null)
    setAccessDenied(null)
    setFormError('')
    try {
      const missing = activeTool.fields.find((f: any) => {
        const value = formValues[f.name]
        return f.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))
      })
      if (missing) {
        setFormError(`${missing.label} is required.`)
        setRunning(false)
        return
      }

      const hasFiles = activeTool.fields.some((f: any) => f.type === 'file')
      const requestInit: RequestInit = { method: 'POST' }

      if (hasFiles) {
        const payload = new FormData()
        payload.append('slug', activeTool.slug)
        for (const f of activeTool.fields) {
          const value = formValues[f.name]
          if (f.type === 'file') {
            const files = Array.isArray(value) ? value : value ? [value] : []
            for (const file of files) payload.append(f.name, file)
          } else if (value !== undefined && value !== null) {
            payload.append(f.name, String(value))
          }
        }
        requestInit.body = payload
      } else {
        requestInit.headers = { 'Content-Type': 'application/json' }
        requestInit.body = JSON.stringify({ slug: activeTool.slug, ...formValues })
      }

      const resp = await fetch('/api/tools', requestInit)
      const data = await resp.json()
      if (resp.ok && data.success !== false) {
        setResult({ output: data.output, extra: data.extra, elapsedMs: data.elapsedMs })
      } else {
        if (data.reason === 'login_required') {
          window.location.href = `/login?redirect_to=${encodeURIComponent(window.location.pathname + '?tool=' + activeTool.slug)}`
          return
        }
        if (data.reason === 'upgrade_required' || data.reason === 'limit_reached') {
          setAccessDenied({ reason: data.reason, upgradeTo: data.upgradeTo, usedToday: data.used, limit: data.limit })
        } else {
          setFormError(data.error || 'Failed to run tool.')
          toast.error(data.error || 'Failed')
        }
      }
    } catch {
      setFormError('Network error. Please try again.')
      toast.error('Network error')
    }
    setRunning(false)
  }

  const toggleFav = async (slug: string) => {
    if (!user) { toast.error('Login to favorite tools'); return }
    const resp = await fetch('/api/favorites/toggle', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    const data = await resp.json()
    if (data.isFavorite) {
      setFavorites([...favorites, slug])
    } else {
      setFavorites(favorites.filter(f => f !== slug))
    }
  }

  const copyResult = () => {
    if (result?.output) {
      navigator.clipboard.writeText(result.output).then(() => toast.success('Copied!'))
    }
  }

  const saveResult = async () => {
    if (!result?.output || !activeTool) return
    const resp = await fetch('/api/saved/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: activeTool.slug, title: `${activeTool.title} — ${new Date().toLocaleString()}`, data: result.output }),
    })
    if (resp.ok) toast.success('Saved!')
  }

  const getIcon = (name: string) => {
    const Comp = (Icons as any)[name] || Icons.Wrench
    return <Comp className="h-5 w-5" />
  }

  const planRank = (plan?: string) => ({ free: 0, pro: 1, agency: 2 }[plan as 'free' | 'pro' | 'agency'] ?? 0)

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Tools Portal</h1>
        <p className="text-muted-foreground">{tools.length} tools across {cats.length} categories. Pick one and run it.</p>
      </div>

      {/* Top bar: search + usage */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-black/30 border-border rounded-full"
          />
        </div>
        {user && (
          <div className="flex gap-2">
            <Badge variant="outline" className="border-cyan-400/30 text-cyan-300 bg-cyan-400/10 gap-1.5 px-3 py-1">
              <Sparkles className="h-3 w-3" /> {user.todayUsage} / {user.plan === 'free' ? 5 : user.plan === 'pro' ? 100 : '∞'} today
            </Badge>
            <Badge variant="outline" className="border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10 gap-1.5 px-3 py-1">
              <Heart className="h-3 w-3" /> {favorites.length}
            </Badge>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
        <Button
          variant={activeCat === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCat('all')}
          className={activeCat === 'all' ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black rounded-full' : 'rounded-full'}
        >All</Button>
        {cats.map(c => (
          <Button
            key={c.slug}
            variant={activeCat === c.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCat(c.slug)}
            className={`rounded-full whitespace-nowrap ${activeCat === c.slug ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black' : ''}`}
          >
            {getIcon(c.icon)} {c.name}
            <span className="ml-1 text-xs opacity-70">({tools.filter(t => t.category === c.slug).length})</span>
          </Button>
        ))}
      </div>

      {/* Tools grid */}
      {filtered.length === 0 ? (
        <Card className="glass p-12 text-center">
          <p className="text-muted-foreground">No tools match your search.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(t => {
            const locked = planRank(user?.plan) < planRank(t.accessLevel)
            const isFav = favorites.includes(t.slug)
            return (
              <Card
                key={t.slug}
                className="glass p-5 hover:border-cyan-400 hover:-translate-y-1 transition-all cursor-pointer relative group"
                onClick={() => openTool(t)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/15 to-fuchsia-500/15 flex items-center justify-center text-cyan-400">
                    {getIcon(t.icon)}
                  </div>
                  <div className="flex items-center gap-1">
                    {t.accessLevel === 'pro' && <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10">PRO</Badge>}
                    {t.accessLevel === 'agency' && <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-lime-400/30 text-lime-300 bg-lime-400/10">AGENCY</Badge>}
                    {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    {user && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFav(t.slug) }}
                        className="text-muted-foreground hover:text-fuchsia-400"
                        aria-label="Favorite"
                      >
                        <Heart className={`h-4 w-4 ${isFav ? 'fill-fuchsia-400 text-fuchsia-400' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ fontFamily: 'var(--font-display)' }}>{t.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.category.replace(/-/g, ' ')}</span>
                  <span className="text-[10px] text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Launch →</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Tool modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) { setActiveTool(null); setResult(null); setAccessDenied(null) } }}>
        <DialogContent className="glass max-w-2xl max-h-[90vh] overflow-y-auto">
          {activeTool && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/15 to-fuchsia-500/15 flex items-center justify-center text-cyan-400">
                    {getIcon(activeTool.icon)}
                  </div>
                  <div>
                    <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>{activeTool.title}</DialogTitle>
                    <DialogDescription>{activeTool.description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {accessDenied ? (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 text-fuchsia-400 mx-auto mb-4" />
                  <h4 className="font-bold text-lg mb-2">
                    {accessDenied.reason === 'upgrade_required' ? 'Upgrade required' : 'Daily limit reached'}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    {accessDenied.reason === 'upgrade_required'
                      ? `This tool requires the ${accessDenied.upgradeTo?.toUpperCase()} plan or higher.`
                      : `You used ${accessDenied.usedToday} of ${accessDenied.limit} tools today.`}
                  </p>
                  <Button asChild className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90">
                    <a href="/pricing">Upgrade now</a>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 py-2">
                    {activeTool.fields.map((f: any) => (
                      <div key={f.name}>
                        <Label htmlFor={f.name} className="text-xs mb-1.5 block">
                          {f.label}{f.required && <span className="text-red-400 ml-1">*</span>}
                        </Label>
                        {f.type === 'textarea' ? (
                          <Textarea
                            id={f.name}
                            rows={f.rows || 4}
                            placeholder={f.placeholder}
                            required={f.required}
                            minLength={f.minLength}
                            maxLength={f.maxLength}
                            value={formValues[f.name] || ''}
                            onChange={e => setFormValues({...formValues, [f.name]: e.target.value})}
                            className="bg-black/30 border-border font-mono text-sm"
                          />
                        ) : f.type === 'select' ? (
                          <Select
                            value={String(formValues[f.name] ?? '')}
                            onValueChange={v => setFormValues({...formValues, [f.name]: v})}
                          >
                            <SelectTrigger className="bg-black/30 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent>
                              {f.options?.map((o: any) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : f.type === 'checkbox' ? (
                          <div className="flex items-center gap-2 pt-1">
                            <Checkbox
                              id={f.name}
                              checked={!!formValues[f.name]}
                              onCheckedChange={(v) => setFormValues({...formValues, [f.name]: v})}
                            />
                            <span className="text-sm text-muted-foreground">{f.help || f.desc || 'Enable'}</span>
                          </div>
                        ) : f.type === 'file' ? (
                          <label htmlFor={f.name} className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-cyan-400/30 bg-black/25 px-4 py-5 text-center transition-colors hover:bg-cyan-400/10">
                            <UploadCloud className="mb-2 h-6 w-6 text-cyan-300" />
                            <span className="text-sm font-medium">
                              {Array.isArray(formValues[f.name])
                                ? `${formValues[f.name].length} file(s) selected`
                                : formValues[f.name]?.name || 'Choose file'}
                            </span>
                            <span className="mt-1 text-xs text-muted-foreground">
                              {f.accept || 'Any supported file'}{f.multiple ? ' - multiple allowed' : ''}
                            </span>
                            <Input
                              id={f.name}
                              type="file"
                              accept={f.accept}
                              multiple={!!f.multiple}
                              required={f.required}
                              onChange={e => {
                                const files = Array.from(e.target.files || [])
                                setFormValues({...formValues, [f.name]: f.multiple ? files : files[0]})
                              }}
                              className="sr-only"
                            />
                          </label>
                        ) : (
                          <Input
                            id={f.name}
                            type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : f.type === 'password' ? 'password' : 'text'}
                            placeholder={f.placeholder}
                            required={f.required}
                            min={f.min}
                            max={f.max}
                            step={f.step}
                            minLength={f.minLength}
                            maxLength={f.maxLength}
                            value={formValues[f.name] ?? ''}
                            onChange={e => setFormValues({...formValues, [f.name]: e.target.value})}
                            className="bg-black/30 border-border"
                          />
                        )}
                        {f.help && f.type !== 'checkbox' && (
                          <p className="text-xs text-muted-foreground mt-1">{f.help}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button onClick={runTool} disabled={running} className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90">
                      {running ? <><Sparkles className="h-4 w-4 animate-spin" /> Running…</> : <><Play className="h-4 w-4" /> Run</>}
                    </Button>
                    {result?.elapsedMs && <span className="text-xs text-muted-foreground">{result.elapsedMs}ms</span>}
                  </div>

                  {formError && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {result && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Result</h4>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={copyResult} className="h-7"><Copy className="h-3 w-3" /> Copy</Button>
                          {user && <Button size="sm" variant="ghost" onClick={saveResult} className="h-7"><Save className="h-3 w-3" /> Save</Button>}
                        </div>
                      </div>
                      <pre className="bg-black/40 border border-border rounded-lg p-4 text-xs font-mono text-lime-300 overflow-x-auto whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
                        {result.output}
                      </pre>
                      {result.extra?.qrUrl && (
                        <div className="mt-3 text-center">
                          <img src={result.extra.qrUrl} alt="QR Code" className="mx-auto rounded-lg" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ToolsPortalPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12">Loading tools…</div>}>
      <ToolsPortalInner />
    </Suspense>
  )
}
