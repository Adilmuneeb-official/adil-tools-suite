'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await resp.json()
      if (resp.ok) {
        toast.success('Welcome back!')
        const redirect = params.get('redirect_to') || '/dashboard'
        router.push(redirect)
        router.refresh()
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  return (
    <Card className="glass p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black font-extrabold text-2xl mb-4">A</div>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to access your tools dashboard.</p>
      </div>
      {params.get('registered') && <div className="glass bg-lime-500/10 border-lime-500/30 text-lime-300 p-3 rounded-lg text-sm mb-4">Account created! Check your email to verify, then log in.</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-black/30 border-border" />
        </div>
        <div>
          <Label htmlFor="password" className="text-xs">Password</Label>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-black/30 border-border" />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90">
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        No account? <Link href="/register" className="text-cyan-400 font-semibold">Create one →</Link>
      </p>
      <p className="text-center text-sm mt-2">
        <Link href="/password-reset" className="text-muted-foreground hover:text-cyan-400">Forgot password?</Link>
      </p>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
