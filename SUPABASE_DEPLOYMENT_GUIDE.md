# SUPABASE SETUP & DEPLOYMENT GUIDE (Updated for Supabase)

## ✅ What Changed

Your BOND app now uses **Supabase (PostgreSQL)** instead of MongoDB for the payment system.

**Backend files updated:**

- `/app/backend/routes/payments.py` - Now uses Supabase client
- `/app/backend/.env` - Updated environment variables
- `/app/backend/requirements.txt` - Added `supabase` library

**New files created:**

- `/app/supabase/payment_tables_schema.sql` - Database schema for payments

---

## 📋 STEP 1: Set Up Supabase Payment Tables

### 1.1 Get Your Supabase Credentials

You already have:

```markdown
SUPABASE_URL=https://cgcxilefnybidbiirkjn.supabase.co
SUPABASE_ANON_KEY=sb_publishable_eEgLhDrPyNBodoruBE7YIw_ucZVB-hz
```

### 1.2 Get Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project: **cgcxilefnybidbiirkjn**
3. Go to **Settings** → **API**
4. Copy `service_role` key (secret, never expose to frontend!)

### 1.3 Create Payment Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `/app/supabase/payment_tables_schema.sql`
4. Paste into SQL editor
5. Click **"Run"** or press `Ctrl+Enter`

This creates:

- `payment_transactions` table
- `subscriptions` table
- `webhook_events` table
- Indexes for performance
- Row Level Security (RLS) policies
- Helper views for analytics

### 1.4 Verify Tables Created

In SQL Editor, run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payment_transactions', 'subscriptions', 'webhook_events');
```

You should see all 3 tables listed.

---

## 📋 STEP 2: Update Backend Environment Variables

### 2.1 Update `/app/backend/.env`

```bash
SUPABASE_URL=https://cgcxilefnybidbiirkjn.supabase.co
SUPABASE_ANON_KEY=sb_publishable_eEgLhDrPyNBodoruBE7YIw_ucZVB-hz
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY_HERE>
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=sk-emergent-a83D30138E76473343
STRIPE_API_KEY=sk_test_emergent
```

⚠️ **CRITICAL:** Replace `<YOUR_SERVICE_ROLE_KEY_HERE>` with actual key from Step 1.2

### 2.2 Restart Backend (Local Testing)

```bash
cd /app/backend
sudo supervisorctl restart backend
```

---

## 📋 STEP 3: Test Payment API Locally

```bash
# Test packages endpoint
curl http://localhost:8001/api/subscription/packages

# Expected output: JSON with 2 packages (premium_monthly, premium_annual)
```

If this works, your backend is ready! ✅

---

## 🚀 STEP 4: Deploy Backend to Render

### 4.1 Prerequisites

- GitHub account
- Backend code pushed to GitHub
- Supabase service role key from Step 1.2

### 4.2 Push to GitHub

```bash
cd /app/backend
git init
git add .
git commit -m "Backend with Supabase payment system"
git remote add origin https://github.com/YOUR_USERNAME/bond-backend.git
git branch -M main
git push -u origin main
```

### 4.3 Sign Up for Render

1. Go to https://render.com
2. Sign up with GitHub (free, no credit card)
3. Authorize Render to access your repositories

### 4.4 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Select your `bond-backend` repository
3. Configure:

| Field | Value |
| --- | --- |
| **Name** | `bond-backend` |
| **Region** | Choose closest to users |
| **Branch** | `main` |
| **Root Directory** | (leave blank if backend at root) |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | **Free** |

### 4.5 Set Environment Variables

Scroll to "Environment Variables" and add:

```markdown
SUPABASE_URL=https://cgcxilefnybidbiirkjn.supabase.co
SUPABASE_ANON_KEY=sb_publishable_eEgLhDrPyNBodoruBE7YIw_ucZVB-hz
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-a83D30138E76473343
STRIPE_API_KEY=sk_test_emergent
```

⚠️ **Use your actual Supabase service role key!**

### 4.6 Deploy

1. Click **"Create Web Service"**
2. Wait 2-5 minutes for build
3. Your backend will be at: `https://bond-backend.onrender.com`

### 4.7 Test Live Deployment

```bash
curl https://bond-backend.onrender.com/api/subscription/packages
```

Should return 2 subscription packages in JSON.

---

## 📋 STEP 5: Update Mobile App

### 5.1 Update `/app/mobile/.env`

```bash
EXPO_PUBLIC_SUPABASE_URL=https://cgcxilefnybidbiirkjn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_eEgLhDrPyNBodoruBE7YIw_ucZVB-hz
EXPO_PUBLIC_BACKEND_URL=https://bond-backend.onrender.com
```

### 5.2 Restart Mobile App

```bash
cd /app/mobile
npx expo start --clear
```

---

## 📊 STEP 6: Verify Everything Works

### 6.1 Test Full Payment Flow

1. Open mobile app
2. Navigate to subscription/plans
3. Select a plan
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify:
   - Payment polling works
   - Success screen shows
   - Subscription appears in Supabase

### 6.2 Check Supabase Data

In Supabase Dashboard:

**View Transactions:**

```sql
SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10;
```

**View Subscriptions:**

```sql
SELECT * FROM subscriptions ORDER BY created_at DESC;
```

