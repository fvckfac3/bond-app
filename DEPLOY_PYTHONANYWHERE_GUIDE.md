# Deploy BOND Backend to PythonAnywhere (100% Free, Forever)

## Why PythonAnywhere?

✅ **Forever free tier** (no time limits!)  
✅ **Always-on** (no cold starts)  
✅ **Designed for Python apps**  
✅ **Simple web-based setup**  
✅ **No credit card required**  

⚠️ **Limitations:**
- 512MB RAM limit (should be enough for FastAPI)
- 1 web app only on free tier
- Daily API quota (100k hits/day)

---

## Step 1: Sign Up

1. Go to https://www.pythonanywhere.com
2. Click **"Start running Python online for FREE"**
3. Create a **Beginner Account** (free forever)
4. Verify your email

---

## Step 2: Upload Your Code

### Option A: Upload via Web Interface

1. Go to **"Files"** tab
2. Navigate to `/home/yourusername/`
3. Create folder: `bond-backend`
4. Upload all files from `/app/backend/`

### Option B: Clone from GitHub (Recommended)

1. Go to **"Consoles"** tab
2. Click **"Bash"** to start a terminal
3. Run:

```bash
cd ~
git clone https://github.com/yourusername/bond-app.git
cd bond-app/backend
```

---

## Step 3: Set Up Virtual Environment

In the Bash console:

```bash
cd ~/bond-app/backend
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

This may take 5-10 minutes.

---

## Step 4: Configure Web App

### 4.1 Create Web App

1. Go to **"Web"** tab
2. Click **"Add a new web app"**
3. Choose:
   - **Your domain**: `yourusername.pythonanywhere.com`
   - **Python framework**: **Manual configuration**
   - **Python version**: **3.10**

### 4.2 Configure WSGI File

1. In the **Web** tab, find **"Code"** section
2. Click on the WSGI configuration file link
3. **Delete all contents** and replace with:

```python
import sys
import os
from pathlib import Path

# Add your project directory to the sys.path
project_home = '/home/yourusername/bond-app/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables
os.environ['EMERGENT_LLM_KEY'] = 'sk-emergent-a83D30138E76473343'
os.environ['SUPABASE_URL'] = 'your-supabase-url'
os.environ['SUPABASE_ANON_KEY'] = 'your-supabase-anon-key'
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'your-service-role-key'

# Import the FastAPI app
from server import app as application
```

**⚠️ Important:** Replace:
- `yourusername` with your PythonAnywhere username
- Supabase credentials with your actual keys

4. Click **"Save"**

### 4.3 Configure Virtual Environment Path

1. In the **Web** tab, find **"Virtualenv"** section
2. Enter path: `/home/yourusername/bond-app/backend/venv`
3. Click the checkmark to save

---

## Step 5: Set API Path Prefix

PythonAnywhere serves from root, but your app uses `/api` prefix.

**Option A:** Update FastAPI to handle both

Edit `/app/backend/server.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(root_path="/api")  # Add this

# ... rest of your code
```

**Option B:** Use a sub-path in PythonAnywhere

1. Go to **Web** tab → **"Static files"** section
2. URL: `/api/`
3. Directory: Leave empty
4. This will route `/api/*` to your WSGI app

---

## Step 6: Reload Web App

1. Go to **"Web"** tab
2. Click the big green **"Reload yourusername.pythonanywhere.com"** button
3. Wait 10-15 seconds for reload

---

## Step 7: Test Your Deployment

```bash
# Test health endpoint
curl https://yourusername.pythonanywhere.com/api/status

# Test AI insights
curl -X POST https://yourusername.pythonanywhere.com/api/generate-insights \
  -H "Content-Type: application/json" \
  -d '{"couple_data": {"user1_name": "Alex", "user2_name": "Jordan"}}'
```

---

## Step 8: Update Mobile App

Update `/app/mobile/.env`:

```bash
EXPO_PUBLIC_BACKEND_URL=https://yourusername.pythonanywhere.com
```

---

## Monitoring & Logs

### View Error Logs

1. Go to **"Web"** tab
2. Scroll to **"Log files"** section
3. Click on:
   - **Error log**: See Python errors
   - **Server log**: See HTTP requests

### View Logs in Console

```bash
# In Bash console
tail -f ~/logs/yourusername.pythonanywhere.com.error.log
```

---

## Updating Your Code

### Via Bash Console:

```bash
cd ~/bond-app/backend
git pull origin main
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

Then go to **Web** tab → **Reload**

### Via Web Interface:

1. Go to **"Files"** tab
2. Navigate to your backend folder
3. Edit files directly in the browser
4. Go to **"Web"** tab → **Reload**

---

## Troubleshooting

### "Something went wrong :-(" Error

**Check error logs:**
1. Go to **Web** tab
2. Click **Error log** link
3. Look for Python tracebacks

**Common issues:**
- Missing dependencies: Re-run `pip install -r requirements.txt`
- Wrong Python path in WSGI file
- Environment variables not set

### Import Errors

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
cd ~/bond-app/backend
source venv/bin/activate
pip install fastapi uvicorn
```

### Memory Limit Exceeded

**Problem**: App crashes due to 512MB RAM limit

**Solutions**:
1. Optimize imports (lazy load heavy libraries)
2. Reduce concurrent requests
3. Use Fly.io or Render instead (more RAM)

### Daily Quota Exceeded

**Problem**: "Daily API request limit exceeded"

**Solution**:
- Free tier: 100k requests/day
- If you exceed, upgrade to paid plan ($5/month)
- Or use Render/Fly.io for unlimited requests

---

## Scheduled Tasks (Cron Jobs)

Free tier doesn't include scheduled tasks, but you can:

1. Use external cron service like **cron-job.org**
2. Ping your API endpoint on schedule
3. Example: Send daily check-in reminders

---

## Custom Domain (Paid Feature)

Free tier only supports:
```
yourusername.pythonanywhere.com
```

For custom domain (`api.yourdomain.com`):
- Upgrade to **Hacker plan** ($5/month)

---

## Free Tier Limits

| Resource | Free Tier |
|----------|----------|
| **Web apps** | 1 |
| **Consoles** | 2 |
| **Storage** | 512MB |
| **RAM** | 512MB |
| **CPU seconds/day** | 100 seconds |
| **API requests/day** | 100,000 |
| **Always-on tasks** | 0 (paid only) |

---

## Advantages vs Render

| Feature | PythonAnywhere | Render Free |
|---------|----------------|-------------|
| **Always-on** | ✅ Yes | ❌ Spins down |
| **Forever free** | ✅ Yes | ⚠️ 750 hrs/mo |
| **Cold starts** | ✅ None | ⚠️ ~30 seconds |
| **Setup** | 🟡 Medium | ✅ Easy |
| **RAM** | ⚠️ 512MB | ✅ More |
| **Requests/day** | ⚠️ 100k limit | ✅ Unlimited |

---

## When to Upgrade

Upgrade to **Hacker plan** ($5/month) when you need:
- Custom domain
- More storage (1GB+)
- Scheduled tasks
- Multiple web apps
- SSH access

---

## Next Steps

1. ✅ Backend deployed to PythonAnywhere
2. ⬜ Update mobile app with backend URL
3. ⬜ Test all API endpoints
4. ⬜ Monitor error logs for first few days
5. ⬜ Deploy mobile app to stores

---

## Support

- **Forums**: https://www.pythonanywhere.com/forums/
- **Help**: https://help.pythonanywhere.com/
- **Status**: https://status.pythonanywhere.com/

---

**Your forever-free backend is live! 🚀**