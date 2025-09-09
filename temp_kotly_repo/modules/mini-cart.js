// modules/mini-cart.js - Модуль всплывающей корзины (исправленная версия)
class MiniCart {
    constructor() {
        this.isVisible = false;
        this.clickOutsideHandler = null;
        this.resizeHandler = null;
        this.initialized = false;
        this.cartUpdateHandler = null;
    }

    // Инициализация модуля
    init() {
        if (this.initialized) return;
        
        try {
            this.createMiniCart();
            this.setupEventListeners();
            this.initialized = true;
            console.log('Модуль всплывающей корзины инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации мини-корзины:', error);
        }
    }

    // Создание DOM-структуры мини-корзины
    createMiniCart() {
        try {
            // Проверяем, не создана ли уже мини-корзина
            if (document.querySelector('.mini-cart')) {
                console.log('Мини-корзина уже существует');
                return;
            }

            // Создаем бэкдроп
            const backdrop = document.createElement('div');
            backdrop.className = 'mini-cart-backdrop';
            backdrop.addEventListener('click', () => this.hide());

            // Создаем контейнер мини-корзины
            const miniCart = document.createElement('div');
            miniCart.className = 'mini-cart';
            miniCart.innerHTML = `
                <div class="mini-cart-header">
                    <h5 class="mini-cart-title">
                        <i class="bi bi-cart3 me-2"></i>Корзина
                        <span class="badge bg-primary ms-2" id="mini-cart-count">0</span>
                    </h5>
                    <button class="mini-cart-close" aria-label="Закрыть корзину">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="mini-cart-body">
                    <div class="mini-cart-empty">
                        <div class="mini-cart-empty-icon">
                            <i class="bi bi-cart-x"></i>
                        </div>
                        <p>Корзина пуста</p>
                        <button class="btn btn-primary mt-2" onclick="showCatalog(); miniCart.hide();">
                            Перейти в каталог
                        </button>
                    </div>
                    <ul class="mini-cart-items" style="display: none;"></ul>
                </div>
                <div class="mini-cart-footer" style="display: none;">
                    <div class="mini-cart-total mb-2">
                        <span class="mini-cart-total-label">Итого:</span>
                        <span class="mini-cart-total-price">0 руб.</span>
                    </div>
                    <div class="mini-cart-discount mb-2" style="display: none;">
                        <span class="mini-cart-discount-label">Скидка:</span>
                        <span class="mini-cart-discount-value text-success">0 руб.</span>
                    </div>
                    <div class="mini-cart-actions">
                        <button class="mini-cart-btn mini-cart-btn-secondary" onclick="showCatalog(); miniCart.hide();">
                            <i class="bi bi-arrow-left"></i> В каталог
                        </button>
                        <button class="mini-cart-btn mini-cart-btn-primary" onclick="showCart(); miniCart.hide();">
                            <i class="bi bi-cart-check"></i> Оформить
                        </button>
                    </div>
                </div>
            `;

            // Добавляем в DOM
            document.body.appendChild(backdrop);
            document.body.appendChild(miniCart);

            // Настраиваем обработчик закрытия
            const closeBtn = miniCart.querySelector('.mini-cart-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hide());
            }

            // Добавляем обработчик для предотвращения закрытия при клике внутри корзины
            miniCart.addEventListener('click', (e) => {
                e.stopPropagation();
            });

        } catch (error) {
            console.error('Ошибка создания мини-корзины:', error);
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        try {
            // Перехватываем клик по кнопке корзины в навигации
            const cartButtons = document.querySelectorAll('.nav-icon-btn, .btn[onclick*="showCart"], .btn[onclick*="toggleMiniCart"]');
            cartButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggle();
                });
            });

            // Закрытие по ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible) {
                    this.hide();
                }
            });

            // Закрытие при ресайзе (на мобильных)
            this.resizeHandler = () => {
                if (window.innerWidth >= 769 && this.isVisible) {
                    this.hide();
                }
            };
            window.addEventListener('resize', this.resizeHandler);

            // Обновление при изменении корзины
            this.cartUpdateHandler = () => {
                if (this.isVisible) {
                    this.updateMiniCart();
                }
                this.updateCartBadge(window.cart.reduce((sum, item) => sum + item.quantity, 0));
            };

            // Слушаем custom event обновления корзины
            document.addEventListener('cartUpdated', this.cartUpdateHandler);

        } catch (error) {
            console.error('Ошибка настройки обработчиков мини-корзины:', error);
        }
    }

    // Показать/скрыть мини-корзину
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // Показать мини-корзину
    show() {
        try {
            this.updateMiniCart();
            
            const miniCart = document.querySelector('.mini-cart');
            const backdrop = document.querySelector('.mini-cart-backdrop');
            
            if (!miniCart || !backdrop) {
                console.error('Элементы мини-корзины не найдены');
                return;
            }
            
            miniCart.classList.add('show');
            backdrop.classList.add('show');
            this.isVisible = true;

            // Блокируем прокрутку body
            document.body.style.overflow = 'hidden';
            document.body.classList.add('mini-cart-open');

            // Фокус на корзине для accessibility
            setTimeout(() => {
                miniCart.focus();
            }, 100);

            // Обработчик клика вне области
            this.clickOutsideHandler = (e) => {
                if (!miniCart.contains(e.target) && 
                    !e.target.closest('.nav-icon-btn') &&
                    !e.target.closest('.btn[onclick*="showCart"]') &&
                    !e.target.closest('.btn[onclick*="toggleMiniCart"]')) {
                    this.hide();
                }
            };
            
            document.addEventListener('click', this.clickOutsideHandler);

            // Генерируем событие открытия мини-корзины
            const event = new CustomEvent('miniCartOpened');
            document.dispatchEvent(event);

        } catch (error) {
            console.error('Ошибка показа мини-корзины:', error);
        }
    }

    // Скрыть мини-корзину
    hide() {
        try {
            const miniCart = document.querySelector('.mini-cart');
            const backdrop = document.querySelector('.mini-cart-backdrop');
            
            if (miniCart) miniCart.classList.remove('show');
            if (backdrop) backdrop.classList.remove('show');
            
            this.isVisible = false;

            // Восстанавливаем прокрутку
            document.body.style.overflow = '';
            document.body.classList.remove('mini-cart-open');

            // Убираем обработчики
            if (this.clickOutsideHandler) {
                document.removeEventListener('click', this.clickOutsideHandler);
            }

            // Генерируем событие закрытия мини-корзины
            const event = new CustomEvent('miniCartClosed');
            document.dispatchEvent(event);

        } catch (error) {
            console.error('Ошибка скрытия мини-корзины:', error);
        }
    }

    // Обновление содержимого мини-корзины
    updateMiniCart() {
        try {
            const itemsContainer = document.querySelector('.mini-cart-items');
            const emptyState = document.querySelector('.mini-cart-empty');
            const footer = document.querySelector('.mini-cart-footer');
            const totalPrice = document.querySelector('.mini-cart-total-price');
            const discountElement = document.querySelector('.mini-cart-discount');
            const discountValue = document.querySelector('.mini-cart-discount-value');
            const cartCount = document.querySelector('#mini-cart-count');

            if (!itemsContainer || !emptyState || !footer) {
                console.error('Элементы мини-корзины не найдены');
                return;
            }

            // Обновляем счетчик товаров
            const totalItems = window.cart.reduce((sum, item) => sum + item.quantity, 0);
            if (cartCount) {
                cartCount.textContent = totalItems;
            }

            if (window.cart.length === 0) {
                emptyState.style.display = 'flex';
                itemsContainer.style.display = 'none';
                footer.style.display = 'none';
                return;
            }

            // Показываем элементы
            emptyState.style.display = 'none';
            itemsContainer.style.display = 'block';
            footer.style.display = 'block';

            // Рассчитываем итоги
            const total = window.cart.reduce((sum, item) => sum + (item.discountPrice * item.quantity), 0);
            const originalTotal = window.cart.reduce((sum, item) => sum + (item.Цена * item.quantity), 0);
            const totalDiscount = originalTotal - total;

            // Обновляем товары
            itemsContainer.innerHTML = window.cart.map(item => `
                <li class="mini-cart-item">
                    <img src="${item.Фото || 'images/default.jpg'}" 
                         alt="${item.Модель}" 
                         class="mini-cart-item-image"
                         onerror="this.onerror=null; this.src='images/default.jpg'">
                    <div class="mini-cart-item-info">
                        <div class="mini-cart-item-name">${item.Модель}</div>
                        <div class="mini-cart-item-article">Артикул: ${item.Артикул}</div>
                        <div class="mini-cart-item-details">
                            <span class="mini-cart-item-price">${item.discountPrice.toLocaleString('ru-RU')} руб.</span>
                            <div class="mini-cart-item-quantity">
                                <button class="mini-cart-quantity-btn" 
                                        onclick="updateCartItem('${item.Артикул}', ${item.quantity - 1}); event.stopPropagation();">−</button>
                                <input type="number" 
                                       class="mini-cart-quantity-input" 
                                       value="${item.quantity}" 
                                       onchange="updateCartItem('${item.Артикул}', this.value)" 
                                       min="1"
                                       max="${item.В_наличии}">
                                <button class="mini-cart-quantity-btn" 
                                        onclick="updateCartItem('${item.Артикул}', ${item.quantity + 1}); event.stopPropagation();">+</button>
                                <button class="mini-cart-item-remove" 
                                        onclick="removeFromCart('${item.Артикул}'); event.stopPropagation();">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </li>
            `).join('');

            // Обновляем итоговую сумму
            if (totalPrice) {
                totalPrice.textContent = `${total.toLocaleString('ru-RU')} руб.`;
            }

            // Обновляем скидку
            if (discountElement && discountValue) {
                if (totalDiscount > 0) {
                    discountElement.style.display = 'flex';
                    discountValue.textContent = `-${totalDiscount.toLocaleString('ru-RU')} руб.`;
                } else {
                    discountElement.style.display = 'none';
                }
            }

        } catch (error) {
            console.error('Ошибка обновления мини-корзины:', error);
        }
    }

    // Обновление бейджа на иконке корзины
    updateCartBadge(count) {
        try {
            let badge = document.querySelector('.cart-icon-badge');
            
            if (!badge) {
                const cartBtn = document.querySelector('.navbar-nav .btn-outline-light, .nav-icon-btn');
                if (!cartBtn) return;
                
                const icon = cartBtn.querySelector('i');
                if (!icon) return;
                
                // Создаем обертку для иконки
                const iconWrapper = document.createElement('span');
                iconWrapper.className = 'cart-icon-with-badge';
                iconWrapper.innerHTML = icon.outerHTML;
                
                // Создаем бейдж
                badge = document.createElement('span');
                badge.className = 'cart-icon-badge';
                badge.textContent = count;
                
                iconWrapper.appendChild(badge);
                cartBtn.replaceChild(iconWrapper, icon);
            } else {
                badge.textContent = count;
            }

            // Скрываем бейдж если корзина пуста
            badge.style.display = count > 0 ? 'flex' : 'none';

            // Анимация при изменении
            if (count > 0) {
                badge.classList.add('pulse-animation');
                setTimeout(() => badge.classList.remove('pulse-animation'), 500);
            }

        } catch (error) {
            console.error('Ошибка обновления бейджа корзины:', error);
        }
    }

    // Показать уведомление о добавлении в корзину
    showAddToCartNotification(productName, quantity) {
        try {
            // Удаляем старые уведомления
            const oldNotifications = document.querySelectorAll('.add-to-cart-notification');
            oldNotifications.forEach(notification => notification.remove());

            const notification = document.createElement('div');
            notification.className = 'add-to-cart-notification alert alert-success position-fixed';
            notification.style.cssText = 'top: 20px; right: 20px; z-index: 1070; min-width: 300px; max-width: 90%;';
            notification.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <div class="flex-grow-1">
                        <div class="fw-bold">Товар добавлен в корзину</div>
                        <small class="text-muted">${productName} × ${quantity}</small>
                    </div>
                    <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.remove()"></button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Анимация появления
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            // Автоматическое скрытие
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, 3000);

        } catch (error) {
            console.error('Ошибка показа уведомления:', error);
        }
    }
}

// Создаем экземпляр модуля
const miniCart = new MiniCart();

// Глобальные функции для управления мини-корзиной
function showMiniCart() {
    if (typeof miniCart !== 'undefined' && typeof miniCart.show === 'function') {
        miniCart.show();
    }
}

function hideMiniCart() {
    if (typeof miniCart !== 'undefined' && typeof miniCart.hide === 'function') {
        miniCart.hide();
    }
}

function toggleMiniCart() {
    if (typeof miniCart !== 'undefined' && typeof miniCart.toggle === 'function') {
        miniCart.toggle();
    }
}

console.log('Модуль мини-корзины загружен');