import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationItem } from '../NotificationItem';
import { NotificationPanel } from '../NotificationPanel';
import { formatTime, getEventTypeColor } from '../types';
import type { NotificationCenterEvent } from '@/hooks/useNotificationCenter';

describe('NotificationCenter Subcomponents', () => {
  const mockEvent: NotificationCenterEvent = {
    id: 'evt-1',
    type: 'transaction_update',
    title: 'Payout Delivered',
    description: 'Funds sent to your account',
    read: false,
    createdAt: Date.now() - 30000,
  };

  describe('NotificationItem', () => {
    it('renders notification title and handles clicks', () => {
      const onClick = vi.fn();
      const onRemove = vi.fn();

      render(<NotificationItem event={mockEvent} onClick={onClick} onRemove={onRemove} />);

      expect(screen.getByText('Payout Delivered')).toBeInTheDocument();
      expect(screen.getByText('Funds sent to your account')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Payout Delivered'));
      expect(onClick).toHaveBeenCalledWith(mockEvent);

      fireEvent.click(screen.getByLabelText(/remove notification/i));
      expect(onRemove).toHaveBeenCalledWith('evt-1');
    });
  });

  describe('NotificationPanel', () => {
    it('renders list of events and clear all button', () => {
      const onClearAll = vi.fn();
      const onMarkAllAsRead = vi.fn();

      render(
        <NotificationPanel
          events={[mockEvent]}
          loading={false}
          onNotificationClick={vi.fn()}
          onMarkAllAsRead={onMarkAllAsRead}
          onRemoveEvent={vi.fn()}
          onClearAll={onClearAll}
        />,
      );

      expect(screen.getByText('NOTIFICATIONS')).toBeInTheDocument();
      expect(screen.getByText('Mark Read')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Mark Read'));
      expect(onMarkAllAsRead).toHaveBeenCalled();

      fireEvent.click(screen.getByText(/clear all/i));
      expect(onClearAll).toHaveBeenCalled();
    });
  });

  describe('helpers', () => {
    it('formats time intervals', () => {
      expect(formatTime(Date.now() - 10000)).toBe('just now');
      expect(formatTime(Date.now() - 120000)).toBe('2m ago');
      expect(formatTime(Date.now() - 7200000)).toBe('2h ago');
    });

    it('returns event type colors', () => {
      expect(getEventTypeColor('price_alert')).toContain('amber');
      expect(getEventTypeColor('transaction_update')).toContain('blue');
    });
  });
});
