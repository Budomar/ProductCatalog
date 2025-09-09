// modules/comparison.js - Модуль сравнения товаров (исправленная версия)
class ComparisonModule {
    constructor() {
        this.maxItems = 4;
        this.comparedItems = [];
        this.notificationTimeout = null;
    }

    // Инициализация модуля
    init() {
        this.loadFromStorage();
        this.updateBadge();
        this.setupEventListeners();
        console.log('Модуль сравнения инициализирован');
        
        // Добавляем чекбоксы после загрузки товаров
        setTimeout(() => {
            this.addCheckboxesToProducts();
        }, 1500);
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('productComparison');
            if (saved) {
                this.comparedItems = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Ошибка загрузки сравнения:', error);
            this.comparedItems = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('productComparison', JSON.stringify(this.comparedItems));
        } catch (error) {
            console.error('Ошибка сохранения сравнения:', error);
        }
    }

    updateBadge() {
        const badge = document.getElementById('compare-badge');
        if (badge) {
            badge.textContent = this.comparedItems.length;
            badge.style.display = this.comparedItems.length > 0 ? 'flex' : 'none';
        }
    }

    setupEventListeners() {
        // Обработчик для кликов по чекбоксам
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('compare-checkbox')) {
                const article = e.target.dataset.article;
                if (article) {
                    if (e.target.checked) {
                        this.addToComparison(article);
                    } else {
                        this.removeFromComparison(article);
                    }
                }
            }

