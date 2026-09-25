# Server Deployment Guide - Always Running Bot

## Option 1: Docker Compose (Recommended for VPS)

### 1. Prepare Server
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Logout and login again
```

### 2. Clone & Configure
```bash
git clone <your-repo>
cd prime-game-club/opencode
cp .env.example .env
# Edit .env with production values
nano .env
```

### 3. Required .env Values for Production
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://prime:prime@db:5432/prime_club
DB_SSL=false
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ACCESS_CODE_PEPPER=your-super-secret-pepper-min-32-chars
CORS_ORIGIN=https://your-vercel-app.vercel.app
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA
TELEGRAM_BOT_USERNAME=primegameclub_bot
TELEGRAM_MINI_APP_URL=https://your-vercel-app.vercel.app
TELEGRAM_WEBHOOK_SECRET=your-random-webhook-secret
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/v1/telegram/webhook
```

### 4. Start Services
```bash
docker compose up -d --build
docker compose logs -f
```

### 5. Set Telegram Webhook
```bash
curl -X POST "https://api.telegram.org/bot8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/v1/telegram/webhook", "secret_token": "your-random-webhook-secret"}'
```

### 6. Verify
```bash
# Check webhook
curl "https://api.telegram.org/bot8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA/getWebhookInfo"

# Check logs
docker compose logs -f api
docker compose logs -f worker
```

---

## Option 2: PM2 on VPS (Without Docker)

### 1. Install Node.js & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Setup PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
CREATE DATABASE prime_club;
CREATE USER prime WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE prime_club TO prime;
\q
```

### 3. Deploy Application
```bash
git clone <your-repo>
cd prime-game-club/opencode
npm ci --omit=dev
cp .env.example .env
nano .env  # Add production values
```

### 4. Run Migrations
```bash
npm run db:migrate
npm run db:seed
npm run db:bootstrap-admin
```

### 5. Start with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
# Run the command it outputs (usually: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME)
```

### 6. Set Webhook
```bash
curl -X POST "https://api.telegram.org/bot8996866988:AAF9i0beGm6GoI4onhaVqLtvMa1W84CGnhA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/v1/telegram/webhook", "secret_token": "your-webhook-secret"}'
```

### 7. Monitor
```bash
pm2 status
pm2 logs
pm2 monit
```

---

## Option 3: Systemd Service (Linux VPS)

### 1. Create Service Files
```bash
sudo tee /etc/systemd/system/prime-club-api.service > /dev/null <<'EOF'
[Unit]
Description=Prime Club API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/prime-club/opencode
Environment=NODE_ENV=production
EnvironmentFile=/opt/prime-club/opencode/.env
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/prime-club-worker.service > /dev/null <<'EOF'
[Unit]
Description=Prime Club Worker
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/prime-club/opencode
Environment=NODE_ENV=production
EnvironmentFile=/opt/prime-club/opencode/.env
ExecStart=/usr/bin/node server/worker.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

### 2. Enable & Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable prime-club-api prime-club-worker
sudo systemctl start prime-club-api prime-club-worker
sudo systemctl status prime-club-api prime-club-worker
```

### 3. View Logs
```bash
sudo journalctl -u prime-club-api -f
sudo journalctl -u prime-club-worker -f
```

---

## Option 4: Cloud Platforms (Railway/Render/Fly.io)

### Railway
1. Connect GitHub repo
2. Add PostgreSQL service
3. Set environment variables
4. Deploy - auto-detects Dockerfile
5. Set webhook URL from Railway domain

### Render
1. Create Web Service from repo
2. Add PostgreSQL database
3. Build command: `npm ci --omit=dev`
4. Start command: `npm run db:migrate && node server/index.js`
5. Create Background Worker for `node server/worker.js`
6. Set webhook URL from Render domain

### Fly.io
```bash
fly launch --dockerfile Dockerfile
fly postgres create --name prime-club-db
fly secrets set DATABASE_URL=... JWT_SECRET=... TELEGRAM_BOT_TOKEN=... etc.
fly deploy
```

---

## SSL/HTTPS Setup (Required for Telegram Webhook)

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
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

### Get SSL Certificate
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Monitoring & Health Checks

### Health Endpoint
```bash
curl https://your-domain.com/api/v1/health
# Returns: {"status":"ok","timestamp":"...","uptime":...}
```

### Auto-restart on Failure
All options above include automatic restart:
- Docker: `restart: unless-stopped`
- PM2: `autorestart: true`
- Systemd: `Restart=always`

### Log Rotation
```bash
# For PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# For Docker
# Add to docker-compose.yml logging driver options
```

---

## Quick Commands Reference

| Action | Docker | PM2 | Systemd |
|--------|--------|-----|---------|
| Start | `docker compose up -d` | `pm2 start all` | `systemctl start prime-club-api prime-club-worker` |
| Stop | `docker compose down` | `pm2 stop all` | `systemctl stop prime-club-api prime-club-worker` |
| Restart | `docker compose restart` | `pm2 restart all` | `systemctl restart prime-club-api prime-club-worker` |
| Logs | `docker compose logs -f` | `pm2 logs` | `journalctl -u prime-club-api -f` |
| Status | `docker compose ps` | `pm2 status` | `systemctl status prime-club-api` |
| Update | `git pull && docker compose up -d --build` | `git pull && pm2 reload all` | `git pull && systemctl restart prime-club-api prime-club-worker` |

---

## Verify Bot is Working

1. Open Telegram → Search `@primegameclub_bot`
2. Click **Start** → Should open Mini App
3. Complete registration flow
4. Check admin panel at `/admin` (if admin user)

The bot will now run 24/7 with automatic restarts on failure!