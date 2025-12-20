export class Validator {
  static validateForm(data, rules) {
    const errors = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = data[field];

      fieldRules.forEach(rule => {
        if (rule === 'required' && !value) {
          errors[field] = 'This field is required';
          isValid = false;
        } else if (rule === 'email' && value && !this.isValidEmail(value)) {
          errors[field] = 'Please enter a valid email address';
          isValid = false;
        } else if (rule === 'phone' && value && !this.isValidPhone(value)) {
          errors[field] = 'Please enter a valid phone number';
          isValid = false;
        } else if (rule === 'positiveNumber' && value && parseFloat(value) <= 0) {
          errors[field] = 'Please enter a positive number';
          isValid = false;
        } else if (rule === 'integer' && value && !Number.isInteger(parseFloat(value))) {
          errors[field] = 'Please enter a whole number';
          isValid = false;
        }
      });
    });

    return { isValid, errors };
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone) {
    // Allow international format with + or just numbers
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }

  static validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end > start;
  }

  static validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
      errors: {
        minLength: !minLength ? 'Password must be at least 8 characters' : '',
        hasUpperCase: !hasUpperCase ? 'Password must contain an uppercase letter' : '',
        hasLowerCase: !hasLowerCase ? 'Password must contain a lowercase letter' : '',
        hasNumber: !hasNumber ? 'Password must contain a number' : ''
      }
    };
  }

  static validateCreditCard(cardNumber) {
    // Luhn algorithm
    cardNumber = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(cardNumber)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove HTML tags and special characters
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/[<>'"]/g, '')
      .trim();
  }

  static validateRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }

  static validateMinLength(value, minLength) {
    return value && value.length >= minLength;
  }

  static validateMaxLength(value, maxLength) {
    return !value || value.length <= maxLength;
  }

  static validateMin(value, min) {
    return parseFloat(value) >= min;
  }

  static validateMax(value, max) {
    return parseFloat(value) <= max;
  }

  static validatePattern(value, pattern) {
    const regex = new RegExp(pattern);
    return regex.test(value);
  }
}