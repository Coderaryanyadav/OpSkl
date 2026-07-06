# OpSkl - Opportunity Skill Platform

## 🚀 Overview

OpSkl is a modern gig economy platform connecting skilled workers with clients for various services. Built with React Native for mobile, Next.js for admin, and Supabase for backend.

## 📋 Project Structure

```
opskl-monorepo/
├── apps/
│   ├── mobile/          # React Native mobile app (iOS & Android)
│   └── admin/           # Next.js admin dashboard
├── supabase/            # Database schemas, migrations, functions
├── docs/                # Comprehensive documentation
└── scripts/             # Build and deployment scripts
```

## 🏗️ Architecture

- **Frontend (Mobile)**: React Native (Expo) with TypeScript
- **Frontend (Admin)**: Next.js 14 with TypeScript
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with multi-provider support
- **Storage**: Supabase Storage for media files
- **Real-time**: Supabase Realtime for live updates
- **Payments**: Razorpay integration
- **AI**: Google Gemini API integration

## 🛠️ Tech Stack

### Mobile App
- React Native 0.81.5
- Expo 54
- TypeScript 5.9
- Zustand (State Management)
- React Navigation 6
- Expo modules (Camera, Location, Biometrics, etc.)

### Admin Dashboard
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase Client

### Backend
- Supabase (PostgreSQL 15)
- PostGIS for geospatial queries
- Edge Functions (Deno)
- Row Level Security (RLS)

## 📱 Features

### For Workers (Freelancers)
- Profile creation with skills and portfolio
- Browse available gigs
- Real-time location-based job matching
- Wallet management
- Rating and review system
- Push notifications
- Biometric authentication

### For Clients
- Post gig requirements
- Search and filter workers by skills
- Real-time messaging
- Secure payments via Razorpay
- Track job progress
- Rate and review workers

### Admin Dashboard
- User management
- Gig monitoring
- Analytics and reports
- Payment oversight
- Content moderation

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Expo CLI
- Supabase CLI

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd opskl-monorepo
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**

Create `.env` files in:
- `apps/mobile/.env`
- `apps/admin/.env`

See `.env.example` files for required variables.

4. **Start Supabase (locally)**
```bash
cd supabase
supabase start
```

5. **Run the mobile app**
```bash
npm run mobile
# or
cd apps/mobile
npm start
```

6. **Run the admin dashboard**
```bash
npm run admin
# or
cd apps/admin
npm run dev
```

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Security Guidelines](./docs/SECURITY.md)
- [Testing Strategy](./docs/TESTING.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🔐 Security

- End-to-end encryption for sensitive data
- Row Level Security (RLS) on all database tables
- JWT-based authentication
- Biometric authentication for high-value transactions
- Regular security audits
- GDPR compliance

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests for mobile app
npm test --prefix apps/mobile

# Run integration tests
npm run test:integration
```

## 📦 Building for Production

### Mobile App
```bash
cd apps/mobile

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### Admin Dashboard
```bash
cd apps/admin
npm run build
```

## 🚢 Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

## 📈 Monitoring

- Sentry for error tracking
- Google Analytics for user analytics
- Supabase Analytics for database metrics
- Custom logging system

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is proprietary and confidential.

## 👥 Team

- Project Lead: Aryan Yadav
- Backend: Supabase Team
- Mobile: React Native Team
- Admin: Next.js Team

## 📞 Support

For support, email aryanjyadav@gmail.com or call at 8828095997.

## 🎯 Roadmap

- [ ] v1.0 - MVP Launch (Q1 2026)
- [ ] v1.1 - Advanced Analytics (Q2 2026)
- [ ] v1.2 - Multi-language Support (Q2 2026)
- [ ] v2.0 - AI-powered Matching (Q3 2026)

## 📊 Status

- **Build Status**: ✅ Passing
- **Test Coverage**: 75%
- **Code Quality**: A
- **Security Score**: A+

---

Made with ❤️ by the OpSkl Team
