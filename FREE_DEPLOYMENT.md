# Free 24/7 Hosting Options for Prime Game Club Bot

## ⚠️ Important: Telegram Webhook Requires HTTPS
Free tiers that provide HTTPS domains:
- **Railway** (500h/month free)
- **Render** (Free tier with limitations)
- **Fly.io** (Free allowance)
- **Koyeb** (Free tier)
- **Cyclic** (Free tier)

---

## Option 1: Railway (Easiest - Recommended)

### Steps:
1. **Create account**: https://railway.app (GitHub login)
2. **New Project** → "Deploy from GitHub repo"
3. **Add PostgreSQL**: Click "+" → Database → PostgreSQL
4. **Set Environment Variables** in Railway dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your-32-char-random-secret
   ACCESS_CODE_PEPPER=your-32-char-random-pepper
   DATABASE_URL=${{Postgres.DATABASE_URL}}  (auto-filled)
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   TELEGRAM_ENABLED=true
   TELEGRAM_BOT_TOKEN=8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA
   TELEGRAM_BOT_USERNAME=primegameclub_bot
   TELEGRAM_MINI_APP_URL=https://your-vercel-app.vercel.app
   TELEGRAM_WEBHOOK_SECRET=random-secret-32-chars
   TELEGRAM_WEBHOOK_URL=https://your-railway-domain.up.railway.app/api/v1/telegram/webhook
   RUN_EXPIRATION_WORKER=true
   ```
5. **Deploy** - Railway auto-detects Dockerfile
6. **Get Domain**: Settings → Domains → Generate Domain
7. **Set Webhook**:
   ```bash
   curl -X POST "https://api.telegram.org/bot8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-railway-domain.up.railway.app/api/v1/telegram/webhook", "secret_token": "your-webhook-secret"}'
   ```

### Free Tier Limits:
- 500 hours/month (enough for 24/7)
- 1GB RAM, 1 vCPU
- Sleeps after 30 min inactivity (but webhook wakes it)

---

## Option 2: Render (Good Alternative)

### Steps:
1. **Create account**: https://render.com
2. **New Web Service** → Connect GitHub
3. **Build Command**: `npm ci --omit=dev`
4. **Start Command**: `npm run db:migrate && node server/index.js`
5. **Add PostgreSQL**: New → PostgreSQL (free)
6. **Environment Variables** (same as Railway)
7. **Create Background Worker** for `node server/worker.js`
8. **Get URL**: `https://your-app.onrender.com`
9. **Set Webhook** with Render URL

### Free Tier Limits:
- Spins down after 15 min inactivity
- Cold start ~30-60 seconds
- 750 hours/month

---

## Option 3: Fly.io (More Control)

### Steps:
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login & launch
fly auth login
fly launch --dockerfile Dockerfile --name prime-club-api

# Create database
fly postgres create --name prime-club-db

# Attach database
fly postgres attach prime-club-db --app prime-club-api

# Set secrets
fly secrets set JWT_SECRET=... ACCESS_CODE_PEPPER=... TELEGRAM_BOT_TOKEN=8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA TELEGRAM_WEBHOOK_SECRET=... CORS_ORIGIN=https://your-vercel-app.vercel.app TELEGRAM_MINI_APP_URL=https://your-vercel-app.vercel.app TELEGRAM_WEBHOOK_URL=https://prime-club-api.fly.dev/api/v1/telegram/webhook

# Deploy
fly deploy

# Scale to 1 machine (free)
fly scale count 1 --app prime-club-api
```

### Free Allowance:
- 3 shared-cpu-1x VMs (256MB RAM)
- 3GB persistent storage
- 160GB outbound data

---

## Option 4: Koyeb (Simple)

### Steps:
1. **Create account**: https://koyeb.com
2. **Create App** → GitHub → Select repo
3. **Builder**: Dockerfile
4. **Add Database**: PostgreSQL (free)
5. **Environment Variables** (same as above)
6. **Deploy** → Get `https://your-app.koyeb.app`
7. **Set Webhook**

---

## Option 5: Cyclic (Simplest for Node.js)

### Steps:
1. **Create account**: https://cyclic.sh
2. **Link GitHub** → Select repo
3. **Auto-deploys** on push
4. **Environment Variables** in dashboard
5. **Get URL** → Set Webhook

---

## Database Options (Free PostgreSQL)

| Platform | Free Tier | Connection |
|----------|-----------|------------|
| **Neon** | 3GB storage, 1 project | Serverless, auto-scale |
| **Supabase** | 500MB, 1 project | PostgreSQL + Auth |
| **Railway** | Included with app | Auto-connected |
| **Render** | Included with app | Auto-connected |
| **ElephantSQL** | 20MB (tiny) | External |
| **Aiven** | 1GB (1 year trial) | External |

