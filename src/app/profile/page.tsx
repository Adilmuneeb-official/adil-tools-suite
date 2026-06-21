'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { UserPen, KeyRound, CreditCard, AlertTriangle } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '' })
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) {
        router.push('/login?redirect_to=/profile')
        return
      }
      setUser(d.user)
      setForm({ name: d.user.name || '', phone: d.user.phone || '', whatsapp: d.user.whatsapp || '' })
    })
  }, [router])

  const updateProfile = async () => {
    const resp = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (resp.ok) toast.success('Profile updated')
    else toast.error('Failed')
  }

  const changePassword = async () => {
    if (pw.new !== pw.confirm) { toast.error('Passwords do not match'); return }
    if (pw.new.length < 8) { toast.error('Password too short'); return }
    const resp = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.new }),
    })
    const data = await resp.json()
    if (resp.ok) { toast.success('Password changed'); setPw({ current: '', new: '', confirm: '' }) }
    else toast.error(data.error || 'Failed')
  }

  const cancelSub = async () => {
    if (!confirm('Cancel subscription? You will keep access until expiry, then drop to Free.')) return
    const resp = await fetch('/api/subscription/cancel', { method: 'POST' })
    if (resp.ok) { toast.success('Subscription cancelled'); router.refresh() }
    else toast.error('Failed')
  }

  const deleteAccount = async () => {
    if (!confirm('Permanently delete your account and all data?')) return
    const resp = await fetch('/api/auth/me', { method: 'DELETE' })
    if (resp.ok) router.push('/?account_deleted=1')
  }

  if (!user) return <div className="container mx-auto px-4 py-12">Loading…</div>

  const planBadge = user.plan === 'agency' ? 'border-lime-400/30 text-lime-300 bg-lime-400/10'
                  : user.plan === 'pro' ? 'border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10'
                  : 'border-cyan-400/30 text-cyan-300 bg-cyan-400/10'

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-cyan-400">Home</Link> / 
        <Link href="/dashboard" className="hover:text-cyan-400">Dashboard</Link> / 
        <span>Profile</span>
      </div>

      <Card className="glass p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-black font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{user.name}</h1>
          <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
          <Badge variant="outline" className={planBadge}>{user.plan.toUpperCase()} plan</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile details */}
        <Card className="glass p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><UserPen className="h-4 w-4 text-cyan-400" /> Profile details</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Display name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-black/30 border-border" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={user.email} disabled className="bg-black/30 border-border" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-black/30 border-border" />
            </div>
            <div>
              <Label className="text-xs">WhatsApp</Label>
              <Input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className="bg-black/30 border-border" />
            </div>
            <Button onClick={updateProfile} className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90">Save</Button>
          </div>
        </Card>

        {/* Password */}
        <Card className="glass p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><KeyRound className="h-4 w-4 text-cyan-400" /> Change password</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Current password</Label>
              <Input type="password" value={pw.current} onChange={e => setPw({...pw, current: e.target.value})} className="bg-black/30 border-border" />
            </div>
            <div>
              <Label className="text-xs">New password</Label>
              <Input type="password" value={pw.new} onChange={e => setPw({...pw, new: e.target.value})} className="bg-black/30 border-border" />
            </div>
            <div>
              <Label className="text-xs">Confirm new password</Label>
              <Input type="password" value={pw.confirm} onChange={e => setPw({...pw, confirm: e.target.value})} className="bg-black/30 border-border" />
            </div>
            <Button onClick={changePassword} className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90">Update password</Button>
          </div>
        </Card>

        {/* Subscription */}
        <Card id="subscription" className="glass p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-cyan-400" /> Subscription</h2>
          <p className="text-sm text-muted-foreground mb-2">Current plan</p>
          <div className="text-2xl font-bold mb-1 capitalize">{user.plan}</div>
          {user.planExpiresAt && <p className="text-xs text-muted-foreground mb-4">Renews on {new Date(user.planExpiresAt).toLocaleDateString()}</p>}
          {user.plan === 'free' ? (
            <Button asChild className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90">
              <Link href="/pricing">Upgrade</Link>
            </Button>
          ) : (
            <Button onClick={cancelSub} variant="outline">Cancel subscription</Button>
          )}
        </Card>

        {/* Danger zone */}
        <Card className="glass p-6 border-red-400/20">
          <h2 className="font-bold mb-4 flex items-center gap-2 text-red-400"><AlertTriangle className="h-4 w-4" /> Danger zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Delete your account and all associated data. This cannot be undone.</p>
          <Button onClick={deleteAccount} variant="outline" className="border-red-400/30 text-red-400 hover:bg-red-400 hover:text-black">Delete account</Button>
        </Card>
      </div>
    </div>
  )
}
