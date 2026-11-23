/**
 * Quality Gate: ESLint Complexity & Length Rules (#1537)
 *
 * Verifies that function complexity and length limits are configured in
 * eslint.config.js to prevent overly complex or long functions that are
 * hard to test and maintain.
 *
 * Rules checked:
 *   1. complexity — cyclomatic complexity limit
 *   2. max-lines-per-function — max lines per function
 *   3. max-depth — max nesting depth
 *   4. max-nested-callbacks — max nested callback depth
 *   5. max-statements — max statements per function
 *
 * Related: eslint.config.js, Issue #1537
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const ESLINT_CONFIG_PATH = path.join(ROOT, 'eslint.config.js');

describe('Quality Gate — ESLint complexity & length rules (#1537)', () => {
  let configSource: string;

  it('eslint.config.js exists', () => {
    expect(fs.existsSync(ESLINT_CONFIG_PATH)).toBe(true);
    configSource = fs.readFileSync(ESLINT_CONFIG_PATH, 'utf-8');
  });

  it('complexity rule is present and set to warn', () => {
    configSource = configSource ?? fs.readFileSync(ESLINT_CONFIG_PATH, 'utf-8');
    expect(configSource).toContain("'complexity'");
    const match = configSource.match(/'complexity'\s*:\s*\[\s*['"](\w+)['"]\s*,\s*(\d+)/);
    expect(match, 'complexity must have explicit severity and threshold').toBeTruthy();
    expect(match![1]).toBe('warn');
    expect(Number(match![2])).toBeLessThanOrEqual(20);
  });

  it('max-lines-per-function rule is present and set to warn', () => {
    configSource = configSource ?? fs.readFileSync(ESLINT_CONFIG_PATH, 'utf-8');
    expect(configSource).toContain("'max-lines-per-function'");
    const match = configSource.match(/'max-lines-per-function'\s*:\s*\[\s*['"](\w+)['"]/);
    expect(match, 'max-lines-per-function must have explicit severity').toBeTruthy();
    expect(match![1]).toBe('warn');
  });

  it('max-depth rule is present and set to warn', () => {
    configSource = configSource ?? fs.readFileSync(ESLINT_CONFIG_PATH, 'utf-8');
    expect(configSource).toContain("'max-depth'");
    const match = configSource.match(/'max-depth'\s*:\s*\[\s*['"](\w+)['"]/);
    expect(match, 'max-depth must have explicit severity').toBeTruthy();
    expect(match![1]).toBe('warn');
  });

  it('max-nested-callbacks rule is present and set to warn', () => {
    configSource = configSource ?? fs.readFileSync(ESLINT_CONFIG_PATH, 'utf-8');
    expect(configSource).toContain("'max-nested-callbacks'");
    const match = configSource.match(/'max-nested-callbacks'\s*:\s*\[\s*['"](\w+)['"]/);
    expect(match, 'max-nested-callbacks must have explicit severity').toBeTruthy();
    expect(match![1]).toBe('warn');
  });

  it('max-statements rule is present and set to warn', () => {
    configSource = configSource ?? fs.readFileSync(ESLINT_CONFIG_PATH, 'utf-8');
    expect(configSource).toContain("'max-statements'");
    const match = configSource.match(/'max-statements'\s*:\s*\[\s*['"](\w+)['"]/);
    expect(match, 'max-statements must have explicit severity').toBeTruthy();
    expect(match![1]).toBe('warn');
  });

  it('complexity rules are documented with a comment referencing #1537', () => {
    configSource = configSource ?? fs.readFileSync(ESLINT_CONFIG_PATH, 'utf-8');
    expect(configSource).toContain('#1537');
  });
});
