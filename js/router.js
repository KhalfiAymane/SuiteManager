// Simple Router for SPA-like navigation
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.init();
  }

  init() {
    // Listen for navigation events
    window.addEventListener('popstate', () => this.handleRouteChange());
    
    // Intercept link clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('a[data-route]')) {
        e.preventDefault();
        const route = e.target.getAttribute('data-route');
        this.navigate(route);
      }
    });
  }

  register(path, handler) {
    this.routes.set(path, handler);
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRouteChange();
  }

  handleRouteChange() {
    const path = window.location.pathname;
    const handler = this.routes.get(path);
    
    if (handler) {
      this.currentRoute = path;
      handler();
    } else {
      // Default route or 404
      const defaultHandler = this.routes.get('/') || (() => {});
      defaultHandler();
    }
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

export const router = new Router();