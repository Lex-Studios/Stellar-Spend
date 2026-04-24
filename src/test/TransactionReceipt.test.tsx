import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TransactionReceipt, type ReceiptData } from "@/components/TransactionReceipt";

const mockReceipt: ReceiptData = {
  txHash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  orderId: "order-xyz-001",
  amount: "100",
  currency: "NGN",
  destinationAmount: "159500.00",
  bridgeFee: "0.50",
  payoutFee: "0.00",
  rate: 1595,
  provider: "Paycrest",
  bankName: "First Bank",
  accountNumber: "0123456789",
  timestamp: new Date("2026-04-24T11:00:00Z").getTime(),
  status: "completed",
};

describe("TransactionReceipt", () => {
  it("renders the amount and currency", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.getByText("100 USDC")).toBeInTheDocument();
  });

  it("renders destination amount", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.getByText(/159,500/)).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  it("renders provider name", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.getByText("Paycrest")).toBeInTheDocument();
  });

  it("masks account number to last 4 digits", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.getByText("****6789")).toBeInTheDocument();
  });

  it("renders order ID row when provided", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.getByText("order-xyz-001")).toBeInTheDocument();
  });

  it("does not render order ID row when omitted", () => {
    const { orderId: _, ...noOrder } = mockReceipt;
    render(<TransactionReceipt data={noOrder} />);
    expect(screen.queryByText("order-xyz-001")).not.toBeInTheDocument();
  });

  it("renders shortened tx hash in the full hash footer", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.getByText(mockReceipt.txHash)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(<TransactionReceipt data={mockReceipt} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /close receipt/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not render close button when onClose is not provided", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.queryByRole("button", { name: /close receipt/i })).not.toBeInTheDocument();
  });

  it("renders Print and Share buttons", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("renders QR placeholder with aria-label", () => {
    render(<TransactionReceipt data={mockReceipt} />);
    expect(screen.getByRole("img", { name: /qr code/i })).toBeInTheDocument();
  });

  it("shows 'failed' status in red for failed transactions", () => {
    render(<TransactionReceipt data={{ ...mockReceipt, status: "failed" }} />);
    expect(screen.getByText("failed")).toBeInTheDocument();
  });
});
