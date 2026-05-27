# BOND App - Screenshot Guide
## Complete Step-by-Step Instructions

---

## Why Screenshots Matter

App Store & Google Play require screenshots to:
- Show users what your app looks like
- Highlight key features
- Convert downloads (good screenshots = more downloads!)
- Meet submission requirements

---

## Equipment & Software Needed

### Hardware:
- iPhone (any model) OR Android phone
- OR iOS Simulator (macOS only)
- OR Android Emulator

### Software:
- Expo Go app installed on phone
- BOND app running
- Optional: Screenshot framing tools

---

## Screenshot Requirements

### iOS App Store:

**Required Sizes:**
1. **6.7" Display** (iPhone 14 Pro Max, 15 Pro Max)
   - 1290 x 2796 pixels
   - 6-10 screenshots

2. **6.5" Display** (iPhone 11 Pro Max, XS Max)
   - 1242 x 2688 pixels
   - Same screenshots as 6.7"

3. **5.5" Display** (iPhone 8 Plus)
   - 1242 x 2208 pixels
   - Same screenshots

**Optional:**
- iPad Pro 12.9" - 2048 x 2732 pixels
- iPad Pro 11" - 1668 x 2388 pixels

### Google Play Store:

**Required:**
1. **Phone Screenshots**
   - Minimum: 1080 x 1920 pixels
   - At least 2 screenshots, max 8

2. **Feature Graphic** (REQUIRED)
   - 1024 x 500 pixels
   - Shows at top of Play Store listing

**Optional:**
- Tablet screenshots
- 7" tablet: 1200 x 1920 px
- 10" tablet: 1600 x 2560 px

---

## Step-by-Step: Taking Screenshots

### Method 1: Real Device (Recommended)

#### On iPhone:

1. **Setup:**
   ```
   - Install Expo Go from App Store
   - Ensure good WiFi connection
   - Clean up notification/status bar
   ```

2. **Run App:**
   ```bash
   cd /app/mobile
   npm start
   ```

3. **Load on Phone:**
   - Open Expo Go app
   - Scan QR code from terminal
   - Wait for app to load

4. **Take Screenshots:**
   - **Press: Side Button + Volume Up** (simultaneously)
   - Screenshot saved to Photos
   - You'll see a thumbnail in bottom-left

5. **Navigate & Capture:**
   - Take screenshots of each required screen (see list below)
   - Keep status bar clean
   - Use real but anonymous data

#### On Android:

1. **Setup:**
   ```
   - Install Expo Go from Play Store
   - Good WiFi
   - Clear notifications
   ```

2. **Run & Load:**
   - Same as iPhone
   - Scan QR in Expo Go app

3. **Take Screenshots:**
   - **Press: Power + Volume Down** (simultaneously)
   - Screenshot in Gallery
   - Notification shows thumbnail

---

### Method 2: iOS Simulator (macOS Only)

```bash
# Start simulator
npm run ios

# Take screenshot
# Menu: File → New Screen Shot
# Or: Cmd + S

# Screenshots saved to Desktop
```

**Pros:**
- Perfect quality
- Easy to retake
- Clean status bar

**Cons:**
- Needs macOS
- Slower than device

---

### Method 3: Android Emulator

```bash
# Start emulator
npm run android

# Take screenshot
# Emulator toolbar → Camera icon
# Or: Cmd/Ctrl + S

# Saved to: ~/Pictures/
```

---

## Required Screenshots (In Order)

Take these **7 screenshots**:

### 1. Welcome/Splash Screen
**Screen:** App launch → Welcome screen  
**Shows:** 
- BOND logo/heart icon
- "Welcome to BOND" text
- "Get Started" button
- Clean, professional first impression

**How:**
- Fresh app launch
- Wait for splash to finish
- Capture welcome screen

---

### 2. Dashboard (Connected)
**Screen:** Main dashboard after partner connection  
**Shows:**
- "Welcome back, [Name]" greeting
- Partner status
- Assessment progress
- Stats (streak, completed assessments)
- Quick action buttons

**How:**
- Login with test account
- Connect with partner (or mock data)
- Navigate to Dashboard tab
- Capture

**Tips:**
- Use realistic names ("Sarah & John")
- Show some progress (2/3 assessments)
- Clean, active streak

---

### 3. Assessments Library
**Screen:** Assessments tab  
**Shows:**
- All 16 assessments visible
- Icons and names
- "Available" vs "Completed" status
- Progress bar at top
- Beautiful card layout

