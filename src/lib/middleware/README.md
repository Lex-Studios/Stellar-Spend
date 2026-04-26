# Error Handling Middleware

Centralized error handling and standardized error responses for API routes.

## Error Codes

All errors follow the pattern `ERR_XXXX` where XXXX is a numeric code:

- **4000-4099**: Validation errors (HTTP 400)
- **4010-4019**: Authentication errors (HTTP 401)
- **4020-4099**: Business logic errors (HTTP 400)
- **5000-5099**: Server errors (HTTP 500)

## Usage

### Basic Error Handling

```typescript
import { errorMiddleware, AppError, ERROR_CODES } from '@/lib/middleware';
import { NextRequest, NextResponse } from 'next/server';

async function handler(req: NextRequest) {
  if (!req.body) {
    throw new AppError(ERROR_CODES.MISSING_REQUIRED_FIELD, 'Body is required');
  }
  return NextResponse.json({ success: true });
}

export const POST = errorMiddleware(handler);
```

### With Logging

```typescript
import { composeMiddleware, errorMiddleware, requestLoggingMiddleware } from '@/lib/middleware';

const middleware = composeMiddleware(
  errorMiddleware,
  requestLoggingMiddleware
);

export const POST = middleware(handler);
```

### Error Response Format

```json
{
  "error": {
    "code": "ERR_4001",
    "message": "Invalid input provided",
    "details": {
      "field": "amount",
      "reason": "Must be positive"
    }
  },
  "timestamp": "2024-04-26T13:03:04.377Z",
  "requestId": "1234567890-abc123"
}
```

## Error Codes Reference

| Code | Message | HTTP Status |
|------|---------|-------------|
| ERR_4001 | Invalid input provided | 400 |
| ERR_4002 | Missing required field | 400 |
| ERR_4003 | Invalid amount | 400 |
| ERR_4004 | Invalid currency | 400 |
| ERR_4010 | Unauthorized access | 401 |
| ERR_4011 | Invalid API key | 401 |
| ERR_4020 | Insufficient balance | 400 |
| ERR_4021 | Transaction failed | 400 |
| ERR_4022 | Bridge service unavailable | 400 |
| ERR_4023 | Payout failed | 400 |
| ERR_5000 | Internal server error | 500 |
| ERR_5001 | Database error | 500 |
| ERR_5002 | External service error | 500 |
| ERR_5003 | Request timeout | 500 |
