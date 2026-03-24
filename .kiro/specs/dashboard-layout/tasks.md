# Implementation Plan: Dashboard Layout

## Overview

Restructure `src/app/page.tsx` into a responsive two-column grid (desktop >1100px) / single-column stack (mobile ≤1100px), composing `FormCard`, `RightPanel`, `RecentOfframpsTable`, and `ProgressSteps` inside a full-viewport outer container with a bordered inner section.

## Tasks

- [x] 1. Create stub components
  - Create `src/components/RecentOfframpsTable.tsx` with a `data-testid="RecentOfframpsTable"` attribute
  - Create `src/components/ProgressSteps.tsx` with a `data-testid="ProgressSteps"` attribute
  - Both stubs must render a bordered placeholder matching the design spec
  - _Requirements: 1.4, 2.2_

- [x] 2. Implement the dashboard layout in `page.tsx`
  - [x] 2.1 Wire up OuterContainer, InnerSection, and grid container
    - Replace current `page.tsx` content with the new layout shell
    - `<main>` gets `min-h-screen p-4 bg-[#0a0a0a]`
    - `<section>` gets `border border-[#333333] px-[2.6rem] py-8 max-[1100px]:p-4 overflow-hidden`
    - Grid `<div>` gets `grid grid-cols-[1fr_370px] gap-6 max-[1100px]:grid-cols-1 overflow-hidden w-full`
    - _Requirements: 1.1, 3.1, 3.2, 4.1, 4.2, 4.3_

  - [x] 2.2 Place components in correct grid positions
    - Add `data-testid` attributes to `FormCard` and `RightPanel` wrapper divs
    - `FormCard` wrapper: natural flow (col 1, row 1)
    - `RightPanel` wrapper: `col-start-2 row-start-1 row-span-2 max-[1100px]:col-start-1 max-[1100px]:row-span-1`
    - `RecentOfframpsTable` wrapper: natural flow (col 1, row 2)
    - `ProgressSteps` wrapper: `max-[1100px]:block hidden`
    - DOM order: FormCard → RightPanel → RecentOfframpsTable → ProgressSteps
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 5.1, 5.2_

  - [ ]* 2.3 Write property test for DOM order invariant
    - **Property 1: Component DOM order is stable**
    - **Validates: Requirements 2.2**
    - File: `src/app/__tests__/page.property.test.tsx`
    - Use `fast-check` with `fc.record({ isConnected: fc.boolean(), amount: fc.string() })`
    - Assert `FormCard`, `RightPanel`, `RecentOfframpsTable`, `ProgressSteps` appear in that DOM order for any props combination
    - Tag: `// Feature: dashboard-layout, Property 1: Component DOM order is stable`
    - Run 100 iterations

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Write unit tests for layout structure
  - [x] 4.1 Set up test file and render helpers
    - Create `src/app/__tests__/page.test.tsx`
    - Install/configure React Testing Library if not already present
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 1.1, 1.3, 2.3, 5.1, 5.2_

  - [ ]* 4.2 Write unit tests for structural class assertions
    - E1: grid container has `grid-cols-[1fr_370px]` and `max-[1100px]:grid-cols-1`
    - E2: RightPanel wrapper has `col-start-2 row-start-1 row-span-2`
    - E3: outer `<main>` has `min-h-screen` and `p-4`
    - E4: inner `<section>` has `border`, `px-[2.6rem]`, `py-8`, `max-[1100px]:p-4`
    - E5: grid container has `overflow-hidden` and `w-full`
    - _Requirements: 1.1, 1.3, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2_

- [x] 5. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `fast-check` must be installed: `npm install --save-dev fast-check`
- Each component stub needs a `data-testid` matching its component name for property tests to work
- Tailwind v4 arbitrary variants (`max-[1100px]:`) are already used in the codebase (`Header.tsx`) so no extra config is needed
