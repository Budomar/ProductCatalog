// js/cart.js - Функции корзины (исправленная версия)

// Глобальные переменные
let cart = [];

// Основные функции корзины
const cartFunctions = {
    // Базовая функция добавления в корзину
    addToCart: function(article) {
        try {
            console.log('Добавление в корзину:', article);
            
            // Находим товар в общем каталоге
            const product = window.allProducts.find(p => p.Артикул === article);
            if (!product) {
                console.error('Товар не найден:', article);
                this.showNotification('Товар не найден', 'error');
                return false;
            }

            // Получаем количество из input
            const quantityInput = document.getElementById(`quantity-${article}`);
            let quantity = 1;
            
            if (quantityInput) {
                quantity = Math.max(1, Math.min(product.В_наличии || 99, parseInt(quantityInput.value) || 1));
                // Сбрасываем значение input к 1 после добавления
                quantityInput.value = 1;
            }

            console.log('Количество:', quantity, 'Наличие:', product.В_наличии);

            // Проверяем доступность товара
            if (product.В_наличии === 0) {
                this.showNotification('Этот товар временно отсутствует', 'warning');
                return false;
            }

            // Проверяем, не превышает ли количество доступное наличие
            if (quantity > product.В_наличии) {
                this.showNotification(`Доступно только ${product.В_наличии} шт. этого товара`, 'warning');
                quantity = product.В_наличии;
            }

            // Ищем товар в корзине
            const existingItemIndex = cart.findIndex(item => item.Артикул === article);
            
            if (existingItemIndex !== -1) {
                // Товар уже в корзине - обновляем количество
                const newQuantity = cart[existingItemIndex].quantity + quantity;
                
                if (newQuantity > product.В_наличии) {
                    this.showNotification(`Нельзя добавить больше ${product.В_наличии} шт. этого товара`, 'warning');
                    cart[existingItemIndex].quantity = product.В_наличии;
                } else {
                    cart[existingItemIndex].quantity = newQuantity;
                }
                
                // Обновляем цену со скидкой
                cart[existingItemIndex].discountPrice = this.calculateDiscountPrice(product.Цена, window.currentDiscount);
                
            } else {
                // Новый товар - добавляем в корзину
                cart.push({
                    ...product,
                    quantity: quantity,
                    discountPrice: this.calculateDiscountPrice(product.Цена, window.currentDiscount),
                    addedAt: new Date().toISOString()
                });
            }

            // Обновляем интерфейс
            this.updateCartBadge();
            if (typeof window.renderProducts === 'function') {
                window.renderProducts();
            }
            
            // Показываем уведомление
            const message = quantity === 1 ? 
                `Товар добавлен в корзину` : 
                `${quantity} шт. товара добавлено в корзину`;
            
            this.showNotification(message, 'success');

            // Сохраняем корзину если модуль доступен
            if (typeof window.cartStorage !== 'undefined' && typeof window.cartStorage.saveCartToStorage === 'function') {
                window.cartStorage.saveCartToStorage();
            }

            // Обновляем мини-корзину если она видима
            if (typeof window.miniCart !== 'undefined' && typeof window.miniCart.updateMiniCart === 'function') {
                window.miniCart.updateMiniCart();
            }

            return true;

        } catch (error) {
            console.error('Ошибка при добавлении в корзину:', error);
            this.showNotification('Ошибка при добавлении в корзину', 'error');
            return false;
        }
    },

    // Обновление количества товара в корзине
    updateCartItem: function(article, newQuantity) {
        try {
            console.log('Обновление товара:', article, 'Количество:', newQuantity);
            
            const itemIndex = cart.findIndex(item => item.Артикул === article);
            if (itemIndex === -1) {
                console.error('Товар не найден в корзине:', article);
                return;
            }

            // Преобразуем в число и проверяем границы
            newQuantity = parseInt(newQuantity);
            if (isNaN(newQuantity) || newQuantity < 1) {
                newQuantity = 1;
            }

            // Проверяем доступное количество
            const product = window.allProducts.find(p => p.Артикул === article);
            if (product && newQuantity > product.В_наличии) {
                this.showNotification(`Доступно только ${product.В_наличии} шт. этого товара`, 'warning');
                newQuantity = product.В_наличии;
            }

            cart[itemIndex].quantity = newQuantity;

            // Обновляем интерфейс
            this.updateCart();
            this.updateCartBadge();

            // Сохраняем изменения
            if (typeof window.cartStorage !== 'undefined' && typeof window.cartStorage.saveCartToStorage === 'function') {
                window.cartStorage.saveCartToStorage();
            }

            // Обновляем мини-корзину если она видима
            if (typeof window.miniCart !== 'undefined' && typeof window.miniCart.updateMiniCart === 'function') {
                window.miniCart.updateMiniCart();
            }

        } catch (error) {
            console.error('Ошибка при обновлении корзины:', error);
            this.showNotification('Ошибка при обновлении корзины', 'error');
        }
    },

    // Удаление товара из корзины
    removeFromCart: function(article) {
        try {
            console.log('Удаление из корзины:', article);
            
            const itemIndex = cart.findIndex(item => item.Артикул === article);
            if (itemIndex === -1) {
                console.error('Товар не найден в корзине:', article);
                return;
            }

            const itemName = cart[itemIndex].Модель;
            cart.splice(itemIndex, 1);

            // Обновляем интерфейс
            this.updateCartBadge();
            this.updateCart();
            if (typeof window.renderProducts === 'function') {
                window.renderProducts();
            }
            
            this.showNotification(`Товар "${itemName}" удален из корзины`, 'info');

            // Сохраняем изменения
            if (typeof window.cartStorage !== 'undefined' && typeof window.cartStorage.saveCartToStorage === 'function') {
                window.cartStorage.saveCartToStorage();
            }

            // Обновляем мини-корзину
            if (typeof window.miniCart !== 'undefined' && typeof window.miniCart.updateMiniCart === 'function') {
                window.miniCart.updateMiniCart();
            }

        } catch (error) {
            console.error('Ошибка при удалении из корзины:', error);
            this.showNotification('Ошибка при удалении из корзины', 'error');
        }
    },

    // Обновление бейджа корзины
    updateCartBadge: function() {
        try {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const badge = document.getElementById('cart-badge');
            
            if (badge) {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'flex' : 'none';
                
                // Анимация при изменении
                if (totalItems > 0) {
                    badge.classList.add('pulse-animation');
                    setTimeout(() => badge.classList.remove('pulse-animation'), 500);
                }
            }

            // Обновляем кнопки в карточках товаров
            this.updateProductButtons();

        } catch (error) {
            console.error('Ошибка при обновлении бейджа корзины:', error);
        }
    },

    // Обновление кнопок в карточках товаров
    updateProductButtons: function() {
        const cards = document.querySelectorAll('.product-card');
        cards.forEach(card => {
            const articleElement = card.querySelector('.product-article');
            if (articleElement) {
                const article = articleElement.textContent.replace('Артикул:', '').trim();
                const inCart = cart.find(item => item.Артикул === article);
                const button = card.querySelector('.btn');
                
                if (button) {
                    if (inCart) {
                        button.classList.remove('btn-primary');
                        button.classList.add('btn-success');
                        button.innerHTML = '<i class="bi bi-check"></i> В корзине';
                    } else {
                        button.classList.remove('btn-success');
                        button.classList.add('btn-primary');
                        button.innerHTML = '<i class="bi bi-cart-plus"></i> В корзину';
                    }
                }
            }
        });
    },

    // Полное обновление корзины
    updateCart: function() {
        try {
            const container = document.getElementById('cart-items-container');
            if (!container) return;

            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const totalPrice = cart.reduce((sum, item) => sum + (item.Цена * item.quantity), 0);
            const totalDiscount = cart.reduce((sum, item) => sum + ((item.originalPrice - item.Цена) * item.quantity), 0);
            const finalPrice = totalPrice;

            // Проверяем акции для корзины
            let cartPromotions = [];
            if (typeof promotionsSystem !== 'undefined' && typeof promotionsSystem.getCartPromotions === 'function') {
                cartPromotions = promotionsSystem.getCartPromotions(cart);
            }

            // Обновляем итоговую информацию
            document.getElementById('cart-total-items').textContent = totalItems;
            document.getElementById('cart-total-price').textContent = totalPrice.toLocaleString('ru-RU') + ' руб.';
            document.getElementById('cart-total-discount').textContent = totalDiscount.toLocaleString('ru-RU') + ' руб.';
            document.getElementById('cart-final-price').textContent = finalPrice.toLocaleString('ru-RU') + ' руб.';

            // Рендерим товары в корзине
            if (cart.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-muted py-5">
                        <i class="bi bi-cart-x" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">Корзина пуста</h4>
                        <p class="mb-4">Добавьте товары из каталога</p>
                        <button class="btn btn-primary" onclick="showCatalog()">
                            <i class="bi bi-arrow-left"></i> Перейти в каталог
                        </button>
                    </div>
                `;
                return;
            }

            container.innerHTML = cart.map(item => {
                const itemTotal = item.discountPrice * item.quantity;
                const maxQuantity = Math.min(item.В_наличии, 99);

                return `
                    <div class="cart-item animate__animated animate__fadeIn">
                        <div class="row align-items-center">
                            <div class="col-3 col-md-2">
                                <img src="${item.Фото || 'images/default.jpg'}" class="img-fluid rounded" 
                                     alt="${item.Модель}" 
                                     onerror="this.onerror=null; this.src='images/default.jpg'"
                                     style="max-height: 80px; object-fit: contain;">
                            </div>
                            <div class="col-9 col-md-4">
                                <h6 class="mb-1">${item.Модель}</h6>
                                <div class="text-muted small">Артикул: ${item.Артикул}</div>
                                <div class="mt-1">
                                    ${item.Мощность ? `<span class="badge bg-primary me-1">${item.Мощность} кВт</span>` : ''}
                                    ${item.Контуры ? `<span class="badge bg-secondary me-1">${item.Контуры}</span>` : ''}
                                </div>
                            </div>
                            <div class="col-6 col-md-2 mt-2 mt-md-0">
                                <div class="fw-bold text-primary">${item.discountPrice.toLocaleString('ru-RU')} руб.</div>
                                ${window.currentDiscount > 0 ? `
                                    <small class="text-muted text-decoration-line-through">
                                        ${item.Цена.toLocaleString('ru-RU')} руб.
                                    </small>
                                ` : ''}
                            </div>
                            <div class="col-6 col-md-2 mt-2 mt-md-0">
                                <div class="quantity-control d-flex align-items-center">
                                    <button class="btn btn-sm btn-outline-secondary quantity-btn" 
                                            onclick="cartFunctions.updateCartItem('${item.Артикул}', ${item.quantity - 1})"
                                            ${item.quantity <= 1 ? 'disabled' : ''}>
                                        <i class="bi bi-dash"></i>
                                    </button>
                                    <input type="number" class="form-control form-control-sm quantity-input mx-1" 
                                           value="${item.quantity}" 
                                           onchange="cartFunctions.updateCartItem('${item.Артикул}', this.value)" 
                                           min="1" max="${maxQuantity}"
                                           style="width: 50px; text-align: center;">
                                    <button class="btn btn-sm btn-outline-secondary quantity-btn" 
                                            onclick="cartFunctions.updateCartItem('${item.Артикул}', ${item.quantity + 1})"
                                            ${item.quantity >= maxQuantity ? 'disabled' : ''}>
                                        <i class="bi bi-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-6 col-md-2 mt-2 mt-md-0 text-end">
                                <div class="fw-bold mb-1">${itemTotal.toLocaleString('ru-RU')} руб.</div>
                                <button class="btn btn-sm btn-outline-danger" 
                                        onclick="cartFunctions.removeFromCart('${item.Артикул}')"
                                        title="Удалить из корзины">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Добавляем блок с акциями
            if (cartPromotions.length > 0) {
                const promotionsHTML = `
                    <div class="cart-promotions alert alert-success mt-3">
                        <h6><i class="bi bi-gift"></i> Ваши акции:</h6>
                        ${cartPromotions.map(promo => `
                            <div class="promotion-item">
                                <i class="bi bi-check-circle-fill text-success"></i>
                                ${promo.название}
                            </div>
                        `).join('')}
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', promotionsHTML);
            }

        } catch (error) {
            console.error('Ошибка при обновлении корзины:', error);
            this.showNotification('Ошибка при отображении корзины', 'error');
        }
    },

    // Отправка запроса (счет или КП)
    sendRequest: function(type) {
        try {
            if (cart.length === 0) {
                this.showNotification('Корзина пуста', 'warning');
                return;
            }

            const requestType = type === 'invoice' ? 'Счёт' : 'Коммерческое предложение';
            
            // Формируем сообщение
            let message = `Запрос ${requestType}\n\n`;
            message += `Товары в корзине:\n`;
            message += cart.map(item => 
                `• ${item.Модель} (${item.Артикул}) - ${item.quantity} шт. x ${item.discountPrice} руб. = ${(item.discountPrice * item.quantity).toLocaleString('ru-RU')} руб.`
            ).join('\n');
            
            message += `\n\nИтого: ${document.getElementById('cart-final-price').textContent}`;
            message += `\n\nДата: ${new Date().toLocaleString('ru-RU')}`;

            // В реальном приложении здесь был бы AJAX-запрос на сервер
            console.log('Отправка запроса:', message);
            
            // Показываем уведомление об успехе
            this.showNotification(`Запрос ${requestType} отправлен! Менеджер свяжется с вами в ближайшее время.`, 'success');
            
            // Очищаем корзину после отправки
            this.clearCart();

        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
            this.showNotification('Ошибка при отправке запроса', 'error');
        }
    },

    // Очистка корзины
    clearCart: function() {
        cart = [];
        this.updateCartBadge();
        this.updateCart();
        if (typeof window.renderProducts === 'function') {
            window.renderProducts();
        }
        
        // Очищаем хранилище
        if (typeof window.cartStorage !== 'undefined' && typeof window.cartStorage.clearCartStorage === 'function') {
            window.cartStorage.clearCartStorage();
        }
        
        this.showNotification('Корзина очищена', 'info');
    },

    // Вспомогательная функция для расчета цены со скидкой
    calculateDiscountPrice: function(price, discount) {
        return Math.round(price * (1 - discount / 100));
    },

    // Показ уведомления
    showNotification: function(message, type = 'info') {
        try {
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
        } catch (error) {
            console.error('Ошибка показа уведомления:', error);
        }
    }
};

// Делаем функции глобальными - ИСПРАВЛЕННАЯ ЧАСТЬ!
window.addToCart = cartFunctions.addToCart;
window.updateCartItem = cartFunctions.updateCartItem;
window.removeFromCart = cartFunctions.removeFromCart;
window.updateCartBadge = cartFunctions.updateCartBadge;
window.updateCart = cartFunctions.updateCart;
window.clearCart = cartFunctions.clearCart;
window.sendRequest = cartFunctions.sendRequest;
window.calculateDiscountPrice = cartFunctions.calculateDiscountPrice;
window.showNotification = cartFunctions.showNotification;

console.log('Функции корзины загружены');