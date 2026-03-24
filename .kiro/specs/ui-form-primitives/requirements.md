# Requirements Document

## Introduction

Extract three reusable form primitive components — `InputField`, `SelectField`, and `Field` — from the monolithic `FormCard` component into `src/components/ui/`. These primitives share a consistent visual language (IBM Plex Mono font, `var(--line)` borders, `var(--muted)` labels, 46px height) and must be fully typed with TypeScript interfaces so they can be composed across the application independently of `FormCard`.

## Glossary

- **InputField**: A labeled text/number input with an optional inline suffix, error state, and disabled state.
- **SelectField**: A labeled native `<select>` element with a custom chevron SVG, loading state, and disabled state.
- **Field**: A labeled read-only display element that renders a value in either muted or accent tone.
- **UI_Library**: The collection of primitive components located at `src/components/ui/`.
- **Design_Token**: A CSS custom property defined in `globals.css` (e.g. `var(--line)`, `var(--muted)`, `var(--accent)`).
- **Disabled_State**: The visual and interactive state of a component when the `disabled` prop is `true`.
- **Accent_Tone**: Text rendered in `var(--accent)` color (`#c9a962`).
- **Muted_Tone**: Text rendered in `var(--muted)` color (`#777777`).

---

## Requirements

### Requirement 1: InputField Component

**User Story:** As a developer, I want a reusable `InputField` component, so that I can render a labeled bordered input with an optional suffix across any form in the app.

#### Acceptance Criteria

1. THE `InputField` SHALL accept a `label`, `id`, `value`, `onChange`, `type`, `placeholder`, `disabled`, `suffix`, and `error` prop as defined by a TypeScript interface.
2. THE `InputField` SHALL render a `<label>` element styled with `var(--muted)` color, uppercase, 10px font size, and `0.18em` letter-spacing.
3. THE `InputField` SHALL render a `<input>` element with a `var(--line)` border, `var(--bg)` background, IBM Plex Mono font, and a minimum height of 46px.
4. WHEN the `suffix` prop is provided, THE `InputField` SHALL render the suffix text absolutely positioned on the right side of the input, styled in `var(--muted)` color.
5. WHEN the `error` prop is provided, THE `InputField` SHALL render the border in `red-500/60` and display the error message below the input in 10px red text.
6. WHEN the `disabled` prop is `true`, THE `InputField` SHALL render with `opacity-40` and `cursor-not-allowed` on the input element.
7. THE `InputField` SHALL accept optional `inputMode`, `min`, `step`, and `maxLength` props to support numeric and text input variants.

---

### Requirement 2: SelectField Component

**User Story:** As a developer, I want a reusable `SelectField` component, so that I can render a labeled styled native select with a custom chevron across any form in the app.

#### Acceptance Criteria

1. THE `SelectField` SHALL accept a `label`, `id`, `value`, `onChange`, `options`, `placeholder`, `disabled`, and `loading` prop as defined by a TypeScript interface.
2. THE `SelectField` SHALL render a `<label>` element styled identically to the `InputField` label (muted color, uppercase, 10px, 0.18em tracking).
3. THE `SelectField` SHALL render a `<select>` element with `appearance-none`, a `var(--line)` border, `var(--bg)` background, IBM Plex Mono font, and a minimum height of 46px.
4. THE `SelectField` SHALL render a custom chevron SVG icon absolutely positioned on the right side of the select, styled in `var(--muted)` color, replacing the native browser arrow.
5. WHEN the `loading` prop is `true`, THE `SelectField` SHALL disable the select element and display "Loading..." as the placeholder option text.
6. WHEN the `disabled` prop is `true`, THE `SelectField` SHALL render with `opacity-40` and `cursor-not-allowed` on the select element.
7. WHEN a value is selected, THE `SelectField` SHALL render the selected text in `var(--text)` color; WHEN no value is selected, THE `SelectField` SHALL render the placeholder in `var(--muted)` color.
8. THE `options` prop SHALL be typed as `Array<{ value: string; label: string }>`.

---

### Requirement 3: Field Component

**User Story:** As a developer, I want a reusable `Field` component, so that I can display a labeled read-only value with configurable tone across any form in the app.

#### Acceptance Criteria

1. THE `Field` SHALL accept a `label`, `value`, `tone`, `loading`, and `placeholder` prop as defined by a TypeScript interface.
2. THE `Field` SHALL render a `<span>` label element styled identically to the `InputField` label (muted color, uppercase, 10px, 0.18em tracking).
3. THE `Field` SHALL render a read-only display container with a `var(--line)` border, `var(--bg)` background, IBM Plex Mono font, and a minimum height of 46px.
4. WHEN the `tone` prop is `"accent"`, THE `Field` SHALL render the value text in `var(--accent)` color.
5. WHEN the `tone` prop is `"muted"` or is omitted, THE `Field` SHALL render the value text in `var(--muted)` color.
6. WHEN the `loading` prop is `true`, THE `Field` SHALL render a "Resolving..." placeholder in `var(--muted)` color instead of the value.
7. WHEN the `value` prop is an empty string and `loading` is `false`, THE `Field` SHALL render the `placeholder` prop text (defaulting to `"—"`) in `var(--muted)` color.

---

### Requirement 4: Shared Visual Consistency

**User Story:** As a developer, I want all three primitives to share a consistent visual language, so that forms composed from these components look cohesive without additional styling.

#### Acceptance Criteria

1. THE `UI_Library` SHALL use only Design_Tokens (`var(--line)`, `var(--muted)`, `var(--accent)`, `var(--bg)`, `var(--text)`) for colors, not hardcoded hex values.
2. THE `InputField`, `SelectField`, and `Field` SHALL each render with a minimum height of 46px for their interactive/display area.
3. THE `InputField`, `SelectField`, and `Field` SHALL each apply IBM Plex Mono font via the project's `--font-ibm-plex-mono` CSS variable or Tailwind font utility.
4. THE `InputField`, `SelectField`, and `Field` SHALL each include a `focus-visible` ring styled in `var(--accent)` color for keyboard accessibility.

---

### Requirement 5: TypeScript Interfaces and Exports

**User Story:** As a developer, I want all component props to be typed and exported, so that consuming components get full type safety and IDE autocompletion.

#### Acceptance Criteria

1. THE `UI_Library` SHALL export a named TypeScript interface for each component's props: `InputFieldProps`, `SelectFieldProps`, and `FieldProps`.
2. THE `UI_Library` SHALL export each component as a named export from `src/components/ui/index.ts`.
3. WHEN a required prop is missing, THE TypeScript compiler SHALL produce a type error at the call site.
4. THE `FieldProps` interface SHALL define `tone` as a union type `"muted" | "accent"` with a default of `"muted"`.

---

### Requirement 6: FormCard Refactoring

**User Story:** As a developer, I want `FormCard` to consume the extracted primitives from `src/components/ui/`, so that there is a single source of truth for each form primitive.

#### Acceptance Criteria

1. WHEN the extraction is complete, THE `FormCard` SHALL import `InputField`, `SelectField`, and `Field` from `src/components/ui/` instead of defining them locally.
2. THE `FormCard` SHALL produce identical visual output before and after the refactoring.
3. THE `FormCard` SHALL NOT contain local re-definitions of `InputField`, `SelectField`, or `Field` after the refactoring.
