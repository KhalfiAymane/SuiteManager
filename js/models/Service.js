export class Service {
  constructor(id, name, description, price) {
    this.id = id || Date.now().toString();
    this.name = name;
    this.description = description;
    this.price = parseFloat(price);
    this.createdAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      createdAt: this.createdAt
    };
  }

  static fromJSON(json) {
    const service = new Service(
      json.id,
      json.name,
      json.description,
      json.price
    );
    service.createdAt = json.createdAt;
    return service;
  }
}