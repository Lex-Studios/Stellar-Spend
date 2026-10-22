import { logger } from '@/lib/logger';
('use client');

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { CHROME_TOKENS } from '@/lib/theme-tokens';

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setRegistration(reg);

        // Check for updates periodically
        const interval = setInterval(() => {
          reg.update();
        }, 60000); // Check every minute

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is ready
              setUpdateAvailable(true);
              notifyUpdateAvailable();
            }
          });
        });

        return () => clearInterval(interval);
      } catch (error) {
        logger.error('Service Worker registration failed:', {}, error);
      }
    };

    registerServiceWorker();
  }, []);

  const handleUpdate = () => {
    if (!registration?.waiting) return;

    // Tell the new service worker to take control
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page when the new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  const notifyUpdateAvailable = () => {
    // Show a toast or notification that an update is available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Stellar Spend Update Available', {
        body: 'A new version is available. Refresh to update.',
        icon: '/icons/icon-192x192.png',
      });
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="rounded-lg p-4 shadow-lg backdrop-filter backdrop-blur-sm border"
        style={{ backgroundColor: CHROME_TOKENS.surface, borderColor: CHROME_TOKENS.gold }}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-xl">🔄</div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1"
              style={{ color: CHROME_TOKENS.gold }}>Update Available</h3>
            <p className="text-xs mb-3"
              style={{ color: CHROME_TOKENS.textDim }}>
              A new version of Stellar-Spend is ready. Refresh to get the latest features and fixes.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-semibold tracking-widest uppercase',
                  'rounded transition-colors duration-150 focus:outline-none',
                )}
                style={{ backgroundColor: CHROME_TOKENS.gold, color: CHROME_TOKENS.surface }}
              >
                Refresh
              </button>
              <button
                onClick={() => setUpdateAvailable(false)}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-semibold tracking-widest uppercase',
                  'border rounded transition-colors duration-150 focus:outline-none',
                )}
                style={{ borderColor: CHROME_TOKENS.borderMuted, color: CHROME_TOKENS.borderMuted }}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
