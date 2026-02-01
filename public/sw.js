const CACHE_NAME = 'sidequest-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache for API calls
self.addEventListener('fetch', (event) => {
  // API requests: network first, cache fallback
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // ONLY cache if it's a GET request and a successful response
          if (event.request.method === 'GET' && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Static assets: cache first, network fallback
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});


// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'SideQuest';
  const options = {
    body: data.body || 'Time to conquer your daily quests!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'sidequest-reminder',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Background sync for offline quest completion
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quest-completion') {
    event.waitUntil(syncQuestCompletions());
  }
});

async function syncQuestCompletions() {
  // Get pending completions from IndexedDB
  const db = await openDB();
  const tx = db.transaction('pendingCompletions', 'readonly');
  const store = tx.objectStore('pendingCompletions');
  const pendingCompletions = await store.getAll();

  // Sync each completion
  for (const completion of pendingCompletions) {
    try {
      await fetch(`/api/daily/${completion.questId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: completion.completed }),
      });

      // Remove from pending after successful sync
      const deleteTx = db.transaction('pendingCompletions', 'readwrite');
      const deleteStore = deleteTx.objectStore('pendingCompletions');
      await deleteStore.delete(completion.id);
    } catch (error) {
      console.error('Failed to sync completion:', error);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SideQuestDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingCompletions')) {
        db.createObjectStore('pendingCompletions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}