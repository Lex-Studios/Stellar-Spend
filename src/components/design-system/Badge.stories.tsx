import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Design System/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "error", "info"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: "default",
    children: "Default Badge",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Success Badge",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Warning Badge",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    children: "Error Badge",
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    children: "Info Badge",
  },
};
