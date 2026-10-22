import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, userEvent } from '@storybook/test';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import React from 'react';

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'This is a default card.',
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: 'This is an elevated card with shadow.',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'This is an outlined card.',
  },
};

export const WithHeaderAndFooter: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <h2 className="text-xl font-bold">Card Title</h2>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card. It can contain any elements.</p>
      </CardContent>
      <CardFooter>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            Submit
          </button>
        </div>
      </CardFooter>
    </Card>
  ),
};

export const Interactive: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <h3 className="text-lg font-semibold">User Information</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Name:</strong> John Doe</p>
          <p><strong>Email:</strong> john@example.com</p>
          <p><strong>Status:</strong> Active</p>
        </div>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test card header
    const header = canvas.getByText(/user information/i);
    await expect(header).toBeInTheDocument();
    
    // Test card content
    const name = canvas.getByText(/john doe/i);
    const email = canvas.getByText(/john@example.com/i);
    const status = canvas.getByText(/active/i);
    
    await expect(name).toBeInTheDocument();
    await expect(email).toBeInTheDocument();
    await expect(status).toBeInTheDocument();
  },
};

export const InteractiveWithButtons: Story = {
  render: (args) => (
    <Card {...args} variant="elevated">
      <CardHeader>
        <h3 className="text-lg font-semibold">Confirmation</h3>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Are you sure you want to proceed?</p>
      </CardContent>
      <CardFooter>
        <div className="flex justify-end gap-2 w-full">
          <button className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
            Cancel
          </button>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            Confirm
          </button>
        </div>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test all card parts
    const header = canvas.getByText(/confirmation/i);
    const content = canvas.getByText(/are you sure/i);
    const cancelBtn = canvas.getByRole('button', { name: /cancel/i });
    const confirmBtn = canvas.getByRole('button', { name: /confirm/i });
    
    await expect(header).toBeInTheDocument();
    await expect(content).toBeInTheDocument();
    await expect(cancelBtn).toBeInTheDocument();
    await expect(confirmBtn).toBeInTheDocument();
    
    // Test button interactions
    await userEvent.click(confirmBtn);
    await expect(confirmBtn).toBeInTheDocument();
  },
};
