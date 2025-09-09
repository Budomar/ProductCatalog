// modules/touch-interface.js - Упрощенный touch-интерфейс
class TouchInterface {
    constructor() {
        this.isMobile = false;
        this.isTouchDevice = false;
        this.initialized = false;
    }

    // Инициализация модуля
    init() {
        if (this.initialized) return;
        
        try {
            this.detectDeviceType();
            this.optimizeForTouch();
            this.initialized = true;
            console.log('Модуль touch-интерфейса инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации touch-интерфейса:', error);
        }
    }

    // Определение типа устройства
    detectDeviceType() {
        this.isTouchDevice = 'ontouchstart' in window || 
                            navigator.maxTouchPoints > 0 || 
                            navigator.msMaxTouchPoints > 0;
        
        this.isMobile = window.innerWidth <= 768;
        
        // Добавляем классы для CSS
        if (this.isTouchDevice) {
            document.documentElement.classList.add('touch-device');
        }
        if (this.isMobile) {
            document.documentElement.classList.add('mobile-device');
        }
    }

    // Оптимизация для touch-устройств
    optimizeForTouch() {
        // Увеличиваем hit area для кнопок
        document.querySelectorAll('.btn').forEach(btn => {
            btn.style.minHeight = '44px';
            btn.style.minWidth = '44px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
        });

        // Улучшаем элементы формы
        document.querySelectorAll('.form-control, .form-select').forEach(input => {
            input.style.minHeight = '44px';
            input.style.fontSize = '16px'; // Предотвращает zoom в iOS
        });

        // Добавляем touch-feedback
        document.querySelectorAll('.card, .btn').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            });
            
            element.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            });
        });
    }
}

// Создаем экземпляр модуля
const touchInterface = new TouchInterface();

console.log('Модуль touch-интерфейса загружен');