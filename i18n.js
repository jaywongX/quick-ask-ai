export const i18n = {
  // 获取翻译
  getMessage(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions);
  },

  // 获取当前语言
  getCurrentLocale() {
    return chrome.i18n.getUILanguage();
  },

  // 初始化页面翻译
  initializeI18n() {
    // 翻译带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.getMessage(key) || key;
    });

    // 翻译带有 data-i18n-placeholder 属性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.getMessage(key) || key;
    });

    // 翻译带有 data-i18n-title 属性的元素
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.getMessage(key) || key;
    });
  }
}; 