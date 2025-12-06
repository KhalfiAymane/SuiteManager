import { StatsCalculator } from './stats.js';
import { storage } from '../services/storage.js';

export class ChartsManager {
  constructor() {
    this.charts = {};
  }

  createReservationsChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = StatsCalculator.getReservationsByMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Reservations',
          data: data,
          borderColor: '#73AF6F',
          backgroundColor: 'rgba(115, 175, 111, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  createRoomOccupancyChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = StatsCalculator.getRoomOccupancy();

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Available', 'Occupied', 'Maintenance'],
        datasets: [{
          data: [data.available, data.occupied, data.maintenance],
          backgroundColor: [
            '#73AF6F',
            '#007E6E',
            '#D7C097'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12
          }
        }
      }
    });
  }

  createClientsByCountryChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = StatsCalculator.getClientsByCountry();
    const countries = Object.keys(data);
    const counts = Object.values(data);

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: countries,
        datasets: [{
          label: 'Clients',
          data: counts,
          backgroundColor: '#73AF6F',
          borderRadius: 6,
          maxBarThickness: 60
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  createRevenueChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = StatsCalculator.getRevenueStats();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Revenue ($)',
          data: data,
          backgroundColor: '#007E6E',
          borderRadius: 6,
          maxBarThickness: 50
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: function(context) {
                return '$' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  createStaffChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Get staff data directly from storage if StatsCalculator doesn't work
    let staffData;
    try {
      staffData = StatsCalculator.getStaffDistribution();
    } catch (error) {
      console.log('Using fallback staff data');
      // Fallback: calculate staff distribution manually
      const allStaff = storage.getAll('staff');
      const morning = allStaff.filter(s => s.shift === 'Morning' || s.shift === 'Day').length;
      const evening = allStaff.filter(s => s.shift === 'Evening').length;
      const night = allStaff.filter(s => s.shift === 'Night').length;
      
      staffData = { morning, evening, night };
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Morning', 'Evening', 'Night'],
        datasets: [{
          data: [staffData.morning || 0, staffData.evening || 0, staffData.night || 0],
          backgroundColor: [
            '#73AF6F',
            '#007E6E',
            '#D7C097'
          ],
          borderWidth: 0,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} staff (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  destroyChart(canvasId) {
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
      delete this.charts[canvasId];
    }
  }

  destroyAll() {
    Object.keys(this.charts).forEach(id => this.destroyChart(id));
  }
}