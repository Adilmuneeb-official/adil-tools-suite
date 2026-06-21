/**
 * Seed script — run with `bun run db:seed`
 * Populates: demo users, coupons, testimonials, blog posts, sample usage
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const adminPass = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@adilmuneeb.site' },
    update: {},
    create: { email: 'admin@adilmuneeb.site', name: 'Adil Muneeb', passwordHash: adminPass, role: 'admin', plan: 'agency' },
  })
  console.log(`  ✓ Admin: ${admin.email} (Admin123!)`)

  const freePass = await bcrypt.hash('Free123!', 12)
  const freeUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Demo User', passwordHash: freePass, plan: 'free' },
  })
  console.log(`  ✓ Free user: ${freeUser.email} (Free123!)`)

  const proPass = await bcrypt.hash('Pro12345!', 12)
  const proUser = await prisma.user.upsert({
    where: { email: 'pro@example.com' },
    update: {},
    create: { email: 'pro@example.com', name: 'Pro User', passwordHash: proPass, plan: 'pro', planExpiresAt: new Date(Date.now() + 30 * 86400 * 1000), subscriptionId: 'sub_demo_pro' },
  })
  console.log(`  ✓ Pro user: ${proUser.email} (Pro12345!)`)

  const coupons = [
    { code: 'WELCOME10', type: 'percentage', value: 10, maxUses: 1000, applicablePlans: 'pro,agency', expiresAt: new Date(Date.now() + 365 * 86400 * 1000) },
    { code: 'AGENCY25', type: 'percentage', value: 25, maxUses: 100, applicablePlans: 'agency', expiresAt: new Date(Date.now() + 365 * 86400 * 1000) },
    { code: 'FLAT5', type: 'fixed', value: 5, maxUses: 500, applicablePlans: 'pro', expiresAt: new Date(Date.now() + 365 * 86400 * 1000) },
    { code: 'SAVE15', type: 'percentage', value: 15, maxUses: 200, applicablePlans: 'pro,agency', expiresAt: new Date(Date.now() + 90 * 86400 * 1000) },
  ]
  for (const c of coupons) await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: c })
  console.log(`  ✓ ${coupons.length} coupons`)

  const testimonials = [
    { name: 'Sara Khan', role: 'SEO Consultant', avatar: 'SK', text: 'The GBP Audit tool alone is worth the Pro plan. It saves me 30 minutes per client.', rating: 5 },
    { name: "James O'Neil", role: 'Frontend Dev', avatar: 'JO', text: "Finally a JSON formatter that doesn't try to sell me a VPN. Clean, fast, dark. Perfection.", rating: 5 },
    { name: 'Ahmed Al-Rashid', role: 'Agency Owner', avatar: 'AR', text: 'The Agency plan with API access lets me wire tool execution into our Slack workflow.', rating: 5 },
    { name: 'Maria Lopez', role: 'Content Writer', avatar: 'ML', text: 'Blog title generator + headline analyzer = my ideation process is 5× faster.', rating: 5 },
    { name: 'David Chen', role: 'Indie Hacker', avatar: 'DC', text: 'I replaced 4 different free-tools sites with this one subscription. Worth every cent.', rating: 5 },
    { name: 'Priya Sharma', role: 'Marketing Lead', avatar: 'PS', text: 'The UTM builder + ROI calculator combo is exactly what my team needed.', rating: 5 },
  ]
  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { name: t.name } })
    if (!existing) await prisma.testimonial.create({ data: t })
  }
  console.log(`  ✓ ${testimonials.length} testimonials`)

  const posts = [
    { title: 'How we built a 500-tool SaaS without bloating the theme', slug: 'how-we-built-500-tool-saas', category: 'Engineering', excerpt: 'A deep dive into the architecture of Adil Tools Suite.', content: 'Full article content here...' },
    { title: 'The ultimate guide to JSON-LD schema in 2025', slug: 'json-ld-schema-guide-2025', category: 'SEO', excerpt: 'Everything you need to know about structured data.', content: 'Full article content here...' },
    { title: 'Why dark mode reduces cognitive load', slug: 'dark-mode-cognitive-load', category: 'Design', excerpt: 'A short read on the science behind dark UIs.', content: 'Full article content here...' },
    { title: 'Stripe webhook signature verification', slug: 'stripe-webhook-signature-verification', category: 'Engineering', excerpt: 'How to properly verify Stripe webhooks.', content: 'Full article content here...' },
    { title: 'Local SEO checklist for 2025', slug: 'local-seo-checklist-2025', category: 'SEO', excerpt: '21 things every local business should verify.', content: 'Full article content here...' },
  ]
  for (const p of posts) {
    const existing = await prisma.post.findUnique({ where: { slug: p.slug } })
    if (!existing) await prisma.post.create({ data: p })
  }
  console.log(`  ✓ ${posts.length} blog posts`)

  // Demo usage for the free user
  const now = new Date()
  for (let i = 0; i < 5; i++) {
    await prisma.toolUsage.create({
      data: {
        userId: freeUser.id,
        toolSlug: ['json-formatter', 'base64-encode', 'password-generator', 'qr-generator', 'bmi-calculator'][i],
        toolCategory: ['developer', 'developer', 'utility', 'utility', 'utility'][i],
        inputData: '{}', outputData: 'demo output', executionTimeMs: 15 + i * 3,
        ip: '127.0.0.1', userAgent: 'Seed script', createdAt: new Date(now.getTime() - i * 3600 * 1000),
      },
    })
  }
  console.log(`  ✓ 5 demo tool-usage records`)

  const actions = [
    { action: 'register', detail: 'Account created' },
    { action: 'login', detail: 'Logged in' },
    { action: 'tool_run', detail: 'json-formatter executed' },
    { action: 'tool_run', detail: 'password-generator executed' },
    { action: 'favorite_added', detail: 'Added qr-generator to favorites' },
  ]
  for (let i = 0; i < actions.length; i++) {
    await prisma.userActivity.create({
      data: { userId: freeUser.id, ...actions[i], ip: '127.0.0.1', userAgent: 'Seed script', createdAt: new Date(now.getTime() - i * 7200 * 1000) },
    })
  }
  console.log(`  ✓ ${actions.length} demo activities`)

  await prisma.favorite.upsert({ where: { userId_toolSlug: { userId: freeUser.id, toolSlug: 'json-formatter' } }, update: {}, create: { userId: freeUser.id, toolSlug: 'json-formatter' } })
  await prisma.favorite.upsert({ where: { userId_toolSlug: { userId: freeUser.id, toolSlug: 'qr-generator' } }, update: {}, create: { userId: freeUser.id, toolSlug: 'qr-generator' } })
  console.log(`  ✓ 2 favorites for demo user`)

  console.log('\n✅ Seeding complete!')
  console.log('\n📋 Demo accounts:')
  console.log('   Admin: admin@adilmuneeb.site / Admin123!')
  console.log('   Free:  demo@example.com     / Free123!')
  console.log('   Pro:   pro@example.com      / Pro12345!')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
