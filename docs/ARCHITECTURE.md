# OpSkl System Architecture

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [System Components](#system-components)
3. [Data Flow](#data-flow)
4. [Technology Stack](#technology-stack)
5. [Security Architecture](#security-architecture)
6. [Scalability Strategy](#scalability-strategy)
7. [Integration Points](#integration-points)

## High-Level Architecture

OpSkl follows a modern serverless architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Mobile App (React Native)  │  Admin Dashboard (Next.js)    │
│  - iOS Application          │  - Web Application            │
│  - Android Application      │  - Server-Side Rendering      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                         │
├─────────────────────────────────────────────────────────────┤
│           Supabase REST API & Realtime API                  │
│  - Authentication   - Database Access   - Storage           │
│  - Real-time WebSocket   - Edge Functions                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Supabase Edge Functions (Deno)                             │
│  - Payment Processing    - Notifications                    │
│  - AI Matching          - Analytics                         │
│  - Email/SMS Services   - Job Scheduling                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (Supabase)                             │
│  - User Data            - Gig Data                          │
│  - Transaction History  - Ratings & Reviews                 │
│  - Geospatial Data     - Chat Messages                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Storage Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Supabase Storage                                           │
│  - Profile Images       - Portfolio Media                   │
│  - Proof of Work       - Documents                          │
└─────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Mobile Application (React Native + Expo)

**Purpose**: Primary interface for workers and clients

**Key Features**:
- Cross-platform (iOS/Android) native application
- Offline-first architecture with local caching
- Real-time updates via WebSocket
- Biometric authentication
- Location-based services
- Push notifications

**Architecture Patterns**:
- **State Management**: Zustand for global state
- **Navigation**: React Navigation with stack and tab navigators
- **Data Fetching**: Custom hooks with Supabase client
- **Caching**: AsyncStorage for persistent data
- **Authentication**: Supabase Auth with JWT tokens

**Module Structure**:
```
src/
├── components/        # Reusable UI components
├── screens/          # Screen components
├── navigation/       # Navigation configuration
├── store/           # Zustand stores
├── services/        # API and business logic
├── utils/           # Helper functions
├── hooks/           # Custom React hooks
├── types/           # TypeScript definitions
└── constants/       # App constants
```

### 2. Admin Dashboard (Next.js)

**Purpose**: Management interface for platform administrators

**Key Features**:
- Server-side rendering for SEO
- Real-time analytics dashboard
- User management interface
- Content moderation tools
- Payment oversight
- Report generation

**Architecture Patterns**:
- **Rendering**: Hybrid (SSR + CSR)
- **State Management**: React Context + Server Components
- **Data Fetching**: Server Actions + Client-side SWR
- **Styling**: Tailwind CSS + CSS Modules
- **Authentication**: Supabase Auth with role-based access

### 3. Backend (Supabase)

**Purpose**: Complete backend-as-a-service

**Components**:

#### a. PostgreSQL Database
- **Version**: PostgreSQL 15 with PostGIS extension
- **Features**:
  - Row Level Security (RLS) for data isolation
  - Triggers for automated actions
  - Functions for complex business logic
  - Materialized views for analytics
  - Full-text search capabilities
  - Geospatial indexing for location queries

#### b. Authentication Service
- **Providers**: Email, Google, Phone (OTP)
- **Features**:
  - JWT token-based authentication
  - Refresh token rotation
  - Multi-factor authentication (MFA)
  - Session management
  - Role-based access control (RBAC)

#### c. Storage Service
- **Buckets**:
  - `profiles`: User profile images
  - `portfolios`: Worker portfolio media
  - `proofs`: Proof of work documents
  - `documents`: Legal and verification documents

- **Features**:
  - CDN-enabled delivery
  - Automatic image optimization
  - Access control via RLS
  - Signed URLs for temporary access

#### d. Edge Functions (Deno)
- **Payment Processing**: Razorpay integration
- **AI Services**: Google Gemini API integration
- **Notifications**: Push notifications via Expo
- **Email/SMS**: Transactional messaging
- **Analytics**: Custom event tracking
- **Scheduled Jobs**: Cron-based tasks

#### e. Realtime Service
- **WebSocket Connections**: For live updates
- **Channels**:
  - User presence
  - Chat messages
  - Gig status updates
  - Notification broadcasts

## Data Flow

### 1. User Registration Flow

```
User (Mobile) → Submit Registration
    ↓
Supabase Auth → Create User Account
    ↓
Database Trigger → Create User Profile
    ↓
Edge Function → Send Welcome Email
    ↓
Return Success → User Logged In
```

### 2. Gig Posting Flow

```
Client (Mobile) → Post Gig Details
    ↓
Validate Input → Check Required Fields
    ↓
Database Insert → Create Gig Record
    ↓
Edge Function → Notify Nearby Workers
    ↓
AI Service → Match Suitable Workers
    ↓
Realtime Broadcast → Update Gig Feed
```

### 3. Payment Flow

```
Client → Initiate Payment
    ↓
Edge Function → Create Razorpay Order
    ↓
Razorpay → Process Payment
    ↓
Webhook → Verify Payment Status
    ↓
Database Update → Record Transaction
    ↓
Edge Function → Transfer to Worker Wallet
    ↓
Notification → Notify Both Parties
```

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Mobile app framework |
| Expo | 54.0 | Build & deployment tooling |
| TypeScript | 5.9 | Type safety |
| Next.js | 14.0 | Admin dashboard |
| Zustand | 5.0 | State management |
| React Navigation | 6.x | Mobile navigation |
| Tailwind CSS | 3.x | Admin styling |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15 | Primary database |
| Supabase | Latest | Backend platform |
| PostGIS | 3.x | Geospatial queries |
| Deno | Latest | Edge function runtime |
| Node.js | 20.x | Admin server |

### External Services

| Service | Purpose |
|---------|---------|
| Razorpay | Payment processing |
| Google Gemini | AI-powered features |
| Expo Push | Notifications |
| Sentry | Error tracking |
| Google Analytics | User analytics |

## Security Architecture

### 1. Authentication & Authorization

**Multi-Layer Security**:
```
┌─────────────────────────────────────┐
│   Layer 1: Client Authentication   │
│   - JWT Token Validation            │
│   - Biometric for sensitive actions │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Layer 2: API Gateway Security     │
│   - Rate limiting                   │
│   - CORS policies                   │
│   - Request validation              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Layer 3: Database Security (RLS)  │
│   - Row-level policies              │
│   - Column-level encryption         │
│   - Audit logging                   │
└─────────────────────────────────────┘
```

### 2. Data Protection

- **Encryption at Rest**: AES-256 encryption for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **PII Protection**: Hashing for personal identifiable information
- **Password Security**: bcrypt hashing with salt

### 3. Row Level Security (RLS) Policies

**Example Policies**:
```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Workers can update their own profiles
CREATE POLICY "Workers can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON profiles FOR SELECT
USING (is_admin(auth.uid()));
```

## Scalability Strategy

### 1. Database Scalability

**Horizontal Scaling**:
- Read replicas for read-heavy operations
- Connection pooling via PgBouncer
- Query optimization with indexes
- Partitioning for large tables (transactions, messages)

**Vertical Scaling**:
- On-demand resource scaling
- Auto-scaling based on load

### 2. Application Scalability

**Mobile App**:
- Client-side caching to reduce API calls
- Lazy loading for images and content
- Pagination for large datasets
- Offline functionality with sync

**Admin Dashboard**:
- Server-side rendering for initial load
- Code splitting for faster loading
- Image optimization with Next.js
- CDN for static assets

### 3. Backend Scalability

**Edge Functions**:
- Stateless design for horizontal scaling
- Auto-scaling based on request volume
- Regional deployment for low latency

**Database**:
- Connection pooling
- Materialized views for complex queries
- Caching layer (Redis) for frequent queries
- Background jobs for heavy processing

## Integration Points

### 1. Payment Integration (Razorpay)

**Flow**:
```
App → Create Order → Razorpay API
Razorpay → Payment Gateway → User Payment
Webhook → Verify Payment → Update Database
```

**Security**:
- API key encryption
- Webhook signature verification
- PCI DSS compliance

### 2. AI Integration (Google Gemini)

**Use Cases**:
- Worker-gig matching
- Content moderation
- Chatbot assistance
- Fraud detection

**Implementation**:
- Edge function wrapper
- Rate limiting
- Response caching
- Fallback mechanisms

### 3. Notification Integration (Expo Push)

**Types**:
- Transactional (payment confirmations)
- Promotional (new gig alerts)
- System (account updates)

**Delivery**:
- Push tokens stored securely
- Batch notifications for efficiency
- Delivery tracking and analytics

### 4. Analytics Integration

**Platforms**:
- Google Analytics for user behavior
- Custom analytics for business metrics
- Sentry for error tracking

**Data Points**:
- User engagement metrics
- Conversion funnels
- Performance metrics
- Error rates and types

## Monitoring & Observability

### 1. Application Monitoring

- **Error Tracking**: Sentry for real-time error reporting
- **Performance**: Custom metrics for API response times
- **User Analytics**: Google Analytics for user journeys

### 2. Database Monitoring

- **Query Performance**: Supabase dashboard
- **Connection Pool**: PgBouncer metrics
- **Resource Usage**: CPU, memory, disk I/O

### 3. Alerting

- **Critical Alerts**: Email + SMS for downtime
- **Warning Alerts**: Slack for performance degradation
- **Info Alerts**: Dashboard for trend monitoring

## Disaster Recovery

### 1. Backup Strategy

- **Database**: Daily automated backups with 30-day retention
- **Storage**: Versioning enabled for all buckets
- **Configuration**: Version controlled in Git

### 2. Recovery Procedures

- **Database Restore**: Point-in-time recovery (PITR)
- **Storage Restore**: Version rollback
- **Application**: Blue-green deployment for rollback

### 3. Business Continuity

- **RTO (Recovery Time Objective)**: < 4 hours
- **RPO (Recovery Point Objective)**: < 1 hour
- **Failover**: Automated failover to backup region

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-09  
**Maintained By**: Architecture Team
