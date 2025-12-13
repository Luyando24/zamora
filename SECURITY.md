# Backend/API Security & Scalability Documentation

## Overview

This document provides comprehensive documentation for the security improvements and scalability enhancements made to the Zamora Hotel Management System backend/API.

## Table of Contents

1. [Security Features](#security-features)
2. [Authentication & Authorization](#authentication--authorization)
3. [Rate Limiting](#rate-limiting)
4. [Webhook Security](#webhook-security)
5. [Input Validation](#input-validation)
6. [Error Handling](#error-handling)
7. [Logging & Monitoring](#logging--monitoring)
8. [Configuration](#configuration)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## Security Features

### Security Headers

All HTTP responses include security headers configured in `next.config.js`:

- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### CORS Configuration

API routes include proper CORS headers to prevent unauthorized cross-origin requests.

---

## Authentication & Authorization

### Authentication

All API endpoints (except webhooks) require user authentication using Supabase Auth.

```typescript
import { authenticateRequest } from '@/lib/api/auth';

const authResult = await authenticateRequest(req);
if (!authResult.success || !authResult.user) {
  throw new AuthenticationError();
}
```

### Authorization Levels

#### 1. Hotel Access
Verifies user has access to a specific hotel/property:

```typescript
import { authorizeHotelAccess } from '@/lib/api/auth';

const access = await authorizeHotelAccess(userId, hotelId);
if (!access.authorized) {
  throw new AuthorizationError();
}
```

#### 2. Role-Based Access Control (RBAC)
Requires specific user roles:

```typescript
import { requireRole } from '@/lib/api/auth';

const roleCheck = await requireRole(userId, ['admin', 'manager']);
if (!roleCheck.authorized) {
  throw new AuthorizationError();
}
```

#### 3. Resource Ownership
Verifies user owns or has access to a resource:

```typescript
import { authorizeFolioAccess } from '@/lib/api/auth';

const access = await authorizeFolioAccess(userId, folioId);
if (!access.authorized) {
  throw new AuthorizationError();
}
```

---

## Rate Limiting

### Configuration

Predefined rate limit configurations in `lib/api/rate-limit.ts`:

| Limit Type | Requests | Window | Use Case |
|------------|----------|--------|----------|
| STRICT | 10 | 1 minute | Sensitive endpoints |
| STANDARD | 60 | 1 minute | General API |
| RELAXED | 100 | 1 minute | Authenticated users |
| PAYMENT | 5 | 5 minutes | Payment endpoints |
| UPLOAD | 10 | 1 minute | File uploads |
| WEBHOOK | 1000 | 1 minute | Webhook endpoints |

### Implementation

```typescript
import { rateLimitCombined, RATE_LIMITS } from '@/lib/api/rate-limit';

const rateLimitResult = await rateLimitCombined(ip, userId, {
  ipConfig: RATE_LIMITS.STANDARD,
  userConfig: RATE_LIMITS.RELAXED,
});

if (!rateLimitResult.success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
  );
}
```

### Production Rate Limiting

For production with multiple server instances, use Redis (Upstash or Vercel KV). See commented implementation in `lib/api/rate-limit.ts`.

---

## Webhook Security

### Signature Verification

All webhooks must include a valid HMAC signature:

```typescript
import { verifyHMACSignature, verifyTimestamp } from '@/lib/api/webhook-verify';

// Verify signature
const signatureResult = verifyHMACSignature(
  rawBody,
  signature,
  WEBHOOK_SECRET
);

// Verify timestamp (prevent replay attacks)
const timestampResult = verifyTimestamp(timestamp, 300); // 5 min window
```

### Configuration

Set webhook secrets in environment variables:

```bash
MOMO_WEBHOOK_SECRET=your-secret-key
MOMO_WEBHOOK_IP_WHITELIST=1.2.3.4,5.6.7.8  # Optional
```

### Replay Attack Prevention

Webhooks include timestamp validation to prevent replay attacks (5-minute window by default).

### IP Whitelisting

Optional IP whitelist for webhook sources:

```typescript
const ipCheck = verifyIPWhitelist(ip, WEBHOOK_IP_WHITELIST);
```

---

## Input Validation

### Zod Schemas

All API inputs are validated using Zod schemas in `lib/api/validators.ts`:

```typescript
import { validateRequest, bookingCreateSchema } from '@/lib/api/validators';

const validation = validateRequest(bookingCreateSchema, body);
if (!validation.success) {
  return createErrorResponse(validation.errors);
}
```

### Available Schemas

- `bookingCreateSchema` - Booking creation
- `paymentSchema` - Payment initiation
- `uploadSchema` - File uploads
- `zraInvoiceSchema` - ZRA submissions
- `momoWebhookSchema` - Mobile money webhooks

### Custom Validation

Add custom validation logic:

```typescript
.refine((data) => {
  // Custom validation logic
  return someCondition;
}, {
  message: 'Custom error message',
  path: ['fieldName'],
});
```

---

## Error Handling

### Custom Error Classes

```typescript
import { 
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
} from '@/lib/api/errors';

throw new AuthenticationError('Custom message');
```

### Error Response Format

```json
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details (only in development)
  }
}
```

### Error Sanitization

Errors are sanitized to prevent information leakage in production:

- Stack traces only shown in development
- Internal error details hidden
- Generic messages for unexpected errors

---

## Logging & Monitoring

### Structured Logging

```typescript
import { logger } from '@/lib/monitoring/logger';

logger.info('Operation successful', { userId, bookingId });
logger.error('Operation failed', error, { userId, context });
```

### Log Levels

- `DEBUG` - Detailed debugging information
- `INFO` - General informational messages
- `WARN` - Warning messages
- `ERROR` - Error messages

### Request Tracking

Each request includes a unique request ID:

```typescript
import { generateRequestId } from '@/lib/monitoring/logger';

const requestId = generateRequestId();
```

Response includes request ID in header:
```
X-Request-ID: 1638450000000-abc123
```

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key

# Optional (for production)
MOMO_WEBHOOK_SECRET=your-secret
ZRA_HOTEL_TPIN=your-tpin
UPSTASH_REDIS_REST_URL=your-redis-url
```

### Database Connection

The system uses a singleton pattern for Supabase admin client to prevent connection pool exhaustion:

```typescript
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

const supabase = getSupabaseAdmin();
```

---

## Testing

### Security Tests

```bash
# Test authentication
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Should return 401 Unauthorized

# Test rate limiting
for i in {1..100}; do
  curl http://localhost:3000/api/bookings
done
# Should return 429 after limit
```

### Webhook Testing

```bash
# Test webhook with invalid signature
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: invalid" \
  -d '{"test": "data"}'
# Should return 401
```

---

## Deployment

### Vercel Deployment

1. Set environment variables in Vercel dashboard
2. Deploy: `vercel --prod`

### Critical Security Checklist

- [ ] All environment variables configured
- [ ] HTTPS enforced
- [ ] Webhook secrets rotated
- [ ] Rate limiting tested
- [ ] Error tracking configured
- [ ] Database RLS policies enabled
- [ ] API authentication tested

### Production Recommendations

1. **Use Redis for rate limiting** - Enable Vercel KV or Upstash
2. **Enable error tracking** - Set up Sentry or similar
3. **Configure logging** - Use Axiom, Datadog, or CloudWatch
4. **Set up monitoring** - Configure uptime and performance monitoring
5. **Rotate secrets regularly** - Webhook secrets, API keys
6. **Review security headers** - Adjust CSP as needed
7. **Enable CORS properly** - Configure allowed origins
8. **Test backup/restore** - Ensure data can be recovered

---

## API Endpoints Summary

### POST /api/bookings
- **Auth**: Required
- **Rate Limit**: Standard (60/min)
- **Validation**: bookingCreateSchema
- **Authorization**: Hotel access required

### POST /api/payments/momo
- **Auth**: Required
- **Rate Limit**: Strict (5/5min)
- **Validation**: paymentSchema
- **Authorization**: Folio access required

### POST /api/payments/webhook
- **Auth**: Signature verification
- **Rate Limit**: High (1000/min)
- **Validation**: momoWebhookSchema
- **Security**: HMAC + timestamp + IP whitelist

### POST /api/upload
- **Auth**: Required
- **Rate Limit**: Upload limit (10/min)
- **Validation**: uploadSchema
- **Security**: File type + size validation

### POST /api/zra/submit-invoice
- **Auth**: Required
- **Rate Limit**: Standard (60/min)
- **Validation**: zraInvoiceSchema
- **Authorization**: Folio access required

---

## Support

For issues or questions:
- Review logs in console (development)
- Check error tracking service (production)
- Review request ID for specific requests
- Contact development team

---

**Last Updated**: December 2025
