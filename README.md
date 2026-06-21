# Adil Tools Suite — Node.js Edition

A complete SaaS tools platform built with Next.js 16, TypeScript, Prisma, and Tailwind CSS 4. Features 48 working tools, dark-themed UI with Three.js 3D background, membership subscriptions (Stripe + PayPal), dashboards, and an architecture designed for 500+ tools.

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** or **Bun** (recommended)
- A hosting plan that supports Node.js

### Steps

```bash
# 1. Extract the zip
unzip adil-tools-suite-nodejs.zip
cd adil-tools-suite

# 2. Install dependencies
bun install   # OR: npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Set up the database (SQLite — no external DB needed)
bun run db:push

# 5. Seed dummy data
bun run db:seed

# 6. Start the dev server
bun run dev

# 7. Open http://localhost:3000
```

## 🔑 Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@adilmuneeb.site | Admin123! |
| Free user | demo@example.com | Free123! |
| Pro user | pro@example.com | Pro12345! |

## 🌐 Production Deployment

### Option A: Vercel (easiest)
1. Push to GitHub
2. Import on vercel.com
3. Set env vars
4. Deploy

### Option B: Hostinger Node.js
1. hPanel → Node.js → Create app
2. Upload zip, extract
3. Run npm install + build
4. Start

### Option C: VPS (Render, Railway, DigitalOcean)
1. Push to GitHub
2. Connect to platform
3. Build: `bun run build`
4. Start: `bun run start`

## 🔧 Environment Variables

Create `.env`:

```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_SECRET="change-this-to-random-32-chars"
NEXTAUTH_URL="https://yourdomain.com"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_WEBHOOK_ID="..."
```

Generate secure secret:
```bash
openssl rand -base64 32
```

## 📋 Webhook URLs

- Stripe: `https://yourdomain.com/api/webhooks/stripe`
- PayPal: `https://yourdomain.com/api/webhooks/paypal`

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server |
| `bun run build` | Build for production |
| `bun run start` | Start production |
| `bun run lint` | ESLint |
| `bun run db:push` | Push DB schema |
| `bun run db:seed` | Seed dummy data |

## ➕ Adding New Tools

Create `src/lib/modules/your-module.ts`:

```typescript
import { registerTool } from '../tools/registry'

registerTool({
  slug: 'my-tool',
  title: 'My Tool',
  category: 'utility',
  description: 'What it does.',
  icon: 'Wrench',
  accessLevel: 'free',
  module: 'your-module',
  fields: [
    { name: 'input', label: 'Input', type: 'textarea', required: true }
  ],
  handler: async (input) => ({ output: input.input.toUpperCase() }),
})
```

Add to `src/lib/modules/index.ts`:
```typescript
import './your-module'
```

Restart. Done — no UI changes needed.

## 📁 Structure

```
src/
├── app/            # Pages + API routes
├── components/     # React components (header, footer, 3D bg, UI)
├── lib/
│   ├── modules/    # 10 tool modules (48 tools)
│   ├── tools/      # Tool registry
│   ├── auth.ts     # JWT + bcrypt
│   ├── membership.ts
│   └── payments.ts
└── hooks/
prisma/
└── schema.prisma   # 12 DB models
```

## 🔒 Security

- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT sessions (httpOnly cookies)
- ✅ Stripe HMAC webhook verification
- ✅ PayPal webhook signature verification
- ✅ Rate limiting + honeypot
- ⚠️ CHANGE NEXTAUTH_SECRET in production!
- ⚠️ Use PostgreSQL for production (not SQLite)

## 📞 Support
Adil Muneeb — adil@adilmuneeb.site — Dubai, UAE