**Recommended**: Use **Neon** (https://neon.tech) or **Supabase** (https://supabase.com) for external DB, or Railway/Render built-in.

---

## Complete Free Stack Example

### Frontend: Vercel (Free)
- Auto-deploys from GitHub
- Custom domain support
- Edge network

### Backend: Railway (Free 500h/mo)
- PostgreSQL included
- Auto HTTPS domain
- Webhook support

### Database: Neon (Free 3GB)
- Serverless PostgreSQL
- Branch preview
- Auto-suspend

---

## Step-by-Step: Railway + Neon + Vercel (Fully Free)

### 1. Setup Neon Database
```
1. Go to https://neon.tech → Sign up
2. Create Project → "prime-club"
3. Copy Connection String: postgres://user:pass@ep-xxx.us-east-1.aws.neon.tech/prime_club?sslmode=require
```

### 2. Deploy Backend to Railway
```
1. Go to https://railway.app → New Project → GitHub
2. Select repo → prime-game-club/opencode
3. Add PostgreSQL? NO (use Neon)
4. Variables tab → Add all env vars above
5. DATABASE_URL = Neon connection string
6. Deploy → Wait for build
7. Settings → Generate Domain → Copy URL
```

### 3. Deploy Frontend to Vercel
```
1. Go to https://vercel.com → New Project → GitHub
2. Select repo → prime-game-club/opencode
3. Framework: Vite (auto-detected)
4. Environment Variables:
   VITE_API_BASE_URL=https://your-railway-domain.up.railway.app/api/v1
   VITE_TELEGRAM_BOT_USERNAME=primegameclub_bot
5. Deploy
```

### 4. Configure Telegram Bot
```bash
# Set webhook
curl -X POST "https://api.telegram.org/bot8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-railway-domain.up.railway.app/api/v1/telegram/webhook", "secret_token": "your-webhook-secret"}'

# Set Mini App URL in @BotFather
# /setmenubutton → primegameclub_bot → https://your-vercel-app.vercel.app
```

### 5. Run Migrations (One-time)
In Railway dashboard → Variables → Add `RUN_MIGRATIONS=true` → Redeploy → Remove after.

Or use Railway CLI:
```bash
npm i -g @railway/cli
railway login
railway run npm run db:migrate
railway run npm run db:seed
railway run npm run db:bootstrap-admin
```

---

## Keep Alive (Prevent Sleep)

### For Railway/Render (prevents cold starts):
```bash
# Add to package.json scripts
"keepalive": "node -e \"setInterval(() => fetch('https://your-api.com/api/v1/health').then(r=>console.log('ping',r.status)), 14*60*1000)\""
```

Or use **UptimeRobot** (free):
1. https://uptimerobot.com → Add Monitor
2. URL: `https://your-api.com/api/v1/health`
3. Interval: 5 minutes
4. Keeps service awake

---

## Cost Summary (All Free)

| Component | Platform | Cost |
|-----------|----------|------|
| Frontend | Vercel | Free |
| Backend API | Railway | Free (500h/mo) |
| Database | Neon | Free (3GB) |
| Domain | Vercel/Railway subdomain | Free |
| SSL | Auto | Free |
| Monitoring | UptimeRobot | Free |

**Total: $0/month** 🎉

---

## Quick Deploy Commands

### Railway (One-command after setup):
```bash
railway up
```

### Render (Auto on git push):
```bash
git push origin main
```

### Fly.io:
```bash
fly deploy
```

---

## Troubleshooting

### Bot not responding?
1. Check webhook: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
2. Check logs in platform dashboard
3. Verify `TELEGRAM_WEBHOOK_URL` matches your domain

### Database connection failed?
1. Check `DATABASE_URL` format
2. Ensure SSL mode: `?sslmode=require` for Neon
3. Check IP allowlist (Neon: allow all 0.0.0.0/0)

### CORS errors?
1. `CORS_ORIGIN` must match Vercel URL exactly
2. Include `https://` and no trailing slash

### Webhook timeout?
1. Increase platform timeout (Railway: 300s default)
2. Check `/api/v1/telegram/webhook` responds < 5s

---

## Next Steps After Deploy

1. **Test Mini App**: Open `@primegameclub_bot` in Telegram → Start
2. **Register test user**: Complete full flow
3. **Create admin**: Use `npm run db:bootstrap-admin` or manually update role in DB
4. **Monitor**: Check logs daily for first week
5. **Backup**: Set up Neon branch/backup schedule

The bot will run 24/7 for FREE! 🚀