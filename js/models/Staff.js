export class Staff {
  constructor(id, name, role, salary, shift) {
    this.id = id || Date.now().toString();
    this.name = name;
    this.role = role; // manager, receptionist, housekeeper, etc.
    this.salary = parseFloat(salary);
    this.shift = shift; // morning, evening, night
    this.createdAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      salary: this.salary,
      shift: this.shift,
      createdAt: this.createdAt
    };
  }

  static fromJSON(json) {
    const staff = new Staff(
      json.id,
      json.name,
      json.role,
      json.salary,
      json.shift
    );
    staff.createdAt = json.createdAt;
    return staff;
  }
}