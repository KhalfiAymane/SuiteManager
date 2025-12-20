export class Client {
  constructor(id, name, email, phone, nationality, stays = 0) {
    this.id = id || Date.now().toString();
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.nationality = nationality;
    this.stays = parseInt(stays);
    this.createdAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      nationality: this.nationality,
      stays: this.stays,
      createdAt: this.createdAt
    };
  }

  static fromJSON(json) {
    const client = new Client(
      json.id,
      json.name,
      json.email,
      json.phone,
      json.nationality,
      json.stays
    );
    client.createdAt = json.createdAt;
    return client;
  }
}