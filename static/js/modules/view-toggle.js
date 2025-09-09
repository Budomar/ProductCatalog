/**
 * View Toggle Module
 * Handles switching between grid and list views
 */

class ViewToggleModule {
    constructor() {
        this.currentView = 'grid';
        this.isInitialized = false;
    }

    /**
     * Initialize the view toggle module
     */
    async init() {
        this.loadViewPreference();
        this.setupEventListeners();
        this.applyView();
        this.isInitialized = true;
        console.log('View toggle module initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const viewToggle = document.getElementById('viewToggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', (e) => {
                if (e.target.closest('button[data-view]')) {
                    const view = e.target.closest('button[data-view]').dataset.view;
                    this.setView(view);
                }
            });
        }
    }

    /**
     * Set the current view
     */
    setView(view) {
        if (view !== 'grid' && view !== 'list') {
            console.error('Invalid view type:', view);
            return;
        }

        this.currentView = view;
        this.saveViewPreference();
        this.applyView();
        this.updateToggleButtons();
        
        // Trigger view changed event
        document.dispatchEvent(new CustomEvent('viewChanged', {
            detail: { view: this.currentView }
        }));
    }

    /**
     * Apply the current view to the products grid
     */
    applyView() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        // Remove existing view classes
        grid.classList.remove('view-grid', 'view-list');
        
        // Add current view class
        grid.classList.add(`view-${this.currentView}`);

        // Adjust column classes for list view
        if (this.currentView === 'list') {
            this.applyListView(grid);
        } else {
            this.applyGridView(grid);
        }
    }

    /**
     * Apply grid view styling
     */
    applyGridView(grid) {
        const productColumns = grid.querySelectorAll('[class*="col-"]');
        productColumns.forEach(col => {
            // Restore original grid classes
            col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
            
            const card = col.querySelector('.product-card');
            if (card) {
                card.classList.remove('list-card');
                
                // Ensure card body has proper flex layout
                const cardBody = card.querySelector('.card-body');
                if (cardBody) {
                    cardBody.classList.add('d-flex', 'flex-column');
                }
            }
        });
    }

    /**
     * Apply list view styling
     */
    applyListView(grid) {
        const productColumns = grid.querySelectorAll('[class*="col-"]');
        productColumns.forEach(col => {
            // Full width for list view
            col.className = 'col-12 mb-3';
            
            const card = col.querySelector('.product-card');
            if (card) {
                card.classList.add('list-card');
                this.restructureCardForList(card);
            }
        });
    }

    /**
     * Restructure card for list view
     */
    restructureCardForList(card) {
        const productImage = card.querySelector('.product-image');
        const cardBody = card.querySelector('.card-body');
        
        if (!productImage || !cardBody) return;

        // Create list layout structure if not exists
        if (!card.querySelector('.list-layout')) {
            const listLayout = document.createElement('div');
            listLayout.className = 'list-layout d-flex align-items-center p-3';
            
            // Move image to list layout
            const imageContainer = document.createElement('div');
            imageContainer.className = 'list-image me-3';
            imageContainer.style.width = '120px';
            imageContainer.style.height = '120px';
            imageContainer.style.flexShrink = '0';
            
            const img = productImage.querySelector('img, .card-img-top');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                imageContainer.appendChild(img.cloneNode(true));
            }
            
            // Create content area
            const contentArea = document.createElement('div');
            contentArea.className = 'list-content flex-grow-1';
            
            // Move card body content
            const title = cardBody.querySelector('.card-title');
            const description = cardBody.querySelector('.card-text');
            const price = cardBody.querySelector('.h5');
            const actions = cardBody.querySelector('.btn-group');
            const socialButtons = cardBody.querySelector('.social-share-buttons');
            const views = cardBody.querySelector('small');
            
            if (title) {
                const titleClone = title.cloneNode(true);
                titleClone.className = 'h5 mb-2';
                contentArea.appendChild(titleClone);
            }
            
            if (description) {
                const descClone = description.cloneNode(true);
                descClone.className = 'text-muted mb-2';
                contentArea.appendChild(descClone);
            }
            
            // Create bottom row with price and actions
            const bottomRow = document.createElement('div');
            bottomRow.className = 'd-flex justify-content-between align-items-center';
            
            const leftCol = document.createElement('div');
            if (price) {
                leftCol.appendChild(price.cloneNode(true));
            }
            if (views) {
                const viewsClone = views.cloneNode(true);
                viewsClone.className = 'text-muted d-block mt-1';
                leftCol.appendChild(viewsClone);
            }
            
            const rightCol = document.createElement('div');
            rightCol.className = 'd-flex align-items-center gap-2';
            
            if (actions) {
                rightCol.appendChild(actions.cloneNode(true));
            }
            
            if (socialButtons) {
                const socialClone = socialButtons.cloneNode(true);
                socialClone.className = 'd-flex gap-1';
                rightCol.appendChild(socialClone);
            }
            
            bottomRow.appendChild(leftCol);
            bottomRow.appendChild(rightCol);
            contentArea.appendChild(bottomRow);
            
            listLayout.appendChild(imageContainer);
            listLayout.appendChild(contentArea);
            
            // Add badges from original image container
            const badges = productImage.querySelectorAll('.badge');
            if (badges.length > 0) {
                const badgeContainer = document.createElement('div');
                badgeContainer.className = 'position-absolute top-0 end-0 p-2';
                badges.forEach(badge => {
                    badgeContainer.appendChild(badge.cloneNode(true));
                });
                listLayout.style.position = 'relative';
                listLayout.appendChild(badgeContainer);
            }
            
            // Replace card content
            card.innerHTML = '';
            card.appendChild(listLayout);
            card.classList.add('h-auto');
        }
    }

    /**
     * Update toggle buttons state
     */
    updateToggleButtons() {
        const viewToggle = document.getElementById('viewToggle');
        if (!viewToggle) return;

        const buttons = viewToggle.querySelectorAll('button[data-view]');
        buttons.forEach(btn => {
            const view = btn.dataset.view;
            if (view === this.currentView) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Get current view
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Save view preference to localStorage
     */
    saveViewPreference() {
        try {
            localStorage.setItem('catalog_view_preference', this.currentView);
        } catch (error) {
            console.error('Error saving view preference:', error);
        }
    }

    /**
     * Load view preference from localStorage
     */
    loadViewPreference() {
        try {
            const savedView = localStorage.getItem('catalog_view_preference');
            if (savedView && (savedView === 'grid' || savedView === 'list')) {
                this.currentView = savedView;
            }
        } catch (error) {
            console.error('Error loading view preference:', error);
        }
    }

    /**
     * Toggle between views
     */
    toggleView() {
        const newView = this.currentView === 'grid' ? 'list' : 'grid';
        this.setView(newView);
    }

    /**
     * Refresh current view (useful after products are reloaded)
     */
    refreshView() {
        this.applyView();
        this.updateToggleButtons();
    }
}

// Export for use in other modules
window.ViewToggleModule = ViewToggleModule;
