export class Reservation {
  constructor(id, clientId, clientName, roomId, roomNumber, checkIn, checkOut, price, status = 'pending') {
    this.id = id || Date.now().toString();
    this.clientId = clientId;
    this.clientName = clientName;
    this.roomId = roomId;
    this.roomNumber = roomNumber;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.price = parseFloat(price);
    this.status = status; // pending, confirmed, cancelled, completed
    this.createdAt = new Date().toISOString();
  }

  getDuration() {
    const start = new Date(this.checkIn);
    const end = new Date(this.checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  isActive() {
    const now = new Date();
    const checkIn = new Date(this.checkIn);
    const checkOut = new Date(this.checkOut);
    return now >= checkIn && now <= checkOut && this.status === 'confirmed';
  }

  isPast() {
    const now = new Date();
    const checkOut = new Date(this.checkOut);
    return now > checkOut;
  }

  isFuture() {
    const now = new Date();
    const checkIn = new Date(this.checkIn);
    return now < checkIn;
  }

  toJSON() {
    return {
      id: this.id,
      clientId: this.clientId,
      clientName: this.clientName,
      roomId: this.roomId,
      roomNumber: this.roomNumber,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      price: this.price,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  static fromJSON(json) {
    const reservation = new Reservation(
      json.id,
      json.clientId,
      json.clientName,
      json.roomId,
      json.roomNumber,
      json.checkIn,
      json.checkOut,
      json.price,
      json.status
    );
    reservation.createdAt = json.createdAt;
    return reservation;
  }
}