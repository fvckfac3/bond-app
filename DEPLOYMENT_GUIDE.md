# BOND App - Deployment Guide

## 📱 **Architecture Overview**

BOND consists of 3 main components:
1. **Mobile App** (React Native/Expo) - iOS + Android
2. **Backend API** (FastAPI) - AI insights generation only
3. **Database** (Supabase) - PostgreSQL with real-time features

---

## 🚀 **Deployment Components**

### **1. Mobile App Deployment**

#### **Platform: iOS (App Store)**

**Requirements:**
- Apple Developer Account ($99/year)
- macOS computer with Xcode
- App Store Connect account

**Build Process:**
```bash
# Using EAS Build (Expo Application Services)
eas build --platform ios --profile production

# Or traditional method
expo prebuild
cd ios && xcodebuild archive...
```

**Steps:**
1. Configure `app.json` with bundle ID, version
2. Set up App Store Connect listing
3. Build production IPA
4. Upload via Xcode or Transporter
5. Submit for App Review (~1-3 days)
6. Release to App Store

**Costs:**
- Apple Developer: $99/year
- EAS Build: Free tier (limited builds) or $29/month

---

#### **Platform: Android (Google Play)**

**Requirements:**
- Google Play Developer Account ($25 one-time)
- Signing keystore

**Build Process:**
```bash
# Using EAS Build
eas build --platform android --profile production

# Generates AAB (Android App Bundle)
```

**Steps:**
1. Create signing keystore
2. Configure `app.json` with package name
3. Build production AAB/APK
4. Create Play Store listing
5. Upload AAB to Play Console
6. Submit for review (~few hours to 1 day)
7. Release to Play Store

**Costs:**
- Google Play: $25 one-time
- EAS Build: Free tier or $29/month

---

### **2. Backend API Deployment**

**Current Backend:** FastAPI server (only for AI insights generation)

**Deployment Options:**

#### **Option A: Vercel (Recommended - Easiest)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd /app/backend
vercel

# Set environment variables in Vercel dashboard
EMERGENT_LLM_KEY=sk-emergent-...
```

**Pros:**
- ✅ Free tier available
- ✅ Auto-scaling
- ✅ Easy deployment
- ✅ Built-in SSL

**Cons:**
- ❌ Serverless (cold starts)

---

#### **Option B: Railway.app**
```bash
# Connect GitHub repo
# Railway auto-deploys on push

# Or use CLI
railway up
```

**Pros:**
- ✅ $5/month credit free
- ✅ Always-on server
- ✅ Easy environment variables
- ✅ Auto SSL

**Cons:**
- ❌ Costs after free tier

**Cost:** $5-10/month

---

#### **Option C: DigitalOcean App Platform**
```bash
# Deploy via GitHub or Docker

# Dockerfile approach
docker build -t bond-backend .
docker push ...
```

**Pros:**
- ✅ $5/month starter
- ✅ Managed platform
- ✅ Scalable

**Cost:** $5-12/month

---

#### **Option D: AWS/GCP/Azure (Production Scale)**

**For serious production:**
- AWS Elastic Beanstalk
- Google Cloud Run
- Azure App Service

**Cost:** $20-100+/month depending on traffic

---

### **3. Database Deployment**

**Current: Supabase** ✅ Already Cloud-Hosted!

**What you already have:**
- PostgreSQL database (hosted)
- Real-time subscriptions
- Row Level Security
- Authentication
- Storage

**Supabase Pricing:**
- **Free Tier:** 
  - 500MB database
  - 2GB bandwidth
  - 50,000 monthly active users
  - Perfect for MVP/testing

- **Pro ($25/month):**
  - 8GB database
  - 50GB bandwidth
  - 100,000 MAU
  - Daily backups
  - Better support

- **Team ($599/month):**
  - Production-ready
  - 200GB+ database
  - Dedicated resources

**Migration if needed:**
- Supabase is open-source
- Can self-host if you outgrow it
- Export SQL anytime

---

## 📦 **Complete Deployment Architecture**

```
┌─────────────────────────────────────────┐
│         Mobile App (Users)              │
│    iOS App Store + Google Play          │
└─────────────┬───────────────────────────┘
              │
              ├──────────────┐
              │              │
              ▼              ▼
    ┌─────────────────┐  ┌──────────────────┐
    │   Supabase      │  │  Backend API     │
    │   (Database)    │  │  (AI Insights)   │
    │                 │  │                  │
    │ • PostgreSQL    │  │ • FastAPI        │
    │ • Auth          │  │ • GPT-5.1        │
    │ • Realtime      │  │ • Emergent Key   │
    │ • Storage       │  │                  │
    └─────────────────┘  └──────────────────┘
         Hosted               Deploy to:
      (Already!)          Railway/Vercel/DO
