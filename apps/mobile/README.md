# OpSkl Mobile App

## Overview
OpSkl ("Opportunity Skill") is a gig-economy platform connecting workers ("Talent") with employers.
Built with **React Native (Expo)** and **Supabase**.

## Architecture
- **Frontend**: React Native, Expo, Reanimated.
- **Backend**: Supabase (Auth, Postgres, Realtime).
- **State**: Local State + Context (Minimal global state).
- **Navigation**: React Navigation.

## Setup
1. `npm install`
2. `npx expo start`

## Structure
- `/src/components`: Reusable UI (Aura Design System).
- `/src/screens`: Feature screens.
- `/src/services`: Supabase, AI.
- `/src/utils`: Helpers, Validation.
- `/src/theme`: Colors, Spacing.

## Contribution
- Use `AuraColors` for styling.
- Use `NeonButton` for actions.
- Ensure `sanitizeInput` is used for user data.

## Testing
- Run `npm test` (Jest).

## CI/CD
- GitHub Actions configured in `.github/workflows`.

## License
MIT.
