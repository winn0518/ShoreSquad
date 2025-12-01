/**
 * ShoreSquad - Main JavaScript App
 * Handles interactivity, performance optimization, and accessibility
 */

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const CONFIG = {
    API: {
        WEATHER: 'https://api.weatherapi.com/v1/current.json',
        MAPS: 'https://api.mapbox.com/styles/v1/mapbox/streets-v12',
    },
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300,
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
// WEATHER SIMULATION
// ============================================

class WeatherManager {
    constructor() {
        this.weatherGrid = document.getElementById('weather-grid');
        this.loadWeatherData = debounce(() => this.fetchWeather(), CONFIG.DEBOUNCE_DELAY);
    }

    async fetchWeather() {
        try {
            // Simulated weather data (in metric units: Celsius)
            const weatherData = [
                { location: 'Coral Bay', temp: 22, condition: '☀️ Sunny', humidity: 65 },
                { location: 'Sunset Beach', temp: 20, condition: '⛅ Partly Cloudy', humidity: 70 },
                { location: 'Reef Point', temp: 21, condition: '🌊 Windy', humidity: 75 }
            ];

            this.renderWeather(weatherData);
        } catch (err) {
            console.error('Weather fetch error:', err);
            announceToScreenReader('Could not load weather data');
        }
    }

    renderWeather(data) {
        if (!this.weatherGrid) return;

        this.weatherGrid.innerHTML = data.map(weather => `
            <div class="weather-card" role="region" aria-label="Weather for ${weather.location}">
                <h4>${weather.location}</h4>
                <div style="font-size: 2rem; margin: 1rem 0;">${weather.condition}</div>
                <p><strong>${weather.temp}°C</strong></p>
                <p>Humidity: ${weather.humidity}%</p>
            </div>
        `).join('');
    }

    init() {
        this.fetchWeather();
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
