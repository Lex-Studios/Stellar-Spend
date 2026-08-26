export interface WalletModalErrorProps {
  error: string;
  onDismiss: () => void;
}

export function WalletModalError({ error, onDismiss }: WalletModalErrorProps) {
  return (
    <div className="mx-4 mb-4 px-4 py-3 border border-red-500/30 bg-red-500/10 flex items-start gap-3">
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        className="text-red-400 shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.75" fill="currentColor" />
      </svg>
      <div className="flex-1">
        <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="text-red-400/60 hover:text-red-400 transition-colors shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
