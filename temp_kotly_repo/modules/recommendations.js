// modules/recommendations.js - Упрощенная система рекомендаций
class RecommendationsSystem {
    constructor() {
        this.recommendations = [];
        this.initialized = false;
    }

    // Инициализация модуля
    init() {
        if (this.initialized) return;
        
        try {
            this.setupEventListeners();
            this.initialized = true;
            console.log('Система рекомендаций инициализирована');
        } catch (error) {
            console.error('Ошибка инициализации системы рекомендаций:', error);
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Отслеживание добавления в корзину
        document.addEventListener('cartUpdated', () => {
            this.showRecommendations();
        });
    }

    // Показать рекомендации
    showRecommendations() {
        if (window.cart.length === 0) return;
        
        try {
            this.recommendations = this.generateRecommendations();
            
            if (this.recommendations.length > 0) {
                this.renderRecommendations();
            }
        } catch (error) {
            console.error('Ошибка показа рекомендаций:', error);
        }
    }

    // Генерация рекомендаций
    generateRecommendations() {
        if (!window.allProducts || window.allProducts.length === 0) return [];
        if (window.cart.length === 0) return [];

        // Простая логика: рекомендуем товары той же категории
        const cartCategories = new Set();
        
        window.cart.forEach(item => {
            const category = this.getProductCategory(item);
            cartCategories.add(category);
        });

        // Фильтруем товары не из корзины той же категории
        let recommendations = window.allProducts.filter(product => {
            // Исключаем товары уже в корзине
            if (window.cart.some(item => item.Артикул === product.Артикул)) return false;
            
            const productCategory = this.getProductCategory(product);
            return cartCategories.has(productCategory) && product.В_наличии > 0;
        });

        // Ограничиваем количество
        return recommendations.slice(0, 6);
    }

    // Определение категории товара
    getProductCategory(product) {
        const model = (product.Модель || '').toLowerCase();
        if (model.includes('meteor')) return 'meteor';
        if (model.includes('laggartt') || model.includes('газ')) return 'laggartt';
        if (model.includes('devotion')) return 'devotion';
        if (model.includes('mk')) return 'mk';
        return 'other';
    }

    // Рендер рекомендаций
    renderRecommendations() {
        // Удаляем старые рекомендации
        const oldSection = document.querySelector('.recommendations-section');
        if (oldSection) {
            oldSection.remove();
        }

        if (this.recommendations.length === 0) return;

        const recommendationsHTML = `
            <div class="recommendations-section mt-5">
                <div class="recommendations-header mb-4">
                    <h3 class="recommendations-title">
                        <i class="bi bi-lightning-charge text-warning"></i>
                        С этим товаром покупают
                    </h3>
                </div>
                <div class="row">
                    ${this.recommendations.map(product => `
                        <div class="col-md-6 col-lg-4 col-xl-2 mb-4">
                            <div class="card h-100">
                                <img src="${product.Фото || 'images/default.jpg'}" 
                                     class="card-img-top" 
                                     alt="${product.Модель}"
                                     style="height: 120px; object-fit: contain; padding: 10px;">
                                <div class="card-body">
                                    <h6 class="card-title" style="font-size: 0.9rem;">${product.Модель}</h6>
                                    <div class="price-section">
                                        <div class="fw-bold text-primary">
                                            ${this.calculateDiscountPrice(product.Цена, window.currentDiscount || 0).toLocaleString('ru-RU')} руб.
                                        </div>
                                    </div>
                                    <button class="btn btn-sm btn-primary w-100 mt-2" 
                                            onclick="addToCart('${product.Артикул}')">
                                        <i class="bi bi-cart-plus"></i> В корзину
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Добавляем после контейнера товаров
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.insertAdjacentHTML('afterend', recommendationsHTML);
        }
    }

    // Вспомогательная функция для расчета цены со скидкой
    calculateDiscountPrice(price, discount) {
        return Math.round(price * (1 - discount / 100));
    }
}

// Создаем экземпляр системы рекомендаций
const recommendationsSystem = new RecommendationsSystem();

console.log('Система рекомендаций загружена');