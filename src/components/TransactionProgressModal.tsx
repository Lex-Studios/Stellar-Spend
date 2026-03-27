"use client";

import React, { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { OfframpStep } from "@/types/stellaramp";

type TransactionProgressModalProps = {
  step: OfframpStep;
  errorMessage?: string;
  onClose: () => void;
};

const STEP_ORDER: OfframpStep[] = [
  "initiating",
  "awaiting-signature",
  "submitting",
  "processing",
  "settling",
  "success",
];

const STEP_LABELS: Record<OfframpStep, string> = {
  idle: "Idle",
  initiating: "Initiating Transaction",
  "awaiting-signature": "Awaiting Wallet Signature",
  submitting: "Submitting to Network",
  processing: "Processing On-Chain",
  settling: "Settling Fiat Payout",
  success: "Transaction Complete",
  error: "Transaction Failed",
};
export function TransactionProgressModal({
  step,
  errorMessage,
  onClose,
}: TransactionProgressModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (step !== "idle") {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [step]);

  if (!isVisible || step === "idle") return null;

  const isTerminal = step === "success" || step === "error";
  const showCloseButton = isTerminal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => isTerminal && onClose()}
      />

      {/* Modal Container */}
      <div 
        className={cn(
          "relative w-full max-w-md bg-[#0a0a0a] border border-[#333333] transition-all duration-500 overflow-hidden",
          "shadow-[0_0_50px_rgba(201,169,98,0.15)]"
        )}
      >
        {/* Racing Border Animation (Only during active steps) */}
        {!isTerminal && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="racing-border" />
          </div>
        )}

        <div className="relative p-8 flex flex-col items-center">
          {/* Status Icon */}
          <div className="mb-8 relative h-20 w-20 flex items-center justify-center">
             {step === "success" ? (
               <div className="h-16 w-16 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center animate-[scale-in_0.5s_ease-out]">
                 <CheckIcon className="w-8 h-8 text-green-500" />
               </div>
             ) : step === "error" ? (
               <div className="h-16 w-16 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center animate-[shake_0.5s_ease-in-out]">
                 <XIcon className="w-8 h-8 text-red-500" />
               </div>
             ) : (
               <div className="h-16 w-16 border-2 border-[#c9a962]/30 border-t-[#c9a962] rounded-full animate-spin" />
             )}
          </div>

          <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-2">
            {step === "error" ? "ERROR" : step === "success" ? "SUCCESS" : "IN PROGRESS"}
          </h2>
          
          <p className="text-xs text-[#777777] tracking-[0.2em] uppercase mb-8 text-center">
            {STEP_LABELS[step]}
          </p>

          {/* Steps List */}
          {!isTerminal && (
            <div className="w-full flex flex-col gap-4">
              {STEP_ORDER.filter(s => s !== "success").map((s, idx) => {
                const stepIdx = STEP_ORDER.indexOf(step);
                const currentIdx = idx;
                const isCompleted = stepIdx > currentIdx;
                const isActive = stepIdx === currentIdx;

                return (
                  <div key={s} className="flex items-center gap-4 transition-opacity duration-300">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all duration-300",
                      isCompleted ? "bg-green-500" : isActive ? "bg-[#c9a962] scale-125 shadow-[0_0_8px_var(--accent)]" : "bg-[#333333]"
                    )} />
                    <span className={cn(
                      "text-[10px] tracking-[0.1em] uppercase",
                      isCompleted ? "text-green-500/60" : isActive ? "text-white font-bold" : "text-[#444444]"
                    )}>
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {step === "error" && errorMessage && (
            <div className="w-full mt-4 p-4 bg-red-500/10 border border-red-500/20">
              <p className="text-[10px] text-red-400 font-mono break-words leading-relaxed text-center">
                {errorMessage}
              </p>
            </div>
          )}

          {step === "success" && (
            <p className="text-sm text-[#aaaaaa] text-center mb-6 leading-relaxed">
              Funds have been sent to your bank account. <br />
              Thank you for using Stellar-Spend.
            </p>
          )}

          {showCloseButton && (
            <button
              onClick={onClose}
              className="mt-4 w-full py-3 bg-[#c9a962] text-black text-xs font-bold tracking-[0.2em] hover:bg-[#d4b982] transition-colors"
            >
              DISMISS
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        .racing-border {
          position: absolute;
          inset: -1px;
          background: conic-gradient(from var(--angle), transparent 70%, #c9a962 100%);
          animation: rotate-border 3s linear infinite;
        }

        @keyframes rotate-border {
          to { --angle: 360deg; }
        }

        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

// Helper Components for clean SVG icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
