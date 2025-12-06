// Enhanced Storage Service with proper CRUD operations
export const storage = {
    // Initialize data with sample records for all entities
    initializeData() {
        if (!localStorage.getItem('initialized')) {
            const defaultData = {
                clients: [
                    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', nationality: 'US', stays: 3, createdAt: new Date().toISOString() },
                    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', nationality: 'UK', stays: 1, createdAt: new Date().toISOString() }
                ],
                rooms: [
                    { id: '101', number: '101', type: 'single', price: 100, status: 'available', createdAt: new Date().toISOString() },
                    { id: '102', number: '102', type: 'double', price: 150, status: 'occupied', createdAt: new Date().toISOString() },
                    { id: '103', number: '103', type: 'suite', price: 300, status: 'available', createdAt: new Date().toISOString() },
                    { id: '104', number: '104', type: 'deluxe', price: 500, status: 'maintenance', createdAt: new Date().toISOString() }
                ],
                reservations: [
                    { 
                        id: '1', 
                        clientId: '1', 
                        roomId: '102',
                        checkIn: '2024-12-15', 
                        checkOut: '2024-12-20', 
                        price: 750, 
                        status: 'confirmed',
                        createdAt: new Date().toISOString()
                    },
                    { 
                        id: '2', 
                        clientId: '2', 
                        roomId: '101',
                        checkIn: '2024-12-10', 
                        checkOut: '2024-12-12', 
                        price: 200, 
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    }
                ],
                services: [
                    { id: '1', name: 'Room Service', description: '24/7 room service', price: 25, createdAt: new Date().toISOString() },
                    { id: '2', name: 'Spa', description: 'Full body massage', price: 80, createdAt: new Date().toISOString() },
                    { id: '3', name: 'Laundry', description: 'Dry cleaning service', price: 15, createdAt: new Date().toISOString() }
                ],
                staff: [
                    { id: '1', name: 'Robert Johnson', role: 'Manager', salary: 5000, shift: 'Day', createdAt: new Date().toISOString() },
                    { id: '2', name: 'Sarah Williams', role: 'Receptionist', salary: 2500, shift: 'Night', createdAt: new Date().toISOString() },
                    { id: '3', name: 'Mike Brown', role: 'Housekeeping', salary: 2000, shift: 'Day', createdAt: new Date().toISOString() }
                ],
                users: [
                    { id: '1', email: 'admin@hotel.com', password: 'admin123', name: 'Admin User', role: 'admin' },
                    { id: '2', email: 'user@hotel.com', password: 'user123', name: 'Regular User', role: 'user' }
                ]
            };

            for (const [key, value] of Object.entries(defaultData)) {
                localStorage.setItem(key, JSON.stringify(value));
            }
            
            localStorage.setItem('initialized', 'true');
        }
    },

    // Generic CRUD operations
    getAll(entity) {
        try {
            const data = localStorage.getItem(entity);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error getting ${entity}:`, error);
            return [];
        }
    },

    getById(entity, id) {
        const items = this.getAll(entity);
        return items.find(item => item.id === id);
    },

    create(entity, item) {
        const items = this.getAll(entity);
        const newItem = {
            ...item,
            id: Date.now().toString(), // Simple ID generation
            createdAt: new Date().toISOString()
        };
        items.push(newItem);
        localStorage.setItem(entity, JSON.stringify(items));
        return newItem;
    },

    save(entity, item) {
        const items = this.getAll(entity);
        const index = items.findIndex(i => i.id === item.id);
        
        if (index !== -1) {
            // Update existing item
            items[index] = { ...items[index], ...item };
        } else {
            // Add new item
            const newItem = {
                ...item,
                id: item.id || Date.now().toString(),
                createdAt: item.createdAt || new Date().toISOString()
            };
            items.push(newItem);
        }
        
        localStorage.setItem(entity, JSON.stringify(items));
        return item;
    },

    update(entity, id, updates) {
        const items = this.getAll(entity);
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem(entity, JSON.stringify(items));
            return items[index];
        }
        return null;
    },

    delete(entity, id) {
        const items = this.getAll(entity);
        const filteredItems = items.filter(item => item.id !== id);
        localStorage.setItem(entity, JSON.stringify(filteredItems));
        return true;
    },

    // Specific entity helpers (kept for backward compatibility)
    getClients() {
        return this.getAll('clients');
    },

    getRooms() {
        return this.getAll('rooms');
    },

    getReservations() {
        const reservations = this.getAll('reservations');
        // Enrich reservations with client and room data
        return reservations.map(reservation => {
            const client = this.getById('clients', reservation.clientId);
            const room = this.getById('rooms', reservation.roomId);
            return {
                ...reservation,
                clientName: client?.name || 'Unknown Client',
                roomNumber: room?.number || 'Unknown Room'
            };
        });
    },

    getServices() {
        return this.getAll('services');
    },

    getStaff() {
        return this.getAll('staff');
    }
};