import { storage } from '../services/storage.js';
import { modal } from '../services/modal.js';
import { Validator } from '../services/validate.js';
import { debounce } from '../utils/debounce.js';
import { PermissionManager } from '../auth/permissions.js';
import { PDFExporter } from '../services/pdf.js';
import { AlertService } from '../services/alert.js';

class RoomsManager {
    constructor() {
        this.currentRooms = [];
        this.init();
    }

    init() {
        try {
            this.loadRooms();
            this.setupEventListeners();
            this.setupSearch();
            this.setupFilters();
        } catch (error) {
            console.error('Initialization error:', error);
            AlertService.error('Failed to initialize rooms. Please refresh the page.');
        }
    }

    loadRooms() {
        try {
            this.currentRooms = storage.getAll('rooms');
            this.renderRooms(this.currentRooms);
        } catch (error) {
            console.error('Load error:', error);
            AlertService.error('Failed to load rooms. Please try again.');
        }
    }

    renderRooms(rooms) {
        const tbody = document.getElementById('rooms-tbody');
        if (!tbody) return;

        if (rooms.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div style="padding: 2rem; color: var(--text-light);">
                            <i class="fas fa-bed" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                            <p>No rooms found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rooms.map(room => `
            <tr>
                <td>${room.roomNumber || room.number}</td>
                <td>${room.type}</td>
                <td>$${room.price}</td>
                <td>
                    <span class="status-badge status-${room.status}">
                        ${room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="window.roomsManager.showDetailsModal('${room.id}')">
                            <i class="fas fa-eye"></i> Details
                        </button>
                        ${PermissionManager.canEdit() ? `
                            <button class="action-btn edit" onclick="window.roomsManager.editRoom('${room.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        ` : ''}
                        ${PermissionManager.canDelete() ? `
                            <button class="action-btn delete" onclick="window.roomsManager.deleteRoom('${room.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-room-btn');
        if (addBtn) {
            if (!PermissionManager.canCreate()) {
                addBtn.style.display = 'none';
            } else {
                addBtn.addEventListener('click', () => this.showAddModal());
            }
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
        const searchInput = document.getElementById('search-rooms');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.currentRooms.filter(room =>
                    (room.roomNumber || room.number).toLowerCase().includes(term) ||
                    room.type.toLowerCase().includes(term)
                );
                this.renderRooms(filtered);
            }, 300));
        }
    }

    setupFilters() {
        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                const type = e.target.value;
                if (type === 'all') {
                    this.renderRooms(this.currentRooms);
                } else {
                    const filtered = this.currentRooms.filter(room => room.type === type);
                    this.renderRooms(filtered);
                }
            });
        }
    }

    showAddModal() {
        if (!PermissionManager.canCreate()) {
            modal.show('Access Denied', '<p>You do not have permission to add rooms.</p>', [
                { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
            ]);
            return;
        }

        const fields = [
            { name: 'roomNumber', label: 'Room Number', type: 'text', required: true },
            { 
                name: 'type', 
                label: 'Room Type', 
                type: 'select', 
                required: true,
                options: [
                    { value: 'single', label: 'Single' },
                    { value: 'double', label: 'Double' },
                    { value: 'suite', label: 'Suite' },
                    { value: 'deluxe', label: 'Deluxe' }
                ]
            },
            { name: 'price', label: 'Price per Night ($)', type: 'number', required: true, min: 0 },
            { 
                name: 'status', 
                label: 'Status', 
                type: 'select', 
                required: true,
                options: [
                    { value: 'available', label: 'Available' },
                    { value: 'occupied', label: 'Occupied' },
                    { value: 'maintenance', label: 'Maintenance' }
                ]
            }
        ];

        modal.showForm('Add New Room', fields, (data) => {
            return this.addRoom(data);
        });
    }

    addRoom(data) {
        try {
            const validation = Validator.validateForm(data, {
                roomNumber: ['required'],
                type: ['required'],
                price: ['required', 'positiveNumber'],
                status: ['required']
            });

            if (!validation.isValid) {
                Object.keys(validation.errors).forEach(field => {
                    modal.showError(field, validation.errors[field]);
                });
                AlertService.error('Please fix the form errors before submitting.');
                return false;
            }

            const roomData = {
                number: data.roomNumber,
                type: data.type,
                price: parseFloat(data.price),
                status: data.status
            };

            storage.create('rooms', roomData);
            this.loadRooms();
            AlertService.success('Room added successfully!');
            return true;
        } catch (error) {
            console.error('Add room error:', error);
            AlertService.error('Failed to add room. Please try again.');
            return false;
        }
    }

    showDetailsModal(roomId) {
        try {
            const room = storage.getById('rooms', roomId);
            if (!room) {
                AlertService.error('Room not found.');
                return;
            }

            const content = `
                <div class="details-grid" style="display: grid; grid-template-columns: 1fr; gap: 1rem; padding: 1rem 0;">
                    <div><strong>Room Number:</strong> ${room.number}</div>
                    <div><strong>Type:</strong> ${room.type}</div>
                    <div><strong>Price per Night:</strong> $${room.price}</div>
                    <div><strong>Status:</strong> <span class="status-badge status-${room.status}">${room.status.charAt(0).toUpperCase() + room.status.slice(1)}</span></div>
                    <div><strong>Created:</strong> ${new Date(room.createdAt).toLocaleDateString()}</div>
                </div>
            `;

            modal.show('Room Details', content, [
                { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
            ]);
        } catch (error) {
            console.error('Details modal error:', error);
            AlertService.error('Failed to load room details.');
        }
    }

    editRoom(id) {
        if (!PermissionManager.canEdit()) {
            modal.show('Access Denied', '<p>You do not have permission to edit rooms.</p>', [
                { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
            ]);
            return;
        }

        try {
            const room = storage.getById('rooms', id);
            if (!room) {
                AlertService.error('Room not found.');
                return;
            }

            const fields = [
                { name: 'roomNumber', label: 'Room Number', type: 'text', required: true, value: room.roomNumber || room.number },
                { 
                    name: 'type', 
                    label: 'Room Type', 
                    type: 'select', 
                    required: true,
                    value: room.type,
                    options: [
                        { value: 'single', label: 'Single' },
                        { value: 'double', label: 'Double' },
                        { value: 'suite', label: 'Suite' },
                        { value: 'deluxe', label: 'Deluxe' }
                    ]
                },
                { name: 'price', label: 'Price per Night ($)', type: 'number', required: true, min: 0, value: room.price },
                { 
                    name: 'status', 
                    label: 'Status', 
                    type: 'select', 
                    required: true,
                    value: room.status,
                    options: [
                        { value: 'available', label: 'Available' },
                        { value: 'occupied', label: 'Occupied' },
                        { value: 'maintenance', label: 'Maintenance' }
                    ]
                }
            ];

            modal.showForm('Edit Room', fields, (data) => {
                return this.updateRoom(id, data);
            });
        } catch (error) {
            console.error('Edit modal error:', error);
            AlertService.error('Failed to load room details.');
        }
    }

    updateRoom(id, data) {
        try {
            const validation = Validator.validateForm(data, {
                roomNumber: ['required'],
                type: ['required'],
                price: ['required', 'positiveNumber'],
                status: ['required']
            });

            if (!validation.isValid) {
                Object.keys(validation.errors).forEach(field => {
                    modal.showError(field, validation.errors[field]);
                });
                AlertService.error('Please fix the form errors before submitting.');
                return false;
            }

            const roomData = {
                number: data.roomNumber,
                type: data.type,
                price: parseFloat(data.price),
                status: data.status
            };

            storage.update('rooms', id, roomData);
            this.loadRooms();
            AlertService.success('Room updated successfully!');
            return true;
        } catch (error) {
            console.error('Update room error:', error);
            AlertService.error('Failed to update room. Please try again.');
            return false;
        }
    }

    deleteRoom(id) {
        if (!PermissionManager.canDelete()) {
            modal.show('Access Denied', '<p>You do not have permission to delete rooms.</p>', [
                { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
            ]);
            return;
        }

        modal.confirm(
            'Delete Room',
            'Are you sure you want to delete this room?',
            () => {
                try {
                    storage.delete('rooms', id);
                    this.loadRooms();
                    AlertService.success('Room deleted successfully!');
                } catch (error) {
                    console.error('Delete room error:', error);
                    AlertService.error('Failed to delete room. Please try again.');
                }
            }
        );
    }

    exportToCSV() {
        try {
            const headers = ['Room Number', 'Type', 'Price', 'Status'];
            const data = this.currentRooms.map(room => [
                room.roomNumber || room.number,
                room.type,
                room.price,
                room.status
            ]);
            
            const csvContent = [
                headers.join(','),
                ...data.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'rooms.csv';
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
                { field: 'number', label: 'Room Number' },
                { field: 'type', label: 'Type' },
                { field: 'price', label: 'Price' },
                { field: 'status', label: 'Status' }
            ];
            
            const data = this.currentRooms.map(room => ({
                number: room.roomNumber || room.number,
                type: room.type,
                price: `$${room.price}`,
                status: room.status.charAt(0).toUpperCase() + room.status.slice(1)
            }));
            
            PDFExporter.export(data, 'rooms', columns, 'Rooms Report');
            AlertService.success('PDF exported successfully!');
        } catch (error) {
            console.error('PDF export error:', error);
            AlertService.error('Failed to export PDF. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.roomsManager = new RoomsManager();
});