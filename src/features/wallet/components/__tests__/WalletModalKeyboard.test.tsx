import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletModal } from '../WalletModal';

const baseProps = {
  isOpen: true,
  isConnecting: false,
  connectingWallet: null,
  error: null,
  onConnect: vi.fn(),
  onClose: vi.fn(),
};

describe('WalletModal keyboard handling', () => {
  it('closes when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<WalletModal {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape while a wallet connection is in progress', () => {
    const onClose = vi.fn();
    render(<WalletModal {...baseProps} isConnecting={true} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    const onClose = vi.fn();
    render(<WalletModal {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not listen for Escape when closed', () => {
    const onClose = vi.fn();
    render(<WalletModal {...baseProps} isOpen={false} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<WalletModal {...baseProps} onClose={onClose} />);
    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('exposes an accessible modal dialog', () => {
    render(<WalletModal {...baseProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });
});
