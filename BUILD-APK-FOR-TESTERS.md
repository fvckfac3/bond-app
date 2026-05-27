# BOND App — Zero to Testable APK

This guide takes you from having the source code to handing a working APK to testers. No prior knowledge needed.

---

## Phase 0: Understand What You're Working With

```
/BOND/app-main/
├── mobile/          # React Native/Expo app (this is what becomes the APK)
│   ├── app/         # Screens (auth, tabs, assessments, results, subscription)
│   ├── components/  # UI components (modals, badges, buttons, animated)
│   ├── services/    # Supabase client, analytics, push notifications
│   ├── constants/   # Theme colors/fonts
│   ├── utils/       # Assessment data, pair code logic
│   ├── eas.json     # Build configuration (already done ✅)
│   ├── app.json     # App configuration (already done ✅)
│   └── package.json # Dependencies (already done ✅)
├── supabase/
│   ├── schema.sql   # Database tables + Row Level Security policies
│   └── ...          # Payment tables, phase2 schema
├── backend/         # Python Flask server (AI insights, payments)
├── legal/           # Privacy Policy + Terms of Service
└── BUILD_APK_GUIDE.md  # Existing build guide (partial)
```

**The APK comes from the `mobile/` directory only.**

---

## Phase 1: Create Your Accounts

### 1.1 — Expo Account (Required for building)

1. Go to **https://expo.dev/signup**
2. Sign up with email or GitHub
3. Free tier is fine for now — gives you unlimited builds on EAS

### 1.2 — Supabase Account (Required for the app to function)

1. Go to **https://supabase.com**
2. Create a new project
3. Choose the **free tier** (generous limits for testing)
4. Note your **Project URL** and **anon/public key** from Settings → API
5. Set a strong database password and save it somewhere

**IMPORTANT**: Supabase is the database — without it, the app has no auth, no partner linking, no assessments, nothing.

---

## Phase 2: Set Up the Database

### 2.1 — Create the Database Schema

In your Supabase project dashboard:

1. Go to **SQL Editor** (left sidebar)
2. Create a **new query**
3. Copy the contents of `/BOND/app-main/supabase/schema.sql` and paste it in
4. Click **Run** (or Cmd+Enter)

This creates all the tables:
- `users` — user profiles with pair codes
- `couple_units` — partner relationships
- `assessments` — assessment metadata
- `assessment_sessions` — individual responses (blind/hidden until both complete)
- `couple_results` — combined results shown to both partners

4. Then run `schema_phase2.sql` the same way (if you want Phase 2 features)
5. Then run `payment_tables_schema.sql` (for subscription features)

### 2.2 — Verify It Worked

In Supabase → Table Editor, you should see:
- `users`
- `couple_units`
- `assessments`
- `assessment_sessions`
- `couple_results`

If you see them all, the database is ready.

---

## Phase 3: Configure the App

### 3.1 — Create the `.env` File

Navigate to `/BOND/app-main/mobile/` and create a file called `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Supabase Dashboard → Settings → API
- Project URL: shown at the top of the page
- `supabaseUrl`: the URL field
- `supabaseAnonKey`: the `anon` key under "Project API keys"

⚠️ The anon key is public — it's safe to use in mobile apps. The Row Level Security (RLS) policies in the schema protect the data.

### 3.2 — Update app.json with Your Expo Project ID

In `/BOND/app-main/mobile/app.json`, update this line:

```json
"extra": {
  "eas": {
    "projectId": "UPDATE-THIS-WITH-YOUR-EXPO-PROJECT-ID"
  }
}
```

To get your project ID:
1. Go to **https://expo.dev**
2. Click your app (or create it by running `eas build` once)
3. The project ID is in the URL: `expo.dev/projects/PROJECT-ID-HERE`

### 3.3 — Install Dependencies

```bash
cd /BOND/app-main/mobile
npm install
```

This installs all 40+ packages in `package.json`. It may take 2-3 minutes.

---

## Phase 4: Test the App (Before Building an APK)

Before spending 15-20 minutes building an APK, make sure the app actually works:

### 4A — Test with Expo Go (Fastest)

1. Start the dev server:
   ```bash
   cd /BOND/app-main/mobile
   npm start
   ```

2. Open the Expo Go app on your phone
3. Scan the QR code shown in the terminal

The app loads and runs — no APK needed. You can test every screen, sign up, take assessments, link partners.

**This confirms the app works before you build.**

### 4B — Test the Web Version

```bash
cd /BOND/app-main/mobile
npm run web
```

Opens in your browser. Limited (no push notifications, no native features) but lets you verify the flow.

---

## Phase 5: Build the APK

**Time required: ~15-20 minutes (first build); ~10 minutes (subsequent)**

### 5.1 — Install EAS CLI

```bash
npm install -g eas-cli
```

### 5.2 — Log In to Expo

```bash
eas login
```

Enter your Expo credentials.

### 5.3 — Configure EAS (Already Done)

The `eas.json` file in `/BOND/app-main/mobile/` is already configured with:
- `preview` profile → builds an APK (for testers)
- `production` profile → builds an APK (for release)

No changes needed.

### 5.4 — Build the APK

```bash
cd /BOND/app-main/mobile

# For TESTING (internal testers, no store submission)
eas build --platform android --profile preview

