# Storybook orphan check (issue #1258)

A story is an orphan when one of its relative imports points at a file that no longer exists.

Checked: every `*.stories.tsx` under `src/`, each relative import resolved against the `.ts`,
`.tsx`, `index.ts` and `index.tsx` forms. Result: **zero orphans**. No story was deleted.
