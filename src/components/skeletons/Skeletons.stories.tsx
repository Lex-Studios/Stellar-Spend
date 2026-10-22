import type { Meta, StoryObj } from '@storybook/react';
import {
  AnalyticsDashboardSkeleton,
  BankAccountInputSkeleton,
  FormCardSkeleton,
  QuoteDisplaySkeleton,
  TransactionTableSkeleton,
  WalletConnectionSkeleton,
} from './SkeletonLayouts';

const meta = {
  title: 'Design System/Skeletons',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormCard: Story = {
  render: () => (
    <div className="max-w-md">
      <FormCardSkeleton />
    </div>
  ),
};

export const Transactions: Story = {
  render: () => <TransactionTableSkeleton rows={3} />,
};

export const SingleTransaction: Story = {
  render: () => <TransactionTableSkeleton rows={1} />,
};

export const ManyTransactions: Story = {
  render: () => <TransactionTableSkeleton rows={8} />,
};

export const Quote: Story = {
  render: () => (
    <div className="max-w-md">
      <QuoteDisplaySkeleton />
    </div>
  ),
};

export const Wallet: Story = {
  render: () => <WalletConnectionSkeleton />,
};

export const Analytics: Story = {
  render: () => <AnalyticsDashboardSkeleton />,
};

export const BankAccount: Story = {
  render: () => (
    <div className="max-w-md">
      <BankAccountInputSkeleton fields={1} />
    </div>
  ),
};

export const BankAccountWithTwoFields: Story = {
  render: () => (
    <div className="max-w-md">
      <BankAccountInputSkeleton fields={2} />
    </div>
  ),
};
