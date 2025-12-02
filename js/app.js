/**
 * ShoreSquad - Main JavaScript App
 * Handles interactivity, performance optimization, and accessibility
 */

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const CONFIG = {
    API: {
        // NEA Realtime Weather API from data.gov.sg (Singapore)
        WEATHER_REALTIME: 'https://api.data.gov.sg/v1/environment/air-temperature',
        WEATHER_FORECAST: 'https://api.data.gov.sg/v1/environment/4-day-weather-forecast',
        WEATHER_HUMIDITY: 'https://api.data.gov.sg/v1/environment/relative-humidity',
        MAPS: 'https://api.mapbox.com/styles/v1/mapbox/streets-v12',
    },
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300,
    WEATHER_CACHE_TIME: 600000, // 10 minutes cache
};

// Sample cleanup data
const CLEANUP_DATA = [
    {
        id: 1,
        name: 'Coral Bay Cleanup',
        date: '2025-12-14',
        time: '09:00 AM',
        location: 'Coral Bay',
        distance: 2.3,
        description: 'Join us for a morning beach cleanup! We\'ll collect plastic, organize by type, and report findings.',
        badge: 'Beginner Friendly',
        crewCount: 12,
        difficulty: 'beginner'
    },
    {
        id: 2,
        name: 'Sunset Beach Cleanup',
        date: '2025-12-15',
        time: '04:00 PM',
        location: 'Sunset Beach',
        distance: 5.1,
        description: 'Advanced cleanup with underwater survey and data collection for marine research.',
        badge: 'Experienced',
        crewCount: 8,
        difficulty: 'experienced'
    }
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Debounce function to limit API calls
 */
function debounce(func, delay = CONFIG.DEBOUNCE_DELAY) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Throttle function for scroll/resize events
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Local Storage wrapper with error handling
 */
const Storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (err) {
            console.warn(`Storage.get error for ${key}:`, err);
            return defaultValue;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (err) {
            console.warn(`Storage.set error for ${key}:`, err);
            return false;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (err) {
            console.warn(`Storage.remove error for ${key}:`, err);
            return false;
        }
    }
};

/**
 * Accessibility: Announce messages to screen readers
 */
function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

/**
 * Safe event listener helper with error handling
 */
function addListener(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    }
    return () => {};
}

// ============================================
// NAVIGATION & MOBILE MENU
// ============================================

class NavigationManager {
    constructor() {
        this.hamburger = document.getElementById('hamburger-btn');
        this.menu = document.getElementById('navbar-menu');
        this.init();
    }

    init() {
        if (this.hamburger && this.menu) {
            addListener(this.hamburger, 'click', () => this.toggleMenu());
            
            // Close menu when a link is clicked
            this.menu.querySelectorAll('a').forEach(link => {
                addListener(link, 'click', () => this.closeMenu());
            });
        }
    }

    toggleMenu() {
        const isOpen = this.menu.classList.contains('active');
        isOpen ? this.closeMenu() : this.openMenu();
    }

    openMenu() {
        this.menu.classList.add('active');
        this.hamburger.setAttribute('aria-expanded', 'true');
        announceToScreenReader('Navigation menu opened');
    }

    closeMenu() {
        this.menu.classList.remove('active');
        this.hamburger.setAttribute('aria-expanded', 'false');
    }
}

// ============================================
// MODAL MANAGEMENT
// ============================================

class ModalManager {
    constructor() {
        this.modal = document.getElementById('join-modal');
        this.form = document.getElementById('join-form');
        this.closeBtn = this.modal?.querySelector('.modal-close');
        this.init();
    }

    init() {
        if (this.modal) {
            // All join buttons
            document.querySelectorAll('#join-btn, #cta-join, .cleanup-card .btn-secondary, #final-cta').forEach(btn => {
                addListener(btn, 'click', (e) => {
                    e.preventDefault();
                    this.open();
                });
            });

            // Close button
            if (this.closeBtn) {
                addListener(this.closeBtn, 'click', () => this.close());
            }

            // Close on backdrop click
            addListener(this.modal, 'click', (e) => {
                if (e.target === this.modal) this.close();
            });

            // Close on Escape key
            addListener(document, 'keydown', (e) => {
                if (e.key === 'Escape' && this.modal.open) this.close();
            });

            // Form submission
            if (this.form) {
                addListener(this.form, 'submit', (e) => this.handleSubmit(e));
            }
        }
    }

