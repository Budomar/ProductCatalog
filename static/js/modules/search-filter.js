/**
 * Search and Filter Module
 * Handles advanced search and filtering functionality
 */

class SearchFilterModule {
    constructor() {
        this.searchHistory = [];
        this.popularSearches = [];
        this.isInitialized = false;
        this.searchSuggestions = [];
    }

    /**
     * Initialize the search filter module
     */
    async init() {
        this.loadSearchHistory();
        this.setupEventListeners();
        this.setupSearchSuggestions();
        this.isInitialized = true;
        console.log('Search filter module initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Add search suggestions functionality
            searchInput.addEventListener('focus', () => this.showSearchSuggestions());
            searchInput.addEventListener('blur', () => {
                setTimeout(() => this.hideSearchSuggestions(), 200);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                this.handleSearchKeydown(e);
            });
        }

        // Setup filter change listeners
        this.setupFilterListeners();
    }

    /**
     * Setup filter listeners
     */
    setupFilterListeners() {
        // Price range filter (if exists)
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        
        if (priceMin && priceMax) {
            [priceMin, priceMax].forEach(input => {
                input.addEventListener('input', () => {
                    this.applyPriceFilter();
                });
            });
        }

        // Advanced filters toggle
        const advancedToggle = document.getElementById('advancedFiltersToggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => {
                this.toggleAdvancedFilters();
            });
        }
    }

    /**
     * Setup search suggestions
     */
    setupSearchSuggestions() {
        const searchContainer = document.querySelector('.navbar-nav form.d-flex');
        if (!searchContainer) return;

        // Create suggestions dropdown
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'searchSuggestions';
        suggestionsContainer.className = 'position-absolute bg-dark border rounded mt-1 d-none';
        suggestionsContainer.style.top = '100%';
        suggestionsContainer.style.left = '0';
        suggestionsContainer.style.right = '0';
        suggestionsContainer.style.zIndex = '1050';
        suggestionsContainer.style.maxHeight = '300px';
        suggestionsContainer.style.overflowY = 'auto';

        searchContainer.style.position = 'relative';
        searchContainer.appendChild(suggestionsContainer);
    }

    /**
     * Handle search input keydown
     */
    handleSearchKeydown(e) {
        const suggestions = document.getElementById('searchSuggestions');
        if (!suggestions) return;

        const items = suggestions.querySelectorAll('.suggestion-item');
        const activeItem = suggestions.querySelector('.suggestion-item.active');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.navigateSuggestions(items, 'down');
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateSuggestions(items, 'up');
                break;
            case 'Enter':
                if (activeItem) {
                    e.preventDefault();
                    this.selectSuggestion(activeItem.textContent);
                }
                break;
            case 'Escape':
                this.hideSearchSuggestions();
                break;
        }
    }

    /**
     * Navigate through search suggestions
     */
    navigateSuggestions(items, direction) {
        const activeItem = document.querySelector('.suggestion-item.active');
        let newActiveIndex = -1;

        if (activeItem) {
            const currentIndex = Array.from(items).indexOf(activeItem);
            activeItem.classList.remove('active');
            
            if (direction === 'down') {
                newActiveIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            } else {
                newActiveIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            }
        } else {
            newActiveIndex = direction === 'down' ? 0 : items.length - 1;
        }

        if (items[newActiveIndex]) {
            items[newActiveIndex].classList.add('active');
        }
    }

    /**
     * Show search suggestions
     */
    showSearchSuggestions() {
        const searchInput = document.getElementById('searchInput');
        const suggestions = document.getElementById('searchSuggestions');
        
        if (!searchInput || !suggestions) return;

        const query = searchInput.value.toLowerCase();
        const suggestionsList = this.generateSuggestions(query);
        
        if (suggestionsList.length > 0) {
            suggestions.innerHTML = suggestionsList.map(suggestion => `
                <div class="suggestion-item px-3 py-2 cursor-pointer hover-bg-secondary" 
                     onclick="app.modules.searchFilter.selectSuggestion('${suggestion.text}')">
                    <i class="${suggestion.icon} me-2"></i>
                    ${this.highlightMatch(suggestion.text, query)}
                    ${suggestion.type ? `<small class="text-muted ms-2">(${suggestion.type})</small>` : ''}
                </div>
            `).join('');
            
            suggestions.classList.remove('d-none');
        } else {
            this.hideSearchSuggestions();
        }
    }

    /**
     * Hide search suggestions
     */
    hideSearchSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.classList.add('d-none');
        }
    }

    /**
     * Generate search suggestions
     */
    generateSuggestions(query) {
        const suggestions = [];

        if (!query) {
            // Show search history and popular searches when no query
            this.searchHistory.slice(-5).forEach(search => {
                suggestions.push({
                    text: search,
                    icon: 'fas fa-history',
                    type: 'История'
                });
            });

            this.popularSearches.slice(0, 3).forEach(search => {
                suggestions.push({
                    text: search,
                    icon: 'fas fa-fire',
                    type: 'Популярное'
                });
            });

            return suggestions;
        }

        // Product suggestions
        const products = window.app?.products || [];
        const matchingProducts = products
            .filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.description?.toLowerCase().includes(query)
            )
            .slice(0, 5);

        matchingProducts.forEach(product => {
            suggestions.push({
                text: product.name,
                icon: 'fas fa-box',
                type: 'Товар'
            });
        });

        // Category suggestions
        const categories = window.app?.categories || [];
        const matchingCategories = categories
            .filter(category => category.toLowerCase().includes(query))
            .slice(0, 3);

        matchingCategories.forEach(category => {
            suggestions.push({
                text: category,
                icon: 'fas fa-tags',
                type: 'Категория'
            });
        });

        return suggestions;
    }

    /**
     * Highlight matching text in suggestions
     */
    highlightMatch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Select a suggestion
     */
    selectSuggestion(text) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = text;
            this.addToSearchHistory(text);
            
            // Trigger search
            const event = new Event('input', { bubbles: true });
            searchInput.dispatchEvent(event);
        }
        
        this.hideSearchSuggestions();
    }

    /**
     * Add search term to history
     */
    addToSearchHistory(term) {
        if (!term || this.searchHistory.includes(term)) return;
        
        this.searchHistory.push(term);
        
        // Keep only last 10 searches
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(-10);
        }
        
        this.saveSearchHistory();
    }

    /**
     * Apply price range filter
     */
    applyPriceFilter() {
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        
        if (!priceMin || !priceMax) return;

        const min = parseFloat(priceMin.value) || 0;
        const max = parseFloat(priceMax.value) || Infinity;

        // Update app filters if available
        if (window.app) {
            window.app.currentFilters.priceMin = min;
            window.app.currentFilters.priceMax = max;
            window.app.filterProducts();
        }
    }

    /**
     * Toggle advanced filters
     */
    toggleAdvancedFilters() {
        const advancedPanel = document.getElementById('advancedFiltersPanel');
        const toggle = document.getElementById('advancedFiltersToggle');
        
        if (advancedPanel && toggle) {
            const isVisible = !advancedPanel.classList.contains('d-none');
            
            if (isVisible) {
                advancedPanel.classList.add('d-none');
                toggle.innerHTML = '<i class="fas fa-chevron-down"></i> Дополнительные фильтры';
            } else {
                advancedPanel.classList.remove('d-none');
                toggle.innerHTML = '<i class="fas fa-chevron-up"></i> Скрыть фильтры';
            }
        }
    }

    /**
     * Create advanced filters panel
     */
    createAdvancedFiltersPanel() {
        const filtersHtml = `
            <div id="advancedFiltersPanel" class="card mt-3 d-none">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <label class="form-label">Цена от</label>
                            <input type="number" class="form-control" id="priceMin" placeholder="0">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Цена до</label>
                            <input type="number" class="form-control" id="priceMax" placeholder="1000000">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Сортировка</label>
                            <select class="form-select" id="advancedSort">
                                <option value="name">По названию</option>
                                <option value="price_asc">По цене (возр.)</option>
                                <option value="price_desc">По цене (убыв.)</option>
                                <option value="views">По популярности</option>
                                <option value="newest">Новинки</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">На странице</label>
                            <select class="form-select" id="itemsPerPage">
                                <option value="12">12 товаров</option>
                                <option value="24">24 товара</option>
                                <option value="48">48 товаров</option>
                                <option value="all">Все товары</option>
                            </select>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="hasImages" checked>
                                <label class="form-check-label" for="hasImages">
                                    Только с изображениями
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="hasSpecs">
                                <label class="form-check-label" for="hasSpecs">
                                    Только с характеристиками
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <button class="btn btn-primary me-2" onclick="app.modules.searchFilter.applyAdvancedFilters()">
                                Применить фильтры
                            </button>
                            <button class="btn btn-outline-secondary" onclick="app.modules.searchFilter.resetAdvancedFilters()">
                                Сбросить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return filtersHtml;
    }

    /**
     * Apply advanced filters
     */
    applyAdvancedFilters() {
        const priceMin = document.getElementById('priceMin')?.value;
        const priceMax = document.getElementById('priceMax')?.value;
        const sort = document.getElementById('advancedSort')?.value;
        const hasImages = document.getElementById('hasImages')?.checked;
        const hasSpecs = document.getElementById('hasSpecs')?.checked;

        if (window.app) {
            // Update filters
            if (priceMin) window.app.currentFilters.priceMin = parseFloat(priceMin);
            if (priceMax) window.app.currentFilters.priceMax = parseFloat(priceMax);
            if (sort) window.app.currentFilters.sort = sort;
            
            window.app.currentFilters.hasImages = hasImages;
            window.app.currentFilters.hasSpecs = hasSpecs;
            
            window.app.filterProducts();
        }
    }

    /**
     * Reset advanced filters
     */
    resetAdvancedFilters() {
        document.getElementById('priceMin').value = '';
        document.getElementById('priceMax').value = '';
        document.getElementById('advancedSort').value = 'name';
        document.getElementById('hasImages').checked = true;
        document.getElementById('hasSpecs').checked = false;
        
        this.applyAdvancedFilters();
    }

    /**
     * Get search suggestions for autocomplete
     */
    getSearchSuggestions(query) {
        return this.generateSuggestions(query);
    }

    /**
     * Save search history to localStorage
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('catalog_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    /**
     * Load search history from localStorage
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('catalog_search_history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
        }
    }

    /**
     * Clear search history
     */
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }
}

// Add CSS for suggestions
const style = document.createElement('style');
style.textContent = `
    .suggestion-item:hover {
        background-color: var(--bs-secondary-bg) !important;
    }
    
    .suggestion-item.active {
        background-color: var(--bs-primary-bg-subtle) !important;
    }
    
    .suggestion-item mark {
        background-color: var(--bs-warning);
        color: var(--bs-dark);
        padding: 0 2px;
        border-radius: 2px;
    }
`;
document.head.appendChild(style);

// Export for use in other modules
window.SearchFilterModule = SearchFilterModule;
