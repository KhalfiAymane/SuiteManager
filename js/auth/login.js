export class AuthService {
  static login(email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      const session = {
        email: user.email,
        role: user.role,
        name: user.name,
        loginTime: new Date().toISOString()
      };
      sessionStorage.setItem('session', JSON.stringify(session));
      return { success: true, user: session };
    }

    return { success: false, message: 'Invalid credentials' };
  }

  static logout() {
    sessionStorage.removeItem('session');
    window.location.href = '/index.html';
  }

  static getSession() {
    const session = sessionStorage.getItem('session');
    return session ? JSON.parse(session) : null;
  }

  static isAuthenticated() {
    return this.getSession() !== null;
  }

  static getRole() {
    const session = this.getSession();
    return session ? session.role : null;
  }

  static isAdmin() {
    return this.getRole() === 'admin';
  }

  static checkAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  }
}