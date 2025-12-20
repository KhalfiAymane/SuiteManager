import { storage } from '../services/storage.js';
import { modal } from '../services/modal.js';
import { Validator } from '../services/validate.js';
import { debounce } from '../utils/debounce.js';
import { PDFExporter } from '../services/pdf.js';
import { AlertService } from '../services/alert.js';

class StaffManager {
  constructor() {
    this.staff = [];
    this.filteredStaff = [];
    this.init();
  }

  init() {
    try {
      this.loadStaff();
      this.setupEventListeners();
      this.setupSearch();
      this.render();
    } catch (error) {
      console.error('Initialization error:', error);
      AlertService.error('Failed to initialize staff. Please refresh the page.');
    }
  }

  loadStaff() {
    try {
      this.staff = storage.getAll('staff');
      this.filteredStaff = [...this.staff];
    } catch (error) {
      console.error('Load error:', error);
      AlertService.error('Failed to load staff. Please try again.');
    }
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search-staff');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filterStaff(e.target.value);
      }, 300));
    }

    const addBtn = document.getElementById('add-staff-btn');
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
    const searchInput = document.getElementById('search-staff');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filterStaff(e.target.value);
      }, 300));
    }
  }

  filterStaff(searchTerm) {
    const term = searchTerm.toLowerCase();
    this.filteredStaff = this.staff.filter(member => 
      member.name.toLowerCase().includes(term) ||
      member.role.toLowerCase().includes(term) ||
      member.shift.toLowerCase().includes(term)
    );
    this.render();
  }

  showAddModal() {
    const fields = [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { 
        name: 'role', 
        label: 'Role', 
        type: 'select', 
        required: true,
        options: [
          { value: 'Manager', label: 'Manager' },
          { value: 'Receptionist', label: 'Receptionist' },
          { value: 'Housekeeper', label: 'Housekeeper' },
          { value: 'Chef', label: 'Chef' },
          { value: 'Security', label: 'Security' },
          { value: 'Maintenance', label: 'Maintenance' }
        ]
      },
      { name: 'salary', label: 'Salary ($)', type: 'number', required: true, min: 0, step: 100 },
      { 
        name: 'shift', 
        label: 'Shift', 
        type: 'select', 
        required: true,
        options: [
          { value: 'Day', label: 'Day (6AM - 2PM)' },
          { value: 'Evening', label: 'Evening (2PM - 10PM)' },
          { value: 'Night', label: 'Night (10PM - 6AM)' }
        ]
      }
    ];

    modal.showForm('Add Staff Member', fields, (data) => {
      return this.addStaff(data);
    });
  }

  addStaff(data) {
    try {
      const validation = Validator.validateForm(data, {
        name: ['required'],
        role: ['required'],
        salary: ['required', 'positiveNumber'],
        shift: ['required']
      });

      if (!validation.isValid) {
        Object.keys(validation.errors).forEach(field => {
          modal.showError(field, validation.errors[field]);
        });
        AlertService.error('Please fix the form errors before submitting.');
        return false;
      }

      const staffData = {
        name: data.name,
        role: data.role,
        salary: parseFloat(data.salary),
        shift: data.shift
      };

      storage.create('staff', staffData);
      this.loadStaff();
      this.render();
      AlertService.success('Staff member added successfully!');
      return true;
    } catch (error) {
      console.error('Add staff error:', error);
      AlertService.error('Failed to add staff member. Please try again.');
      return false;
    }
  }

  showEditModal(staffId) {
    try {
      const staff = this.staff.find(s => s.id === staffId);
      if (!staff) {
        AlertService.error('Staff member not found.');
        return;
      }

      const fields = [
        { name: 'name', label: 'Name', type: 'text', required: true, value: staff.name },
        { 
          name: 'role', 
          label: 'Role', 
          type: 'select', 
          required: true,
          value: staff.role,
          options: [
            { value: 'Manager', label: 'Manager' },
            { value: 'Receptionist', label: 'Receptionist' },
            { value: 'Housekeeper', label: 'Housekeeper' },
            { value: 'Chef', label: 'Chef' },
            { value: 'Security', label: 'Security' },
            { value: 'Maintenance', label: 'Maintenance' }
          ]
        },
        { name: 'salary', label: 'Salary ($)', type: 'number', required: true, min: 0, step: 100, value: staff.salary },
        { 
          name: 'shift', 
          label: 'Shift', 
          type: 'select', 
          required: true,
          value: staff.shift,
          options: [
            { value: 'Day', label: 'Day (6AM - 2PM)' },
            { value: 'Evening', label: 'Evening (2PM - 10PM)' },
            { value: 'Night', label: 'Night (10PM - 6AM)' }
          ]
        }
      ];

      modal.showForm('Edit Staff Member', fields, (data) => {
        return this.updateStaff(staffId, data);
      });
    } catch (error) {
      console.error('Edit modal error:', error);
      AlertService.error('Failed to load staff member details.');
    }
  }

  updateStaff(staffId, data) {
    try {
      const validation = Validator.validateForm(data, {
        name: ['required'],
        role: ['required'],
        salary: ['required', 'positiveNumber'],
        shift: ['required']
      });

      if (!validation.isValid) {
        Object.keys(validation.errors).forEach(field => {
          modal.showError(field, validation.errors[field]);
        });
        AlertService.error('Please fix the form errors before submitting.');
        return false;
      }

      const staffData = {
        name: data.name,
        role: data.role,
        salary: parseFloat(data.salary),
        shift: data.shift
      };

      storage.update('staff', staffId, staffData);
      this.loadStaff();
      this.render();
      AlertService.success('Staff member updated successfully!');
      return true;
    } catch (error) {
      console.error('Update staff error:', error);
      AlertService.error('Failed to update staff member. Please try again.');
      return false;
    }
  }

  showDetailsModal(staffId) {
    try {
      const staff = this.staff.find(s => s.id === staffId);
      if (!staff) {
        AlertService.error('Staff member not found.');
        return;
      }

      const content = `
        <div class="details-grid" style="display: grid; grid-template-columns: 1fr; gap: 1rem; padding: 1rem 0;">
          <div><strong>Name:</strong> ${staff.name}</div>
          <div><strong>Role:</strong> ${staff.role}</div>
          <div><strong>Salary:</strong> $${staff.salary}</div>
          <div><strong>Shift:</strong> ${staff.shift}</div>
          <div><strong>Hired:</strong> ${new Date(staff.createdAt).toLocaleDateString()}</div>
        </div>
      `;

      modal.show('Staff Member Details', content, [
        { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
      ]);
    } catch (error) {
      console.error('Details modal error:', error);
      AlertService.error('Failed to load staff member details.');
    }
  }

  deleteStaff(staffId) {
    modal.confirm(
      'Delete Staff Member',
      'Are you sure you want to delete this staff member?',
      () => {
        try {
          storage.delete('staff', staffId);
          this.loadStaff();
          this.render();
          AlertService.success('Staff member deleted successfully!');
        } catch (error) {
          console.error('Delete staff error:', error);
          AlertService.error('Failed to delete staff member. Please try again.');
        }
      }
    );
  }

  exportToCSV() {
    try {
      const headers = ['Name', 'Role', 'Salary', 'Shift'];
      const data = this.filteredStaff.map(staff => [
        staff.name,
        staff.role,
        staff.salary,
        staff.shift
      ]);
      
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'staff.csv';
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
        { field: 'name', label: 'Name' },
        { field: 'role', label: 'Role' },
        { field: 'salary', label: 'Salary' },
        { field: 'shift', label: 'Shift' }
      ];
      
      const data = this.filteredStaff.map(staff => ({
        name: staff.name,
        role: staff.role,
        salary: `$${staff.salary}`,
        shift: staff.shift
      }));
      
      PDFExporter.export(data, 'staff', columns, 'Staff Report');
      AlertService.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      AlertService.error('Failed to export PDF. Please try again.');
    }
  }

  render() {
    const tbody = document.getElementById('staff-tbody');
    if (!tbody) return;

    if (this.filteredStaff.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No staff members found</td></tr>';
      return;
    }

    tbody.innerHTML = this.filteredStaff.map(staff => `
      <tr>
        <td>${staff.name}</td>
        <td>${staff.role}</td>
        <td>$${staff.salary}</td>
        <td>${staff.shift}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view" onclick="window.staffManager.showDetailsModal('${staff.id}')">
              <i class="fas fa-eye"></i> Details
            </button>
            <button class="action-btn edit" onclick="window.staffManager.showEditModal('${staff.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn delete" onclick="window.staffManager.deleteStaff('${staff.id}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.staffManager = new StaffManager();
});