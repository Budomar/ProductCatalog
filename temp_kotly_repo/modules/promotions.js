// modules/promotions.js - Система управления акциями
class PromotionsSystem {
    constructor() {
        this.promotions = [];
        this.activePromotions = [];
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            await this.loadPromotions();
            this.applyPromotions();
            this.showPromotionBanner();
            this.initialized = true;
            console.log('Система акций инициализирована');
        } catch (error) {
            console.error('Ошибка загрузки акций:', error);
        }
    }

    async loadPromotions() {
        try {
            const response = await fetch('promotions.json');
            const data = await response.json();
            this.promotions = data.акции || [];
            
            // Фильтруем активные акции
            this.activePromotions = this.promotions.filter(promo => 
                promo.активна && this.isPromotionActive(promo)
            );
            
        } catch (error) {
            console.error('Ошибка загрузки акций:', error);
            this.promotions = [];
            this.activePromotions = [];
        }
    }

    isPromotionActive(promo) {
        const now = new Date();
        const start = new Date(promo.начало);
        const end = new Date(promo.окончание);
        return now >= start && now <= end;
    }

    applyPromotions() {
        if (!window.allProducts) return;

        // Применяем акции к товарам
        window.allProducts.forEach(product => {
            product.originalPrice = product.Цена; // Сохраняем оригинальную цену
            
            this.activePromotions.forEach(promo => {
                if (this.isProductEligible(product, promo)) {
                    product.акция = promo;
                    
                    if (promo.тип === 'скидка_на_категорию' || promo.тип === 'скидка_на_товар') {
                        const discount = promo.скидка || 0;
                        product.Цена = Math.round(product.originalPrice * (1 - discount / 100));
                    }
                }
            });
        });
    }

    isProductEligible(product, promo) {
        switch (promo.тип) {
            case 'скидка_на_категорию':
                const category = this.getProductCategory(product);
                return category === promo.категория;
                
            case 'скидка_на_бренд':
                return product.Производитель === promo.бренд;
                
            case 'скидка_на_товар':
                return product.Артикул === promo.артикул;
                
            default:
                return false;
        }
    }

    getProductCategory(product) {
        const model = (product.Модель || '').toLowerCase();
        if (model.includes('meteor')) return 'METEOR';
        if (model.includes('laggartt')) return 'LAGGARTT';
        if (model.includes('devotion')) return 'DEVOTION';
        if (model.includes('mk')) return 'MK';
        return 'OTHER';
    }

    showPromotionBanner() {
        if (this.activePromotions.length === 0) return;

        const bannerHTML = `
            <div class="promotion-banner alert alert-warning mb-4">
                <div class="d-flex align-items-center">
                    <i class="bi bi-megaphone fs-3 me-3"></i>
                    <div class="flex-grow-1">
                        <h5 class="mb-1">Акции недели!</h5>
                        <p class="mb-0">${this.activePromotions.map(p => p.название).join(' • ')}</p>
                    </div>
                    <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
                </div>
            </div>
        `;

        // Добавляем баннер после навигации
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.insertAdjacentHTML('afterend', bannerHTML);
        }
    }

    getCartPromotions(cartItems) {
        const cartTotal = cartItems.reduce((sum, item) => sum + (item.Цена * item.quantity), 0);
        const applicablePromotions = [];

        this.activePromotions.forEach(promo => {
            if (promo.тип === 'бесплатная_доставка' && cartTotal >= promo.минимальная_сумма) {
                applicablePromotions.push(promo);
            }
            
            if (promo.тип === 'подарок' && this.isCartEligibleForGift(cartItems, promo)) {
                applicablePromotions.push(promo);
            }
        });

        return applicablePromotions;
    }

    isCartEligibleForGift(cartItems, promo) {
        // Логика для определения eligibility подарка
        return true; // Заглушка
    }

    // Обновление цен при изменении скидки
    updatePricesWithPromotions() {
        if (!window.allProducts) return;

        window.allProducts.forEach(product => {
            // Восстанавливаем оригинальную цену
            if (product.originalPrice) {
                product.Цена = product.originalPrice;
            }
            
            // Применяем акции
            this.applyPromotions();
        });
    }
}

// Создаем экземпляр системы акций
const promotionsSystem = new PromotionsSystem();

// Интеграция с основной системой
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof promotionsSystem !== 'undefined' && typeof promotionsSystem.init === 'function') {
            promotionsSystem.init();
        }
    }, 2000);
});

console.log('Система акций загружена');