export class Room {
  constructor(id, roomNumber, type, price, status = 'available') {
    this.id = id || Date.now().toString();
    this.roomNumber = roomNumber;
    this.type = type; // single, double, suite, deluxe
    this.price = parseFloat(price);
    this.status = status; // available, occupied, maintenance
    this.createdAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      roomNumber: this.roomNumber,
      type: this.type,
      price: this.price,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  static fromJSON(json) {
    const room = new Room(
      json.id,
      json.roomNumber,
      json.type,
      json.price,
      json.status
    );
    room.createdAt = json.createdAt;
    return room;
  }
}