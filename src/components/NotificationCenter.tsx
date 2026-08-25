'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import type { NotificationCenterEvent } from '@/hooks/useNotificationCenter';
import type { NotificationCenterProps } from './notification-center/types';
import { NotificationPanel } from './notification-center/NotificationPanel';

export * from './notification-center/types';

export function NotificationCenter({
  events,
  unreadCount,
  unreadBadgeText,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemoveEvent,
  onClearAll,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNotificationClick = (event: NotificationCenterEvent) => {
    if (!event.read) {
      onMarkAsRead(event.id);
    }
    if (event.link) {
      router.push(event.link.href);
      setIsOpen(false);
    }
  };

  const handleTogglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleTogglePanel}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'relative p-2 text-[#777777] hover:text-[#c9a962] transition-colors',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]',
          'rounded',
        )}
        title={`Notifications (${unreadCount} unread)`}
      >
        {/* Bell Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute top-1 right-1 min-w-[20px] h-5 px-1 rounded-full',
              'bg-[#c9a962] text-[#0a0a0a] text-[10px] font-bold',
              'flex items-center justify-center',
            )}
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadBadgeText}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <NotificationPanel
          ref={panelRef}
          events={events}
          loading={loading}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={onMarkAllAsRead}
          onRemoveEvent={onRemoveEvent}
          onClearAll={onClearAll}
        />
      )}
    </div>
  );
}

export default NotificationCenter;
