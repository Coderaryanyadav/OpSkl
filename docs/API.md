# OpSkl API Documentation

## Base URL

```
Production: https://your-project.supabase.co/rest/v1
Staging: https://your-staging.supabase.co/rest/v1
Local: http://localhost:54321/rest/v1
```

## Authentication

All authenticated requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Common Headers

```http
Content-Type: application/json
apikey: <your-anon-key>
Authorization: Bearer <user-jwt-token>
```

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "data": {
    "full_name": "John Doe",
    "user_type": "worker"
  }
}
```

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "user_metadata": {
    "full_name": "John Doe"
  },
  "created_at": "2026-01-09T12:00:00Z"
}
```

#### Login
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Profiles

#### Get User Profile
```http
GET /profiles?id=eq.{user_id}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "user_type": "worker",
  "avatar_url": "https://...",
  "bio": "Experienced plumber",
  "created_at": "2026-01-09T12:00:00Z"
}
```

#### Update Profile
```http
PATCH /profiles?id=eq.{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "John Smith",
  "bio": "Expert plumber with 10 years experience"
}
```

### Gigs

#### List Gigs
```http
GET /gigs?status=eq.open&order=created_at.desc&limit=20
Authorization: Bearer <token>
```

**Query Parameters**:
- `status`: Filter by gig status (open, in_progress, completed)
- `skill_id`: Filter by skill
- `location_id`: Filter by location
- `budget_min`: Minimum budget
- `budget_max`: Maximum budget
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset

**Response**:
```json
[
  {
    "id": "uuid",
    "title": "Fix Kitchen Sink",
    "description": "Leaking kitchen sink needs repair",
    "budget_type": "fixed",
    "budget_amount": 500.00,
    "status": "open",
    "client_id": "uuid",
    "skill_id": "uuid",
    "created_at": "2026-01-09T10:00:00Z"
  }
]
```

#### Create Gig
```http
POST /gigs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Plumbing Work Required",
  "description": "Kitchen sink needs repair",
  "skill_id": "uuid",
  "budget_type": "fixed",
  "budget_amount": 500.00,
  "location_id": "uuid",
  "start_date": "2026-01-15"
}
```

#### Get Nearby Gigs
```http
POST /rest/v1/rpc/get_nearby_gigs
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_lat": 28.6139,
  "user_lng": 77.2090,
  "radius_km": 10,
  "skill_filter": "uuid"
}
```

### Worker Profiles

#### Get Worker Details
```http
GET /worker_profiles?user_id=eq.{user_id}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "headline": "Professional Plumber",
  "hourly_rate": 150.00,
  "experience_years": 10,
  "is_available": true,
  "average_rating": 4.8,
  "total_gigs_completed": 45,
  "total_earnings": 67500.00
}
```

#### Update Availability
```http
PATCH /worker_profiles?user_id=eq.{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_available": false
}
```

### Bids

#### Submit Bid
```http
POST /gig_bids
Authorization: Bearer <token>
Content-Type: application/json

{
  "gig_id": "uuid",
  "worker_id": "uuid",
  "proposed_amount": 450.00,
  "proposed_duration": 2,
  "cover_letter": "I have 10 years experience in plumbing..."
}
```

#### Get My Bids
```http
GET /gig_bids?worker_id=eq.{worker_id}&order=created_at.desc
Authorization: Bearer <token>
```

### Wallet & Transactions

#### Get Wallet Balance
```http
GET /wallets?user_id=eq.{user_id}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "balance": 5000.00,
  "held_balance": 500.00,
  "available_balance": 4500.00,
  "currency": "INR"
}
```

#### Get Transaction History
```http
GET /transactions?or=(from_user_id.eq.{user_id},to_user_id.eq.{user_id})&order=created_at.desc&limit=50
Authorization: Bearer <token>
```

### Messages

#### Send Message
```http
POST /messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversation_id": "uuid",
  "sender_id": "uuid",
  "receiver_id": "uuid",
  "message_text": "Hello, I'm interested in this gig",
  "gig_id": "uuid"
}
```

#### Get Conversation
```http
GET /messages?conversation_id=eq.{conversation_id}&order=created_at.asc
Authorization: Bearer <token>
```

#### Mark as Read
```http
PATCH /messages?id=eq.{message_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_read": true,
  "read_at": "2026-01-09T12:00:00Z"
}
```

### Reviews

#### Submit Review
```http
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "gig_id": "uuid",
  "reviewer_id": "uuid",
  "reviewee_id": "uuid",
  "rating": 5,
  "review_text": "Excellent work, very professional!",
  "quality_rating": 5,
  "communication_rating": 5,
  "professionalism_rating": 5,
  "timeliness_rating": 5
}
```

#### Get Worker Reviews
```http
GET /reviews?reviewee_id=eq.{worker_id}&order=created_at.desc
Authorization: Bearer <token>
```

### Notifications

#### Get My Notifications
```http
GET /notifications?user_id=eq.{user_id}&is_read=eq.false&order=created_at.desc
Authorization: Bearer <token>
```

#### Mark Notification as Read
```http
PATCH /notifications?id=eq.{notification_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_read": true,
  "read_at": "2026-01-09T12:00:00Z"
}
```

## Edge Functions

### Payment Webhook

```http
POST /functions/v1/payment-webhook
Content-Type: application/json
X-Razorpay-Signature: <signature>

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "amount": 50000,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

### Send Notification

```http
POST /functions/v1/send-notification
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "uuid",
  "title": "New Gig Alert",
  "body": "A new gig matching your skills is available nearby",
  "data": {
    "gig_id": "uuid",
    "action": "view_gig"
  }
}
```

### AI Matching

```http
POST /functions/v1/ai-matching
Authorization: Bearer <token>
Content-Type: application/json

{
  "gig_id": "uuid",
  "max_workers": 10
}
```

**Response**:
```json
{
  "matched_workers": [
    {
      "worker_id": "uuid",
      "match_score": 0.95,
      "reasons": ["High rating", "Nearby location", "Relevant experience"]
    }
  ]
}
```

## Real-time Subscriptions

### Subscribe to Gig Updates

```javascript
const subscription = supabase
  .channel('gig-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'gigs',
      filter: `status=eq.open`
    },
    (payload) => {
      console.log('Gig updated:', payload);
    }
  )
  .subscribe();
```

### Subscribe to New Messages

```javascript
const subscription = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${userId}`
    },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Rate Limiting

- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Premium**: 10000 requests/hour

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641024000
```

## Pagination

Use `limit` and `offset` parameters:

```http
GET /gigs?limit=20&offset=40
```

Or use range headers:
```http
GET /gigs
Range: 0-19
```

Response headers:
```http
Content-Range: 0-19/100
```

## Filtering

### Exact Match
```http
GET /profiles?user_type=eq.worker
```

### Pattern Matching
```http
GET /profiles?full_name=ilike.*john*
```

### Numerical Comparison
```http
GET /gigs?budget_amount=gte.500&budget_amount=lte.1000
```

### Multiple Conditions (AND)
```http
GET /gigs?status=eq.open&budget_amount=gte.500
```

### Multiple Conditions (OR)
```http
GET /gigs?or=(status.eq.open,status.eq.in_progress)
```

## Best Practices

1. **Use PostgreSQL functions** for complex queries
2. **Enable RLS** on all tables
3. **Validate input** on both client and server
4. **Use transactions** for multi-step operations
5. **Implement retry logic** for network errors
6. **Cache responses** where appropriate
7. **Use connection pooling** for backend services

---

**API Version**: v1  
**Last Updated**: 2026-01-09
