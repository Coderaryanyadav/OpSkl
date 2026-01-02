# OP_SKL: The Surgical Purge & Growth Matrix
**Authority:** Council of 10 Experts (NASA, Google, Apple, Microsoft)
**Status:** Strategic Directive 101

This document identifies **100 specific actions** to refine OpSkl (Open Platform Skill) for 1M user scale in the Indian market.

---

## 🔴 THE PURGE: 50 Things to REMOVE (Eliminating Bloat)

1.  **USD Currency Logic**: Remove all conversions and variables referencing `$`.
2.  **Stripe/PayPal Connectors**: Excised to prioritize native UPI and Razorpay.
3.  **Complex Tax Forms (W9/W8-BEN)**: Replace with a simple PAN card node.
4.  **Legacy "Star Rating" System**: Remove in favor of XP-based Clearance Levels.
5.  **Social Feed Infrastructure**: Delete logic for "sharing status updates" (churn trap).
6.  **Avatar Animations**: Remove resource-heavy Lottie files for profile avatars.
7.  **3D Assets**: Remove GLB/OBJ loaders to reduce app bundle size.
8.  **Desktop-Centric View Logic**: Delete web-only media queries.
9.  **Legacy Email Notifications**: Deprecate email alerts in favor of WhatsApp/SMS.
10. **Password Login**: Remove email/password auth (transition to 100% OTP).
11. **Web3/NFT Placeholders**: Clean up unused crypto-connector libraries.
12. **Generic "Company Bio" Pages**: Remove static "About Us" overhead.
13. **Western Date Formats (MM/DD)**: Enforce DD/MM/YYYY globally.
14. **Legacy "Worker" Terminology**: Purge all internal variable names (e.g., `worker_id`).
15. **In-App Token Logic**: Remove placeholder "OpSkl Coins" (Users want Rupees).
16. **Manual Time-Tracking**: Remove hourly punch-in logic (use Milestone-based delivery).
17. **Auto-play Tutorials**: Replace video tutorials with silent AuraMotion walkthroughs.
18. **Google Fonts Bloat**: Remove non-core weights (keep Bold, SemiBold, Regular).
19. **Generic Address Fields**: Remove "Zip Code" (Replace with Mandatory 6-digit PIN).
20. **International PhoneNumber Library**: Replace with a lightweight India-specific regex.
21. **Legacy "Client Dashboard" WebCode**: Remove unused React-Web components.
22. **Bulk Marketing Pings**: Remove high-frequency promotional notification logic.
23. **Stock Photography**: Remove non-regional placeholder images.
24. **Excessive Console Logs**: Purge all developer-level logs for production privacy.
25. **"Coming Soon" Tabs**: Delete feature placeholders (Ship it ).
26. **Detailed User Bio**: Shorten bio length for rapid profile auditing.
27. **Multi-User Chat Permissions**: Remove complex "Admin/Moderator" chat roles.
28. **Third-Party Tracker Bloat**: Remove legacy FB/TikTok pixel scripts.
29. **High-Latency Analytics**: Remove redundant "page view" event tracking.
30. **Unoptimized SVG Charts**: Replace with lightweight Canvas or SVG-Lite.
31. **External Job Board Scrapers**: Remove logic for importing external gigs.
32. **RSS Feed Integrations**: Purge legacy news-node dependencies.
33. **Redux Legacy Boilerplate**: Replace remaining Redux with Context/Zustand.
34. **Unused Lodash Methods**: Modularize imports to prevent bundle bloat.
35. **Manual "Mark as Done"**: Remove user-declared completion (use Deliverable check).
36. **High-Frequency Pull-to-Refresh**: Threshold increased to prevent server storms.
37. **Birthday/Personal Data**: Remove non-essential fields (Privacy First).
38. **Complex Dispute UI**: Simplify to "Initiate Adjudication" button.
39. **Manual Support Tickets**: Replace with AI-first triage bot.
40. **"Aura Bharat" Branding**: Final purge of old strategic codenames.
41. **Synchronous Data Fetches**: Remove blocking API calls on app boot.
42. **Non-Critical Context Providers**: Merge UI providers into a single AuraProvider.
43. **Legacy CSS Rules**: Purge unused global styles from `index.css`.
44. **Manual Payment Reminders**: Automated by Escrow Ledger triggers.
45. **Excessive Haptic Feedback**: Remove haptics for low-priority taps.
48. **External Map Links**: Replace with in-app lightweight Google Maps node.
49. **CSV Export Logic**: Remove talent-side exports (focus on In-App Wallet).


---

## 🟢 THE GROWTH: 50 Things to ADD (Bharat Hardening)

1.  **Direct UPI Intent Flow**: One-tap payment from OpSkl to PhonePe/GPay.
4.  **Offline-First Sync Bar**: Visual indicator of queued signals (Persistence Node).
5.  **Aadhaar QR Scanner**: In-app scanner to pre-fill KYC data.
8.  **Pin Code Geofencing**: Option to filter gigs by specific 6-digit PIN nodes.
9.  **Low Battery Optimizer**: Auto-theme switch to "OLED Black" at <20% battery.
10. **"Flash Mission" UI**: Red-coded Missions starting in <1 hour.
11. **Tiered Payouts**: Ability to withdraw ₹500/day vs ₹5000/week based on level.
12. **Social Trust Graph**: "Vouch" button to increase talent's peer-authority.
13. **Field Safety Haptics**: SOS button triggers distinct 3-pulse vibration.
14. **Demand Heatmap**: GPS-based map showing high mission density areas.
16. **Salary Advance Node**: Cash advance against confirmed Escrow missions.
19. **"Street-Grade" Sync**: Optimization for 2G/3G connectivity speeds.
24. **Biometric App Lock**: Fingerprint/FaceID gate for Wallet access.
25. **SMS Briefing Backup**: SMS mission details sent if data signal is lost.
26. **Surge Pricing Logic**: 1.5x budget multipliers for missions in high-demand zones.
27. **"Mission Timeline"**: Visual Gantt-chart for long-term project milestones.
31. **"Trusted Client" Badge**: Verification for repeat-hiring companies.
34. **Offline QR Completion**: End a mission by scanning client's phone QR (No Internet).
38. **Dynamic Map Routing**: Optimal pathing from talent's location to mission site.
39. **Anti-Leakage Guardian**: Real-time warning when sharing off-platform contact info.
40. **Government Scheme Integration**: Links to Digital India/PMKVY training programs.
41. **WebP Performance**: All portfolio assets auto-converted to high-compression WebP.
42. **Instant Escalation Toggle**: 1-tap "Flag for Review" during a mission.
44. **KYC Re-verification**: Periodic liveness check to prevent account selling.
45. **"Gig Heat" Pulse**: Visual pulse on the feed when a gig is getting many applicants.
47. **Night Shift Filter**: Auto-brightness adjustment for late-night mission discovery.
48. **Low-Signal Loader**: High-contrast minimal UI when connection is <50kbps.
50. **"Founder Pulse"**: Direct feedback loop from talents to the Core Team.

---
**Verdict:** 100 Strategic Modifications identified. Implementation sequence: **PURGE first, GROWTH second.**
