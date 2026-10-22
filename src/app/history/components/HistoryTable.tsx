'use client';

import { memo, useCallback, useRef, useState } from 'react';
import type { Transaction } from '@/lib/transaction-storage';
import type { SortDir, SortField } from '../filters';
import { HistoryRow } from './HistoryRow';
import { VirtualizedList } from './VirtualizedList';

const ROW_HEIGHT = 52;
const VIRTUALIZED_VIEWPORT_HEIGHT = 560;

interface HistoryTableProps {
  rows: Transaction[];
  sortField: SortField;
  sortDir: SortDir;
  onToggleSort: (field: SortField) => void;
  onSaveNote: (id: string, note: string) => void;
  onFileClaim: (tx: Transaction) => void;
}

const headerClass =
  'px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap';

interface HistoryTableRowProps {
  tx: Transaction;
  index: number;
  isFocused: boolean;
  registerRowRef: (el: HTMLTableRowElement | null, index: number) => void;
  setRovingIndex: (index: number) => void;
  handleRowKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>, index: number) => void;
  onSaveNote: (id: string, note: string) => void;
  onFileClaim: (tx: Transaction) => void;
}

const HistoryTableRow = memo(function HistoryTableRow({
  tx,
  index,
  isFocused,
  registerRowRef,
  setRovingIndex,
  handleRowKeyDown,
  onSaveNote,
  onFileClaim,
}: HistoryTableRowProps) {
  const rowRef = useCallback(
    (el: HTMLTableRowElement | null) => registerRowRef(el, index),
    [index, registerRowRef],
  );
  const onRowFocus = useCallback(() => setRovingIndex(index), [index, setRovingIndex]);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>) => handleRowKeyDown(e, index),
    [handleRowKeyDown, index],
  );

  return (
    <HistoryRow
      tx={tx}
      index={index}
      isFocused={isFocused}
      rowRef={rowRef}
      onRowFocus={onRowFocus}
      onRowKeyDown={onKeyDown}
      onSaveNote={onSaveNote}
      onFileClaim={onFileClaim}
    />
  );
});

/**
 * Presentational, sortable transaction history table.
 *
 * Rows use the roving tabindex pattern (see docs/archive/ACCESSIBILITY.md): only the
 * active row is in the natural Tab sequence, ArrowUp/ArrowDown move that
 * focus between rows, and Tab moves into/out of the focused row's own
 * controls (links, note editor, claim button) as normal.
 */
export function HistoryTable({
  rows,
  sortField,
  sortDir,
  onToggleSort,
  onSaveNote,
  onFileClaim,
}: HistoryTableProps) {
  const [rovingIndex, setRovingIndex] = useState(0);
  const pendingFocusIndex = useRef<number | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const registerRowRef = useCallback((el: HTMLTableRowElement | null, index: number) => {
    if (el) {
      rowRefs.current.set(index, el);
      if (pendingFocusIndex.current === index) {
        pendingFocusIndex.current = null;
        el.focus();
      }
    } else {
      rowRefs.current.delete(index);
    }
  }, []);

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>, index: number) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(index + 1, rows.length - 1);
        setRovingIndex(next);
        const nextRow = rowRefs.current.get(next);
        if (nextRow) {
          nextRow.focus();
        } else {
          pendingFocusIndex.current = next;
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = next * ROW_HEIGHT;
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(index - 1, 0);
        setRovingIndex(prev);
        const previousRow = rowRefs.current.get(prev);
        if (previousRow) {
          previousRow.focus();
        } else {
          pendingFocusIndex.current = prev;
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = prev * ROW_HEIGHT;
          }
        }
      }
    },
    [rows.length],
  );

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      scope="col"
      className={`${headerClass} cursor-pointer select-none`}
      onClick={() => onToggleSort(field)}
      data-testid={`sort-${field}`}
      aria-sort={sortField === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {sortField !== field ? (
        <span className="ml-1 opacity-30">↕</span>
      ) : (
        <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  );

  return (
    <div
      ref={scrollContainerRef}
      className={`border border-[#333333] bg-[#111111] overflow-x-auto mt-4 ${
        rows.length > 100 ? 'max-h-[560px] overflow-y-auto' : ''
      }`}
    >
      <table className="w-full min-w-[800px] border-collapse" aria-label="Transaction history">
        <thead>
          <tr className="bg-[#c9a962]">
            <SortableHeader field="timestamp" label="DATE" />
            <th scope="col" className={headerClass}>
              TX HASH
            </th>
            <SortableHeader field="amount" label="AMOUNT" />
            <th scope="col" className={headerClass}>
              CURRENCY
            </th>
            <th scope="col" className={headerClass}>
              BANK
            </th>
            <SortableHeader field="status" label="STATUS" />
            <th scope="col" className={headerClass}>
              NOTE
            </th>
            <th scope="col" className={headerClass}>
              INSURANCE
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx, i) => (
            <HistoryTableRow
              key={tx.id}
              tx={tx}
              index={i}
              isFocused={i === rovingIndex}
              registerRowRef={registerRowRef}
              setRovingIndex={setRovingIndex}
              handleRowKeyDown={handleRowKeyDown}
              onSaveNote={onSaveNote}
              onFileClaim={onFileClaim}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
