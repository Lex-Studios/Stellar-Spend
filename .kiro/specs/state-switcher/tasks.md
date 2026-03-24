# Implementation Plan: StateSwitcher

## Overview

Build a controlled, dev-only tab-bar component that lets developers cycle through `WalletFlowState` values, wire it into `page.tsx` via `useWalletFlow`, and gate its visibility with `NODE_ENV` / `NEXT_PUBLIC_ENABLE_STATE_SWITCHER`.

## Tasks

- [ ] 1. Create the `StateSwitcher` component
  - Create `src/components/StateSwitcher.tsx` with the `StateSwitcherProps` interface (`state: WalletFlowState`, `onStateChange: (state: WalletFlowState) => void`)
  - Define the static `TABS` array outside the component with labels and values matching Requirement 1.2
  - Implement the visibility guard (`NODE_ENV` + `NEXT_PUBLIC_ENABLE_STATE_SWITCHER`) at the top of the render function
  - Render a `<div role="tablist">` containing three `<button role="tab">` elements
  - Apply gold background / dark text to the active tab and transparent / muted text to inactive tabs
  - Set `aria-selected` correctly on each button
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

- [ ] 2. Add keyboard navigation to `StateSwitcher`
  - [ ] 2.1 Implement `ArrowRight` / `ArrowLeft` focus management using a `refs` array and wrap-around index arithmetic
    - `ArrowRight`: `(currentIndex + 1) % 3`
    - `ArrowLeft`: `(currentIndex + 2) % 3`
    - Call `element.focus()` on the target button ref
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 2.2 Implement `Enter` / `Space` activation in the same `onKeyDown` handler
    - Call `onStateChange` with the focused tab's `WalletFlowState` value
    - _Requirements: 4.3_

  - [ ]* 2.3 Write property test for arrow key navigation (Property 4)
    - **Property 4: Arrow key navigation wraps correctly**
    - Arbitrary: `fc.integer({ min: 0, max: 2 })` × `fc.constantFrom("ArrowLeft", "ArrowRight")`
    - Assert focus lands on `(index + 1) % 3` for `ArrowRight` and `(index + 2) % 3` for `ArrowLeft`
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 2.4 Write property test for Enter/Space activation (Property 5)
    - **Property 5: Enter and Space activate the focused tab**
    - Arbitrary: `fc.integer({ min: 0, max: 2 })` × `fc.constantFrom("Enter", " ")`
    - Assert `onStateChange` is called with the correct `WalletFlowState` for the focused tab
    - **Validates: Requirements 4.3**

- [ ] 3. Write property and unit tests for `StateSwitcher` rendering and interaction
  - [ ]* 3.1 Write property test for tab count and labels (Property 1)
    - **Property 1: Always renders exactly three tabs**
    - Arbitrary: `fc.constantFrom("pre_connect", "connecting", "connected")`
    - Assert exactly 3 `button[role="tab"]` elements with labels "Pre Connect", "Connecting", "Connected" in order
    - **Validates: Requirements 1.1, 1.4**

  - [ ]* 3.2 Write property test for active tab invariant (Property 2)
    - **Property 2: Active tab invariant**
    - Arbitrary: `fc.constantFrom("pre_connect", "connecting", "connected")`
    - Assert exactly one tab has `aria-selected="true"` and active styles; all others have `aria-selected="false"` and inactive styles
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 6.1, 6.3**

  - [ ]* 3.3 Write property test for click callback (Property 3)
    - **Property 3: Click fires onStateChange with correct value**
    - Arbitrary: `fc.integer({ min: 0, max: 2 })`
    - Assert clicking tab at index `i` calls `onStateChange` exactly once with `TABS[i].value`
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 3.4 Write unit tests for visibility gating and ARIA structure
    - Renders `null` when `NODE_ENV === "production"` and flag is unset (Requirement 5.2)
    - Renders when `NODE_ENV === "development"` (Requirement 5.1)
    - Renders when `NEXT_PUBLIC_ENABLE_STATE_SWITCHER === "true"` regardless of `NODE_ENV` (Requirement 5.3)
    - Tab container has `role="tablist"` (Requirement 1.3)
    - All tabs are focusable (Requirement 4.4)
    - Label-to-value mapping: "Pre Connect" → `"pre_connect"`, etc. (Requirement 1.2)

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Integrate `StateSwitcher` into `page.tsx`
  - [ ] 5.1 Refactor `page.tsx` to use `useWalletFlow("pre_connect")` and derive `isConnected` / `isConnecting` boolean flags
    - Wire `state` and `setState` from the hook into existing components (`Header`, `FormCard`, `RightPanel`) via the derived booleans
    - _Requirements: 3.2, 6.1, 6.2_

  - [ ] 5.2 Mount `<StateSwitcher state={state} onStateChange={setState} />` in the page layout
    - Place it above or below the main content section
    - No changes needed to `Header`, `FormCard`, or `RightPanel`
    - _Requirements: 3.1, 3.2, 6.1, 6.2_

- [ ] 6. Add `NEXT_PUBLIC_ENABLE_STATE_SWITCHER` to `.env.example`
  - Append the variable with a comment explaining its purpose
  - _Requirements: 5.3_

- [ ] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations per property
- The component is stateless — `page.tsx` owns the single source of truth
