import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/Header";

const baseProps = {
  subtitle: "Test subtitle",
  isConnected: false,
  isConnecting: false,
  onConnect: vi.fn(),
  onDisconnect: vi.fn(),
};

describe("Header — wallet button", () => {
  it("renders CONNECT WALLET button when disconnected", () => {
    render(<Header {...baseProps} />);
    expect(screen.getByRole("button")).toHaveTextContent("CONNECT WALLET");
  });

  it("renders truncated address when connected", () => {
    render(
      <Header
        {...baseProps}
        isConnected
        walletAddress="GCFXABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
      />
    );
    const button = screen.getByRole("button");
    expect(button.textContent).toMatch(/^GCFX.*7890$/);
    expect(button.textContent?.length).toBeLessThan(44);
  });

  it("renders CONNECTING... when connecting", () => {
    render(<Header {...baseProps} isConnecting />);
    expect(screen.getByRole("button")).toHaveTextContent("CONNECTING...");
  });

  it("shows balance lines when connected", () => {
    render(
      <Header
        {...baseProps}
        isConnected
        walletAddress="GCFX1234"
        stellarUsdcBalance="100.00"
        stellarXlmBalance="50.00"
      />
    );
    expect(screen.getByText(/100\.00 USDC/)).toBeInTheDocument();
    expect(screen.getByText(/50\.00 XLM/)).toBeInTheDocument();
  });

  it("calls onConnect when button clicked (disconnected state)", async () => {
    const onConnect = vi.fn();
    render(<Header {...baseProps} onConnect={onConnect} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it("calls onDisconnect when button clicked (connected state)", async () => {
    const onDisconnect = vi.fn();
    render(
      <Header
        {...baseProps}
        isConnected
        walletAddress="GCFX1234"
        onDisconnect={onDisconnect}
      />
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it("button is disabled when isConnecting", () => {
    render(<Header {...baseProps} isConnecting />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Header — balance skeleton", () => {
  it("does not render balance rows when disconnected", () => {
    render(<Header {...baseProps} />);
    expect(screen.queryByText(/USDC/)).not.toBeInTheDocument();
  });

  it("renders actual balance values when loaded", () => {
    render(
      <Header
        {...baseProps}
        isConnected
        isBalanceLoading={false}
        stellarUsdcBalance="1,250.00"
        stellarXlmBalance="42.50"
        walletAddress="GCFX1234"
      />
    );
    expect(screen.getByText(/1,250\.00 USDC/)).toBeInTheDocument();
    expect(screen.getByText(/42\.50 XLM/)).toBeInTheDocument();
  });

  it("shows fallback '—' when balances are null after loading", () => {
    render(
      <Header
        {...baseProps}
        isConnected
        isBalanceLoading={false}
        stellarUsdcBalance={null}
        stellarXlmBalance={null}
        walletAddress="GCFX1234"
      />
    );
    expect(screen.getByText(/— USDC/)).toBeInTheDocument();
    expect(screen.getByText(/— XLM/)).toBeInTheDocument();
  });

  it("shows CONNECTING... label while isConnecting", () => {
    render(<Header {...baseProps} isConnecting />);
    expect(screen.getByRole("button")).toHaveTextContent("CONNECTING...");
  });

  it("button is disabled while connecting", () => {
    render(<Header {...baseProps} isConnecting />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
