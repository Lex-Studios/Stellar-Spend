import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'UI Primitives/Label',
  component: Label,
  tags: ['autodocs'],
  args: {
    children: 'Amount',
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {};

export const ForInput: Story = {
  args: {
    htmlFor: 'amount-input',
    children: 'Currency',
  },
};

export const LongText: Story = {
  args: {
    children: 'Beneficiary account identifier',
  },
};

export const Interactive: Story = {
  args: {
    htmlFor: 'test-input',
    children: 'Email Address',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText(/email address/i);
    
    // Test label is rendered
    await expect(label).toBeInTheDocument();
    
    // Test label has htmlFor attribute
    await expect(label).toHaveAttribute('for', 'test-input');
  },
};

export const AccessibilityTest: Story = {
  args: {
    htmlFor: 'recipient-id',
    children: 'Recipient Bank ID',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText(/recipient bank id/i);
    
    // Verify label structure for accessibility
    await expect(label).toBeInTheDocument();
    await expect(label.tagName).toBe('LABEL');
    await expect(label).toHaveAttribute('for', 'recipient-id');
  },
};
