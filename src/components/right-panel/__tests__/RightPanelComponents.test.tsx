import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroPanel } from '../HeroPanel';
import { BreakdownRow } from '../BreakdownRow';
import { formatFiat, formatRate, formatNetworkFee, getCurrencySymbol } from '../types';

describe('RightPanel Subcomponents', () => {
  describe('HeroPanel', () => {
    it('prompts user to connect wallet when disconnected', () => {
      const onConnect = vi.fn();
      render(
        <HeroPanel
          isConnected={false}
          isConnecting={false}
          amount=""
          quote={null}
          isLoadingQuote={false}
          currency="NGN"
          onConnect={onConnect}
          liveRate={null}
          flash={false}
        />,
      );

      expect(screen.getByText('WALLET REQUIRED')).toBeInTheDocument();
      fireEvent.click(screen.getByText('CONNECT WALLET'));
      expect(onConnect).toHaveBeenCalled();
    });

    it('shows estimated payout when connected and has quote', () => {
      render(
        <HeroPanel
          isConnected={true}
          isConnecting={false}
          amount="100"
          quote={{ destinationAmount: '150000', rate: 1500, currency: 'NGN' }}
          isLoadingQuote={false}
          currency="NGN"
          onConnect={vi.fn()}
          liveRate={1500}
          flash={false}
        />,
      );

      expect(screen.getByText('ESTIMATED PAYOUT')).toBeInTheDocument();
      expect(screen.getByText(/150,000/)).toBeInTheDocument();
    });
  });

  describe('BreakdownRow', () => {
    it('renders label and value', () => {
      render(<BreakdownRow label="Network Fee" value="2.50 USDC" />);
      expect(screen.getByText('Network Fee')).toBeInTheDocument();
      expect(screen.getByText('2.50 USDC')).toBeInTheDocument();
    });
  });

  describe('helpers', () => {
    it('formats fiat and rate accurately', () => {
      expect(formatFiat(5000, 'NGN')).toContain('5,000');
      expect(formatRate(1500, 'NGN')).toContain('1,500');
      expect(formatNetworkFee(null)).toBe('—');
      expect(getCurrencySymbol('EUR')).toBe('€');
    });
  });
});
