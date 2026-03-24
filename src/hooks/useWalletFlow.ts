'use client';

import { useMemo, useState } from 'react';
import { buildProgressSteps, STATE_VARIANTS } from '@/data/stellaramp';
import type { WalletFlowState } from '@/types/stellaramp';

export function useWalletFlow(initialState: WalletFlowState) {
  const [state, setState] = useState<WalletFlowState>(initialState);
  const variant = STATE_VARIANTS[state];
  const steps = useMemo(() => buildProgressSteps(variant), [variant]);
  return { state, setState, variant, steps };
}