            if (e.target.classList.contains('compare-remove')) {
                const article = e.target.dataset.article;
                if (article) {
                    this.removeFromComparison(article);
                }
            }
        });

        // Обработчик для изменений чекбоксов
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('compare-checkbox')) {
                const article = e.target.dataset.article;
                if (article) {
                    if (e.target.checked) {
                        this.addToComparison(article);
                    } else {
                        this.removeFromComparison(article);
                    }
                }
            }
        });
    }

    addCheckboxesToProducts() {
        // Удаляем старые чекбоксы, если они есть
        const oldCheckboxes = document.querySelectorAll('.compare-checkbox-container');
        oldCheckboxes.forEach(checkbox => checkbox.remove());
        
        // Добавляем новые чекбоксы
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const articleElement = card.querySelector('.product-article');
            if (articleElement) {
                const articleText = articleElement.textContent.replace('Артикул:', '').trim();
                
                // Создаем контейнер для чекбокса
                const checkboxContainer = document.createElement('div');
                checkboxContainer.className = 'compare-checkbox-container';
                checkboxContainer.style.position = 'absolute';
                checkboxContainer.style.top = '10px';
                checkboxContainer.style.left = '10px';
                checkboxContainer.style.zIndex = '10';

                // Создаем чекбокс
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'compare-checkbox form-check-input';
                checkbox.dataset.article = articleText;
                checkbox.checked = this.comparedItems.includes(articleText);
                checkbox.style.cursor = 'pointer';
                checkbox.style.width = '20px';
                checkbox.style.height = '20px';

                // Добавляем подсказку
                checkbox.title = 'Добавить к сравнению';

                checkboxContainer.appendChild(checkbox);
                
                // Убеждаемся, что карточка имеет относительное позиционирование
                card.style.position = 'relative';
                
                // Добавляем чекбокс в карточку
                card.appendChild(checkboxContainer);
            }
        });
    }

    addToComparison(productArticle) {
        if (this.comparedItems.length >= this.maxItems) {
            this.showNotification(`Можно сравнивать не более ${this.maxItems} товаров`, 'warning');
            // Снимаем выделение с чекбокса
            this.updateProductCheckbox(productArticle, false);
            return false;
        }

        if (this.comparedItems.includes(productArticle)) {
            this.removeFromComparison(productArticle);
            return false;
        }

        const product = window.allProducts.find(p => p.Артикул === productArticle);
        if (!product) {
            this.showNotification('Товар не найден', 'error');
            this.updateProductCheckbox(productArticle, false);
            return false;
        }

        this.comparedItems.push(productArticle);
        this.saveToStorage();
        this.updateBadge();
        this.updateProductCheckbox(productArticle, true);

        this.showNotification(
            `Товар добавлен к сравнению (${this.comparedItems.length}/${this.maxItems})`, 
            'success'
        );

        return true;
    }

    removeFromComparison(productArticle) {
        this.comparedItems = this.comparedItems.filter(item => item !== productArticle);
        this.saveToStorage();
        this.updateBadge();
        this.updateProductCheckbox(productArticle, false);
        this.showNotification('Товар удален из сравнения', 'info');
    }

    clearComparison() {
        // Снимаем выделение со всех чекбоксов
        this.comparedItems.forEach(article => {
            this.updateProductCheckbox(article, false);
        });

        this.comparedItems = [];
        this.saveToStorage();
        this.updateBadge();

        // Закрываем модальное окно, если оно открыто
        const modalElement = document.getElementById('compareModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }

        this.showNotification('Сравнение очищено', 'info');
    }

    updateProductCheckbox(article, checked) {
        const checkbox = document.querySelector(`.compare-checkbox[data-article="${article}"]`);
        if (checkbox) {
            checkbox.checked = checked;
        }
    }

    showComparison() {
        if (this.comparedItems.length === 0) {
            this.showNotification('Добавьте товары для сравнения', 'warning');
            return;
        }

        const productsToCompare = this.comparedItems.map(article => 
            window.allProducts.find(p => p.Артикул === article)
        ).filter(Boolean);

        if (productsToCompare.length === 0) {
            this.showNotification('Товары для сравнения не найдены', 'error');
            return;
        }

        this.renderComparisonTable(productsToCompare);
        
        // Показываем модальное окно
        const modalElement = document.getElementById('compareModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    renderComparisonTable(products) {
        const container = document.getElementById('compare-container');
        
        if (!container) {
            console.error('Контейнер для сравнения не найден');
            return;
        }

        if (products.length === 0) {
            container.innerHTML = '<p class="text-center text-muted py-4">Нет товаров для сравнения</p>';
            return;
        }

        const features = [
            { name: 'Изображение', key: 'image' },
            { name: 'Модель', key: 'Модель' },
            { name: 'Артикул', key: 'Артикул' },
            { name: 'Цена', key: 'Цена' },
            { name: 'Мощность', key: 'Мощность' },
            { name: 'Контуры', key: 'Контуры' },
            { name: 'Wi-Fi', key: 'WiFi' },
            { name: 'Наличие', key: 'В_наличии' }
        ];

        let html = `
            <div class="table-responsive">
                <table class="table table-bordered compare-table">
                    <thead class="table-light">
                        <tr>
                            <th>Характеристика</th>
                            ${products.map(product => `
                                <th class="compare-product text-center">
                                    <div class="d-flex flex-column align-items-center">
                                        <img src="${product.Фото || 'images/default.jpg'}" alt="${product.Модель}" 
                                             onerror="this.onerror=null; this.src='images/default.jpg'" 
                                             class="img-fluid mb-2" style="max-height: 80px;">
                                        <div class="fw-bold">${product.Модель}</div>
                                        <small class="text-muted">${product.Артикул}</small>
                                        <div class="mt-2">
                                            <button class="btn btn-sm btn-outline-danger compare-remove" 
                                                    data-article="${product.Артикул}" 
                                                    title="Удалить из сравнения">
                                                <i class="bi bi-x-circle"></i> Удалить
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        features.forEach(feature => {
            html += `<tr><td class="compare-feature fw-bold">${feature.name}</td>`;
            
            products.forEach(product => {
                let value = '';
                
                if (feature.key === 'image') {
                    value = `<img src="${product.Фото || 'images/default.jpg'}" alt="${product.Модель}" 
                                 onerror="this.onerror=null; this.src='images/default.jpg'"
                                 style="max-height: 60px;">`;
                } else if (feature.key === 'Цена') {
                    value = `${(product[feature.key] || 0).toLocaleString('ru-RU')} руб.`;
                } else if (feature.key === 'В_наличии') {
                    value = product[feature.key] > 0 ? 
                           `<span class="text-success fw-bold">${product[feature.key]} шт.</span>` : 
                           '<span class="text-danger">Под заказ</span>';
                } else {
                    value = product[feature.key] || '—';
                }
                
                html += `<td class="compare-value text-center">${value}</td>`;
            });
            
            html += '</tr>';
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3 text-center">
                <small class="text-muted">
                    <i class="bi bi-info-circle"></i> 
                    Для добавления товаров в сравнение отметьте чекбоксы на карточках товаров
                </small>
            </div>
        `;

        container.innerHTML = html;
    }

    showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        const existingNotification = document.querySelector('.compare-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `compare-notification alert alert-${type} position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 1060; min-width: 300px; max-width: 400px;';
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${message}</span>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        document.body.appendChild(notification);

        // Автоматическое скрытие через 3 секунды
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Создаем экземпляр модуля
const comparisonModule = new ComparisonModule();

// Глобальные функции для HTML
function showComparison() {
    comparisonModule.showComparison();
}

function clearComparison() {
    comparisonModule.clearComparison();
}

console.log('Модуль сравнения загружен');