```

---

## 🔧 **Deployment Workflow**

### **Phase 1: Initial Deployment (MVP)**

**Week 1: Mobile App**
1. ✅ Configure app signing (iOS + Android)
2. ✅ Update app.json with production settings
3. ✅ Build production versions via EAS
4. ✅ Create App Store & Play Store listings
5. ✅ Submit for review

**Week 2: Backend**
1. ✅ Choose hosting (Railway recommended)
2. ✅ Set environment variables
3. ✅ Deploy FastAPI server
4. ✅ Update mobile app with production API URL
5. ✅ Test end-to-end

**Week 3: Testing & Launch**
1. ✅ Beta testing (TestFlight for iOS, Internal Testing for Android)
2. ✅ Fix bugs
3. ✅ Submit final versions
4. ✅ Launch! 🚀

---

### **Phase 2: Continuous Deployment (CI/CD)**

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy BOND

on:
  push:
    branches: [main]

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g eas-cli
      - run: eas build --platform ios --profile production --non-interactive

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g eas-cli
      - run: eas build --platform android --profile production --non-interactive

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: railway up # or vercel deploy
```

---

## 💰 **Cost Breakdown**

### **MVP Launch (First Year)**

| Component | Service | Cost |
|-----------|---------|------|
| iOS App | Apple Developer | $99/year |
| Android App | Google Play | $25 one-time |
| App Building | EAS Build Free Tier | $0 (or $29/mo) |
| Backend API | Railway | $5-10/month |
| Database | Supabase Free | $0 |
| AI Insights | Emergent LLM Key | Your existing credits |
| **Total Year 1** | | **~$200-500** |

### **Growth Phase (1,000+ users)**

| Component | Service | Cost |
|-----------|---------|------|
| iOS + Android | Developer Accounts | $99/year |
| App Building | EAS Build Pro | $29/month |
| Backend API | Railway/DO | $20-50/month |
| Database | Supabase Pro | $25/month |
| AI Insights | OpenAI API (own key) | $50-200/month |
| Push Notifications | Expo Push | Included |
| **Total/Month** | | **~$150-350/month** |

### **Scale (10,000+ users)**

| Component | Service | Cost |
|-----------|---------|------|
| Mobile Apps | Developer Accounts | $99/year |
| Backend | AWS/GCP (auto-scale) | $200-500/month |
| Database | Supabase Team | $599/month |
| AI | OpenAI API | $500-2000/month |
| CDN | CloudFlare | $20/month |
| Monitoring | Sentry | $26/month |
| **Total/Month** | | **~$1,400-3,200/month** |

---

## 🔒 **Environment Variables Setup**

### **Mobile App (.env)**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_BACKEND_URL=https://bond-api.railway.app
```

### **Backend API**
```bash
EMERGENT_LLM_KEY=sk-emergent-...
CORS_ORIGINS=https://your-domain.com,exp://
```

### **App Stores**
```bash
# iOS
APPLE_ID=your-apple-id
APPLE_TEAM_ID=ABC123

