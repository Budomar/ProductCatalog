// js/main.js - Основной файл приложения (исправленная версия)

// Глобальные переменные
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 1000;
let currentDiscount = 0;
let showOriginalPrices = true;
let cart = [];

// Основная функция загрузки данных
async function loadData() {
    try {
        showLoading(true);
        console.log('Начинаем загрузку данных...');
        
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        allProducts = await response.json();
        console.log('Данные загружены, товаров:', allProducts.length);
        
        // Загружаем акции после загрузки товаров
        if (typeof promotionsSystem !== 'undefined' && typeof promotionsSystem.init === 'function') {
            await promotionsSystem.init();
        }
        
        // Исправляем определение контуров
        allProducts = allProducts.map(product => {
            const model = product.Модель;
            
            if (model.includes(' C ') || model.includes(' C\n') || 
                model.endsWith(' C') || model.includes('(C)') ||
                model.includes(' С ') || model.includes(' С\n') || 
                model.endsWith(' С') || model.includes('(С)')) {
                product.Контуры = "Двухконтурный";
            } else if (model.includes(' H ') || model.includes(' H\n') || 
                      model.endsWith(' H') || model.includes('(H)') ||
                      model.includes(' Н ') || model.includes(' Н\n') || 
                      model.endsWith(' Н') || model.includes('(Н)')) {
                product.Контуры = "Одноконтурный";
            }
            
            // Убедимся, что все необходимые поля существуют
            product.Цена = product.Цена || 0;
            product.В_наличии = product.В_наличии || 0;
            product.Мощность = product.Мощность || '';
            product.Контуры = product.Контуры || '';
            product.WiFi = product.WiFi || 'Нет';
            
            return product;
        });
        
        // Инициализируем модули после загрузки данных
        initModules();
        
        updateStatistics();
        filterProducts();
        showLoading(false);
        
        console.log('Данные успешно обработаны');
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showLoading(false);
        showError('Не удалось загрузить данные. Пожалуйста, проверьте подключение к интернету.');
    }
}

