# BOND Mobile App - Quick Start Guide

## ✅ What's Been Built

The Phase 1 MVP of BOND mobile app is complete with:

### Core Features
1. **Authentication** ✓
   - Email/password signup & login
   - Secure Supabase Auth integration
   
2. **Partner Linking** ✓
   - 6-character Pair Code system
   - Couple Unit creation
   
3. **3 Assessment Modules** ✓
   - Love Languages (30 questions)
   - Attachment Style (20 questions)
   - Communication Style (15 questions)
   
4. **Assessment Experience** ✓
   - Question-by-question interface
   - Auto-save functionality
   - Progress tracking
   - Independent response system
   
5. **Dashboard** ✓
   - Partner status
   - Assessment progress
   - Streak counter
   - Quick actions

6. **Profile** ✓
   - User info display
   - Account settings
   - Logout

## 🗄️ Database Setup ✅

The database schema has been created in Supabase with:
- Users table with pair codes
- Couple units for partner linking
- Assessment sessions for responses
- Couple results for combined outcomes
- Row Level Security (RLS) policies

## 📱 How to Test the App

### Option 1: Expo Go (Recommended for Quick Testing)

1. **Install Expo Go on your phone**:
   - iOS: Download from App Store
   - Android: Download from Google Play

2. **Start the dev server**:
```bash
cd /app/mobile
npm start
```

3. **Scan the QR code**:
   - iOS: Use Camera app
   - Android: Use Expo Go app

4. **Test the flow**:
   - Sign up with email/password
   - Get your Pair Code
   - Share with partner (or create 2nd account to test)
   - Connect using Pair Code
   - Take an assessment
   - View results when both complete

### Option 2: iOS Simulator (macOS only)

```bash
cd /app/mobile
npm run ios
```

### Option 3: Android Emulator

```bash
cd /app/mobile  
npm run android
```

## 🧪 Test Scenarios

### Scenario 1: New User Flow
1. Open app → Welcome screen
2. Tap "Get Started"
3. Enter name, email, password
4. Sign up → Auto pair code generated
5. Go to Partner tab → See your pair code
6. Go to Assessments tab → See 3 available assessments

### Scenario 2: Partner Connection
1. User A: Share pair code (e.g., ABC-123)
2. User B: Create account
3. User B: Go to Partner tab
4. User B: Enter User A's pair code
5. User B: Tap "Connect"
6. Both users: See "Connected" status

### Scenario 3: Take Assessment
1. Go to Assessments tab
2. Tap "Love Languages" assessment
3. Answer questions (auto-saved)
4. Use Next/Previous to navigate
5. Tap "Submit" on last question
6. See notification about partner status
7. Partner completes same assessment
8. Both see results notification

### Scenario 4: Dashboard Updates
1. Dashboard shows:
   - Greeting with name
   - Partner status
   - Assessment count (0-3)
   - Streak counter
   - Progress bar

## 🎨 Design Preview

### Color Palette (Per PRD)
- **Primary (Deep Plum)**: #3D1A4F
- **Accent (Rose)**: #C2607A
- **Blush**: #F4C6CC
- **Gold**: #C9933C
- **Teal**: #1E8C8C

### Key Screens
1. **Welcome** - Purple background with heart icon
2. **Dashboard** - Blush header with stats cards
3. **Assessments** - List with icons and progress
4. **Partner** - Pair code display and connection
5. **Assessment Taking** - Card-based question interface
6. **Profile** - Avatar with account options

## 🔑 Test Credentials

You can create any test accounts:
```
Email: test@example.com
Password: test123
Name: Test User
```

## ⚠️ Known Limitations (Phase 1)

These are planned for Phase 2:
- ❌ No AI insights yet (GPT-4 integration)
- ❌ No radar charts for results visualization
- ❌ No daily check-ins
- ❌ No gamification (XP, badges)
- ❌ No in-app messaging
- ❌ No push notifications
- ❌ Only 3 of 16 assessments
- ❌ Basic results display (no detailed visualizations)

## 📊 Assessment Question Counts

1. **Love Languages**: 30 questions (Multiple choice)
   - Categories: Words, Time, Gifts, Acts, Touch
   
2. **Attachment Style**: 20 questions (5-point Likert scale)
   - Based on Bowlby & Ainsworth's research
   
3. **Communication Style**: 15 questions (5-point Likert scale)
   - Based on Nonviolent Communication (NVC)

## 🐛 Troubleshooting

### App won't start
```bash
cd /app/mobile
rm -rf node_modules
npm install
expo start -c
```

### Database errors
- Check Supabase dashboard is accessible
- Verify schema.sql was run successfully
- Check RLS policies are enabled
- View Supabase logs for errors

### Partner connection fails
- Ensure both users are logged in
- Verify pair code is exactly 6 characters
- Check couple_units table in Supabase
- Make sure not already connected to another partner

### Assessment not saving
- Check internet connection
- View browser/console logs
- Check assessment_sessions table in Supabase
- Verify user authentication is valid

## 📈 Next Steps for Full Production

### Phase 2 Features to Add:
1. AI Insights with OpenAI GPT-4
2. Radar chart visualizations (React Native ECharts)
3. Remaining 13 assessment modules
4. Daily check-ins
5. Activity library
6. Gamification system
7. Progress dashboard with graphs
8. In-app messaging
9. Push notifications
10. Onboarding flow (relationship stage, duration, goals)

### Technical Improvements:
1. Add error boundaries
2. Implement offline support
3. Add loading skeletons
4. Improve error messages
5. Add unit tests
6. Add E2E tests with Detox
7. Optimize images and assets
8. Add analytics (PostHog)
9. Add error monitoring (Sentry)
10. Implement CI/CD pipeline

## 💡 Tips for Development

1. **Hot Reload**: Edit files and see changes instantly
2. **Debug**: Shake device → "Debug Remote JS"
3. **Console**: Check terminal for logs
4. **Supabase Dashboard**: Monitor database in real-time
5. **Expo Dev Tools**: Press 'm' in terminal

## 📞 Getting Help

1. Check `/app/mobile/README.md` for detailed docs
2. Review Expo Router docs: https://docs.expo.dev/router
3. Supabase docs: https://supabase.com/docs
4. React Native Paper: https://reactnativepaper.com

---

**Status**: ✅ Phase 1 MVP Complete  
**Ready for**: User testing, Partner connection testing, Assessment flow testing  
**Next**: Add AI insights and visualization (Phase 2)
