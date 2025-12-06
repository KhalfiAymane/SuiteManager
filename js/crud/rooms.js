import { storage } from '../services/storage.js';
import { modal } from '../services/modal.js';
import { Validator } from '../services/validate.js';
import { debounce } from '../utils/debounce.js';

class RoomsManager {
    constructor() {
        this.currentRooms = [];
        this.init();
    }

    init() {
        this.loadRooms();
        this.setupEventListeners();
        this.setupSearch();
        this.setupFilters();
    }

    loadRooms() {
        this.currentRooms = storage.getAll('rooms');
        this.renderRooms(this.currentRooms);
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
                        <button class="action-btn edit" onclick="window.roomsManager.editRoom('${room.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete" onclick="window.roomsManager.deleteRoom('${room.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-room-btn');
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
        return true;
    }

    showDetailsModal(roomId) {
        const room = storage.getById('rooms', roomId);
        if (!room) return;

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
    }

    editRoom(id) {
        const room = storage.getById('rooms', id);
        if (!room) return;

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
    }

    updateRoom(id, data) {
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
        return true;
    }

    deleteRoom(id) {
        modal.confirm(
            'Delete Room',
            'Are you sure you want to delete this room?',
            () => {
                storage.delete('rooms', id);
                this.loadRooms();
            }
        );
    }

    exportToCSV() {
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
    }

    exportToPDF() {
        alert('PDF export would be implemented here');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.roomsManager = new RoomsManager();
});