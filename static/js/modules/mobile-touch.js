/**
 * Mobile Touch Module
 * Handles touch interactions and mobile-specific enhancements
 */

class MobileTouchModule {
    constructor() {
        this.isInitialized = false;
        this.isMobile = this.detectMobile();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.swipeThreshold = 100;
        this.tapThreshold = 10;
        this.longPressDelay = 500;
        this.longPressTimer = null;
    }

    /**
     * Initialize the mobile touch module
     */
    async init() {
        if (!this.isMobile) {
            console.log('Mobile touch module skipped - desktop device detected');
            return;
        }

        this.setupTouchEnhancements();
        this.setupSwipeGestures();
        this.setupLongPressGestures();
        this.setupDoubleTapGestures();
        this.optimizeForMobile();
        this.isInitialized = true;
        console.log('Mobile touch module initialized');
    }

    /**
     * Detect if device is mobile
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768 ||
               'ontouchstart' in window;
    }

    /**
     * Setup touch enhancements
     */
    setupTouchEnhancements() {
        // Improve touch targets
        this.improveTouchTargets();
        
        // Add touch feedback
        this.addTouchFeedback();
        
        // Handle orientation changes
        this.handleOrientationChanges();
        
        // Optimize scrolling
        this.optimizeScrolling();
    }

