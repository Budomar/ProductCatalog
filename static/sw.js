/**
 * Service Worker for Push Notifications and Caching
 */

const CACHE_NAME = 'catalog-cache-v1';
const urlsToCache = [
    '/',
    '/static/css/catalog.css',
    '/static/js/catalog.js',
    '/static/js/modules/cart.js',
    '/static/js/modules/comparison.js',
    '/static/js/modules/view-toggle.js',
    '/static/js/modules/search-filter.js',
    '/static/js/modules/recommendations.js',
    '/static/js/modules/analytics.js',
    '/static/js/modules/social-sharing.js',
    '/static/js/modules/mobile-touch.js',
    '/static/js/modules/notifications.js',
    '/static/js/modules/delivery-calculator.js',
    '/data/products.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Service Worker: Cache failed', error);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request)
                    .then((fetchResponse) => {
                        // Check if valid response
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }

                        // Clone the response
                        const responseToCache = fetchResponse.clone();

                        // Add to cache for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return fetchResponse;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('/');
                        }
                        
                        // Return empty response for other requests
                        return new Response('', { status: 204 });
                    });
            })
    );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');
    
    let notificationData = {
        title: 'Каталог товаров',
        body: 'У нас есть новости для вас!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'catalog-notification',
        data: {}
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                ...data
            };
        } catch (error) {
            notificationData.body = event.data.text();
        }
    }

    const notificationOptions = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        data: notificationData.data,
        requireInteraction: notificationData.requireInteraction || false,
        actions: notificationData.actions || [
            {
                action: 'view',
                title: 'Посмотреть'
            },
            {
                action: 'close',
                title: 'Закрыть'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationOptions)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification click');
    
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Default action or 'view' action
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window/tab open
                for (let client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window/tab if none found
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync', event.tag);
    
    if (event.tag === 'cart-sync') {
        event.waitUntil(syncCart());
    } else if (event.tag === 'analytics-sync') {
        event.waitUntil(syncAnalytics());
    }
});

// Sync cart data when online
async function syncCart() {
    try {
        // Get cart data from IndexedDB or localStorage
        const cartData = await getOfflineCartData();
        
        if (cartData && cartData.length > 0) {
            const response = await fetch('/api/cart/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cart: cartData })
            });
            
            if (response.ok) {
                console.log('Cart synced successfully');
                await clearOfflineCartData();
            }
        }
    } catch (error) {
        console.error('Failed to sync cart:', error);
    }
}

// Sync analytics data when online
async function syncAnalytics() {
    try {
        const analyticsData = await getOfflineAnalyticsData();
        
        if (analyticsData && analyticsData.length > 0) {
            const response = await fetch('/api/analytics/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ events: analyticsData })
            });
            
            if (response.ok) {
                console.log('Analytics synced successfully');
                await clearOfflineAnalyticsData();
            }
        }
    } catch (error) {
        console.error('Failed to sync analytics:', error);
    }
}

// Helper functions for offline data management
async function getOfflineCartData() {
    // This would integrate with IndexedDB for more robust offline storage
    return JSON.parse(localStorage.getItem('offline_cart_data') || '[]');
}

async function clearOfflineCartData() {
    localStorage.removeItem('offline_cart_data');
}

async function getOfflineAnalyticsData() {
    return JSON.parse(localStorage.getItem('offline_analytics_data') || '[]');
}

async function clearOfflineAnalyticsData() {
    localStorage.removeItem('offline_analytics_data');
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            case 'STORE_OFFLINE_DATA':
                storeOfflineData(event.data.key, event.data.data);
                break;
            case 'GET_CACHE_STATUS':
                getCacheStatus().then(status => {
                    event.ports[0].postMessage(status);
                });
                break;
        }
    }
});

// Store data for offline use
function storeOfflineData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log('Data stored for offline use:', key);
    } catch (error) {
        console.error('Failed to store offline data:', error);
    }
}

// Get cache status
async function getCacheStatus() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        return {
            cacheSize: keys.length,
            cacheName: CACHE_NAME,
            cached: true
        };
    } catch (error) {
        return {
            cacheSize: 0,
            cacheName: CACHE_NAME,
            cached: false,
            error: error.message
        };
    }
}

// Periodic data refresh
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'catalog-data-refresh') {
        event.waitUntil(refreshCatalogData());
    }
});

// Refresh catalog data in background
async function refreshCatalogData() {
    try {
        console.log('Service Worker: Refreshing catalog data');
        
        const response = await fetch('/api/products');
        if (response.ok) {
            const data = await response.json();
            
            // Update cache with fresh data
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/api/products', new Response(JSON.stringify(data)));
            
            console.log('Catalog data refreshed successfully');
        }
    } catch (error) {
        console.error('Failed to refresh catalog data:', error);
    }
}
