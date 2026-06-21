'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await resp.json()
      if (resp.ok) {
        toast.success('Account created!')
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="glass p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black font-extrabold text-2xl mb-4">A</div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Start free</h1>
          <p className="text-sm text-muted-foreground">5 tools / day on the Free plan. No credit card required.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs">Full name</Label>
            <Input id="name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-black/30 border-border" />
          </div>
          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-black/30 border-border" />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input id="password" type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="bg-black/30 border-border" />
            <p className="text-xs text-muted-foreground mt-1">8+ characters with upper, lower, numbers, and symbols.</p>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90">
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link href="/login" className="text-cyan-400 font-semibold">Log in →</Link>
        </p>
      </Card>
    </div>
  )
}
