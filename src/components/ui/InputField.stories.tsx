import type { Meta, StoryObj } from "@storybook/react";
import { InputField } from "./InputField";
import React from "react";

const meta: Meta<typeof InputField> = {
  title: "UI Primitives/InputField",
  component: InputField,
  tags: ["autodocs"],
  argTypes: {
    onChange: { action: "changed" },
    suffix: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof InputField>;

export const Default: Story = {
  args: {
    label: "Email Address",
    value: "",
    placeholder: "Enter your email",
  },
};

export const WithValue: Story = {
  args: {
    label: "Username",
    value: "john_doe",
  },
};

export const WithSuffix: Story = {
  args: {
    label: "Amount",
    value: "100",
    suffix: "USD",
  },
};

export const LoadingSuffix: Story = {
  args: {
    label: "Amount",
    value: "100",
    isLoadingSuffix: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Field",
    value: "Cannot edit this",
    disabled: true,
  },
};

export const NumberInput: Story = {
  args: {
    label: "Quantity",
    value: "5",
    type: "number",
    min: "0",
    step: "1",
  },
};
