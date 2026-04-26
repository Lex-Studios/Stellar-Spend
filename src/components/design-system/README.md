# Design System Components

Reusable component library for consistent UI across the application.

## Components

### Button
Primary interactive element with variants and sizes.

```tsx
import { Button } from '@/components/design-system';

<Button variant="primary" size="md">Click me</Button>
<Button variant="secondary" isLoading>Loading...</Button>
<Button variant="danger" disabled>Disabled</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- Standard HTML button attributes

### Card
Container component for content grouping.

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/design-system';

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined'

### Badge
Small label component for status or tags.

```tsx
import { Badge } from '@/components/design-system';

<Badge variant="success">Active</Badge>
<Badge variant="error">Failed</Badge>
```

**Props:**
- `variant`: 'default' | 'success' | 'warning' | 'error' | 'info'

### Alert
Message container for notifications.

```tsx
import { Alert } from '@/components/design-system';

<Alert variant="info" title="Info">
  This is an informational message
</Alert>
```

**Props:**
- `variant`: 'info' | 'success' | 'warning' | 'error'
- `title`: string (optional)
