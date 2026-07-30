# Code Organization Guide

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── design-system/     # Design system components
│   ├── skeletons/         # Loading skeletons
│   ├── ui/                # Base UI components
│   └── *.tsx              # Feature components
├── contexts/              # React contexts
├── data/                  # Static data
├── hooks/                 # Custom React hooks
├── lib/                   # Shared utilities and services
│   ├── api-keys/          # API key management
│   ├── api-versioning/    # API versioning
│   ├── cache/             # Caching utilities
│   ├── clients/           # External service clients
│   ├── config/            # Configuration
│   ├── db/                # Database utilities
│   ├── di/                # Dependency injection
│   ├── events/            # Event bus
│   ├── graphql/           # GraphQL utilities
│   ├── i18n/              # Internationalization
│   ├── middleware/        # Express middleware
│   ├── notifications/     # Notification system
│   ├── offramp/           # Offramp feature
│   ├── polling/           # Polling utilities
│   ├── repositories/      # Data repositories
│   ├── services/          # Business logic services
│   ├── stellar/           # Stellar blockchain utilities
│   ├── validators/        # Validation schemas and services
│   ├── wallets/           # Wallet adapters
│   ├── webhook/           # Webhook handling
│   └── *.ts               # Utility modules
├── test/                  # Test utilities and mocks
└── types/                 # TypeScript type definitions
```

## Module Organization Principles

### 1. Feature Modules

Group related functionality into feature modules:

- Each feature has its own directory
- Contains types, services, components, and utilities
- Exports public API via barrel exports (index.ts)

### 2. Barrel Exports

Use index.ts files to export public APIs:

```typescript
// src/lib/validators/index.ts
export * from "./schemas";
export * from "./service";
export { ValidationService } from "./service";
```

### 3. Layered Architecture

- **Components**: UI layer (React components)
- **Services**: Business logic layer
- **Repositories**: Data access layer
- **Utilities**: Cross-cutting concerns

### 4. Naming Conventions

- Services: `*.service.ts`
- Adapters: `*.adapter.ts`
- Utilities: `*.ts` or `*.util.ts`
- Tests: `*.test.ts` or `*.spec.ts`
- Types: `*.ts` or `types.ts`

## Import Patterns

### Absolute Imports

Use path aliases for cleaner imports:

```typescript
// ✅ Good
import { ValidationService } from "@/lib/validators";
import { Button } from "@/components/ui";

// ❌ Avoid
import { ValidationService } from "../../../lib/validators";
```

### Barrel Exports

Import from barrel exports:

```typescript
// ✅ Good
import { ValidationService, amountSchema } from "@/lib/validators";

// ❌ Avoid
import { ValidationService } from "@/lib/validators/service";
import { amountSchema } from "@/lib/validators/schemas";
```

## Feature Module Template

```
src/lib/feature/
├── index.ts              # Barrel export
├── service.ts            # Business logic
├── types.ts              # Type definitions
├── adapter.ts            # External integration
├── repository.ts         # Data access
└── service.test.ts       # Tests
```

## Best Practices

1. **Keep modules focused** - Single responsibility principle
2. **Use barrel exports** - Simplify imports
3. **Organize by feature** - Not by type
4. **Minimize circular dependencies** - Use dependency injection
5. **Co-locate related code** - Keep related files together
6. **Document module purpose** - Add README or comments
7. **Use consistent naming** - Follow conventions
8. **Export public API only** - Hide implementation details

## Refactoring Checklist

- [ ] Group related functionality
- [ ] Create barrel exports
- [ ] Update import paths
- [ ] Remove circular dependencies
- [ ] Add module documentation
- [ ] Update tests
- [ ] Verify build succeeds
- [ ] Check bundle size
