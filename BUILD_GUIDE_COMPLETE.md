# BOND App - Complete APK & IPA Build Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Android APK/AAB Build](#android-build)
3. [iOS IPA Build](#ios-build)
4. [Testing Builds](#testing)
5. [Troubleshooting](#troubleshooting)

---

# Prerequisites

## Required Accounts
- ✅ **Expo Account**: Sign up at https://expo.dev (FREE)
- 🍎 **Apple Developer Account**: $99/year (Required for iOS)
- 🤖 **Google Play Console**: $25 one-time fee (For Play Store)

## Required Software
```bash
# Install Node.js 18+ (if not installed)
# Download from: https://nodejs.org

# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version
```

## Project Setup
```bash
cd /app/mobile

# Login to Expo
eas login
# Enter your Expo username and password

# Initialize EAS in your project
eas build:configure
```

This will create `/app/mobile/eas.json` configuration file.

---

# Android Build

## Step 1: Configure eas.json

Edit `/app/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug",
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "simulator": false
      }
    },
    "production-apk": {
      "extends": "production",
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 2: Configure app.json

Update `/app/mobile/app.json`:

```json
{
  "expo": {
    "name": "BOND",
    "slug": "bond-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#F4C6CC"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.bond",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundColor": "#F4C6CC"
      },
      "package": "com.yourcompany.bond",
      "versionCode": 1,
      "permissions": [
        "INTERNET",
        "CAMERA",
        "NOTIFICATIONS"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID_HERE"
      }
    }
  }
}
```

**Important**: Get your project ID by running `eas project:info` after first build.

## Step 3: Build APK (Installable)

### For Testing (APK)
```bash
cd /app/mobile

# Build APK for direct installation
eas build --profile preview --platform android
```

**What happens:**
1. EAS uploads your code to Expo servers
2. Builds in the cloud (takes 10-20 minutes)
3. Provides download link when complete

**Output:**
```
✅ Build complete!
🔗 https://expo.dev/accounts/[username]/projects/bond-app/builds/[build-id]
```

### For Google Play Store (AAB)
```bash
eas build --profile production --platform android
```

This creates an AAB file required for Play Store submission.

## Step 4: Download & Install APK

### Download:
1. Go to the build URL provided
2. Click "Download" button
3. Save `bond-1.0.0.apk` to your computer

### Install on Android Device:

**Method 1: Direct Download**
1. Send the build URL to your Android phone
2. Open URL in browser
3. Tap "Download APK"
4. Open downloaded file
5. Allow "Install from Unknown Sources" if prompted
6. Tap "Install"

**Method 2: ADB Install**
```bash
# Connect phone via USB (enable USB debugging first)
adb devices

# Install APK
adb install path/to/bond-1.0.0.apk
```

**Method 3: QR Code**
```bash
# Generate QR code for easy sharing
eas build:run --platform android
```

---

# iOS Build

## Step 1: Apple Developer Setup

### Requirements:
- 🍎 Apple Developer Account ($99/year)
- 💻 Mac computer (for final testing)
- 🎯 App Store Connect access

### Register App ID:
1. Go to https://developer.apple.com/account
2. Click "Certificates, Identifiers & Profiles"
3. Click "Identifiers" → "+" button
4. Select "App IDs" → "Continue"
5. Enter:
   - Description: BOND
   - Bundle ID: `com.yourcompany.bond` (must match app.json)
6. Select capabilities: Push Notifications
7. Click "Continue" → "Register"

## Step 2: Build IPA

### For TestFlight (Internal Testing):
```bash
cd /app/mobile

# Build for iOS
eas build --profile production --platform ios
```

**EAS will ask:**
1. "Generate a new Apple Distribution Certificate?"
   - Answer: **Yes** (first time)
   
2. "Generate a new Apple Provisioning Profile?"
   - Answer: **Yes** (first time)

3. You'll need to login with your Apple ID
   - Enter Apple ID email
   - Enter password
   - Enter 2FA code if prompted

**Build time**: 20-30 minutes

### For Ad Hoc Distribution (Direct Install):
```bash
eas build --profile preview --platform ios
```

## Step 3: Submit to TestFlight

### Automatic Submission:
```bash
eas submit --platform ios
```

### Manual Submission:
1. Download IPA from build page
2. Open Xcode
3. Go to "Window" → "Organizer"
4. Drag IPA file to Organizer
5. Click "Distribute App"
6. Select "App Store Connect"
7. Click "Upload"

### TestFlight Testing:
1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Go to "TestFlight" tab
4. Add internal testers (up to 100)
5. Click "Start Testing"
6. Testers receive email with TestFlight link

---

# Testing Builds

## Android Testing

### On Physical Device:
1. Enable "Developer Options":
   - Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable "USB Debugging"
3. Enable "Install Unknown Apps" for browser

### On Emulator:
```bash
# Install Android Studio
# Create AVD (Android Virtual Device)
# Drag APK onto emulator window
```

## iOS Testing

### TestFlight (Recommended):
1. Install TestFlight app from App Store
2. Open invitation email
3. Tap "View in TestFlight"
4. Install BOND app

### iOS Simulator (Development only):
```bash
# Build for simulator
eas build --profile development --platform ios --local

# Requires Mac with Xcode
```

---

# Build Variants

## Development Build (With Expo Dev Client)
```bash
# For rapid testing with hot reload
eas build --profile development --platform android
eas build --profile development --platform ios
```

**Use when:**
- Active development
- Testing new features
- Want hot reload

## Preview Build (Internal Testing)
```bash
# For internal QA testing
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

**Use when:**
- Ready for QA
- Share with team
- Pre-production testing

## Production Build (App Stores)
```bash
# For final release
eas build --profile production --platform all
```

**Use when:**
- Ready for public release
- Submitting to stores

---

# Troubleshooting

## Common Issues

### 1. "Bundle identifier already exists"
**Solution**: Change `com.yourcompany.bond` to your unique identifier

### 2. "Build failed: Missing environment variables"
**Solution**:
```bash
# Add environment variables to EAS
eas secret:create --name SUPABASE_URL --value "your-value" --type string
```

### 3. "Android build fails with Gradle error"
**Solution**: Ensure `app.json` has correct `android.package` format

### 4. "iOS build fails with signing error"
**Solution**: 
```bash
# Clear credentials and regenerate
eas credentials --platform ios
```

### 5. "APK installs but crashes immediately"
**Solution**: Check logs:
```bash
adb logcat | grep -i bond
```

### 6. "Build is too slow"
**Solution**: Use local builds (requires setup):
```bash
eas build --platform android --local
```

---

# Build Optimization

## Reduce Build Time
1. Use build profiles efficiently
2. Cache dependencies
3. Build only needed platform
4. Use `--non-interactive` for CI/CD

## Reduce APK Size
1. Enable Proguard (minification)
2. Remove unused assets
3. Use WebP images
4. Enable app bundle split

```json
// app.json
"android": {
  "enableProguardInReleaseBuilds": true,
  "enableShrinkResourcesInReleaseBuilds": true
}
```

---

# Automated Builds (CI/CD)

## GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build App

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: |
          cd mobile
          yarn install
      
      - name: Build Android
        run: |
          cd mobile
          eas build --platform android --non-interactive --no-wait
```

---

# Version Management

## Incrementing Versions

### Android:
```json
// app.json
"android": {
  "versionCode": 2,  // Increment for each release
}
```

### iOS:
```json
// app.json
"ios": {
  "buildNumber": "2",  // Increment for each release
}
```

### Both:
```json
"version": "1.0.1",  // Semantic versioning
```

## Auto-Increment
```json
// eas.json
"build": {
  "production": {
    "autoIncrement": true
  }
}
```

---

# Store Submission

## Google Play Store

### First-Time Setup:
1. Create Google Play Console account ($25)
2. Create app listing
3. Upload AAB file
4. Fill required info:
   - App description
   - Screenshots (4-8 images)
   - Privacy policy URL
   - Content rating questionnaire
5. Submit for review (1-3 days)

### Commands:
```bash
# Build AAB
eas build --profile production --platform android

# Auto-submit
eas submit --platform android
```

## Apple App Store

### First-Time Setup:
1. Create App Store Connect account
2. Create new app
3. Fill app information
4. Upload via TestFlight
5. Submit for review (24-48 hours)

### Commands:
```bash
# Build IPA
eas build --profile production --platform ios

# Auto-submit
eas submit --platform ios
```

---

# Quick Reference

## Essential Commands
```bash
# Setup
eas login
eas build:configure

# Development
eas build --profile development --platform android

# Testing
eas build --profile preview --platform android

# Production
eas build --profile production --platform all

# Submit
eas submit --platform android
eas submit --platform ios

# Check status
eas build:list

# View logs
eas build:view [build-id]
```

## Useful Links
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
- **Expo Dashboard**: https://expo.dev/accounts/[username]/projects
- **Google Play Console**: https://play.google.com/console
- **App Store Connect**: https://appstoreconnect.apple.com

---

## Next Steps After Build

1. ✅ Test APK/IPA thoroughly
2. ✅ Gather feedback from beta testers
3. ✅ Fix critical bugs
4. ✅ Prepare store listings
5. ✅ Create promotional materials
6. ✅ Submit to stores
7. ✅ Plan launch marketing

---

**Note**: First build takes longer (30-40 mins). Subsequent builds are faster (10-15 mins).

**Support**: If stuck, check Expo Forums or Discord for help.
