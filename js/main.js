// Main Application Entry Point
import { AuthService } from './auth/login.js';
import { PermissionManager } from './auth/permissions.js';
import { translations } from './utils/translations.js';

class App {
  constructor() {
    this.init();
  }

  init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/js/sw.js')
        .then(reg => console.log('Service Worker registered:', reg))
        .catch(err => console.log('Service Worker registration failed:', err));
    }

    // Check if on login page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
      return;
    }

    // Check authentication for other pages
    if (!AuthService.checkAuth()) {
      return;
    }

    // Initialize permissions
    PermissionManager.init();

    // Load saved theme
    this.loadTheme();

    // Load saved language
    this.loadLanguage();

    // Setup global navigation
    this.setupNavigation();
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }
  }

  async loadLanguage() {
    const savedLang = localStorage.getItem('language') || 'en';
    await translations.loadLanguage(savedLang);
  }

  setupNavigation() {
    // Highlight active nav link
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('active');
      }
    });

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !mobileToggle.contains(e.target) &&
            sidebar.classList.contains('active')) {
          sidebar.classList.remove('active');
        }
      });
    }
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  new App();
});