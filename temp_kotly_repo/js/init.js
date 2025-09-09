// js/init.js - Инициализация всех модулей

function initAllModules() {
    console.log('Инициализация всех модулей...');
    
    // Проверяем загружены ли модули
    if (typeof comparisonModule === 'undefined') {
        console.error('Модуль сравнения не загружен');
    }
    if (typeof cartStorage === 'undefined') {
        console.error('Модуль сохранения корзины не загружен');
    }
    if (typeof miniCart === 'undefined') {
        console.error('Модуль мини-корзины не загружен');
    }
    if (typeof recommendationsSystem === 'undefined') {
        console.error('Система рекомендаций не загружена');
    }
    if (typeof touchInterface === 'undefined') {
        console.error('Touch-интерфейс не загружен');
    }
    if (typeof notificationSystem === 'undefined') {
        console.error('Система уведомлений не загружена');
    }
    
    // Инициализация модуля сравнения
    if (typeof comparisonModule !== 'undefined' && typeof comparisonModule.init === 'function') {
        try {
            comparisonModule.init();
            console.log('Модуль сравнения инициализирован');
            
            // Принудительно добавляем чекбоксы
            setTimeout(() => {
                if (typeof comparisonModule.addCheckboxesToProducts === 'function') {
                    comparisonModule.addCheckboxesToProducts();
                }
            }, 1000);
        } catch (error) {
            console.error('Ошибка инициализации модуля сравнения:', error);
        }
    }
    
    // Инициализация сохранения корзины
    if (typeof cartStorage !== 'undefined' && typeof cartStorage.init === 'function') {
        try {
            cartStorage.init();
            console.log('Модуль сохранения корзины инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации модуля сохранения корзины:', error);
        }
    }
    
    // Инициализация мини-корзины
    if (typeof miniCart !== 'undefined' && typeof miniCart.init === 'function') {
        try {
            miniCart.init();
            console.log('Модуль мини-корзины инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации модуля мини-корзины:', error);
        }
    }
    
    // Инициализация рекомендаций
    if (typeof recommendationsSystem !== 'undefined' && typeof recommendationsSystem.init === 'function') {
        try {
            recommendationsSystem.init();
            console.log('Система рекомендаций инициализирована');
        } catch (error) {
            console.error('Ошибка инициализации системы рекомендаций:', error);
        }
    }
    
    // Инициализация touch-интерфейса
    if (typeof touchInterface !== 'undefined' && typeof touchInterface.init === 'function') {
        try {
            touchInterface.init();
            console.log('Touch-интерфейс инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации touch-интерфейса:', error);
        }
    }
    
    // Инициализация уведомлений
    if (typeof notificationSystem !== 'undefined' && typeof notificationSystem.init === 'function') {
        try {
            notificationSystem.init();
            console.log('Система уведомлений инициализирована');
            
            // Создаем UI уведомлений
            setTimeout(() => {
                if (typeof notificationSystem.createNotificationUI === 'function') {
                    notificationSystem.createNotificationUI();
                }
                if (typeof notificationSystem.createSettingsSection === 'function') {
                    notificationSystem.createSettingsSection();
                }
            }, 1500);
        } catch (error) {
            console.error('Ошибка инициализации системы уведомлений:', error);
        }
    }
    
    console.log('Все модули инициализированы');
}

// Функция для проверки состояния системы
function checkSystemStatus() {
    console.log('=== ПРОВЕРКА СИСТЕМЫ ===');
    console.log('allProducts:', allProducts ? allProducts.length : 'не загружены');
    console.log('cart:', cart ? cart.length : 'нет товаров');
    console.log('comparisonModule:', typeof comparisonModule);
    console.log('cartStorage:', typeof cartStorage);
    console.log('miniCart:', typeof miniCart);
    console.log('recommendationsSystem:', typeof recommendationsSystem);
    console.log('notificationSystem:', typeof notificationSystem);
    console.log('touchInterface:', typeof touchInterface);
    console.log('========================');
}

// Запускаем инициализацию после полной загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM полностью загружен');
    
    // Ждем немного для полной загрузки всех скриптов
    setTimeout(function() {
        console.log('Запуск инициализации модулей...');
        initAllModules();
        
        // Проверяем состояние системы
        setTimeout(checkSystemStatus, 2000);
    }, 3000);
});

// Глобальные функции для ручной инициализации
window.initAllModules = initAllModules;
window.checkSystemStatus = checkSystemStatus;

// Функция для принудительного обновления чекбоксов сравнения
window.refreshComparisonCheckboxes = function() {
    if (typeof comparisonModule !== 'undefined' && typeof comparisonModule.addCheckboxesToProducts === 'function') {
        comparisonModule.addCheckboxesToProducts();
        console.log('Чекбоксы сравнения обновлены');
    } else {
        console.error('Невозможно обновить чекбоксы сравнения');
    }
};

console.log('Модуль инициализации загружен');