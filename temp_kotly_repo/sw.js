// sw.js - Service Worker для push-уведомлений
const CACHE_NAME = 'laggartt-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/comparison.css',
    '/styles/mini-cart.css',
    '/styles/recommendations.css',
    '/styles/touch-interface.css',
    '/styles/notifications.css',
    '/js/main.js',
    '/js/cart.js',
    '/modules/comparison.js',
    '/modules/mini-cart.js',
    '/modules/recommendations.js',
    '/modules/touch-interface.js',
    '/modules/notifications.js',
    '/images/logo.png',
    '/images/default.jpg',
    '/images/meteor-t2.jpg',
    '/images/meteor-c30.jpg',
    '/images/meteor-b30.jpg',
    '/images/meteor-b20.jpg',
    '/images/meteor-c11.jpg',
    '/images/meteor-q3.jpg',
    '/images/meteor-m30.jpg',
    '/images/meteor-m6.jpg',
    '/images/laggartt.jpg',
    '/images/devotion.jpg',
    '/images/mk.jpg'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Установка');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Кэширование файлов');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Активация');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Очистка старого кэша');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Обработка fetch-запросов
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем кэшированный файл или делаем сетевой запрос
                return response || fetch(event.request);
            })
            .catch(() => {
                // Fallback для ошибок
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
    console.log('Service Worker: Получено push-уведомление');
    
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.error('Ошибка парсинга push-данных:', error);
        data = {
            title: 'LaggarTT',
            body: 'Новое уведомление',
            icon: '/images/logo.png'
        };
    }

    const options = {
        body: data.body || 'Новое уведомление от LaggarTT',
        icon: data.icon || '/images/logo.png',
        badge: '/images/badge.png',
        vibrate: [200, 100, 200],
        tag: 'laggartt-push',
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'LaggarTT', options)
    );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Клик по уведомлению');
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((windowClients) => {
                // Проверяем, есть ли уже открытая вкладка
                for (const client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Открываем новую вкладку если нужно
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Обработка фоновой синхронизации
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Фоновая синхронизация');
        event.waitUntil(doBackgroundSync());
    }
});

// Фоновая синхронизация данных
async function doBackgroundSync() {
    try {
        const response = await fetch('/data.json?t=' + Date.now());
        const data = await response.json();
        
        // Здесь можно добавить логику проверки изменений
        console.log('Фоновая синхронизация завершена');
        
        // Отправляем уведомление об обновлении данных
        self.registration.showNotification('LaggarTT', {
            body: 'Данные каталога обновлены',
            icon: '/images/logo.png',
            tag: 'data-update'
        });
    } catch (error) {
        console.error('Ошибка фоновой синхронизации:', error);
    }
}

// Периодическая фоновая синхронизация
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'periodic-data-sync') {
        console.log('Service Worker: Периодическая синхронизация');
        event.waitUntil(doBackgroundSync());
    }
});

// Обработка сообщений от главного потока
self.addEventListener('message', (event) => {
    console.log('Service Worker: Получено сообщение', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CACHE_DATA':
            cacheAdditionalData(event.data.payload);
            break;
        case 'GET_CACHED_DATA':
            getCachedData(event.data.key);
            break;
    }
});

// Кэширование дополнительных данных
async function cacheAdditionalData(data) {
    const cache = await caches.open(CACHE_NAME);
    // Здесь можно кэшировать дополнительные данные
}

// Получение кэшированных данных
async function getCachedData(key) {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);
    return response ? await response.json() : null;
}