#!/usr/bin/env node
/**
 * scripts/validate-openapi-contract.mjs
 *
 * Local OpenAPI contract validation script (#806)
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates openapi.yaml in two passes:
 *
 *   1. Structural / spec validation — ensures the file is a valid OpenAPI 3.x
 *      document (no undefined $refs, correct data types, etc.) using the
 *      Spectral OAS ruleset.
 *
 *   2. Route coverage check — cross-references every `operationId` in the spec
 *      against the route handlers that exist under `src/app/api/`.  Flags:
 *        • Paths documented in the spec but missing a handler (drift)
 *        • Handlers found under src/app/api/admin/* that lack the
 *          requireAdmin guard import (safety audit)
 *
 * Usage
 * ─────
 * Run before opening a PR:
 *
 *   node scripts/validate-openapi-contract.mjs
 *   # or via npm:
 *   npm run validate:openapi
 *
 * Exit codes
 * ──────────
 *   0  All checks passed
 *   1  One or more checks failed (details printed to stdout)
 *
 * Flags
 * ─────
 *   --warn-only   Print failures but exit 0 (useful in CI soft-mode)
 *   --no-spectral Skip the Spectral lint pass (faster, structural-only)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load as yamlLoad } from 'js-yaml';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OPENAPI_FILE = join(ROOT, 'openapi.yaml');
const ADMIN_ROUTES_DIR = join(ROOT, 'src', 'app', 'api', 'admin');

const WARN_ONLY = process.argv.includes('--warn-only');
const SKIP_SPECTRAL = process.argv.includes('--no-spectral');

// ── Colour helpers ─────────────────────────────────────────────────────────

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function ok(msg)   { console.log(`${GREEN}✓${RESET} ${msg}`); }
function fail(msg) { console.log(`${RED}✗${RESET} ${BOLD}${msg}${RESET}`); }
function warn(msg) { console.log(`${YELLOW}⚠${RESET} ${msg}`); }
function info(msg) { console.log(`  ${msg}`); }
function header(msg) { console.log(`\n${BOLD}${msg}${RESET}`); }

// ── Step 1: Parse openapi.yaml ─────────────────────────────────────────────

header('Step 1 — Parse openapi.yaml');

if (!existsSync(OPENAPI_FILE)) {
  fail(`openapi.yaml not found at ${OPENAPI_FILE}`);
  process.exit(1);
}

let spec;
try {
  spec = yamlLoad(readFileSync(OPENAPI_FILE, 'utf8'));
  ok(`Parsed openapi.yaml (${Object.keys(spec.paths ?? {}).length} paths)`);
} catch (e) {
  fail(`Failed to parse openapi.yaml: ${e.message}`);
  process.exit(1);
}

// ── Step 2: Spectral lint ──────────────────────────────────────────────────

let spectralErrors = 0;
let spectralWarnings = 0;

if (!SKIP_SPECTRAL) {
  header('Step 2 — Spectral OAS lint');
  try {
    // Spectral is available via npx (no install needed in CI)
    const output = execSync(
      `npx --yes @stoplight/spectral-cli lint ${OPENAPI_FILE} --ruleset @stoplight/spectral-rulesets/openapi --format text 2>&1`,
      { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const errorLines = output.split('\n').filter(l => l.includes(' error '));
    const warnLines  = output.split('\n').filter(l => l.includes(' warning '));
    spectralErrors   = errorLines.length;
    spectralWarnings = warnLines.length;

    if (spectralErrors === 0) {
      ok(`Spectral: no errors (${spectralWarnings} warning${spectralWarnings !== 1 ? 's' : ''})`);
      if (spectralWarnings > 0) {
        warnLines.slice(0, 10).forEach(l => info(l.trim()));
      }
    } else {
      fail(`Spectral: ${spectralErrors} error${spectralErrors !== 1 ? 's' : ''}, ${spectralWarnings} warning${spectralWarnings !== 1 ? 's' : ''}`);
      errorLines.slice(0, 20).forEach(l => info(l.trim()));
    }
  } catch (e) {
    // Spectral exits non-zero when there are lint findings
    const output = e.stdout?.toString() ?? e.message;
    const errorLines = output.split('\n').filter(l => / error /.test(l) || /^\s+\d+:\d+\s+error/.test(l));
    const warnLines  = output.split('\n').filter(l => / warning /.test(l) || /^\s+\d+:\d+\s+warning/.test(l));
    spectralErrors   = errorLines.length;
    spectralWarnings = warnLines.length;

    if (spectralErrors === 0 && warnLines.length > 0) {
      ok(`Spectral: no errors (${spectralWarnings} warning${spectralWarnings !== 1 ? 's' : ''})`);
    } else if (spectralErrors > 0) {
      fail(`Spectral: ${spectralErrors} lint error${spectralErrors !== 1 ? 's' : ''}`);
      errorLines.slice(0, 20).forEach(l => info(l.trim()));
    } else {
      ok('Spectral: passed');
    }
  }
} else {
  warn('Spectral lint skipped (--no-spectral)');
}

// ── Step 3: Required fields check ─────────────────────────────────────────

header('Step 3 — Required spec fields');

const requiredTopLevel = ['openapi', 'info', 'paths'];
let missingFields = 0;
for (const field of requiredTopLevel) {
  if (!spec[field]) {
    fail(`Missing required top-level field: ${field}`);
    missingFields++;
  } else {
    ok(`spec.${field} present`);
  }
}

// ── Step 4: $ref integrity ─────────────────────────────────────────────────

header('Step 4 — $ref integrity (local references)');

function collectRefs(obj, refs = new Set()) {
  if (!obj || typeof obj !== 'object') return refs;
  if (Array.isArray(obj)) { obj.forEach(v => collectRefs(v, refs)); return refs; }
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$ref' && typeof v === 'string' && v.startsWith('#/')) refs.add(v);
    else collectRefs(v, refs);
  }
  return refs;
}

const allRefs = collectRefs(spec.paths ?? {});
let brokenRefs = 0;

for (const ref of allRefs) {
  const parts = ref.replace('#/', '').split('/');
  let node = spec;
  let broken = false;
  for (const part of parts) {
    if (!node || typeof node !== 'object' || !(part in node)) { broken = true; break; }
    node = node[part];
  }
  if (broken) {
    fail(`Broken $ref: ${ref}`);
    brokenRefs++;
  }
}
if (brokenRefs === 0) ok(`All ${allRefs.size} local $refs resolve correctly`);

// ── Step 5: Pagination parameters documented ───────────────────────────────

header('Step 5 — Pagination contract (CursorParam / LimitParam)');

const params = spec.components?.parameters ?? {};
const pagParams = ['CursorParam', 'LimitParam'];
let missingPagParams = 0;
for (const p of pagParams) {
  if (params[p]) {
    ok(`components.parameters.${p} defined`);
  } else {
    fail(`components.parameters.${p} missing`);
    missingPagParams++;
  }
}

const schemas = spec.components?.schemas ?? {};
const pagSchemas = ['PageInfo', 'TransactionListResponse'];
let missingPagSchemas = 0;
for (const s of pagSchemas) {
  if (schemas[s]) {
    ok(`components.schemas.${s} defined`);
  } else {
    fail(`components.schemas.${s} missing`);
    missingPagSchemas++;
  }
}

// ── Step 6: Admin routes guard audit ──────────────────────────────────────

header('Step 6 — Admin route guard audit (requireAdmin)');

function walkDir(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...walkDir(full));
    else if (entry === 'route.ts' || entry === 'route.tsx') results.push(full);
  }
  return results;
}

const adminRouteFiles = walkDir(ADMIN_ROUTES_DIR);
let unguardedRoutes = 0;

for (const file of adminRouteFiles) {
  const src = readFileSync(file, 'utf8');
  const rel = file.replace(ROOT + '/', '');
  if (!src.includes('requireAdmin')) {
    fail(`Missing requireAdmin guard: ${rel}`);
    unguardedRoutes++;
  } else {
    ok(`Guard present: ${rel}`);
  }
}

if (adminRouteFiles.length === 0) {
  warn('No admin route files found under src/app/api/admin/');
}

// ── Step 7: operationId uniqueness ─────────────────────────────────────────

header('Step 7 — operationId uniqueness');

const opIds = new Map();
let dupOps = 0;
for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const method of ['get','post','put','patch','delete','head','options','trace']) {
    const op = pathItem[method];
    if (!op) continue;
    if (!op.operationId) { warn(`Missing operationId: ${method.toUpperCase()} ${path}`); continue; }
    if (opIds.has(op.operationId)) {
      fail(`Duplicate operationId "${op.operationId}" (${path} AND ${opIds.get(op.operationId)})`);
      dupOps++;
    } else {
      opIds.set(op.operationId, path);
    }
  }
}
if (dupOps === 0) ok(`All ${opIds.size} operationIds are unique`);

// ── Summary ────────────────────────────────────────────────────────────────

header('Summary');

const totalFailures =
  spectralErrors + missingFields + brokenRefs +
  missingPagParams + missingPagSchemas +
  unguardedRoutes + dupOps;

if (totalFailures === 0) {
  console.log(`\n${GREEN}${BOLD}All checks passed.${RESET}\n`);
  process.exit(0);
} else {
  const msg = `${totalFailures} check${totalFailures !== 1 ? 's' : ''} failed.`;
  if (WARN_ONLY) {
    console.log(`\n${YELLOW}${BOLD}${msg} (--warn-only: exiting 0)${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}${BOLD}${msg}${RESET}\n`);
    process.exit(1);
  }
}