    open() {
        if (this.modal) {
            this.modal.showModal();
            document.body.style.overflow = 'hidden';
            announceToScreenReader('Join ShoreSquad crew dialog opened');
            
            // Focus first input for accessibility
            const firstInput = this.form?.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    close() {
        if (this.modal) {
            this.modal.close();
            document.body.style.overflow = '';
            announceToScreenReader('Dialog closed');
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            location: formData.get('location'),
            joinedAt: new Date().toISOString()
        };

        // Save to local storage
        Storage.set('user_profile', userData);
        
        // Show success message
        announceToScreenReader('Successfully joined ShoreSquad crew!');
        console.log('User joined:', userData);

        // Reset form and close modal
        this.form.reset();
        this.close();
        
        // Update crew section (optional)
        this.updateCrewDisplay(userData);
    }

    updateCrewDisplay(userData) {
        const crewList = document.getElementById('crew-list');
        if (crewList && crewList.querySelector('.crew-member')) {
            const firstMember = crewList.querySelector('.crew-member .member-info h4');
            if (firstMember) {
                firstMember.textContent = userData.name;
            }
        }
    }
}

// ============================================
// FILTER MANAGEMENT
// ============================================

class FilterManager {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.init();
    }

    init() {
        this.filterButtons.forEach(btn => {
            addListener(btn, 'click', () => this.applyFilter(btn));
        });
    }

    applyFilter(button) {
        // Update button states
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');

        const filter = button.dataset.filter;
        announceToScreenReader(`Filter applied: ${filter}`);
        console.log(`Filter applied: ${filter}`);
    }
}

// ============================================
// LAZY LOADING
// ============================================

class LazyLoader {
    constructor() {
        if ('IntersectionObserver' in window) {
            this.init();
        }
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });

        // Observe images and other lazy-load candidates
        document.querySelectorAll('[data-lazy]').forEach(el => observer.observe(el));
    }

    loadElement(element) {
        if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-lazy');
        }
    }
}

// ============================================
// WEATHER MANAGEMENT - NEA Singapore Weather API
// ============================================

class WeatherManager {
    constructor() {
        this.weatherGrid = document.getElementById('weather-grid');
        this.weatherCache = null;
        this.lastFetchTime = 0;
        this.loadWeatherData = debounce(() => this.fetchWeather(), CONFIG.DEBOUNCE_DELAY);
    }

    /**
     * Fetch 4-day weather forecast from NEA API
     */
    async fetchWeather() {
        try {
            // Check cache
            const now = Date.now();
            if (this.weatherCache && (now - this.lastFetchTime) < CONFIG.WEATHER_CACHE_TIME) {
                console.log('Using cached weather data');
                this.renderWeather(this.weatherCache);
                return;
            }

            console.log('Fetching NEA weather data...');
            
            // Fetch 4-day forecast from NEA API
            const response = await fetch(CONFIG.API.WEATHER_FORECAST);
            
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Parse NEA API response
            const weatherData = this.parseNEAResponse(data);
            
            // Cache the data
            this.weatherCache = weatherData;
            this.lastFetchTime = now;
            
            this.renderWeather(weatherData);
            announceToScreenReader('Weather forecast updated');
        } catch (err) {
            console.error('Weather fetch error:', err);
            announceToScreenReader('Could not load weather data. Showing cached data.');
            
            // Fall back to cached data or simulated data
            if (this.weatherCache) {
                this.renderWeather(this.weatherCache);
            } else {
                this.renderWeatherFallback();
            }
        }
    }

    /**
     * Parse NEA API response for 4-day forecast
     * API returns forecast for multiple areas
     */
    parseNEAResponse(data) {
        try {
            if (!data.items || data.items.length === 0) {
                return this.getSimulatedWeather();
            }

            const forecast = data.items[0];
            
            // Map NEA forecast days to user-friendly format
            const weatherData = forecast.forecasts.slice(0, 4).map((dayForecast, index) => {
                const forecastDate = new Date();
                forecastDate.setDate(forecastDate.getDate() + index);
                
                return {
                    day: this.formatDay(forecastDate),
                    date: forecastDate.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' }),
                    condition: this.mapWeatherCondition(dayForecast.forecast),
                    forecast: dayForecast.forecast,
                    emoji: this.getWeatherEmoji(dayForecast.forecast)
                };
            });

            return weatherData;
        } catch (err) {
            console.warn('Error parsing NEA response:', err);
            return this.getSimulatedWeather();
        }
    }

    /**
     * Get simulated weather data (fallback)
     */
    getSimulatedWeather() {
        const forecast = [
            { day: 'Today', date: 'Dec 2', condition: 'Sunny', emoji: '☀️', forecast: 'Sunny' },
            { day: 'Tomorrow', date: 'Dec 3', condition: 'Partly Cloudy', emoji: '⛅', forecast: 'Partly cloudy' },
            { day: 'Wednesday', date: 'Dec 4', condition: 'Thundery', emoji: '⛈️', forecast: 'Thundery showers' },
            { day: 'Thursday', date: 'Dec 5', condition: 'Rainy', emoji: '🌧️', forecast: 'Rainy' }
        ];
        return forecast;
    }