    /**
     * Improve touch targets for better accessibility
     */
    improveTouchTargets() {
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .btn, .form-control, .form-select {
                    min-height: 44px !important;
                    min-width: 44px !important;
                }
                
                .navbar-nav .nav-link {
                    padding: 12px 16px !important;
                }
                
                .product-card {
                    touch-action: manipulation;
                    user-select: none;
                }
                
                .product-card .btn {
                    padding: 8px 12px !important;
                }
                
                .comparison-checkbox input {
                    transform: scale(1.5);
                    margin: 8px;
                }
                
                .social-share-buttons .btn {
                    min-width: 44px;
                    min-height: 44px;
                    margin: 2px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add visual feedback for touch interactions
     */
    addTouchFeedback() {
        // Add touch ripple effect
        const addRippleEffect = (element, event) => {
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.touches[0].clientX - rect.left - size / 2;
            const y = event.touches[0].clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        };

        // Add ripple CSS animation
        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);

        // Apply ripple to buttons and cards
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.btn, .product-card, .nav-link');
            if (target && !target.classList.contains('no-ripple')) {
                addRippleEffect(target, e);
            }
        }, { passive: true });
    }

    /**
     * Setup swipe gestures
     */
    setupSwipeGestures() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleSwipeGesture(e);
        }, { passive: true });
    }

    /**
     * Handle swipe gestures
     */
    handleSwipeGesture(event) {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Only process if swipe is long enough and more horizontal than vertical
        if (absX < this.swipeThreshold || absY > absX) return;

        const target = event.target.closest('.product-card, .carousel, .swipeable');
        if (!target) return;

        // Handle product card swipes
        if (target.classList.contains('product-card')) {
            this.handleProductCardSwipe(target, deltaX);
        }
        
        // Handle carousel swipes
        if (target.closest('.carousel')) {
            this.handleCarouselSwipe(target.closest('.carousel'), deltaX);
        }

        // Track swipe gesture
        if (window.app?.modules?.analytics) {
            window.app.modules.analytics.trackEvent('swipe_gesture', {
                direction: deltaX > 0 ? 'right' : 'left',
                distance: absX,
                element_type: target.className
            });
        }
    }

    /**
     * Handle product card swipe actions
     */
    handleProductCardSwipe(card, deltaX) {
        const productId = parseInt(card.dataset.productId);
        
        if (deltaX > 0) {
            // Swipe right - add to cart
            const addToCartBtn = card.querySelector('.add-to-cart-btn');
            if (addToCartBtn && !addToCartBtn.disabled) {
                this.animateSwipeAction(card, 'right', 'В корзину');
                setTimeout(() => {
                    if (window.app?.modules?.cart) {
                        window.app.modules.cart.addToCart(productId);
                    }
                }, 200);
            }
        } else {
            // Swipe left - add to comparison
            this.animateSwipeAction(card, 'left', 'К сравнению');
            setTimeout(() => {
                if (window.app?.modules?.comparison) {
                    window.app.modules.comparison.addToComparison(productId);
                }
            }, 200);
        }
    }

    /**
     * Animate swipe action feedback
     */
    animateSwipeAction(element, direction, text) {
        const feedback = document.createElement('div');
        feedback.className = `swipe-feedback swipe-${direction}`;
        feedback.textContent = text;
        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            ${direction}: 10px;
            transform: translateY(-50%);
            background: var(--bs-success);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 10;
            animation: swipeActionFade 1s ease-out forwards;
        `;

        element.style.position = 'relative';
        element.appendChild(feedback);

        // Add animation CSS
        if (!document.getElementById('swipeActionStyles')) {
            const style = document.createElement('style');
            style.id = 'swipeActionStyles';
            style.textContent = `
                @keyframes swipeActionFade {
                    0% { opacity: 0; transform: translateY(-50%) scale(0.8); }
                    30% { opacity: 1; transform: translateY(-50%) scale(1); }
                    100% { opacity: 0; transform: translateY(-50%) scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }

    /**
     * Handle carousel swipes
     */
    handleCarouselSwipe(carousel, deltaX) {
        const carouselInstance = bootstrap.Carousel.getInstance(carousel);
        if (!carouselInstance) return;

        if (deltaX > 0) {
            carouselInstance.prev();
        } else {
            carouselInstance.next();
        }
    }

    /**
     * Setup long press gestures
     */
    setupLongPressGestures() {
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.product-card');
            if (!target) return;

            this.longPressTimer = setTimeout(() => {
                this.handleLongPress(target, e);
            }, this.longPressDelay);
        });

        document.addEventListener('touchend', () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });

        document.addEventListener('touchmove', () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });
    }

    /**
     * Handle long press action
     */
    handleLongPress(target, event) {
        event.preventDefault();
        
        const productId = parseInt(target.dataset.productId);
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        // Show context menu
        this.showMobileContextMenu(target, productId);

        // Track long press
        if (window.app?.modules?.analytics) {
            window.app.modules.analytics.trackEvent('long_press', {
                element_type: 'product_card',
                product_id: productId
            });
        }
    }

    /**
     * Show mobile context menu
     */
    showMobileContextMenu(target, productId) {
        const product = window.app?.getProduct(productId);
        if (!product) return;

        const contextMenu = document.createElement('div');
        contextMenu.className = 'mobile-context-menu';
        contextMenu.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: var(--bs-dark);
            border: 1px solid var(--bs-border-color);
            border-radius: 10px;
            padding: 15px;
            z-index: 1060;
            animation: slideUp 0.3s ease-out;
        `;

        contextMenu.innerHTML = `
            <div class="text-center mb-3">
                <h6 class="mb-1">${product.name}</h6>
                <small class="text-muted">Выберите действие</small>
            </div>
            <div class="d-grid gap-2">
                <button class="btn btn-primary" onclick="app.viewProduct(${productId}); this.closest('.mobile-context-menu').remove();">
                    <i class="fas fa-eye me-2"></i>Просмотреть
                </button>
                <button class="btn btn-success" onclick="app.modules.cart?.addToCart(${productId}); this.closest('.mobile-context-menu').remove();"
                        ${!product.in_stock ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus me-2"></i>В корзину
                </button>
                <button class="btn btn-info" onclick="app.modules.comparison?.addToComparison(${productId}); this.closest('.mobile-context-menu').remove();">
                    <i class="fas fa-balance-scale me-2"></i>К сравнению
                </button>
                <button class="btn btn-outline-secondary" onclick="app.modules.socialSharing?.showShareModal(${productId}); this.closest('.mobile-context-menu').remove();">
                    <i class="fas fa-share-alt me-2"></i>Поделиться
                </button>
                <button class="btn btn-outline-danger" onclick="this.closest('.mobile-context-menu').remove();">
                    <i class="fas fa-times me-2"></i>Отмена
                </button>
            </div>
        `;

        // Add slideUp animation
        if (!document.getElementById('mobileContextStyles')) {
            const style = document.createElement('style');
            style.id = 'mobileContextStyles';
            style.textContent = `
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        // Remove existing context menu
        const existing = document.querySelector('.mobile-context-menu');
        if (existing) existing.remove();

        document.body.appendChild(contextMenu);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (contextMenu.parentNode) {
                contextMenu.remove();
            }
        }, 10000);
    }

    /**
     * Setup double tap gestures
     */
    setupDoubleTapGestures() {
        let lastTap = 0;
        
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                this.handleDoubleTap(e);
            }
            
            lastTap = currentTime;
        });
    }

    /**
     * Handle double tap action
     */
    handleDoubleTap(event) {
        const target = event.target.closest('.product-card');
        if (!target) return;

        const productId = parseInt(target.dataset.productId);
        
        // Double tap to add to favorites or quick add to cart
        if (window.app?.modules?.cart) {
            window.app.modules.cart.addToCart(productId);
        }

        // Visual feedback
        this.showDoubleTapFeedback(target);

        // Track double tap
        if (window.app?.modules?.analytics) {
            window.app.modules.analytics.trackEvent('double_tap', {
                element_type: 'product_card',
                product_id: productId
            });
        }
    }

    /**
     * Show double tap feedback
     */
    showDoubleTapFeedback(element) {
        const feedback = document.createElement('div');
        feedback.innerHTML = '<i class="fas fa-heart fa-2x"></i>';
        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff4757;
            z-index: 10;
            animation: doubleTapHeart 1s ease-out forwards;
            pointer-events: none;
        `;

        element.style.position = 'relative';
        element.appendChild(feedback);

        // Add animation
        if (!document.getElementById('doubleTapStyles')) {
            const style = document.createElement('style');
            style.id = 'doubleTapStyles';
            style.textContent = `
                @keyframes doubleTapHeart {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }

    /**
     * Handle orientation changes
     */
    handleOrientationChanges() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Refresh view after orientation change
                if (window.app?.modules?.viewToggle) {
                    window.app.modules.viewToggle.refreshView();
                }

                // Track orientation change
                if (window.app?.modules?.analytics) {
                    window.app.modules.analytics.trackEvent('orientation_change', {
                        orientation: window.orientation || 'unknown',
                        viewport_size: `${window.innerWidth}x${window.innerHeight}`
                    });
                }
            }, 100);
        });
    }

    /**
     * Optimize scrolling for mobile
     */
    optimizeScrolling() {
        // Enable momentum scrolling on iOS
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Improve scroll performance
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                * {
                    -webkit-tap-highlight-color: transparent;
                }
                
                .container, .row, .col {
                    transform: translateZ(0);
                }
                
                .product-card {
                    will-change: transform;
                }
                
                .offcanvas, .modal {
                    -webkit-overflow-scrolling: touch;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * General mobile optimizations
     */
    optimizeForMobile() {
        // Prevent zoom on input focus
        this.preventInputZoom();
        
        // Add mobile viewport meta if not present
        this.ensureViewportMeta();
        
        // Optimize images for mobile
        this.optimizeImages();
    }

    /**
     * Prevent zoom on input focus
     */
    preventInputZoom() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (parseFloat(getComputedStyle(input).fontSize) < 16) {
                input.style.fontSize = '16px';
            }
        });
    }

    /**
     * Ensure viewport meta tag is present
     */
    ensureViewportMeta() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
    }

    /**
     * Optimize images for mobile
     */
    optimizeImages() {
        // Add loading="lazy" to images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.loading = 'lazy';
            }
        });
    }

    /**
     * Show mobile-specific UI hints
     */
    showMobileHints() {
        const hints = [
            'Проведите вправо по карточке товара для добавления в корзину',
            'Проведите влево для добавления к сравнению',
            'Удержите карточку для дополнительных действий',
            'Дважды коснитесь для быстрого добавления в корзину'
        ];

        if (window.app?.modules?.notifications) {
            const hint = hints[Math.floor(Math.random() * hints.length)];
            window.app.modules.notifications.show(hint, 'info', 5000);
        }
    }
}

// Export for use in other modules
window.MobileTouchModule = MobileTouchModule;
