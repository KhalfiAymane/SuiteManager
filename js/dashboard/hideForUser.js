import { AuthService } from '../auth/login.js';

export function hideElementsForUser() {
  if (AuthService.getRole() === 'user') {
    // Hide revenue KPI
    const revenueKPI = document.querySelector('[data-kpi="revenue"]');
    if (revenueKPI) {
      revenueKPI.remove();
    }

    // Hide revenue chart
    const revenueChart = document.getElementById('revenue-chart');
    if (revenueChart) {
      revenueChart.closest('.chart-container')?.remove();
    }

    // Hide staff chart
    const staffChart = document.getElementById('staff-chart');
    if (staffChart) {
      staffChart.closest('.chart-container')?.remove();
    }
  }
}