# Accessibility Features Implementation

This document outlines the accessibility features implemented in Stellar-Spend to ensure the application is usable by all users, including those with disabilities.

## Overview

The following accessibility features have been implemented across four GitHub issues:

- **Issue #391**: Undo Functionality
- **Issue #392**: Transaction Preview
- **Issue #393**: ARIA Labels & Screen Reader Support
- **Issue #394**: Keyboard Navigation

---

## Issue #391: Undo Functionality

### Components

#### `useUndo` Hook (`src/hooks/useUndo.ts`)

A React hook that manages undo/redo functionality with automatic timeout.

**Features:**
- Track undoable actions with descriptions
- Undo and redo operations
- Automatic action expiration (default: 30 seconds)
- History limit (default: 50 actions)
- Redo support for actions that implement it

**Usage:**

```typescript
const { addAction, undo, redo, canUndo, canRedo, lastAction } = useUndo({
  maxHistory: 50,
  timeout: 30000, // 30 seconds
});

// Add an undoable action
addAction({
  id: "action-1",
  description: "Cleared form",
  undo: () => {
    // Restore previous state
  },
  redo: () => {
    // Reapply action
  },
  timestamp: Date.now(),
});

// Trigger undo
if (canUndo) {
  undo();
}
```

#### `UndoNotification` Component (`src/components/UndoNotification.tsx`)

Displays a toast notification with an undo button.

**Features:**
- Shows action description
- Provides quick undo button
- Auto-dismisses after 5 seconds
- Accessible with ARIA labels

**Usage:**

```typescript
const { lastAction, canUndo, undo } = useUndo();

<UndoNotification
  action={lastAction}
  onUndo={undo}
  isVisible={canUndo}
/>
```

---

## Issue #392: Transaction Preview

### Components

#### `TransactionPreviewModal` Component (`src/components/TransactionPreviewModal.tsx`)

A modal dialog that displays all transaction details before confirmation.

**Features:**
- Shows amount and destination amount
- Displays exchange rate
- Breaks down all fees (bridge, payout, total)
- Shows recipient details
- Displays estimated transaction time
- Edit and confirm buttons
- Accessible with ARIA labels and semantic HTML

**Data Structure:**

```typescript
interface TransactionPreviewData {
  amount: string;
  currency: string;
  destinationAmount: string;
  rate: number;
  bridgeFee: string;
  payoutFee: string;
  totalFee: string;
  feeMethod: "native" | "stablecoin";
  accountName: string;
  accountNumber: string;
  bankName: string;
  estimatedTime: number;
}
```

**Usage:**

```typescript
<TransactionPreviewModal
  isOpen={showPreview}
  data={previewData}
  isLoading={isProcessing}
  onConfirm={handleConfirm}
  onEdit={handleEdit}
  onCancel={handleCancel}
/>
```

---

## Issue #393: ARIA Labels & Screen Reader Support

### Utilities

#### `aria-labels.ts` (`src/lib/aria-labels.ts`)

Centralized ARIA labels and descriptions for consistent accessibility.

**Includes:**
- Navigation labels
- Form field labels
- Button labels
- Status messages
- Modal labels
- Table labels
- Live region announcements
- Descriptions for complex elements

**Usage:**

```typescript
import { ariaLabels, ariaDescriptions } from "@/lib/aria-labels";

<input aria-label={ariaLabels.amountInput} />
<button aria-label={ariaLabels.submitTransaction}>Submit</button>
<div aria-describedby="fee-description">
  {fee}
  <span id="fee-description">{ariaDescriptions.bridgeFee}</span>
</div>
```

### Components

#### `AccessibleFormComponents.tsx` (`src/components/AccessibleFormComponents.tsx`)

Reusable accessible form components with built-in ARIA support.

**Components:**

1. **AccessibleFormField**
   - Wraps form inputs with labels and descriptions
   - Handles error states with ARIA alerts
   - Links descriptions to inputs via aria-describedby

2. **AccessibleButton**
   - Semantic button with ARIA labels
   - Supports variants (primary, secondary, danger)
   - Disabled state management

3. **AccessibleAlert**
   - Accessible alert/status messages
   - Supports success, error, warning, info types
   - Uses appropriate ARIA roles (alert, status)
   - Live region announcements

**Usage:**

```typescript
<AccessibleFormField
  id="amount"
  label="Amount"
  description="Enter the amount in USDC"
  error={error}
  required
>
  <input id="amount" type="number" />
</AccessibleFormField>

<AccessibleButton
  onClick={handleSubmit}
  ariaLabel="Submit transaction"
  variant="primary"
>
  Submit
</AccessibleButton>

<AccessibleAlert
  type="error"
  title="Error"
  message="Transaction failed"
  onClose={handleDismiss}
/>
```

#### `SkipLinks.tsx` (`src/components/SkipLinks.tsx`)

Skip links for keyboard navigation to main content areas.

**Features:**
- Hidden by default (screen reader only)
- Visible on focus
- Jumps to main content sections
- Smooth scrolling

**Usage:**

```typescript
<SkipLinks />
```

**CSS Classes:**
- `.sr-only` - Screen reader only content
- `.focus-within:not-sr-only` - Show on focus

---

## Issue #394: Keyboard Navigation

### Utilities

#### `keyboard-navigation.ts` (`src/lib/keyboard-navigation.ts`)

