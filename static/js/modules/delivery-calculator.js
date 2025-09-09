/**
 * Delivery Calculator Module
 * Handles delivery cost calculation and shipping options
 */

class DeliveryCalculatorModule {
    constructor() {
        this.isInitialized = false;
        this.deliveryRates = {
            express: { name: 'Экспресс-доставка', baseRate: 500, perKg: 50, time: '2-4 часа' },
            standard: { name: 'Стандартная доставка', baseRate: 200, perKg: 20, time: '1-2 дня' },
            economy: { name: 'Экономная доставка', baseRate: 100, perKg: 10, time: '3-5 дней' },
            pickup: { name: 'Самовывоз', baseRate: 0, perKg: 0, time: 'В любое время' }
        };
        this.freeDeliveryThreshold = 3000;
        this.cityZones = {
            moscow: { name: 'Москва', zone: 1, modifier: 1.0 },
            spb: { name: 'Санкт-Петербург', zone: 1, modifier: 1.0 },
            cities1m: { name: 'Города 1М+', zone: 2, modifier: 1.2 },
            cities500k: { name: 'Города 500К+', zone: 3, modifier: 1.5 },
            cities100k: { name: 'Города 100К+', zone: 4, modifier: 2.0 },
            other: { name: 'Другие города', zone: 5, modifier: 2.5 }
        };
    }

    /**
     * Initialize the delivery calculator module
     */
    async init() {
        this.setupEventListeners();
        this.loadDeliveryData();
        this.isInitialized = true;
        console.log('Delivery calculator module initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle delivery modal form submission
        const deliveryForm = document.getElementById('deliveryForm');
        if (deliveryForm) {
            deliveryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculate();
            });
        }

        // Handle city input changes for autocomplete
        const cityInput = document.getElementById('deliveryCity');
        if (cityInput) {
            cityInput.addEventListener('input', (e) => {
                this.showCitySuggestions(e.target.value);
            });
        }

