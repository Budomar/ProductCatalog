/**
 * Social Sharing Module
 * Handles social media sharing functionality
 */

class SocialSharingModule {
    constructor() {
        this.isInitialized = false;
        this.shareUrls = {
            vk: 'https://vk.com/share.php?url={url}&title={title}&description={description}&image={image}',
            telegram: 'https://t.me/share/url?url={url}&text={text}',
            whatsapp: 'https://wa.me/?text={text}%20{url}',
            facebook: 'https://www.facebook.com/sharer/sharer.php?u={url}&quote={text}',
            twitter: 'https://twitter.com/intent/tweet?url={url}&text={text}&hashtags={hashtags}',
            odnoklassniki: 'https://connect.ok.ru/offer?url={url}&title={title}&description={description}&imageUrl={image}',
            email: 'mailto:?subject={title}&body={text}%20{url}'
        };
    }

    /**
     * Initialize the social sharing module
     */
    async init() {
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('Social sharing module initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle share button clicks in product cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.share-btn')) {
                e.stopPropagation();
                const button = e.target.closest('.share-btn');
                const productId = parseInt(button.dataset.productId);
                const shareType = button.dataset.shareType;
                
                this.shareProduct(productId, shareType);
            }
        });

        // Handle generic share buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-share]')) {
                e.stopPropagation();
                const button = e.target.closest('[data-share]');
                const shareType = button.dataset.share;
                const url = button.dataset.url || window.location.href;
                const title = button.dataset.title || document.title;
                const text = button.dataset.text || '';
                
                this.shareUrl(shareType, url, title, text);
            }
        });
    }

    /**
     * Share a specific product
     */
    shareProduct(productId, platform) {
        const product = window.app?.getProduct(productId);
        if (!product) {
            console.error('Product not found for sharing:', productId);
            return;
        }

        const productUrl = this.getProductUrl(productId);
        const title = `${product.name} - Каталог товаров`;
        const description = product.description || 'Посмотрите этот замечательный товар!';
        const image = product.image_url || '';
        const price = product.price ? `Цена: ${product.price.toLocaleString()} ₽` : '';
        const text = `${product.name}\n${description}\n${price}`;

        this.shareContent(platform, {
            url: productUrl,
            title: title,
            description: description,
            text: text,
            image: image,
            hashtags: this.generateHashtags(product)
        });

        // Track sharing event
        if (window.app?.modules?.analytics) {
            window.app.modules.analytics.trackEvent('product_shared', {
                product_id: productId,
                platform: platform,
                product_name: product.name,
                product_category: product.category
            });
        }

        // Show sharing notification
        this.showShareNotification(platform, product.name);
    }

    /**
     * Share generic URL
     */
    shareUrl(platform, url, title, text) {
        this.shareContent(platform, {
            url: url,
            title: title,
            text: text,
            description: text,
            image: '',
            hashtags: ''
        });

        // Track generic sharing
        if (window.app?.modules?.analytics) {
            window.app.modules.analytics.trackEvent('url_shared', {
                platform: platform,
                url: url,
                title: title
            });
        }
    }

    /**
     * Share content on specified platform
     */
    shareContent(platform, content) {
        if (!this.shareUrls[platform]) {
            console.error('Unsupported sharing platform:', platform);
            return;
        }

        // Check if Web Share API is available and use it for mobile
        if (this.isMobile() && navigator.share) {
            this.useWebShareAPI(content);
            return;
        }

        // Use traditional sharing URLs
        const shareUrl = this.buildShareUrl(platform, content);
        
        if (platform === 'email') {
            window.location.href = shareUrl;
        } else {
            this.openShareWindow(shareUrl, platform);
        }
    }

    /**
     * Build share URL for platform
     */
    buildShareUrl(platform, content) {
        let url = this.shareUrls[platform];
        
        // Replace placeholders
        url = url.replace('{url}', encodeURIComponent(content.url));
        url = url.replace('{title}', encodeURIComponent(content.title));
        url = url.replace('{description}', encodeURIComponent(content.description));
        url = url.replace('{text}', encodeURIComponent(content.text));
        url = url.replace('{image}', encodeURIComponent(content.image));
        url = url.replace('{hashtags}', encodeURIComponent(content.hashtags));
        
        return url;
    }

    /**
     * Open sharing window
     */
    openShareWindow(url, platform) {
        const windowFeatures = 'width=600,height=400,scrollbars=yes,resizable=yes';
        const shareWindow = window.open(url, `share_${platform}`, windowFeatures);
        
        if (shareWindow) {
            shareWindow.focus();
        } else {
            // Fallback: redirect to share URL
            window.location.href = url;
        }
    }

    /**
     * Use Web Share API for mobile devices
     */
    async useWebShareAPI(content) {
        try {
            await navigator.share({
                title: content.title,
                text: content.text,
                url: content.url
            });
            
            console.log('Content shared successfully via Web Share API');
        } catch (error) {
            console.error('Error sharing via Web Share API:', error);
            // Fallback to traditional sharing
            this.shareContent('telegram', content);
        }
    }

    /**
     * Generate hashtags for product
     */
    generateHashtags(product) {
        const hashtags = [];
        
        if (product.category) {
            hashtags.push(product.category.replace(/\s+/g, ''));
        }
        
        hashtags.push('каталог', 'товары', 'покупки');
        
        return hashtags.join(',');
    }

    /**
     * Get product URL
     */
    getProductUrl(productId) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?product=${productId}`;
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Show sharing notification
     */
    showShareNotification(platform, productName) {
        const platformNames = {
            vk: 'ВКонтакте',
            telegram: 'Telegram',
            whatsapp: 'WhatsApp',
            facebook: 'Facebook',
            twitter: 'Twitter',
            odnoklassniki: 'Одноклассники',
            email: 'Email'
        };

        const message = `Товар "${productName}" поделен в ${platformNames[platform] || platform}`;
        
        if (window.app?.modules?.notifications) {
            window.app.modules.notifications.show(message, 'success');
        }
    }

    /**
     * Create share buttons for product
     */
    createShareButtons(productId, containerClass = 'social-share-buttons') {
        const shareButtons = [
            { type: 'vk', icon: 'fab fa-vk', title: 'ВКонтакте' },
            { type: 'telegram', icon: 'fab fa-telegram', title: 'Telegram' },
            { type: 'whatsapp', icon: 'fab fa-whatsapp', title: 'WhatsApp' }
        ];

        return `
            <div class="${containerClass}">
                ${shareButtons.map(btn => `
                    <button class="btn btn-outline-secondary btn-sm share-btn" 
                            data-product-id="${productId}" 
                            data-share-type="${btn.type}"
                            title="Поделиться в ${btn.title}">
                        <i class="${btn.icon}"></i>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Create expanded share modal
     */
    createShareModal(productId) {
        const product = window.app?.getProduct(productId);
        if (!product) return;

        const modalHtml = `
            <div class="modal fade" id="shareModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-share-alt me-2"></i>
                                Поделиться товаром
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <h6>${product.name}</h6>
                                <p class="text-muted">${product.description || ''}</p>
                            </div>
                            
                            <div class="row g-2">
                                <div class="col-6">
                                    <button class="btn btn-primary w-100 share-btn" 
                                            data-product-id="${productId}" 
                                            data-share-type="vk">
                                        <i class="fab fa-vk me-2"></i> ВКонтакте
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-info w-100 share-btn" 
                                            data-product-id="${productId}" 
                                            data-share-type="telegram">
                                        <i class="fab fa-telegram me-2"></i> Telegram
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-success w-100 share-btn" 
                                            data-product-id="${productId}" 
                                            data-share-type="whatsapp">
                                        <i class="fab fa-whatsapp me-2"></i> WhatsApp
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-primary w-100 share-btn" 
                                            data-product-id="${productId}" 
                                            data-share-type="facebook">
                                        <i class="fab fa-facebook me-2"></i> Facebook
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-warning w-100 share-btn" 
                                            data-product-id="${productId}" 
                                            data-share-type="odnoklassniki">
                                        <i class="fab fa-odnoklassniki me-2"></i> OK
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-secondary w-100 share-btn" 
                                            data-product-id="${productId}" 
                                            data-share-type="email">
                                        <i class="fas fa-envelope me-2"></i> Email
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mt-3">
                                <label class="form-label">Ссылка на товар:</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" 
                                           value="${this.getProductUrl(productId)}" 
                                           id="shareUrl" readonly>
                                    <button class="btn btn-outline-secondary" 
                                            onclick="app.modules.socialSharing.copyToClipboard('shareUrl')">
                                        <i class="fas fa-copy"></i> Копировать
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('shareModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('shareModal'));
        modal.show();

        // Clean up on hide
        document.getElementById('shareModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('shareModal').remove();
        });
    }

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            await navigator.clipboard.writeText(element.value);
            this.showShareNotification('clipboard', 'Ссылка скопирована');
        } catch (error) {
            // Fallback for older browsers
            element.select();
            document.execCommand('copy');
            this.showShareNotification('clipboard', 'Ссылка скопирована');
        }
    }

    /**
     * Show expanded share modal
     */
    showShareModal(productId) {
        this.createShareModal(productId);
    }

    /**
     * Generate QR code for sharing (if QR library is available)
     */
    generateQRCode(productId, container) {
        const productUrl = this.getProductUrl(productId);
        
        // This would require a QR code library like qrcode.js
        if (typeof QRCode !== 'undefined') {
            const qrContainer = document.getElementById(container);
            if (qrContainer) {
                new QRCode(qrContainer, {
                    text: productUrl,
                    width: 128,
                    height: 128
                });
            }
        }
    }
}

// Export for use in other modules
window.SocialSharingModule = SocialSharingModule;
