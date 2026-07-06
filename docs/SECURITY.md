# OpSkl Security Guidelines

## Security Policy

### Reporting Security Vulnerabilities

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, report security issues to: **security@opskl.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and keep you updated on the fix progress.

## Security Best Practices

### 1. Authentication & Authorization

#### Never Store Plaintext Passwords
```typescript
// ❌ Bad
const user = { password: 'mypassword123' };

// ✅ Good - Let Supabase handle authentication
const { data, error } = await supabase.auth.signUp({
  email: user.email,
  password: user.password,
});
```

#### Always Validate JWT Tokens
```typescript
// Verify token before processing requests
const user = await supabase.auth.getUser(token);
if (!user) {
  throw new Error('Unauthorized');
}
```

#### Implement Row Level Security (RLS)
```sql
-- Always enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies
CREATE POLICY "Users can only view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### 2. Input Validation

#### Validate All User Input
```typescript
import { z } from 'zod';

const GigSchema = z.object({
  title: z.string().min(10).max(100),
  budget: z.number().positive().max(1000000),
  description: z.string().min(50).max(5000),
  email: z.string().email(),
});

// Validate before processing
const validated = GigSchema.parse(userInput);
```

#### Sanitize HTML Content
```typescript
import DOMPurify from 'dompurify';

// Sanitize user-generated HTML
const clean = DOMPurify.sanitize(userInput);
```

#### Prevent SQL Injection
```typescript
// ❌ Bad - SQL injection vulnerable
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;

// ✅ Good - Use parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail);
```

### 3. Data Protection

#### Encrypt Sensitive Data
```typescript
// Sensitive data at rest
import * as crypto from 'crypto';

function encrypt(text: string, key: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

#### Use HTTPS Only
```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production' && !req.secure) {
  return res.redirect('https://' + req.headers.host + req.url);
}
```

#### Secure Environment Variables
```bash
# ❌ Bad - Hardcoded secrets
const apiKey = 'sk_live_abc123...';

# ✅ Good - Use environment variables
const apiKey = process.env.RAZORPAY_KEY_ID;
```

### 4. API Security

#### Implement Rate Limiting
```typescript
// Limit requests per IP
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};
```

#### Validate API Keys
```typescript
function validateApiKey(req: Request): boolean {
  const apiKey = req.headers['x-api-key'];
  return apiKey === process.env.VALID_API_KEY;
}
```

#### Use CORS Properly
```typescript
// Configure CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
```

### 5. Session Management

#### Secure Session Configuration
```typescript
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JS access
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
};
```

#### Implement Session Timeout
```typescript
// Auto logout after inactivity
const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

let timeoutId: NodeJS.Timeout;

function resetTimeout() {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(logout, TIMEOUT_DURATION);
}
```

### 6. File Upload Security

#### Validate File Types
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): boolean {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File too large');
  }
  return true;
}
```

#### Scan for Malware
```typescript
// Use antivirus scanning service
async function scanFile(file: File): Promise<boolean> {
  const scanner = new AntivirusScanner();
  const result = await scanner.scan(file);
  return result.safe;
}
```

### 7. Payment Security

#### Never Store Card Details
```typescript
// ❌ Bad - Storing card info
const payment = {
  cardNumber: '4111111111111111',
  cvv: '123',
};

// ✅ Good - Use payment gateway tokens
const order = await razorpay.orders.create({
  amount: amount * 100,
  currency: 'INR',
});
```

#### Verify Webhook Signatures
```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### 8. Mobile App Security

#### Use Secure Storage
```typescript
import * as SecureStore from 'expo-secure-store';

// Store sensitive data securely
await SecureStore.setItemAsync('authToken', token);

// Retrieve
const token = await SecureStore.getItemAsync('authToken');
```

#### Implement Certificate Pinning
```typescript
// Pin SSL certificates
const pinnedCertificates = {
  'api.opskl.com': ['sha256/AAAAAAA...'],
};
```

