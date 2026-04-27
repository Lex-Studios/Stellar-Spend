"use client";

import { useEffect, useState } from "react";

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        setRegistration(reg);

        // Check for updates periodically
        const interval = setInterval(() => {
          reg.update();
        }, 60000); // Check every minute

        // Listen for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker is ready
              setUpdateAvailable(true);
              notifyUpdateAvailable();
            }
          });
        });

        return () => clearInterval(interval);
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    registerServiceWorker();
  }, []);

  const handleUpdate = () => {
    if (!registration?.waiting) return;

    // Tell the new service worker to take control
    registration.waiting.postMessage({ type: "SKIP_WAITING" });

    // Reload the page when the new service worker takes control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  };

  const notifyUpdateAvailable = () => {
    // Show a toast or notification that an update is available
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Stellar Spend Update Available", {
        body: "A new version is available. Refresh to update.",
        icon: "/icons/icon-192x192.png",
      });
    }
  };

  // Don't render anything - this is just for registration
  return null;
}