// Функции интерфейса
function showLoading(show) {
    const container = document.getElementById('products-container');
    if (show) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <div class="ms-3">
                        <div>Загрузка каталога...</div>
                        <small class="text-muted">Пожалуйста, подождите</small>
                    </div>
                </div>
            </div>
        `;
    }
}

function showError(message) {
    const container = document.getElementById('products-container');
    container.innerHTML = `
        <div class="col-12 text-center">
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> ${message}
            </div>
            <button class="btn btn-primary mt-2" onclick="loadData()">
                <i class="bi bi-arrow-clockwise"></i> Попробовать снова
            </button>
        </div>
    `;
}

function updateStatistics() {
    const countElement = document.getElementById('product-count');
    if (countElement) {
        countElement.textContent = `Найдено ${filteredProducts.length} товаров`;
    }
}

// Функции скидок
function calculateDiscountPrice(price, discount) {
    return Math.round(price * (1 - discount / 100));
}

function updateDiscount(value) {
    value = Math.max(0, Math.min(50, parseInt(value) || 0));
    document.getElementById('discount-slider').value = value;
    document.getElementById('discount-input').value = value;
    document.getElementById('discount-value').textContent = value;
    currentDiscount = value;
    
    // Обновляем цены в корзине
    if (cart.length > 0) {
        cart.forEach(item => {
            item.discountPrice = calculateDiscountPrice(item.Цена, currentDiscount);
        });
        if (typeof updateCart === 'function') {
            updateCart();
        }
    }
    
    if (document.getElementById('auto-apply').checked) {
        renderProducts();
    }
}

function toggleOriginalPrices() {
    showOriginalPrices = document.getElementById('show-original').checked;
    renderProducts();
}

// Функции фильтрации и сортировки
function filterProducts() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const powerFilter = document.getElementById('power-filter').value;
    const contourFilter = document.getElementById('contour-filter').value;
    const wifiFilter = document.getElementById('wifi-filter').value;
    const stockFilter = document.getElementById('stock-filter').value;
    
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.Модель.toLowerCase().includes(searchText) || 
                            (product.Артикул && product.Артикул.toLowerCase().includes(searchText));
        const matchesPower = !powerFilter || product.Мощность === powerFilter;
        const matchesContour = !contourFilter || product.Контуры === contourFilter;
        const matchesWifi = !wifiFilter || product.WiFi === wifiFilter;
        const matchesStock = !stockFilter || 
            (stockFilter === 'available' && product.В_наличии > 0) ||
            (stockFilter === 'outofstock' && product.В_наличии === 0);
        
        return matchesSearch && matchesPower && matchesContour && matchesWifi && matchesStock;
    });
    
    currentPage = 1;
    sortProducts();
}

function sortProducts() {
    const sortOption = document.getElementById('sort-select').value;
    
    filteredProducts.sort((a, b) => {
        switch (sortOption) {
            case 'name-asc': return a.Модель.localeCompare(b.Модель);
            case 'name-desc': return b.Модель.localeCompare(a.Модель);
            case 'price-asc': return (a.Цена || 0) - (b.Цена || 0);
            case 'price-desc': return (b.Цена || 0) - (a.Цена || 0);
            case 'stock-desc': return (b.В_наличии || 0) - (a.В_наличии || 0);
            case 'power-asc': return (parseInt(a.Мощность) || 0) - (parseInt(b.Мощность) || 0);
            case 'power-desc': return (parseInt(b.Мощность) || 0) - (parseInt(a.Мощность) || 0);
            default: return 0;
        }
    });
    
    renderProducts();
}

// Рендеринг товаров
function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    const productsToShow = filteredProducts.slice(
        (currentPage - 1) * productsPerPage, 
        currentPage * productsPerPage
    );
    
    if (productsToShow.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Товары не найдены
                </div>
                <p class="text-muted">Попробуйте изменить параметры поиска или фильтры</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = productsToShow.map(product => {
        const discountPrice = calculateDiscountPrice(product.Цена, currentDiscount);
        const hasDiscount = currentDiscount > 0;
        const inCart = cart.find(item => item.Артикул === product.Артикул);
        const maxQuantity = Math.min(product.В_наличии, 99);
        
        return `
            <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
                <div class="card h-100 product-card">
                    <div class="position-relative">
                        <img src="${product.Фото || 'images/default.jpg'}" class="card-img-top product-img" 
                             alt="${product.Модель}" 
                             onerror="this.onerror=null; this.src='images/default.jpg'">
                        ${product.В_наличии === 0 ? `
                            <div class="position-absolute top-0 start-0 m-2">
                                <span class="badge bg-danger">Под заказ</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="product-article small text-muted">Артикул: ${product.Артикул || 'не указан'}</div>
                        <h5 class="card-title">${product.Модель || 'Неизвестная модель'}</h5>
                        
                        <div class="mb-2">
                            ${product.Мощность ? `<span class="badge bg-primary me-1">${product.Мощность} кВт</span>` : ''}
                            ${product.Контуры === 'Двухконтурный' ? 
                                '<span class="badge bg-danger me-1">Двухконтурный</span>' : 
                                product.Контуры === 'Одноконтурный' ? '<span class="badge bg-secondary me-1">Одноконтурный</span>' : ''}
                            ${product.WiFi === 'Да' ? '<span class="badge bg-success">Wi-Fi</span>' : ''}
                        </div>
                        
                        <div class="price-section mb-3">
                            ${hasDiscount ? `
                                ${showOriginalPrices ? `<div class="original-price text-muted"><s>${(product.Цена || 0).toLocaleString('ru-RU')} руб.</s></div>` : ''}
                                <div class="discount-price text-danger fw-bold fs-5">${discountPrice.toLocaleString('ru-RU')} руб.</div>
                                ${currentDiscount > 0 ? `<small class="text-success">Экономия ${currentDiscount}%</small>` : ''}
                            ` : `
                                <div class="current-price text-primary fw-bold fs-5">${(product.Цена || 0).toLocaleString('ru-RU')} руб.</div>
                            `}
                        </div>
                        
                        <div class="mt-auto">
                            <div class="stock-status ${product.В_наличии > 0 ? 'in-stock' : 'out-of-stock'} mb-2">
                                <i class="bi ${product.В_наличии > 0 ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                                ${product.В_наличии > 0 ? `${product.В_наличии} шт. в наличии` : 'Под заказ'}
                            </div>
                            ${product.В_наличии > 0 ? `
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="product-quantity me-2">
                                        <input type="number" class="form-control form-control-sm" 
                                               id="quantity-${product.Артикул}" value="1" min="1" max="${maxQuantity}"
                                               style="width: 70px;">
                                    </div>
                                    <button class="btn btn-sm ${inCart ? 'btn-success' : 'btn-primary'} flex-grow-1" 
                                            onclick="addToCart('${product.Артикул}')">
                                        <i class="bi ${inCart ? 'bi-check' : 'bi-cart-plus'}"></i>
                                        ${inCart ? 'В корзине' : 'В корзину'}
                                    </button>
                                </div>
                            ` : `
                                <button class="btn btn-outline-secondary w-100" disabled>
                                    <i class="bi bi-clock"></i> Под заказ
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Добавляем чекбоксы сравнения
    if (typeof comparisonModule !== 'undefined' && typeof comparisonModule.addCheckboxesToProducts === 'function') {
        setTimeout(() => {
            comparisonModule.addCheckboxesToProducts();
        }, 100);
    }
    
    updateStatistics();
}

// Навигация
function showCatalog() {
    document.getElementById('catalog-section').classList.remove('hidden-section');
    document.getElementById('cart-section').classList.add('hidden-section');
    document.body.classList.remove('cart-open');
}

function showCart() {
    document.getElementById('catalog-section').classList.add('hidden-section');
    document.getElementById('cart-section').classList.remove('hidden-section');
    document.body.classList.add('cart-open');
    if (typeof updateCart === 'function') {
        updateCart();
    }
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px; max-width: 90%;';
    notification.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>${message}</span>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, начинаем инициализацию...');
    loadData();
    
    // Адаптивность для мобильных
    if (window.innerWidth < 769) {
        document.getElementById('filter-accordion-body')?.classList?.remove('show');
        document.getElementById('discount-accordion-body')?.classList?.remove('show');
    }
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 769) {
            document.getElementById('filter-accordion-body')?.classList?.add('show');
            document.getElementById('discount-accordion-body')?.classList?.add('show');
        }
    });
});

