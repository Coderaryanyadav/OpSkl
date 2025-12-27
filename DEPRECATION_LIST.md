# 🗑️ OpSkl: DEPRECATION & SIMPLIFICATION LIST
**Focus:** India-Only Market | INR-Only Currency

---

## ❌ FEATURES TO REMOVE IMMEDIATELY

### 1. GLOBAL/MULTI-CURRENCY FEATURES
- **USD References**
  - Remove all "$" symbols and USD mentions
  - Delete currency conversion logic
  - Remove multi-currency wallet support
  
- **International Payment Methods**
  - Stripe integration (keep Razorpay only)
  - PayPal support
  - International wire transfers
  - Crypto wallet (Bitcoin/Ethereum)

### 2. WESTERN-CENTRIC FEATURES
- **Timezone Complexities**
  - Use IST (Indian Standard Time) only
  - Remove multi-timezone scheduling
  - Hardcode UTC+5:30 across the app

- **Imperial Units**
  - Remove miles/feet (use kilometers/meters)
  - Remove Fahrenheit (use Celsius)
  - Simplify measurement inputs

- **English-Only UI**
  - Remove assumption that English is default
  - Prioritize Hindi first, English second

### 3. UNNECESSARY COMPLEXITY
- **Metaverse/AR Features**
  - Remove "AR Skill Verification" from roadmap (not relevant for India)
  - Delete 3D job fair concepts
  - Focus on 2D mobile-first

- **NFT/Web3 Features**
  - Remove blockchain badges (regulatory risk in India)
  - Delete DAO governance
  - Remove stablecoin mentions (USDT/USDC)

- **Advanced Analytics**
  - Remove complex data export formats
  - Simplify admin dashboard (CSV only, no Excel/PowerBI)
  - Delete heat maps and advanced visualizations

### 4. LOCATION-SPECIFIC REMOVALS
- **Non-Indian Geography**
  - Remove international address validation
  - Delete non-India phone number formats
  - Remove country selector (India-only)

- **Regional References**
  - Remove Silicon Valley terminology
  - Delete "FAANG Edition" branding
  - Simplify "Mission/Operative" language to "Kaam/Karigar"

---

## 🔧 SIMPLIFICATIONS NEEDED

### 5. AUTHENTICATION
- **Remove Complex OAuth**
  - Google Sign-In sufficient (remove Facebook/Apple)
  - Focus on phone number OTP as primary method
  - Truecaller integration for fraud detection

### 6. PAYMENT FLOW
- **Simplify Escrow**
  - 7-day auto-release (instead of 14 days)
  - Remove complex milestone negotiation
  - Fixed 5% platform fee (no dynamic pricing)

- **Remove Premium Features**
  - Delete "Express Payout" tiers (make instant free)
  - Remove subscription models (focus on transaction fees)
  - Simplify wallet to single balance

### 7. COMMUNICATION
- **Remove Video Calling**
  - WhatsApp integration is enough
  - Delete in-app video infrastructure
  - Use native share intent instead

- **Simplify Chat**
  - Remove read receipts (privacy concern in India)
  - Delete typing indicators (bandwidth waste)
  - Focus on text + voice notes only

### 8. GAMIFICATION
- **Reduce Complexity**
  - Remove XP/Level system (confusing for non-gamers)
  - Simplify to star ratings only
  - Delete "Trust Score" algorithm (just use review average)

---

## 📋 CODE CLEANUP TASKS

### 9. REMOVE MOCK/PLACEHOLDER CODE
```typescript
// DELETE THESE FILES:
- apps/mobile/src/features/chat/screens/ChatScreen.tsx (video/voice placeholders)
- apps/mobile/src/features/client/screens/CreateGigScreen.tsx (voice ingestion mock)
- apps/mobile/src/features/profile/screens/WalletScreen.tsx (offline sync indicator)
```

### 10. REMOVE UNUSED DEPENDENCIES
```json
// UNINSTALL FROM package.json:
- "@sentry/react-native" (use errorMonitor instead)
- "react-native-worklets" (not used)
- "react-native-chart-kit" (overkill for MVP)
- "expo-calendar" (not needed for India)
- "expo-localization" (India-only ISO)
```

### 11. REMOVE LEGACY FILES
```bash
# DELETE:
- docs/pitch/*.html (old investor decks)
- CURRENT_STATE.md (replaced)
- FUTURE_VISION.md (replaced)
- CLEANUP_LIST.md (replaced)
```

---

## 🇮🇳 INDIA-SPECIFIC REPLACEMENTS

### 12. CURRENCY MIGRATION
**Search & Replace Across Codebase:**
```
$ → ₹
USD → INR
Dollar → Rupee
Cent → Paisa
```

**Update Constants:**
```typescript
// OLD:
export const CURRENCY_SYMBOL = '$';
export const CURRENCY_CODE = 'USD';

// NEW:
export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';
```

### 13. RENAME TERMINOLOGY
**Mission-Speak → Desi Language:**
```
Mission → Kaam
Operative → Kaamgar/Professional
Client → Customer/Grahak
Treasury → Wallet
Command Center → Dashboard
Frequency → Chat
```

### 14. UI ADJUSTMENTS
- **Colors:** Add saffron/green theme variant for patriotic mode
- **Fonts:** Use Hind/Poppins (better Hindi rendering)
- **Icons:** Replace generic icons with Indian context (🪔 for featured, 🏏 for sports)

---

## 🎯 FOCUS AREAS POST-CLEANUP

### What to Double Down On:
1. **UPI Integration** - Make it 1-tap
2. **Hindi Support** - Must be flawless
3. **Offline Mode** - Work with 2G
4. **Referral System** - Viral growth engine
5. **Trust Building** - Video KYC mandatory

### What to Pause:
1. AI features (expensive for India)
2. Enterprise clients (focus SMEs first)
3. International expansion
4. Advanced analytics

### What to Sunset:
1. Web app (mobile-only for now)
2. Admin web dashboard (use mobile admin screen)
3. Marketing site (focus on app store)

---

## 📊 IMPACT METRICS

**Expected Improvements After Cleanup:**
- **Bundle Size:** -40% (faster downloads on slow networks)
- **API Calls:** -30% (lower infrastructure costs)
- **User Onboarding:** -50% time (simpler flow)
- **Development Velocity:** +60% (less code = faster features)

**Resource Savings:**
- Remove 15+ unused screens
- Delete 8,000+ lines of dead code
- Uninstall 6 heavy dependencies
- Simplify 20+ complex components
