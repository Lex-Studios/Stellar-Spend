# Requirements Document

## Introduction

The dashboard layout defines the two-column grid structure for the Stellar-Spend offramp dashboard. On desktop (viewport width > 1100px) it renders a two-column grid with `FormCard` on the left and `RightPanel` spanning two rows on the right, with `RecentOfframpsTable` filling the bottom-left cell. On tablet and mobile (≤ 1100px) the layout collapses to a single column with a defined stacking order. The outer container fills the full viewport height with consistent padding, and the inner content section is bordered with responsive inner padding.

## Glossary

- **Dashboard**: The main page (`src/app/page.tsx`) that composes all layout sections.
- **FormCard**: The left-side offramp form component (`src/components/FormCard.tsx`).
- **RightPanel**: The right-side payout summary component (`src/components/RightPanel.tsx`).
- **RecentOfframpsTable**: The table component displaying recent offramp transactions, rendered below `FormCard` on desktop.
- **ProgressSteps**: The step-indicator component shown last in the mobile stacking order.
- **OuterContainer**: The top-level wrapper element of the dashboard page.
- **InnerSection**: The bordered content wrapper nested inside `OuterContainer`.
- **Desktop**: Viewport width strictly greater than 1100px.
- **Mobile**: Viewport width less than or equal to 1100px (includes tablet).

## Requirements

### Requirement 1: Desktop Two-Column Grid

**User Story:** As a user on a wide screen, I want the dashboard to display a two-column layout, so that I can see the form and the payout summary side by side.

#### Acceptance Criteria

1. WHEN the viewport width is greater than 1100px, THE Dashboard SHALL render a CSS grid with two columns defined as `1fr 370px`.
2. WHEN the viewport width is greater than 1100px, THE Dashboard SHALL place `FormCard` in the first column, first row.
3. WHEN the viewport width is greater than 1100px, THE Dashboard SHALL place `RightPanel` in the second column spanning two rows.
4. WHEN the viewport width is greater than 1100px, THE Dashboard SHALL place `RecentOfframpsTable` in the first column, second row.

### Requirement 2: Mobile Single-Column Layout

**User Story:** As a user on a narrow screen, I want the dashboard to stack all sections vertically, so that I can scroll through each section without horizontal overflow.

#### Acceptance Criteria

1. WHEN the viewport width is less than or equal to 1100px, THE Dashboard SHALL render a single-column layout.
2. WHEN the viewport width is less than or equal to 1100px, THE Dashboard SHALL display components in the order: `FormCard`, `RightPanel`, `RecentOfframpsTable`, `ProgressSteps`.
3. WHILE the viewport width is less than or equal to 1100px, THE Dashboard SHALL produce no horizontal overflow.

### Requirement 3: Outer Container Sizing and Padding

**User Story:** As a user, I want the dashboard to fill the full viewport height with consistent outer padding, so that the layout feels grounded and uses the available screen space.

#### Acceptance Criteria

1. THE OuterContainer SHALL apply a minimum height equal to 100% of the viewport height (`min-h-screen`).
2. THE OuterContainer SHALL apply uniform padding of `1rem` (`p-4`) on all sides.

### Requirement 4: Inner Section Padding and Border

**User Story:** As a user, I want the inner content area to have a visible border and comfortable padding, so that the dashboard content is visually contained and readable.

#### Acceptance Criteria

1. THE InnerSection SHALL render a visible border on all sides.
2. WHEN the viewport width is greater than 1100px, THE InnerSection SHALL apply horizontal padding of `2.6rem` and vertical padding of `2rem` (`px-[2.6rem] py-8`).
3. WHEN the viewport width is less than or equal to 1100px, THE InnerSection SHALL apply uniform padding of `1rem` (`p-4`).

### Requirement 5: No Horizontal Overflow on Mobile

**User Story:** As a user on a mobile device, I want the page to never scroll horizontally, so that I can read all content without side-scrolling.

#### Acceptance Criteria

1. WHILE the viewport width is less than or equal to 1100px, THE Dashboard SHALL constrain all child elements to the viewport width.
2. IF any child element would exceed the viewport width, THEN THE Dashboard SHALL clip or wrap the element to prevent horizontal scrolling.