**How:**
- Tap Assessments tab
- Scroll to show variety
- Capture with mix of statuses

**Tips:**
- Show 3-4 assessments in view
- Mix of completed/available
- Colorful icons visible

---

### 4. Assessment In Progress
**Screen:** Taking an assessment  
**Shows:**
- Question text
- Answer options (radio buttons)
- Progress bar (e.g., "Question 5 of 30")
- Clean interface
- Next/Previous buttons

**How:**
- Start any assessment
- Navigate to middle question (not first)
- Select an answer
- Capture before hitting Next

**Tips:**
- Show interesting question
- One option selected
- Progress visible

---

### 5. Results with AI Insights
**Screen:** Assessment results screen  
**Shows:**
- Compatibility score
- Score comparison charts/bars
- AI-generated narrative
- Growth recommendations
- Beautiful, professional layout

**How:**
- View completed assessment results
- Scroll to show AI insights
- Capture with insights visible

**Tips:**
- Real-looking AI text (generate once)
- Charts/scores visible
- Positive, encouraging tone

---

### 6. Messages/Chat
**Screen:** In-app messaging  
**Shows:**
- Chat interface
- Messages between partners
- Different colored bubbles
- Timestamps
- Input field

**How:**
- Navigate to Messages tab
- Send few test messages
- Mix of sent/received
- Capture conversation

**Tips:**
- Use loving/supportive messages
- "I appreciate you" type content
- Clean, modern chat UI

---

### 7. Progress Dashboard
**Screen:** Progress/Stats screen  
**Shows:**
- Stats grid (assessments, activities, etc.)
- Streak counter with fire emoji
- Recent check-ins
- Milestones
- Achievement feel

**How:**
- Navigate to Progress tab
- Ensure some data exists
- Capture full view

**Tips:**
- Show active streak
- Some achievements
- Colorful, engaging

---

## Bonus Screenshots (Optional but Recommended)

### 8. Daily Check-In Modal
- Shows the check-in interface
- Slider, mood input
- Demonstrates daily engagement

### 9. Activity Library
- Shows variety of activities
- Categories
- Engaging content

### 10. Partner Pair Code
- Shows connection process
- Unique feature highlight

---

## After Taking Screenshots

### 1. Transfer to Computer

**iPhone:**
- AirDrop to Mac
- Or: USB cable → Import in Photos app
- Or: iCloud Photos sync

**Android:**
- USB cable → File transfer
- Or: Google Photos sync
- Or: Email to yourself

---

### 2. Check Quality

✅ **Good Screenshot:**
- Clear, sharp text
- No blur
- Clean status bar
- Proper orientation (portrait)
- Realistic data
- Professional look

❌ **Bad Screenshot:**
- Blurry text
- Cluttered notifications
- Lorem ipsum / fake data obvious
- Cut-off content
- Poor lighting/colors

---

### 3. Add Device Frames (Optional but Recommended)

Makes screenshots look professional!

**Tools:**

1. **Mockuphone** (Free)
   - https://mockuphone.com
   - Upload screenshot
   - Choose device (iPhone 14 Pro, etc.)
   - Download with frame

2. **Smartmockups** (Freemium)
   - https://smartmockups.com
   - More options
   - Better quality
   - Some free templates

3. **Shotsnapp** (Free)
   - https://shotsnapp.com
   - Quick and easy
   - Clean frames

4. **Apple Screenshots** (Free, Mac only)
   - Use Simulator screenshots
   - Already have perfect frames

