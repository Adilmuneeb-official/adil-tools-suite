'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Rocket, Zap, Code, Search, Megaphone, FileText, Server, MapPin, PenTool, Sparkles, CheckCircle2, Star } from 'lucide-react'
import { toast } from 'sonner'

const iconMap: Record<string, any> = { Code, Search, Megaphone, FileText, Server, MapPin, PenTool, Sparkles }

const services = [
  { icon: 'Code', title: 'Developer Tools', desc: 'JSON formatter, Base64, Regex tester, CSS/JS/HTML minifiers — everyday utilities.', cat: 'developer' },
  { icon: 'Search', title: 'SEO Tools', desc: 'Meta tags, JSON-LD schema, robots.txt, XML sitemap, SERP preview, keyword density.', cat: 'seo' },
  { icon: 'Megaphone', title: 'Marketing Tools', desc: 'UTM builder, ROI / CTR / CPC / conversion / budget calculators.', cat: 'marketing' },
  { icon: 'FileText', title: 'PDF Tools', desc: 'Merge, split, compress, convert, watermark — 5 pro tools.', cat: 'pdf-tools' },
  { icon: 'Server', title: 'IT Tools', desc: 'DNS lookup, WHOIS, IP geolocation, port checker, header inspector.', cat: 'it-tools' },
  { icon: 'MapPin', title: 'Local SEO', desc: 'Google Business Profile audit, citation & NAP checker, schema generator.', cat: 'local-seo' },
  { icon: 'PenTool', title: 'Content Tools', desc: 'Blog title generator, FAQ generator, headline analyzer, readability.', cat: 'content' },
  { icon: 'Sparkles', title: 'AI Tools', desc: 'AI meta-description, blog outline, image alt text (coming soon).', cat: 'ai-tools' },
]

const pricingPlans = [
  { name: 'Free', price: 0, period: 'forever', tagline: 'For trying things out', features: ['5 tools / day', '2 downloads / day', '1 audit / month', '10 saved results'], cta: 'Start Free', featured: false },
  { name: 'Pro', price: 12.99, period: '/ month', tagline: 'For freelancers & solo builders', features: ['100 tools / day', '25 downloads / day', '20 audits / month', '200 saved results', 'Premium tools unlocked', 'Advanced reports'], cta: 'Upgrade', featured: true },
  { name: 'Agency', price: 59, period: '/ month', tagline: 'For teams & agencies', features: ['Unlimited tools & downloads', 'Unlimited audits', 'Unlimited saved results', 'White-label exports', 'API access', 'Priority support'], cta: 'Go Agency', featured: false },
]

const faqs = [
  { q: 'Can I use the free tools without signing up?', a: 'Yes — most free tools work without an account, but with a daily cap. Creating a free account lifts the cap to 5 tools per day and lets you save results.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards through Stripe, and PayPal. Currency conversion happens automatically.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancellation is instant from your dashboard. You keep access until the end of your billing period, then drop back to the Free plan.' },
  { q: 'Do you offer refunds?', a: 'We offer a 14-day money-back guarantee on first subscriptions. No questions asked.' },
  { q: 'Is there an API?', a: 'Yes — API access is included on the Agency plan. Authenticate with an API key and call any tool endpoint programmatically.' },
  { q: 'Do you store my tool inputs?', a: 'Only when you explicitly hit "Save result". Otherwise inputs are processed in memory and discarded. We never share data with third parties.' },
]

const testimonials = [
  { name: 'Sara Khan', role: 'SEO Consultant', avatar: 'SK', text: 'The GBP Audit tool alone is worth the Pro plan. It saves me 30 minutes per client.' },
  { name: 'James O\'Neil', role: 'Frontend Dev', avatar: 'JO', text: 'Finally a JSON formatter that doesn\'t try to sell me a VPN. Clean, fast, dark. Perfection.' },
  { name: 'Ahmed Al-Rashid', role: 'Agency Owner', avatar: 'AR', text: 'The Agency plan with API access lets me wire tool execution into our Slack workflow. Game-changer.' },
  { name: 'Maria Lopez', role: 'Content Writer', avatar: 'ML', text: 'Blog title generator + headline analyzer = my ideation process is 5× faster.' },
  { name: 'David Chen', role: 'Indie Hacker', avatar: 'DC', text: 'I replaced 4 different free-tools sites with this one subscription. Worth every cent.' },
  { name: 'Priya Sharma', role: 'Marketing Lead', avatar: 'PS', text: 'The UTM builder + ROI calculator combo is exactly what my team needed. No more spreadsheet hacks.' },
]

