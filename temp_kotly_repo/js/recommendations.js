// modules/recommendations.js - Система рекомендаций "С этим товаром покупают"
class RecommendationsSystem {
    constructor() {
        this.currentPosition = 0;
        this.visibleItems = 4;
        this.recommendations = [];
        this.isLoading = false;
    }

    // Инициализация модуля
    init() {
        this.setupEventListeners();
        this.calculateVisibleItems();
        console.log('Система рекомендаций инициализирована');
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Обработчики навигации
        document.addEventListener('click', (e) => {
            if (e.target.closest('.recommendations-prev')) {
                this.prev();
            } else if (e.target.closest('.recommendations-next')) {
                this.next();
            } else if (e.target.closest('.recommendations-dot')) {
                const index = Array.from(e.target.closest('.recommendations-dots').children).indexOf(e.target.closest('.recommendations-dot'));
                this.goToSlide(index);
            }
        });

        // Адаптация к изменению размера окна
        window.addEventListener('resize', () => {
            this.calculateVisibleItems();
            this.updateSlider();
        });

        // Отслеживание просмотра товаров
        this.setupProductViewTracking();
    }

    // Расчет количества видимых элементов
    calculateVisibleItems() {
        const width = window.innerWidth;
        if (width < 768) this.visibleItems = 1;
        else if (width < 992) this.visibleItems = 2;
        else if (width < 1200) this.visibleItems = 3;
        else this.visibleItems = 4;
    }

