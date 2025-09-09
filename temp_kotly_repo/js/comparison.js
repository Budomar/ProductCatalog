// js/comparison.js - Базовые функции сравнения (исправленная версия)

let comparedProducts = [];

const comparisonFunctions = {
    // Добавление товара к сравнению
    addToComparison: function(article) {
        try {
            if (comparedProducts.length >= 4) {
                this.showNotification('Можно сравнивать не более 4 товаров', 'warning');
                return false;
            }

            const product = window.allProducts.find(p => p.Артикул === article);
            if (!product) {
                this.showNotification('Товар не найден', 'error');
                return false;
            }

            if (comparedProducts.includes(article)) {
                this.removeFromComparison(article);
                return false;
            }

            comparedProducts.push(article);
            this.updateComparisonBadge();
            this.showNotification(`Товар добавлен к сравнению (${comparedProducts.length}/4)`, 'success');
            
            // Обновляем чекбоксы
            this.updateComparisonCheckboxes();
            
            return true;
        } catch (error) {
            console.error('Ошибка добавления к сравнению:', error);
            return false;
        }
    },

    // Удаление товара из сравнения
    removeFromComparison: function(article) {
        comparedProducts = comparedProducts.filter(item => item !== article);
        this.updateComparisonBadge();
        this.showNotification('Товар удален из сравнения', 'info');
        this.updateComparisonCheckboxes();
    },

    // Очистка сравнения
    clearComparison: function() {
        comparedProducts = [];
        this.updateComparisonBadge();
        this.showNotification('Сравнение очищено', 'info');
        this.updateComparisonCheckboxes();
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('compareModal'));
        if (modal) {
            modal.hide();
        }
    },

    // Обновление бейджа сравнения
    updateComparisonBadge: function() {
        const badge = document.getElementById('compare-badge');
        if (badge) {
            badge.textContent = comparedProducts.length;
            badge.style.display = comparedProducts.length > 0 ? 'flex' : 'none';
        }
    },

    // Обновление чекбоксов сравнения
    updateComparisonCheckboxes: function() {
        document.querySelectorAll('.compare-checkbox').forEach(checkbox => {
            const article = checkbox.dataset.article;
            checkbox.checked = comparedProducts.includes(article);
        });
    },

    // Показ сравнения
    showComparison: function() {
        if (comparedProducts.length === 0) {
            this.showNotification('Добавьте товары для сравнения', 'warning');
            return;
        }

        const productsToCompare = comparedProducts.map(article => 
            window.allProducts.find(p => p.Артикул === article)
        ).filter(Boolean);

        if (productsToCompare.length === 0) {
            this.showNotification('Товары для сравнения не найдены', 'error');
            return;
        }

        this.renderComparisonTable(productsToCompare);
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('compareModal'));
        modal.show();
    },

    // Рендер таблицы сравнения
    renderComparisonTable: function(products) {
        const container = document.getElementById('compare-container');
        if (!container) return;

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
                                            <button class="btn btn-sm btn-outline-danger" 
                                                    onclick="removeFromComparison('${product.Артикул}')" 
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
        `;

        container.innerHTML = html;
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

// Делаем функции глобальными
Object.keys(comparisonFunctions).forEach(key => {
    window[key] = comparisonFunctions[key];
});

console.log('Функции сравнения загружены');