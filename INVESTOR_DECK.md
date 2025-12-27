# 📊 OpSkl - Executive Investment Deck & Technical Overview

**Confidential - For Investor & Co-Founder Review**  
**Last Updated:** December 27, 2025  
**Version:** 1.0

---

## 🎯 EXECUTIVE SUMMARY

**OpSkl** is a next-generation gig economy platform that connects skilled workers ("Talent") with clients who need immediate, on-demand services. Think of it as "Uber for skilled labor" - but with enterprise-grade security, gamification, and AI-powered matching.

### Key Differentiators
- **AI-Powered Matching:** Smart algorithms match workers to gigs based on skills, location, and past performance
- **Gamification Layer:** Daily quests, leaderboards, and perks keep workers engaged and motivated
- **Trust & Safety:** Built-in verification system, trusted contacts for emergencies, and comprehensive rating system
- **Real-Time Everything:** Live chat, instant notifications, and real-time gig updates
- **Dual-Sided Marketplace:** Seamless experience for both clients posting gigs and workers finding opportunities

---

## 💰 MARKET OPPORTUNITY

### Total Addressable Market (TAM)
- **Global Gig Economy:** $455.2B (2023) → $1.8T (2030) - CAGR 22.4%
- **On-Demand Services:** $210B (2023) → $435B (2028)
- **Target Markets:** Urban centers in India, Southeast Asia, LATAM

### Problem We're Solving
1. **For Workers:**
   - Difficulty finding consistent gig work
   - Lack of trust/verification systems
   - No gamification or engagement mechanisms
   - Poor payment transparency

2. **For Clients:**
   - Hard to find reliable, verified workers quickly
   - No real-time tracking or communication
   - Limited quality assurance
   - Complex hiring processes

### Our Solution
OpSkl provides a **trusted, gamified, AI-powered platform** that makes finding and completing gigs as easy as ordering a ride.

---

## 🏗️ PRODUCT ARCHITECTURE

### Technology Stack

#### **Frontend (Mobile App)**
- **Framework:** React Native (Expo) - Cross-platform iOS/Android
- **State Management:** Zustand (lightweight, performant)
- **UI/UX:** Custom "Aura Design System v2.0" - Industrial-grade, FAANG-level aesthetics
- **Animations:** React Native Reanimated (60fps smooth interactions)
- **Navigation:** React Navigation v6
- **Real-time:** Supabase Realtime subscriptions

#### **Backend (Supabase - Firebase Alternative)**
- **Database:** PostgreSQL (Supabase-hosted)
- **Authentication:** Supabase Auth (JWT-based, secure)
- **Storage:** Supabase Storage (for profile images, verification docs)
- **Real-time:** WebSocket-based subscriptions
- **Edge Functions:** Serverless functions for AI/complex logic

#### **AI/ML Layer**
- **AI Search:** Google Generative AI (Gemini) for semantic gig matching
- **Smart Recommendations:** ML-based worker-gig matching algorithm
- **Natural Language Processing:** Parse gig descriptions and worker skills

#### **Infrastructure**
- **Hosting:** Supabase Cloud (auto-scaling, managed)
- **CDN:** Global edge network for fast asset delivery
- **Analytics:** Custom analytics service with DB persistence
- **Monitoring:** Built-in error tracking and performance monitoring

---

## 📱 CORE FEATURES

### For Workers (Talent)

#### 1. **Discovery Feed (Swipe-to-Apply)**
- Tinder-like interface for browsing gigs
- Swipe right to apply, left to pass
- AI-powered recommendations based on:
  - Location proximity
  - Skill match
  - Past performance
  - Availability
- Real-time updates as new gigs are posted

#### 2. **Gamification System**
- **Daily Quests:** Complete tasks to earn XP and rewards
  - "Complete 3 gigs today"
  - "Maintain 5-star rating for a week"
  - "Respond to clients within 5 minutes"
- **Leaderboards:** City-wide and global rankings
- **Perks & Badges:** Unlock special benefits
  - Priority gig access
  - Higher visibility to clients
  - Reduced platform fees
- **Streaks:** Maintain daily activity for bonuses

#### 3. **My Gigs Dashboard**
- Active assignments
- Pending applications
- Completed work history
- Earnings tracker

#### 4. **Profile & Verification**
- ID verification system
- Skill badges
- Client reviews and ratings
- Portfolio/work samples
- Hourly rate settings

#### 5. **Wallet & Payments**
- Real-time balance tracking
- Transaction history
- Instant payouts (future: integrated payment gateway)
- Earnings analytics

