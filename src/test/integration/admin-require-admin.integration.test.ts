/**
 * Integration tests for the requireAdmin guard (#803)
 *
 * Verifies that:
 *   1. Requests without a bearer token are rejected with 403.
 *   2. Requests with an invalid bearer token are rejected with 403.
 *   3. Requests with a valid admin token are passed through to the handler.
 *   4. All admin routes under /api/admin/* honour the guard.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mock the auth service so tests run without a real database ─────────────
vi.mock('@/lib/api-keys/service', () => ({
  hasApiKeyAdminToken: () => true,
  isValidAdminToken: (token: string | null) => token === 'valid-admin-token',
}));

// ── Stub out heavy route dependencies ─────────────────────────────────────
vi.mock('@/lib/audit-logging', () => ({
  auditLoggingService: {
    getAuditLogs: vi.fn().mockResolvedValue([]),
    getAdminActions: vi.fn().mockResolvedValue([]),
    exportAuditLogs: vi.fn().mockResolvedValue({ data: '[]' }),
    getRetentionPolicy: vi.fn().mockResolvedValue(90),
    setRetentionPolicy: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/vulnerability-management', () => ({
  vulnerabilityManager: {
    getActiveVulnerabilities: vi.fn().mockReturnValue([]),
    getVulnerabilitiesBySeverity: vi.fn().mockReturnValue([]),
    generateReport: vi.fn().mockReturnValue({}),
    hasCriticalVulnerabilities: vi.fn().mockReturnValue(false),
    registerVulnerability: vi.fn().mockReturnValue({ id: 'vuln_1' }),
  },
}));

vi.mock('@/lib/repositories/dispute-repository', () => ({
  disputeRepository: {
    listDisputes: vi.fn().mockResolvedValue([]),
    updateDispute: vi.fn().mockResolvedValue({ id: 'dispute_1' }),
  },
}));

vi.mock('@/lib/feature-flags', () => ({
  getFeatureFlags: vi.fn().mockResolvedValue({}),
  setFlagOverrides: vi.fn().mockResolvedValue(undefined),
  clearFlagOverrides: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/ledger/revenue', () => ({
  getRevenueSummary: vi.fn().mockResolvedValue({ total: '0' }),
}));

vi.mock('@/lib/ledger/reconciliation', () => ({
  reconcileAccount: vi.fn().mockResolvedValue({ id: 'recon_1' }),
  getReconciliationByReport: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/ledger/entries', () => ({
  verifyBalances: vi.fn().mockResolvedValue({ balance: '0' }),
}));

vi.mock('@/lib/ip-whitelist', () => ({
  ipWhitelistService: {
    getWhitelistedIPs: vi.fn().mockResolvedValue([]),
    addIPAddress: vi.fn().mockResolvedValue({ id: 'ip_1' }),
    addIPRange: vi.fn().mockResolvedValue({ id: 'range_1' }),
    getViolations: vi.fn().mockResolvedValue([]),
    removeIPEntry: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/db/client', () => ({
  pool: { query: vi.fn().mockResolvedValue({ rows: [{ now: new Date().toISOString() }] }) },
}));

vi.mock('@/lib/db/query-optimizer', () => ({
  queryOptimizer: {
    getStatistics: vi.fn().mockReturnValue({ totalQueries: 0, averageExecutionTime: 0, slowQueryCount: 0, topQueries: [] }),
    getSlowQueries: vi.fn().mockReturnValue([]),
    analyzeQueries: vi.fn().mockReturnValue({}),
    clearMetrics: vi.fn(),
  },
}));

vi.mock('@/lib/db/connection-pool', () => ({
  connectionPoolManager: { getAllPoolStats: vi.fn().mockReturnValue([]) },
}));

// ── Import route handlers after mocks ─────────────────────────────────────
import { GET as auditLogsGET } from '@/app/api/admin/audit-logs/route';
import { GET as auditActionsGET } from '@/app/api/admin/audit-logs/admin-actions/route';
import { GET as auditExportGET } from '@/app/api/admin/audit-logs/export/route';
import { GET as retentionGET, POST as retentionPOST } from '@/app/api/admin/audit-logs/retention-policy/route';
import { GET as vulnerabilitiesGET, POST as vulnerabilitiesPOST } from '@/app/api/admin/vulnerabilities/route';
import { POST as resolveVulnerabilityPOST } from '@/app/api/admin/vulnerabilities/[id]/resolve/route';
import { GET as disputesGET, PATCH as disputesPATCH } from '@/app/api/admin/disputes/route';
import { GET as featureFlagsGET, PUT as featureFlagsPUT, DELETE as featureFlagsDELETE } from '@/app/api/admin/feature-flags/route';
import { GET as revenueGET } from '@/app/api/admin/revenue/route';
import { POST as reconcilePOST, GET as reconcileGET } from '@/app/api/admin/ledger/reconcile/route';
import { GET as ipWhitelistGET, POST as ipWhitelistPOST } from '@/app/api/admin/ip-whitelist/route';
import { POST as ipRangesPOST } from '@/app/api/admin/ip-whitelist/ranges/route';
import { GET as ipViolationsGET } from '@/app/api/admin/ip-whitelist/violations/route';
import { DELETE as ipEntryDELETE } from '@/app/api/admin/ip-whitelist/[entryId]/route';
import { GET as dbHealthGET } from '@/app/api/admin/database/health/route';
import { GET as dbConnectionPoolGET } from '@/app/api/admin/database/connection-pool/route';
import { GET as dbQueryOptGET, POST as dbQueryOptPOST } from '@/app/api/admin/database/query-optimization/route';

// ── Helpers ────────────────────────────────────────────────────────────────
function makeRequest(
  url: string,
  method = 'GET',
  token?: string,
  body?: object,
  extraHeaders: Record<string, string> = {},
): NextRequest {
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
}

const VALID = 'valid-admin-token';
const INVALID = 'wrong-token';

// ── Shared guard behaviour ─────────────────────────────────────────────────
describe('requireAdmin guard', () => {
  describe('rejects unauthenticated requests (no token)', () => {
    const cases: [string, () => Promise<Response>][] = [
      ['GET /admin/audit-logs',             () => auditLogsGET(makeRequest('/api/admin/audit-logs'))],
      ['GET /admin/audit-logs/admin-actions', () => auditActionsGET(makeRequest('/api/admin/audit-logs/admin-actions'))],
      ['GET /admin/audit-logs/export',      () => auditExportGET(makeRequest('/api/admin/audit-logs/export'))],
      ['GET /admin/audit-logs/retention-policy', () => retentionGET(makeRequest('/api/admin/audit-logs/retention-policy'))],
      ['POST /admin/audit-logs/retention-policy', () => retentionPOST(makeRequest('/api/admin/audit-logs/retention-policy', 'POST', undefined, { retentionDays: 90 }))],
      ['GET /admin/vulnerabilities',        () => vulnerabilitiesGET(makeRequest('/api/admin/vulnerabilities'))],
      ['POST /admin/vulnerabilities',       () => vulnerabilitiesPOST(makeRequest('/api/admin/vulnerabilities', 'POST', undefined, { title: 'x', severity: 'high', package: 'p', version: '1.0.0' }))],
      ['GET /admin/disputes',               () => disputesGET(makeRequest('/api/admin/disputes'))],
      ['GET /admin/feature-flags',          () => featureFlagsGET(makeRequest('/api/admin/feature-flags'))],
      ['PUT /admin/feature-flags',          () => featureFlagsPUT(makeRequest('/api/admin/feature-flags', 'PUT', undefined, {}))],
      ['DELETE /admin/feature-flags',       () => featureFlagsDELETE(makeRequest('/api/admin/feature-flags', 'DELETE'))],
      ['GET /admin/revenue',                () => revenueGET(makeRequest('/api/admin/revenue'))],
      ['GET /admin/ledger/reconcile',       () => reconcileGET(makeRequest('/api/admin/ledger/reconcile?reportId=r1'))],
      ['GET /admin/ip-whitelist',           () => ipWhitelistGET(makeRequest('/api/admin/ip-whitelist', 'GET', undefined, undefined, { 'x-user-address': '0x1' }))],
      ['GET /admin/ip-whitelist/violations', () => ipViolationsGET(makeRequest('/api/admin/ip-whitelist/violations', 'GET', undefined, undefined, { 'x-user-address': '0x1' }))],
      ['GET /admin/database/health',        () => dbHealthGET(makeRequest('/api/admin/database/health'))],
      ['GET /admin/database/connection-pool', () => dbConnectionPoolGET(makeRequest('/api/admin/database/connection-pool'))],
      ['GET /admin/database/query-optimization', () => dbQueryOptGET(makeRequest('/api/admin/database/query-optimization'))],
    ];

    it.each(cases)('%s → 403', async (_label, invoke) => {
      const res = await invoke();
      expect(res.status).toBe(403);
    });
  });

  describe('rejects requests with an invalid token', () => {
    const cases: [string, () => Promise<Response>][] = [
      ['GET /admin/audit-logs',    () => auditLogsGET(makeRequest('/api/admin/audit-logs', 'GET', INVALID))],
      ['GET /admin/disputes',      () => disputesGET(makeRequest('/api/admin/disputes', 'GET', INVALID))],
      ['GET /admin/feature-flags', () => featureFlagsGET(makeRequest('/api/admin/feature-flags', 'GET', INVALID))],
      ['GET /admin/revenue',       () => revenueGET(makeRequest('/api/admin/revenue', 'GET', INVALID))],
    ];

    it.each(cases)('%s → 403', async (_label, invoke) => {
      const res = await invoke();
      expect(res.status).toBe(403);
    });
  });

  describe('allows requests with a valid admin token', () => {
    it('GET /admin/audit-logs → 200', async () => {
      const res = await auditLogsGET(makeRequest('/api/admin/audit-logs', 'GET', VALID));
      expect(res.status).toBe(200);
    });

    it('GET /admin/disputes → 200', async () => {
      const res = await disputesGET(makeRequest('/api/admin/disputes', 'GET', VALID));
      expect(res.status).toBe(200);
    });

    it('GET /admin/vulnerabilities → 200', async () => {
      const res = await vulnerabilitiesGET(makeRequest('/api/admin/vulnerabilities', 'GET', VALID));
      expect(res.status).toBe(200);
    });

    it('GET /admin/feature-flags → 200', async () => {
      const res = await featureFlagsGET(makeRequest('/api/admin/feature-flags', 'GET', VALID));
      expect(res.status).toBe(200);
    });

    it('GET /admin/revenue → 200', async () => {
      const res = await revenueGET(makeRequest('/api/admin/revenue', 'GET', VALID));
      expect(res.status).toBe(200);
    });

    it('GET /admin/database/health → 200', async () => {
      const res = await dbHealthGET(makeRequest('/api/admin/database/health', 'GET', VALID));
      expect(res.status).toBe(200);
    });

    it('GET /admin/database/connection-pool → 200', async () => {
      const res = await dbConnectionPoolGET(makeRequest('/api/admin/database/connection-pool', 'GET', VALID));
      expect(res.status).toBe(200);
    });

    it('PATCH /admin/disputes with valid body → 200', async () => {
      const res = await disputesPATCH(
        makeRequest('/api/admin/disputes', 'PATCH', VALID, { disputeId: 'dispute_1', update: { status: 'resolved' } }),
      );
      expect(res.status).toBe(200);
    });
  });

  describe('403 response body shape', () => {
    it('returns JSON with error field', async () => {
      const res = await auditLogsGET(makeRequest('/api/admin/audit-logs'));
      const body = await res.json();
      expect(body).toHaveProperty('error');
      // ErrorType.FORBIDDEN maps to "forbidden"
      expect(body.error).toMatch(/forbidden/i);
    });
  });
});

// ── Misconfigured deployment (no token configured) ─────────────────────────
describe('requireAdmin guard — token not configured', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 500 when API_KEY_ADMIN_TOKEN is missing', async () => {
    vi.doMock('@/lib/api-keys/service', () => ({
      hasApiKeyAdminToken: () => false,
      isValidAdminToken: () => false,
    }));
    // Re-import after remocking
    const { requireAdmin } = await import('@/lib/auth/require-admin');
    const req = new NextRequest('http://localhost/api/admin/audit-logs');
    const result = requireAdmin(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(500);
  });
});
