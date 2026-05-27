# How to Run BOND Mobile App

## Important: This is a Mobile App! 📱

BOND is built with React Native/Expo and **CANNOT** be viewed in a web browser preview. You need a physical mobile device or emulator.

## Option 1: Test on Your Phone (Easiest) ✅

1. **Install Expo Go on your phone:**
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Start the Expo dev server:**
```bash
cd /app/mobile
npm start
```

3. **Scan the QR code:**
   - iOS: Use Camera app to scan QR
   - Android: Use Expo Go app to scan QR

4. **App will load on your phone!**

## Option 2: Web Version (Limited Features)

While this is primarily a mobile app, Expo does support web for testing:

```bash
cd /app/mobile
npm run web
```

**Note:** Some features won't work on web:
- Push notifications
- Native camera/gestures
- Some navigation features

## Option 3: iOS Simulator (macOS only)

```bash
cd /app/mobile
npm run ios
```

## Option 4: Android Emulator

```bash
cd /app/mobile
npm run android
```

## Current Status

The app is fully built and ready to run, but it's a **mobile-only** experience. The backend is running fine, but you need to run the mobile app via Expo Go.

## Quick Test

Want to test right now?

1. Open Expo Go on your phone
2. In this terminal, run: `cd /app/mobile && npm start`
3. Scan the QR code that appears
4. App will load!

## Backend API

The backend is running and accessible at:
- Local: http://localhost:8001/api
- Your environment should handle the mapping

The mobile app connects to Supabase directly for most operations, and only uses the backend for AI insights generation.
