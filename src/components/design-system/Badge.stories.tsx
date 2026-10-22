import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Badge',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Badge',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning Badge',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Error Badge',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info Badge',
  },
};

export const Interactive: Story = {
  args: {
    variant: 'success',
    children: 'Badge rendered',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText(/badge rendered/i);
    
    // Test badge is rendered
    await expect(badge).toBeInTheDocument();
    
    // Test badge has correct content
    await expect(badge).toHaveTextContent('Badge rendered');
  },
};

export const VariantStates: Story = {
  args: {
    variant: 'warning',
    children: 'Status: Pending',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText(/status: pending/i);
    
    // Test badge displays variant state
    await expect(badge).toBeInTheDocument();
    await expect(badge).toHaveTextContent('Status: Pending');
  },
};