    // Отслеживание просмотра товаров
    setupProductViewTracking() {
        let viewedProducts = new Set();

        // Перехватываем рендеринг товаров
        const originalRenderProducts = window.renderProducts;
        window.renderProducts = () => {
            originalRenderProducts();
            this.trackProductViews();
        };

        // Отслеживаем клики по товарам
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const articleElement = card.querySelector('.product-article');
                if (articleElement) {
                    const article = articleElement.textContent.replace('Артикул: ', '').trim();
                    viewedProducts.add(article);
                    
                    // Показываем рекомендации после просмотра 2+ товаров
                    if (viewedProducts.size >= 2) {
                        this.showRecommendations(Array.from(viewedProducts));
                    }
                }
            }
        });
    }

    // Показать рекомендации
    async showRecommendations(viewedProductArticles) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showSkeleton();

        try {
            // Получаем рекомендации на основе просмотренных товаров
            this.recommendations = this.generateRecommendations(viewedProductArticles);
            
            if (this.recommendations.length > 0) {
                this.renderRecommendations();
                this.showRecommendationsSection();
            }
        } catch (error) {
            console.error('Ошибка получения рекомендаций:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // Генерация рекомендаций
    generateRecommendations(viewedProductArticles) {
        if (!allProducts || allProducts.length === 0) return [];

        const viewedProducts = allProducts.filter(p => 
            viewedProductArticles.includes(p.Артикул)
        );

        if (viewedProducts.length === 0) return [];

        // Анализируем просмотренные товары
        const categories = new Set();
        const powerLevels = new Set();
        const contours = new Set();

        viewedProducts.forEach(product => {
            categories.add(this.getProductCategory(product));
            powerLevels.add(this.getPowerLevel(product.Мощность));
            if (product.Контуры) contours.add(product.Контуры);
        });

        // Фильтруем рекомендации
        let recommendations = allProducts.filter(product => {
            // Исключаем просмотренные товары
            if (viewedProductArticles.includes(product.Артикул)) return false;

            const productCategory = this.getProductCategory(product);
            const productPowerLevel = this.getPowerLevel(product.Мощность);

            // Балльная система совпадений
            let score = 0;

            // Совпадение категории
            if (categories.has(productCategory)) score += 3;

            // Совпадение уровня мощности
            if (powerLevels.has(productPowerLevel)) score += 2;

            // Совпадение контуров
            if (contours.has(product.Контуры)) score += 2;

            // Наличие товара
            if (product.В_наличии > 0) score += 1;

            // Wi-Fi функция
            if (viewedProducts.some(p => p.WiFi === 'Да') && product.WiFi === 'Да') score += 1;

            return score >= 3; // Минимальный порог для рекомендации
        });

        // Сортируем по баллам и наличию
        recommendations.sort((a, b) => {
            // Сначала по наличию
            if (a.В_наличии > 0 && b.В_наличии === 0) return -1;
            if (a.В_наличии === 0 && b.В_наличии > 0) return 1;

            // Затем по релевантности (можно добавить сложную логику)
            return b.Цена - a.Цена; // Более дорогие товары сначала
        });

        return recommendations.slice(0, 12); // Ограничиваем количество
    }

    // Определение категории товара
    getProductCategory(product) {
        const model = product.Модель.toLowerCase();
        if (model.includes('meteor')) return 'meteor';
        if (model.includes('laggartt') || model.includes('газ')) return 'laggartt';
        if (model.includes('devotion')) return 'devotion';
        if (model.includes('mk')) return 'mk';
        return 'other';
    }

    // Определение уровня мощности
    getPowerLevel(power) {
        const powerValue = parseInt(power) || 0;
        if (powerValue <= 20) return 'low';
        if (powerValue <= 30) return 'medium';
        return 'high';
    }

    // Показать скелетон-загрузку
    showSkeleton() {
        const skeletonHTML = `
            <div class="recommendations-section">
                <div class="recommendations-header">
                    <h3 class="recommendations-title">
                        <i class="bi bi-lightning-charge"></i>
                        Подбираем рекомендации...
                    </h3>
                </div>
                <div class="recommendations-container">
                    <div class="recommendations-track">
                        ${Array.from({ length: 4 }, () => `
                            <div class="recommendation-card recommendation-skeleton">
                                <div class="skeleton-image"></div>
                                <div class="skeleton-text medium"></div>
                                <div class="skeleton-text short"></div>
                                <div class="skeleton-price"></div>
                                <div class="skeleton-button"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.insertAdjacentHTML('afterend', skeletonHTML);
        }
    }

    // Показать секцию рекомендаций
    showRecommendationsSection() {
        const existingSection = document.querySelector('.recommendations-section');
        if (existingSection) {
            existingSection.remove();
        }

        if (this.recommendations.length === 0) return;

        const recommendationsHTML = `
            <div class="recommendations-section">
                <div class="recommendations-header">
                    <h3 class="recommendations-title">
                        <i class="bi bi-lightning-charge"></i>
                        С этим товаром покупают
                    </h3>
                    <div class="recommendations-controls">
                        <button class="recommendations-nav-btn recommendations-prev" disabled>
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <button class="recommendations-nav-btn recommendations-next">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="recommendations-container">
                    <div class="recommendations-track">
                        ${this.recommendations.map(product => this.renderRecommendationProduct(product)).join('')}
                    </div>
                </div>
                <div class="recommendations-dots">
                    ${Array.from({ length: Math.ceil(this.recommendations.length / this.visibleItems) }, (_, i) => `
                        <div class="recommendations-dot ${i === 0 ? 'active' : ''}"></div>
                    `).join('')}
                </div>
            </div>
        `;

        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.insertAdjacentHTML('afterend', recommendationsHTML);
        }

        this.updateNavigation();
    }

    // Рендер карточки рекомендации
    renderRecommendationProduct(product) {
        const discountPrice = calculateDiscountPrice(product.Цена, currentDiscount);
        const hasDiscount = currentDiscount > 0;
        const isInComparison = typeof comparisonModule !== 'undefined' && 
                              comparisonModule.comparedItems.includes(product.Артикул);

        return `
            <div class="recommendation-card">
                ${product.В_наличии > 5 ? '<span class="recommendation-badge">Популярный</span>' : ''}
                
                <img src="${product.Фото}" 
                     alt="${product.Модель}" 
                     class="recommendation-image"
                     onerror="this.onerror=null; this.src='images/default.jpg'">
                
                <div class="recommendation-name">${product.Модель}</div>
                
                <div class="recommendation-price">
                    <div class="recommendation-current-price">
                        ${discountPrice.toLocaleString('ru-RU')} руб.
                    </div>
                    ${hasDiscount ? `
                        <div class="recommendation-original-price">
                            ${product.Цена.toLocaleString('ru-RU')} руб.
                        </div>
                        <div class="recommendation-save">
                            Экономия ${currentDiscount}%
                        </div>
                    ` : ''}
                </div>
                
                <div class="recommendation-stock ${product.В_наличии > 0 ? 'in-stock' : 'out-of-stock'}">
                    <i class="bi ${product.В_наличии > 0 ? 'bi-check-circle' : 'bi-x-circle'}"></i>
                    ${product.В_наличии > 0 ? `${product.В_наличии} шт.` : 'Под заказ'}
                </div>
                
                <div class="recommendation-actions">
                    <button class="recommendation-add-btn" onclick="addToCart('${product.Артикул}')">
                        <i class="bi bi-cart-plus"></i>
                        В корзину
                    </button>
                    <button class="recommendation-compare-btn ${isInComparison ? 'active' : ''}" 
                            onclick="addToComparison('${product.Артикул}')">
                        <i class="bi bi-bar-chart"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Навигация
    next() {
        const maxPosition = this.recommendations.length - this.visibleItems;
        if (this.currentPosition < maxPosition) {
            this.currentPosition++;
            this.updateSlider();
        }
    }

    prev() {
        if (this.currentPosition > 0) {
            this.currentPosition--;
            this.updateSlider();
        }
    }

    goToSlide(index) {
        this.currentPosition = index * this.visibleItems;
        this.updateSlider();
    }

    // Обновление слайдера
    updateSlider() {
        const track = document.querySelector('.recommendations-track');
        const dots = document.querySelectorAll('.recommendations-dot');
        const prevBtn = document.querySelector('.recommendations-prev');
        const nextBtn = document.querySelector('.recommendations-next');

        if (!track) return;

        const itemWidth = track.children[0].offsetWidth + 20; // width + gap
        track.style.transform = `translateX(-${this.currentPosition * itemWidth}px)`;

        // Обновляем кнопки навигации
        if (prevBtn) {
            prevBtn.disabled = this.currentPosition === 0;
        }
        if (nextBtn) {
            const maxPosition = this.recommendations.length - this.visibleItems;
            nextBtn.disabled = this.currentPosition >= maxPosition;
        }

        // Обновляем точки
        if (dots.length > 0) {
            const activeDotIndex = Math.floor(this.currentPosition / this.visibleItems);
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === activeDotIndex);
            });
        }
    }

    // Обновление состояния навигации
    updateNavigation() {
        this.updateSlider();
    }

    // Обновление рекомендаций при изменении данных
    refresh() {
        if (this.recommendations.length > 0) {
            this.showRecommendationsSection();
        }
    }
}

// Создаем экземпляр системы рекомендаций
const recommendationsSystem = new RecommendationsSystem();

// Глобальные функции
function refreshRecommendations() {
    recommendationsSystem.refresh();
}

// Интеграция с основным приложением
document.addEventListener('DOMContentLoaded', () => {
    // Отслеживаем изменения фильтров для обновления рекомендаций
    const originalFilterProducts = window.filterProducts;
    window.filterProducts = function() {
        originalFilterProducts();
        setTimeout(() => recommendationsSystem.refresh(), 100);
    };

    // Обновляем рекомендации при изменении скидки
    const originalUpdateDiscount = window.updateDiscount;
    window.updateDiscount = function(value) {
        originalUpdateDiscount(value);
        recommendationsSystem.refresh();
    };
});