#### 6. **Safety Features**
- **Trusted Contacts:** Emergency SOS system
  - Auto-notify contacts with location during emergencies
  - Built-in panic button
- **Ghost Mode:** Hide precise location until gig is accepted
- **In-App Chat:** Secure communication (no phone number sharing)

### For Clients

#### 1. **Create Gig**
- Simple, guided gig posting flow
- AI-assisted description writing
- Budget calculator
- Urgency levels (low/medium/high)
- Location picker with map integration

#### 2. **Manage Gigs**
- View all posted gigs
- Track application status
- Real-time applicant notifications
- One-click approve/reject

#### 3. **Gig Manager (Applicant Review)**
- See all applicants for a specific gig
- View worker profiles, ratings, reviews
- Compare multiple candidates
- Accept worker → Auto-creates chat room
- Reject with optional feedback

#### 4. **Chat & Communication**
- Real-time messaging with assigned worker
- File sharing (images, documents)
- Location sharing
- Read receipts

#### 5. **Review System**
- Rate workers after gig completion
- Leave detailed feedback
- Public reviews visible to other clients

---

## 🎨 DESIGN PHILOSOPHY: "AURA DESIGN SYSTEM v2.0"

### Core Principles
1. **Industrial-Grade Aesthetics:** Dark mode, premium gradients, micro-animations
2. **Haptic Feedback:** Every interaction has tactile response (light/medium/heavy)
3. **Motion Design:** Smooth 60fps animations using Reanimated
4. **Accessibility:** High contrast, readable typography, semantic HTML
5. **Consistency:** Unified component library across entire app

### Key Components
- **AuraButton:** Multi-variant buttons with loading states, icons, haptics
- **AuraInput:** Floating labels, validation, secure entry, animated borders
- **AuraDialog:** Custom modal system (replaces native alerts)
- **AuraMotion:** Declarative animations (slide, fade, zoom, bounce)
- **AuraHeader:** Consistent navigation headers with blur effects
- **AuraCard:** Elevated cards with shadows and gradients

