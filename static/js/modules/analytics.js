/**
 * Analytics Module
 * Handles user behavior tracking and analytics
 */

class AnalyticsModule {
    constructor() {
        this.sessionId = null;
        this.sessionStartTime = null;
        this.events = [];
        this.isInitialized = false;
        this.trackingEnabled = true;
        this.batchSize = 10;
        this.sendInterval = 30000; // 30 seconds
    }

    /**
     * Initialize the analytics module
     */
    async init() {
        this.initializeSession();
        this.setupEventListeners();
        this.startBatchSending();
        this.trackPageView();
        this.isInitialized = true;
        console.log('Analytics module initialized');
    }

    /**
     * Initialize analytics session
     */
    initializeSession() {
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
        
        // Track session info
        this.trackEvent('session_start', {
            session_id: this.sessionId,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            referrer: document.referrer
        });
    }

    /**
     * Setup event listeners for automatic tracking
     */
    setupEventListeners() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', {
                    time_on_page: Date.now() - this.sessionStartTime
                });
            } else {
                this.trackEvent('page_visible', {});
            }
        });

        // Track clicks on product cards
        document.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                const productId = productCard.dataset.productId;
                this.trackProductInteraction('product_card_click', productId, {
                    element: e.target.tagName.toLowerCase(),
                    position: this.getElementPosition(productCard)
                });
            }

            // Track button clicks
            if (e.target.closest('button')) {
                const button = e.target.closest('button');
                this.trackButtonClick(button);
            }
        });

        // Track search behavior
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (e.target.value.length >= 2) {
                        this.trackEvent('search_query', {
                            query: e.target.value,
                            query_length: e.target.value.length
                        });
                    }
                }, 1000);
            });
        }

        // Track filter usage
        document.addEventListener('change', (e) => {
            if (e.target.matches('#categoryFilter, #sortSelect, #inStockOnly')) {
                this.trackEvent('filter_used', {
                    filter_type: e.target.id,
                    filter_value: e.target.value || e.target.checked,
                    timestamp: Date.now()
                });
            }
        });

        // Track view toggle
        document.addEventListener('viewChanged', (e) => {
            this.trackEvent('view_changed', {
                new_view: e.detail.view,
                timestamp: Date.now()
            });
        });

        // Track cart events
        document.addEventListener('cartUpdated', (e) => {
            this.trackEvent('cart_updated', {
                cart_items: e.detail.cart.length,
                cart_total: e.detail.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                timestamp: Date.now()
            });
        });

        // Track scroll behavior
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackScrollBehavior();
            }, 100);
        });

        // Track window resize (mobile orientation changes)
        window.addEventListener('resize', () => {
            this.trackEvent('viewport_changed', {
                new_size: `${window.innerWidth}x${window.innerHeight}`,
                timestamp: Date.now()
            });
        });

        // Track before page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('session_end', {
                session_duration: Date.now() - this.sessionStartTime,
                events_count: this.events.length
            });
            this.sendEvents(); // Send remaining events
        });
    }

    /**
     * Track page view
     */
    trackPageView() {
        this.trackEvent('page_view', {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
        });
    }

    /**
     * Track product view
     */
    trackProductView(productId) {
        const product = window.app?.getProduct(productId);
        if (!product) return;

        this.trackEvent('product_view', {
            product_id: productId,
            product_name: product.name,
            product_category: product.category,
            product_price: product.price,
            timestamp: Date.now()
        });

        // Dispatch event for recommendations module
        document.dispatchEvent(new CustomEvent('productViewed', {
            detail: { productId }
        }));
    }

    /**
     * Track product interactions
     */
    trackProductInteraction(action, productId, additionalData = {}) {
        const product = window.app?.getProduct(productId);
        if (!product) return;

        this.trackEvent(action, {
            product_id: productId,
            product_name: product.name,
            product_category: product.category,
            product_price: product.price,
            ...additionalData,
            timestamp: Date.now()
        });
    }

    /**
     * Track button clicks
     */
    trackButtonClick(button) {
        const buttonData = {
            button_text: button.textContent.trim(),
            button_class: button.className,
            button_id: button.id,
            timestamp: Date.now()
        };

        // Special handling for specific buttons
        if (button.classList.contains('add-to-cart-btn')) {
            const productId = button.dataset.productId;
            this.trackProductInteraction('add_to_cart_click', parseInt(productId), buttonData);
        } else if (button.classList.contains('view-product-btn')) {
            const productId = button.dataset.productId;
            this.trackProductInteraction('view_product_click', parseInt(productId), buttonData);
        } else if (button.classList.contains('share-btn')) {
            const productId = button.dataset.productId;
            const shareType = button.dataset.shareType;
            this.trackProductInteraction('share_click', parseInt(productId), {
                ...buttonData,
                share_type: shareType
            });
        } else {
            this.trackEvent('button_click', buttonData);
        }
    }

    /**
     * Track scroll behavior
     */
    trackScrollBehavior() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        // Track significant scroll milestones
        if (scrollPercent >= 25 && !this.scrollMilestones?.['25']) {
            this.trackEvent('scroll_milestone', { percent: 25 });
            this.scrollMilestones = { ...this.scrollMilestones, '25': true };
        } else if (scrollPercent >= 50 && !this.scrollMilestones?.['50']) {
            this.trackEvent('scroll_milestone', { percent: 50 });
            this.scrollMilestones = { ...this.scrollMilestones, '50': true };
        } else if (scrollPercent >= 75 && !this.scrollMilestones?.['75']) {
            this.trackEvent('scroll_milestone', { percent: 75 });
            this.scrollMilestones = { ...this.scrollMilestones, '75': true };
        } else if (scrollPercent >= 90 && !this.scrollMilestones?.['90']) {
            this.trackEvent('scroll_milestone', { percent: 90 });
            this.scrollMilestones = { ...this.scrollMilestones, '90': true };
        }
    }

    /**
     * Track generic event
     */
    trackEvent(eventName, eventData = {}) {
        if (!this.trackingEnabled) return;

        const event = {
            event_name: eventName,
            session_id: this.sessionId,
            timestamp: Date.now(),
            url: window.location.href,
            ...eventData
        };

        this.events.push(event);

        // Send events if batch is full
        if (this.events.length >= this.batchSize) {
            this.sendEvents();
        }

        console.log('Analytics event tracked:', eventName, eventData);
    }

    /**
     * Send events to server
     */
    async sendEvents() {
        if (this.events.length === 0) return;

        const eventsToSend = [...this.events];
        this.events = []; // Clear events array

        try {
            const response = await fetch('/api/analytics/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events: eventsToSend,
                    session_id: this.sessionId
                })
            });

            if (!response.ok) {
                console.warn('Failed to send analytics events:', response.status);
                // Re-add events to queue if send failed
                this.events.unshift(...eventsToSend);
            }
        } catch (error) {
            console.error('Error sending analytics events:', error);
            // Re-add events to queue if send failed
            this.events.unshift(...eventsToSend);
        }
    }

    /**
     * Start batch sending interval
     */
    startBatchSending() {
        setInterval(() => {
            this.sendEvents();
        }, this.sendInterval);
    }

    /**
     * Get element position in list
     */
    getElementPosition(element) {
        const parent = element.parentElement;
        if (!parent) return 0;
        
        return Array.from(parent.children).indexOf(element);
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get user analytics summary
     */
    async getAnalyticsSummary() {
        try {
            const response = await fetch('/api/analytics/views');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching analytics summary:', error);
        }
        return null;
    }

    /**
     * Track performance metrics
     */
    trackPerformance() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            this.trackEvent('performance_metrics', {
                page_load_time: navigation.loadEventEnd - navigation.loadEventStart,
                dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                dns_lookup_time: navigation.domainLookupEnd - navigation.domainLookupStart,
                tcp_connect_time: navigation.connectEnd - navigation.connectStart,
                server_response_time: navigation.responseEnd - navigation.requestStart,
                dom_processing_time: navigation.domComplete - navigation.domLoading
            });
        }
    }

    /**
     * Track errors
     */
    trackError(error, context = {}) {
        this.trackEvent('javascript_error', {
            error_message: error.message,
            error_stack: error.stack,
            error_context: context,
            timestamp: Date.now()
        });
    }

    /**
     * Track conversion events
     */
    trackConversion(conversionType, value = 0, additionalData = {}) {
        this.trackEvent('conversion', {
            conversion_type: conversionType,
            conversion_value: value,
            ...additionalData,
            timestamp: Date.now()
        });
    }

    /**
     * Track user engagement metrics
     */
    trackEngagement() {
        const engagement = {
            time_on_page: Date.now() - this.sessionStartTime,
            clicks_count: this.events.filter(e => e.event_name.includes('click')).length,
            page_views: this.events.filter(e => e.event_name === 'page_view').length,
            product_views: this.events.filter(e => e.event_name === 'product_view').length,
            cart_additions: this.events.filter(e => e.event_name === 'add_to_cart_click').length,
            searches: this.events.filter(e => e.event_name === 'search_query').length
        };

        this.trackEvent('engagement_summary', engagement);
    }

    /**
     * Enable/disable tracking
     */
    setTrackingEnabled(enabled) {
        this.trackingEnabled = enabled;
        
        if (enabled) {
            console.log('Analytics tracking enabled');
        } else {
            console.log('Analytics tracking disabled');
        }
    }

    /**
     * Get current session info
     */
    getSessionInfo() {
        return {
            session_id: this.sessionId,
            session_start_time: this.sessionStartTime,
            session_duration: Date.now() - this.sessionStartTime,
            events_count: this.events.length,
            tracking_enabled: this.trackingEnabled
        };
    }
}

// Set up global error tracking
window.addEventListener('error', (event) => {
    if (window.app?.modules?.analytics) {
        window.app.modules.analytics.trackError(event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    }
});

// Track performance when page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.app?.modules?.analytics) {
            window.app.modules.analytics.trackPerformance();
        }
    }, 1000);
});

// Export for use in other modules
window.AnalyticsModule = AnalyticsModule;