# OR for PRODUCTION (if you want to submit to Play Store)
eas build --platform android --profile production
```

You'll see something like:
```
✔ Logged in as @yourusername
✔ Packaged 100% files
✔ Uploading to EAS...
✔ Build started...
🔗 https://expo.dev/accounts/YOUR-USERNAME/projects/bond-app/builds/BUILD-ID
```

### 5.5 — Wait for the Build

EAS builds in the cloud. First build takes **15-20 minutes**. Subsequent builds are faster (~10 mins).

You'll get an email when it's done, plus the URL in the terminal.

### 5.6 — Download the APK

1. Open the build URL: `https://expo.dev/accounts/YOUR-USERNAME/projects/bond-app/builds/BUILD-ID`
2. Click **Download** (Android icon)
3. Save `BOND-1.0.0.apk` to your computer

---

## Phase 6: Install on Testers' Phones

### 6.1 — Get the APK onto an Android Phone

**Option A — Direct transfer (easiest):**
1. Email the APK to yourself (or use Google Drive, Dropbox)
2. Open the email/Drive on your Android phone
3. Download the APK
4. Tap to install

**Option B — QR code:**
1. Host the APK online (Google Drive, Dropbox, your own hosting)
2. Get the direct download link
3. Generate a QR code at `https://qrcode.me/`
4. Testers scan the QR code and download

**Option C — ADB (for developers):**
```bash
adb install path/to/BOND-1.0.0.apk
```

### 6.2 — Allow Installation from Unknown Sources

On Android (varies by phone):
- Settings → Security → Unknown Sources → Allow
- Or: When prompted during install, tap "Settings" → Allow

---

## Phase 7: Pre-Launch Checklist

Before sending to testers, verify:

### App Configuration
- [ ] Supabase URL and anon key are in `.env`
- [ ] Database schema has been run in Supabase
- [ ] `app.json` has your Expo project ID
- [ ] `eas.json` exists and is correct

### Authentication Flow
- [ ] New user can sign up
- [ ] New user can log in
- [ ] Pair code is generated on signup
- [ ] Log out works

### Partner Linking
- [ ] User A can see their pair code
- [ ] User B can enter User A's pair code
- [ ] Both users see the linked partner status
- [ ] Both can see the "Couple Unit" formed

### Assessments
- [ ] Love Languages assessment loads (30 questions)
- [ ] Attachment Style assessment loads (20 questions)
- [ ] Communication Style assessment loads (15 questions)
- [ ] Answers auto-save between questions
- [ ] Submit locks the answers (immutable)
- [ ] Both partners see "Waiting for partner..." before completing

### Results
- [ ] Results screen shows after both partners complete
- [ ] Both partners see the same results
- [ ] Results include compatibility score and insights

### Subscription/Paywall (if enabled)
- [ ] Paywall appears for locked features
- [ ] Premium badge shows for paid users

### Push Notifications
- [ ] Notification permission is requested
- [ ] Notifications fire for partner actions (if configured)

---

## Troubleshooting

### "Cannot connect to Supabase"
- Check `.env` has the correct URL and anon key
- Verify your Supabase project is not paused (free tier sleeps after 7 days of inactivity — log in to wake it)
- Test the URL in a browser — should return JSON

### "Build fails"
- Run `eas build:configure` to re-check configuration
- Make sure you're logged in: `eas whoami`
- Check build logs at the build URL

### "APK installs but immediately crashes"
- The most likely cause: missing or wrong Supabase credentials
- Connect phone to computer and run `adb logcat | grep -i bond` to see the crash logs
- Common fix: double-check the anon key has no extra characters/spaces

### "Assessment not loading"
- Check Supabase SQL Editor — did the schema run successfully?
- In Supabase → Table Editor, is the `assessments` table populated? You may need to seed it with the 3 assessment records

### "Partner code not linking"
- Check `pair_codes` table has the right entry
- Pair code must be exact (uppercase, 6 characters)
- Both users must be on the same Supabase project

---

## Seed the Assessments Table (Important!)

The schema creates the `assessments` table but it may be empty. The app needs assessment records to exist in order to display them. Run this in Supabase SQL Editor:

```sql
INSERT INTO assessments (id, title, description, type, question_count, is_active)
VALUES
  ('love-languages', 'Love Languages', 'Discover your primary way of expressing and receiving love', 'love_languages', 30, true),
  ('attachment-style', 'Attachment Style', 'Understand your attachment pattern in relationships', 'attachment_style', 20, true),
  ('communication-style', 'Communication Style', 'Learn how you communicate and resolve conflicts', 'communication_style', 15, true);
```

Without this, the Assessments tab will be empty.

---

## Summary: The Shortest Path

```
1. Create Expo account          → expo.dev/signup
2. Create Supabase project      → supabase.com
3. Run schema.sql in Supabase    → Creates all tables
4. Seed assessments table        → 3 assessment records
5. Create mobile/.env            → Supabase URL + anon key
6. Update app.json project ID    → From Expo dashboard
7. npm install                   → Install dependencies
8. npm start                     → Test with Expo Go first
9. eas build --platform android --profile preview → Build APK
10. Download APK + share         → Send to testers
```

Expected time to first APK: **~45-60 minutes** (most of it waiting for the cloud build).