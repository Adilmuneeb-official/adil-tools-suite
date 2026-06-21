'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Activity, BarChart3, CreditCard, Search, Settings, Shield, Users, Wrench } from 'lucide-react'

type Overview = {
  metrics: Record<string, number>
  topTools: { slug: string; runs: number }[]
  recentUsage: { id: string; toolSlug: string; toolCategory: string; executionTimeMs: number; createdAt: string; user: string }[]
  coupons: { id: string; code: string; type: string; value: number; usedCount: number; maxUses: number; isActive: boolean }[]
  messages: { id: string; name: string; email: string; subject: string; status: string; createdAt: string }[]
}

type AdminUser = {
  id: string
  email: string
  name: string | null
  role: string
  plan: string
  planExpiresAt: string | null
  createdAt: string
  _count: { toolUsage: number; savedResults: number; subscriptions: number }
}

export default function AdminPage() {
  const router = useRouter()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const loadAdmin = useCallback(async () => {
    setLoading(true)
    const [overviewResp, usersResp] = await Promise.all([
      fetch('/api/admin/overview'),
      fetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`),
    ])

    if (overviewResp.status === 401 || usersResp.status === 401) {
      router.push('/login?redirect_to=/admin')
      return
    }
    if (overviewResp.status === 403 || usersResp.status === 403) {
      toast.error('Admin access required')
      router.push('/dashboard')
      return
    }

    setOverview(await overviewResp.json())
    const userData = await usersResp.json()
    setUsers(userData.users || [])
    setLoading(false)
  }, [query, router])

  useEffect(() => { loadAdmin() }, [loadAdmin])

  const updateUser = async (userId: string, patch: { plan?: string; role?: string }) => {
    const resp = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...patch }),
    })
    if (!resp.ok) {
      const data = await resp.json()
      toast.error(data.error || 'Update failed')
      return
    }
    toast.success('User updated')
    loadAdmin()
  }

  if (loading || !overview) {
    return <div className="container mx-auto max-w-7xl px-4 py-12">Loading admin panel...</div>
  }

  const metrics = [
    ['Users', overview.metrics.users, Users],
    ['Runs today', overview.metrics.runsToday, Activity],
    ['Total runs', overview.metrics.toolRuns, Wrench],
    ['Revenue', `$${overview.metrics.revenue.toFixed(2)}`, CreditCard],
    ['Pro users', overview.metrics.proUsers, Shield],
    ['Agency users', overview.metrics.agencyUsers, Shield],
    ['Saved results', overview.metrics.savedResults, BarChart3],
    ['Subscriptions', overview.metrics.activeSubscriptions, Settings],
  ] as const

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-cyan-400">Home</Link> / <span>Admin</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users, subscriptions, tool usage, coupons, and platform signals.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black">
          <Link href="/tools">Open tools</Link>
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <Card key={label} className="glass p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="glass p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>User + subscription management</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users" className="bg-black/30 pl-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 text-left">User</th>
                  <th className="py-3 text-left">Plan</th>
                  <th className="py-3 text-left">Role</th>
                  <th className="py-3 text-left">Usage</th>
                  <th className="py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-border/70">
                    <td className="py-3">
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="py-3">
                      <Select value={user.plan} onValueChange={plan => updateUser(user.id, { plan })}>
                        <SelectTrigger className="h-8 w-28 bg-black/30"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3">
                      <Select value={user.role} onValueChange={role => updateUser(user.id, { role })}>
                        <SelectTrigger className="h-8 w-28 bg-black/30"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {user._count.toolUsage} runs / {user._count.savedResults} saved
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="glass p-6">
          <h2 className="mb-4 font-bold" style={{ fontFamily: 'var(--font-display)' }}>Top tools</h2>
          <div className="space-y-3">
            {overview.topTools.length === 0 ? <p className="text-sm text-muted-foreground">No usage yet.</p> : overview.topTools.map(tool => (
              <div key={tool.slug} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-3">
                <span className="text-sm capitalize">{tool.slug.replace(/-/g, ' ')}</span>
                <Badge variant="outline" className="border-cyan-400/30 text-cyan-300">{tool.runs}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="glass p-6">
          <h2 className="mb-4 font-bold" style={{ fontFamily: 'var(--font-display)' }}>Recent usage</h2>
          <div className="space-y-3">
            {overview.recentUsage.map(item => (
              <div key={item.id} className="rounded-lg bg-white/5 p-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="capitalize">{item.toolSlug.replace(/-/g, ' ')}</span>
                  <span className="text-cyan-300">{item.executionTimeMs}ms</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{item.user} - {new Date(item.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-6">
          <h2 className="mb-4 font-bold" style={{ fontFamily: 'var(--font-display)' }}>Coupons</h2>
          <div className="space-y-3">
            {overview.coupons.length === 0 ? <p className="text-sm text-muted-foreground">No coupons configured.</p> : overview.coupons.map(coupon => (
              <div key={coupon.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <div>
                  <div className="font-mono text-sm">{coupon.code}</div>
                  <div className="text-xs text-muted-foreground">{coupon.value}{coupon.type === 'percentage' ? '%' : ' USD'} off</div>
                </div>
                <Badge variant="outline" className={coupon.isActive ? 'border-lime-400/30 text-lime-300' : 'border-red-400/30 text-red-300'}>
                  {coupon.usedCount}/{coupon.maxUses || '∞'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-6">
          <h2 className="mb-4 font-bold" style={{ fontFamily: 'var(--font-display)' }}>Messages</h2>
          <div className="space-y-3">
            {overview.messages.length === 0 ? <p className="text-sm text-muted-foreground">No contact messages.</p> : overview.messages.map(message => (
              <div key={message.id} className="rounded-lg bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{message.subject || message.name}</span>
                  <Badge variant="outline">{message.status}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{message.email} - {new Date(message.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
