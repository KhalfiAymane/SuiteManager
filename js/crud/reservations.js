import { storage } from '../services/storage.js';
import { modal } from '../services/modal.js';
import { Validator } from '../services/validate.js';
import { debounce } from '../utils/debounce.js';
import { PermissionManager } from '../auth/permissions.js';
import { PDFExporter } from '../services/pdf.js';
import { AlertService } from '../services/alert.js';

class ReservationsManager {
    constructor() {
        this.currentReservations = [];
        this.clients = [];
        this.rooms = [];
        this.init();
    }

    init() {
        try {
            this.clients = storage.getAll('clients');
            this.rooms = storage.getAll('rooms');
            this.loadReservations();
            this.setupEventListeners();
            this.setupSearch();
            this.setupFilters();
        } catch (error) {
            console.error('Initialization error:', error);
            AlertService.error('Failed to initialize reservations. Please refresh the page.');
        }
    }

    loadReservations() {
        try {
            this.currentReservations = storage.getAll('reservations');
            this.renderReservations(this.currentReservations);
        } catch (error) {
            console.error('Load error:', error);
            AlertService.error('Failed to load reservations. Please try again.');
        }
    }

    renderReservations(reservations) {
        const tbody = document.getElementById('reservations-tbody');
        if (!tbody) return;

        if (reservations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div style="padding: 2rem; color: var(--text-light);">
                            <i class="fas fa-calendar" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                            <p>No reservations found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = reservations.map(reservation => {
            const client = this.clients.find(c => c.id === reservation.clientId);
            const room = this.rooms.find(r => r.id === reservation.roomId);
            
            return `
                <tr>
                    <td>${client?.name || 'Unknown Client'}</td>
                    <td>${room?.number || 'Unknown Room'}</td>
                    <td>${new Date(reservation.checkIn).toLocaleDateString()}</td>
                    <td>${new Date(reservation.checkOut).toLocaleDateString()}</td>
                    <td>$${reservation.price}</td>
                    <td>
                        <span class="status-badge status-${reservation.status}">
                            ${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="window.reservationsManager.showDetailsModal('${reservation.id}')">
                                <i class="fas fa-eye"></i> Details
                            </button>
                            ${PermissionManager.canEdit() ? `
                                <button class="action-btn edit" onclick="window.reservationsManager.showEditModal('${reservation.id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                            ` : ''}
                            ${PermissionManager.canDelete() ? `
                                <button class="action-btn delete" onclick="window.reservationsManager.deleteReservation('${reservation.id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-reservation-btn');
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
        const searchInput = document.getElementById('search-reservations');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.currentReservations.filter(reservation => {
                    const client = this.clients.find(c => c.id === reservation.clientId);
                    const room = this.rooms.find(r => r.id === reservation.roomId);
                    return (
                        client?.name?.toLowerCase().includes(term) ||
                        room?.number?.toLowerCase().includes(term)
                    );
                });
                this.renderReservations(filtered);
            }, 300));
        }
    }

    setupFilters() {
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                const status = e.target.value;
                if (status === 'all') {
                    this.renderReservations(this.currentReservations);
                } else {
                    const filtered = this.currentReservations.filter(reservation => reservation.status === status);
                    this.renderReservations(filtered);
                }
            });
        }
    }

    showAddModal() {
        if (!PermissionManager.canCreate()) {
            modal.show('Access Denied', '<p>You do not have permission to add reservations.</p>', [
                { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
            ]);
            return;
        }

        const clientOptions = this.clients.map(client => 
            `<option value="${client.id}">${client.name} (${client.email})</option>`
        ).join('');

        const availableRooms = this.rooms.filter(room => room.status === 'available');
        const roomOptions = availableRooms.map(room => 
            `<option value="${room.id}">${room.number} (${room.type} - $${room.price}/night)</option>`
        ).join('');

        const body = `
            <form id="modal-form">
                <div class="form-group">
                    <label for="clientId">Client *</label>
                    <select id="clientId" name="clientId" required>
                        <option value="">Select client</option>
                        ${clientOptions}
                    </select>
                    <span class="error-message" id="error-clientId"></span>
                </div>
                <div class="form-group">
                    <label for="roomId">Room *</label>
                    <select id="roomId" name="roomId" required>
                        <option value="">Select room</option>
                        ${roomOptions}
                    </select>
                    <span class="error-message" id="error-roomId"></span>
                </div>
                <div class="form-group">
                    <label for="checkIn">Check-in Date *</label>
                    <input type="date" id="checkIn" name="checkIn" required>
                    <span class="error-message" id="error-checkIn"></span>
                </div>
                <div class="form-group">
                    <label for="checkOut">Check-out Date *</label>
                    <input type="date" id="checkOut" name="checkOut" required>
                    <span class="error-message" id="error-checkOut"></span>
                </div>
                <div class="form-group">
                    <label for="price">Total Price ($) *</label>
                    <input type="number" id="price" name="price" required min="0" step="0.01">
                    <span class="error-message" id="error-price"></span>
                </div>
                <div class="form-group">
                    <label for="status">Status *</label>
                    <select id="status" name="status" required>
                        <option value="">Select status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <span class="error-message" id="error-status"></span>
                </div>
            </form>
        `;

        modal.show('Add New Reservation', body, [
            { text: 'Cancel', class: 'btn-outline', handler: () => modal.close() },
            { 
                text: 'Add Reservation', 
                class: 'btn-primary', 
                handler: () => {
                    this.addReservation();
                }
            }
        ]);
    }

    addReservation() {
        try {
            const form = document.getElementById('modal-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
            
            const validation = Validator.validateForm(data, {
                clientId: ['required'],
                roomId: ['required'],
                checkIn: ['required'],
                checkOut: ['required'],
                price: ['required', 'positiveNumber'],
                status: ['required']
            });

            if (!validation.isValid) {
                Object.keys(validation.errors).forEach(field => {
                    const errorElement = document.getElementById(`error-${field}`);
                    if (errorElement) {
                        errorElement.textContent = validation.errors[field];
                        errorElement.closest('.form-group').classList.add('has-error');
                    }
                });
                AlertService.error('Please fix the form errors before submitting.');
                return;
            }

            if (new Date(data.checkIn) >= new Date(data.checkOut)) {
                const errorElement = document.getElementById('error-checkOut');
                errorElement.textContent = 'Check-out date must be after check-in date';
                errorElement.closest('.form-group').classList.add('has-error');
                AlertService.error('Invalid date range.');
                return;
            }

            if (new Date(data.checkIn) < new Date()) {
                const errorElement = document.getElementById('error-checkIn');
                errorElement.textContent = 'Check-in date cannot be in the past';
                errorElement.closest('.form-group').classList.add('has-error');
                AlertService.error('Check-in date cannot be in the past.');
                return;
            }

            const reservationData = {
                clientId: data.clientId,
                roomId: data.roomId,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                price: parseFloat(data.price),
                status: data.status
            };

            storage.create('reservations', reservationData);
            this.loadReservations();
            modal.close();
            AlertService.success('Reservation added successfully!');
        } catch (error) {
            console.error('Add reservation error:', error);
            AlertService.error('Failed to add reservation. Please try again.');
        }
    }

    showEditModal(id) {
        if (!PermissionManager.canEdit()) {
            modal.show('Access Denied', '<p>You do not have permission to edit reservations.</p>', [
                { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
            ]);
            return;
        }

        try {
            const reservation = storage.getById('reservations', id);
            if (!reservation) {
                AlertService.error('Reservation not found.');
                return;
            }

            const clientOptions = this.clients.map(client => 
                `<option value="${client.id}" ${reservation.clientId === client.id ? 'selected' : ''}>
                    ${client.name} (${client.email})
                </option>`
            ).join('');

            const availableRooms = this.rooms.filter(room => room.status === 'available' || room.id === reservation.roomId);
            const roomOptions = availableRooms.map(room => 
                `<option value="${room.id}" ${reservation.roomId === room.id ? 'selected' : ''}>
                    ${room.number} (${room.type} - $${room.price}/night)
                </option>`
            ).join('');

            const body = `
                <form id="modal-form">
                    <div class="form-group">
                        <label for="clientId">Client *</label>
                        <select id="clientId" name="clientId" required>
                            <option value="">Select client</option>
                            ${clientOptions}
                        </select>
                        <span class="error-message" id="error-clientId"></span>
                    </div>
                    <div class="form-group">
                        <label for="roomId">Room *</label>
                        <select id="roomId" name="roomId" required>
                            <option value="">Select room</option>
                            ${roomOptions}
                        </select>
                        <span class="error-message" id="error-roomId"></span>
                    </div>
                    <div class="form-group">
                        <label for="checkIn">Check-in Date *</label>
                        <input type="date" id="checkIn" name="checkIn" value="${reservation.checkIn}" required>
                        <span class="error-message" id="error-checkIn"></span>
                    </div>
                    <div class="form-group">
                        <label for="checkOut">Check-out Date *</label>
                        <input type="date" id="checkOut" name="checkOut" value="${reservation.checkOut}" required>
                        <span class="error-message" id="error-checkOut"></span>
                    </div>
                    <div class="form-group">
                        <label for="price">Total Price ($) *</label>
                        <input type="number" id="price" name="price" value="${reservation.price}" required min="0" step="0.01">
                        <span class="error-message" id="error-price"></span>
                    </div>
                    <div class="form-group">
                        <label for="status">Status *</label>
                        <select id="status" name="status" required>
                            <option value="">Select status</option>
                            <option value="pending" ${reservation.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${reservation.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="completed" ${reservation.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${reservation.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <span class="error-message" id="error-status"></span>
                    </div>
                </form>
            `;

            modal.show('Edit Reservation', body, [
                { text: 'Cancel', class: 'btn-outline', handler: () => modal.close() },
                { 
                    text: 'Update Reservation', 
                    class: 'btn-primary', 
                    handler: () => {
                        this.updateReservation(id);
                    }
                }
            ]);
        } catch (error) {
            console.error('Edit modal error:', error);
            AlertService.error('Failed to load reservation details.');
        }
    }

    updateReservation(id) {
        try {
            const form = document.getElementById('modal-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
            
            const validation = Validator.validateForm(data, {
                clientId: ['required'],
                roomId: ['required'],
                checkIn: ['required'],
                checkOut: ['required'],
                price: ['required', 'positiveNumber'],
                status: ['required']
            });

            if (!validation.isValid) {
                Object.keys(validation.errors).forEach(field => {
                    const errorElement = document.getElementById(`error-${field}`);
                    if (errorElement) {
                        errorElement.textContent = validation.errors[field];
                        errorElement.closest('.form-group').classList.add('has-error');
                    }
                });
                AlertService.error('Please fix the form errors before submitting.');
                return;
            }

            if (new Date(data.checkIn) >= new Date(data.checkOut)) {
                const errorElement = document.getElementById('error-checkOut');
                errorElement.textContent = 'Check-out date must be after check-in date';
                errorElement.closest('.form-group').classList.add('has-error');
                AlertService.error('Invalid date range.');
                return;
            }

            storage.update('reservations', id, {
                clientId: data.clientId,
                roomId: data.roomId,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                price: parseFloat(data.price),
                status: data.status
            });
            
            this.loadReservations();
            modal.close();
            AlertService.success('Reservation updated successfully!');
        } catch (error) {
            console.error('Update reservation error:', error);
            AlertService.error('Failed to update reservation. Please try again.');
        }
    }

    showDetailsModal(id) {
        try {
            const reservation = storage.getById('reservations', id);
            if (!reservation) {
                AlertService.error('Reservation not found.');
                return;
            }

            const client = this.clients.find(c => c.id === reservation.clientId);
            const room = this.rooms.find(r => r.id === reservation.roomId);
            
            const duration = Math.ceil((new Date(reservation.checkOut) - new Date(reservation.checkIn)) / (1000 * 60 * 60 * 24));
            const perNight = reservation.price / duration;

            const content = `
                <div class="details-grid" style="display: grid; grid-template-columns: 1fr; gap: 1rem; padding: 1rem 0;">
                    <div><strong>Client:</strong> ${client?.name || 'Unknown Client'}</div>
                    <div><strong>Room:</strong> ${room?.number || 'Unknown Room'} (${room?.type || 'Unknown Type'})</div>
                    <div><strong>Check-in:</strong> ${new Date(reservation.checkIn).toLocaleDateString()}</div>
                    <div><strong>Check-out:</strong> ${new Date(reservation.checkOut).toLocaleDateString()}</div>
                    <div><strong>Duration:</strong> ${duration} nights</div>
                    <div><strong>Price per night:</strong> $${perNight.toFixed(2)}</div>
                    <div><strong>Total price:</strong> $${reservation.price}</div>
                    <div><strong>Status:</strong> <span class="status-badge status-${reservation.status}">${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}</span></div>
                    <div><strong>Booked on:</strong> ${new Date(reservation.createdAt).toLocaleDateString()}</div>
                </div>
            `;

            modal.show('Reservation Details', content, [
                { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
            ]);
        } catch (error) {
            console.error('Details modal error:', error);
            AlertService.error('Failed to load reservation details.');
        }
    }

    deleteReservation(id) {
        if (!PermissionManager.canDelete()) {
            modal.show('Access Denied', '<p>You do not have permission to delete reservations.</p>', [
                { text: 'Close', class: 'btn-secondary', handler: () => modal.close() }
            ]);
            return;
        }

        modal.confirm(
            'Delete Reservation',
            'Are you sure you want to delete this reservation?',
            () => {
                try {
                    storage.delete('reservations', id);
                    this.loadReservations();
                    AlertService.success('Reservation deleted successfully!');
                } catch (error) {
                    console.error('Delete reservation error:', error);
                    AlertService.error('Failed to delete reservation. Please try again.');
                }
            }
        );
    }

    exportToCSV() {
        try {
            const headers = ['Client', 'Room', 'Check-in', 'Check-out', 'Price', 'Status'];
            const data = this.currentReservations.map(reservation => {
                const client = this.clients.find(c => c.id === reservation.clientId);
                const room = this.rooms.find(r => r.id === reservation.roomId);
                
                return [
                    client?.name || 'Unknown Client',
                    room?.number || 'Unknown Room',
                    new Date(reservation.checkIn).toLocaleDateString(),
                    new Date(reservation.checkOut).toLocaleDateString(),
                    reservation.price,
                    reservation.status
                ];
            });
            
            const csvContent = [
                headers.join(','),
                ...data.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reservations.csv';
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
                { field: 'client', label: 'Client' },
                { field: 'room', label: 'Room' },
                { field: 'checkIn', label: 'Check-in' },
                { field: 'checkOut', label: 'Check-out' },
                { field: 'price', label: 'Price' },
                { field: 'status', label: 'Status' }
            ];
            
            const data = this.currentReservations.map(reservation => {
                const client = this.clients.find(c => c.id === reservation.clientId);
                const room = this.rooms.find(r => r.id === reservation.roomId);
                
                return {
                    client: client?.name || 'Unknown Client',
                    room: room?.number || 'Unknown Room',
                    checkIn: new Date(reservation.checkIn).toLocaleDateString(),
                    checkOut: new Date(reservation.checkOut).toLocaleDateString(),
                    price: `$${reservation.price}`,
                    status: reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)
                };
            });
            
            PDFExporter.export(data, 'reservations', columns, 'Reservations Report');
            AlertService.success('PDF exported successfully!');
        } catch (error) {
            console.error('PDF export error:', error);
            AlertService.error('Failed to export PDF. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reservationsManager = new ReservationsManager();
});