const CACHE_VERSION = "v1";
const CACHE_NAMES = {
  static: `stellar-spend-static-${CACHE_VERSION}`,
  dynamic: `stellar-spend-dynamic-${CACHE_VERSION}`,
  images: `stellar-spend-images-${CACHE_VERSION}`,
};

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
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
            return (
              !Object.values(CACHE_NAMES).includes(key) &&
              key.startsWith("stellar-spend-")
            );
          })
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API routes - network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Images - cache first, fallback to network
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
    return;
  }

  // Static assets - cache first, fallback to network
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
    return;
  }

  // Dynamic content - stale while revalidate
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// Network first strategy - try network, fallback to cache
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return createOfflineResponse();
  }
}

// Cache first strategy - try cache, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return createOfflineResponse();
  }
}

// Stale while revalidate strategy - return cache immediately, update in background
async function staleWhileRevalidateStrategy(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAMES.dynamic);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || fetchPromise;
}

// Helper functions
function isImageRequest(request) {
  return request.destination === "image" || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname);
}

function isStaticAsset(pathname) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(pathname) || pathname === "/";
}

function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: "Offline - Unable to fetch resource",
      message: "You are currently offline. Some features may be limited.",
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    }
  );
}

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
