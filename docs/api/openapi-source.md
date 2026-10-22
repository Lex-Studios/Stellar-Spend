# OpenAPI: one source of truth

The root `openapi.yaml` is the only file that is edited by hand.

- `npm run openapi:generate` (`scripts/generate-openapi.cjs`) reads the root file and writes
  `public/openapi.yaml` and `public/openapi.json`. Those two copies are generated; do not edit them.
- `npm run openapi:validate` checks the root spec.

External consumers should use `public/openapi.json` or `public/openapi.yaml`, which are always
generated from the root file.