# Android
ANDROID_KEYSTORE_PASSWORD=***
ANDROID_KEY_ALIAS=bond-release
```

---

## 📊 **Deployment Checklist**

### **Pre-Launch**
- [ ] App Store listings created
- [ ] Privacy policy written
- [ ] Terms of service written
- [ ] App icons designed (all sizes)
- [ ] Screenshots prepared (all device sizes)
- [ ] Backend deployed and tested
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Push notifications configured
- [ ] Analytics set up (optional)
- [ ] Error tracking set up (Sentry)

### **iOS Specific**
- [ ] Bundle ID registered
- [ ] App Store Connect configured
- [ ] Provisioning profiles created
- [ ] Push notification certificates
- [ ] TestFlight beta testing

### **Android Specific**
- [ ] Package name registered
- [ ] Signing keystore created and backed up
- [ ] Play Store listing complete
- [ ] Google Play Services configured
- [ ] Internal testing track

### **Backend**
- [ ] Production database connected
- [ ] HTTPS/SSL enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Logging/monitoring set up
- [ ] Backup strategy in place

---

## 🔄 **Update Strategy**

### **Mobile App Updates**

**Over-The-Air (OTA) Updates** - Instant!
```bash
# Minor JS/React changes (no native code)
eas update --branch production

# Users get updates instantly, no app store review!
```

**Full App Store Updates** - For native changes
```bash
# Major updates, new features, native code changes
eas build --platform all --profile production
# Submit to stores, ~1-3 day review
```

**Version Strategy:**
- Patch (1.0.x): OTA updates
- Minor (1.x.0): Store updates
- Major (x.0.0): Store updates with marketing

---

## 📈 **Scaling Considerations**

### **At 100 Users**
- Supabase Free Tier ✅
- Railway $5/month ✅
- No issues

### **At 1,000 Users**
- Upgrade Supabase to Pro ($25/mo)
- Backend might need $20/mo tier
- Consider CDN for assets

### **At 10,000 Users**
- Supabase Team plan
- Dedicated backend server
- Load balancing
- Database read replicas
- Redis caching

### **At 100,000+ Users**
- Enterprise infrastructure
- Multi-region deployment
- Database sharding
- Dedicated DevOps team

---

## 🎯 **Recommended Launch Path**

### **For MVP/Initial Launch:**

1. **Mobile Apps:**
   - Use EAS Build free tier
   - Submit to both stores
   - Start with iOS first (faster review)

2. **Backend:**
   - Deploy to Railway ($5/mo)
   - Use Emergent LLM key
   - Simple, cost-effective

3. **Database:**
   - Supabase Free Tier
   - Already set up!

**Total: ~$130 first year**

### **When You Hit 500+ Active Users:**

1. Upgrade Supabase to Pro
2. Upgrade Railway to higher tier
3. Set up CI/CD
4. Add monitoring (Sentry)

### **When Revenue Positive:**

1. Move to own OpenAI key
2. Consider AWS/GCP for backend
3. Hire DevOps consultant
4. Professional monitoring suite

---

## 🛠️ **Tools & Services Summary**

| Need | Recommended Service | Alternative |
|------|-------------------|-------------|
| Mobile Build | EAS Build | Fastlane + Xcode |
| iOS Distribution | App Store | TestFlight |
| Android Distribution | Google Play | APK direct |
| Backend Hosting | Railway | Vercel, Render |
| Database | Supabase | AWS RDS, Firebase |
| AI | Emergent Key | OpenAI direct |
| Push Notifications | Expo Push | OneSignal, FCM |
| Error Tracking | Sentry | LogRocket |
| Analytics | PostHog | Mixpanel, Amplitude |
| CI/CD | GitHub Actions | CircleCI, Bitrise |

---

## 📝 **Next Steps for Deployment**

1. **Create accounts:**
   - [ ] Apple Developer ($99)
   - [ ] Google Play Console ($25)
   - [ ] Expo account (free)
   - [ ] Railway account (free)

2. **Prepare assets:**
   - [ ] App icon (1024x1024)
   - [ ] Screenshots (multiple sizes)
   - [ ] Privacy policy
   - [ ] App description

3. **Configure build:**
   - [ ] Update app.json with production settings
   - [ ] Set up signing credentials
   - [ ] Configure environment variables

4. **Deploy backend:**
   - [ ] Choose hosting service
   - [ ] Deploy FastAPI server
   - [ ] Test AI insights endpoint

5. **Build mobile apps:**
   - [ ] `eas build --platform all --profile production`
   - [ ] Download builds
   - [ ] Upload to stores

6. **Launch! 🚀**

---

**The app is production-ready! Everything is built and tested. You just need to go through the deployment process.**

**Estimated time to launch: 1-2 weeks**
**Estimated cost (first year): $200-500**
