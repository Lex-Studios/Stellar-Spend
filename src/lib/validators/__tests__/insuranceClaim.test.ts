import { describe, it, expect } from 'vitest';
import {
  insuranceClaimSchema,
  insuranceClaimPatchSchema,
  CLAIM_REASONS,
  type InsuranceClaimInput,
  type InsuranceClaimPatchInput,
} from '../schemas';

// ---------------------------------------------------------------------------
// insuranceClaimSchema (form-side: reason + optional evidence)
// ---------------------------------------------------------------------------
describe('insuranceClaimSchema', () => {
  // ------------------------------------------------------------------
  // reason field
  // ------------------------------------------------------------------
  describe('reason field', () => {
    it('accepts every value in CLAIM_REASONS', () => {
      CLAIM_REASONS.forEach((reason) => {
        const result = insuranceClaimSchema.safeParse({ reason });
        expect(result.success, `Expected "${reason}" to be valid`).toBe(true);
      });
    });

    it('rejects an empty string reason', () => {
      const result = insuranceClaimSchema.safeParse({ reason: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('reason');
      }
    });

    it('rejects a reason not in CLAIM_REASONS', () => {
      const result = insuranceClaimSchema.safeParse({ reason: 'I just want money back' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('reason');
      }
    });

    it('rejects a missing reason field', () => {
      const result = insuranceClaimSchema.safeParse({ evidence: 'some evidence' });
      expect(result.success).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // evidence field
  // ------------------------------------------------------------------
  describe('evidence field', () => {
    it('is optional — parses successfully when omitted', () => {
      const result = insuranceClaimSchema.safeParse({ reason: CLAIM_REASONS[0] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.evidence).toBeUndefined();
      }
    });

    it('accepts an empty string as evidence (treated as no evidence)', () => {
      const result = insuranceClaimSchema.safeParse({
        reason: CLAIM_REASONS[0],
        evidence: '',
      });
      expect(result.success).toBe(true);
    });

    it('accepts evidence up to 2000 characters', () => {
      const result = insuranceClaimSchema.safeParse({
        reason: CLAIM_REASONS[0],
        evidence: 'a'.repeat(2000),
      });
      expect(result.success).toBe(true);
    });

    it('rejects evidence longer than 2000 characters', () => {
      const result = insuranceClaimSchema.safeParse({
        reason: CLAIM_REASONS[0],
        evidence: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('evidence');
        const msg = result.error.issues.find((i) => i.path[0] === 'evidence')?.message;
        expect(msg).toMatch(/2000/);
      }
    });

    it('preserves the provided evidence in parsed data', () => {
      const evidence = 'Transaction hash: abc123';
      const result = insuranceClaimSchema.safeParse({
        reason: CLAIM_REASONS[1],
        evidence,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as InsuranceClaimInput).evidence).toBe(evidence);
      }
    });
  });

  // ------------------------------------------------------------------
  // full-object happy path
  // ------------------------------------------------------------------
  describe('valid inputs', () => {
    it('parses a complete, valid claim with reason and evidence', () => {
      const input = {
        reason: 'Transaction failed - funds not delivered',
        evidence: 'TX hash: ABCDEF123456',
      };
      const result = insuranceClaimSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe(input.reason);
        expect(result.data.evidence).toBe(input.evidence);
      }
    });

    it('parses a valid claim with only reason (no evidence)', () => {
      const result = insuranceClaimSchema.safeParse({
        reason: 'Other',
      });
      expect(result.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// insuranceClaimPatchSchema (server-side: insuranceId + reason + optional evidence)
// ---------------------------------------------------------------------------
describe('insuranceClaimPatchSchema', () => {
  const validBase = {
    insuranceId: 'ins_abc123',
    reason: CLAIM_REASONS[0],
  };

  // ------------------------------------------------------------------
  // insuranceId field
  // ------------------------------------------------------------------
  describe('insuranceId field', () => {
    it('accepts a non-empty insuranceId', () => {
      const result = insuranceClaimPatchSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });

    it('rejects an empty insuranceId', () => {
      const result = insuranceClaimPatchSchema.safeParse({ ...validBase, insuranceId: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('insuranceId');
      }
    });

    it('rejects a missing insuranceId', () => {
      const { insuranceId: _removed, ...rest } = validBase;
      const result = insuranceClaimPatchSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // reason field (same rules as the form schema)
  // ------------------------------------------------------------------
  describe('reason field', () => {
    it('accepts every value in CLAIM_REASONS', () => {
      CLAIM_REASONS.forEach((reason) => {
        const result = insuranceClaimPatchSchema.safeParse({ ...validBase, reason });
        expect(result.success, `Expected "${reason}" to be valid`).toBe(true);
      });
    });

    it('rejects an empty string reason', () => {
      const result = insuranceClaimPatchSchema.safeParse({ ...validBase, reason: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('reason');
      }
    });

    it('rejects a free-text reason not in CLAIM_REASONS', () => {
      const result = insuranceClaimPatchSchema.safeParse({
        ...validBase,
        reason: 'Not a valid reason',
      });
      expect(result.success).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // evidence field
  // ------------------------------------------------------------------
  describe('evidence field', () => {
    it('is optional — parses without it', () => {
      const result = insuranceClaimPatchSchema.safeParse(validBase);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as InsuranceClaimPatchInput).evidence).toBeUndefined();
      }
    });

    it('rejects evidence exceeding 2000 characters', () => {
      const result = insuranceClaimPatchSchema.safeParse({
        ...validBase,
        evidence: 'x'.repeat(2001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('evidence');
      }
    });
  });

  // ------------------------------------------------------------------
  // full-object happy path
  // ------------------------------------------------------------------
  describe('valid inputs', () => {
    it('parses a complete, valid patch payload', () => {
      const input: InsuranceClaimPatchInput = {
        insuranceId: 'ins_xyz789',
        reason: 'Incorrect amount received',
        evidence: 'Screenshot of transaction',
      };
      const result = insuranceClaimPatchSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.insuranceId).toBe(input.insuranceId);
        expect(result.data.reason).toBe(input.reason);
        expect(result.data.evidence).toBe(input.evidence);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// CLAIM_REASONS constant
// ---------------------------------------------------------------------------
describe('CLAIM_REASONS', () => {
  it('contains at least one reason', () => {
    expect(CLAIM_REASONS.length).toBeGreaterThan(0);
  });

  it('includes "Other" as a catch-all reason', () => {
    expect(CLAIM_REASONS).toContain('Other');
  });

  it('has no duplicate entries', () => {
    const unique = new Set(CLAIM_REASONS);
    expect(unique.size).toBe(CLAIM_REASONS.length);
  });

  it('has no blank or whitespace-only entries', () => {
    CLAIM_REASONS.forEach((r) => {
      expect(r.trim().length).toBeGreaterThan(0);
    });
  });
});
