# Implementation Plan: UI Form Primitives

## Overview

Extract `InputField`, `SelectField`, and `Field` from `FormCard.tsx` into `src/components/ui/`, wire them back into `FormCard`, and add property-based and unit tests.

## Tasks

- [ ] 1. Set up `src/components/ui/` directory and CSS design tokens
  - Verify `globals.css` defines `--bg`, `--line`, `--muted`, `--accent`, `--text`, and `--font-ibm-plex-mono` tokens; add any that are missing
  - Create the `src/components/ui/` directory (empty placeholder or `index.ts` stub)
  - _Requirements: 4.1, 4.3_

- [ ] 2. Implement `InputField` component
  - [ ] 2.1 Create `src/components/ui/InputField.tsx`
    - Export `InputFieldProps` interface and `InputField` named component
    - Render `<label>` with `text-[10px] tracking-[0.18em] text-[var(--muted)] uppercase`
    - Render `<input>` with `border-[var(--line)] bg-[var(--bg)] font-[var(--font-ibm-plex-mono)] min-h-[46px]`
    - Apply `pr-20` + absolutely-positioned suffix span when `suffix` is provided
    - Apply `border-red-500/60` + error message element when `error` is provided
    - Apply `opacity-40 cursor-not-allowed` when `disabled` is `true`
    - Include `focus-visible:ring-1 focus-visible:ring-[var(--accent)]`
    - Support optional `inputMode`, `min`, `step`, `maxLength` props
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 4.1, 4.2, 4.3, 4.4, 5.1_

  - [ ]* 2.2 Write property test for `InputField` (P1, P2, P3, P4, P5, P12)
    - **Property 1: Label styling is consistent** — `fc.record({ label: fc.string(), id: fc.string(), value: fc.string(), onChange: fc.constant(() => {}) })`
    - **Property 2: Container base styling is consistent** — same arbitrary
    - **Property 3: Suffix rendered when provided** — add `fc.string({ minLength: 1 })` for suffix
    - **Property 4: Error state changes border and shows message** — `fc.string({ minLength: 1 })` for error
    - **Property 5: Disabled state applies opacity/cursor** — `fc.boolean()` for disabled
    - **Property 12: Focus-visible ring uses accent** — full props record
    - File: `src/components/ui/__tests__/InputField.test.tsx`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 4.4_

- [ ] 3. Implement `SelectField` component
  - [ ] 3.1 Create `src/components/ui/SelectField.tsx`
    - Export `SelectFieldProps` interface and `SelectField` named component
    - Render `<label>` identically to `InputField` label
    - Render `<select>` with `appearance-none border-[var(--line)] bg-[var(--bg)] font-[var(--font-ibm-plex-mono)] min-h-[46px]`
    - Render a custom chevron `<svg>` absolutely positioned on the right (replaces native arrow)
    - When `loading` is `true`, disable select and set placeholder option text to "Loading..."
    - Apply `opacity-40 cursor-not-allowed` when `disabled` is `true`
    - Apply `text-[var(--text)]` when value is non-empty; `text-[var(--muted)]` when empty
    - Include `focus-visible:ring-1 focus-visible:ring-[var(--accent)]`
    - Type `options` as `Array<{ value: string; label: string }>`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 4.1, 4.2, 4.3, 4.4, 5.1_

  - [ ]* 3.2 Write property test for `SelectField` (P1, P2, P5, P6, P7, P8, P12)
    - **Property 1: Label styling is consistent** — `fc.record({ label: fc.string(), id: fc.string(), value: fc.string(), onChange: fc.constant(() => {}), options: fc.constant([]) })`
    - **Property 2: Container base styling is consistent** — same arbitrary
    - **Property 5: Disabled state** — `fc.boolean()` for disabled
    - **Property 6: Chevron SVG always rendered** — full props record
    - **Property 7: Loading state disables select and shows "Loading..."** — `fc.boolean()` for loading
    - **Property 8: Value presence determines text color** — `fc.oneof(fc.constant(""), fc.string({ minLength: 1 }))` for value
    - **Property 12: Focus-visible ring uses accent** — full props record
    - File: `src/components/ui/__tests__/SelectField.test.tsx`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.4_

- [ ] 4. Implement `Field` component
  - [ ] 4.1 Create `src/components/ui/Field.tsx`
    - Export `FieldTone` union type, `FieldProps` interface, and `Field` named component
    - Render `<span>` label identically to `InputField` label
    - Render read-only display container with `border-[var(--line)] bg-[var(--bg)] font-[var(--font-ibm-plex-mono)] min-h-[46px]`
    - When `loading` is `true`, render "Resolving..." in `var(--muted)`
    - When `value` is non-empty and `tone === "accent"`, render value in `var(--accent)`
    - When `value` is non-empty and `tone === "muted"` (or omitted), render value in `var(--muted)`
    - When `value` is empty and not loading, render `placeholder` (default `"—"`) in `var(--muted)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 5.1, 5.4_

  - [ ]* 4.2 Write property test for `Field` (P1, P2, P9, P10, P11, P12)
    - **Property 1: Label styling is consistent** — `fc.record({ label: fc.string(), value: fc.string() })`
    - **Property 2: Container base styling is consistent** — same arbitrary
    - **Property 9: Tone determines value text color** — `fc.constantFrom("muted", "accent")` for tone, `fc.string({ minLength: 1 })` for value
    - **Property 10: Loading shows "Resolving..." not value** — `fc.boolean()` for loading
    - **Property 11: Empty value renders placeholder** — `fc.string()` for placeholder, `fc.constant("")` for value
    - **Property 12: Focus-visible ring uses accent** — full props record
    - File: `src/components/ui/__tests__/Field.test.tsx`
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.4_

- [ ] 5. Create barrel export and install fast-check
  - [ ] 5.1 Create `src/components/ui/index.ts` with named exports for all three components and their prop types
    - Export `InputField`, `InputFieldProps`
    - Export `SelectField`, `SelectFieldProps`
    - Export `Field`, `FieldProps`, `FieldTone`
    - _Requirements: 5.1, 5.2_

  - [ ]* 5.2 Write barrel export unit test
    - Import all three components and prop types from `src/components/ui/index.ts` and assert they are defined
    - File: `src/components/ui/__tests__/index.test.ts`
    - _Requirements: 5.2_

- [ ] 6. Checkpoint — ensure components compile cleanly
  - Run `getDiagnostics` on all four new files; fix any TypeScript errors before proceeding.

- [ ] 7. Refactor `FormCard` to use extracted primitives
  - [ ] 7.1 Remove local `InputField`, `SelectField`, and `Field` definitions from `src/components/FormCard.tsx`
    - Add import: `import { InputField, SelectField, Field } from "@/components/ui"`
    - Delete the three local component function definitions and their prop interfaces
    - Verify all existing usages in `FormCard` still compile and render identically
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 7.2 Write FormCard integration unit test
    - Render `FormCard` with minimal required props and assert it does not define `InputField`, `SelectField`, or `Field` locally (import-level check)
    - File: `src/components/ui/__tests__/index.test.ts` (append to existing file)
    - _Requirements: 6.1, 6.3_

- [ ] 8. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check`; install with `npm install --save-dev fast-check` before running tests
- All color values must use CSS custom properties (`var(--...)`) — no hardcoded hex values
