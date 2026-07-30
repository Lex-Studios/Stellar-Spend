const CACHE_NAME = "stellar-spend-v1";
const OFFLINE_FALLBACK = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/offline.html",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Failed to cache some assets:", err);
        return cache.addAll(
          STATIC_ASSETS.filter((url) => url !== "/offline.html"),
        );
      });
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            return key !== CACHE_NAME && key.startsWith("stellar-spend-");
          })
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  // Only cache GET requests for same-origin navigation and static assets
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Skip API routes — always network-first
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          // Return offline fallback for navigation requests
          if (event.request.mode === "navigate") {
            return (
              caches.match(OFFLINE_FALLBACK) ||
              new Response("Offline", { status: 503 })
            );
          }
          return cached || new Response("Offline", { status: 503 });
        });
      return cached ?? networkFetch;
    }),
  );
});

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => {
      Promise.all(keys.map((key) => caches.delete(key)));
    });
  }
});

// Background sync for failed transactions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-failed-transactions") {
    event.waitUntil(syncFailedTransactions());
  } else if (event.tag === "sync-transaction-history") {
    event.waitUntil(syncTransactionHistory());
  }
});

async function syncFailedTransactions() {
  try {
    const db = await openIndexedDB();
    const failedTxs = await getFailedTransactions(db);

    for (const tx of failedTxs) {
      try {
        const response = await fetch("/api/offramp/execute-payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx),
        });

        if (response.ok) {
          await markTransactionSynced(db, tx.id);
          await notifyClients({
            type: "transaction-synced",
            transactionId: tx.id,
          });
        }
      } catch (err) {
        console.error("Failed to sync transaction:", tx.id, err);
      }
    }
  } catch (err) {
    console.error("Background sync failed:", err);
  }
}

async function syncTransactionHistory() {
  try {
    await notifyClients({ type: "trigger-history-sync" });
  } catch (err) {
    console.error("Failed to trigger history sync:", err);
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Transaction update",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: data.tag || "stellar-spend-notification",
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Stellar-Spend", options),
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Helper functions
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("stellar-spend", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("failed-transactions")) {
        db.createObjectStore("failed-transactions", { keyPath: "id" });
      }
    };
  });
}

function getFailedTransactions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["failed-transactions"], "readonly");
    const store = transaction.objectStore("failed-transactions");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function markTransactionSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["failed-transactions"], "readwrite");
    const store = transaction.objectStore("failed-transactions");
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function notifyClients(message) {
  return self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}
