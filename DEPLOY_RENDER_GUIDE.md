# Deploy BOND Backend to Render.com (100% Free)

## Prerequisites
- GitHub account
- Backend code pushed to a GitHub repository
- Emergent LLM API key (already in your code)
- Supabase URL and keys (already in your code)

---

## Step 1: Prepare Your Repository

### 1.1 Ensure your `.env` variables are NOT committed
Your `.env` file should be in `.gitignore`. You'll add these as environment variables in Render.

### 1.2 Verify your `requirements.txt`
Make sure `/app/backend/requirements.txt` is complete with all dependencies.

### 1.3 Create a `render.yaml` (Optional but recommended)

Create `/app/render.yaml`:

```yaml
services:
  - type: web
    name: bond-backend
    env: python
    region: oregon
    plan: free
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: EMERGENT_LLM_KEY
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
```

---

## Step 2: Sign Up for Render

1. Go to https://render.com/
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended for easier deployment)
4. **No credit card required!**

---

## Step 3: Create a New Web Service

### 3.1 Connect Your Repository

1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Click **"Configure account"** to connect your GitHub
3. Grant Render access to your repository
4. Select your BOND repository from the list

### 3.2 Configure the Web Service

Fill in these details:

| Field | Value |
|-------|-------|
| **Name** | `bond-backend` (or any name you prefer) |
| **Region** | Choose closest to your users |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `backend` |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | **Free** |

### 3.3 Important: Set Environment Variables

Scroll down to **"Environment Variables"** section and add:

```bash
EMERGENT_LLM_KEY=sk-emergent-your-key-here
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-key>
```

**Where to find Supabase keys:**
- Go to https://supabase.com/dashboard
- Select your project
- Go to **Settings** → **API**
- Copy `URL`, `anon public` key, and `service_role` key

### 3.4 Deploy!

1. Click **"Create Web Service"**
2. Render will start building your app (takes 2-5 minutes)
3. Watch the logs in real-time
4. Once deployed, you'll see: **"Your service is live 🎉"**

---

## Step 4: Get Your Backend URL

Your backend will be available at:

```
https://bond-backend.onrender.com
```

(Replace `bond-backend` with whatever name you chose)

---

## Step 5: Update Mobile App with Backend URL

### 5.1 Update `/app/mobile/.env`

```bash
EXPO_PUBLIC_BACKEND_URL=https://bond-backend.onrender.com
```

### 5.2 Rebuild your mobile app

```bash
cd /app/mobile
yarn install
npx expo start --clear
```

---

## Step 6: Test Your Deployment

### 6.1 Test the health endpoint

```bash
curl https://bond-backend.onrender.com/api/status
```

Expected response:
```json
{"status": "ok", "service": "BOND API"}
```

### 6.2 Test AI insights endpoint

```bash
curl -X POST https://bond-backend.onrender.com/api/generate-insights \
  -H "Content-Type: application/json" \
  -d '{"couple_data": {"user1_name": "Alex", "user2_name": "Jordan"}}'
```

---

## ⚠️ Important: Free Tier Limitations

### Cold Starts
- **Free tier spins down after 15 minutes of inactivity**
- First request after spin-down takes **~30 seconds**
- Subsequent requests are instant

### Solutions:
1. **Accept it**: 30s cold start is fine for most users
2. **Keep-alive service**: Use a service like **UptimeRobot** (free) to ping your API every 14 minutes
3. **Upgrade**: Render paid plans start at $7/month for always-on

### Hours Limit
- 750 hours per month free
- If always-on: 24 × 30 = 720 hours (fits within limit!)

---

## Continuous Deployment (Auto-Deploy)

Render automatically redeploys when you push to your GitHub branch!

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```
3. Render detects the change and redeploys automatically
4. Watch the deployment logs in your Render dashboard

---

## Monitoring & Logs

### View Real-time Logs
1. Go to your Render dashboard
2. Click on your `bond-backend` service
3. Click **"Logs"** tab
4. See real-time application logs

### Set Up Alerts (Optional)
1. Go to **"Settings"** → **"Notifications"**
2. Add your email or Slack webhook
3. Get notified of deploy failures or service issues

---

## Troubleshooting

### Build Fails

**Problem**: `ERROR: Could not find a version that satisfies the requirement...`

**Solution**: 
- Check your `requirements.txt` for typos
- Ensure all packages are available on PyPI
- Pin specific versions if needed

### Service Won't Start

**Problem**: Service builds but won't start

**Solution**:
- Check your start command uses `--host 0.0.0.0 --port $PORT`
- Render provides the `$PORT` environment variable automatically
- Check logs for Python errors

### Environment Variables Not Working

**Problem**: App can't connect to Supabase

**Solution**:
- Go to **"Environment"** tab in Render dashboard
- Verify all keys are set correctly
- Click **"Save Changes"** if you update them
- Manually trigger a redeploy

### Cold Start Too Slow

**Problem**: Users complain about 30s wait times

**Solutions**:
1. Use **UptimeRobot** (free) to ping your API every 14 minutes:
   - Sign up at https://uptimerobot.com
   - Create HTTP(s) monitor
   - URL: `https://bond-backend.onrender.com/api/status`
   - Interval: 14 minutes
   
2. Optimize your app startup:
   - Remove unnecessary imports
   - Lazy-load heavy dependencies
   - Cache expensive operations

3. Upgrade to Render's **Starter plan** ($7/month) for always-on

---

## Custom Domain (Optional)

Want `api.yourdomain.com` instead of `bond-backend.onrender.com`?

1. Go to **"Settings"** → **"Custom Domain"**
2. Add your domain
3. Add the CNAME record to your DNS provider
4. Render provides free SSL automatically!

---

## Scaling Up (When You Grow)

When you outgrow the free tier:

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 750 hrs, spins down, shared CPU |
| **Starter** | $7/mo | Always-on, 0.5GB RAM |
| **Standard** | $25/mo | 2GB RAM, better CPU |
| **Pro** | $85/mo | 4GB RAM, dedicated CPU |

---

## Security Checklist

- ✅ Environment variables set (not in code)
- ✅ `.env` file in `.gitignore`
- ✅ HTTPS enabled automatically by Render
- ✅ Supabase RLS (Row Level Security) enabled
- ✅ Rate limiting implemented (if needed)

---

## Next Steps

1. ✅ Backend deployed to Render
2. ⬜ Update mobile app with backend URL
3. ⬜ Test all API endpoints
4. ⬜ Deploy mobile app to App Store / Play Store
5. ⬜ Set up monitoring (Sentry, PostHog)
6. ⬜ Configure UptimeRobot keep-alive (optional)

---

## Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Status Page**: https://status.render.com

---

## Alternative Free Hosting

If Render doesn't work for you, see:
- `/app/DEPLOY_FLY_GUIDE.md` - Always-on, no cold starts
- `/app/DEPLOY_PYTHONANYWHERE_GUIDE.md` - Python-specific hosting
- `/app/FREE_HOSTING_OPTIONS.md` - Full comparison

---

**Your backend is now live! 🚀**