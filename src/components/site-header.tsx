'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Sparkles, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user || null))
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { href: '/#tools', label: 'Tools' },
    { href: '/#features', label: 'Features' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#faq', label: 'FAQ' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-border' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-black font-extrabold">A</span>
          <span>Adil <em className="not-italic text-cyan-400">Tools</em></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Badge variant="outline" className={`gap-1 ${user.plan === 'agency' ? 'border-lime-400/30 text-lime-300' : user.plan === 'pro' ? 'border-fuchsia-500/30 text-fuchsia-300' : 'border-cyan-400/30 text-cyan-300'}`}>
                {user.plan === 'agency' && <Sparkles className="h-3 w-3" />}
                {user.plan.toUpperCase()}
              </Badge>
              <Button asChild size="sm" variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {user.role === 'admin' && (
                <Button asChild size="sm" variant="ghost">
                  <Link href="/admin"><Shield className="h-4 w-4" /> Admin</Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost"><Link href="/login">Login</Link></Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-border">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="py-2 text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <>
                  <Button asChild className="flex-1"><Link href="/dashboard">Dashboard</Link></Button>
                  {user.role === 'admin' && (
                    <Button asChild variant="outline" className="flex-1"><Link href="/admin">Admin</Link></Button>
                  )}
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" className="flex-1"><Link href="/login">Login</Link></Button>
                  <Button asChild className="flex-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black"><Link href="/register">Sign up</Link></Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
