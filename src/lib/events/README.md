# Event-Driven Architecture

## Overview

The event bus provides decoupled communication between modules using a publish-subscribe pattern.

## Event Types

- `transaction.created` - Transaction initiated
- `transaction.completed` - Transaction finished successfully
- `transaction.failed` - Transaction failed
- `bridge.initiated` - Bridge transfer started
- `bridge.completed` - Bridge transfer completed
- `payout.initiated` - Payout order created
- `payout.completed` - Payout settled
- `payout.failed` - Payout failed
- `error.occurred` - Application error

## Usage

```typescript
import { eventBus } from '@/lib/events';

// Subscribe to events
eventBus.on('transaction.completed', async (event) => {
  console.log('Transaction completed:', event.data);
});

// Emit events
await eventBus.emit('transaction.completed', {
  id: 'tx-123',
  amount: 100,
});

// One-time listener
eventBus.once('bridge.completed', async (event) => {
  console.log('Bridge completed once');
});

// Unsubscribe
eventBus.off('transaction.completed', handler);
```

## Event Structure

```typescript
interface Event<T> {
  type: EventType;
  timestamp: number;
  data: T;
  id: string;
}
```

## Configuration

```typescript
const eventBus = new EventBus({
  maxListeners: 10,
  logEvents: true,
});
```
