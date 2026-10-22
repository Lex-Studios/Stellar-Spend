import { describe, it, expect, vi } from 'vitest';

const xlsxFactory = vi.hoisted(() =>
  vi.fn(() => ({
    utils: {
      json_to_sheet: vi.fn(() => ({})),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  })),
);

vi.mock('xlsx', () => xlsxFactory());

import { exportXLSX } from './export';

describe('export lazy loading (#1276)', () => {
  it('does not load xlsx when the export module is imported', () => {
    expect(xlsxFactory).not.toHaveBeenCalled();
  });

  it('loads xlsx only when an XLSX export is requested', async () => {
    await exportXLSX([]);
    expect(xlsxFactory).toHaveBeenCalledTimes(1);
  });
});
