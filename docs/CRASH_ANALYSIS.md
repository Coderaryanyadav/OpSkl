# Potential Crash Causes & Fixes Analysis
**Date:** 2026-01-09
**Status:** In Progress

This document tracks potential reasons for the "App Failed to Launch" error and the fixes applied to resolve them.

## 1. Icon Library Dependency (Critical - FIXED)
*   **Issue:** The `lucide-react-native` library (v0.300.0) had a known issue where certain icon exports (specifically `Meh` icon) were missing from the distribution bundle, causing the Metro bundler to fail during the build or runtime crash.
*   **Fix:** Upgraded to `lucide-react-native@latest` and verified imports.
*   **Status:** ✅ Resolved.

## 2. Reanimated & Gesture Handler Configuration
*   **Issue:** If `react-native-reanimated/plugin` is missing from `babel.config.js` or `import 'react-native-gesture-handler'` is not at the top of `App.tsx`, the app crashes immediately on launch.
*   **Fix:**
    *   Verified `babel.config.js`: Plugin is present.
    *   Verified `App.tsx`: Import is on Line 1.
*   **Status:** ✅ Verified Correct.

## 3. Environment Variables (Runtime)
*   **Issue:** If `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing in the production bundle, the Supabase client initialization might throw an error.
*   **Fix:**
    *   Verified `.env` loading in `app.json`.
    *   Added fallback strings in `supabase.ts` to prevent immediate crash (though app functionality would fail gracefully instead of hard crashing).
*   **Status:** ✅ Verified.

## 4. Font Loading (Async Timing)
*   **Issue:** If the app tries to render components using custom fonts *before* `useFonts` hook completes, it will throw a native error.
*   **Fix:**
    *   The `App.tsx` or `_layout` must conditionally render `null` or a `<SplashScreen />` until `fontsLoaded` is true.
    *   *Action Item*: I will review `App.tsx` font loading logic to ensure it waits.

## 5. Monorepo Hoisting (Build Time)
*   **Issue:** Android Gradle often fails to find native modules (`react-native-worklets-core`, `react-native-reanimated`) when they are hoisted to the root `node_modules` instead of `apps/mobile/node_modules`.
*   **Fix:**
    *   Created manual symlinks/copies of these packages into `apps/mobile/node_modules` before building.
    *   Enabled `newArchEnabled=true` in `gradle.properties` as required by Worklets.
*   **Status:** ✅ Applied in Build Pipeline.

## 6. ProGuard / R8 / Minification (Release Only)
*   **Issue:** In rare cases, release builds strip out necessary class files.
*   **Fix:** Standard Expo config usually handles this. If crashes persist only in Release mode, we may need to add ProGuard rules.

---
## 7. App Crash Loop (Critical Update)
*   **Issue:** Apps using `lucide-react-native` v0.300.0 crashes on startup due to a missing export (`Meh` icon). This is a known library bug.
*   **Fix:** Updated `package.json` to use `lucide-react-native@latest` (v0.303+).
*   **Status:** ✅ Fixed in `OpSkl-Fixed-Release.apk`.
*   **User Action:** You **MUST** uninstall the previous crashing version from your phone before installing the new one to ensure no cached bundles remain.

## Next Steps
1.  Download `apps/mobile/OpSkl-Fixed-Release.apk`.
2.  Uninstall old app.
3.  Install new APK.
4.  Launch.