### Color Palette
- **Primary:** Electric Blue (#007AFF) - Action, CTA
- **Background:** Deep Black (#000000) - Premium feel
- **Surface:** Dark Gray (#1C1C1E) - Cards, elevated elements
- **Success:** Vibrant Green (#34C759) - Positive actions
- **Error:** Bold Red (#FF3B30) - Warnings, destructive actions
- **Text:** Pure White (#FFFFFF) - High contrast readability

---

## 🔐 SECURITY & TRUST

### Data Protection
- **Row Level Security (RLS):** Supabase policies ensure users only see their own data
  - Workers can't see other workers' applications
  - Clients can only manage their own gigs
  - Wallets are strictly private
- **JWT Authentication:** Secure, token-based auth with auto-refresh
- **Encrypted Storage:** Sensitive data encrypted at rest
- **HTTPS Only:** All API calls over secure connections

### User Verification
- **ID Verification:** Government ID upload and review
- **Phone Verification:** SMS-based verification
- **Email Verification:** Mandatory email confirmation
- **Trust Score:** Algorithm-based reputation system (0-100)
  - Factors: completion rate, ratings, response time, cancellations

### Safety Features
- **Trusted Contacts:** Emergency notification system
- **In-App Reporting:** Report inappropriate behavior
- **Automated Moderation:** AI-based content filtering
- **Background Checks:** (Future) Integration with third-party verification services

---

## 📊 DATABASE SCHEMA

### Core Tables

#### **profiles**
```sql
- id (UUID, primary key)
- full_name (text)
- avatar_url (text)
- bio (text)
- headline (text)
- hourly_rate (numeric)
- active_role (enum: 'talent' | 'client')
- verification_status (enum: 'unverified' | 'pending' | 'verified' | 'rejected')
- trust_score (integer, 0-100)
- total_count (integer) - Total gigs completed
- current_streak (integer) - Daily activity streak
- is_ghost_mode (boolean)
- created_at, updated_at (timestamps)
```

#### **gigs**
```sql
- id (UUID, primary key)
- title (text)
- description (text)
- category (text)
- location (text)
- budget (numeric)
- pay_amount_cents (integer) - Exact payment in cents
- duration_minutes (integer) - Estimated duration
- urgency_level (enum: 'low' | 'medium' | 'high')
- status (enum: 'open' | 'active' | 'completed' | 'cancelled')
- client_id (UUID, foreign key → profiles)
- assigned_worker_id (UUID, foreign key → profiles, nullable)
- created_at, updated_at (timestamps)
```

#### **applications**
```sql
- id (UUID, primary key)
- gig_id (UUID, foreign key → gigs)
- worker_id (UUID, foreign key → profiles)
- status (enum: 'pending' | 'approved' | 'rejected' | 'completed')
- message (text, nullable) - Worker's application message
- created_at (timestamp)
```

#### **wallets**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key → profiles)
- balance (numeric)
- currency (text, default 'INR')
- updated_at (timestamp)
```

#### **transactions**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key → profiles)
- amount (numeric)
- type (enum: 'credit' | 'debit')
- description (text)
- created_at (timestamp)
```

#### **chat_rooms**
```sql
- id (UUID, primary key)
- gig_id (UUID, foreign key → gigs)
- type (text, default 'assignment')
- created_at (timestamp)
```

#### **messages**
```sql
- id (UUID, primary key)
- room_id (UUID, foreign key → chat_rooms)
- sender_id (UUID, foreign key → profiles)
- content (text)
- created_at (timestamp)
```

#### **trusted_contacts**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key → profiles)
- name (text)
- phone (text)
- created_at (timestamp)
```

#### **analytics_events**
```sql
- id (UUID, primary key)
- event_name (text)
- user_id (UUID, nullable)
- properties (jsonb)
- device_model, os_name, os_version (text)
- timestamp (timestamp)
```

---

## 🚀 BUSINESS MODEL

### Revenue Streams

#### 1. **Commission on Gigs (Primary)**
- **Workers:** 15-20% commission on each completed gig
- **Clients:** Optional "priority posting" fee for urgent gigs
- **Example:** $100 gig → $15-20 to OpSkl, $80-85 to worker

#### 2. **Subscription Tiers (Future)**
- **Worker Pro:** $9.99/month
  - Reduced commission (10% instead of 20%)
  - Priority in search results
  - Advanced analytics
  - Unlimited applications
- **Client Business:** $29.99/month
  - Bulk gig posting
  - Dedicated account manager
  - Priority support
  - Advanced hiring tools

#### 3. **Premium Features**
- **Verified Badge:** $4.99 one-time (fast-track verification)
- **Boost Gig:** $2.99 (promote gig to top of feed for 24 hours)
- **Background Check:** $9.99 (third-party verification)

#### 4. **Advertising (Future)**
- Sponsored gigs from enterprise clients
- Banner ads for relevant services (insurance, tools, etc.)

### Unit Economics (Projected)

**Assumptions:**
- Average gig value: $50
- Platform commission: 18%
- Monthly active workers: 10,000
- Gigs per worker per month: 8

**Monthly Revenue:**
- 10,000 workers × 8 gigs × $50 × 18% = **$720,000/month**
- Annual run rate: **$8.64M**

**Cost Structure:**
- Supabase hosting: ~$500/month (scales with usage)
- AI API costs (Gemini): ~$200/month
- Customer support: $5,000/month (outsourced)
- Marketing: 30% of revenue (~$216,000/month)
- **Gross Margin:** ~65-70%

---

## 📈 GO-TO-MARKET STRATEGY

### Phase 1: Launch (Months 1-3)
- **Target:** Single city (e.g., Bangalore, India)
- **Focus:** Onboard 500 workers, 200 clients
- **Tactics:**
  - Referral bonuses ($10 for worker, $5 for referrer)
  - Free first gig (no commission)
  - Influencer partnerships (local tech YouTubers)
  - University campus drives

### Phase 2: Growth (Months 4-12)
- **Target:** Expand to 5 major cities
- **Focus:** 10,000 workers, 5,000 clients
- **Tactics:**
  - Paid ads (Facebook, Instagram, Google)
  - SEO content marketing (blog, guides)
  - Partnership with coworking spaces
  - Corporate tie-ups (B2B clients)

### Phase 3: Scale (Year 2+)
- **Target:** National expansion (India), then SEA
- **Focus:** 100,000+ workers, 50,000+ clients
- **Tactics:**
  - TV/radio ads in tier-2 cities
  - Strategic partnerships (payment gateways, insurance)
  - Enterprise sales team
  - International expansion (Singapore, Philippines)

---

## 🎯 COMPETITIVE ANALYSIS

### Direct Competitors

#### **UrbanClap (Urban Company)**
- **Strengths:** Established brand, wide service categories
- **Weaknesses:** High commission (30%), slow onboarding, limited gamification
- **Our Edge:** Lower commission, faster matching, gamification

#### **Taskrabbit**
- **Strengths:** Global presence, trusted brand
- **Weaknesses:** US-focused, expensive, no AI matching
- **Our Edge:** India-first, AI-powered, mobile-native

#### **Freelancer.com / Upwork**
- **Strengths:** Large talent pool, global reach
- **Weaknesses:** Long-term projects only, complex bidding, no local focus
- **Our Edge:** Instant gigs, local focus, real-time matching

### Indirect Competitors
- **Uber/Ola:** Ride-hailing (we're "Uber for skilled labor")
- **LinkedIn:** Professional networking (we're execution-focused)
- **WhatsApp Groups:** Informal gig sharing (we're structured, verified)

---

## 👥 TEAM & ROLES

### Current Team
- **Founder/CEO:** Aryan Yadav
  - Product vision, fundraising, strategy
  - Technical architecture, full-stack development

### Roles Needed (Post-Funding)

#### **Co-Founder/CTO**
- Oversee technical roadmap
- Scale infrastructure
- Build engineering team

#### **Head of Growth**
- User acquisition strategy
- Marketing campaigns
- Partnerships

#### **Head of Operations**
- Customer support
- Worker onboarding
- Quality assurance

#### **Lead Designer**
- Refine Aura Design System
- User research
- A/B testing

#### **Backend Engineer** (2-3)
- Supabase optimization
- API development
- AI/ML integration

#### **Mobile Engineer** (2-3)
- React Native development
- Performance optimization
- Feature development

---

## 💵 FUNDING ASK

### Seed Round: $500K - $1M

#### **Use of Funds**

| Category | Amount | % |
|----------|--------|---|
| **Engineering Team** | $300K | 40% |
| - 2 Full-stack engineers ($60K each/year) | $120K | |
| - 1 Mobile engineer ($60K/year) | $60K | |
| - 1 Designer ($50K/year) | $50K | |
| - Contractor/freelancer budget | $70K | |
| **Marketing & Growth** | $250K | 33% |
| - Paid ads (Facebook, Google) | $100K | |
| - Influencer partnerships | $50K | |
| - Referral bonuses | $60K | |
| - Content marketing | $40K | |
| **Operations** | $100K | 13% |
| - Customer support (outsourced) | $50K | |
| - Legal & compliance | $30K | |
| - Office/coworking space | $20K | |
| **Infrastructure & Tools** | $50K | 7% |
| - Supabase hosting | $12K | |
| - AI API costs | $10K | |
| - Analytics & monitoring tools | $8K | |
| - Design tools (Figma, etc.) | $5K | |
| - Misc SaaS subscriptions | $15K | |
| **Runway Buffer** | $50K | 7% |

**Estimated Runway:** 12-18 months

---

## 📊 KEY METRICS & MILESTONES

### Current Status (MVP)
- ✅ Mobile app (iOS/Android) - 90% complete
- ✅ Core features (gig posting, applications, chat) - Live
- ✅ Gamification system - Implemented
- ✅ AI search - Integrated
- ✅ Payment infrastructure - Ready (needs gateway integration)
- ⏳ Beta testing - Starting Q1 2026

### 6-Month Milestones
- 1,000 registered workers
- 500 active clients
- 2,500 gigs completed
- $50K GMV (Gross Merchandise Value)
- 4.5+ star average rating
- 70% worker retention (month-over-month)

### 12-Month Milestones
- 10,000 registered workers
- 5,000 active clients
- 40,000 gigs completed
- $1M GMV
- Expand to 5 cities
- Break-even on unit economics

### 24-Month Milestones
- 50,000 registered workers
- 25,000 active clients
- 500,000 gigs completed
- $10M GMV
- Series A fundraise ($5-10M)
- International expansion (1-2 countries)

---

## 🔬 TECHNICAL ROADMAP

### Q1 2026
- [ ] Complete haptics migration (22 files)
- [ ] Apply Supabase RLS policies
- [ ] Launch beta in Bangalore
- [ ] Integrate payment gateway (Razorpay/Stripe)
- [ ] Implement push notifications

### Q2 2026
- [ ] Add video verification for workers
- [ ] Build admin dashboard (web)
- [ ] Implement dispute resolution system
- [ ] Add multi-language support (Hindi, Tamil)
- [ ] Launch referral program

### Q3 2026
- [ ] AI-powered gig pricing recommendations
- [ ] In-app wallet top-up
- [ ] Background check integration
- [ ] Advanced analytics for workers
- [ ] Corporate client portal

### Q4 2026
- [ ] Voice/video calling in chat
- [ ] Automated gig matching (no swipe needed)
- [ ] Insurance integration
- [ ] Skill assessment tests
- [ ] White-label solution for enterprises

---

## ⚠️ RISKS & MITIGATION

### Market Risks
**Risk:** Existing players (UrbanClap) dominate market  
**Mitigation:** Focus on differentiation (AI, gamification, lower fees), target underserved segments

**Risk:** Slow user adoption  
**Mitigation:** Aggressive referral program, free first gig, influencer marketing

### Technical Risks
**Risk:** Scalability issues as user base grows  
**Mitigation:** Supabase auto-scales, implement caching, optimize queries early

**Risk:** AI matching accuracy  
**Mitigation:** Continuous ML model training, human-in-the-loop feedback, A/B testing

### Regulatory Risks
**Risk:** Labor law compliance (gig worker classification)  
**Mitigation:** Legal counsel, worker education, transparent contracts

**Risk:** Data privacy (GDPR, local laws)  
**Mitigation:** RLS policies, encryption, regular security audits

### Operational Risks
**Risk:** Poor worker/client experience  
**Mitigation:** 24/7 support, in-app feedback, rapid iteration based on user data

**Risk:** Fraud or safety incidents  
**Mitigation:** Verification system, trusted contacts, insurance, background checks

---

## 🌟 WHY NOW?

### Market Timing
1. **Post-Pandemic Shift:** Remote/gig work normalized, 40% of workforce now freelance
2. **Smartphone Penetration:** 750M+ smartphones in India (2025), 80%+ in urban areas
3. **Digital Payments:** UPI adoption at all-time high, cashless economy growing
4. **AI Maturity:** Generative AI (Gemini, GPT) now affordable and accessible

### Technology Enablers
- **React Native:** Cross-platform development = faster time-to-market
- **Supabase:** Backend-as-a-Service = no DevOps overhead
- **AI APIs:** Plug-and-play intelligence without ML team

### Competitive Landscape
- **UrbanClap:** Focused on home services, not general gigs
- **Taskrabbit:** Not in India/SEA
- **Freelancer/Upwork:** Long-term projects, not instant gigs
- **Gap:** No AI-powered, gamified, mobile-first gig platform in India

---

## 📞 CONTACT & NEXT STEPS

### For Investors
**What We're Looking For:**
- Seed funding: $500K - $1M
- Strategic investors with:
  - Marketplace/platform experience
  - India/SEA market knowledge
  - Network in tech/startup ecosystem

**Next Steps:**
1. Review this deck
2. Schedule 30-min intro call
3. Product demo (live app walkthrough)
4. Due diligence (codebase review, financials)
5. Term sheet negotiation

### For Co-Founders
**Ideal Co-Founder Profile:**
- 5+ years experience in tech/startups
- Strong in areas founder lacks (e.g., sales, operations)
- Passionate about gig economy, social impact
- Willing to take equity over salary initially

**What We Offer:**
- Co-founder equity (15-25%)
- Equal decision-making power
- Opportunity to build something massive
- Flexible work arrangement

---

## 📚 APPENDIX

### A. Technical Documentation
- **API Documentation:** `/docs/API.md`
- **Database Schema:** `/docs/DATABASE.md`
- **Design System:** `/docs/DESIGN_SYSTEM.md`
- **Security Policies:** `/SUPABASE_RLS.sql`

### B. Code Repository
- **GitHub:** [Private - Available upon NDA]
- **Tech Stack:** React Native, Supabase, TypeScript
- **Code Quality:** ESLint, Prettier, strict TypeScript
- **Test Coverage:** 60%+ (unit + integration tests)

### C. Demo Credentials
- **Worker Account:** demo-worker@opskl.com / Demo@123
- **Client Account:** demo-client@opskl.com / Demo@123
- **Admin Dashboard:** [Coming Q1 2026]

### D. Financial Projections (3-Year)
| Year | Users | GMV | Revenue | Costs | Profit |
|------|-------|-----|---------|-------|--------|
| 2026 | 15K | $2M | $360K | $500K | -$140K |
| 2027 | 75K | $15M | $2.7M | $1.5M | $1.2M |
| 2028 | 250K | $60M | $10.8M | $4M | $6.8M |

### E. Press & Media
- [Future: TechCrunch, YourStory, Inc42 coverage]
- [Future: Podcast appearances, conference talks]

---

**This document is confidential and intended solely for the recipient. Do not distribute without written permission from OpSkl.**

**© 2025 OpSkl. All rights reserved.**
