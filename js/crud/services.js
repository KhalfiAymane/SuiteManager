import { storage } from '../services/storage.js';
import { modal } from '../services/modal.js';
import { Validator } from '../services/validate.js';
import { debounce } from '../utils/debounce.js';
import { PDFExporter } from '../services/pdf.js';
import { AlertService } from '../services/alert.js';

class ServicesManager {
    constructor() {
        this.currentServices = [];
        this.init();
    }

    init() {
        try {
            this.loadServices();
            this.setupEventListeners();
            this.setupSearch();
        } catch (error) {
            console.error('Initialization error:', error);
            AlertService.error('Failed to initialize services. Please refresh the page.');
        }
    }

    loadServices() {
        try {
            this.currentServices = storage.getAll('services');
            this.renderServices(this.currentServices);
        } catch (error) {
            console.error('Load error:', error);
            AlertService.error('Failed to load services. Please try again.');
        }
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
        try {
            const validation = Validator.validateForm(data, {
                name: ['required'],
                price: ['required', 'positiveNumber']
            });

            if (!validation.isValid) {
                Object.keys(validation.errors).forEach(field => {
                    modal.showError(field, validation.errors[field]);
                });
                AlertService.error('Please fix the form errors before submitting.');
                return false;
            }

            const serviceData = {
                name: data.name,
                description: data.description || '',
                price: parseFloat(data.price)
            };

            storage.create('services', serviceData);
            this.loadServices();
            AlertService.success('Service added successfully!');
            return true;
        } catch (error) {
            console.error('Add service error:', error);
            AlertService.error('Failed to add service. Please try again.');
            return false;
        }
    }

    showDetailsModal(serviceId) {
        try {
            const service = storage.getById('services', serviceId);
            if (!service) {
                AlertService.error('Service not found.');
                return;
            }

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
        } catch (error) {
            console.error('Details modal error:', error);
            AlertService.error('Failed to load service details.');
        }
    }

    editService(id) {
        try {
            const service = storage.getById('services', id);
            if (!service) {
                AlertService.error('Service not found.');
                return;
            }

            const fields = [
                { name: 'name', label: 'Service Name', type: 'text', required: true, value: service.name },
                { name: 'description', label: 'Description', type: 'textarea', required: false, value: service.description },
                { name: 'price', label: 'Price ($)', type: 'number', required: true, min: 0, value: service.price }
            ];

            modal.showForm('Edit Service', fields, (data) => {
                return this.updateService(id, data);
            });
        } catch (error) {
            console.error('Edit modal error:', error);
            AlertService.error('Failed to load service details.');
        }
    }

    updateService(id, data) {
        try {
            const validation = Validator.validateForm(data, {
                name: ['required'],
                price: ['required', 'positiveNumber']
            });

            if (!validation.isValid) {
                Object.keys(validation.errors).forEach(field => {
                    modal.showError(field, validation.errors[field]);
                });
                AlertService.error('Please fix the form errors before submitting.');
                return false;
            }

            storage.update('services', id, {
                name: data.name,
                description: data.description || '',
                price: parseFloat(data.price)
            });
            
            this.loadServices();
            AlertService.success('Service updated successfully!');
            return true;
        } catch (error) {
            console.error('Update service error:', error);
            AlertService.error('Failed to update service. Please try again.');
            return false;
        }
    }

    deleteService(id) {
        modal.confirm(
            'Delete Service',
            'Are you sure you want to delete this service?',
            () => {
                try {
                    storage.delete('services', id);
                    this.loadServices();
                    AlertService.success('Service deleted successfully!');
                } catch (error) {
                    console.error('Delete service error:', error);
                    AlertService.error('Failed to delete service. Please try again.');
                }
            }
        );
    }

    exportToCSV() {
        try {
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
            AlertService.success('CSV exported successfully!');
        } catch (error) {
            console.error('CSV export error:', error);
            AlertService.error('Failed to export CSV. Please try again.');
        }
    }

    exportToPDF() {
        try {
            const columns = [
                { field: 'name', label: 'Service Name' },
                { field: 'description', label: 'Description' },
                { field: 'price', label: 'Price' }
            ];
            
            const data = this.currentServices.map(service => ({
                name: service.name,
                description: service.description,
                price: `$${service.price}`
            }));
            
            PDFExporter.export(data, 'services', columns, 'Services Report');
            AlertService.success('PDF exported successfully!');
        } catch (error) {
            console.error('PDF export error:', error);
            AlertService.error('Failed to export PDF. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.servicesManager = new ServicesManager();
});