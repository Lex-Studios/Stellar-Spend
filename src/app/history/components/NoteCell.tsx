'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/transaction-storage';
import { sanitizeMemo } from '@/lib/sanitize';

interface NoteCellProps {
  tx: Transaction;
  onSave: (id: string, note: string) => void;
}

/** Inline-editable note cell for a transaction row. */
export function NoteCell({ tx, onSave }: NoteCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(tx.note ?? '');

  const commit = () => {
    setEditing(false);
    // Sanitize before passing up to the parent's saveNote handler so that
    // XSS payloads are neutralised at every save point, not just at storage.
    onSave(tx.id, sanitizeMemo(value));
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          maxLength={500}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="flex-1 bg-[#0a0a0a] border border-[#c9a962] px-2 py-1 text-xs text-white focus:outline-none"
          aria-label="Edit note"
        />
        <button
          onClick={commit}
          className="text-[#c9a962] hover:text-white text-[10px] px-1"
          aria-label="Save note"
        >
          ✓
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-[#777777] hover:text-white text-[10px] px-1"
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>
    );
  }

  // Sanitize the stored note before using it in title / aria-label so that
  // data persisted before this fix is also safe to display.
  const safeNote = tx.note ? sanitizeMemo(tx.note) : null;

  return (
    <button
      onClick={() => {
        setValue(tx.note ?? '');
        setEditing(true);
      }}
      className="text-left text-[#777777] hover:text-[#c9a962] transition-colors duration-150 truncate max-w-[180px] block"
      title={safeNote || 'Add note'}
      aria-label={safeNote ? `Edit note: ${safeNote}` : 'Add note'}
    >
      {safeNote || <span className="text-[#444444] italic">+ add note</span>}
    </button>
  );
}
