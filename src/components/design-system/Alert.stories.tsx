import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Design System/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
    title: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This is an informational alert.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    children: 'Your action was completed successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'Please be careful with this action.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    children: 'Something went wrong. Please try again.',
  },
};

export const NoTitle: Story = {
  args: {
    variant: 'info',
    children: 'This is an alert without a title.',
  },
};

export const Interactive: Story = {
  args: {
    variant: 'success',
    title: 'Alert Rendered',
    children: 'This is an interactive alert demonstration.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test alert title is rendered
    const title = canvas.getByText(/alert rendered/i);
    await expect(title).toBeInTheDocument();
    
    // Test alert body/content is rendered
    const content = canvas.getByText(/this is an interactive alert/i);
    await expect(content).toBeInTheDocument();
  },
};

export const VariantDisplay: Story = {
  args: {
    variant: 'error',
    title: 'Error Alert',
    children: 'An error has occurred. Please review and try again.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test all parts render correctly
    const title = canvas.getByText(/error alert/i);
    const message = canvas.getByText(/an error has occurred/i);
    
    await expect(title).toBeInTheDocument();
    await expect(message).toBeInTheDocument();
  },
};
