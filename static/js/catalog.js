/**
 * Main Catalog Application
 * Coordinates all modules and manages the overall application state
 */

class CatalogApp {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.categories = [];
        this.currentView = 'grid';
        this.currentFilters = {
            category: '',
            search: '',
            inStockOnly: true,
            sort: 'name'
        };
        
        this.modules = {};
        this.isLoading = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Catalog App...');
        
        // Initialize modules
        await this.initializeModules();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadData();
        
        // Load existing cart and comparison
        this.modules.cart?.loadCart();
        this.modules.comparison?.loadComparison();
        
        console.log('Catalog App initialized successfully');
    }

    /**
     * Initialize all modules
     */
    async initializeModules() {
        try {
            // Initialize modules in dependency order
            if (typeof CartModule !== 'undefined') {
                this.modules.cart = new CartModule();
                await this.modules.cart.init();
            }

            if (typeof ComparisonModule !== 'undefined') {
                this.modules.comparison = new ComparisonModule();
                await this.modules.comparison.init();
            }

            if (typeof ViewToggleModule !== 'undefined') {
                this.modules.viewToggle = new ViewToggleModule();
                await this.modules.viewToggle.init();
            }

            if (typeof SearchFilterModule !== 'undefined') {
                this.modules.searchFilter = new SearchFilterModule();
                await this.modules.searchFilter.init();
            }

            if (typeof RecommendationsModule !== 'undefined') {
                this.modules.recommendations = new RecommendationsModule();
                await this.modules.recommendations.init();
            }

            if (typeof AnalyticsModule !== 'undefined') {
                this.modules.analytics = new AnalyticsModule();
                await this.modules.analytics.init();
            }

            if (typeof SocialSharingModule !== 'undefined') {
                this.modules.socialSharing = new SocialSharingModule();
                await this.modules.socialSharing.init();
            }

            if (typeof MobileTouchModule !== 'undefined') {
                this.modules.mobileTouch = new MobileTouchModule();
                await this.modules.mobileTouch.init();
            }

            if (typeof NotificationsModule !== 'undefined') {
                this.modules.notifications = new NotificationsModule();
                await this.modules.notifications.init();
            }

            if (typeof DeliveryCalculatorModule !== 'undefined') {
                this.modules.deliveryCalculator = new DeliveryCalculatorModule();
                await this.modules.deliveryCalculator.init();
            }
        } catch (error) {
            console.error('Error initializing modules:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentFilters.search = e.target.value;
                this.filterProducts();
            }, 300));
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentFilters.search = searchInput.value;
                this.filterProducts();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.filterProducts();
            });
        }

        // Sort functionality
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.filterProducts();
            });
        }

        // In stock filter
        const inStockOnly = document.getElementById('inStockOnly');
        if (inStockOnly) {
            inStockOnly.addEventListener('change', (e) => {
                this.currentFilters.inStockOnly = e.target.checked;
                this.filterProducts();
            });
        }

        // Module events
        document.addEventListener('cartUpdated', () => this.updateCartDisplay());
        document.addEventListener('comparisonUpdated', () => this.updateComparisonDisplay());
        document.addEventListener('viewChanged', (e) => this.handleViewChange(e.detail.view));
    }

    /**
     * Load data from API
     */
    async loadData() {
        this.showLoading();
        
        try {
            // Load products
            const productsResponse = await fetch('/api/products');
            if (!productsResponse.ok) {
                throw new Error(`HTTP error! status: ${productsResponse.status}`);
            }
            
            this.products = await productsResponse.json();
            this.filteredProducts = [...this.products];

            // Load categories
            const categoriesResponse = await fetch('/api/categories');
            if (categoriesResponse.ok) {
                this.categories = await categoriesResponse.json();
                this.populateCategories();
            }

            // Load promotions
            await this.loadPromotions();

            // Filter and display products
            this.filterProducts();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Не удалось загрузить данные каталога. Пожалуйста, обновите страницу.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Load and display promotions
     */
    async loadPromotions() {
        try {
            const response = await fetch('/api/promotions');
            if (response.ok) {
                const promotions = await response.json();
                this.displayPromotions(promotions);
            }
        } catch (error) {
            console.error('Error loading promotions:', error);
        }
    }

    /**
     * Display promotions banner
     */
    displayPromotions(promotions) {
        const banner = document.getElementById('promotionsBanner');
        if (!banner || promotions.length === 0) return;

        const carousel = document.createElement('div');
        carousel.className = 'carousel slide';
        carousel.id = 'promotionsCarousel';
        carousel.setAttribute('data-bs-ride', 'carousel');

        const carouselInner = document.createElement('div');
        carouselInner.className = 'carousel-inner';

        promotions.forEach((promotion, index) => {
            const item = document.createElement('div');
            item.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            
            item.innerHTML = `
                <div class="alert alert-info text-center mb-0">
                    <h5>${promotion.title}</h5>
                    <p class="mb-0">${promotion.description}</p>
                    ${promotion.discount_percentage ? `<strong>Скидка ${promotion.discount_percentage}%</strong>` : ''}
                </div>
            `;
            
            carouselInner.appendChild(item);
        });

        carousel.appendChild(carouselInner);

        if (promotions.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'carousel-control-prev';
            prevBtn.type = 'button';
            prevBtn.setAttribute('data-bs-target', '#promotionsCarousel');
            prevBtn.setAttribute('data-bs-slide', 'prev');
            prevBtn.innerHTML = '<span class="carousel-control-prev-icon"></span>';

            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-control-next';
            nextBtn.type = 'button';
            nextBtn.setAttribute('data-bs-target', '#promotionsCarousel');
            nextBtn.setAttribute('data-bs-slide', 'next');
            nextBtn.innerHTML = '<span class="carousel-control-next-icon"></span>';

            carousel.appendChild(prevBtn);
            carousel.appendChild(nextBtn);
        }

        banner.appendChild(carousel);
    }

    /**
     * Populate categories dropdown
     */
    populateCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categoriesMenu = document.getElementById('categoriesMenu');
        
        if (categoryFilter) {
            // Clear existing options except "All categories"
            while (categoryFilter.children.length > 1) {
                categoryFilter.removeChild(categoryFilter.lastChild);
            }
            
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }

        if (categoriesMenu) {
            categoriesMenu.innerHTML = '';
            
            const allItem = document.createElement('li');
            allItem.innerHTML = '<a class="dropdown-item" href="#" onclick="app.setCategory(\'\')">Все категории</a>';
            categoriesMenu.appendChild(allItem);
            
            this.categories.forEach(category => {
                const item = document.createElement('li');
                item.innerHTML = `<a class="dropdown-item" href="#" onclick="app.setCategory('${category}')">${category}</a>`;
                categoriesMenu.appendChild(item);
            });
        }
    }

    /**
     * Set category filter
     */
    setCategory(category) {
        this.currentFilters.category = category;
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = category;
        }
        this.filterProducts();
    }

    /**
     * Filter products based on current filters
     */
    filterProducts() {
        let filtered = [...this.products];

        // Apply category filter
        if (this.currentFilters.category) {
            filtered = filtered.filter(product => product.category === this.currentFilters.category);
        }

        // Apply search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }

        // Apply stock filter
        if (this.currentFilters.inStockOnly) {
            filtered = filtered.filter(product => product.in_stock);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.currentFilters.sort) {
                case 'price':
                    return a.price - b.price;
                case 'views':
                    return b.views_count - a.views_count;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        this.filteredProducts = filtered;
        this.displayProducts();
        this.updateProductsCount();
    }

    /**
     * Display products in the grid
     */
    displayProducts() {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!grid) return;

        if (this.filteredProducts.length === 0) {
            grid.innerHTML = '';
            emptyState?.classList.remove('d-none');
            return;
        }

        emptyState?.classList.add('d-none');
        
        grid.innerHTML = this.filteredProducts.map(product => this.createProductCard(product)).join('');
        
        // Initialize product interactions
        this.initializeProductInteractions();
    }

    /**
     * Create product card HTML
     */
    createProductCard(product) {
        const inComparisonClass = this.modules.comparison?.isInComparison(product.id) ? 'checked' : '';
        const stockBadge = product.in_stock 
            ? '<span class="badge bg-success">В наличии</span>'
            : '<span class="badge bg-danger">Нет в наличии</span>';

        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card h-100" data-product-id="${product.id}">
                    <div class="product-image position-relative">
                        ${product.image_url 
                            ? `<img src="${product.image_url}" alt="${product.name}" class="card-img-top">`
                            : `<div class="card-img-top d-flex align-items-center justify-content-center bg-light">
                                 <i class="fas fa-image fa-3x text-muted"></i>
                               </div>`
                        }
                        <div class="comparison-checkbox">
                            <input type="checkbox" class="form-check-input comparison-check" 
                                   data-product-id="${product.id}" ${inComparisonClass}>
                        </div>
                        ${stockBadge}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title">${product.name}</h6>
                        <p class="card-text flex-grow-1 small text-muted">${product.description || ''}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="h5 mb-0 text-success">${product.price.toLocaleString()} ₽</span>
                            <div class="btn-group">
                                <button class="btn btn-outline-primary btn-sm view-product-btn" 
                                        data-product-id="${product.id}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-success btn-sm add-to-cart-btn" 
                                        data-product-id="${product.id}"
                                        ${!product.in_stock ? 'disabled' : ''}>
                                    <i class="fas fa-cart-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="social-share-buttons">
                            <button class="btn btn-outline-secondary btn-sm share-btn" 
                                    data-product-id="${product.id}" 
                                    data-share-type="vk">
                                <i class="fab fa-vk"></i>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm share-btn" 
                                    data-product-id="${product.id}" 
                                    data-share-type="telegram">
                                <i class="fab fa-telegram"></i>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm share-btn" 
                                    data-product-id="${product.id}" 
                                    data-share-type="whatsapp">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                        </div>
                        <small class="text-muted mt-2">
                            <i class="fas fa-eye"></i> ${product.views_count || 0} просмотров
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize product interactions
     */
    initializeProductInteractions() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                this.modules.cart?.addToCart(productId);
            });
        });

        // View product buttons
        document.querySelectorAll('.view-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                this.viewProduct(productId);
            });
        });

        // Comparison checkboxes
        document.querySelectorAll('.comparison-check').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const productId = parseInt(checkbox.dataset.productId);
                if (checkbox.checked) {
                    this.modules.comparison?.addToComparison(productId);
                } else {
                    this.modules.comparison?.removeFromComparison(productId);
                }
            });
        });

        // Social sharing buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                const shareType = btn.dataset.shareType;
                this.modules.socialSharing?.shareProduct(productId, shareType);
            });
        });

        // Product card clicks
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = parseInt(card.dataset.productId);
                this.viewProduct(productId);
            });
        });
    }

    /**
     * View product details
     */
    async viewProduct(productId) {
        try {
            const response = await fetch(`/api/product/${productId}`);
            if (response.ok) {
                const product = await response.json();
                this.modules.analytics?.trackProductView(productId);
                
                // Load recommendations
                if (this.modules.recommendations) {
                    await this.modules.recommendations.loadRecommendations(productId);
                }
                
                // Show product modal or navigate to product page
                this.showProductModal(product);
            }
        } catch (error) {
            console.error('Error viewing product:', error);
        }
    }

    /**
     * Show product modal
     */
    showProductModal(product) {
        // Create and show modal with product details
        const modalHtml = `
            <div class="modal fade" id="productModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${product.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    ${product.image_url 
                                        ? `<img src="${product.image_url}" alt="${product.name}" class="img-fluid">`
                                        : `<div class="bg-light p-5 text-center">
                                             <i class="fas fa-image fa-4x text-muted"></i>
                                           </div>`
                                    }
                                </div>
                                <div class="col-md-6">
                                    <p class="text-muted">${product.description || ''}</p>
                                    <h3 class="text-success">${product.price.toLocaleString()} ₽</h3>
                                    ${product.in_stock 
                                        ? '<span class="badge bg-success mb-3">В наличии</span>'
                                        : '<span class="badge bg-danger mb-3">Нет в наличии</span>'
                                    }
                                    
                                    ${product.specifications ? `
                                        <h6>Характеристики:</h6>
                                        <ul>
                                            ${Object.entries(product.specifications).map(([key, value]) => 
                                                `<li><strong>${key}:</strong> ${value}</li>`
                                            ).join('')}
                                        </ul>
                                    ` : ''}
                                    
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-success" onclick="app.modules.cart?.addToCart(${product.id})" 
                                                ${!product.in_stock ? 'disabled' : ''}>
                                            <i class="fas fa-cart-plus"></i> Добавить в корзину
                                        </button>
                                        <button class="btn btn-outline-info" onclick="app.modules.comparison?.addToComparison(${product.id})">
                                            <i class="fas fa-balance-scale"></i> Добавить к сравнению
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div id="recommendationsContainer" class="mt-4">
                                <!-- Recommendations will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('productModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM and show
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();

        // Clean up modal when hidden
        document.getElementById('productModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('productModal').remove();
        });
    }

    /**
     * Update products count display
     */
    updateProductsCount() {
        const counter = document.getElementById('productsCount');
        if (counter) {
            counter.textContent = `Найдено товаров: ${this.filteredProducts.length}`;
        }
    }

    /**
     * Update cart display
     */
    updateCartDisplay() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount && this.modules.cart) {
            const count = this.modules.cart.getItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    /**
     * Update comparison display
     */
    updateComparisonDisplay() {
        const comparisonBtn = document.getElementById('comparisonBtn');
        const comparisonCount = document.getElementById('comparisonCount');
        
        if (comparisonBtn && comparisonCount && this.modules.comparison) {
            const count = this.modules.comparison.getItemCount();
            comparisonCount.textContent = count;
            comparisonBtn.disabled = count === 0;
        }
    }

    /**
     * Handle view change
     */
    handleViewChange(view) {
        this.currentView = view;
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.className = `row g-4 view-${view}`;
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {
            category: '',
            search: '',
            inStockOnly: true,
            sort: 'name'
        };

        // Reset form elements
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortSelect = document.getElementById('sortSelect');
        const inStockOnly = document.getElementById('inStockOnly');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (sortSelect) sortSelect.value = 'name';
        if (inStockOnly) inStockOnly.checked = true;

        this.filterProducts();
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.isLoading = true;
        const loading = document.getElementById('loadingIndicator');
        const grid = document.getElementById('productsGrid');
        const error = document.getElementById('errorMessage');

        if (loading) loading.classList.remove('d-none');
        if (grid) grid.innerHTML = '';
        if (error) error.classList.add('d-none');
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.isLoading = false;
        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.classList.add('d-none');
    }

    /**
     * Show error message
     */
    showError(message) {
        const error = document.getElementById('errorMessage');
        if (error) {
            error.querySelector('p').textContent = message;
            error.classList.remove('d-none');
        }
    }

    /**
     * Get product by ID
     */
    getProduct(productId) {
        return this.products.find(p => p.id === productId);
    }

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for template usage
window.clearFilters = () => {
    if (window.app) {
        window.app.clearFilters();
    }
};

window.calculateDelivery = () => {
    if (window.app?.modules?.deliveryCalculator) {
        window.app.modules.deliveryCalculator.calculate();
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new CatalogApp();
    await window.app.init();
});
