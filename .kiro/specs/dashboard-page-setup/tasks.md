# Implementation Plan: Dashboard Page Setup

## Overview

Wire the existing `Header`, `FormCard`, and `RightPanel` components into a new `StellarSpendDashboard` client component, replace the placeholder `page.tsx` with a thin server component that renders it, and expand `layout.tsx` with complete Open Graph metadata.

## Tasks

- [ ] 1. Create `StellarSpendDashboard` component
  - Create `src/components/StellarSpendDashboard.tsx` with `"use client"` directive
  - Use `useStellarWallet` to source `isConnected`, `isConnecting`, `wallet`, `connect`, `disconnect`
  - Manage local state: `quote: QuoteResult | null`, `amount: string`, `currency: string`, `resetKey: number`
  - Render `Header`, `FormCard`, and `RightPanel` with props as specified in the design
  - Implement `handleSubmit` that logs the payload and increments `resetKey`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 1.1 Write property test — Dashboard renders all sub-components (Property 1)
    - **Property 1: Dashboard renders all sub-components**
    - Mock `useStellarWallet` with `fc.record({ isConnected: fc.boolean(), isConnecting: fc.boolean(), publicKey: fc.option(fc.string()) })`
    - Assert `Header`, `FormCard`, and `RightPanel` are all present in the rendered output for every generated wallet state
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 1.2 Write property test — Wallet state forwarded to all child components (Property 2)
    - **Property 2: Wallet state is forwarded to all child components**
    - Mock `useStellarWallet` with generated `isConnected`, `isConnecting`, `publicKey` values
    - Assert `Header`, `FormCard`, and `RightPanel` each receive the exact values returned by the hook
    - **Validates: Requirements 2.5, 2.6, 2.7**

  - [ ]* 1.3 Write property test — Form state changes propagate to RightPanel (Property 3)
    - **Property 3: Form state changes propagate to RightPanel**
    - Render `StellarSpendDashboard`, simulate `FormCard` calling `onAmountChange`, `onCurrencyChange`, `onQuoteChange` with generated values
    - Assert `RightPanel` subsequently receives those exact values as `amount`, `currency`, `quote`
    - **Validates: Requirements 2.8, 2.9, 2.10**

- [ ] 2. Update `page.tsx` to render `StellarSpendDashboard`
  - Replace the placeholder content in `src/app/page.tsx` with a minimal server component that imports and renders `<StellarSpendDashboard />`
  - Remove all existing placeholder JSX
  - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 2.1 Write unit test — page renders StellarSpendDashboard
    - Render `Page` and assert `StellarSpendDashboard` is present in the output
    - Assert that a render error thrown by `StellarSpendDashboard` propagates (is not swallowed by `page.tsx`)
    - **Validates: Requirements 1.1, 1.3**

- [ ] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Update `layout.tsx` metadata with Open Graph tags
  - Expand the `metadata` export in `src/app/layout.tsx` to include the full title, description, and `openGraph` object (`title`, `description`, `type: "website"`, `url: process.env.NEXT_PUBLIC_APP_URL`)
  - _Requirements: 3.1, 4.1, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.1 Write unit test — metadata fields are correct
    - Import the `metadata` export and assert `title`, `description`, `openGraph.type` match expected values
    - Assert `openGraph.url` is `undefined` when `NEXT_PUBLIC_APP_URL` is not set
    - **Validates: Requirements 3.1, 4.1, 5.1, 5.4, 5.5**

  - [ ]* 4.2 Write property test — Open Graph metadata is consistent with page metadata (Property 4)
    - **Property 4: Open Graph metadata is consistent with page metadata**
    - Use `fc.constant(metadata)` and assert `openGraph.title === title` and `openGraph.description === description`
    - **Validates: Requirements 5.2, 5.3**

- [ ] 5. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations per property
- `handleSubmit` is a placeholder — actual bridge/payout execution is out of scope for this feature
