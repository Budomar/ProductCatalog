/**
 * Shopping Cart Module
 * Handles cart functionality with session persistence
 */

class CartModule {
    constructor() {
        this.cart = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the cart module
     */
    async init() {
        this.loadCart();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('Cart module initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Cart button click
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.updateCartDisplay();
            });
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.checkout();
            });
        }
    }

    /**
     * Add product to cart
     */
    addToCart(productId, quantity = 1) {
        const product = window.app?.getProduct(productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }

        if (!product.in_stock) {
            this.showNotification('Товар недоступен для заказа', 'warning');
            return;
        }

        const existingItem = this.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                productId: productId,
                quantity: quantity,
                price: product.price,
                name: product.name,
                image_url: product.image_url
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`"${product.name}" добавлен в корзину`, 'success');
        
        // Trigger cart updated event
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { cart: this.cart }
        }));
    }

    /**
     * Remove product from cart
     */
    removeFromCart(productId) {
        const index = this.cart.findIndex(item => item.productId === productId);
        if (index > -1) {
            const removedItem = this.cart.splice(index, 1)[0];
            this.saveCart();
            this.updateCartDisplay();
            this.showNotification(`"${removedItem.name}" удален из корзины`, 'info');
            
            document.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: { cart: this.cart }
            }));
        }
    }

    /**
     * Update quantity of item in cart
     */
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.productId === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartDisplay();
                
                document.dispatchEvent(new CustomEvent('cartUpdated', {
                    detail: { cart: this.cart }
                }));
            }
        }
    }

    /**
     * Clear entire cart
     */
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('Корзина очищена', 'info');
        
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { cart: this.cart }
        }));
    }

    /**
     * Get cart item count
     */
    getItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Get cart total price
     */
    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    /**
     * Update cart display in offcanvas
     */
    updateCartDisplay() {
        const cartContent = document.getElementById('cartContent');
        const cartTotal = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (!cartContent) return;

        if (this.cart.length === 0) {
            cartContent.innerHTML = '<p class="text-muted">Корзина пуста</p>';
            if (cartTotal) cartTotal.textContent = '0 ₽';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        const cartHtml = this.cart.map(item => `
            <div class="cart-item">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        ${item.image_url 
                            ? `<img src="${item.image_url}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;">`
                            : `<div class="bg-light d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                 <i class="fas fa-image text-muted"></i>
                               </div>`
                        }
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.name}</h6>
                        <small class="text-muted">${item.price.toLocaleString()} ₽</small>
                    </div>
                    <div class="quantity-controls">
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.modules.cart.updateQuantity(${item.productId}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="form-control form-control-sm quantity-input" 
                               value="${item.quantity}" min="1" 
                               onchange="app.modules.cart.updateQuantity(${item.productId}, parseInt(this.value))">
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.modules.cart.updateQuantity(${item.productId}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="app.modules.cart.removeFromCart(${item.productId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="text-end mt-2">
                    <strong>${(item.price * item.quantity).toLocaleString()} ₽</strong>
                </div>
            </div>
        `).join('');

        cartContent.innerHTML = cartHtml;
        
        if (cartTotal) {
            cartTotal.textContent = `${this.getTotal().toLocaleString()} ₽`;
        }
        
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
        }
    }

    /**
     * Proceed to checkout
     */
    checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Корзина пуста', 'warning');
            return;
        }

        // Show delivery calculator
        if (window.app?.modules?.deliveryCalculator) {
            const deliveryModal = new bootstrap.Modal(document.getElementById('deliveryModal'));
            deliveryModal.show();
        } else {
            // Simple checkout notification
            this.showNotification(`Заказ на сумму ${this.getTotal().toLocaleString()} ₽ готов к оформлению`, 'success');
        }
    }

    /**
     * Save cart to localStorage
     */
    saveCart() {
        try {
            localStorage.setItem('catalog_cart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    /**
     * Load cart from localStorage
     */
    loadCart() {
        try {
            const savedCart = localStorage.getItem('catalog_cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
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
     * Get cart data for external use
     */
    getCart() {
        return [...this.cart];
    }

    /**
     * Check if product is in cart
     */
    isInCart(productId) {
        return this.cart.some(item => item.productId === productId);
    }

    /**
     * Get item quantity in cart
     */
    getItemQuantity(productId) {
        const item = this.cart.find(item => item.productId === productId);
        return item ? item.quantity : 0;
    }
}

// Export for use in other modules
window.CartModule = CartModule;
