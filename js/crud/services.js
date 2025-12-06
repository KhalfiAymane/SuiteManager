import { storage } from '../services/storage.js';
import { modal } from '../services/modal.js';
import { Validator } from '../services/validate.js';
import { debounce } from '../utils/debounce.js';

class ServicesManager {
    constructor() {
        this.currentServices = [];
        this.init();
    }

    init() {
        this.loadServices();
        this.setupEventListeners();
        this.setupSearch();
    }

    loadServices() {
        this.currentServices = storage.getAll('services');
        this.renderServices(this.currentServices);
    }

    renderServices(services) {
        const tbody = document.getElementById('services-tbody');
        if (!tbody) return;

        if (services.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div style="padding: 2rem; color: var(--text-light);">
                            <i class="fas fa-concierge-bell" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                            <p>No services found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = services.map(service => `
            <tr>
                <td>${service.name}</td>
                <td>${service.description}</td>
                <td>$${service.price}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="window.servicesManager.showDetailsModal('${service.id}')">
                            <i class="fas fa-eye"></i> Details
                        </button>
                        <button class="action-btn edit" onclick="window.servicesManager.editService('${service.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete" onclick="window.servicesManager.deleteService('${service.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-service-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddModal());
        }

        const exportCsv = document.getElementById('export-csv');
        if (exportCsv) {
            exportCsv.addEventListener('click', () => this.exportToCSV());
        }

        const exportPdf = document.getElementById('export-pdf');
        if (exportPdf) {
            exportPdf.addEventListener('click', () => this.exportToPDF());
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('search-services');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.currentServices.filter(service =>
                    service.name.toLowerCase().includes(term) ||
                    service.description.toLowerCase().includes(term)
                );
                this.renderServices(filtered);
            }, 300));
        }
    }

    showAddModal() {
        const fields = [
            { name: 'name', label: 'Service Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: false },
            { name: 'price', label: 'Price ($)', type: 'number', required: true, min: 0 }
        ];

        modal.showForm('Add New Service', fields, (data) => {
            return this.addService(data);
        });
    }

    addService(data) {
        const validation = Validator.validateForm(data, {
            name: ['required'],
            price: ['required', 'positiveNumber']
        });

        if (!validation.isValid) {
            Object.keys(validation.errors).forEach(field => {
                modal.showError(field, validation.errors[field]);
            });
            return false;
        }

        const serviceData = {
            name: data.name,
            description: data.description || '',
            price: parseFloat(data.price)
        };

        storage.create('services', serviceData);
        this.loadServices();
        return true;
    }

    showDetailsModal(serviceId) {
        const service = storage.getById('services', serviceId);
        if (!service) return;

        const content = `
            <div class="details-grid" style="display: grid; grid-template-columns: 1fr; gap: 1rem; padding: 1rem 0;">
                <div><strong>Service Name:</strong> ${service.name}</div>
                <div><strong>Description:</strong> ${service.description}</div>
                <div><strong>Price:</strong> $${service.price}</div>
                <div><strong>Created:</strong> ${new Date(service.createdAt).toLocaleDateString()}</div>
            </div>
        `;

        modal.show('Service Details', content, [
            { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
        ]);
    }

    editService(id) {
        const service = storage.getById('services', id);
        if (!service) return;

        const fields = [
            { name: 'name', label: 'Service Name', type: 'text', required: true, value: service.name },
            { name: 'description', label: 'Description', type: 'textarea', required: false, value: service.description },
            { name: 'price', label: 'Price ($)', type: 'number', required: true, min: 0, value: service.price }
        ];

        modal.showForm('Edit Service', fields, (data) => {
            return this.updateService(id, data);
        });
    }

    updateService(id, data) {
        const validation = Validator.validateForm(data, {
            name: ['required'],
            price: ['required', 'positiveNumber']
        });

        if (!validation.isValid) {
            Object.keys(validation.errors).forEach(field => {
                modal.showError(field, validation.errors[field]);
            });
            return false;
        }

        storage.update('services', id, {
            name: data.name,
            description: data.description || '',
            price: parseFloat(data.price)
        });
        
        this.loadServices();
        return true;
    }

    deleteService(id) {
        modal.confirm(
            'Delete Service',
            'Are you sure you want to delete this service?',
            () => {
                storage.delete('services', id);
                this.loadServices();
            }
        );
    }

    exportToCSV() {
        const headers = ['Service Name', 'Description', 'Price'];
        const data = this.currentServices.map(service => [
            service.name,
            service.description,
            service.price
        ]);
        
        const csvContent = [
            headers.join(','),
            ...data.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'services.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    exportToPDF() {
        alert('PDF export would be implemented here');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.servicesManager = new ServicesManager();
});