**Steps:**
1. Upload screenshot
2. Select device (iPhone 14 Pro Max for 6.7")
3. Choose background (gradient/solid)
4. Download PNG

---

### 4. Resize if Needed

If screenshots aren't exact size:

**Online Tools:**
- https://www.iloveimg.com/resize-image
- Set exact pixels (e.g., 1290 x 2796)
- Don't upscale (quality loss)

**Photoshop/Figma:**
- Canvas size
- Exact dimensions
- Export PNG

---

### 5. Organize Files

Create folder structure:
```
/app/screenshots/
├── ios/
│   ├── 6.7-inch/
│   │   ├── 01-welcome.png
│   │   ├── 02-dashboard.png
│   │   ├── 03-assessments.png
│   │   ├── 04-in-progress.png
│   │   ├── 05-results.png
│   │   ├── 06-messages.png
│   │   └── 07-progress.png
│   ├── 6.5-inch/ (same files)
│   └── 5.5-inch/ (same files)
└── android/
    ├── phone/
    │   ├── 01-welcome.png
    │   └── ... (same 7 screenshots)
    └── feature-graphic.png
```

---

## Creating Feature Graphic (Android Only)

**Required:** 1024 x 500 pixels

**What to include:**
- BOND logo/name
- Tagline: "Relationship Wellness, Backed by Science"
- Key visual (heart, couple icon)
- Clean, professional design

**Tools:**
1. **Canva** (Easiest)
   - Template: "Google Play Feature Graphic"
   - Drag & drop
   - Free account

2. **Figma** (Pro)
   - Create 1024 x 500 frame
   - Design
   - Export PNG

3. **Photoshop**
   - New document 1024 x 500
   - Design
   - Export

**Tips:**
- Use BOND colors (Deep Plum, Rose, Blush)
- Include app icon
- Keep text large & readable
- Test how it looks at small size

---

## Uploading to Stores

### App Store Connect (iOS):

1. Go to https://appstoreconnect.apple.com
2. My Apps → Your App → App Store tab
3. Scroll to "App Previews and Screenshots"
4. Select device size (6.7")
5. Drag & drop screenshots
6. **Order matters!** First screenshot is most important
7. Repeat for other sizes
8. Save

**Order recommendations:**
1. Dashboard (shows connected experience)
2. Results with AI (unique feature)
3. Assessments library (variety)
4. Assessment in progress (engagement)
5. Messages (connection)
6. Progress (achievement)
7. Welcome (call to action)

---

### Google Play Console (Android):

1. Go to https://play.google.com/console
2. Your App → Store presence → Main store listing
3. Scroll to "Phone screenshots"
4. Click "Add screenshots"
5. Upload (drag & drop)
6. **Add Feature Graphic**
7. Save

**Note:** Google Play shows first 2 screenshots prominently

---

## Pro Tips

### 1. Use Realistic Data
❌ "Test User" "test@test.com"  
✅ "Sarah" "Michael" realistic messages

### 2. Show Value
- Highlight AI insights
- Show progress/achievements
- Demonstrate couple connection

### 3. Clean UI
- No debug info
- Hide dev warnings
- Clean status bar
- Good time (9:41 AM classic)

### 4. Consistent Branding
- Use BOND colors
- Consistent framing
- Professional feel

### 5. Highlight Unique Features
- AI insights (competitive advantage)
- 16 assessments (comprehensive)
- Couple connection (differentiator)

---

## Checklist

**Before:**
- [ ] App running smoothly
- [ ] Test accounts created
- [ ] Partner connected (or mocked)
- [ ] Some data in app (assessments done)
- [ ] Clean device/simulator

**Screenshots:**
- [ ] Welcome screen
- [ ] Dashboard
- [ ] Assessments list
- [ ] Assessment in progress
- [ ] Results with AI
- [ ] Messages
- [ ] Progress

**Processing:**
- [ ] Transferred to computer
- [ ] Quality checked
- [ ] Device frames added (optional)
- [ ] Resized if needed
- [ ] Organized in folders

**Android Specific:**
- [ ] Feature graphic created (1024x500)

**Uploading:**
- [ ] iOS: All 3 sizes uploaded
- [ ] Android: Screenshots uploaded
- [ ] Android: Feature graphic uploaded
- [ ] Order optimized
- [ ] Saved in store dashboard

---

## Estimated Time

| Task | Time |
|------|------|
| Setup & run app | 5 min |
| Take 7 screenshots | 15 min |
| Transfer to computer | 5 min |
| Add device frames | 10 min |
| Create feature graphic | 15 min |
| Upload to stores | 10 min |
| **Total** | **60 min** |

---

## Common Issues & Solutions

### Issue: Screenshots blurry
**Solution:** Take on real device, not emulator

### Issue: Wrong size
**Solution:** Resize with iloveimg.com to exact pixels

### Issue: Can't see status bar
**Solution:** Swipe down from top first

### Issue: Content cut off
**Solution:** Use full screen mode, hide navigation during screenshot

### Issue: App crashes when screenshotting
**Solution:** Use simulator/emulator instead

---

## Need Help?

- **iOS Guidelines:** https://developer.apple.com/app-store/product-page/
- **Android Guidelines:** https://support.google.com/googleplay/android-developer/answer/9866151
- **Mockup Tools:** https://mockuphone.com

---

**You've got this! 📸 Good screenshots can significantly increase downloads!**
