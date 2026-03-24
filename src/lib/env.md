# Environment Configuration Module

This module centralizes all environment variable access with proper type safety and validation.

## Files Created

- `src/lib/env.ts` - Main environment configuration module
- `src/types/env.d.ts` - TypeScript declarations for environment variables
- Updated `.env.example` - Added missing `NEXT_PUBLIC_STELLAR_USDC_ISSUER`

## Features

✅ **Typed Constants**: All required environment variables are exported as typed constants  
✅ **Fast Failure**: Missing variables throw descriptive errors at module load time  
✅ **Server/Client Separation**: Clear separation between server-side and public variables  
✅ **Type Safety**: Full TypeScript support with proper declarations  
✅ **Usage Examples**: Demonstrated in API routes and client components

## Usage

### Server-side (API routes, SSR)

```typescript
import { PAYCREST_API_KEY, BASE_PRIVATE_KEY } from '@/lib/env';
```

### Client-side (React components)

```typescript
import { NEXT_PUBLIC_BASE_RETURN_ADDRESS } from '@/lib/env';
```

## Environment Variables

### Server-side Only

- `PAYCREST_API_KEY`
- `PAYCREST_WEBHOOK_SECRET`
- `BASE_PRIVATE_KEY`
- `BASE_RETURN_ADDRESS`
- `BASE_RPC_URL`
- `STELLAR_SOROBAN_RPC_URL`
- `STELLAR_HORIZON_URL`

### Public (Client-safe)

- `NEXT_PUBLIC_BASE_RETURN_ADDRESS`
- `NEXT_PUBLIC_STELLAR_USDC_ISSUER`

## ESLint Rule

The module includes a suggested ESLint rule to prevent importing server-side variables in client components.
