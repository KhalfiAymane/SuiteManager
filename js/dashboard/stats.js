import { storage } from '../services/storage.js';

export class StatsCalculator {
  static getKPIs() {
    const rooms = storage.getAll('rooms');
    const reservations = storage.getAll('reservations');
    const clients = storage.getAll('clients');

    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    
    const totalRevenue = reservations
      .filter(r => r.status === 'confirmed' || r.status === 'completed')
      .reduce((sum, r) => sum + r.price, 0);

    return {
      totalRooms: rooms.length,
      occupiedRooms,
      availableRooms,
      totalClients: clients.length,
      totalReservations: reservations.length,
      totalRevenue: totalRevenue.toFixed(2)
    };
  }

  static getReservationsByMonth() {
    const reservations = storage.getAll('reservations');
    const monthCounts = new Array(12).fill(0);

    reservations.forEach(reservation => {
      const date = new Date(reservation.checkIn);
      const month = date.getMonth();
      monthCounts[month]++;
    });

    return monthCounts;
  }

  static getRoomOccupancy() {
    const rooms = storage.getAll('rooms');
    const statusCounts = {
      available: 0,
      occupied: 0,
      maintenance: 0
    };

    rooms.forEach(room => {
      statusCounts[room.status]++;
    });

    return statusCounts;
  }

  static getClientsByCountry() {
    const clients = storage.getAll('clients');
    const countryCounts = {};

    clients.forEach(client => {
      const country = client.nationality || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    return countryCounts;
  }

  static getRevenueStats() {
    const reservations = storage.getAll('reservations');
    const monthlyRevenue = new Array(12).fill(0);

    reservations
      .filter(r => r.status === 'confirmed' || r.status === 'completed')
      .forEach(reservation => {
        const date = new Date(reservation.checkIn);
        const month = date.getMonth();
        monthlyRevenue[month] += reservation.price;
      });

    return monthlyRevenue;
  }

   static getStaffDistribution() {
    const allStaff = storage.getAll('staff');
    
    // Count staff by shift
    const distribution = {
      morning: 0,
      evening: 0,
      night: 0
    };
    
    allStaff.forEach(staff => {
      const shift = staff.shift?.toLowerCase() || '';
      if (shift.includes('morning') || shift.includes('day')) {
        distribution.morning++;
      } else if (shift.includes('evening')) {
        distribution.evening++;
      } else if (shift.includes('night')) {
        distribution.night++;
      }
    });
    
    return distribution;
  }
}