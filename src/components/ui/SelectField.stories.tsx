import type { Meta, StoryObj } from "@storybook/react";
import { SelectField } from "./SelectField";

const meta: Meta<typeof SelectField> = {
  title: "UI Primitives/SelectField",
  component: SelectField,
  tags: ["autodocs"],
  argTypes: {
    onChange: { action: "changed" },
  },
};

export default meta;
type Story = StoryObj<typeof SelectField>;

const options = [
  { value: "usd", label: "US Dollar" },
  { value: "eur", label: "Euro" },
  { value: "gbp", label: "British Pound" },
];

export const Default: Story = {
  args: {
    label: "Currency",
    value: "",
    options,
    placeholder: "Select currency…",
  },
};

export const Selected: Story = {
  args: {
    label: "Currency",
    value: "usd",
    options,
  },
};

export const Loading: Story = {
  args: {
    label: "Currency",
    value: "",
    options: [],
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Currency",
    value: "usd",
    options,
    disabled: true,
  },
};

export const Empty: Story = {
  args: {
    label: "No Options",
    value: "",
    options: [],
  },
};
