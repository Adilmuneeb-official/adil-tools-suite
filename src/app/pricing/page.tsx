'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, CreditCard, Tag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const PLANS = [
  { id: 'free', name: 'Free', price: 0, period: 'forever', tagline: 'For trying things out', features: ['5 tools / day', '2 downloads / day', '1 audit / month', '10 saved results'], featured: false },
  { id: 'pro', name: 'Pro', price: 12.99, period: '/ month', tagline: 'For freelancers & solo builders', features: ['100 tools / day', '25 downloads / day', '20 audits / month', '200 saved results', 'Premium tools unlocked', 'Advanced reports'], featured: true },
  { id: 'agency', name: 'Agency', price: 59, period: '/ month', tagline: 'For teams & agencies', features: ['Unlimited tools & downloads', 'Unlimited audits', 'Unlimited saved results', 'White-label exports', 'API access', 'Priority support'], featured: false },
] as const

const CYCLES = [
  { id: 'monthly', label: 'Monthly', discount: 0 },
  { id: 'quarterly', label: 'Quarterly', discount: 10 },
  { id: 'yearly', label: 'Yearly', discount: 20 },
] as const

export default function PricingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cycle, setCycle] = useState<typeof CYCLES[number]['id']>('monthly')
  const [gateway, setGateway] = useState<'stripe' | 'paypal'>('stripe')
  const [coupon, setCoupon] = useState('')
  const [couponResult, setCouponResult] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user || null))
  }, [])

  const finalPrice = (plan: typeof PLANS[number], cycleId: typeof CYCLES[number]['id']) => {
    const c = CYCLES.find(c => c.id === cycleId)!
    const discounted = plan.price * (1 - c.discount / 100)
    return Math.round(discounted * 100) / 100
  }

  const validateCoupon = async (plan: string) => {
    if (!coupon) return
    try {
      const resp = await fetch('/api/coupons/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon, plan }),
      })
      const data = await resp.json()
      setCouponResult(data)
      if (data.valid) toast.success(`Coupon applied: ${data.message}`)
      else toast.error(data.message)
    } catch {
      toast.error('Validation failed')
    }
  }

  const subscribe = async (planId: 'pro' | 'agency') => {
    if (!user) {
      router.push(`/login?redirect_to=/pricing`)
      return
    }
    setLoading(`${planId}-${gateway}`)
    try {
      const endpoint = gateway === 'stripe' ? '/api/stripe/checkout' : '/api/paypal/order'
      const resp = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, cycle, coupon: couponResult?.valid ? coupon : undefined }),
      })
      const data = await resp.json()
      if (resp.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to start checkout')
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(null)
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-4 border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10">Pricing</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Simple plans. No surprises.</h1>
        <p className="text-muted-foreground text-lg">Start free. Upgrade when you need more. Cancel anytime — no lock-in.</p>
      </div>

      {/* Billing cycle */}
      <div className="flex justify-center mb-8">
        <div className="glass rounded-full p-1 flex gap-1">
          {CYCLES.map(c => (
            <button
              key={c.id}
              onClick={() => setCycle(c.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${cycle === c.id ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {c.label}{c.discount > 0 && <span className="ml-1 text-xs">(-{c.discount}%)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map(p => {
          const price = p.id === 'free' ? 0 : finalPrice(p, cycle)
          return (
            <Card key={p.id} className={`glass p-8 relative ${p.featured ? 'border-cyan-400 scale-105 shadow-[0_0_40px_rgba(34,211,238,0.18)]' : ''}`}>
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">Most Popular</div>
              )}
              <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-6">{p.tagline}</p>
              <div className="mb-6">
                <span className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>${price}</span>
                <span className="text-muted-foreground text-sm ml-2">{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-lime-400 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {p.id === 'free' ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/register">Start Free</Link>
                </Button>
              ) : user?.plan === p.id ? (
                <Button disabled className="w-full">Current plan</Button>
              ) : (
                <Button
                  onClick={() => subscribe(p.id as 'pro' | 'agency')}
                  disabled={loading === `${p.id}-${gateway}`}
                  className={`w-full ${p.featured ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90' : ''}`}
                  variant={p.featured ? 'default' : 'outline'}
                >
                  {loading === `${p.id}-${gateway}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {loading === `${p.id}-${gateway}` ? 'Redirecting…' : `Upgrade to ${p.name}`}
                </Button>
              )}
            </Card>
          )
        })}
      </div>

      {/* Coupon + gateway (only for paid plans) */}
      {user && user.plan === 'free' && (
        <Card className="glass p-6 mt-10 max-w-xl mx-auto">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-cyan-400" /> Have a coupon?</h3>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="e.g. WELCOME10"
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
              className="bg-black/30 border-border"
            />
            <Button onClick={() => validateCoupon('pro')} variant="outline">Apply</Button>
          </div>
          {couponResult?.valid && (
            <div className="text-sm text-lime-300 mb-4">
              ✓ {couponResult.message} — {couponResult.value}{couponResult.type === 'percentage' ? '%' : ' USD'} off
            </div>
          )}
          <div>
            <Label className="text-xs mb-2 block">Payment method</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setGateway('stripe')}
                className={`flex-1 p-3 rounded-lg border text-sm ${gateway === 'stripe' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' : 'border-border text-muted-foreground'}`}
              >💳 Stripe</button>
              <button
                onClick={() => setGateway('paypal')}
                className={`flex-1 p-3 rounded-lg border text-sm ${gateway === 'paypal' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' : 'border-border text-muted-foreground'}`}
              >🅿️ PayPal</button>
            </div>
          </div>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground mt-10">
        <CheckCircle2 className="inline h-3 w-3 text-cyan-400 mr-1" />
        All plans billed in USD. 14-day money-back guarantee. Cancel anytime.
      </p>
    </div>
  )
}
