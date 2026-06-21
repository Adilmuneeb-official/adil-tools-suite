# Deployment Guide — Adil Tools Suite (Node.js)

This guide walks you through deploying the Node.js version of Adil Tools Suite to popular hosting providers.

---

## 1. Vercel (Easiest — Recommended)

Vercel is the company behind Next.js, so deployment is fully automated.

### Steps
1. Create a GitHub repo and push the project files to it
2. Go to [vercel.com](https://vercel.com) → Sign up / Log in with GitHub
3. Click **Add New Project** → Import your repo
4. Vercel auto-detects Next.js — keep defaults
5. In **Environment Variables**, add:
   - `DATABASE_URL` — use Vercel Postgres connection string (or keep SQLite for small sites)
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel domain (e.g. `https://your-app.vercel.app`)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`
6. Click **Deploy**
7. After first deploy, run the seed once via Vercel CLI:
   ```bash
   npm i -g vercel
   vercel login
   vercel link  # link to your project
   vercel env pull .env.local
   npx prisma db push
   npx tsx scripts/seed.ts
   ```

### Switching to Vercel Postgres (recommended for production)
1. In Vercel dashboard → Storage → Create Postgres database
2. Copy the connection string
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Set `DATABASE_URL` env var to the Postgres connection string
5. Run `npx prisma db push` and `npx tsx scripts/seed.ts`

---

## 2. Hostinger Node.js Hosting

Hostinger's Business+ plans and Cloud hosting support Node.js apps.

### Steps
1. Log in to hPanel → Websites → your site
2. In the sidebar, find **Advanced** → **Node.js** (if not visible, your plan doesn't support it — upgrade to Business or Cloud)
3. Click **Create Node.js App**
4. Configure:
   - **App Name**: `adil-tools-suite`
   - **Node.js version**: 18.x or 20.x
   - **App root**: `adil-tools-suite`
   - **App URL**: your domain or subdomain
   - **Startup file**: leave blank (we'll use package.json scripts)
5. Click **Create**
6. In File Manager, navigate to `domains/yourdomain/app/adil-tools-suite/`
7. Upload `adil-tools-suite-nodejs.zip` here and extract
8. Back in hPanel Node.js panel:
   - Set **Run script** to `install` (this runs `npm install`)
   - Click **Run script** → wait for it to finish
   - Then set **Run script** to `build` → click **Run script**
   - Set environment variables in the **Environment variables** section
9. Click **Start App**
10. Visit your domain — should be live!

### Common Hostinger issues
- **App crashes on start** → Check logs in hPanel → Node.js → Logs
- **Database errors** → Make sure `db/` folder is writable
- **Port issues** → Hostinger manages the port; don't set PORT in .env

---

## 3. Render.com

Free tier available; great for testing.

### Steps
1. Push to GitHub
2. Go to render.com → New → Web Service
3. Connect your repo
4. Configure:
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start`
   - **Environment Variables**: add all from `.env.example`
5. Click **Create Web Service**
6. For database: add a PostgreSQL instance in Render, copy connection string to `DATABASE_URL`

---

## 4. Railway.app

Similar to Render.

### Steps
1. Push to GitHub
2. Go to railway.app → New Project → Deploy from GitHub repo
3. Add PostgreSQL database (Railway creates one for you)
4. Copy `DATABASE_URL` from the PostgreSQL service variables
5. Set all env vars in your web service
6. Configure:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma db push && npm run start`  (auto-migrates on deploy)
7. Deploy

---

## 5. VPS (DigitalOcean, Linode, Hetzner) with PM2

For full control.

### Steps
```bash
# SSH into your VPS
ssh root@your-server-ip

# Install Node.js 20 + Bun + PM2 + Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs nginx
npm install -g pm2
curl -fsSL https://bun.sh/install | bash

# Create a deploy user
adduser deploy
su - deploy

# Clone your repo
git clone https://github.com/yourusername/adil-tools-suite.git
cd adil-tools-suite

# Install + build
bun install
cp .env.example .env
nano .env  # edit secrets
bun run db:push
bun run db:seed
bun run build

# Start with PM2
pm2 start "bun run start" --name adil-tools
pm2 save
pm2 startup  # follow instructions to enable on boot

# Exit back to root
exit

# Configure Nginx as reverse proxy
nano /etc/nginx/sites-available/adil-tools
```

Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable + reload:
```bash
ln -s /etc/nginx/sites-available/adil-tools /etc/nginx/sites-enabled/
nginx -t  # test config
systemctl reload nginx

# SSL with Certbot
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## 6. Webhook Configuration

After deploying, configure these webhooks in your payment dashboards:

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click **Add endpoint**
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Events to subscribe:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (`whsec_...`) → set as `STRIPE_WEBHOOK_SECRET` env var

### PayPal
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications)
2. Select your app → Webhooks → **Add Webhook**
3. URL: `https://yourdomain.com/api/webhooks/paypal`
4. Event types:
   - `Checkout order approved`
   - `Billing subscription cancelled`
5. Copy the **Webhook ID** → set as `PAYPAL_WEBHOOK_ID` env var

---

## 7. Post-Deployment Checklist

- [ ] Site loads at your domain (https)
- [ ] Register a new account → check DB
- [ ] Login → redirect to /dashboard
- [ ] Run a free tool (JSON Formatter) → check usage counter increments
- [ ] Click a PRO tool → see "Upgrade required" lock
- [ ] Configure Stripe test keys
- [ ] Use test card `4242 4242 4242 4242` on /pricing
- [ ] Verify webhook fires (Stripe dashboard → Developers → Webhooks → your endpoint → recent events)
- [ ] Plan upgrades in DB after payment
- [ ] Test PayPal sandbox flow

---

## 8. Troubleshooting

### "Module not found" errors
Run `npm install` again. If using Bun, ensure `bun install` completed.

### Prisma client errors
```bash
npx prisma generate
# or
bun run db:generate
```

### Database connection issues
- SQLite: ensure `db/` folder is writable. Path in `DATABASE_URL` must be absolute or relative to project root.
- PostgreSQL: check connection string format: `postgresql://user:pass@host:5432/dbname`

### 3D background not rendering
- Check browser console for errors
- Three.js dynamically imports — ensure no CSP blocks `blob:` URLs
- Try a hard refresh (Ctrl+Shift+R)

### Stripe webhook returns 400 "Invalid signature"
- Double-check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Ensure raw request body is passed (the webhook route reads `req.text()`, not `req.json()`)

### Build fails on Vercel
- Check build logs
- Common cause: TypeScript errors. Run `bun run lint` locally to catch them.

---

Built by **Adil Muneeb** — Dubai, UAE — adil@adilmuneeb.site
