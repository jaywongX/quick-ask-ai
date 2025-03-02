// 共享的询问模式模板
export const FEATURE_TEMPLATES = {
  ask: {
    name: 'Question Mode',
    prompt: 'What is ${text}? Can you explain it?',
    order: 0
  },
  explain: {
    name: 'Explain Mode',
    prompt: 'Please explain in detail the principles and uses of ${text}.',
    order: 1
  },
  summarize: {
    name: 'Summarize',
    prompt: 'Please provide a concise summary of:\n${text}',
    order: 2
  },
  research: {
    name: 'Research Mode',
    prompt: 'Please provide a detailed analysis of ${text}, including:\n1. Key concepts\n2. Historical context\n3. Current developments\n4. Future implications',
    order: 3
  }
};

export const DEFAULT_ASSISTANTS = {
  // AI助手列表
  assistants: {
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chatgpt.com/',
      enabled: true,
      order: 0,
      currentFeature: 'ask',
      features: FEATURE_TEMPLATES,  // 每个助手独立的模板配置
      menuId: 'searchWithChatGPT',
      menuTitle: 'Search with ChatGPT',
      selectors: {
        textArea: '#prompt-textarea',
        submitButton: 'button[data-testid="send-button"]'
      },
      capabilities: {
        reason: {
          name: 'Reason',
          text: 'Reason',
          enabled: false,
          selector: 'button[aria-label="Reason"]'
        }
      }
    },
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek AI',
      url: 'https://chat.deepseek.com/',
      enabled: true,
      order: 1,
      currentFeature: 'ask',
      features: FEATURE_TEMPLATES,  // 每个助手独立的模板配置
      menuId: 'searchWithDeepSeek',
      menuTitle: 'Search with DeepSeek AI',
      selectors: {
        textArea: 'textarea[placeholder]',
        submitButton: 'div[role="button"][aria-disabled]'
      },
      capabilities: {
        deepThink: {
          name: 'DeepThink',
          text: 'DeepThink (R1)',
          enabled: false,
          selector: 'div[role="button"]'
        },
        search: {
          name: 'Search',
          text: 'Search',
          enabled: false,
          selector: 'div[role="button"]'
        }
      }
    },
    gemini: {
      id: 'gemini',
      name: 'Google Gemini',
      url: 'https://gemini.google.com/app',
      enabled: true,
      order: 2,
      currentFeature: 'ask',
      features: FEATURE_TEMPLATES,  // 每个助手独立的模板配置
      menuId: 'searchWithGemini',
      menuTitle: 'Search with Google Gemini',
      selectors: {
        textArea: '.ql-editor.textarea',
        submitButton: 'button.send-button[aria-label]'
      }
    },
    perplexity: {
      id: 'perplexity',
      name: 'Perplexity',
      url: 'https://www.perplexity.ai/',
      enabled: true,
      order: 3,
      currentFeature: 'ask',
      features: FEATURE_TEMPLATES,  // 每个助手独立的模板配置
      menuId: 'searchWithPerplexity',
      menuTitle: 'Search with Perplexity',
      selectors: {
        textArea: 'textarea[placeholder]',
        submitButton: 'button[aria-label*="Submit"]'
      }
    },
    grok: {
      id: 'grok',
      name: 'Grok',
      url: 'https://grok.com/',
      enabled: true,
      order: 4,
      currentFeature: 'ask',
      features: FEATURE_TEMPLATES,  // 每个助手独立的模板配置
      menuId: 'searchWithGrok',
      menuTitle: 'Search with Grok',
      selectors: {
        textArea: 'textarea:first-of-type',
        submitButton: 'button[type="submit"]'
      }
    },
    copilot: {
      id: 'copilot',
      name: 'Microsoft Copilot',
      url: 'https://copilot.microsoft.com/',
      enabled: true,
      order: 5,
      currentFeature: 'ask',
      features: FEATURE_TEMPLATES,  // 每个助手独立的模板配置
      menuId: 'searchWithCopilot',
      menuTitle: 'Search with Microsoft Copilot',
      selectors: {
        textArea: 'textarea[placeholder]',
        submitButton: 'button[aria-label*="Submit"]'
      }
    },
    qianwen: {
      id: 'qianwen',
      name: 'Qianwen',
      url: 'https://tongyi.aliyun.com/qianwen/',
      enabled: true,
      order: 6,
      currentFeature: 'ask',
      features: FEATURE_TEMPLATES,  // 每个助手独立的模板配置
      menuId: 'searchWithQianwen',
      menuTitle: 'Search with Qianwen',
      selectors: {
        textArea: '.ant-input',
        submitButton: 'div[class*="operateBtn"]'
      }
    },
    kimi: {
      id: 'kimi',
      name: 'Kimi',
      url: 'https://kimi.moonshot.cn/',
      enabled: true,
      order: 7,
      currentFeature: 'ask',
      features: FEATURE_TEMPLATES,  // 每个助手独立的模板配置
      menuId: 'searchWithKimi',
      menuTitle: 'Search with Kimi',
      selectors: {
        textArea: '.chat-input-editor[data-lexical-editor="true"]',
        submitButton: '.send-button'
      },
      capabilities: {
        thinking: {
          name: 'Thinking',
          text: 'Thinking',
          enabled: false,
          selector: '.k15-switch'
        },
        search: {
          name: 'Internet Search',
          text: 'Internet Search',
          enabled: false,
          selector: '.search-switch'
        }
      }
    },
    yiyan: {
      id: 'yiyan',
      name: 'Wenxin Yiyan',
      url: 'https://yiyan.baidu.com/',
      enabled: true,
      order: 8,
      currentFeature: 'ask',
      features: FEATURE_TEMPLATES,  // 每个助手独立的模板配置
      menuId: 'searchWithYiyan',
      menuTitle: 'Search with Wenxin Yiyan',
      selectors: {
        textArea: '.yc-editor[contenteditable="true"]',
        submitButton: '#sendBtn'
      }
    }
  }
}; 