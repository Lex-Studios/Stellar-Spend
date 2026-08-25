import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputField } from '../InputField';
import { SelectField } from '../SelectField';
import { ResolvedField } from '../ResolvedField';
import { PayoutBox } from '../PayoutBox';
import { FeeMethodSelector } from '../FeeMethodSelector';
import { formatPayout, getCurrencySymbol, buildProviderQuotes } from '../types';

describe('FormCard Subcomponents', () => {
  describe('InputField', () => {
    it('renders input with label and handles change', () => {
      const onChange = vi.fn();
      render(<InputField label="Amount" id="amount" value="100" onChange={onChange} />);

      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      const input = screen.getByRole('spinbutton', { hidden: true }) || screen.getByDisplayValue('100');
      fireEvent.change(input, { target: { value: '200' } });
      expect(onChange).toHaveBeenCalledWith('200');
    });

    it('shows error state when touched with error', () => {
      render(
        <InputField
          label="Amount"
          id="amount"
          value="invalid"
          onChange={vi.fn()}
          error="Invalid amount"
          touched={true}
        />,
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Invalid amount');
    });
  });

  describe('SelectField', () => {
    it('renders select with options and handles change', () => {
      const onChange = vi.fn();
      const options = [
        { value: 'NGN', label: 'Nigerian Naira' },
        { value: 'KES', label: 'Kenyan Shilling' },
      ];

      render(
        <SelectField
          label="Currency"
          id="currency"
          value="NGN"
          options={options}
          onChange={onChange}
        />,
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'KES' } });
      expect(onChange).toHaveBeenCalledWith('KES');
    });
  });

  describe('ResolvedField', () => {
    it('displays resolved value with success icon', () => {
      render(<ResolvedField label="Account Name" value="Jane Doe" />);
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('displays loading indicator when resolving', () => {
      render(<ResolvedField label="Account Name" value="" loading={true} />);
      expect(screen.getByText('Resolving...')).toBeInTheDocument();
    });
  });

  describe('PayoutBox', () => {
    it('renders payout formatted with rate', () => {
      const mockQuote = {
        rate: 1500,
        destinationAmount: '150000',
        bridgeFee: '0.5',
        payoutFee: '0.0',
        totalFee: '0.5',
        estimatedTime: 300,
      };

      render(<PayoutBox quote={mockQuote} currency="NGN" />);
      expect(screen.getByText(/estimated payout/i)).toBeInTheDocument();
      expect(screen.getByText(/150,000/)).toBeInTheDocument();
    });
  });

  describe('FeeMethodSelector', () => {
    it('allows toggling between USDC and XLM', () => {
      const onChange = vi.fn();
      render(
        <FeeMethodSelector
          feeMethod="USDC"
          gasFees={{ usdcFee: '0.50 USDC', xlmFee: '1.20 XLM' }}
          isLoading={false}
          onChange={onChange}
        />,
      );

      const xlmBtn = screen.getByText('XLM');
      fireEvent.click(xlmBtn);
      expect(onChange).toHaveBeenCalledWith('XLM');
    });
  });

  describe('helpers', () => {
    it('formats payouts correctly', () => {
      expect(formatPayout('1000', 'NGN')).toContain('1,000');
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('builds provider quotes array', () => {
      const quotes = buildProviderQuotes(
        {
          rate: 1500,
          destinationAmount: '150000',
          bridgeFee: '0.5',
          payoutFee: '0.0',
          totalFee: '0.5',
          estimatedTime: 300,
        },
        'NGN',
      );
      expect(quotes.length).toBe(3);
    });
  });
});
