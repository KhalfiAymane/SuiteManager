class Translations {
  constructor() {
    this.currentLang = localStorage.getItem('language') || 'en';
    this.translations = {};
  }

  async loadLanguage(lang) {
    try {
      const response = await fetch(`/lang/${lang}.json`);
      this.translations = await response.json();
      this.currentLang = lang;
      localStorage.setItem('language', lang);
      
      // Update HTML lang and dir attributes
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      
      // Add RTL class for Arabic
      if (lang === 'ar') {
        document.body.classList.add('rtl');
      } else {
        document.body.classList.remove('rtl');
      }
      
      return this.translations;
    } catch (error) {
      console.error('Error loading language:', error);
      return {};
    }
  }

  t(key) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  }

  getCurrentLanguage() {
    return this.currentLang;
  }
}

export const translations = new Translations();