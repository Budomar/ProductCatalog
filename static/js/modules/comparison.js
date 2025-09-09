/**
 * Product Comparison Module
 * Handles product comparison functionality
 */

class ComparisonModule {
    constructor() {
        this.comparison = [];
        this.maxItems = 4;
        this.isInitialized = false;
    }

    /**
     * Initialize the comparison module
     */
    async init() {
        this.loadComparison();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('Comparison module initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Comparison button click
        const comparisonBtn = document.getElementById('comparisonBtn');
        if (comparisonBtn) {
            comparisonBtn.addEventListener('click', () => {
                this.showComparison();
            });
        }
    }

    /**
     * Add product to comparison
     */
    addToComparison(productId) {
        const product = window.app?.getProduct(productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }

        if (this.comparison.includes(productId)) {
            this.showNotification('Товар уже добавлен к сравнению', 'warning');
            return;
        }

        if (this.comparison.length >= this.maxItems) {
            this.showNotification(`Можно сравнить максимум ${this.maxItems} товара`, 'warning');
            return;
        }

        this.comparison.push(productId);
        this.saveComparison();
        this.updateComparisonDisplay();
        this.showNotification(`"${product.name}" добавлен к сравнению`, 'success');
        
        // Trigger comparison updated event
        document.dispatchEvent(new CustomEvent('comparisonUpdated', {
            detail: { comparison: this.comparison }
        }));
    }

    /**
     * Remove product from comparison
     */
    removeFromComparison(productId) {
        const index = this.comparison.indexOf(productId);
        if (index > -1) {
            const product = window.app?.getProduct(productId);
            this.comparison.splice(index, 1);
            this.saveComparison();
            this.updateComparisonDisplay();
            
            if (product) {
                this.showNotification(`"${product.name}" удален из сравнения`, 'info');
            }
            
            document.dispatchEvent(new CustomEvent('comparisonUpdated', {
                detail: { comparison: this.comparison }
            }));
        }
    }

    /**
     * Clear all comparison
     */
    clearComparison() {
        this.comparison = [];
        this.saveComparison();
        this.updateComparisonDisplay();
        this.showNotification('Список сравнения очищен', 'info');
        
        document.dispatchEvent(new CustomEvent('comparisonUpdated', {
            detail: { comparison: this.comparison }
        }));
    }

    /**
     * Get comparison item count
     */
    getItemCount() {
        return this.comparison.length;
    }

    /**
     * Update comparison display
     */
    updateComparisonDisplay() {
        // Update comparison checkboxes in product cards
        document.querySelectorAll('.comparison-check').forEach(checkbox => {
            const productId = parseInt(checkbox.dataset.productId);
            checkbox.checked = this.comparison.includes(productId);
        });
    }

    /**
     * Show comparison modal
     */
    showComparison() {
        if (this.comparison.length === 0) {
            this.showNotification('Добавьте товары для сравнения', 'warning');
            return;
        }

        const products = this.comparison.map(id => window.app?.getProduct(id)).filter(Boolean);
        
        if (products.length === 0) {
            this.showNotification('Товары для сравнения не найдены', 'error');
            return;
        }

        const modal = document.getElementById('comparisonModal');
        const content = document.getElementById('comparisonContent');
        
        if (content) {
            content.innerHTML = this.generateComparisonTable(products);
        }

        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    /**
     * Generate comparison table HTML
     */
    generateComparisonTable(products) {
        // Get all unique specifications
        const allSpecs = new Set();
        products.forEach(product => {
            if (product.specifications) {
                Object.keys(product.specifications).forEach(spec => allSpecs.add(spec));
            }
        });

        const specsArray = Array.from(allSpecs);

        return `
            <div class="comparison-table">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6>Сравнение ${products.length} товаров</h6>
                    <button class="btn btn-outline-danger btn-sm" onclick="app.modules.comparison.clearComparison()">
                        <i class="fas fa-trash"></i> Очистить все
                    </button>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <tbody>
                            <!-- Product Images -->
                            <tr>
                                <td class="fw-bold">Изображение</td>
                                ${products.map(product => `
                                    <td class="text-center">
                                        ${product.image_url 
                                            ? `<img src="${product.image_url}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover;">`
                                            : `<div class="bg-light d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                                                 <i class="fas fa-image text-muted"></i>
                                               </div>`
                                        }
                                    </td>
                                `).join('')}
                            </tr>
                            
                            <!-- Product Names -->
                            <tr>
                                <td class="fw-bold">Название</td>
                                ${products.map(product => `
                                    <td>
                                        <strong>${product.name}</strong>
                                        <div class="mt-2">
                                            <button class="btn btn-outline-danger btn-sm" 
                                                    onclick="app.modules.comparison.removeFromComparison(${product.id})">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </td>
                                `).join('')}
                            </tr>
                            
                            <!-- Prices -->
                            <tr>
                                <td class="fw-bold">Цена</td>
                                ${products.map(product => `
                                    <td>
                                        <span class="h5 text-success">${product.price.toLocaleString()} ₽</span>
                                    </td>
                                `).join('')}
                            </tr>
                            
                            <!-- Stock Status -->
                            <tr>
                                <td class="fw-bold">Наличие</td>
                                ${products.map(product => `
                                    <td>
                                        ${product.in_stock 
                                            ? '<span class="badge bg-success">В наличии</span>'
                                            : '<span class="badge bg-danger">Нет в наличии</span>'
                                        }
                                    </td>
                                `).join('')}
                            </tr>
                            
                            <!-- Description -->
                            <tr>
                                <td class="fw-bold">Описание</td>
                                ${products.map(product => `
                                    <td><small>${product.description || 'Нет описания'}</small></td>
                                `).join('')}
                            </tr>
                            
                            <!-- Specifications -->
                            ${specsArray.map(spec => `
                                <tr>
                                    <td class="fw-bold">${spec}</td>
                                    ${products.map(product => `
                                        <td>${product.specifications?.[spec] || '-'}</td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                            
                            <!-- Actions -->
                            <tr>
                                <td class="fw-bold">Действия</td>
                                ${products.map(product => `
                                    <td>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-success btn-sm" 
                                                    onclick="app.modules.cart?.addToCart(${product.id})"
                                                    ${!product.in_stock ? 'disabled' : ''}>
                                                <i class="fas fa-cart-plus"></i> В корзину
                                            </button>
                                            <button class="btn btn-outline-primary btn-sm" 
                                                    onclick="app.viewProduct(${product.id})">
                                                <i class="fas fa-eye"></i> Подробнее
                                            </button>
                                        </div>
                                    </td>
                                `).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Comparison Summary -->
                <div class="mt-3">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Средняя цена: ${(products.reduce((sum, p) => sum + p.price, 0) / products.length).toLocaleString()} ₽</h6>
                        </div>
                        <div class="col-md-6">
                            <h6>В наличии: ${products.filter(p => p.in_stock).length} из ${products.length}</h6>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Save comparison to localStorage
     */
    saveComparison() {
        try {
            localStorage.setItem('catalog_comparison', JSON.stringify(this.comparison));
        } catch (error) {
            console.error('Error saving comparison:', error);
        }
    }

    /**
     * Load comparison from localStorage
     */
    loadComparison() {
        try {
            const savedComparison = localStorage.getItem('catalog_comparison');
            if (savedComparison) {
                this.comparison = JSON.parse(savedComparison);
            }
        } catch (error) {
            console.error('Error loading comparison:', error);
            this.comparison = [];
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.app?.modules?.notifications) {
            window.app.modules.notifications.show(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Get comparison data for external use
     */
    getComparison() {
        return [...this.comparison];
    }

    /**
     * Check if product is in comparison
     */
    isInComparison(productId) {
        return this.comparison.includes(productId);
    }

    /**
     * Get recommendations based on compared products
     */
    getComparisonRecommendations() {
        if (this.comparison.length === 0) return [];

        const products = this.comparison.map(id => window.app?.getProduct(id)).filter(Boolean);
        const categories = [...new Set(products.map(p => p.category))];
        
        // Get products from same categories that are not in comparison
        const allProducts = window.app?.products || [];
        return allProducts
            .filter(p => categories.includes(p.category) && !this.comparison.includes(p.id))
            .slice(0, 4);
    }
}

// Export for use in other modules
window.ComparisonModule = ComparisonModule;
