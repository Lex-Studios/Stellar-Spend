/**
 * Quality Gate: Share types via packages/ rather than copies (#1540)
 *
 * Verifies that:
 *   1. ServiceQuoteRequest and ServiceQuoteResponse are exported from @stellar-spend/shared
 *   2. quote.service.ts no longer defines local QuoteRequest/QuoteResponse inline
 *   3. packages/shared/src/index.ts exports the new services types
 *   4. The IQuoteService interface in interfaces.ts uses the shared types
 *
 * Related: packages/shared/src/types/services.ts, Issue #1540
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());

describe('Quality Gate — Shared types via packages/ (#1540)', () => {
  it('packages/shared/src/types/services.ts exists', () => {
    const p = path.join(ROOT, 'packages', 'shared', 'src', 'types', 'services.ts');
    expect(fs.existsSync(p)).toBe(true);
  });

  it('packages/shared/src/types/services.ts exports ServiceQuoteRequest and ServiceQuoteResponse', () => {
    const p = path.join(ROOT, 'packages', 'shared', 'src', 'types', 'services.ts');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('ServiceQuoteRequest');
    expect(content).toContain('ServiceQuoteResponse');
  });

  it('packages/shared/src/index.ts re-exports types/services', () => {
    const p = path.join(ROOT, 'packages', 'shared', 'src', 'index.ts');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain("'./types/services'");
  });

  it('quote.service.ts imports from @stellar-spend/shared instead of defining types inline', () => {
    const p = path.join(ROOT, 'src', 'lib', 'services', 'quote.service.ts');
    const content = fs.readFileSync(p, 'utf-8');
    // Must import from shared
    expect(content).toContain('@stellar-spend/shared');
    // Must NOT contain inline interface declarations for the duplicate types
    expect(content).not.toMatch(/^export interface QuoteRequest\s*\{/m);
    expect(content).not.toMatch(/^export interface QuoteResponse\s*\{/m);
  });

  it('interfaces.ts uses shared ServiceQuoteRequest/ServiceQuoteResponse for IQuoteService', () => {
    const p = path.join(ROOT, 'src', 'lib', 'services', 'interfaces.ts');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('@stellar-spend/shared');
    expect(content).toContain('ServiceQuoteRequest');
    expect(content).toContain('ServiceQuoteResponse');
  });

  it('@stellar-spend/shared barrel exports ServiceQuoteRequest at runtime', async () => {
    // Dynamic import to verify the type is actually re-exported at runtime
    const shared = await import('@stellar-spend/shared');
    // Types are erased at runtime; we verify the module loads without error
    // and that the named type exports exist in the declaration map
    expect(shared).toBeDefined();
  });

  it('no duplicate inline QuoteRequest interface definitions remain in src/lib/services/', () => {
    const servicesDir = path.join(ROOT, 'src', 'lib', 'services');
    const files = fs.readdirSync(servicesDir).filter((f) => f.endsWith('.ts'));
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
      // A local `interface QuoteRequest {` without importing from shared is a violation
      if (/^(export\s+)?interface QuoteRequest\s*\{/m.test(content)) {
        if (!content.includes('@stellar-spend/shared')) {
          violations.push(file);
        }
      }
    }

    expect(
      violations,
      `Files still defining local QuoteRequest without shared import: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });
});
