# Requirements Document

## Introduction

The StateSwitcher is a development/demo-only UI component that lets developers and
reviewers manually cycle through the three wallet connection states of the
Stellar-Spend dashboard — "Pre Connect", "Connecting", and "Connected" — without
needing a real Stellar wallet. It renders as a tab-style control bar, updates the
shared `WalletFlowState` used by the dashboard, and is hidden in production builds
unless an explicit feature flag is set.

## Glossary

- **StateSwitcher**: The tab-style UI component defined in `src/components/StateSwitcher.tsx`.
- **WalletFlowState**: The union type `"pre_connect" | "connecting" | "connected"` defined in `src/types/stellaramp.ts`.
- **Dashboard**: The page and component tree rooted at `src/app/page.tsx` that renders the wallet UI.
- **Active Tab**: The tab whose corresponding `WalletFlowState` value matches the currently selected state.
- **Dev Mode**: The runtime condition where `process.env.NODE_ENV === "development"`.
- **Feature Flag**: The environment variable `NEXT_PUBLIC_ENABLE_STATE_SWITCHER=true` that enables the component outside Dev Mode.
- **Tab**: A single selectable option within the StateSwitcher representing one `WalletFlowState`.

## Requirements

### Requirement 1: Render Three State Tabs

**User Story:** As a developer, I want a tab bar with "Pre Connect", "Connecting", and "Connected" options, so that I can switch between wallet states without a real wallet.

#### Acceptance Criteria

1. THE StateSwitcher SHALL render exactly three tabs with labels "Pre Connect", "Connecting", and "Connected".
2. THE StateSwitcher SHALL map "Pre Connect" to `WalletFlowState` value `"pre_connect"`, "Connecting" to `"connecting"`, and "Connected" to `"connected"`.
3. THE StateSwitcher SHALL render the tab container with `role="tablist"`.
4. THE StateSwitcher SHALL render each tab as a `button` element with `role="tab"`.

---

### Requirement 2: Active Tab Visual Indicator

**User Story:** As a developer, I want the active tab to be visually distinct, so that I can immediately see which state is currently selected.

#### Acceptance Criteria

1. WHEN a tab is the Active Tab, THE StateSwitcher SHALL apply a gold background (`#c9a962`) and dark text (`#0a0a0a`) to that tab.
2. WHEN a tab is not the Active Tab, THE StateSwitcher SHALL render it with a transparent background and muted text (`#777777`).
3. WHEN a tab is the Active Tab, THE StateSwitcher SHALL set `aria-selected="true"` on that tab's `button` element.
4. WHEN a tab is not the Active Tab, THE StateSwitcher SHALL set `aria-selected="false"` on that tab's `button` element.

---

### Requirement 3: State Switching on Interaction

**User Story:** As a developer, I want clicking a tab to update the dashboard wallet state, so that all connected components reflect the new state immediately.

#### Acceptance Criteria

1. WHEN a tab is clicked, THE StateSwitcher SHALL invoke the `onStateChange` callback with the corresponding `WalletFlowState` value.
2. WHEN `onStateChange` is called, THE Dashboard SHALL update the displayed wallet state across all dependent components (Header, FormCard, RightPanel).
3. WHEN the same Active Tab is clicked again, THE StateSwitcher SHALL invoke `onStateChange` with the same value without side effects.

---

### Requirement 4: Keyboard Accessibility

**User Story:** As a developer, I want to navigate and activate tabs using only the keyboard, so that the component meets accessibility standards.

#### Acceptance Criteria

1. WHEN a tab has focus and the `ArrowRight` key is pressed, THE StateSwitcher SHALL move focus to the next tab, wrapping from the last tab to the first.
2. WHEN a tab has focus and the `ArrowLeft` key is pressed, THE StateSwitcher SHALL move focus to the previous tab, wrapping from the first tab to the last.
3. WHEN a tab has focus and the `Enter` or `Space` key is pressed, THE StateSwitcher SHALL invoke `onStateChange` with that tab's `WalletFlowState` value.
4. THE StateSwitcher SHALL ensure each tab is reachable via the `Tab` key when the component is visible.

---

### Requirement 5: Development/Demo-Only Visibility

**User Story:** As a developer, I want the StateSwitcher to be hidden in production, so that end users never see the debug control.

#### Acceptance Criteria

1. WHILE `NODE_ENV` is `"development"`, THE StateSwitcher SHALL render in the DOM.
2. WHILE `NODE_ENV` is not `"development"` and `NEXT_PUBLIC_ENABLE_STATE_SWITCHER` is not `"true"`, THE StateSwitcher SHALL return `null` and render nothing.
3. WHERE `NEXT_PUBLIC_ENABLE_STATE_SWITCHER` is `"true"`, THE StateSwitcher SHALL render regardless of `NODE_ENV`.

---

### Requirement 6: Controlled Component Interface

**User Story:** As a developer, I want the StateSwitcher to accept its current state and a change handler as props, so that it integrates cleanly with the existing `useWalletFlow` hook.

#### Acceptance Criteria

1. THE StateSwitcher SHALL accept a `state` prop of type `WalletFlowState` that determines the Active Tab.
2. THE StateSwitcher SHALL accept an `onStateChange` prop of type `(state: WalletFlowState) => void`.
3. WHEN the `state` prop changes externally, THE StateSwitcher SHALL update the Active Tab to reflect the new value without internal state duplication.
