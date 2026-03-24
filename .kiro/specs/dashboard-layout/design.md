# Design Document: Dashboard Layout

## Overview

The dashboard layout feature restructures `src/app/page.tsx` to implement a responsive two-column grid on desktop (>1100px) and a single-column stacked layout on mobile (≤1100px). The layout composes four components — `FormCard`, `RightPanel`, `RecentOfframpsTable`, and `ProgressSteps` — inside a full-viewport outer container with a bordered inner section.

The project uses Tailwind CSS v4 (imported via `@import "tailwindcss"` in `globals.css`) with custom design tokens defined in `@theme inline`. There are no custom breakpoints configured, so the 1100px threshold requires an arbitrary-value variant (`max-[1100px]:` / `min-[1101px]:`) or a CSS Grid approach with a container query. Given the existing codebase uses raw Tailwind arbitrary values (e.g. `max-[720px]:` in `Header.tsx`), the same pattern is appropriate here.

## Architecture

The layout is a pure presentational concern confined to `src/app/page.tsx`. No new state, hooks, or API routes are required. The two components that don't yet exist (`RecentOfframpsTable`, `ProgressSteps`) will be created as minimal stub components so the layout can be wired up and tested independently of their full implementations.

```
src/app/page.tsx          ← layout shell (OuterContainer + InnerSection + grid)
src/components/
  FormCard.tsx            ← existing, no changes
  RightPanel.tsx          ← existing, no changes
  RecentOfframpsTable.tsx ← new stub component
  ProgressSteps.tsx       ← new stub component
```

## Components and Interfaces

### OuterContainer

The root `<main>` element of `page.tsx`.

- `min-h-screen` — fills full viewport height
- `p-4` — 1rem uniform padding on all sides
- `bg-[#0a0a0a]` — matches existing `--bg` token

### InnerSection

A `<section>` nested directly inside `OuterContainer`.

- `border border-[#333333]` — visible border on all sides (matches `--line` token)
- Desktop padding: `px-[2.6rem] py-8`
- Mobile padding: `p-4`
- Tailwind classes: `px-[2.6rem] py-8 max-[1100px]:p-4`
  - Note: Tailwind v4 processes arbitrary variants; `max-[1100px]:p-4` overrides the desktop padding at ≤1100px.

### Grid Container

A `<div>` inside `InnerSection` that owns the grid layout.

Desktop (>1100px):
```
grid grid-cols-[1fr_370px] gap-6
```

Mobile (≤1100px):
```
flex flex-col gap-6
```

Combined class string:
```
grid grid-cols-[1fr_370px] gap-6 max-[1100px]:grid-cols-1
```

### Grid Item Placement

| Component            | Desktop placement                        | Mobile order |
|----------------------|------------------------------------------|--------------|
| `FormCard`           | col 1, row 1 (natural flow)              | 1st           |
| `RightPanel`         | col 2, rows 1–2 (`row-span-2`)           | 2nd           |
| `RecentOfframpsTable`| col 1, row 2 (natural flow after FormCard)| 3rd          |
| `ProgressSteps`      | hidden on desktop (or col 1, row 3)      | 4th           |

On desktop, `RightPanel` must span two rows. This is achieved with `row-span-2` and placing it second in DOM order (col-start-2 row-start-1). `FormCard` and `RecentOfframpsTable` flow naturally into col 1.

DOM order for correct mobile stacking:
1. `FormCard`
2. `RightPanel`
3. `RecentOfframpsTable`
4. `ProgressSteps`

On desktop, `RightPanel` needs explicit grid placement to sit in column 2:
```
col-start-2 row-start-1 row-span-2
```

`ProgressSteps` is hidden on desktop (only relevant in mobile stacking order):
```
max-[1100px]:block hidden
```

### Overflow Prevention

The `InnerSection` and grid container both receive `overflow-hidden` to clip any child that would otherwise cause horizontal scroll. Additionally, `w-full` is applied to the grid container so it never exceeds the inner section width.

### RecentOfframpsTable (stub)

```tsx
// src/components/RecentOfframpsTable.tsx
export default function RecentOfframpsTable() {
  return (
    <div className="border border-[#333333] bg-[#111111] p-5">
      <span className="text-[10px] tracking-[0.2em] text-[#777777] uppercase">
        Recent Offramps
      </span>
    </div>
  );
}
```

### ProgressSteps (stub)

```tsx
// src/components/ProgressSteps.tsx
export default function ProgressSteps() {
  return (
    <div className="border border-[#333333] bg-[#111111] p-5">
      <span className="text-[10px] tracking-[0.2em] text-[#777777] uppercase">
        Progress Steps
      </span>
    </div>
  );
}
```

## Data Models

This feature has no data models. It is a purely structural/presentational layout change. All data flows through existing component props (`FormCard`, `RightPanel`) which are unchanged.

## Mermaid Diagram

```mermaid
graph TD
  subgraph page.tsx
    OC[OuterContainer - main - min-h-screen p-4]
    IS[InnerSection - section - border px-[2.6rem] py-8]
    GC[Grid Container - grid grid-cols-[1fr_370px]]
    FC[FormCard - col1 row1]
    RP[RightPanel - col2 row1-2]
    RT[RecentOfframpsTable - col1 row2]
    PS[ProgressSteps - mobile only]
  end
  OC --> IS --> GC
  GC --> FC
  GC --> RP
  GC --> RT
  GC --> PS
```

