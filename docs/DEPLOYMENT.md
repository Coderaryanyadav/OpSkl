# OpSkl Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Mobile App Deployment](#mobile-app-deployment)
4. [Admin Dashboard Deployment](#admin-dashboard-deployment)
5. [Database Deployment](#database-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review completed and approved
- [ ] No critical/high severity linting errors
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Performance testing completed
- [ ] Load testing results acceptable

### Documentation
- [ ] API documentation updated
- [ ] Database migrations documented
- [ ] Changelog updated
- [ ] Release notes prepared
- [ ] User-facing documentation updated

### Infrastructure
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] CDN configured
- [ ] Backup systems verified
- [ ] Monitoring tools configured
- [ ] Alert systems configured

### Third-Party Services
- [ ] Supabase project configured
- [ ] Razorpay API keys verified
- [ ] Google Gemini API quota sufficient
- [ ] Expo push notification service configured
- [ ] Sentry project configured
- [ ] Analytics configured

## Environment Setup

### 1. Production Environment Variables

Create production environment files:

**Mobile App (`apps/mobile/.env.production`)**:
```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Services
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-key

# Payment Gateway
EXPO_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key

# App Configuration
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_TIMEOUT=30000

# Analytics
EXPO_PUBLIC_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# Feature Flags
EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH=true
EXPO_PUBLIC_ENABLE_LOCATION_SERVICES=true
```

**Admin Dashboard (`apps/admin/.env.production`)**:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://admin.opskl.com
NODE_ENV=production

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@opskl.com
SMTP_PASS=your-password
```

### 2. Supabase Configuration

**Database Setup**:
```bash
# Initialize Supabase project
supabase init

# Link to production project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Deploy edge functions
supabase functions deploy payment-webhook
supabase functions deploy send-notification
supabase functions deploy ai-matching
```

**Storage Buckets**:
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profiles', 'profiles', true),
  ('portfolios', 'portfolios', true),
  ('proofs', 'proofs', false),
  ('documents', 'documents', false);

-- Set up RLS policies for storage
CREATE POLICY "Public profiles are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own profile"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Mobile App Deployment

### iOS Deployment (App Store)

#### Prerequisites
- Apple Developer Account ($99/year)
- App Store Connect access
- Valid provisioning profiles
- App Store listing prepared

#### Steps

**1. Configure app.json**:
```json
{
  "expo": {
    "name": "OpSkl",
    "slug": "opskl-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.opskl.app",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "OpSkl needs camera access for profile photos and proof of work.",
        "NSLocationWhenInUseUsageDescription": "OpSkl uses your location to show nearby gigs."
      }
    }
  }
}
```

**2. Build for iOS**:
```bash
cd apps/mobile

# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**3. App Store Review**:
- Prepare screenshots (6.5", 5.5", 12.9")
- Write app description
- Set pricing (Free)
- Select categories
- Add privacy policy URL
- Submit for review

### Android Deployment (Google Play)

#### Prerequisites
- Google Play Console account ($25 one-time)
- Signing key configured
- Play Store listing prepared

#### Steps

**1. Generate Upload Key**:
```bash
cd apps/mobile/android/app

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore opskl-upload-key.keystore \
  -alias opskl-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

**2. Configure gradle.properties**:
```properties
OPSKL_UPLOAD_STORE_FILE=opskl-upload-key.keystore
OPSKL_UPLOAD_KEY_ALIAS=opskl-key-alias
OPSKL_UPLOAD_STORE_PASSWORD=your-store-password
OPSKL_UPLOAD_KEY_PASSWORD=your-key-password
```

**3. Build APK/AAB**:
```bash
cd apps/mobile

# Build AAB for Play Store
eas build --platform android --profile production

# Or build APK for direct distribution
eas build --platform android --profile preview

# Submit to Play Store
eas submit --platform android
```

**4. Play Store Release**:
- Upload AAB to Play Console
- Create release notes
- Set rollout percentage (start with 10%)
- Submit for review

### Over-The-Air (OTA) Updates

```bash
# Publish OTA update (JavaScript changes only)
cd apps/mobile
eas update --branch production --message "Bug fixes and improvements"

# With automatic rollout
eas update --branch production --auto
```

## Admin Dashboard Deployment

### Deployment on Vercel (Recommended)

**1. Connect Repository**:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

**2. Configure Project**:
```bash
# vercel.json
{
  "buildCommand": "cd apps/admin && npm run build",
  "outputDirectory": "apps/admin/.next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**3. Deploy**:
```bash
# Deploy to production
cd apps/admin
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

**4. Custom Domain**:
```bash
# Add custom domain
vercel domains add admin.opskl.com

# Configure DNS (add CNAME record)
# Type: CNAME
# Name: admin
# Value: cname.vercel-dns.com
```

### Alternative: Self-Hosted Deployment

**Using PM2 on Ubuntu Server**:

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <repo-url> /var/www/opskl
cd /var/www/opskl

# Install dependencies
npm install

# Build admin app
cd apps/admin
npm run build

# Start with PM2
pm2 start npm --name "opskl-admin" -- start
pm2 save
pm2 startup

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/opskl-admin

# Nginx configuration:
server {
    listen 80;
    server_name admin.opskl.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/opskl-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d admin.opskl.com
```

## Database Deployment

### Initial Setup

```bash
# Create production database
supabase projects create opskl-production

# Link local to production
supabase link --project-ref your-production-ref

# Push schema to production
supabase db push

# Seed initial data (if needed)
psql $DATABASE_URL < supabase/seed.sql
```

### Running Migrations

```bash
# Create new migration
supabase migration new add_new_table

# Edit migration file
# supabase/migrations/XXXXXX_add_new_table.sql

# Test migration locally
supabase db reset

# Apply to production
supabase db push
```

### Database Backup

**Automated Daily Backups**:
```sql
-- Supabase automatically handles daily backups
-- Access via Supabase Dashboard > Settings > Backups

-- For manual backup:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

-- Restore from backup:
psql $DATABASE_URL < backup_20260109.sql
```

## Monitoring & Logging

### 1. Sentry Setup

**Mobile App**:
```typescript
// apps/mobile/App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.2,
  enableAutoSessionTracking: true,
});
```

**Admin Dashboard**:
```typescript
// apps/admin/app/layout.tsx
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

### 2. Analytics Setup

**Google Analytics**:
```typescript
// apps/mobile/src/services/analytics.ts
import * as Analytics from 'expo-firebase-analytics';

export const logEvent = (eventName: string, params?: object) => {
  Analytics.logEvent(eventName, params);
};
```

### 3. Database Monitoring

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 4. Alert Configuration

**Critical Alerts** (Email + SMS):
- Database downtime
- Payment gateway failures
- Authentication service errors
- Server response time > 5s

**Warning Alerts** (Slack):
- High error rate (> 1%)
- Database connection pool exhausted
- Queue backlog > 1000 items
- Storage usage > 80%

## Post-Deployment Verification

### Smoke Tests

**1. Mobile App**:
```bash
# Checklist:
- [ ] App launches successfully
- [ ] User can register/login
- [ ] Location services working
- [ ] Payment flow completes
- [ ] Push notifications received
- [ ] Profile images upload correctly
- [ ] Real-time updates working
```

**2. Admin Dashboard**:
```bash
# Checklist:
- [ ] Dashboard loads
- [ ] Login successful
- [ ] Analytics displaying
- [ ] User management functional
- [ ] Reports generating
- [ ] Database queries responsive
```

**3. Backend Systems**:
```bash
# Checklist:
- [ ] Database accessible
- [ ] Edge functions responding
- [ ] Storage buckets accessible
- [ ] Webhooks receiving events
- [ ] Scheduled jobs running
- [ ] Email/SMS sending
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 100 https://api.opskl.com/health

# Using k6
k6 run load-test.js

# Monitor metrics:
- Response time < 200ms (p95)
- Error rate < 0.1%
- Throughput > 100 req/s
```

## Rollback Procedures

### Mobile App Rollback

**Option 1: OTA Update (JavaScript only)**:
```bash
# Revert to previous update
eas update:republish --branch production --group previous

# Or publish specific version
eas update --branch production --message "Rollback to v1.0.0"
```

**Option 2: App Store/Play Store**:
```bash
# iOS: Submit previous version build to App Store
eas submit --platform ios --id <previous-build-id>

# Android: Rollback in Play Console
# Play Console > Release > Production > Manage > Rollback
```

### Admin Dashboard Rollback

**Vercel**:
```bash
# Rollback to previous deployment
vercel rollback

# Or redeploy specific commit
vercel --prod --force
```

**Self-Hosted**:
```bash
# Git rollback
git revert HEAD
git push origin main

# PM2 restart
pm2 restart opskl-admin
```

### Database Rollback

```bash
# Restore from backup
supabase db reset

# Or manual restore
psql $DATABASE_URL < backup_before_migration.sql

# Rollback specific migration
supabase migration down
```

## Deployment Timeline

### Recommended Deployment Schedule

**Phase 1: Staging Deployment** (Day 1-2)
- Deploy to staging environment
- Run full test suite
- Perform manual testing
- Load testing

**Phase 2: Production Database** (Day 3)
- Run migrations during low-traffic hours (2-4 AM)
- Verify data integrity
- Monitor performance

**Phase 3: Backend Services** (Day 4)
- Deploy edge functions
- Update environment variables
- Test integrations

**Phase 4: Admin Dashboard** (Day 5)
- Deploy to production
- Verify admin functions
- Train support team

**Phase 5: Mobile App** (Day 6-7)
- Submit to App Store (iOS)
- Submit to Play Store (Android)
- Gradual rollout (10% → 50% → 100%)

**Phase 6: Monitoring** (Day 8-14)
- Monitor metrics daily
- Address issues promptly
- Collect user feedback
- Plan next iteration

## Emergency Contacts

- **DevOps Lead**: devops@opskl.com
- **Backend Lead**: backend@opskl.com
- **Mobile Lead**: mobile@opskl.com
- **On-Call**: +91-XXXXXXXXXX
- **Supabase Support**: Via Dashboard
- **Expo Support**: support@expo.dev

---

**Guide Version**: 1.0  
**Last Updated**: 2026-01-09  
**Next Review**: 2026-02-09
