# npm audit — remaining high-severity advisories

`npm audit fix` was run against the `main` branch state of this repo; the following summary
was recorded on 2026-11-22. See `docs/dependency-upgrades.md` for the upgrade pass and
`docs/unused-dependencies.md` for the unused-dependency removals.

## Status

- **Critical: 0** (down from 25)
- **High: 9** (down from 29)
- Moderate and low advisories: resolved by the upgrade pass.

## Remaining highs — exceptions

| Module | Severity | Advisory | Why it is not resolved in this PR |
| --- | --- | --- | --- |
| `@stryker-mutator/core`, `@stryker-mutator/util`, `@stryker-mutator/instrumenter`, `@stryker-mutator/typescript-checker` | high | Prototype pollution / other advisories in the Stryker mutation-testing tree | npm's only fix (`npm audit fix --force`) is to downgrade to `@stryker-mutator/core@6.4.1`, a major downgrade that would break the pinned mutation setup (`stryker.conf.json` is pinned to the v7 major and `npm run test:mutation` uses it). Deferred; the upgrade path is tracked under #1531. |
| `glob` | high | CLI command injection / traversal via `-c/--cmd` and cached trees | Advisory `GHSA-5j98-mcp5-4vw2` ("CLI: Command injection via -c/--cmd executes matches with shell:true"). npm reports no non-breaking fix available. |
| `tmp` | high | Arbitrary temp file/dir write via `dir` param, path traversal | Lives in the Stryker/inquirer toolchain tree; the only npm-suggested fix is the same Stryker downgrade noted above. |
| `image-size` | high | Infinite loops in JXL/HEIF/ICNS parsers | Advisory `GHSA-5p2g-fcmc-qvqq`; `npm audit fix` could not apply a non-breaking fix here. |
| `postcss` | high | XSS via unescaped `</style>` in CSS stringify output | Advisory `GHSA-qx2v-qp2m-jg93`; npm's suggested fix is a major `next`/`expo` upgrade. |
| `xlsx` | high | Prototype pollution and ReDoS in SheetJS | Advisory `GHSA-4r6h-8v6p-xvw6`; npm reports "No fix available" for the pinned `xlsx` package. |

## How to resolve the exceptions

1. **Stryker highs** — upgrade the mutation toolchain to a newer major (see #1531), or
   monitor for a compatible minor release.
2. **Others** — monitor npm advisories; upstream fixes are per the links in the table.
   If a fix arrives that requires a breaking change, this table is the place to
   document it.

## Full audit history

- Initial `npm audit`: `{info: 0, low: 3, moderate: 43, high: 29, critical: 25, total: 100}`
- After `npm audit fix` + upgrades (2026-11-22): `{info: 0, low: 3, moderate: 14, high: 9, critical: 0, total: 26}`
