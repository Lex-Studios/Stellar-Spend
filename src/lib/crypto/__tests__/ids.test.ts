import { describe, it, expect } from 'vitest';
import { randomHex, randomHexUpper, randomUuid } from '../ids';

describe('crypto/ids', () => {
  it('randomHex returns exact lowercase hex length', () => {
    expect(randomHex(4)).toMatch(/^[0-9a-f]{8}$/);
    expect(randomHex(8)).toMatch(/^[0-9a-f]{16}$/);
  });
  it('randomHex is unique across calls', () => {
    expect(randomHex(16)).not.toBe(randomHex(16));
  });
  it('randomHex rejects bad byteLength', () => {
    expect(() => randomHex(0)).toThrow();
    expect(() => randomHex(-1)).toThrow();
    expect(() => randomHex(1.5)).toThrow();
  });
  it('randomHexUpper returns uppercase', () => {
    expect(randomHexUpper(4)).toMatch(/^[0-9A-F]{8}$/);
  });
  it('randomUuid returns a v4 UUID', () => {
    expect(randomUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
