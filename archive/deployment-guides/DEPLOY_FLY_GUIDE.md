# Deploy BOND Backend to Fly.io (100% Free, Always-On)

## Why Fly.io?

✅ **3 shared VMs completely free**  
✅ **Always-on (no cold starts!)**  
✅ **3GB persistent storage free**  
✅ **Better performance than Render**  
✅ **Global deployment**  

⚠️ **Requires credit card** (but won't charge on free tier)

---

## Prerequisites

- Credit card (for verification only - won't be charged)
- `flyctl` CLI installed
- Backend code ready
- Environment variables (Emergent LLM key, Supabase credentials)

---

## Step 1: Install Fly CLI

### macOS / Linux:
```bash
curl -L https://fly.io/install.sh | sh
```

### Windows (PowerShell):
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

### Verify installation:
```bash
flyctl version
```

---

## Step 2: Sign Up & Login

```bash
flyctl auth signup
# OR if you already have an account:
flyctl auth login
```

- Follow the browser prompts
- Add your credit card for verification
- **You won't be charged** unless you exceed free tier limits

---

## Step 3: Prepare Your App

### 3.1 Navigate to backend directory
```bash
cd /app/backend
```

### 3.2 Create `fly.toml` configuration

```bash
flyctl launch --no-deploy
```

This creates a `fly.toml` file. Replace its contents with:

```toml
app = "bond-backend"
primary_region = "sjc"  # Change to nearest region

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/api/status"
```

### 3.3 Create `Procfile`

Create `/app/backend/Procfile`:

```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

---

## Step 4: Set Environment Variables

```bash
# Set secrets (they're encrypted)
flyctl secrets set EMERGENT_LLM_KEY="sk-emergent-your-key-here"
flyctl secrets set SUPABASE_URL="<your-supabase-url>"
flyctl secrets set SUPABASE_ANON_KEY="<your-supabase-anon-key>"
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

---

## Step 5: Deploy!

```bash
flyctl deploy
```

- First deploy takes 3-5 minutes
- Watch the build process in your terminal
- Fly will build, push, and deploy your app

---

## Step 6: Get Your App URL

```bash
flyctl info
```

Your backend will be at:
```
https://bond-backend.fly.dev
```

---

## Step 7: Test Your Deployment

```bash
# Test health endpoint
curl https://bond-backend.fly.dev/api/status

# Test AI insights
curl -X POST https://bond-backend.fly.dev/api/generate-insights \
  -H "Content-Type: application/json" \
  -d '{"couple_data": {"user1_name": "Alex", "user2_name": "Jordan"}}'
```

---

## Step 8: Update Mobile App

Update `/app/mobile/.env`:

```bash
EXPO_PUBLIC_BACKEND_URL=https://bond-backend.fly.dev
```

---

## Monitoring & Logs

### View real-time logs:
```bash
flyctl logs
```

### Check app status:
```bash
flyctl status
```

### SSH into your VM:
```bash
flyctl ssh console
```

---

## Continuous Deployment

### Manual deployment:
```bash
cd /app/backend
flyctl deploy
```

### Auto-deploy with GitHub Actions:

Create `.github/workflows/fly.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Get your API token:
```bash
flyctl auth token
```

Add it to GitHub Secrets as `FLY_API_TOKEN`.

---

## Scaling

### Check current machines:
```bash
flyctl scale show
```

### Scale up:
```bash
flyctl scale count 2  # Run 2 instances
```

### Scale VM size (stay on free tier):
```bash
flyctl scale vm shared-cpu-1x  # 256MB RAM (free)
```

---

## Free Tier Limits

| Resource | Free Tier | Your Usage |
|----------|-----------|------------|
| **VMs** | 3 shared-cpu-1x | 1 VM needed |
| **RAM** | 256MB per VM | Enough for FastAPI |
| **Storage** | 3GB total | Stateless app = ~0GB |
| **Bandwidth** | 160GB/month | Should be plenty |

**You'll stay free as long as you:**
- Run ≤3 VMs
- Use shared-cpu-1x size
- Stay under 160GB bandwidth/month

---

## Troubleshooting

### Build fails:
```bash
# Check logs
flyctl logs

# Try rebuild
flyctl deploy --no-cache
```

### App won't start:
```bash
# Check if secrets are set
flyctl secrets list

# View machine status
flyctl status

# SSH and debug
flyctl ssh console
```

### High latency:
```bash
# Deploy to multiple regions
flyctl regions add ewr  # New York
flyctl regions add lhr  # London
flyctl scale count 3     # One in each region
```

---

## Custom Domain

```bash
# Add your domain
flyctl certs create api.yourdomain.com

# Add this to your DNS:
# CNAME api -> bond-backend.fly.dev
```

---

## Cost Monitoring

```bash
# Check current usage
flyctl dashboard
```

Go to: https://fly.io/dashboard/{your-org}/usage

---

## Advantages Over Render

| Feature | Fly.io | Render Free |
|---------|--------|-------------|
| **Always-on** | ✅ Yes | ❌ Spins down |
| **Cold starts** | ✅ None | ⚠️ ~30 seconds |
| **Performance** | ✅ Better | 🟡 Okay |
| **Hours limit** | ✅ Unlimited | ⚠️ 750 hrs/mo |
| **Setup** | 🟡 CLI-based | ✅ Web dashboard |

---

## Next Steps

1. ✅ Backend deployed to Fly.io
2. ⬜ Update mobile app with backend URL
3. ⬜ Test all API endpoints
4. ⬜ Set up monitoring
5. ⬜ Deploy mobile app to stores

---

**Your always-on backend is live! 🚀**