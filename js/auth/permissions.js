import { AuthService } from './login.js';

export class PermissionManager {
  static init() {
    if (!AuthService.isAuthenticated()) {
      return;
    }

    const role = AuthService.getRole();

    if (role === 'user') {
      this.hideAdminElements();
      this.hideAdminPages();
    }
  }

  static hideAdminElements() {
    // Hide all elements with admin-only class
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = 'none';
    });

    // Hide specific charts
    const adminCharts = ['revenue-chart', 'staff-chart'];
    adminCharts.forEach(chartId => {
      const chart = document.getElementById(chartId);
      if (chart) {
        chart.closest('.chart-container')?.remove();
      }
    });

    // Hide revenue KPI
    const revenueKPI = document.querySelector('[data-kpi="revenue"]');
    if (revenueKPI) {
      revenueKPI.remove();
    }
  }

  static hideAdminPages() {
    const currentPage = window.location.pathname.split('/').pop();
    const adminPages = ['staff.html', 'services.html'];

    if (adminPages.includes(currentPage)) {
      window.location.href = '/dashboard.html';
    }

    // Hide navigation links to admin pages
    document.querySelectorAll('a[href="staff.html"], a[href="services.html"]').forEach(link => {
      link.style.display = 'none';
    });
  }

  static canEdit() {
    return AuthService.isAdmin();
  }

  static canDelete() {
    return AuthService.isAdmin();
  }

  static canCreate() {
    return AuthService.isAdmin();
  }
}

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PermissionManager.init());
} else {
  PermissionManager.init();
}