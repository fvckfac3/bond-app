# BOND Backend Deployment Guide - Vercel (Alternative)

## Why Vercel?
- ✅ Free tier (generous)
- ✅ Serverless (auto-scaling)
- ✅ Fast deployment
- ✅ Built-in CI/CD

**Note:** Vercel is serverless, so there are cold starts (~1-2s first request)

---

## Step-by-Step: Deploy to Vercel

### **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

---

### **Step 2: Prepare Backend for Vercel**

Vercel needs a specific structure. Create `vercel.json`:

Already created at `/app/backend/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.py"
    }
  ],
  "env": {
    "EMERGENT_LLM_KEY": "@emergent-llm-key"
  }
}
```

---

### **Step 3: Login to Vercel**

```bash
cd /app/backend
vercel login

# Follow prompts - login with GitHub/Email
```

---

### **Step 4: Deploy**

```bash
# First deployment (interactive)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? bond-backend
# - Directory? ./
# - Override settings? No

# You'll get a URL like:
# https://bond-backend-xxx.vercel.app
```

---

### **Step 5: Set Environment Variables**

**Via CLI:**
```bash
vercel env add EMERGENT_LLM_KEY production
# Paste: sk-emergent-a83D30138E76473343

vercel env add CORS_ORIGINS production  
# Paste: exp://,*.expo.dev,capacitor://
```

**Or via Dashboard:**
1. Go to https://vercel.com/dashboard
2. Click your project (bond-backend)
3. Settings → Environment Variables
4. Add:
   - `EMERGENT_LLM_KEY` = `sk-emergent-a83D30138E76473343`
   - `CORS_ORIGINS` = `exp://,*.expo.dev`

---

### **Step 6: Deploy to Production**

```bash
vercel --prod

# Your production URL:
# https://bond-backend.vercel.app
```

---

### **Step 7: Test Deployment**

```bash
curl https://bond-backend.vercel.app/api/status

# Should return:
# {"status":"healthy","timestamp":"..."}
```

---

### **Step 8: Update Mobile App**

```bash
cd /app/mobile
nano .env
```

Add:
```
EXPO_PUBLIC_BACKEND_URL=https://bond-backend.vercel.app
```

---

## Continuous Deployment

**With GitHub:**

1. Push backend to GitHub
2. Go to Vercel Dashboard
3. Import Project → GitHub repo
4. Select `/backend` folder
5. Deploy

**Future deploys:** Just `git push` - auto-deploys!

---

## Custom Domain

1. Vercel Dashboard → Settings → Domains
2. Add: api.yourdomain.com
3. Add DNS records (Vercel shows you)
4. Done!

---

## Monitoring

**View Logs:**
```bash
vercel logs
```

**Or Dashboard:** Project → Deployments → Click deployment → Logs

---

## Pricing

**Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Perfect for MVP

**Pro ($20/month):**
- 1TB bandwidth
- Priority support
- Analytics

---

## Railway vs Vercel

| Feature | Railway | Vercel |
|---------|---------|--------|
| Type | Always-on | Serverless |
| Cold starts | No | Yes (~1-2s) |
| Free tier | $5 credit | 100GB bandwidth |
| Best for | AI workloads | API endpoints |
| Price | ~$10/mo | Free → $20/mo |

**Recommendation:** Use Railway for BOND (AI insights need always-on)

---

## ✅ Vercel Checklist

- [ ] Vercel CLI installed
- [ ] Logged in
- [ ] Backend deployed
- [ ] Environment variables set
- [ ] Production deployed
- [ ] API tested
- [ ] Mobile app updated
- [ ] GitHub connected (optional)

**Time: 15 minutes**
**Cost: Free**
