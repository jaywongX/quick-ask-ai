// 共享的询问模式模板
export const FEATURE_TEMPLATES = {
  question: {
    name: chrome.i18n.getMessage('mode_question'),
    prompt: chrome.i18n.getMessage('prompt_question'),
    order: 0
  },
  explain: {
    name: chrome.i18n.getMessage('mode_explain'),
    prompt: chrome.i18n.getMessage('prompt_explain'),
    order: 1
  },
  summarize: {
    name: chrome.i18n.getMessage('mode_summarize'),
    prompt: chrome.i18n.getMessage('prompt_summarize'),
    order: 2
  },
  reask: {
    name: chrome.i18n.getMessage('mode_reask'),
    prompt: chrome.i18n.getMessage('prompt_reask'),
    order: 3
  }
};

export const DEFAULT_ASSISTANTS = {
  assistants: {
    chatgpt: {
      url: 'https://chatgpt.com/',
      enabled: true,
      order: 0,
      currentFeature: 'question',
      features: FEATURE_TEMPLATES,
      tabBehavior: 'new',
      selectors: {
        textArea: '#prompt-textarea',
        submitButton: 'button[data-testid="send-button"]'
      },
      capabilities: {
        reason: {
          name: 'Reason',
          enabled: false,
          selector: 'button[aria-label="Reason"]'
        }
      },
      shortcut: {
        enabled: false,
        key: "",
        modifiers: [],
        description: ""
      }
    },
    deepseek: {
      url: 'https://chat.deepseek.com/',
      enabled: true,
      order: 1,
      currentFeature: 'question',
      features: FEATURE_TEMPLATES,
      tabBehavior: 'new',
      selectors: {
        textArea: 'textarea[placeholder]',
        submitButton: 'div[role="button"][aria-disabled]'
      },
      capabilities: {
        deepThink: {
          name: 'DeepThink',
          enabled: false,
          selector: 'div[role="button"]'
        },
        search: {
          name: 'Search',
          enabled: false,
          selector: 'div[role="button"]'
        }
      },
      shortcut: {
        enabled: false,
        key: "",
        modifiers: [],
        description: ""
      }
    },
    gemini: {
      url: 'https://gemini.google.com/app',
      enabled: true,
      order: 2,
      currentFeature: 'question',
      features: FEATURE_TEMPLATES,
      tabBehavior: 'new',
      selectors: {
        textArea: '.ql-editor.textarea',
        submitButton: 'button.send-button[aria-label]'
      },
      shortcut: {
        enabled: false,
        key: "",
        modifiers: [],
        description: ""
      }
    },
    perplexity: {
      url: 'https://www.perplexity.ai/',
      enabled: true,
      order: 3,
      currentFeature: 'question',
      features: FEATURE_TEMPLATES,
      tabBehavior: 'new',
      selectors: {
        textArea: 'textarea[placeholder]',
        submitButton: 'button[aria-label*="Submit"]'
      },
      shortcut: {
        enabled: false,
        key: "",
        modifiers: [],
        description: ""
      }
    },
    grok: {
      url: 'https://grok.com/',
      enabled: true,
      order: 4,
      currentFeature: 'question',
      features: FEATURE_TEMPLATES,
      tabBehavior: 'new',
      selectors: {
        textArea: 'textarea:first-of-type',
        submitButton: 'button[type="submit"]'
      },
      shortcut: {
        enabled: false,
        key: "",
        modifiers: [],
        description: ""
      }
    },
    copilot: {
      url: 'https://copilot.microsoft.com/',
      enabled: true,
      order: 5,
      currentFeature: 'question',
      features: FEATURE_TEMPLATES,
      tabBehavior: 'new',
      selectors: {
        textArea: 'textarea[placeholder]',
        submitButton: 'button[aria-label*="Submit"]'
      },
      shortcut: {
        enabled: false,
        key: "",
        modifiers: [],
        description: ""
      }
    },
    qianwen: {
      url: 'https://tongyi.aliyun.com/qianwen/',
      enabled: true,
      order: 6,
      currentFeature: 'question',
      features: FEATURE_TEMPLATES,
      tabBehavior: 'new',
      selectors: {
        textArea: '.ant-input',
        submitButton: 'div[class*="operateBtn"]'
      },
      shortcut: {
        enabled: false,
        key: "",
        modifiers: [],
        description: ""
      }
    },
    kimi: {
      url: 'https://kimi.moonshot.cn/',
      enabled: true,
      order: 7,
      currentFeature: 'question',
      features: FEATURE_TEMPLATES,
      tabBehavior: 'new',
      selectors: {
        textArea: '.chat-input-editor[data-lexical-editor="true"]',
        submitButton: '.send-button'
      },
      capabilities: {
        thinking: {
          name: 'Thinking',
          enabled: false,
          selector: '.k15-switch'
        },
        search: {
          name: 'Internet Search',
          enabled: false,
          selector: '.ask-switch'
        }
      },
      shortcut: {
        enabled: false,
        key: "",
        modifiers: [],
        description: ""
      }
    },
    ernie: {
      url: 'https://yiyan.baidu.com/',
      enabled: true,
      order: 8,
      currentFeature: 'question',
      features: FEATURE_TEMPLATES,
      tabBehavior: 'new',
      selectors: {
        textArea: '.yc-editor[contenteditable="true"]',
        submitButton: '#sendBtn'
      },
      shortcut: {
        enabled: false,
        key: "",
        modifiers: [],
        description: ""
      }
    }
  }
};

export const SHORTCUT_CONSTANTS = {
  MODIFIER_KEYS: ['Alt', 'Control', 'Shift'],
  FORBIDDEN_KEYS: ['Tab', 'Escape', 'CapsLock', 'Meta'],
  MAX_MODIFIERS: 3,  // 允许最多3个修饰键
  SHORTCUT_HELP: {
    'windows': 'Use Alt/Ctrl/Shift + key combinations',
    'mac': 'Use Option/Command/Shift + key combinations'
  }
}; 