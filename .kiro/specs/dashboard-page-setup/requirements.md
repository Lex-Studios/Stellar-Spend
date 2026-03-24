# Requirements Document

## Introduction

Replace the placeholder `page.tsx` with the real Stellar-Spend dashboard by rendering the `StellarSpendDashboard` component, and update `layout.tsx` with accurate metadata including Open Graph tags for social sharing.

## Glossary

- **StellarSpendDashboard**: The top-level client component that composes `Header`, `FormCard`, and `RightPanel` into the full off-ramp dashboard UI.
- **Page**: The Next.js root route (`src/app/page.tsx`) served at `/`.
- **Layout**: The Next.js root layout (`src/app/layout.tsx`) that wraps all pages and defines document-level metadata.
- **Metadata**: Next.js `Metadata` object exported from `layout.tsx` that controls `<title>`, `<meta description>`, and Open Graph tags.
- **Open_Graph**: A set of `<meta property="og:*">` tags that control how the page appears when shared on social platforms.

---

## Requirements

### Requirement 1: Dashboard Page Render

**User Story:** As a user, I want to open `http://localhost:3000` and see the Stellar-Spend off-ramp dashboard, so that I can convert stablecoins to fiat without navigating to a sub-route.

#### Acceptance Criteria

1. THE `Page` SHALL render the `StellarSpendDashboard` component as its sole child.
2. WHEN a browser navigates to `/`, THE `Page` SHALL display the `Header`, `FormCard`, and `RightPanel` sub-components.
3. IF the `StellarSpendDashboard` component throws a render error, THEN THE `Page` SHALL propagate the error to the Next.js error boundary.

---

### Requirement 2: StellarSpendDashboard Component

**User Story:** As a developer, I want a single `StellarSpendDashboard` component that wires wallet state to the form and right panel, so that the dashboard is self-contained and importable from any route.

#### Acceptance Criteria

1. THE `StellarSpendDashboard` SHALL be a client component (`"use client"` directive).
2. THE `StellarSpendDashboard` SHALL use `useStellarWallet` to manage wallet connection state.
3. WHEN the user clicks "Connect Wallet", THE `StellarSpendDashboard` SHALL invoke the wallet `connect` function.
4. WHEN the user clicks "Disconnect", THE `StellarSpendDashboard` SHALL invoke the wallet `disconnect` function.
5. THE `StellarSpendDashboard` SHALL pass `isConnected`, `isConnecting`, `walletAddress`, and balance props to `Header`.
6. THE `StellarSpendDashboard` SHALL pass `isConnected`, `isConnecting`, `onConnect`, and `onSubmit` props to `FormCard`.
7. THE `StellarSpendDashboard` SHALL pass `isConnected`, `isConnecting`, `quote`, `amount`, `currency`, and `onConnect` props to `RightPanel`.
8. WHEN `FormCard` calls `onQuoteChange`, THE `StellarSpendDashboard` SHALL update the quote state passed to `RightPanel`.
9. WHEN `FormCard` calls `onAmountChange`, THE `StellarSpendDashboard` SHALL update the amount state passed to `RightPanel`.
10. WHEN `FormCard` calls `onCurrencyChange`, THE `StellarSpendDashboard` SHALL update the currency state passed to `RightPanel`.

---

### Requirement 3: Page Title Metadata

**User Story:** As a user, I want the browser tab to display "Stellar-Spend — Convert Stablecoins to Fiat", so that I can identify the page at a glance.

#### Acceptance Criteria

1. THE `Layout` SHALL export a `Metadata` object with `title` set to `"Stellar-Spend — Convert Stablecoins to Fiat"`.
2. WHEN the page is rendered, THE browser tab SHALL display the title `"Stellar-Spend — Convert Stablecoins to Fiat"`.

---

### Requirement 4: Page Description Metadata

**User Story:** As a developer, I want an accurate meta description, so that search engines and link previews reflect the real purpose of the application.

#### Acceptance Criteria

1. THE `Layout` SHALL export a `Metadata` object with `description` set to an accurate summary of the Stellar-Spend off-ramp application.

---

### Requirement 5: Open Graph Metadata

**User Story:** As a product owner, I want Open Graph tags on the page, so that sharing the URL on social platforms renders a rich preview card.

#### Acceptance Criteria

1. THE `Layout` SHALL include an `openGraph` field in the `Metadata` object.
2. THE `openGraph` metadata SHALL include a `title` matching the page title.
3. THE `openGraph` metadata SHALL include a `description` matching the page description.
4. THE `openGraph` metadata SHALL include a `type` of `"website"`.
5. WHERE a canonical URL is configured, THE `openGraph` metadata SHALL include a `url` field.