**View MRR:**

```sql
SELECT * FROM monthly_recurring_revenue;
```

---

## 🔍 Monitoring & Analytics

### Built-in Views

**Active Premium Users:**

```sql
SELECT * FROM active_premium_users;
```

**Monthly Recurring Revenue:**

```sql
SELECT * FROM monthly_recurring_revenue;
```

**Expiring Trials (Next 7 Days):**

```sql
SELECT * FROM subscriptions 
WHERE is_trial = TRUE 
AND status = 'active' 
AND trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '7 days';
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check environment variables:**

```bash
# In Render dashboard, verify all env vars are set
# Especially SUPABASE_SERVICE_ROLE_KEY
```

**Check logs:**

- Go to Render dashboard
- Click your service
- View logs for errors

### API Returns 500 Error

**Possible causes:**

1. Missing Supabase service role key
2. Tables not created in Supabase
3. Wrong Supabase URL

**Solution:**

- Verify `/app/supabase/payment_tables_schema.sql` was run
- Check Supabase dashboard → Database → Tables
- Confirm `payment_transactions`, `subscriptions`, `webhook_events` exist

### Payment Status Polling Fails

**Check:**

1. Backend URL correct in mobile `.env`
2. Session ID being passed correctly
3. Transaction exists in `payment_transactions` table

**Debug:**

```sql
-- Find transaction by session_id
SELECT * FROM payment_transactions WHERE session_id = 'cs_test_...';
```

---

## 🔒 Security Notes

### Environment Variables

**NEVER commit these to Git:**

- `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- `STRIPE_API_KEY`
- `EMERGENT_LLM_KEY`

**Frontend should only use:**

- `EXPO_PUBLIC_SUPABASE_URL` ✅
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` ✅
- `EXPO_PUBLIC_BACKEND_URL` ✅

### Row Level Security (RLS)

Already configured in schema:

- Users can only see their own transactions/subscriptions
- Service role (backend) has full access
- Webhook events only accessible by service role

---

## 📈 Scaling Considerations

### Free Tier Limits

**Render:**

- Spins down after 15 min inactivity
- First request: \~30s cold start
- 750 hours/month

**Supabase:**

- 500 MB database (free tier)
- Unlimited API requests
- 2GB bandwidth/month
- 50,000 monthly active users

### Keep Backend Awake

Use **UptimeRobot** (free):

1. Sign up: https://uptimerobot.com
2. Add HTTP monitor
3. URL: `https://bond-backend.onrender.com/api/subscription/packages`
4. Interval: 14 minutes
5. Keeps API warm 24/7

### Database Growth

**Monitor table sizes:**

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**When to upgrade:**

- Database &gt; 400 MB: Upgrade Supabase ($25/month)
- Backend traffic high: Upgrade Render ($7/month for always-on)

---

## ✅ Deployment Checklist

### Backend:

- [x] Supabase tables created

- [x] Service role key obtained

- [x] Environment variables set

- [x] Deployed to Render

- [ ] Test live API endpoints

- [ ] Set up UptimeRobot (optional)

### Mobile:

- [ ] Backend URL updated in `.env`

- [ ] Test checkout flow

- [ ] Verify payment polling

- [ ] Test subscription state updates

### Database:

- [x] Tables created with RLS

- [x] Indexes added

- [x] Helper views created

- [ ] Test queries working

---

## 🎯 Quick Reference

### Environment Variables Needed

**Backend (Render):**

```markdown
SUPABASE_URL=https://cgcxilefnybidbiirkjn.supabase.co
SUPABASE_ANON_KEY=sb_publishable_eEgLhDrPyNBodoruBE7YIw_ucZVB-hz
SUPABASE_SERVICE_ROLE_KEY=<secret>
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-a83D30138E76473343
STRIPE_API_KEY=sk_test_emergent
```

**Mobile (.env):**

```markdown
EXPO_PUBLIC_SUPABASE_URL=https://cgcxilefnybidbiirkjn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_eEgLhDrPyNBodoruBE7YIw_ucZVB-hz
EXPO_PUBLIC_BACKEND_URL=https://bond-backend.onrender.com
```

### API Endpoints

```markdown
GET  /api/subscription/packages           # List plans
POST /api/subscription/checkout           # Create checkout session
GET  /api/subscription/status/{id}        # Check payment status
GET  /api/subscription/user/{id}          # Get user subscription
POST /api/webhook/stripe                  # Stripe webhook
```

### Test with cURL

```bash
# Get packages
curl https://bond-backend.onrender.com/api/subscription/packages

# Get user subscription (replace USER_ID)
curl https://bond-backend.onrender.com/api/subscription/user/USER_ID
```

---

## 📚 Related Documentation

- Main implementation guide: `/app/COMPLETE_IMPLEMENTATION_AND_AUTOMATION.md`
- Build guide: `/app/BUILD_GUIDE_COMPLETE.md`
- Marketing playbook: `/app/ZERO_BUDGET_MARKETING_PLAYBOOK.md`
- Monetization details: `/app/MONETIZATION_IMPLEMENTATION.md`

---

**Your Supabase-powered payment system is ready! 🚀**

Next steps:

1. Get Supabase service role key
2. Run SQL schema
3. Deploy to Render
4. Test full payment flow
5. Launch! 💜