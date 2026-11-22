# Dependency upgrade pass

Recorded on 2026-11-22: `npm outdated`, `npm view` deprecation scan, and
`npm update --legacy-peer-deps`.

## Deprecated packages found

| Package | Deprecation note | Action taken |
| --- | --- | --- |
| `@types/dompurify` | Stub types definition: "dompurify provides its own type definitions, so you do not need this installed." | Removed (see `docs/unused-dependencies.md`). |

## Upgrades applied

- **Storybook family (10.4.6 → 10.6.8)**: `storybook`, `@storybook/addon-vitest`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/nextjs-vite`, `eslint-plugin-storybook`
- **Playwright ecosystem**: `@playwright/test` 1.58.2 → 1.65.1, `playwright` 1.61.1 → 1.65.1, `@axe-core/playwright` 4.12.1 → 4.14.0
- **Chromatic / bundle analyzer**: `@chromatic-com/storybook` 5.2.1 → 5.6.0, `@next/bundle-analyzer` 16.2.4 → 16.4.6
- **Tailwind / testing**: `@tailwindcss/postcss` 4.2.4 → 4.3.5, `@testing-library/react` 16.3.2 → 16.3.3, `@testing-library/user-event` 14.6.1 → 14.6.13
- **Vitest tooling**: `vitest` 4.1.x → 4.1.12, `@vitest/browser-playwright` 4.1.x → 4.1.12, `@vitest/coverage-v8` 4.1.x → 4.1.12
- **Misc tooling**: `node-mocks-http` 1.17.2 → 1.18.1, `pg` 8.21.0 → 8.23.1, `prettier` 3.4.2 → 3.10.1, `type-coverage` 2.29.7 → 2.31.2, `@vitejs/plugin-react` 6.0.1 → 6.3.0
- **Mobile workspace (`packages/mobile`)**: `expo` 52.0.49 → 58.0.26 (range updated to `^58.0.26`)
- **Security-critical direct deps**: `@aws-sdk/client-cloudwatch-logs` (range pinned to `^3.1175.0`), `@stellar/stellar-sdk` 14.6.1 → 17.4.0

## Remaining outdated (latest available per fresh `npm outdated`; deferred)

- `@sentry/nextjs` 10.78.0 → 11.16.0
- `@storybook/addon-mcp` 0.6.0 → 10.6.8 (major)
- `@stryker-mutator/core` 7.3.0 → 10.1.1, `@stryker-mutator/typescript-checker` 7.3.0 → 10.1.1 — see `docs/npm-audit-exceptions.md` for why the npm-suggested downgrade is not applied
- `@testing-library/jest-dom` 6.9.1 → 8.0.0
- `@types/react` 19.0.8 → 19.3.0, `@types/react-dom` 19.0.3 → 19.3.0
- `eslint-config-next` 15.2.0 → 16.4.6
- `expo-status-bar` (mobile) 2.0.1 → 58.0.5
- `jsdom` 29.1.1 → 31.0.1
- `msw` 2.15.0 → 3.0.7
- `react` 19.0.0 → 19.3.1, `react-dom` 19.0.0 → 19.3.1 (root + mobile), `react-native` (mobile) 0.76.5 → 0.88.1
- `typescript` 5.7.3 → 7.0.2

## Notes

- `npm install`/`npm update` were run with `--legacy-peer-deps` because the Storybook and Vitest peer trees are mutually conflicting (e.g. `vite-plus` peer-requires `@vitest/browser-playwright@4.1.10` while the tree ships 4.1.9); this mirrors npm 4–6 conflict tolerance and is the standard approach for the Storybook ecosystem.
- `@aws-sdk/client-cloudwatch-logs@3.1175.0` resolves 14 criticals in the `@aws-sdk/*` tree via `fast-xml-parser`.
