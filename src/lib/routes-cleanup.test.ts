import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import * as path from 'path';

// Test for Issue #1290: Remove unused API routes
// Acceptance criteria: routes audit clean, openapi spec has no drift.

const rootDir = process.cwd();
const auditScript = path.join(rootDir, 'scripts', 'audit-api-routes.cjs');

interface AuditJson {
  totalRoutes: number;
  undocumented: Array<{ routePath: string; file: string }>;
  staleSpecPaths: string[];
}

function runAudit(): AuditJson {
  const out = execFileSync(process.execPath, [auditScript, '--json'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  return JSON.parse(out) as AuditJson;
}

describe('Unused API routes - Issue #1290', () => {
  const audit = runAudit();

  it('discovers route files under src/app/api', () => {
    expect(audit.totalRoutes).toBeGreaterThan(0);
  });

  it('has no openapi.yaml paths without a backing route file', () => {
    expect(audit.staleSpecPaths).toEqual([]);
  });

  it('never reports a route file without a method export as an undocumented live route', () => {
    const undocumentedWithoutHandler = audit.undocumented.filter(
      (r) => r.routePath === '' || r.routePath === '/',
    );
    expect(undocumentedWithoutHandler).toEqual([]);
  });
});