// Глобальные функции для HTML
function toggleFilters() {
    const accordionBody = document.getElementById('filter-accordion-body');
    const accordionSection = document.getElementById('filter-section');
    if (accordionBody) accordionBody.classList.toggle('show');
    if (accordionSection) accordionSection.classList.toggle('collapsed');
}

function toggleDiscounts() {
    const accordionBody = document.getElementById('discount-accordion-body');
    const accordionSection = document.getElementById('discount-section');
    if (accordionBody) accordionBody.classList.toggle('show');
    if (accordionSection) accordionSection.classList.toggle('collapsed');
}

// Функция проверки хранилища
function checkStorageStatus() {
    try {
        const testKey = 'storage_test';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.error('LocalStorage недоступен:', error);
        showNotification('LocalStorage недоступен. Некоторые функции могут не работать.', 'warning');
        return false;
    }
}

// Инициализация модулей
async function initModules() {
    console.log('Инициализация модулей...');
    
    // Проверяем доступность localStorage
    if (!checkStorageStatus()) {
        console.warn('LocalStorage недоступен. Функции сохранения отключены.');
    }

    // Инициализируем модуль сравнения
    if (typeof comparisonModule !== 'undefined' && typeof comparisonModule.init === 'function') {
        try {
            comparisonModule.init();
            console.log('Модуль сравнения инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации модуля сравнения:', error);
        }
    }

    // Инициализируем модуль сохранения корзины
    if (typeof cartStorage !== 'undefined' && typeof cartStorage.init === 'function') {
        try {
            cartStorage.init();
            console.log('Модуль сохранения корзины инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации модуля сохранения корзины:', error);
        }
    }

    // Инициализируем модуль мини-корзины
    if (typeof miniCart !== 'undefined' && typeof miniCart.init === 'function') {
        try {
            miniCart.init();
            console.log('Модуль мини-корзины инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации модуля мини-корзины:', error);
        }
    }

    // Инициализируем систему рекомендаций
    if (typeof recommendationsSystem !== 'undefined' && typeof recommendationsSystem.init === 'function') {
        try {
            recommendationsSystem.init();
            console.log('Система рекомендаций инициализирована');
        } catch (error) {
            console.error('Ошибка инициализации системы рекомендаций:', error);
        }
    }

    // Инициализируем touch-интерфейс
    if (typeof touchInterface !== 'undefined' && typeof touchInterface.init === 'function') {
        try {
            touchInterface.init();
            console.log('Touch-интерфейс инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации touch-интерфейса:', error);
        }
    }

    // Инициализируем систему уведомлений
    if (typeof notificationSystem !== 'undefined' && typeof notificationSystem.init === 'function') {
        try {
            await notificationSystem.init();
            console.log('Система уведомлений инициализирована');
        } catch (error) {
            console.error('Ошибка инициализации системы уведомлений:', error);
        }
    }
    
    console.log('Все модули инициализированы');
}

// Глобальные функции для доступа из HTML
window.showCatalog = showCatalog;
window.showCart = showCart;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;
window.updateDiscount = updateDiscount;
window.toggleOriginalPrices = toggleOriginalPrices;
window.showNotification = showNotification;
window.initModules = initModules;

// Автоматическая инициализация после загрузки
setTimeout(() => {
    if (typeof initModules === 'function') {
        initModules();
    }
}, 2000);