# OpSkl (Opportunity Skill)

OpSkl is a next-generation gig-economy platform designed to bridge the gap between skilled talent and opportunities. 

## Project Structure

This is a monorepo managed with npm workspaces:

- `apps/mobile`: React Native (Expo) mobile application for workers and clients.
- `apps/admin`: Next.js dashboard for platform administration.
- `supabase`: Database schemas, edge functions, and migrations.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Apps

#### Mobile App
```bash
cd apps/mobile
npm run start
```

#### Admin Dashboard
```bash
cd apps/admin
npm run dev
```

## Features

- **Real-time Gig Matching**: Dynamic application and approval flow.
- **Secure Payments**: Integrated wallet and transaction system.
- **Trusted Networking**: Identity verification and secure communication.
- **Cross-Platform**: Seamless experience on iOS, Android, and Web.

## Tech Stack

- **Frontend**: React Native, Next.js, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Styling**: Aura Design System (Custom)

## License

MIT
