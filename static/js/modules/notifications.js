/**
 * Notifications Module
 * Handles push notifications and in-app notifications
 */

class NotificationsModule {
    constructor() {
        this.isInitialized = false;
        this.notificationQueue = [];
        this.activeNotifications = [];
        this.maxNotifications = 3;
        this.defaultDuration = 4000;
        this.pushSubscription = null;
        this.notificationPermission = 'default';
    }

    /**
     * Initialize the notifications module
     */
    async init() {
        this.createNotificationContainer();
        this.setupPushNotifications();
        this.setupEventListeners();
        this.loadNotificationPreferences();
        this.isInitialized = true;
        console.log('Notifications module initialized');
    }

    /**
     * Create notification container
     */
    createNotificationContainer() {
        let container = document.getElementById('notificationsContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationsContainer';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1060';
            document.body.appendChild(container);
        }
    }

    /**
     * Setup push notifications
     */
    async setupPushNotifications() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported');
            return;
        }

        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);

            // Check notification permission
            this.notificationPermission = await Notification.requestPermission();
            console.log('Notification permission:', this.notificationPermission);

            if (this.notificationPermission === 'granted') {
                await this.subscribeToPush(registration);
            }
        } catch (error) {
            console.error('Error setting up push notifications:', error);
        }
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPush(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    // This would be your VAPID public key
                    'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLdgC28w_lYHcV_k3W5oEBF3EQSthlhPfhE8xbSyAcNELkfvBHU8Qis'
                )
            });

            this.pushSubscription = subscription;
            console.log('Push subscription:', subscription);

            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
        } catch (error) {
            console.error('Error subscribing to push:', error);
        }
    }

    /**
     * Send subscription to server
     */
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription,
                    user_agent: navigator.userAgent
                })
            });

            if (response.ok) {
                console.log('Subscription sent to server');
            }
        } catch (error) {
            console.error('Error sending subscription to server:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for custom notification events
        document.addEventListener('showNotification', (e) => {
            this.show(e.detail.message, e.detail.type, e.detail.duration);
        });

        // Listen for cart events to show notifications
        document.addEventListener('cartUpdated', (e) => {
            const cart = e.detail.cart;
            if (cart.length > 0) {
                const lastItem = cart[cart.length - 1];
                this.show(`Товар "${lastItem.name}" добавлен в корзину`, 'success');
            }
        });

        // Listen for promotional events
        this.setupPromotionalNotifications();
    }

    /**
     * Show in-app notification
     */
    show(message, type = 'info', duration = this.defaultDuration, actions = []) {
        const notification = this.createNotification(message, type, duration, actions);
        
        // Add to active notifications
        this.activeNotifications.push(notification);

        // Remove oldest if too many
        if (this.activeNotifications.length > this.maxNotifications) {
            const oldest = this.activeNotifications.shift();
            this.removeNotification(oldest.element);
        }

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.element);
            }, duration);
        }

        return notification;
    }

    /**
     * Create notification element
     */
    createNotification(message, type, duration, actions) {
        const container = document.getElementById('notificationsContainer');
        const id = 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const typeClasses = {
            success: 'alert-success',
            error: 'alert-danger',
            warning: 'alert-warning',
            info: 'alert-info',
            promotion: 'alert-primary'
        };

        const typeIcons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            promotion: 'fas fa-bullhorn'
        };

        const element = document.createElement('div');
        element.id = id;
        element.className = `alert ${typeClasses[type] || 'alert-info'} notification d-flex align-items-center`;
        element.style.cssText = `
            margin-bottom: 10px;
            animation: slideIn 0.3s ease-out;
            max-width: 350px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        `;

        const progressBar = duration > 0 ? `
            <div class="progress position-absolute bottom-0 start-0 w-100" style="height: 3px;">
                <div class="progress-bar" role="progressbar" style="animation: progressCountdown ${duration}ms linear;"></div>
            </div>
        ` : '';

        element.innerHTML = `
            <div class="flex-grow-1">
                <i class="${typeIcons[type] || typeIcons.info} me-2"></i>
                <span>${message}</span>
            </div>
            ${actions.length > 0 ? `
                <div class="ms-2">
                    ${actions.map(action => `
                        <button class="btn btn-sm btn-outline-${type === 'success' ? 'success' : 'primary'} me-1" 
                                onclick="${action.handler}">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
            <button type="button" class="btn-close ms-2" onclick="app.modules.notifications.removeNotification('${id}')"></button>
            ${progressBar}
        `;

        // Add CSS animations if not present
        this.addNotificationStyles();

        container.appendChild(element);

        const notification = {
            id: id,
            element: element,
            type: type,
            message: message,
            timestamp: Date.now()
        };

        return notification;
    }

    /**
     * Remove notification
     */
    removeNotification(elementOrId) {
        const element = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
            
        if (!element) return;

        // Animate out
        element.style.animation = 'slideOut 0.3s ease-in forwards';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }

            // Remove from active notifications
            this.activeNotifications = this.activeNotifications.filter(
                n => n.element !== element
            );
        }, 300);
    }

    /**
     * Add notification CSS styles
     */
    addNotificationStyles() {
        if (document.getElementById('notificationStyles')) return;

        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @keyframes progressCountdown {
                from { width: 100%; }
                to { width: 0%; }
            }
            
            .notification {
                position: relative;
                overflow: hidden;
            }
            
            .notification .progress {
                border-radius: 0;
            }
            
            .notification:hover .progress-bar {
                animation-play-state: paused;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show push notification
     */
    async showPushNotification(title, options = {}) {
        if (this.notificationPermission !== 'granted') {
            console.log('Push notifications not permitted');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body: options.body || '',
                icon: options.icon || '/favicon.ico',
                badge: options.badge || '/favicon.ico',
                tag: options.tag || 'catalog-notification',
                renotify: options.renotify || false,
                requireInteraction: options.requireInteraction || false,
                data: options.data || {},
                actions: options.actions || []
            });
        } catch (error) {
            console.error('Error showing push notification:', error);
        }
    }

    /**
     * Setup promotional notifications
     */
    setupPromotionalNotifications() {
        // Check for promotions periodically
        setInterval(() => {
            this.checkForPromotions();
        }, 5 * 60 * 1000); // Every 5 minutes

        // Show welcome notification for new visitors
        setTimeout(() => {
            if (!localStorage.getItem('catalog_visited')) {
                this.show(
                    'Добро пожаловать! Найдите лучшие товары в нашем каталоге',
                    'promotion',
                    6000,
                    [{
                        text: 'Показать скидки',
                        handler: 'app.showPromotions()'
                    }]
                );
                localStorage.setItem('catalog_visited', 'true');
            }
        }, 2000);
    }

    /**
     * Check for promotions
     */
    async checkForPromotions() {
        try {
            const response = await fetch('/api/promotions');
            if (response.ok) {
                const promotions = await response.json();
                const newPromotions = promotions.filter(p => 
                    !this.hasSeenPromotion(p.id)
                );

                newPromotions.forEach(promotion => {
                    this.showPromotionNotification(promotion);
                    this.markPromotionAsSeen(promotion.id);
                });
            }
        } catch (error) {
            console.error('Error checking promotions:', error);
        }
    }

    /**
     * Show promotion notification
     */
    showPromotionNotification(promotion) {
        const message = `🎉 ${promotion.title}`;
        const actions = [{
            text: 'Подробнее',
            handler: `app.showPromotion(${promotion.id})`
        }];

        this.show(message, 'promotion', 8000, actions);

        // Also show push notification if enabled
        this.showPushNotification('Новая акция!', {
            body: promotion.title,
            tag: `promotion-${promotion.id}`,
            data: { promotion_id: promotion.id },
            actions: [{
                action: 'view',
                title: 'Посмотреть'
            }]
        });
    }

    /**
     * Check if promotion was seen
     */
    hasSeenPromotion(promotionId) {
        const seen = JSON.parse(localStorage.getItem('seen_promotions') || '[]');
        return seen.includes(promotionId);
    }

    /**
     * Mark promotion as seen
     */
    markPromotionAsSeen(promotionId) {
        const seen = JSON.parse(localStorage.getItem('seen_promotions') || '[]');
        if (!seen.includes(promotionId)) {
            seen.push(promotionId);
            localStorage.setItem('seen_promotions', JSON.stringify(seen));
        }
    }

    /**
     * Show cart abandonment notification
     */
    setupCartAbandonmentNotification() {
        let cartAbandonmentTimer;

        document.addEventListener('cartUpdated', (e) => {
            const cart = e.detail.cart;
            
            // Clear existing timer
            if (cartAbandonmentTimer) {
                clearTimeout(cartAbandonmentTimer);
            }

            // Set new timer if cart is not empty
            if (cart.length > 0) {
                cartAbandonmentTimer = setTimeout(() => {
                    this.show(
                        'Не забудьте оформить заказ! В корзине вас ждут отличные товары',
                        'warning',
                        6000,
                        [{
                            text: 'Оформить',
                            handler: 'document.getElementById("cartBtn").click()'
                        }]
                    );
                }, 10 * 60 * 1000); // 10 minutes
            }
        });
    }

    /**
     * Show stock alert notification
     */
    showStockAlert(productName) {
        this.show(
            `Товар "${productName}" снова в наличии!`,
            'success',
            6000,
            [{
                text: 'Посмотреть',
                handler: `app.searchProduct('${productName}')`
            }]
        );
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return false;
        }

        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;
        
        if (permission === 'granted') {
            this.show('Уведомления включены! Вы будете получать информацию о скидках', 'success');
            return true;
        } else {
            this.show('Уведомления отключены. Вы можете включить их в настройках браузера', 'info');
            return false;
        }
    }

    /**
     * Convert VAPID key
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Load notification preferences
     */
    loadNotificationPreferences() {
        const prefs = JSON.parse(localStorage.getItem('notification_preferences') || '{}');
        this.preferences = {
            promotions: prefs.promotions !== false,
            cart_reminders: prefs.cart_reminders !== false,
            stock_alerts: prefs.stock_alerts !== false,
            ...prefs
        };
    }

    /**
     * Save notification preferences
     */
    saveNotificationPreferences() {
        localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.activeNotifications.forEach(notification => {
            this.removeNotification(notification.element);
        });
    }

    /**
     * Get notification history
     */
    getNotificationHistory() {
        return this.activeNotifications.map(n => ({
            id: n.id,
            type: n.type,
            message: n.message,
            timestamp: n.timestamp
        }));
    }
}

// Export for use in other modules
window.NotificationsModule = NotificationsModule;
