/**
 * Unit tests for TransactionSigningService (issue #1499).
 *
 * The service writes to / reads from a PostgreSQL pool.  All `pool.query` calls
 * are mocked via `vi.mock` so no database is required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the DB pool before importing the service ─────────────────────────────
vi.mock('@/lib/db/client', () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks are set up.
import { TransactionSigningService } from '@/lib/transaction-signing';
import { pool } from '@/lib/db/client';

const mockPool = pool as { query: ReturnType<typeof vi.fn> };

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSignatureRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sig_123',
    transaction_id: 'tx_abc',
    user_address: 'GXYZ',
    // 128-hex-char signature (ed25519 happy path)
    signature: 'a'.repeat(128),
    // 64-hex-char public key
    public_key: 'b'.repeat(64),
    algorithm: 'ed25519',
    signed_at: 1_700_000_000_000,
    verified_at: null,
    is_valid: null,
    verification_error: null,
    ...overrides,
  };
}

// ── signTransaction ───────────────────────────────────────────────────────────

describe('TransactionSigningService.signTransaction', () => {
  let service: TransactionSigningService;

  beforeEach(() => {
    service = new TransactionSigningService();
    vi.clearAllMocks();
    mockPool.query.mockResolvedValue({ rows: [] });
  });

  it('inserts a row and returns a TransactionSignature with an id', async () => {
    const result = await service.signTransaction('tx_1', 'GUser', 'sig_hex', 'pub_key');

    expect(mockPool.query).toHaveBeenCalledOnce();
    const [sql, params] = mockPool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/INSERT INTO transaction_signatures/i);
    expect(params).toContain('tx_1');
    expect(params).toContain('GUser');

    expect(result.id).toMatch(/^sig_/);
    expect(result.transactionId).toBe('tx_1');
    expect(result.userAddress).toBe('GUser');
    expect(result.signature).toBe('sig_hex');
    expect(result.publicKey).toBe('pub_key');
    expect(result.algorithm).toBe('ed25519');
    expect(typeof result.signedAt).toBe('number');
  });

  it('defaults algorithm to ed25519 when not supplied', async () => {
    const result = await service.signTransaction('tx_2', 'GUser', 'sig', 'key');
    expect(result.algorithm).toBe('ed25519');
  });

  it('honours an explicit algorithm parameter', async () => {
    const result = await service.signTransaction('tx_3', 'GUser', 'sig', 'key', 'secp256k1');
    expect(result.algorithm).toBe('secp256k1');
  });

  it('propagates DB errors', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB down'));
    await expect(service.signTransaction('t', 'u', 's', 'k')).rejects.toThrow('DB down');
  });
});

// ── verifySignature ───────────────────────────────────────────────────────────

describe('TransactionSigningService.verifySignature', () => {
  let service: TransactionSigningService;

  beforeEach(() => {
    service = new TransactionSigningService();
    vi.clearAllMocks();
  });

  it('returns false when the signature is not found', async () => {
    // SELECT returns empty rows.
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await service.verifySignature('sig_missing');
    expect(result).toBe(false);
  });

  it('returns true for a valid ed25519 hex signature and public key', async () => {
    const row = makeSignatureRow();
    // SELECT
    mockPool.query.mockResolvedValueOnce({ rows: [row] });
    // UPDATE verified_at
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // INSERT log
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const result = await service.verifySignature('sig_123');
    expect(result).toBe(true);
  });

  it('returns false for a signature with wrong hex length', async () => {
    const row = makeSignatureRow({ signature: 'deadbeef', public_key: 'b'.repeat(64) });
    mockPool.query.mockResolvedValueOnce({ rows: [row] });
    // UPDATE with is_valid=false
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // INSERT log
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const result = await service.verifySignature('sig_bad');
    expect(result).toBe(false);
  });

  it('returns false for an unknown algorithm', async () => {
    const row = makeSignatureRow({
      signature: 'a'.repeat(128),
      public_key: 'b'.repeat(64),
      algorithm: 'ecdsa',
    });
    mockPool.query.mockResolvedValueOnce({ rows: [row] });
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const result = await service.verifySignature('sig_ecdsa');
    expect(result).toBe(false);
  });

  it('returns false and updates the row when verification throws', async () => {
    const row = makeSignatureRow();
    mockPool.query
      // SELECT
      .mockResolvedValueOnce({ rows: [row] })
      // First UPDATE (simulated throw before it)
      .mockRejectedValueOnce(new Error('internal error'))
      // UPDATE with error
      .mockResolvedValueOnce({ rows: [] });

    // The service catches the error internally and returns false.
    const result = await service.verifySignature('sig_throw');
    expect(result).toBe(false);
  });
});

// ── getTransactionSignatures ──────────────────────────────────────────────────

describe('TransactionSigningService.getTransactionSignatures', () => {
  let service: TransactionSigningService;

  beforeEach(() => {
    service = new TransactionSigningService();
    vi.clearAllMocks();
  });

  it('returns an empty array when no signatures exist', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const sigs = await service.getTransactionSignatures('tx_none');
    expect(sigs).toEqual([]);
  });

  it('maps rows to TransactionSignature objects', async () => {
    const row = makeSignatureRow({
      verified_at: 1_700_000_001_000,
      is_valid: true,
    });
    mockPool.query.mockResolvedValueOnce({ rows: [row] });

    const [sig] = await service.getTransactionSignatures('tx_abc');
    expect(sig.id).toBe('sig_123');
    expect(sig.transactionId).toBe('tx_abc');
    expect(sig.isValid).toBe(true);
    expect(sig.verifiedAt).toBe(1_700_000_001_000);
  });

  it('omits undefined optional fields when DB returns null', async () => {
    const row = makeSignatureRow(); // verified_at=null, is_valid=null
    mockPool.query.mockResolvedValueOnce({ rows: [row] });

    const [sig] = await service.getTransactionSignatures('tx_abc');
    expect(sig.verifiedAt).toBeUndefined();
    expect(sig.isValid).toBeUndefined();
    expect(sig.verificationError).toBeUndefined();
  });
});

// ── getSignatureStatus ────────────────────────────────────────────────────────

describe('TransactionSigningService.getSignatureStatus', () => {
  let service: TransactionSigningService;

  beforeEach(() => {
    service = new TransactionSigningService();
    vi.clearAllMocks();
  });

  it('returns null when the signature is not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await service.getSignatureStatus('sig_missing');
    expect(result).toBeNull();
  });

  it('returns a mapped TransactionSignature for a known id', async () => {
    const row = makeSignatureRow({ is_valid: false, verification_error: 'bad sig' });
    mockPool.query.mockResolvedValueOnce({ rows: [row] });

    const result = await service.getSignatureStatus('sig_123');
    expect(result).not.toBeNull();
    expect(result!.isValid).toBe(false);
    expect(result!.verificationError).toBe('bad sig');
  });
});

// ── getVerificationLogs ───────────────────────────────────────────────────────

describe('TransactionSigningService.getVerificationLogs', () => {
  let service: TransactionSigningService;

  beforeEach(() => {
    service = new TransactionSigningService();
    vi.clearAllMocks();
  });

  it('returns an empty array when no logs exist', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    expect(await service.getVerificationLogs('sig_none')).toEqual([]);
  });

  it('maps rows to SignatureVerificationLog objects', async () => {
    const row = {
      id: 'log_1',
      signature_id: 'sig_123',
      verification_status: 'verified',
      verified_by: null,
      verified_at: 1_700_000_002_000,
      details: 'ok',
    };
    mockPool.query.mockResolvedValueOnce({ rows: [row] });

    const [log] = await service.getVerificationLogs('sig_123');
    expect(log.id).toBe('log_1');
    expect(log.signatureId).toBe('sig_123');
    expect(log.verificationStatus).toBe('verified');
    expect(log.verifiedAt).toBe(1_700_000_002_000);
    expect(log.details).toBe('ok');
    expect(log.verifiedBy).toBeUndefined();
  });
});
