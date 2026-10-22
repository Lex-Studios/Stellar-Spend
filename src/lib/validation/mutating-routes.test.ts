/**
 * Mutating route validation tests (#1305)
 * - Every POST/PUT/PATCH route handler validates its body with the shared validators.
 * - validateBody rejects malformed JSON and schema violations with a 400.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateBody } from './validate-request';

const API_DIR = resolve(__dirname, '../../app/api');
const MUTATING = /export\s+(async\s+)?function\s+(POST|PUT|PATCH)\b/;

function listRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listRouteFiles(full);
    return entry === 'route.ts' ? [full] : [];
  });
}

describe('mutating API routes', () => {
  const mutatingRoutes = listRouteFiles(API_DIR).filter((file) =>
    MUTATING.test(readFileSync(file, 'utf8')),
  );

  it('finds mutating routes to check', () => {
    expect(mutatingRoutes.length).toBeGreaterThan(0);
  });

  it.each(mutatingRoutes.map((f) => [f.replace(API_DIR, 'api')]))(
    '%s validates its request body',
    (label) => {
      const file = join(API_DIR, label.replace(/^api/, ''));
      const source = readFileSync(file, 'utf8');
      expect(source).toMatch(/validateBody\(|safeParse\(/);
    },
  );
});

describe('validateBody', () => {
  const schema = z.object({ amount: z.string().min(1) });

  function jsonRequest(body: string): NextRequest {
    return new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  it('returns a 400 for malformed JSON', async () => {
    const result = await validateBody(jsonRequest('{not json'), schema);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.response.status).toBe(400);
  });

  it('returns a 400 when the schema is violated', async () => {
    const result = await validateBody(jsonRequest(JSON.stringify({ amount: '' })), schema);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.response.status).toBe(400);
  });

  it('returns typed data for a valid body', async () => {
    const result = await validateBody(jsonRequest(JSON.stringify({ amount: '5' })), schema);
    expect(result).toEqual({ success: true, data: { amount: '5' } });
  });
});
