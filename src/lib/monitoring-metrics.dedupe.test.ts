import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as metrics from './monitoring-metrics';

// Test for Issue #1292: Deduplicate monitoring modules
// Acceptance criteria: one metrics entry point; tests pass.

const libDir = path.join(process.cwd(), 'src', 'lib');

function exportedNames(file: string): string[] {
  const source = fs.readFileSync(path.join(libDir, file), 'utf8');
  return [...source.matchAll(/^export (?:async )?(?:function|const|class) (\w+)/gm)].map(
    (m) => m[1],
  );
}

describe('Monitoring metrics single entry point - Issue #1292', () => {
  it('exposes the shared metric helpers from monitoring-metrics', () => {
    expect(typeof metrics.fetchMetricTimed).toBe('function');
    expect(typeof metrics.formatRate).toBe('function');
    expect(typeof metrics.formatCount).toBe('function');
    expect(typeof metrics.buildMetricsEnvelope).toBe('function');
  });

  it('does not redefine any monitoring-metrics helper in another monitoring module', () => {
    const sharedNames = new Set(exportedNames('monitoring-metrics.ts'));
    const duplicates = ['monitoring.ts', 'performance-monitoring.ts'].flatMap((file) =>
      exportedNames(file)
        .filter((name) => sharedNames.has(name))
        .map((name) => `${file}:${name}`),
    );
    expect(duplicates).toEqual([]);
  });

  it('formats rates to the requested precision', () => {
    expect(metrics.formatRate(0.123456)).toBe(0.1235);
    expect(metrics.formatRate(0.5, 2)).toBe(0.5);
  });

  it('normalizes unknown web-vital ratings to "unknown"', () => {
    expect(metrics.normalizeVitalRating('good')).toBe('good');
    expect(metrics.normalizeVitalRating('bogus')).toBe('unknown');
  });
});
