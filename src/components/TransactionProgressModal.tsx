"use client";

import React from 'react';
import { cn } from "@/lib/cn";
import { OfframpStep } from "@/types/stellaramp";

type TransactionProgressModalProps = {
  step: OfframpStep;
  errorMessage?: string;
  onClose: () => void;
};

const STEPS: { key: OfframpStep; label: string }[] = [
  { key: "initiating", label: "Initiating Transaction" },
  { key: "awaiting-signature", label: "Awaiting Signature" },
  { key: "submitting", label: "Submitting to Network" },
  { key: "processing", label: "Processing Payment" },
  { key: "settling", label: "Settling Transaction" },
];

export function TransactionProgressModal({
  step,
  errorMessage,
  onClose,
}: TransactionProgressModalProps) {
  if (step === "idle") return null;

  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const isTerminal = step === "success" || step === "error";

  const handleBackdropClick = () => {
    if (isTerminal) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all duration-500"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "relative w-full max-w-md racing-border-wrapper rounded-2xl overflow-hidden shadow-2xl",
          step === "success" && "scale-105",
          step === "error" && "border-red-500/50"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="racing-border-content p-8 rounded-[14px]">
          {step === "success" ? (
            <div className="flex flex-col items-center text-center animate-scale-in">
              <div className="w-20 h-20 bg-[var(--accent)] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(201,169,98,0.4)]">
                <CheckIcon className="w-12 h-12 text-black stroke-[3px]" />
              </div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Transaction Successful</h2>
              <p className="text-[#777777] mb-8 leading-relaxed">
                Your payout has been processed and is on its way to your account.
              </p>
              <button
                onClick={onClose}
                className="w-full py-4 bg-[var(--accent)] text-black font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] tracking-widest uppercase text-sm"
              >
                Done
              </button>
            </div>
          ) : step === "error" ? (
            <div className="flex flex-col items-center text-center animate-scale-in">
              <div className="w-20 h-20 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mb-6">
                <XIcon className="w-10 h-10 text-red-500 stroke-[3px]" />
              </div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Transaction Failed</h2>
              <div className="max-w-full overflow-hidden break-words mb-8 px-2">
                <p className="text-red-400/80 leading-relaxed text-sm">
                  {errorMessage || "An unexpected error occurred during the transaction flow. Please try again or contact support if the issue persists."}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-4 bg-[#222222] text-white border border-[#333333] font-bold rounded-xl hover:bg-[#282828] transition-all active:scale-[0.98] tracking-widest uppercase text-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
               <div className="mb-2">
                  <h3 className="text-lg font-bold tracking-tight mb-1">Transaction in Progress</h3>
                  <p className="text-xs text-[#777777] uppercase tracking-[0.2em]">Please do not close this window</p>
               </div>
              
              <div className="flex flex-col gap-6">
                {STEPS.map((s, index) => {
                  const isPast = index < currentIndex;
                  const isCurrent = index === currentIndex;
                  const isFuture = index > currentIndex;

                  return (
                    <div
                      key={s.key}
                      className={cn(
                        "flex items-center gap-4 transition-all duration-300",
                        isFuture && "opacity-30 blur-[1px]",
                        isCurrent && "font-bold text-white"
                      )}
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        {isPast ? (
                          <div className="w-6 h-6 bg-[var(--accent)] rounded-full flex items-center justify-center animate-scale-in">
                            <CheckIcon className="w-3.5 h-3.5 text-black stroke-[3px]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="relative">
                            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin-slow" />
                          </div>
                        ) : (
                          <div className="w-2 h-2 bg-[#333333] rounded-full" />
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={cn(
                           "text-sm tracking-wide transition-colors",
                           isCurrent ? "text-white" : isPast ? "text-[rgba(201,169,98,0.8)]" : "text-[#555555]"
                        )}>
                          {s.label}
                        </span>
                        {isCurrent && (
                           <div className="flex gap-1 mt-1">
                              <div className="w-1 h-1 bg-[var(--accent)] rounded-full dot-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1 h-1 bg-[var(--accent)] rounded-full dot-bounce" style={{ animationDelay: '200ms' }} />
                              <div className="w-1 h-1 bg-[var(--accent)] rounded-full dot-bounce" style={{ animationDelay: '400ms' }} />
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
