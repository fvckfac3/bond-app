# BOND - Relationship Wellness Platform (Mobile MVP)

A science-backed mobile application designed to help romantic partners deepen their connection through validated psychological assessments and personalized insights.

## 🚀 Phase 1 MVP Features

### ✅ Completed Features
- **Authentication System**
  - Email/password signup and login
  - Secure session management with Supabase Auth
  
- **Partner Linking**
  - Unique 6-character Pair Code generation
  - Partner connection system
  - Couple Unit formation

- **Assessment System** (3 Core Modules)
  - Love Languages Assessment (30 questions - Chapman's Five Love Languages)
  - Attachment Style Assessment (20 questions - Attachment Theory)
  - Communication Style Assessment (15 questions - Nonviolent Communication)
  - Independent response system (blind submission)
  - Auto-save functionality
  - Progress tracking

- **Results & Insights**
  - Couple results comparison
  - Compatibility scoring
  - Waiting for partner completion notification

- **Dashboard**
  - Welcome screen with personalized greeting
  - Partner status display
  - Pair code sharing
  - Assessment progress tracking
  - Streak counter

- **Profile Management**
  - User profile display
  - Account settings
  - Logout functionality

## 🛠 Tech Stack

- **Frontend**: React Native (Expo SDK 55)
- **Routing**: Expo Router (file-based routing)
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: React Native Paper
- **State Management**: Zustand + React Query
- **Icons**: MaterialCommunityIcons

## 📁 Project Structure

```
/app/mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                  # Authentication screens
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                  # Main app tabs
│   │   ├── dashboard.tsx
│   │   ├── assessments.tsx
│   │   ├── partner.tsx
│   │   └── profile.tsx
│   ├── assessment/              # Assessment taking
│   │   └── [id].tsx
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Splash screen
├── services/
│   └── supabase.js              # Supabase client config
├── constants/
│   └── theme.js                 # Design tokens & colors
├── utils/
│   ├── assessments.js           # Assessment data & questions
│   └── pairCode.js              # Pair code utilities
└── package.json

/app/supabase/
└── schema.sql                    # Database schema & RLS policies
```

## 🎨 Design System

Based on PRD specifications:

### Colors
- **Primary**: #3D1A4F (Deep Plum) - Headings, primary buttons
- **Accent**: #C2607A (Rose) - CTAs, highlights
- **Blush**: #F4C6CC - Backgrounds, cards
- **Gold**: #C9933C - Achievement badges
- **Teal**: #1E8C8C - Positive insights

### Frameworks Referenced
- **Love Languages**: Chapman's Five Love Languages
- **Attachment**: Bowlby & Ainsworth's Attachment Theory
- **Communication**: Rosenberg's Nonviolent Communication (NVC)

## 📊 Database Schema

### Core Tables
- `users` - User profiles with pair codes
- `couple_units` - Partner connections
- `assessments` - Assessment metadata
- `assessment_sessions` - Individual user responses
- `couple_results` - Combined assessment results
- `daily_checkins` - Daily connection tracking (Phase 2)
- `streaks` - Engagement tracking

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data and coupled partner data
- Immutable assessment submissions after completion

## 🔐 Environment Variables

Create `/app/mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ LTS
- Expo Go app on your mobile device
- Supabase account with project set up

### Installation

1. **Install dependencies**:
```bash
cd /app/mobile
npm install
```

2. **Set up Supabase**:
   - Create a Supabase project
   - Run the schema from `/app/supabase/schema.sql` in SQL Editor
   - Get your project URL and anon key
   - Update `.env` file

3. **Start the development server**:
```bash
npm start
```

4. **Run on device**:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator (macOS only)

## 📱 User Flows

### 1. Onboarding Flow
1. Welcome screen → Sign up
2. Create account (name, email, password)
3. Automatic pair code generation
4. Invite partner or continue solo

### 2. Partner Linking
1. User A shares their pair code
2. User B enters pair code in Partner tab
3. Couple Unit created
4. Both users can now take assessments

### 3. Assessment Flow
1. Select assessment from Assessments tab
2. Answer questions (auto-saved)
3. Navigate with Previous/Next buttons
4. Submit when complete
5. Wait for partner to complete
6. View combined results when both done

### 4. Independent Response System
- Each partner answers independently
- Answers are hidden until both complete
- Submissions are immutable (timestamped & hashed)
- Results revealed simultaneously

## 🔄 Phase 2 Roadmap (Not Yet Implemented)

- **AI-Powered Insights**: GPT-4 integration for narrative summaries
- **Visualization**: Radar/spider charts using React Native ECharts
- **Daily Check-ins**: Morning connection tracking
- **Activity Library**: Conversation starters, challenges, journals
- **Gamification**: XP, levels, badges, achievements
- **Progress Dashboard**: Longitudinal graphs, trends
- **In-App Messaging**: Private couple communication
- **Push Notifications**: Reminders and partner activity alerts
- **Remaining 13 Assessments**: Gottman, EFT, Values, etc.

## 🧪 Testing

### Test Data IDs
All interactive elements include `data-testid` attributes for testing:
- `get-started-btn`
- `login-btn`
- `signup-submit-btn`
- `pair-code-input`
- `connect-partner-btn`
- `assessment-{id}`
- `submit-assessment-btn`
- etc.

### Manual Testing Checklist
- [ ] Sign up new account
- [ ] Log in with existing account
- [ ] Generate and share pair code
- [ ] Connect with partner using pair code
- [ ] Complete Love Languages assessment
- [ ] Complete Attachment Style assessment
- [ ] View assessment progress on dashboard
- [ ] Check couple results when both partners complete
- [ ] Log out and log back in

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot connect to Supabase"**
   - Check `.env` file has correct credentials
   - Verify Supabase project is active
   - Check internet connection

2. **"Assessment not loading"**
   - Ensure database schema is properly set up
   - Check RLS policies are enabled
   - Verify user is authenticated

3. **"Partner not connecting"**
   - Ensure both users have created accounts
   - Verify pair code is entered correctly (6 characters)
   - Check couple_units table in Supabase dashboard

4. **Expo errors**
   - Clear cache: `expo start -c`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Update Expo: `npm install expo@latest`

## 📝 Development Notes

### Key Architectural Decisions

1. **Expo Router over React Navigation**: File-based routing for better DX
2. **Supabase over custom backend**: Faster MVP development, built-in auth & RLS
3. **React Native Paper**: Material Design components for consistency
4. **Auto-save on assessments**: Better UX, prevents data loss

### Code Quality
- TypeScript-ready (`.tsx` files)
- Consistent styling with design tokens
- Accessibility: `data-testid` attributes on all interactive elements
- Error handling with user-friendly alerts

## 👥 Contributing

This is an MVP. Future enhancements should:
- Follow existing code structure
- Maintain design system consistency
- Add proper error handling
- Include test IDs for new components
- Update this README

## 📄 License

Proprietary - BOND Relationship Wellness Platform

---

## 📞 Support

For issues or questions:
1. Check Troubleshooting section above
2. Review Supabase dashboard for database issues
3. Check Expo error messages in terminal
4. Verify environment variables are set correctly

---

**Version**: 1.0.0 (Phase 1 MVP)  
**Last Updated**: January 2025  
**Status**: ✅ Core features complete, ready for testing
