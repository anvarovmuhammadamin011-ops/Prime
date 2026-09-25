# Vercel Deployment Guide for Prime Game Club Mini App

## Prerequisites
1. Vercel account
2. PostgreSQL database (recommend: Neon, Supabase, or Railway)
3. Telegram Bot (@primegameclub_bot) with token: `8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA`

## Step 1: Deploy Backend (API Server)
Deploy the server to a VPS or cloud provider (Railway, Render, Fly.io, etc.)

### Environment Variables for Backend:
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://user:pass@host:5432/dbname
DB_SSL=true
JWT_SECRET=your-32-char-secret-minimum
ACCESS_CODE_PEPPER=your-32-char-pepper-minimum
CORS_ORIGIN=https://your-vercel-app.vercel.app
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA
TELEGRAM_BOT_USERNAME=primegameclub_bot
TELEGRAM_MINI_APP_URL=https://your-vercel-app.vercel.app
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret
TELEGRAM_WEBHOOK_URL=https://your-api-domain.com/api/v1/telegram/webhook
```

### Run Migrations:
```bash
npm run db:migrate
npm run db:seed
npm run db:bootstrap-admin
```

### Set Telegram Webhook:
```bash
curl -X POST "https://api.telegram.org/bot8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-api-domain.com/api/v1/telegram/webhook", "secret_token": "your-webhook-secret"}'
```

## Step 2: Deploy Frontend to Vercel

1. Push code to GitHub/GitLab
2. Import project in Vercel
3. Configure Environment Variables in Vercel:
   - `VITE_API_BASE_URL` = `https://your-api-domain.com/api/v1`
   - `VITE_TELEGRAM_BOT_USERNAME` = `primegameclub_bot`

4. Deploy - Vercel will auto-detect Vite and build

## Step 3: Configure Telegram Bot

1. Open @BotFather in Telegram
2. Set Mini App URL: `https://your-vercel-app.vercel.app`
3. Set Bot Commands:
   - `start` - Open Prime Game Club Mini App
4. Enable "Inline Mode" if needed

## Step 4: Verify

1. Open `https://your-vercel-app.vercel.app` in Telegram
2. Select language
3. Share phone number
4. Register with name, surname, password (or auto-generate)
5. Save the generated password
6. Login with phone + password

## Flow Summary

```
User opens Mini App
    ↓
Select Language (UZ/RU/EN)
    ↓
Share Phone via Telegram WebApp
    ↓
Enter Name + Surname
    ↓
Auto-generate password (or enter custom)
    ↓
Show generated password → User saves it
    ↓
User clicks "Login" → redirected to login page with pre-filled password
    ↓
Login successful → Main App
```

## Future Login (Web)

User can also login directly at `https://your-vercel-app.vercel.app` using:
- Phone number
- Saved password