Comprehensive keyboard navigation utilities.

**Hooks:**

1. **useFocusTrap**
   - Traps focus within a modal/dialog
   - Prevents focus from leaving the container
   - Restores focus on unmount
   - Handles Tab and Shift+Tab

2. **useKeyboardShortcuts**
   - Registers global keyboard shortcuts
   - Supports Ctrl/Cmd, Shift, Alt modifiers
   - Skips shortcuts when typing in form fields
   - Platform-aware (Mac vs Windows)

**Utilities:**

- `getFocusableElements()` - Get all focusable elements in a container
- `focusNextElement()` - Move focus to next element
- `focusPreviousElement()` - Move focus to previous element
- `announceToScreenReader()` - Announce messages to screen readers

**Usage:**

```typescript
// Focus trap in modal
const containerRef = useFocusTrap({ returnFocus: true });

<div ref={containerRef} role="dialog">
  {/* Modal content */}
</div>

// Keyboard shortcuts
useKeyboardShortcuts([
  {
    key: "s",
    ctrl: true,
    description: "Submit transaction",
    action: handleSubmit,
  },
  {
    key: "Escape",
    description: "Close modal",
    action: handleClose,
  },
]);

// Announce to screen readers
announceToScreenReader("Transaction submitted successfully", "polite");
```

### Components

#### `KeyboardShortcutsReference.tsx` (`src/components/KeyboardShortcutsReference.tsx`)

Modal displaying all available keyboard shortcuts.

**Features:**
- Categorized shortcuts (navigation, form, transaction, general)
- Filter by category
- Visual keyboard key display
- Accessible modal with focus management

**Shortcuts:**

| Keys | Description | Category |
|------|-------------|----------|
| Tab | Move to next element | Navigation |
| Shift+Tab | Move to previous element | Navigation |
| Escape | Close modal | Navigation |
| Enter | Activate button | Navigation |
| Space | Toggle checkbox | Navigation |
| Alt+A | Focus amount input | Form |
| Alt+C | Focus currency selector | Form |
| Alt+B | Focus bank selector | Form |
| Ctrl+Enter | Submit transaction | Transaction |
| Ctrl+Z | Undo last action | Transaction |
| Ctrl+Y | Redo last action | Transaction |
| ? | Show shortcuts | General |
| Ctrl+K | Open command palette | General |

**Usage:**

```typescript
const [shortcutsOpen, setShortcutsOpen] = useState(false);

<KeyboardShortcutsModal
  isOpen={shortcutsOpen}
  onClose={() => setShortcutsOpen(false)}
/>
```

---

## CSS Accessibility Classes

Added to `src/app/globals.css`:

### `.sr-only`
Hides content visually but keeps it available to screen readers.

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### `.focus-within:not-sr-only`
Shows sr-only content when focused (for skip links).

```css
.focus-within\:not-sr-only:focus-within {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Integration Guide

### Adding Undo to a Component

```typescript
import { useUndo } from "@/hooks/useUndo";
import { UndoNotification } from "@/components/UndoNotification";

export function MyComponent() {
  const { addAction, undo, canUndo, lastAction } = useUndo();

  const handleClearForm = () => {
    const previousState = { /* ... */ };
    
    addAction({
      id: "clear-form",
      description: "Cleared form",
      undo: () => {
        // Restore previousState
      },
      timestamp: Date.now(),
    });
  };

  return (
    <>
      <button onClick={handleClearForm}>Clear</button>
      <UndoNotification
        action={lastAction}
        onUndo={undo}
        isVisible={canUndo}
      />
    </>
  );
}
```

### Adding Transaction Preview

```typescript
import { TransactionPreviewModal } from "@/components/TransactionPreviewModal";

export function TransactionForm() {
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<TransactionPreviewData | null>(null);

  const handleReview = async () => {
    const data = await fetchTransactionDetails();
    setPreviewData(data);
    setShowPreview(true);
  };

  return (
    <>
      <button onClick={handleReview}>Review Transaction</button>
      <TransactionPreviewModal
        isOpen={showPreview}
        data={previewData}
        onConfirm={handleConfirm}
        onEdit={() => setShowPreview(false)}
        onCancel={() => setShowPreview(false)}
      />
    </>
  );
}
```

### Adding Keyboard Shortcuts

```typescript
import { useKeyboardShortcuts } from "@/lib/keyboard-navigation";

export function MyApp() {
  useKeyboardShortcuts([
    {
      key: "?",
      description: "Show help",
      action: () => setHelpOpen(true),
    },
    {
      key: "k",
      ctrl: true,
      description: "Open command palette",
      action: () => setCommandPaletteOpen(true),
    },
  ]);

  return <>{/* ... */}</>;
}
```

---

## Testing Accessibility

### Screen Reader Testing
- Test with NVDA (Windows), JAWS, or VoiceOver (Mac)
- Verify all interactive elements are announced
- Check form labels and descriptions are read
- Test live regions for dynamic updates

### Keyboard Navigation Testing
- Navigate entire app using only Tab/Shift+Tab
- Test all keyboard shortcuts
- Verify focus is visible and logical
- Check focus trap in modals

### Automated Testing
```bash
npm test -- accessibility.test.tsx
```

---

## Browser Support

All accessibility features are supported in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