Desktop grid visual:

```
┌─────────────────────────┬──────────────┐
│  FormCard               │  RightPanel  │
│  (col 1, row 1)         │  (col 2,     │
├─────────────────────────│   rows 1-2)  │
│  RecentOfframpsTable    │              │
│  (col 1, row 2)         │              │
└─────────────────────────┴──────────────┘
```

Mobile stack:

```
┌──────────────────────────┐
│  FormCard                │
├──────────────────────────┤
│  RightPanel              │
├──────────────────────────┤
│  RecentOfframpsTable     │
├──────────────────────────┤
│  ProgressSteps           │
└──────────────────────────┘
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Component DOM order is stable

*For any* rendering of the dashboard page, the four layout components must appear in the DOM in the order: `FormCard`, `RightPanel`, `RecentOfframpsTable`, `ProgressSteps`. This order determines the visual stacking sequence on mobile and must never change regardless of viewport size or component state.

**Validates: Requirements 2.2**

---

The remaining acceptance criteria are best validated as concrete examples rather than universally-quantified properties, because they test specific class strings on specific elements:

**Example E1 — Grid column definition**: The grid container element has both `grid-cols-[1fr_370px]` (desktop) and `max-[1100px]:grid-cols-1` (mobile collapse) in its class list.
**Validates: Requirements 1.1, 2.1**

**Example E2 — RightPanel spanning**: The wrapper around `RightPanel` has `col-start-2 row-start-1 row-span-2` classes so it occupies column 2 across both grid rows on desktop.
**Validates: Requirements 1.3**

**Example E3 — OuterContainer sizing**: The outer `<main>` element has `min-h-screen` and `p-4` in its class list.
**Validates: Requirements 3.1, 3.2**

**Example E4 — InnerSection border and padding**: The inner `<section>` element has a `border` class, `px-[2.6rem] py-8` for desktop, and `max-[1100px]:p-4` for mobile.
**Validates: Requirements 4.1, 4.2, 4.3**

**Example E5 — Overflow prevention**: The grid container has `overflow-hidden` and `w-full` so no child can cause horizontal scroll.
**Validates: Requirements 2.3, 5.1, 5.2**

## Error Handling

This feature is purely structural with no async operations, API calls, or user input. Error handling is limited to:

- **Missing stub components**: If `RecentOfframpsTable` or `ProgressSteps` are not yet created, the build will fail with a module-not-found error. Both stubs must be created before `page.tsx` imports them.
- **Tailwind arbitrary value syntax**: The classes `grid-cols-[1fr_370px]`, `px-[2.6rem]`, and `max-[1100px]:` use Tailwind v4 arbitrary value syntax. If the Tailwind build does not process these (e.g. due to content glob misconfiguration), the layout will fall back to unstyled. The fix is to ensure `src/app/page.tsx` is included in Tailwind's content scan (Tailwind v4 auto-detects by default).
- **Row-span without explicit placement**: If `RightPanel` is not given `col-start-2 row-start-1`, CSS Grid auto-placement may put it in an unexpected cell when the grid has implicit rows. Explicit placement is required.

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are used. Unit tests cover specific structural examples (class presence, element existence). The one universally-quantified property (DOM order) is validated with a property-based test.

### Unit Tests

Focus on concrete structural assertions using React Testing Library + jsdom:

- Render `page.tsx` and assert the outer `<main>` has `min-h-screen` and `p-4` classes (E3)
- Assert the inner `<section>` has `border`, `px-[2.6rem]`, `py-8`, and `max-[1100px]:p-4` classes (E4)
- Assert the grid container has `grid-cols-[1fr_370px]` and `max-[1100px]:grid-cols-1` classes (E1)
- Assert the RightPanel wrapper has `col-start-2 row-start-1 row-span-2` classes (E2)
- Assert the grid container has `overflow-hidden` and `w-full` classes (E5)

### Property-Based Test

Library: **fast-check** (already compatible with the existing TypeScript/Next.js stack; install with `npm install --save-dev fast-check`).

Minimum 100 iterations per property test.

**Property 1 test** — DOM order invariant:

```
// Feature: dashboard-layout, Property 1: Component DOM order is stable
// For any rendering of the page, components appear in order:
// FormCard → RightPanel → RecentOfframpsTable → ProgressSteps
fc.assert(
  fc.property(
    fc.record({ isConnected: fc.boolean(), amount: fc.string() }),
    (props) => {
      const { container } = render(<Page {...props} />);
      const order = ['FormCard', 'RightPanel', 'RecentOfframpsTable', 'ProgressSteps']
        .map(name => container.querySelector(`[data-testid="${name}"]`))
        .map(el => el ? Array.from(container.querySelectorAll('[data-testid]')).indexOf(el) : -1);
      // Each index must be greater than the previous
      return order.every((idx, i) => i === 0 || idx > order[i - 1]);
    }
  ),
  { numRuns: 100 }
);
```

Each component stub must expose a `data-testid` attribute matching its component name for this test to work.

### Test Configuration

- Tag format: `// Feature: dashboard-layout, Property {number}: {property_text}`
- Each correctness property is implemented by exactly one property-based test
- Unit tests live in `src/app/__tests__/page.test.tsx`
- Property tests live in `src/app/__tests__/page.property.test.tsx`