        // Handle weight changes
        const weightInput = document.getElementById('deliveryWeight');
        if (weightInput) {
            weightInput.addEventListener('input', () => {
                this.calculateAutomatic();
            });
        }
    }

    /**
     * Calculate delivery cost
     */
    calculate() {
        const city = document.getElementById('deliveryCity')?.value;
        const address = document.getElementById('deliveryAddress')?.value;
        const weight = parseFloat(document.getElementById('deliveryWeight')?.value) || 1;

        if (!city) {
            this.showError('Пожалуйста, укажите город доставки');
            return;
        }

        const cartTotal = this.getCartTotal();
        const zone = this.detectCityZone(city);
        const calculations = this.calculateAllOptions(weight, zone, cartTotal);

        this.displayResults(calculations, city, weight, cartTotal);
        this.trackCalculation(city, weight, cartTotal);
    }

    /**
     * Calculate all delivery options
     */
    calculateAllOptions(weight, zone, cartTotal) {
        const calculations = {};

        Object.entries(this.deliveryRates).forEach(([key, rate]) => {
            const baseCost = rate.baseRate;
            const weightCost = weight * rate.perKg;
            const totalCost = (baseCost + weightCost) * zone.modifier;
            
            // Apply free delivery threshold
            const finalCost = (cartTotal >= this.freeDeliveryThreshold && key !== 'express') 
                ? Math.max(0, totalCost - 200) 
                : totalCost;

            calculations[key] = {
                name: rate.name,
                cost: Math.round(finalCost),
                time: rate.time,
                baseCost: baseCost,
                weightCost: weightCost,
                zoneModifier: zone.modifier,
                isFree: finalCost === 0
            };
        });

        return calculations;
    }

    /**
     * Display calculation results
     */
    displayResults(calculations, city, weight, cartTotal) {
        const resultContainer = document.getElementById('deliveryResult');
        if (!resultContainer) return;

        const freeDeliveryInfo = cartTotal >= this.freeDeliveryThreshold
            ? '<div class="alert alert-success mb-3">🎉 Бесплатная доставка доступна!</div>'
            : `<div class="alert alert-info mb-3">💝 Бесплатная доставка от ${this.freeDeliveryThreshold.toLocaleString()} ₽ (осталось ${(this.freeDeliveryThreshold - cartTotal).toLocaleString()} ₽)</div>`;

        const optionsHtml = Object.entries(calculations).map(([key, calc]) => `
            <div class="delivery-option ${calc.isFree ? 'border-success' : ''}" 
                 onclick="app.modules.deliveryCalculator.selectDeliveryOption('${key}', ${calc.cost})">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${calc.name}</h6>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>${calc.time}
                        </small>
                    </div>
                    <div class="text-end">
                        <span class="h5 mb-0 ${calc.isFree ? 'text-success' : ''}">
                            ${calc.isFree ? 'Бесплатно' : `${calc.cost.toLocaleString()} ₽`}
                        </span>
                        ${!calc.isFree && calc.cost !== calc.baseCost + calc.weightCost ? `
                            <br><small class="text-muted text-decoration-line-through">
                                ${Math.round(calc.baseCost + calc.weightCost).toLocaleString()} ₽
                            </small>
                        ` : ''}
                    </div>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        Базовая стоимость: ${calc.baseCost} ₽ + 
                        Вес (${weight} кг): ${calc.weightCost} ₽
                        ${calc.zoneModifier !== 1 ? ` × ${calc.zoneModifier} (зона)` : ''}
                    </small>
                </div>
            </div>
        `).join('');

        resultContainer.innerHTML = `
            ${freeDeliveryInfo}
            <h6>Варианты доставки в г. ${city}:</h6>
            <div class="delivery-options">
                ${optionsHtml}
            </div>
            <div class="mt-3">
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    Стоимость может изменяться в зависимости от точного адреса и габаритов товара
                </small>
            </div>
        `;

        resultContainer.classList.remove('d-none');
    }

    /**
     * Detect city zone based on city name
     */
    detectCityZone(cityName) {
        const city = cityName.toLowerCase().trim();
        
        // Major cities
        if (city.includes('москва') || city.includes('moscow')) {
            return this.cityZones.moscow;
        }
        if (city.includes('санкт-петербург') || city.includes('спб') || city.includes('петербург')) {
            return this.cityZones.spb;
        }

        // Cities 1M+
        const largeCities = [
            'новосибирск', 'екатеринбург', 'казань', 'нижний новгород', 
            'челябинск', 'самара', 'омск', 'ростов-на-дону', 'уфа', 
            'красноярск', 'воронеж', 'пермь'
        ];
        if (largeCities.some(largeCity => city.includes(largeCity))) {
            return this.cityZones.cities1m;
        }

        // Cities 500K+
        const mediumCities = [
            'волгоград', 'краснодар', 'саратов', 'тюмень', 'тольятти',
            'ижевск', 'барнаул', 'ульяновск', 'иркутск', 'хабаровск',
            'ярославль', 'владивосток', 'махачкала', 'томск', 'оренбург'
        ];
        if (mediumCities.some(mediumCity => city.includes(mediumCity))) {
            return this.cityZones.cities500k;
        }

        // Cities 100K+
        const smallCities = [
            'кемерово', 'рязань', 'тула', 'липецк', 'пенза', 'киров',
            'чебоксары', 'калининград', 'брянск', 'курск', 'иваново',
            'магнитогорск', 'тверь', 'ставрополь', 'симферополь'
        ];
        if (smallCities.some(smallCity => city.includes(smallCity))) {
            return this.cityZones.cities100k;
        }

        // Default to other cities
        return this.cityZones.other;
    }

    /**
     * Show city suggestions
     */
    showCitySuggestions(query) {
        if (query.length < 2) return;

        const russianCities = [
            'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
            'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
            'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград', 'Краснодар',
            'Саратов', 'Тюмень', 'Тольятти', 'Ижевск', 'Барнаул', 'Ульяновск',
            'Иркутск', 'Хабаровск', 'Ярославль', 'Владивосток', 'Махачкала',
            'Томск', 'Оренбург', 'Кемерово', 'Рязань', 'Тула', 'Липецк'
        ];

        const suggestions = russianCities
            .filter(city => city.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5);

        this.displayCitySuggestions(suggestions);
    }

    /**
     * Display city suggestions
     */
    displayCitySuggestions(suggestions) {
        let suggestionsContainer = document.getElementById('citySuggestions');
        
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'citySuggestions';
            suggestionsContainer.className = 'list-group position-absolute w-100';
            suggestionsContainer.style.zIndex = '1050';
            
            const cityInput = document.getElementById('deliveryCity');
            cityInput.parentNode.style.position = 'relative';
            cityInput.parentNode.appendChild(suggestionsContainer);
        }

        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(city => `
            <button type="button" class="list-group-item list-group-item-action" 
                    onclick="app.modules.deliveryCalculator.selectCity('${city}')">
                ${city}
            </button>
        `).join('');

        suggestionsContainer.style.display = 'block';
    }

    /**
     * Select city from suggestions
     */
    selectCity(city) {
        const cityInput = document.getElementById('deliveryCity');
        const suggestionsContainer = document.getElementById('citySuggestions');
        
        if (cityInput) {
            cityInput.value = city;
        }
        
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }

        this.calculateAutomatic();
    }

    /**
     * Automatic calculation when parameters change
     */
    calculateAutomatic() {
        const city = document.getElementById('deliveryCity')?.value;
        const weight = parseFloat(document.getElementById('deliveryWeight')?.value);
        
        if (city && weight) {
            // Debounced calculation
            clearTimeout(this.autoCalcTimeout);
            this.autoCalcTimeout = setTimeout(() => {
                this.calculate();
            }, 500);
        }
    }

    /**
     * Select delivery option
     */
    selectDeliveryOption(optionKey, cost) {
        const option = this.deliveryRates[optionKey];
        
        // Remove previous selections
        document.querySelectorAll('.delivery-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Mark as selected
        event.currentTarget.classList.add('selected');
        
        // Store selection
        this.selectedOption = {
            key: optionKey,
            name: option.name,
            cost: cost,
            time: option.time
        };

        // Update checkout button
        this.updateCheckoutButton();
        
        // Show confirmation
        if (window.app?.modules?.notifications) {
            window.app.modules.notifications.show(
                `Выбрана доставка: ${option.name} - ${cost === 0 ? 'Бесплатно' : cost.toLocaleString() + ' ₽'}`,
                'success'
            );
        }

        // Track selection
        this.trackDeliverySelection(optionKey, cost);
    }

    /**
     * Update checkout button with delivery info
     */
    updateCheckoutButton() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (!checkoutBtn || !this.selectedOption) return;

        const cartTotal = this.getCartTotal();
        const totalWithDelivery = cartTotal + this.selectedOption.cost;
        
        checkoutBtn.innerHTML = `
            Оформить заказ - ${totalWithDelivery.toLocaleString()} ₽
            <small class="d-block">включая доставку: ${this.selectedOption.cost === 0 ? 'бесплатно' : this.selectedOption.cost.toLocaleString() + ' ₽'}</small>
        `;
    }

    /**
     * Get current cart total
     */
    getCartTotal() {
        if (window.app?.modules?.cart) {
            return window.app.modules.cart.getTotal();
        }
        return 0;
    }

    /**
     * Calculate weight from cart items
     */
    calculateCartWeight() {
        if (!window.app?.modules?.cart) return 1;

        const cart = window.app.modules.cart.getCart();
        let totalWeight = 0;

        cart.forEach(item => {
            // Assume 0.5kg per item if not specified
            const itemWeight = item.weight || 0.5;
            totalWeight += itemWeight * item.quantity;
        });

        return Math.max(totalWeight, 0.1); // Minimum 0.1kg
    }

    /**
     * Show delivery calculator modal
     */
    showCalculator() {
        const modal = document.getElementById('deliveryModal');
        if (modal) {
            // Pre-fill weight from cart
            const weightInput = document.getElementById('deliveryWeight');
            if (weightInput) {
                weightInput.value = this.calculateCartWeight();
            }

            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const resultContainer = document.getElementById('deliveryResult');
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
            resultContainer.classList.remove('d-none');
        }
    }

    /**
     * Track delivery calculation
     */
    trackCalculation(city, weight, cartTotal) {
        if (window.app?.modules?.analytics) {
            window.app.modules.analytics.trackEvent('delivery_calculated', {
                city: city,
                weight: weight,
                cart_total: cartTotal,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Track delivery option selection
     */
    trackDeliverySelection(optionKey, cost) {
        if (window.app?.modules?.analytics) {
            window.app.modules.analytics.trackEvent('delivery_option_selected', {
                option: optionKey,
                cost: cost,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Load delivery data (rates, zones, etc.)
     */
    async loadDeliveryData() {
        try {
            const response = await fetch('/api/delivery/rates');
            if (response.ok) {
                const data = await response.json();
                if (data.rates) {
                    this.deliveryRates = { ...this.deliveryRates, ...data.rates };
                }
                if (data.freeThreshold) {
                    this.freeDeliveryThreshold = data.freeThreshold;
                }
                if (data.cityZones) {
                    this.cityZones = { ...this.cityZones, ...data.cityZones };
                }
            }
        } catch (error) {
            console.error('Error loading delivery data:', error);
        }
    }

    /**
     * Get available delivery options for city
     */
    getAvailableOptions(city) {
        const zone = this.detectCityZone(city);
        const cartTotal = this.getCartTotal();
        const weight = this.calculateCartWeight();
        
        return this.calculateAllOptions(weight, zone, cartTotal);
    }

    /**
     * Estimate delivery time
     */
    estimateDeliveryTime(optionKey, city) {
        const option = this.deliveryRates[optionKey];
        const zone = this.detectCityZone(city);
        
        if (!option) return 'Неизвестно';
        
        // Adjust time based on zone
        let timeMultiplier = 1;
        if (zone.zone > 2) {
            timeMultiplier = zone.zone / 2;
        }
        
        return option.time;
    }

    /**
     * Format delivery information
     */
    formatDeliveryInfo() {
        if (!this.selectedOption) return null;
        
        return {
            method: this.selectedOption.name,
            cost: this.selectedOption.cost,
            time: this.selectedOption.time,
            formatted: `${this.selectedOption.name} (${this.selectedOption.cost === 0 ? 'бесплатно' : this.selectedOption.cost.toLocaleString() + ' ₽'}) - ${this.selectedOption.time}`
        };
    }
}

// Export for use in other modules
window.DeliveryCalculatorModule = DeliveryCalculatorModule;
