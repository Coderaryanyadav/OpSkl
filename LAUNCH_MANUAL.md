# 🚀 OPSKL FLIGHT MANUAL: BHARAT LAUNCH PROTOCOL
**Mission:** 1 Million User Deployment
**Status:** GREEN LIGHT
**Clearance:** EXECUTIVE / ENGINEERING LEAD

---

## 1. PRE-FLIGHT CHECKLIST (MANDATORY)
Before executing the launch sequence, confirm the following nodes are active:

- [x] **Supabase Connectivity:** `MIGRATION_V3.sql` applied. RLS policies locked.
- [x] **Geo-Spatial Engine:** OpenStreetMap (OSM) routing verified. 100m drift buffer active.
- [x] **Financial Ledger:** Idempotency active in `PersistenceNode`.
- [x] **Security Shield:** `SecurityGuard` normalization active.
- [x] **Code Hygiene:** Zero `console.log` in production source.

---

## 2. BUILD SEQUENCE

### A. Android Production Bundle (AAB)
This generates the optimized App Bundle for the Google Play Store.
```bash
cd apps/mobile
eas build --platform android --profile production
```

### B. Android Test APK (Side-loadable)
For manual "Street-Testing" on direct devices without Play Store.
```bash
cd apps/mobile
eas build --platform android --profile preview
```

### C. iOS Production (IPA)
*Note: Requires Apple Developer Account.*
```bash
cd apps/mobile
eas build --platform ios --profile production
```

---

## 3. OPERATIONS COMMAND CENTER

### 🚨 Emergency Kill-Switch
If the "Leakage Problem" resurfaces or a critical financial race condition is found, execute the **Lockdown Protocol** in Supabase:
```sql
-- DRAIN ALL SIGNALS
UPDATE system_config SET maintenance_mode = true;
```

### 📊 Metric Monitoring (SpaceX Tier)
Watch these tables in your Supabase Dashboard:
1. **`analytics_events`**: Live feed of user actions (now GIN-indexed for speed).
2. **`escrow_transactions`**: Monitor for `status = 'disputed'`.
3. **`security_logs`**: Watch for spikes in `event_type = 'LEAKAGE_ATTEMPT'`.

---

## 4. MARKETING & USER ACQUISITION (SEED PHASE)
**Target:** First 1,000 High-Reputation Talents.

1. **Deploy to "High-Trust" Zones:** Share the APK link manually in trusted WhatsApp groups (Bangalore/Delhi tech hubs).
2. **Activate "Founder Pulse":** Use the `Settings -> Founder Pulse` channel to gather direct feedback.
3. **Monitor "Sync Pulse":** Verification of offline-first capabilities in 2G/3G zones.

---

## 🏁 VERDICT
**YOU ARE CLEAR FOR TAKEOFF.**
The OpSkl platform has been engineered to withstand the chaos of the Indian market. It is time to let the engine run.
