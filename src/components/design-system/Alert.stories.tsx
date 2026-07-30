import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "./Alert";

const meta: Meta<typeof Alert> = {
  title: "Design System/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "success", "warning", "error"],
    },
    title: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    variant: "info",
    title: "Information",
    children: "This is an informational alert.",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    title: "Success!",
    children: "Your action was completed successfully.",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Warning",
    children: "Please be careful with this action.",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "Error",
    children: "Something went wrong. Please try again.",
  },
};

export const NoTitle: Story = {
  args: {
    variant: "info",
    children: "This is an alert without a title.",
  },
};
