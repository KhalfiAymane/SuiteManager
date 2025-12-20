import { storage } from '../services/storage.js';
import { modal } from '../services/modal.js';
import { Client } from '../models/Client.js';
import { Validator } from '../services/validate.js';
import { CSVExporter } from '../services/csv.js';
import { PDFExporter } from '../services/pdf.js';
import { debounce } from '../utils/debounce.js';
import { PermissionManager } from '../auth/permissions.js';
import { translations } from '../utils/translations.js';
import { AlertService } from '../services/alert.js';

export class ClientsManager {
  constructor() {
    this.clients = [];
    this.filteredClients = [];
    this.init();
  }

  init() {
    try {
      this.loadClients();
      this.setupEventListeners();
      this.render();
    } catch (error) {
      console.error('Initialization error:', error);
      AlertService.error('Failed to initialize clients. Please refresh the page.');
    }
  }

  loadClients() {
    try {
      const clientsData = storage.getAll('clients');
      this.clients = clientsData.map(c => Client.fromJSON(c));
      this.filteredClients = [...this.clients];
    } catch (error) {
      console.error('Load error:', error);
      AlertService.error('Failed to load clients. Please try again.');
    }
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search-clients');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filterClients(e.target.value);
      }, 300));
    }

    const addBtn = document.getElementById('add-client-btn');
    if (addBtn) {
      if (!PermissionManager.canCreate()) {
        addBtn.style.display = 'none';
      } else {
        addBtn.addEventListener('click', () => this.showAddModal());
      }
    }

    document.getElementById('export-csv')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('export-pdf')?.addEventListener('click', () => this.exportPDF());
  }

  filterClients(searchTerm) {
    const term = searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client => 
      client.name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      client.phone.toLowerCase().includes(term) ||
      client.nationality.toLowerCase().includes(term)
    );
    this.render();
  }

  showAddModal() {
    if (!PermissionManager.canCreate()) {
      modal.show('Access Denied', '<p>You do not have permission to add clients.</p>', [
        { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
      ]);
      return;
    }

    const fields = [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'nationality', label: 'Nationality', type: 'text', required: true },
      { name: 'stays', label: 'Number of Stays', type: 'number', required: true, min: 0, value: 0 }
    ];

    modal.showForm('Add Client', fields, (data) => {
      return this.addClient(data);
    });
  }

  addClient(data) {
    try {
      const validation = Validator.validateForm(data, {
        name: ['required'],
        email: ['required', 'email'],
        phone: ['required', 'phone'],
        nationality: ['required']
      });

      if (!validation.isValid) {
        Object.keys(validation.errors).forEach(field => {
          modal.showError(field, validation.errors[field]);
        });
        AlertService.error('Please fix the form errors before submitting.');
        return false;
      }

      const client = new Client(null, data.name, data.email, data.phone, data.nationality, data.stays);
      storage.save('clients', client.toJSON());
      this.loadClients();
      this.render();
      AlertService.success('Client added successfully!');
      return true;
    } catch (error) {
      console.error('Add client error:', error);
      AlertService.error('Failed to add client. Please try again.');
      return false;
    }
  }

  showEditModal(clientId) {
    if (!PermissionManager.canEdit()) {
      modal.show('Access Denied', '<p>You do not have permission to edit clients.</p>', [
        { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
      ]);
      return;
    }

    try {
      const client = this.clients.find(c => c.id === clientId);
      if (!client) {
        AlertService.error('Client not found.');
        return;
      }

      const fields = [
        { name: 'name', label: 'Name', type: 'text', required: true, value: client.name },
        { name: 'email', label: 'Email', type: 'email', required: true, value: client.email },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, value: client.phone },
        { name: 'nationality', label: 'Nationality', type: 'text', required: true, value: client.nationality },
        { name: 'stays', label: 'Number of Stays', type: 'number', required: true, min: 0, value: client.stays }
      ];

      modal.showForm('Edit Client', fields, (data) => {
        return this.editClient(clientId, data);
      });
    } catch (error) {
      console.error('Edit modal error:', error);
      AlertService.error('Failed to load client details.');
    }
  }

  editClient(clientId, data) {
    try {
      const validation = Validator.validateForm(data, {
        name: ['required'],
        email: ['required', 'email'],
        phone: ['required', 'phone'],
        nationality: ['required']
      });

      if (!validation.isValid) {
        Object.keys(validation.errors).forEach(field => {
          modal.showError(field, validation.errors[field]);
        });
        AlertService.error('Please fix the form errors before submitting.');
        return false;
      }

      const client = new Client(clientId, data.name, data.email, data.phone, data.nationality, data.stays);
      storage.save('clients', client.toJSON());
      this.loadClients();
      this.render();
      AlertService.success('Client updated successfully!');
      return true;
    } catch (error) {
      console.error('Update client error:', error);
      AlertService.error('Failed to update client. Please try again.');
      return false;
    }
  }

  showDetailsModal(clientId) {
    try {
      const client = this.clients.find(c => c.id === clientId);
      if (!client) {
        AlertService.error('Client not found.');
        return;
      }

      const content = `
        <div class="details-grid">
          <div><strong>Name:</strong> ${client.name}</div>
          <div><strong>Email:</strong> ${client.email}</div>
          <div><strong>Phone:</strong> ${client.phone}</div>
          <div><strong>Nationality:</strong> ${client.nationality}</div>
          <div><strong>Stays:</strong> ${client.stays}</div>
          <div><strong>Member Since:</strong> ${new Date(client.createdAt).toLocaleDateString()}</div>
        </div>
      `;

      modal.show('Client Details', content, [
        { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
      ]);
    } catch (error) {
      console.error('Details modal error:', error);
      AlertService.error('Failed to load client details.');
    }
  }

  deleteClient(clientId) {
    if (!PermissionManager.canDelete()) {
      modal.show('Access Denied', '<p>You do not have permission to delete clients.</p>', [
        { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
      ]);
      return;
    }

    modal.confirm(
      'Delete Client',
      'Are you sure you want to delete this client?',
      () => {
        try {
          storage.delete('clients', clientId);
          this.loadClients();
          this.render();
          AlertService.success('Client deleted successfully!');
        } catch (error) {
          console.error('Delete client error:', error);
          AlertService.error('Failed to delete client. Please try again.');
        }
      }
    );
  }

  exportCSV() {
    try {
      const columns = [
        { field: 'name', label: 'Name' },
        { field: 'email', label: 'Email' },
        { field: 'phone', label: 'Phone' },
        { field: 'nationality', label: 'Nationality' },
        { field: 'stays', label: 'Stays' }
      ];
      CSVExporter.export(this.filteredClients.map(c => c.toJSON()), 'clients', columns);
      AlertService.success('CSV exported successfully!');
    } catch (error) {
      console.error('CSV export error:', error);
      AlertService.error('Failed to export CSV. Please try again.');
    }
  }

  exportPDF() {
    try {
      const columns = [
        { field: 'name', label: 'Name' },
        { field: 'email', label: 'Email' },
        { field: 'phone', label: 'Phone' },
        { field: 'nationality', label: 'Nationality' },
        { field: 'stays', label: 'Stays' }
      ];
      
      const data = this.filteredClients.map(c => {
        const clientData = c.toJSON();
        return {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          nationality: clientData.nationality,
          stays: clientData.stays
        };
      });
      
      PDFExporter.export(data, 'clients', columns, 'Clients Report');
      AlertService.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      AlertService.error('Failed to export PDF. Please try again.');
    }
  }

  render() {
    const tbody = document.getElementById('clients-tbody');
    if (!tbody) return;

    if (this.filteredClients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No clients found</td></tr>';
      return;
    }

    tbody.innerHTML = this.filteredClients.map(client => `
      <tr>
        <td>${client.name}</td>
        <td>${client.email}</td>
        <td>${client.phone}</td>
        <td>${client.nationality}</td>
        <td>${client.stays}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view" onclick="clientsManager.showDetailsModal('${client.id}')">
              Details
            </button>
            ${PermissionManager.canEdit() ? `
              <button class="action-btn edit" onclick="clientsManager.showEditModal('${client.id}')">
                Edit
              </button>
            ` : ''}
            ${PermissionManager.canDelete() ? `
              <button class="action-btn delete" onclick="clientsManager.deleteClient('${client.id}')">
                Delete
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }
}

window.clientsManager = new ClientsManager();