export default function Home() {
  const [toolCount, setToolCount] = useState(44)
  const [contactStatus, setContactStatus] = useState<string>('')

  useEffect(() => {
    fetch('/api/tools').then(r => r.json()).then(d => { if (d.count) setToolCount(d.count) }).catch(() => {})
  }, [])

  const sendContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setContactStatus('sending')
    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'), email: fd.get('email'),
          subject: fd.get('subject'), message: fd.get('message'),
        }),
      })
      const data = await resp.json()
      if (resp.ok) {
        toast.success('Message sent!')
        ;(e.target as HTMLFormElement).reset()
      } else {
        toast.error(data.error || 'Failed to send')
      }
    } catch {
      toast.error('Network error')
    }
    setContactStatus('')
  }

  return (
    <div>
      {/* HERO */}
      <section className="relative py-24 sm:py-32 px-4 text-center">
        <div className="container mx-auto max-w-5xl">
          <Badge variant="outline" className="mb-6 gap-2 border-cyan-400/30 text-cyan-300 bg-cyan-400/10">
            <Zap className="h-3.5 w-3.5" /> {toolCount}+ premium online tools — one subscription
          </Badge>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            The Ultimate <span className="text-gradient">Tools Suite</span><br />for Modern Builders
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Developer tools, SEO tools, marketing tools, PDF tools, IT utilities, local-SEO audits and AI-powered content tools — all in one dark-themed, lightning-fast workspace. No ads. No fluff. Just tools that work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90 text-base px-8 h-12">
              <Link href="/tools"><Rocket className="h-5 w-5" /> Explore Tools</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 h-12 border-border-light">
              <Link href="/register">Start Free</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { num: `${toolCount}+`, label: 'Online Tools' },
              { num: '10', label: 'Categories' },
              { num: '25ms', label: 'Avg Response' },
              { num: '99.9%', label: 'Uptime' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-bold text-cyan-400" style={{ fontFamily: 'var(--font-display)' }}>{s.num}</div>
                <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES / SERVICES */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10">What we offer</Badge>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Everything you need, in one suite</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">From quick utilities to deep SEO audits — pick a tool, run it, save the result. No sign-up required to try the free tier.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map(s => {
              const Icon = iconMap[s.icon] || Code
              return (
                <Card key={s.title} className="glass p-6 hover:border-cyan-400 hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 flex items-center justify-center text-cyan-400 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-display)' }}>{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{s.desc}</p>
                  <Link href={`/tools?cat=${s.cat}`} className="text-xs font-semibold text-cyan-400 hover:text-fuchsia-400">Browse →</Link>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10">Pricing</Badge>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Simple plans. No surprises.</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you need more. Cancel anytime — no lock-in.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map(p => (
              <Card key={p.name} className={`glass p-8 relative ${p.featured ? 'border-cyan-400 scale-105 shadow-[0_0_40px_rgba(34,211,238,0.18)]' : ''}`}>
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">Most Popular</div>
                )}
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{p.name}</h3>
                <p className="text-xs text-muted-foreground mb-6">{p.tagline}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>${p.price}</span>
                  <span className="text-muted-foreground text-sm ml-2">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-lime-400 mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className={`w-full ${p.featured ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90' : ''}`} variant={p.featured ? 'default' : 'outline'}>
                  <Link href="/register">{p.cta}</Link>
                </Button>
              </Card>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">
            <Sparkles className="inline h-3 w-3 text-cyan-400 mr-1" />
            All plans billed in USD. We accept Stripe and PayPal. 14-day money-back guarantee.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10">Loved by users</Badge>
            <h2 className="text-3xl sm:text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>What builders say</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <Card key={t.name} className="glass p-6">
                <div className="flex gap-1 mb-3 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm text-foreground italic mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-black font-bold text-sm">{t.avatar}</div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10">FAQ</Badge>
            <h2 className="text-3xl sm:text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Questions, answered</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="glass px-6">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <Card className="glass p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge variant="outline" className="mb-4 border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10">Get in touch</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Have a tool request?</h2>
              <p className="text-muted-foreground mb-6">Tell us what tool you wish existed. We ship new tools every week based on user requests.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">📧 adil@adilmuneeb.site</li>
                <li className="flex items-center gap-2">💬 +971 50 000 0000</li>
                <li className="flex items-center gap-2">📍 Dubai, UAE</li>
              </ul>
            </div>
            <form onSubmit={sendContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-xs">Name</Label>
                  <Input id="name" name="name" required className="bg-black/30 border-border" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input id="email" name="email" type="email" required className="bg-black/30 border-border" />
                </div>
              </div>
              <div>
                <Label htmlFor="subject" className="text-xs">Subject</Label>
                <Input id="subject" name="subject" className="bg-black/30 border-border" />
              </div>
              <div>
                <Label htmlFor="message" className="text-xs">Message</Label>
                <Textarea id="message" name="message" rows={5} required className="bg-black/30 border-border" />
              </div>
              <Button type="submit" disabled={contactStatus === 'sending'} className="w-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90">
                {contactStatus === 'sending' ? 'Sending…' : 'Send Message'}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  )
}
