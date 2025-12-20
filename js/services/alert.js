// js/services/alert.js
export class AlertService {
  static show(message, type = 'error', duration = 5000) {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    // Create alert element
    const alert = document.createElement('div');
    alert.className = `custom-alert custom-alert-${type}`;
    
    // Icon based on type
    const icons = {
      error: 'fa-circle-xmark',
      success: 'fa-circle-check',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    alert.innerHTML = `
      <div class="alert-content">
        <i class="fas ${icons[type]} alert-icon"></i>
        <span class="alert-message">${message}</span>
        <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="alert-progress"></div>
    `;

    // Add to body
    document.body.appendChild(alert);

    // Trigger animation
    setTimeout(() => alert.classList.add('show'), 10);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
      }, duration);
    }

    return alert;
  }

  static error(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  static success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  static warning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  static info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }
}