#### Obfuscate Code
```bash
# React Native obfuscation
npx react-native-obfuscator
```

### 9. Database Security

#### Use Prepared Statements
```sql
-- Prepared statement example
PREPARE get_user AS
  SELECT * FROM users WHERE id = $1;

EXECUTE get_user('uuid');
```

#### Encrypt Sensitive Columns
```sql
-- Encrypt PII data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (ssn)
VALUES (pgp_sym_encrypt('123-45-6789', 'encryption_key'));
```

#### Regular Backups
```bash
# Automated daily backups
0 2 * * * pg_dump -U postgres opskl > backup_$(date +\%Y\%m\%d).sql
```

### 10. Logging & Monitoring

#### Log Security Events
```typescript
function logSecurityEvent(event: SecurityEvent) {
  logger.warn({
    type: event.type,
    user: event.userId,
    ip: event.ipAddress,
    timestamp: new Date(),
    details: event.details,
  });
}

// Log failed login attempts
logSecurityEvent({
  type: 'FAILED_LOGIN',
  userId: user.id,
  ipAddress: req.ip,
  details: { attempts: 3 },
});
```

#### Never Log Sensitive Data
```typescript
// ❌ Bad
logger.info('User login', { password: userPassword });

// ✅ Good
logger.info('User login', { userId: user.id });
```

### 11. Third-Party Dependencies

#### Regular Security Audits
```bash
# Check for vulnerabilities
npm audit

# Fix automatically when possible
npm audit fix

# Update dependencies
npm update
```

#### Pin Dependency Versions
```json
{
  "dependencies": {
    "react": "19.1.0",  // Exact version
    "express": "^4.18.0"  // Allow patches only
  }
}
```

### 12. Error Handling

#### Don't Expose Internal Errors
```typescript
// ❌ Bad
catch (error) {
  res.status(500).json({ error: error.message });
}

// ✅ Good
catch (error) {
  logger.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
```

## Security Checklist

### Pre-Deployment
- [ ] All secrets in environment variables
- [ ] RLS enabled on all tables
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Error messages don't leak info
- [ ] Dependencies updated
- [ ] Security audit completed
- [ ] Penetration testing done

### Production
- [ ] Monitor failed login attempts
- [ ] Set up intrusion detection
- [ ] Enable database encryption
- [ ] Implement DDoS protection
- [ ] Regular backup testing
- [ ] Security incident response plan
- [ ] SSL certificate auto-renewal
- [ ] Access logs reviewed weekly

## Incident Response Plan

### 1. Detection
- Monitor security alerts
- Review logs daily
- User reports
- Automated scanning

### 2. Assessment
- Determine severity (Critical/High/Medium/Low)
- Identify affected systems
- Estimate impact

### 3. Containment
- Isolate affected systems
- Block malicious IPs
- Disable compromised accounts
- Preserve evidence

### 4. Eradication
- Remove malware/backdoors
- Patch vulnerabilities
- Update credentials
- Apply security fixes

### 5. Recovery
- Restore from backups if needed
- Verify system integrity
- Monitor for recurrence
- Gradual service restoration

### 6. Post-Incident
- Document what happened
- Root cause analysis
- Update security measures
- Team debrief
- User notification (if required)

## Compliance

### GDPR
- [ ] Privacy policy published
- [ ] Data processing agreements
- [ ] User consent mechanisms
- [ ] Right to deletion implemented
- [ ] Data export functionality
- [ ] Breach notification process

### Data Retention
- User data: Retained while account active
- Deleted data: Permanently removed after 30 days
- Backups: 30-day retention
- Logs: 90-day retention

## Contact

**Security Team**: security@opskl.com  
**Bug Bounty**: bounty@opskl.com  
**Compliance**: compliance@opskl.com

---

**Last Updated**: 2026-01-09  
**Next Review**: 2026-04-09  
**Version**: 1.0