    /**
     * Map NEA forecast text to user-friendly condition
     */
    mapWeatherCondition(forecast) {
        const text = forecast.toLowerCase();
        
        if (text.includes('sunny') || text.includes('fine')) return 'Sunny';
        if (text.includes('partly')) return 'Partly Cloudy';
        if (text.includes('cloudy') || text.includes('overcast')) return 'Cloudy';
        if (text.includes('rain')) return 'Rainy';
        if (text.includes('thunder') || text.includes('storm')) return 'Thundery';
        if (text.includes('showers')) return 'Showers';
        if (text.includes('wind')) return 'Windy';
        
        return forecast;
    }

    /**
     * Get emoji for weather condition
     */
    getWeatherEmoji(forecast) {
        const text = forecast.toLowerCase();
        
        if (text.includes('sunny') || text.includes('fine')) return '☀️';
        if (text.includes('partly')) return '⛅';
        if (text.includes('cloudy') || text.includes('overcast')) return '☁️';
        if (text.includes('thunder') || text.includes('storm')) return '⛈️';
        if (text.includes('showers')) return '🌧️';
        if (text.includes('rain')) return '🌧️';
        if (text.includes('wind')) return '💨';
        
        return '🌤️';
    }

    /**
     * Format date to day name
     */
    formatDay(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-SG', { weekday: 'short' });
        }
    }

    /**
     * Render 4-day weather forecast
     */
    renderWeather(data) {
        if (!this.weatherGrid) return;

        this.weatherGrid.innerHTML = data.map(weather => `
            <div class="weather-card" role="region" aria-label="Weather for ${weather.day}">
                <h4>${weather.day}</h4>
                <p class="weather-date">${weather.date}</p>
                <div style="font-size: 2.5rem; margin: 1rem 0;">${weather.emoji}</div>
                <p class="weather-condition"><strong>${weather.condition}</strong></p>
                <p style="font-size: 0.9rem; opacity: 0.9;">{{ weather.forecast }}</p>
            </div>
        `).join('');

        console.log('Weather cards rendered successfully');
    }

    /**
     * Render weather fallback UI
     */
    renderWeatherFallback() {
        if (!this.weatherGrid) return;

        this.weatherGrid.innerHTML = `
            <div class="weather-card" style="grid-column: 1/-1; text-align: center;">
                <p style="margin: 0; opacity: 0.7;">
                    Unable to fetch live weather data. Please check the NEA API connection.
                </p>
            </div>
        `;
    }

    init() {
        this.fetchWeather();
        
        // Refresh weather every 10 minutes
        setInterval(() => this.fetchWeather(), CONFIG.WEATHER_CACHE_TIME);
    }
}

// ============================================
// SMOOTH SCROLL NAVIGATION
// ============================================

class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            addListener(link, 'click', (e) => this.handleScroll(e));
        });
    }

    handleScroll(e) {
        const href = e.currentTarget.getAttribute('href');
        if (href && href !== '#') {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                announceToScreenReader(`Navigated to ${href}`);
            }
        }
    }
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

class PerformanceMonitor {
    constructor() {
        this.init();
    }

    init() {
        // Log Core Web Vitals
        if ('PerformanceObserver' in window) {
            try {
                // Largest Contentful Paint (LCP)
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay (FID)
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        console.log('FID:', entry.processingDuration);
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (err) {
                console.log('PerformanceObserver not fully supported');
            }
        }

        // Page load time
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log('Page Load Time:', loadTime, 'ms');
        });
    }
}

// ============================================
// SERVICE WORKER REGISTRATION (Offline Support)
// ============================================

class ServiceWorkerManager {
    constructor() {
        this.init();
    }

    init() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('SW registration failed:', err);
            });
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================

class App {
    constructor() {
        this.initializeApp();
    }

    initializeApp() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('🌊 ShoreSquad App Initializing...');

        // Initialize all managers
        new NavigationManager();
        new ModalManager();
        new FilterManager();
        new LazyLoader();
        new SmoothScroll();
        new PerformanceMonitor();
        new ServiceWorkerManager();

        // Initialize weather
        const weatherManager = new WeatherManager();
        weatherManager.init();

        // Load user profile if exists
        this.loadUserProfile();

        console.log('✅ ShoreSquad App Ready!');
    }

    loadUserProfile() {
        const userProfile = Storage.get('user_profile');
        if (userProfile) {
            console.log('Welcome back!', userProfile.name);
            announceToScreenReader(`Welcome back, ${userProfile.name}!`);
        }
    }
}

// ============================================
// APP STARTUP
// ============================================

// Start the app when script loads
const app = new App();

// Expose for debugging
window.ShoreSquad = {
    app,
    Storage,
    CONFIG,
    announceToScreenReader
};
