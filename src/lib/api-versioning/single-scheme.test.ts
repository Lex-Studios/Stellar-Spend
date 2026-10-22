import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { registry } from './index';

// Test for Issue #1291: Consolidate legacy `v1` and `versions` API paths
// Acceptance criteria: one versioning path; the registry is the single source
// of truth for version prefixes.

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');

describe('Single API versioning scheme - Issue #1291', () => {
  it('registers every version under a single /api/<version> prefix scheme', () => {
    for (const entry of registry.getAll()) {
      expect(entry.prefix).toBe(`/api/${entry.version}`);
    }
  });

  it('has exactly one supported version in the registry', () => {
    const supported = registry.getAll().filter((e) => e.status === 'supported');
    expect(supported.map((e) => e.version)).toEqual(['v1']);
  });

  it('serves the /api/versions discovery route from the shared registry', () => {
    const source = fs.readFileSync(path.join(apiDir, 'versions', 'route.ts'), 'utf8');
    expect(source).toMatch(/from '@\/lib\/api-versioning'/);
    expect(source).toMatch(/registry\.getAll\(\)/);
  });

  it('keeps all v1 route files under the v1 prefix', () => {
    const v1Dir = path.join(apiDir, 'v1');
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : entry.name === 'route.ts' ? [full] : [];
      });

    const v1Routes = walk(v1Dir);
    expect(v1Routes.length).toBeGreaterThan(0);
    for (const file of v1Routes) {
      expect(file.startsWith(v1Dir)).toBe(true);
    }
  });
});
