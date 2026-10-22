import type { DAL } from '@/lib/db/dal';

/**
 * Ports (interfaces) that services depend on. Concrete clients are wired in
 * the DI composition root (`@/lib/di/registry`), never imported by services.
 */

/** Minimal SQL client surface used by services (satisfied by `pg.Pool`). */
export interface SqlClient {
  query<R = any>(text: string, params?: unknown[]): Promise<{ rows: R[] }>;
}

/** Transaction data access used by TransactionService. */
export type TransactionStore = Pick<DAL, 'getById' | 'getByPayoutOrderId' | 'update'>;
