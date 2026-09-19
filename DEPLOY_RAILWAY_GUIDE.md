# BOND Backend Deployment Guide - Railway (Recommended)

## Why Railway?
- ✅ $5/month free credit
- ✅ Easiest deployment
- ✅ Auto SSL
- ✅ Environment variables UI
- ✅ One-click deploy

---

## Step-by-Step: Deploy to Railway

### **Step 1: Create Railway Account (2 mins)**

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway

**You now have $5/month free credit!**

---

### **Step 2: Install Railway CLI (Optional but recommended)**

```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Or with npm
npm install -g @railway/cli

# Login
railway login
```

---

### **Step 3: Prepare Your Backend**

Your backend is already ready! But let's verify:

```bash
cd /app/backend

# Check files exist
ls -la
# Should see: server.py, requirements.txt, services/
```

---

### **Step 4: Create railway.json Config**

Already done! File at `/app/backend/railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn server:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/api/status",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

### **Step 5A: Deploy via GitHub (Recommended)**

**If you have backend in GitHub repo:**

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Select `/backend` folder
5. Click "Deploy"

**Railway auto-detects Python and deploys!**

---

### **Step 5B: Deploy via CLI (If no GitHub)**

```bash
cd /app/backend

# Initialize Railway project
railway init

# Follow prompts:
# - Name: bond-backend
# - Environment: production

# Deploy
railway up

# You'll see:
# ✓ Building...
# ✓ Deploying...
# ✓ Deployment live at: https://bond-backend-production-xxx.up.railway.app
```

---

### **Step 6: Set Environment Variables**

**Via Dashboard (Easiest):**

1. Go to your Railway project
2. Click "Variables" tab
3. Add these variables:

```
EMERGENT_LLM_KEY=sk-emergent-your-key-here
CORS_ORIGINS=exp://,*.expo.dev,capacitor://,http://localhost:*
PORT=8001
```

4. Click "Deploy" to apply

**Via CLI:**

```bash
railway variables set EMERGENT_LLM_KEY=sk-emergent-your-key-here
railway variables set CORS_ORIGINS="exp://,*.expo.dev"
```

---

### **Step 7: Get Your Deployment URL**

```bash
# Via CLI
railway domain

# Output: https://bond-backend-production-xxx.up.railway.app

# Or check Railway Dashboard → Settings → Domains
```

**Copy this URL! You'll need it for mobile app.**

---

### **Step 8: Test Your Deployment**

```bash
# Test the API
curl https://your-railway-url.up.railway.app/api/status

# Should return:
# {"status":"healthy","timestamp":"..."}
```

---

### **Step 9: Update Mobile App with Backend URL**

```bash
cd /app/mobile

# Add to .env
echo "EXPO_PUBLIC_BACKEND_URL=https://your-railway-url.up.railway.app" >> .env

# Or manually edit .env:
nano .env
```

Add:
```
EXPO_PUBLIC_BACKEND_URL=https://bond-backend-production-xxx.up.railway.app
```

---

### **Step 10: Rebuild Mobile App**

```bash
cd /app/mobile

# Clear cache
rm -rf .expo

# Restart
npm start
```

**Done! Your backend is live!** 🚀

---

## Monitoring & Logs

**View Logs:**
```bash
railway logs
```

**Or via Dashboard:**
- Railway Dashboard → Your Project → "Deployments" → Click deployment → "View Logs"

---

## Scaling & Pricing

**Free Tier:**
- $5/month credit
- 500 hours (enough for always-on)
- Perfect for MVP

**When you grow:**
- $0.000463/GB-hour RAM
- $0.000231/vCPU-hour
- ~$10-20/month for production

---

## Common Issues & Fixes

### Issue 1: "Module not found"
```bash
# Make sure requirements.txt is complete
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update deps"
railway up
```

### Issue 2: "Port already in use"
Railway automatically sets PORT env var. Make sure server.py uses:
```python
port = int(os.getenv("PORT", 8001))
uvicorn.run(app, host="0.0.0.0", port=port)
```

### Issue 3: "CORS errors"
Add your mobile app domains to CORS_ORIGINS:
```
CORS_ORIGINS=exp://,*.expo.dev,capacitor://,http://localhost:*
```

---

## Rollback if Needed

```bash
# Via CLI
railway rollback

# Or via Dashboard → Deployments → Click previous deployment → "Redeploy"
```

---

## Custom Domain (Optional)

1. Railway Dashboard → Settings → Domains
2. Click "Add Custom Domain"
3. Enter: api.yourdomain.com
4. Add CNAME record to your DNS:
   ```
   CNAME api railway.app
   ```
5. Wait 5 minutes
6. Done!

---

## ✅ Deployment Checklist

- [ ] Railway account created
- [ ] Backend deployed
- [ ] Environment variables set
- [ ] Deployment URL obtained
- [ ] Mobile app .env updated
- [ ] API tested (curl)
- [ ] Mobile app tested with live backend
- [ ] Logs checked for errors

---

## Next Steps

1. Deploy backend: ✅ Done
2. Test AI insights in mobile app
3. Monitor usage in Railway dashboard
4. Scale as needed

**Estimated Time: 15-20 minutes**
**Cost: Free (with $5 credit)**

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://railway.statuspage.io/
