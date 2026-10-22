import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  extractBearerToken,
  extractApiKeyFromRequest,
  extractRequestBearerToken,
} from './authorize';

const req = (headers: Record<string, string>) =>
  new NextRequest('http://localhost/api/test', { headers });

describe('extractBearerToken', () => {
  it('returns the token for a Bearer header, case-insensitively', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123');
    expect(extractBearerToken('bearer abc123')).toBe('abc123');
  });

  it('returns null for missing or non-Bearer values', () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
    expect(extractBearerToken('Bearer ')).toBeNull();
  });
});

describe('extractApiKeyFromRequest', () => {
  it('prefers x-api-key over Authorization', () => {
    expect(
      extractApiKeyFromRequest(req({ 'x-api-key': 'key-1', authorization: 'Bearer tok' })),
    ).toBe('key-1');
  });

  it('falls back to the Bearer token', () => {
    expect(extractApiKeyFromRequest(req({ authorization: 'Bearer tok' }))).toBe('tok');
  });

  it('returns null when neither header is present', () => {
    expect(extractApiKeyFromRequest(req({}))).toBeNull();
  });
});

describe('extractRequestBearerToken', () => {
  it('reads only the Authorization header, ignoring x-api-key', () => {
    expect(extractRequestBearerToken(req({ 'x-api-key': 'key-1' }))).toBeNull();
    expect(extractRequestBearerToken(req({ authorization: 'Bearer tok' }))).toBe('tok');
  });
});
