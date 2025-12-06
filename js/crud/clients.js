import { storage } from '../services/storage.js';
import { modal } from '../services/modal.js';
import { Client } from '../models/Client.js';
import { Validator } from '../services/validate.js';
import { CSVExporter } from '../services/csv.js';
import { PDFExporter } from '../services/pdf.js';
import { debounce } from '../utils/debounce.js';
import { PermissionManager } from '../auth/permissions.js';
import { translations } from '../utils/translations.js';

export class ClientsManager {
  constructor() {
    this.clients = [];
    this.filteredClients = [];
    this.init();
  }

  init() {
    this.loadClients();
    this.setupEventListeners();
    this.render();
  }

  loadClients() {
    const clientsData = storage.getAll('clients');
    this.clients = clientsData.map(c => Client.fromJSON(c));
    this.filteredClients = [...this.clients];
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search-clients');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filterClients(e.target.value);
      }, 300));
    }

    const addBtn = document.getElementById('add-client-btn');
    if (addBtn && PermissionManager.canCreate()) {
      addBtn.addEventListener('click', () => this.showAddModal());
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
      return false;
    }

    const client = new Client(null, data.name, data.email, data.phone, data.nationality, data.stays);
    storage.save('clients', client.toJSON());
    this.loadClients();
    this.render();
    return true;
  }

  showEditModal(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;

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
  }

  editClient(clientId, data) {
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
      return false;
    }

    const client = new Client(clientId, data.name, data.email, data.phone, data.nationality, data.stays);
    storage.save('clients', client.toJSON());
    this.loadClients();
    this.render();
    return true;
  }

  showDetailsModal(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;

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
  }

  deleteClient(clientId) {
    modal.confirm(
      'Delete Client',
      'Are you sure you want to delete this client?',
      () => {
        storage.delete('clients', clientId);
        this.loadClients();
        this.render();
      }
    );
  }

  exportCSV() {
    const columns = [
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'nationality', label: 'Nationality' },
      { field: 'stays', label: 'Stays' }
    ];
    CSVExporter.export(this.filteredClients.map(c => c.toJSON()), 'clients', columns);
  }

  exportPDF() {
    const columns = [
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'nationality', label: 'Nationality' },
      { field: 'stays', label: 'Stays' }
    ];
    PDFExporter.export(this.filteredClients.map(c => c.toJSON()), 'clients', columns, 'Clients Report');
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