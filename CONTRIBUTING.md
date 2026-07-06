# Contributing to OpSkl

Thank you for your interest in contributing to OpSkl! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Supabase CLI

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Visit https://github.com/your-org/opskl and click "Fork"
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/opskl.git
   cd opskl
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/your-org/opskl.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Setup environment variables**
   ```bash
   cp apps/mobile/.env.example apps/mobile/.env
   cp apps/admin/.env.example apps/admin/.env
   ```

6. **Start development servers**
   ```bash
   # Mobile app
   npm run mobile

   # Admin dashboard
   npm run admin

   # Supabase local
   cd supabase && supabase start
   ```

## Development Workflow

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/add-payment-integration`)
- `bugfix/` - Bug fixes (e.g., `bugfix/fix-login-issue`)
- `hotfix/` - Critical production fixes (e.g., `hotfix/security-patch`)
- `refactor/` - Code refactoring (e.g., `refactor/improve-api-structure`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `test/` - Test additions/fixes (e.g., `test/add-unit-tests`)

### Workflow Steps

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow coding standards
   - Add tests for new features
   - Update documentation

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link any related issues

## Coding Standards

### TypeScript/JavaScript

**General Rules**:
- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Avoid `any` type, use `unknown` if needed
- Use meaningful variable and function names
- Keep functions small and focused (< 50 lines)
- Add JSDoc comments for complex functions

**Example**:
```typescript
/**
 * Calculates the distance between two geographic points
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### React/React Native

**Component Guidelines**:
- Use functional components with hooks
- One component per file
- Use PascalCase for component names
- Use camelCase for props
- Destructure props in function parameters
- Use TypeScript interfaces for props

**Example**:
```tsx
interface GigCardProps {
  gig: Gig;
  onPress: (gigId: string) => void;
  showDistance?: boolean;
}

export const GigCard: React.FC<GigCardProps> = ({ 
  gig, 
  onPress,
  showDistance = true 
}) => {
  const handlePress = () => {
    onPress(gig.id);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{gig.title}</Text>
      {showDistance && <Text>{gig.distance}km</Text>}
    </TouchableOpacity>
  );
};
```

### Styling

**Mobile App**:
- Use StyleSheet.create() for styles
- Keep styles at bottom of file
- Use theme constants for colors
- Use responsive design (flex, percentages)

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
});
```

**Admin Dashboard**:
- Use Tailwind CSS utility classes
- Create custom components for repeated patterns
- Use CSS modules for component-specific styles

### Database

**SQL Guidelines**:
- Use lowercase with underscores for table/column names
- Always add comments to complex queries
- Create indexes for foreign keys
- Use transactions for multi-step operations
- Enable RLS on all tables

**Example**:
```sql
-- Create a new table for user skills
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Add index for faster lookups
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);

-- Enable RLS
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own skills
CREATE POLICY "Users can view own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);
```

## Testing Guidelines

### Unit Tests

**Mobile App** (Jest + React Native Testing Library):
```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { GigCard } from '../GigCard';

describe('GigCard', () => {
  const mockGig = {
    id: '123',
    title: 'Test Gig',
    budget: 500,
  };

  it('renders correctly', () => {
    const { getByText } = render(
      <GigCard gig={mockGig} onPress={jest.fn()} />
    );
    expect(getByText('Test Gig')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <GigCard gig={mockGig} onPress={onPress} />
    );
    
    fireEvent.press(getByText('Test Gig'));
    expect(onPress).toHaveBeenCalledWith('123');
  });
});
```

### Integration Tests

```typescript
describe('Authentication Flow', () => {
  it('should register a new user', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
  });
});
```

### E2E Tests (Detox for Mobile)

```javascript
describe('Gig Posting Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should post a new gig', async () => {
    await element(by.id('post-gig-button')).tap();
    await element(by.id('gig-title-input')).typeText('Test Gig');
    await element(by.id('gig-budget-input')).typeText('500');
    await element(by.id('submit-button')).tap();
    
    await expect(element(by.text('Gig posted successfully'))).toBeVisible();
  });
});
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(mobile): add payment integration"

# Bug fix
git commit -m "fix(api): resolve authentication timeout issue"

# Documentation
git commit -m "docs: update deployment guide"

# With body
git commit -m "feat(mobile): add biometric authentication

Implements Face ID and Touch ID support for iOS and fingerprint
authentication for Android devices.

Closes #123"
```

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all tests**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

3. **Update documentation** if needed

4. **Add changeset** (if applicable)
   ```bash
   npx changeset
   ```

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## Testing
Describe the tests you ran and how to reproduce

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. **Automatic checks** must pass:
   - Linting
   - Type checking
   - Unit tests
   - Build process

2. **Code review** by at least one maintainer:
   - Code quality
   - Test coverage
   - Documentation
   - Performance impact

3. **Approval** and merge:
   - Squash and merge for feature branches
   - Rebase and merge for hotfixes

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
Clear description of what the bug is

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen

**Screenshots**
Add screenshots if applicable

**Environment:**
- Device: [e.g. iPhone 13]
- OS: [e.g. iOS 15.0]
- App Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
What you want to happen

**Describe alternatives you've considered**
Other solutions you've thought about

**Additional context**
Mockups, examples, or other context
```

## Questions?

- **Slack**: #dev-help channel
- **Email**: dev@opskl.com
- **GitHub Discussions**: For general questions

## Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

Thank you for contributing to OpSkl! 🚀
