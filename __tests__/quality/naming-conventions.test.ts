/**
 * Quality Gate: Naming Conventions (#1539)
 *
 * Verifies that:
 *   1. The @typescript-eslint/naming-convention rule is present in eslint.config.js
 *   2. No new camelCase .ts files are introduced (kebab-case enforced for lib/ files)
 *   3. The deprecated shim files are present for backwards compatibility
 *   4. The canonical kebab-case aliases exist for formerly camelCase modules
 *   5. The three sentry configs import from the canonical sentry-shared path
 *
 * Related: eslint.config.js, CONTRIBUTING.md § Naming, Issue #1539
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());

describe('Quality Gate — Naming conventions (#1539)', () => {
  it('naming-convention lint rule is present in eslint.config.js', () => {
    const configPath = path.join(ROOT, 'eslint.config.js');
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('@typescript-eslint/naming-convention');
    expect(content).toContain('#1539');
  });

  it('canonical kebab-case sentry-shared.ts exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'src', 'lib', 'sentry-shared.ts'))).toBe(true);
  });

  it('deprecated shim sentryShared.ts re-exports from sentry-shared', () => {
    const shim = path.join(ROOT, 'src', 'lib', 'sentryShared.ts');
    expect(fs.existsSync(shim)).toBe(true);
    const content = fs.readFileSync(shim, 'utf-8');
    expect(content).toContain("from './sentry-shared'");
    expect(content).toContain('@deprecated');
  });

  it('canonical kebab-case rate-limiter.ts exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'src', 'lib', 'rate-limiter.ts'))).toBe(true);
  });

  it('canonical kebab-case webhook-verify.ts exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'src', 'lib', 'webhook-verify.ts'))).toBe(true);
  });

  it('sentry.client.config.ts imports from sentry-shared', () => {
    const file = path.join(ROOT, 'sentry.client.config.ts');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('sentry-shared');
  });

  it('sentry.server.config.ts imports from sentry-shared', () => {
    const file = path.join(ROOT, 'sentry.server.config.ts');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('sentry-shared');
  });

  it('sentry.edge.config.ts imports from sentry-shared', () => {
    const file = path.join(ROOT, 'sentry.edge.config.ts');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('sentry-shared');
  });

  it('CONTRIBUTING.md documents the kebab-case file naming convention', () => {
    const contributing = path.join(ROOT, 'CONTRIBUTING.md');
    const content = fs.readFileSync(contributing, 'utf-8');
    expect(content).toContain('kebab-case');
    expect(content).toContain('PascalCase');
    expect(content).toContain('camelCase');
  });

  it('no new camelCase .ts lib filenames were introduced beyond the known deprecated shims', () => {
    // Allowed camelCase lib files that exist for backwards compat (#1539)
    const knownShims = new Set(['rateLimiter.ts', 'sentryShared.ts', 'webhookVerify.ts']);
    const libDir = path.join(ROOT, 'src', 'lib');
    const files = fs.readdirSync(libDir);
    const camelCaseFiles = files.filter((f) => {
      if (!f.endsWith('.ts') && !f.endsWith('.tsx')) return false;
      if (f.includes('.test.') || f.includes('.spec.')) return false;
      const base = f.replace(/\.(ts|tsx)$/, '');
      // camelCase: starts lowercase but has an uppercase letter somewhere
      return /^[a-z][a-zA-Z0-9]*[A-Z]/.test(base);
    });

    for (const file of camelCaseFiles) {
      expect(
        knownShims.has(file),
        `New camelCase lib file detected: "${file}". Use kebab-case instead (see #1539 and CONTRIBUTING.md § Naming)`,
      ).toBe(true);
    }
  });
});
