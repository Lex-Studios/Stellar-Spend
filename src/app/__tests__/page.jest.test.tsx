/**
 * Smoke test — verifies the Home page renders its top-level structure.
 * Uses Jest + @testing-library/react.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Stub every component that pulls in heavy deps (Stellar SDK, Allbridge, etc.)
jest.mock('@/components/FormCard', () => ({
  __esModule: true,
  default: () => <div data-testid="FormCard" />,
}));
jest.mock('@/components/RightPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="RightPanel" />,
}));
jest.mock('@/components/RecentOfframpsTable', () => ({
  __esModule: true,
  default: () => <div data-testid="RecentOfframpsTable" />,
}));
jest.mock('@/components/ProgressSteps', () => ({
  __esModule: true,
  default: () => <div data-testid="ProgressSteps" />,
}));
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="Header" />,
}));
jest.mock('@/components/TransactionProgressModal', () => ({
  TransactionProgressModal: () => <div data-testid="TransactionProgressModal" />,
}));
jest.mock('@/hooks/useStellarWallet', () => ({
  useStellarWallet: () => ({
    wallet: null,
    isConnected: false,
    isConnecting: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
  }),
}));
jest.mock('@/hooks/usePollBridgeStatus', () => ({
  usePollBridgeStatus: () => ({ pollBridgeStatus: jest.fn() }),
}));
jest.mock('@/hooks/usePollPayoutStatus', () => ({
  usePollPayoutStatus: () => ({ pollPayoutStatus: jest.fn() }),
}));
jest.mock('@/lib/transaction-storage', () => ({
  TransactionStorage: {
    generateId: jest.fn(() => 'test-id'),
    save: jest.fn(),
    update: jest.fn(),
  },
}));

import Home from '../page';

describe('Home page — smoke test', () => {
  it('renders without crashing', () => {
    const { container } = render(<Home />);
    expect(container.querySelector('main')).toBeInTheDocument();
  });

  it('renders the main layout with min-h-screen', () => {
    const { container } = render(<Home />);
    const main = container.querySelector('main');
    expect(main?.className).toContain('min-h-screen');
  });

  it('renders all major child components', () => {
    render(<Home />);
    expect(screen.getByTestId('Header')).toBeInTheDocument();
    expect(screen.getByTestId('FormCard')).toBeInTheDocument();
    expect(screen.getByTestId('RightPanel')).toBeInTheDocument();
    expect(screen.getByTestId('RecentOfframpsTable')).toBeInTheDocument();
    expect(screen.getByTestId('ProgressSteps')).toBeInTheDocument();
  });
});
