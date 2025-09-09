/**
 * Product Recommendations Module
 * Handles recommendation engine and related products display
 */

class RecommendationsModule {
    constructor() {
        this.recommendationsCache = new Map();
        this.viewHistory = [];
        this.purchaseHistory = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the recommendations module
     */
    async init() {
        this.loadViewHistory();
        this.loadPurchaseHistory();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('Recommendations module initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for product views to update recommendations
        document.addEventListener('productViewed', (e) => {
            this.trackProductView(e.detail.productId);
        });

        // Listen for cart additions to improve recommendations
        document.addEventListener('cartUpdated', (e) => {
            this.updateRecommendationsFromCart(e.detail.cart);
        });
    }

    /**
     * Load recommendations for a specific product
     */
    async loadRecommendations(productId, container = null) {
        try {
            // Check cache first
            if (this.recommendationsCache.has(productId)) {
                const cached = this.recommendationsCache.get(productId);
                if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
                    this.displayRecommendations(cached.data, container);
                    return cached.data;
                }
            }

            // Fetch from API
            const response = await fetch(`/api/recommendations/${productId}`);
            if (response.ok) {
                const recommendations = await response.json();
                
                // Cache the results
                this.recommendationsCache.set(productId, {
                    data: recommendations,
                    timestamp: Date.now()
                });

                // Enhance with behavioral recommendations
                const enhancedRecommendations = await this.enhanceRecommendations(productId, recommendations);
                
                this.displayRecommendations(enhancedRecommendations, container);
                return enhancedRecommendations;
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
            return [];
        }
    }

    /**
     * Enhance API recommendations with behavioral data
     */
    async enhanceRecommendations(productId, apiRecommendations) {
        const product = window.app?.getProduct(productId);
        if (!product) return apiRecommendations;

        const enhanced = [...apiRecommendations];

        // Add view-based recommendations
        const viewBasedRecs = this.getViewBasedRecommendations(product);
        viewBasedRecs.forEach(rec => {
            if (!enhanced.find(item => item.id === rec.id)) {
                enhanced.push({...rec, reason: 'Часто просматривают вместе'});
            }
        });

        // Add category-based recommendations
        const categoryRecs = this.getCategoryBasedRecommendations(product);
        categoryRecs.forEach(rec => {
            if (!enhanced.find(item => item.id === rec.id) && enhanced.length < 8) {
                enhanced.push({...rec, reason: 'Похожие товары'});
            }
        });

        // Add trending products from same category
        const trendingRecs = this.getTrendingRecommendations(product);
        trendingRecs.forEach(rec => {
            if (!enhanced.find(item => item.id === rec.id) && enhanced.length < 10) {
                enhanced.push({...rec, reason: 'Популярно сейчас'});
            }
        });

        return enhanced.slice(0, 8); // Limit to 8 recommendations
    }

    /**
     * Get recommendations based on view history
     */
    getViewBasedRecommendations(currentProduct) {
        const allProducts = window.app?.products || [];
        const recommendations = [];

        // Find products often viewed together
        const coViewedProducts = this.findCoViewedProducts(currentProduct.id);
        
        coViewedProducts.forEach(productId => {
            const product = allProducts.find(p => p.id === productId);
            if (product && product.in_stock && recommendations.length < 4) {
                recommendations.push(product);
            }
        });

        return recommendations;
    }

    /**
     * Get category-based recommendations
     */
    getCategoryBasedRecommendations(currentProduct) {
        const allProducts = window.app?.products || [];
        
        return allProducts
            .filter(p => 
                p.category === currentProduct.category && 
                p.id !== currentProduct.id && 
                p.in_stock
            )
            .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
            .slice(0, 4);
    }

    /**
     * Get trending recommendations
     */
    getTrendingRecommendations(currentProduct) {
        const allProducts = window.app?.products || [];
        
        return allProducts
            .filter(p => 
                p.category === currentProduct.category && 
                p.id !== currentProduct.id && 
                p.in_stock
            )
            .sort((a, b) => {
                // Sort by views in last period (simulated by views_count)
                const aScore = (a.views_count || 0) * (a.price > currentProduct.price * 0.8 && a.price < currentProduct.price * 1.2 ? 1.5 : 1);
                const bScore = (b.views_count || 0) * (b.price > currentProduct.price * 0.8 && b.price < currentProduct.price * 1.2 ? 1.5 : 1);
                return bScore - aScore;
            })
            .slice(0, 3);
    }

    /**
     * Find products frequently viewed together
     */
    findCoViewedProducts(productId) {
        const coViewed = [];
        const sessions = this.groupViewHistoryBySessions();

        sessions.forEach(session => {
            if (session.includes(productId)) {
                session.forEach(id => {
                    if (id !== productId && !coViewed.includes(id)) {
                        coViewed.push(id);
                    }
                });
            }
        });

        return coViewed;
    }

    /**
     * Group view history by sessions (simplified)
     */
    groupViewHistoryBySessions() {
        const sessions = [];
        let currentSession = [];
        let lastViewTime = 0;

        this.viewHistory.forEach(view => {
            const timeDiff = view.timestamp - lastViewTime;
            
            // If more than 30 minutes gap, start new session
            if (timeDiff > 30 * 60 * 1000) {
                if (currentSession.length > 0) {
                    sessions.push([...currentSession]);
                }
                currentSession = [view.productId];
            } else {
                currentSession.push(view.productId);
            }
            
            lastViewTime = view.timestamp;
        });

        if (currentSession.length > 0) {
            sessions.push(currentSession);
        }

        return sessions;
    }

    /**
     * Display recommendations in specified container
     */
    displayRecommendations(recommendations, container = null) {
        const targetContainer = container || document.getElementById('recommendationsContainer');
        if (!targetContainer || recommendations.length === 0) return;

        const title = container ? 'Рекомендуемые товары' : 'С этим товаром покупают';
        
        const html = `
            <div class="recommendations-section">
                <h5 class="mb-3">
                    <i class="fas fa-thumbs-up text-primary me-2"></i>
                    ${title}
                </h5>
                <div class="row g-3">
                    ${recommendations.map(product => this.createRecommendationCard(product)).join('')}
                </div>
            </div>
        `;

        targetContainer.innerHTML = html;
        this.initializeRecommendationInteractions();
    }

    /**
     * Create recommendation card HTML
     */
    createRecommendationCard(product) {
        return `
            <div class="col-md-3 col-sm-6">
                <div class="card recommendation-card h-100">
                    <div class="position-relative">
                        ${product.image_url 
                            ? `<img src="${product.image_url}" class="card-img-top" alt="${product.name}" style="height: 120px; object-fit: cover;">`
                            : `<div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 120px;">
                                 <i class="fas fa-image fa-2x text-muted"></i>
                               </div>`
                        }
                        ${product.reason ? `
                            <div class="position-absolute top-0 start-0 p-2">
                                <span class="badge bg-primary small">${product.reason}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-body p-2">
                        <h6 class="card-title small mb-1">${product.name}</h6>
                        <p class="card-text text-success fw-bold mb-2">${product.price.toLocaleString()} ₽</p>
                        <div class="d-grid gap-1">
                            <button class="btn btn-outline-primary btn-sm view-rec-btn" 
                                    data-product-id="${product.id}">
                                <i class="fas fa-eye"></i> Подробнее
                            </button>
                            <button class="btn btn-success btn-sm add-to-cart-rec-btn" 
                                    data-product-id="${product.id}"
                                    ${!product.in_stock ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus"></i> В корзину
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize recommendation interactions
     */
    initializeRecommendationInteractions() {
        // View recommendation buttons
        document.querySelectorAll('.view-rec-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                if (window.app) {
                    window.app.viewProduct(productId);
                }
            });
        });

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-rec-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                if (window.app?.modules?.cart) {
                    window.app.modules.cart.addToCart(productId);
                }
            });
        });

        // Recommendation card clicks
        document.querySelectorAll('.recommendation-card').forEach(card => {
            card.addEventListener('click', () => {
                const btn = card.querySelector('.view-rec-btn');
                if (btn) {
                    btn.click();
                }
            });
        });
    }

    /**
     * Track product view for recommendations
     */
    trackProductView(productId) {
        const view = {
            productId: productId,
            timestamp: Date.now(),
            sessionId: this.getSessionId()
        };

        this.viewHistory.push(view);

        // Keep only last 100 views
        if (this.viewHistory.length > 100) {
            this.viewHistory = this.viewHistory.slice(-100);
        }

        this.saveViewHistory();
        
        // Invalidate related recommendations cache
        this.invalidateRelatedCache(productId);
    }

    /**
     * Update recommendations based on cart contents
     */
    updateRecommendationsFromCart(cart) {
        cart.forEach(item => {
            this.trackPurchaseIntent(item.productId, item.quantity);
        });
    }

    /**
     * Track purchase intent (items added to cart)
     */
    trackPurchaseIntent(productId, quantity = 1) {
        const intent = {
            productId: productId,
            quantity: quantity,
            timestamp: Date.now(),
            sessionId: this.getSessionId()
        };

        this.purchaseHistory.push(intent);

        // Keep only last 50 purchase intents
        if (this.purchaseHistory.length > 50) {
            this.purchaseHistory = this.purchaseHistory.slice(-50);
        }

        this.savePurchaseHistory();
    }

    /**
     * Get session ID for tracking
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('recommendation_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('recommendation_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Invalidate cache for related products
     */
    invalidateRelatedCache(productId) {
        const product = window.app?.getProduct(productId);
        if (!product) return;

        // Remove cache for this product
        this.recommendationsCache.delete(productId);

        // Remove cache for products in same category
        const allProducts = window.app?.products || [];
        allProducts
            .filter(p => p.category === product.category)
            .forEach(p => this.recommendationsCache.delete(p.id));
    }

    /**
     * Get personalized homepage recommendations
     */
    getHomepageRecommendations() {
        const allProducts = window.app?.products || [];
        const recommendations = [];

        // Based on view history
        if (this.viewHistory.length > 0) {
            const recentlyViewed = this.viewHistory
                .slice(-10)
                .map(v => v.productId)
                .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

            recentlyViewed.forEach(productId => {
                const product = allProducts.find(p => p.id === productId);
                if (product) {
                    const categoryRecs = this.getCategoryBasedRecommendations(product);
                    categoryRecs.forEach(rec => {
                        if (!recommendations.find(r => r.id === rec.id) && recommendations.length < 8) {
                            recommendations.push({...rec, reason: 'На основе просмотров'});
                        }
                    });
                }
            });
        }

        // Add popular products if not enough recommendations
        if (recommendations.length < 8) {
            const popular = allProducts
                .filter(p => p.in_stock && !recommendations.find(r => r.id === p.id))
                .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                .slice(0, 8 - recommendations.length);

            popular.forEach(product => {
                recommendations.push({...product, reason: 'Популярные товары'});
            });
        }

        return recommendations;
    }

    /**
     * Save view history to localStorage
     */
    saveViewHistory() {
        try {
            localStorage.setItem('catalog_view_history', JSON.stringify(this.viewHistory));
        } catch (error) {
            console.error('Error saving view history:', error);
        }
    }

    /**
     * Load view history from localStorage
     */
    loadViewHistory() {
        try {
            const saved = localStorage.getItem('catalog_view_history');
            if (saved) {
                this.viewHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading view history:', error);
        }
    }

    /**
     * Save purchase history to localStorage
     */
    savePurchaseHistory() {
        try {
            localStorage.setItem('catalog_purchase_history', JSON.stringify(this.purchaseHistory));
        } catch (error) {
            console.error('Error saving purchase history:', error);
        }
    }

    /**
     * Load purchase history from localStorage
     */
    loadPurchaseHistory() {
        try {
            const saved = localStorage.getItem('catalog_purchase_history');
            if (saved) {
                this.purchaseHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading purchase history:', error);
        }
    }

    /**
     * Clear all recommendation data
     */
    clearRecommendationData() {
        this.viewHistory = [];
        this.purchaseHistory = [];
        this.recommendationsCache.clear();
        
        localStorage.removeItem('catalog_view_history');
        localStorage.removeItem('catalog_purchase_history');
        sessionStorage.removeItem('recommendation_session_id');
    }
}

// Export for use in other modules
window.RecommendationsModule = RecommendationsModule;
