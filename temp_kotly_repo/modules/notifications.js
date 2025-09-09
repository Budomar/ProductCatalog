// modules/notifications.js - Упрощенная система уведомлений
class NotificationSystem {
    constructor() {
        this.permission = null;
        this.isSupported = 'Notification' in window;
        this.initialized = false;
    }

    // Инициализация модуля
    async init() {
        if (this.initialized) return;
        
        try {
            this.checkPermission();
            this.setupEventListeners();
            this.initialized = true;
            console.log('Система уведомлений инициализирована');
        } catch (error) {
            console.error('Ошибка инициализации системы уведомлений:', error);
        }
    }

    // Проверка разрешения на уведомления
    checkPermission() {
        this.permission = Notification.permission;
        
        if (this.permission === 'default') {
            this.showPermissionRequest();
        }
    }

    // Запрос разрешения на уведомления
    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.hidePermissionRequest();
                this.showNotification('Уведомления включены', 'Теперь вы будете получать уведомления', 'success');
            }
        } catch (error) {
            console.error('Ошибка запроса разрешения:', error);
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Отслеживание изменений в корзине
        document.addEventListener('cartUpdated', () => {
            if (window.cart.length > 0) {
                this.showNotification('Корзина обновлена', `Товаров в корзине: ${window.cart.reduce((sum, item) => sum + item.quantity, 0)}`, 'info');
            }
        });
    }

    // Показ запроса разрешения
    showPermissionRequest() {
        try {
            // Простой запрос без сложного UI
            if (confirm('Разрешить уведомления? Вы будете получать информацию о акциях и наличии товаров.')) {
                this.requestPermission();
            }
        } catch (error) {
            console.error('Ошибка показа запроса разрешения:', error);
        }
    }

    // Скрытие запроса разрешения
    hidePermissionRequest() {
        // Не требуется для упрощенной версии
    }

    // Показ уведомления
    showNotification(title, message, type = 'info') {
        try {
            // Создаем простое уведомление
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} position-fixed`;
            notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px; max-width: 90%;';
            notification.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${title}</strong>
                        <div class="small">${message}</div>
                    </div>
                    <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Автоматическое скрытие
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 3000);

        } catch (error) {
            console.error('Ошибка показа уведомления:', error);
        }
    }
}

// Создаем экземпляр системы уведомлений
const notificationSystem = new NotificationSystem();

// Глобальные функции
function toggleNotifications() {
    if (typeof notificationSystem !== 'undefined') {
        notificationSystem.showNotification('Уведомления', 'Система уведомлений активна', 'info');
    }
}

console.log('Система уведомлений загружена');