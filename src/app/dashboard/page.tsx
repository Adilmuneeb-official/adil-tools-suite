'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Zap, Download, Bookmark, Calendar, Trash2, Copy, LogOut, Rocket, ArrowUpRight, FileText, UserPen } from 'lucide-react'

interface DashboardData {
  plan: string
  planInfo: any
  planExpiresAt: string | null
  todayUsage: number
  dailyLimit: number
  savedToday: number
  savedTotal: number
  favCount: number
  favorites: string[]
  weekly: number[]
  weeklyLabels: string[]
  recent: { action: string; detail: string; createdAt: string }[]
}

interface SavedItem {
  id: string
  toolSlug: string
  title: string
  preview: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [saved, setSaved] = useState<SavedItem[]>([])

  const loadAll = useCallback(async () => {
    const [statsResp, meResp, savedResp] = await Promise.all([
      fetch('/api/dashboard/stats'),
      fetch('/api/auth/me'),
      fetch('/api/saved/list'),
    ])
    if (statsResp.status === 401 || meResp.status === 401) {
      router.push('/login?redirect_to=/dashboard')
      return
    }
    const stats = await statsResp.json()
    const me = await meResp.json()
    const sv = await savedResp.json()
    setData(stats)
    setUser(me.user)
    setSaved(sv.items || [])
  }, [router])

  useEffect(() => { loadAll() }, [loadAll])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const deleteSaved = async (id: string) => {
    await fetch('/api/saved/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSaved(saved.filter(s => s.id !== id))
    toast.success('Deleted')
  }

  const clearAllSaved = async () => {
    if (!confirm('Delete ALL saved results?')) return
    await fetch('/api/saved/clear', { method: 'POST' })
    setSaved([])
    toast.success('Cleared')
  }

  const copySaved = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!'))
  }

  if (!data || !user) {
    return <div className="container mx-auto px-4 py-12">Loading dashboard…</div>
  }

  const planBadge = data.plan === 'agency' ? 'border-lime-400/30 text-lime-300 bg-lime-400/10'
                  : data.plan === 'pro' ? 'border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10'
                  : 'border-cyan-400/30 text-cyan-300 bg-cyan-400/10'

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-cyan-400">Home</Link> / <span>Dashboard</span>
      </div>

      {/* Header */}
      <Card className="glass p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-black font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{user.name || user.email}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={planBadge + ' px-3 py-1'}>{data.plan.toUpperCase()}</Badge>
          <Button asChild variant="ghost" size="sm"><Link href="/profile"><UserPen className="h-4 w-4" /> Profile</Link></Button>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4" /> Logout</Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-400/15 text-cyan-400 flex items-center justify-center"><Zap className="h-5 w-5" /></div>
          <div>
            <div className="text-2xl font-bold">{data.todayUsage} <span className="text-sm text-muted-foreground font-normal">/ {data.dailyLimit > 0 ? data.dailyLimit : '∞'}</span></div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Tools used today</div>
          </div>
        </Card>
        <Card className="glass p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center"><Download className="h-5 w-5" /></div>
          <div>
            <div className="text-2xl font-bold">{data.savedToday}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Downloads today</div>
          </div>
        </Card>
        <Card className="glass p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-lime-400/15 text-lime-400 flex items-center justify-center"><Bookmark className="h-5 w-5" /></div>
          <div>
            <div className="text-2xl font-bold">{data.savedTotal}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Saved results</div>
          </div>
        </Card>
        <Card className="glass p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/15 text-yellow-400 flex items-center justify-center"><Calendar className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-bold">{data.planExpiresAt ? new Date(data.planExpiresAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Plan expires</div>
          </div>
        </Card>
      </div>

      {/* Chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="glass p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Weekly usage</h2>
            <Badge variant="outline" className="text-[10px] border-cyan-400/30 text-cyan-300">Tools executed</Badge>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {data.weekly.map((v, i) => {
              const max = Math.max(...data.weekly, 1)
              const height = (v / max) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs text-muted-foreground">{v}</div>
                  <div className="w-full bg-cyan-400/10 rounded-t-md" style={{ height: `${height}%`, minHeight: v > 0 ? '8px' : '2px', background: v > 0 ? 'linear-gradient(to top, #22d3ee, #e83bff)' : 'rgba(255,255,255,0.05)' }} />
                  <div className="text-xs text-muted-foreground">{data.weeklyLabels[i]}</div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="glass p-6">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Quick actions</h2>
          <div className="space-y-2">
            <Link href="/tools" className="flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-400/10 transition-colors text-sm">
              <Rocket className="h-4 w-4 text-cyan-400" /> Browse Tools
            </Link>
            <Link href="/pricing" className="flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-400/10 transition-colors text-sm">
              <ArrowUpRight className="h-4 w-4 text-cyan-400" /> Upgrade Plan
            </Link>
            <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-400/10 transition-colors text-sm">
              <UserPen className="h-4 w-4 text-cyan-400" /> Edit Profile
            </Link>
            <Link href="/profile#subscription" className="flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-400/10 transition-colors text-sm">
              <FileText className="h-4 w-4 text-cyan-400" /> Subscription
            </Link>
          </div>
        </Card>
      </div>

      {/* Activity + Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="glass p-6">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Recent activity</h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No activity yet. Try a tool!</p>
          ) : (
            <ul className="space-y-3">
              {data.recent.map((a, i) => (
                <li key={i} className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-lg bg-lime-400/15 text-lime-400 flex items-center justify-center text-xs">✓</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium capitalize">{a.action.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.detail}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="glass p-6">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Favorite tools</h2>
          {data.favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No favorites yet. Tap the heart on any tool.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {data.favorites.map(slug => (
                <Link key={slug} href={`/tools?tool=${slug}`} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-cyan-400/10 transition-colors text-center">
                  <span className="text-xs font-medium capitalize">{slug.replace(/-/g, ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Saved results */}
      <Card className="glass p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Saved results</h2>
          {saved.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllSaved}><Trash2 className="h-3 w-3" /> Clear all</Button>
          )}
        </div>
        {saved.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No saved results yet. Run a tool and hit "Save".</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {saved.map(s => (
              <div key={s.id} className="p-4 border border-border rounded-lg bg-white/2">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium truncate flex-1">{s.title}</span>
                  <div className="flex gap-1">
                    <button onClick={() => copySaved(s.preview)} className="text-muted-foreground hover:text-cyan-400 p-1" aria-label="Copy"><Copy className="h-3 w-3" /></button>
                    <button onClick={() => deleteSaved(s.id)} className="text-muted-foreground hover:text-red-400 p-1" aria-label="Delete"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap line-clamp-3 mb-2">{s.preview}</pre>
                <div className="text-[10px] text-muted-foreground">{s.toolSlug} • {new Date(s.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
