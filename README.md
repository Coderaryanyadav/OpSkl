# OpSkl (Opportunity Skill)

OpSkl is a premium gig economy platform designed for the Indian market, connecting skilled talent with businesses and individuals. Built with a focus on trust, efficiency, and seamless transactions.

## 🚀 Key Features

- **Trust-First Ecosystem**: Aadhaar-verified profiles and UPI-based escrow systems.
- **Dynamic Gig Discovery**: Hyper-local search and match-making for gig opportunities.
- **Secure Payments**: Integrated Razorpay support for Indian payment methods.
- **Comprehensive Profile**: Showcase portfolios, earn XP, and build a verified reputation.
- **Admin Dashboard**: Robust tools for platform management and user verification.

## 🛠 Tech Stack

- **Monorepo**: Managed with NPM Workspaces.
- **Mobile App**: React Native with Expo, TypeScript, and Lucide Icons.
- **Admin Dashboard**: Next.js 14, React, TailwindCSS, and Recharts.
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions).
- **Styling**: Native styling in mobile, TailwindCSS in admin.
- **State Management**: Zustand and Immer.

## 📁 Project Structure

```text
.
├── apps/
│   ├── mobile/         # Expo-based mobile application
│   └── admin/          # Next.js-based admin dashboard
├── supabase/           # Database migrations and edge functions
├── package.json        # Root package definition & workspaces
└── README.md           # Project documentation
```

## 🚥 Getting Started

### Prerequisites

- Node.js (v18 or later)
- Expo CLI
- Supabase CLI (optional, for local development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Applications

- **Start Mobile App**:
  ```bash
  npm run mobile
  ```
- **Start Admin Dashboard**:
  ```bash
  npm run admin
  ```

## 📄 License

Proprietary and Confidential.
