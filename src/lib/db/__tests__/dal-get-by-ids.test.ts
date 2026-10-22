import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryMock = vi.hoisted(() => vi.fn());

vi.mock('../client', () => ({
  pool: { query: queryMock },
}));

import { dal } from '../dal';

const row = (id: string) => ({
  id,
  timestamp: 1,
  finalized_at: null,
  user_address: 'G1',
  amount: '1',
  currency: 'USD',
  beneficiary_institution: 'bank',
  beneficiary_account_identifier: '0',
  beneficiary_account_name: 'n',
  beneficiary_currency: 'NGN',
  status: 'pending',
});

describe('dal.getByIds', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('fetches many ids with a single query', async () => {
    queryMock.mockResolvedValueOnce({ rows: [row('a'), row('b'), row('c')], rowCount: 3 });

    const txs = await dal.getByIds(['a', 'b', 'c']);

    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock.mock.calls[0][1]).toEqual([['a', 'b', 'c']]);
    expect(txs.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not query when given no ids', async () => {
    expect(await dal.getByIds([])).toEqual([]);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('wraps query failures in DatabaseError', async () => {
    queryMock.mockRejectedValueOnce(new Error('boom'));
    await expect(dal.getByIds(['a'])).rejects.toMatchObject({ name: 'DatabaseError' });
  });
});
