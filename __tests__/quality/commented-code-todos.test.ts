/**
 * Quality Gate: Commented-out code and stale TODOs (#1538)
 *
 * Verifies that:
 *   1. The dead TraceIdRatioBasedSampler placeholder has been removed from monitoring.ts
 *   2. The PNG placeholder "return ''" has been removed from qrcode-service.ts
 *   3. The no-warning-comments lint rule is present in eslint.config.js
 *   4. All TODO comments in src/ reference a GitHub issue number
 *
 * Related: eslint.config.js, Issue #1538
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());

describe('Quality Gate — Commented-out code and stale TODOs (#1538)', () => {
  it('monitoring.ts no longer contains the TraceIdRatioBasedSampler placeholder class', () => {
    const filePath = path.join(ROOT, 'src', 'lib', 'monitoring.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('TraceIdRatioBasedSampler');
    expect(content).not.toContain('This is a placeholder');
  });

  it('monitoring.ts no longer contains the stale commented-out import', () => {
    const filePath = path.join(ROOT, 'src', 'lib', 'monitoring.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('// import { TraceIdRatioBasedSampler }');
  });

  it('qrcode-service.ts no longer silently returns empty string for PNG format', () => {
    const filePath = path.join(ROOT, 'src', 'lib', 'services', 'qrcode-service.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    // The old code had `return '';` as a silent no-op placeholder for PNG
    expect(content).not.toMatch(/\/\/ This is a placeholder[\s\S]*?return '';/);
    // The new code throws instead
    expect(content).toContain('throw new Error');
  });

  it('no-warning-comments lint rule is present in eslint.config.js', () => {
    const configPath = path.join(ROOT, 'eslint.config.js');
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain("'no-warning-comments'");
    expect(content).toContain('#1538');
  });

  it('all TODO comments in src/ reference a GitHub issue number', () => {
    const srcDir = path.join(ROOT, 'src');
    const violations: string[] = [];

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.next', 'dist'].includes(entry.name)) scanDir(fullPath);
        } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
          const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
          lines.forEach((line, i) => {
            // Match TODO/FIXME not followed by an issue number (#NNN)
            if (/\/\/\s*(TODO|FIXME)\b(?!.*#\d+)/i.test(line)) {
              violations.push(`${path.relative(ROOT, fullPath)}:${i + 1} → ${line.trim()}`);
            }
          });
        }
      }
    }

    scanDir(srcDir);
    expect(
      violations,
      `Found TODO/FIXME comments without issue numbers:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });
});
