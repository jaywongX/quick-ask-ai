// DeepSeek related logic
const DeepSeekHandler = {
  selectors: {
    textArea: 'textarea[placeholder]',  // DeepSeek uses textarea with placeholder
    submitButton: 'button[aria-label*="Submit"]'  // Use aria-label to locate submit button
  },

  // DeepSeek specific waiting element function
  async waitForElement(selector, options = {}) {
    console.log(`[Quick Search AI] DeepSeek waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log(`[Quick Search AI] DeepSeek timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

      const findElement = () => {
        const element = document.querySelector(selector);
        // Check disabled state for submit button
        if (selector === this.selectors.submitButton && element) {
          if (element.disabled) {
            return null;
          }
        }
        if (element && (!options.checkEnabled || !element.disabled)) {
          clearTimeout(timeout);
          return element;
        }
        return null;
      };

      const element = findElement();
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(mutations => {
        const element = findElement();
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  },

  // DeepSeek specific text input logic
  async handleTextInput(text) {
    const textArea = await this.waitForElement(this.selectors.textArea);
    if (!textArea) {
      throw new Error('Text area not found');
    }
    console.log('find textArea', textArea);

    try {
      console.log('[Quick Search AI] Found DeepSeek textarea, setting text');
      textArea.value = text;
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      textArea.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[Quick Search AI] DeepSeek text input successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during DeepSeek text input:', error);
      throw error;
    }
  },

  // DeepSeek specific submit logic
  async handleSubmit() {
    // Wait for button to become enabled
    const submitButton = await this.waitForElement(this.selectors.submitButton, { checkEnabled: true });
    if (!submitButton) {
      throw new Error('Submit button not found or still disabled');
    }
    console.log('find submitButton', submitButton);

    try {
      console.log('[Quick Search AI] Found DeepSeek submit button, clicking');
      submitButton.click();  // Use simple click, as button is now enabled
      console.log('[Quick Search AI] DeepSeek submit successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during DeepSeek submit:', error);
      throw error;
    }
  }
};

// Tongyi Qianwen related logic
const QianwenHandler = {
  selectors: {
    textArea: '.ant-input',
    submitButton: 'div[class*="operateBtn"][class*="disabled"]'
  },

  // Tongyi Qianwen specific waiting element function
  async waitForElement(selector) {
    console.log(`[Quick Search AI] Qianwen waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log(`[Quick Search AI] Qianwen timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

      const element = document.querySelector(selector);
      if (element) {
        clearTimeout(timeout);
        return resolve(element);
      }

      const observer = new MutationObserver(mutations => {
        const element = document.querySelector(selector);
        if (element) {
          clearTimeout(timeout);
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  },

  // Tongyi Qianwen specific text input logic
  async handleTextInput(text) {
    const textArea = await this.waitForElement(this.selectors.textArea);
    if (!textArea) {
      throw new Error('Text area not found');
    }
    console.log('find textArea', textArea);

    try {
      console.log('[Quick Search AI] Found Qianwen textarea, setting text');
      textArea.value = text;
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      textArea.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[Quick Search AI] Qianwen text input successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Qianwen text input:', error);
      throw error;
    }
  },

  // Tongyi Qianwen specific submit logic
  async handleSubmit() {
    const submitButton = await this.waitForElement(this.selectors.submitButton);
    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    console.log('find submitButton', submitButton);

    try {
      console.log('[Quick Search AI] Found Qianwen submit button, clicking');
      ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        submitButton.dispatchEvent(new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      });
      console.log('[Quick Search AI] Qianwen submit successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Qianwen submit:', error);
      throw error;
    }
  }
};

// ChatGPT related logic
const ChatGPTHandler = {
  selectors: {
    textArea: '#prompt-textarea',
    submitButton: 'button[data-testid="send-button"]'
  },

  async waitForElement(selector, options = {}) {
    console.log(`[Quick Search AI] ChatGPT waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log(`[Quick Search AI] ChatGPT timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

      const findElement = () => {
        const element = document.querySelector(selector);
        if (element && (!options.checkEnabled || !element.disabled)) {
          clearTimeout(timeout);
          return element;
        }
        return null;
      };

      const element = findElement();
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(mutations => {
        const element = findElement();
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  },

  async handleTextInput(text) {
    const textArea = await this.waitForElement(this.selectors.textArea);
    if (!textArea) {
      throw new Error('Text area not found');
    }
    console.log('find textArea', textArea);

    try {
      console.log('[Quick Search AI] Found ChatGPT textarea, setting text');
      
      // Create and dispatch input event
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      });

      // Directly set editor content
      textArea.innerHTML = `<p>${text}</p>`;
      textArea.dispatchEvent(inputEvent);
      
      console.log('[Quick Search AI] ChatGPT text input successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during ChatGPT text input:', error);
      throw error;
    }
  },

  async handleSubmit() {
    // Wait for send button to appear and become enabled
    const submitButton = await this.waitForElement(this.selectors.submitButton, { 
      checkEnabled: true,
      timeout: 2000  // Shorten timeout time, as button should appear quickly
    });

    if (!submitButton) {
      console.log('[Quick Search AI] Submit button not found, trying Enter key');
      const textArea = await this.waitForElement(this.selectors.textArea);
      if (textArea) {
        // Try using Enter key to submit
        textArea.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        }));
        console.log('[Quick Search AI] ChatGPT submit via Enter key');
        return;
      }
      throw new Error('Submit button not found and textarea not available');
    }

    try {
      console.log('[Quick Search AI] Found ChatGPT submit button, clicking');
      submitButton.click();
      console.log('[Quick Search AI] ChatGPT submit successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during ChatGPT submit:', error);
      throw error;
    }
  }
};

// Grok related logic
const GrokHandler = {
  selectors: {
    textArea: 'textarea:first-of-type',  // Directly select the first textarea
    submitButton: 'button[type="submit"]'
  },

  async waitForElement(selector, options = {}) {
    console.log(`[Quick Search AI] Grok waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log(`[Quick Search AI] Grok timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

      const findElement = () => {
        const element = document.querySelector(selector);
        if (element && (!options.checkEnabled || !element.disabled)) {
          clearTimeout(timeout);
          return element;
        }
        return null;
      };

      const element = findElement();
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(mutations => {
        const element = findElement();
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  },

  async handleTextInput(text) {
    const textArea = await this.waitForElement(this.selectors.textArea);
    if (!textArea) {
      throw new Error('Text area not found');
    }
    console.log('find textArea', textArea);

    try {
      console.log('[Quick Search AI] Found Grok textarea, setting text');
      textArea.value = text;
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[Quick Search AI] Grok text input successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Grok text input:', error);
      throw error;
    }
  },

  async handleSubmit() {
    const submitButton = await this.waitForElement(this.selectors.submitButton, { checkEnabled: true });
    if (!submitButton) {
      throw new Error('Submit button not found');
    }

    try {
      console.log('[Quick Search AI] Found Grok submit button, clicking');
      submitButton.click();
      console.log('[Quick Search AI] Grok submit successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Grok submit:', error);
      throw error;
    }
  }
};

// Gemini related logic
const GeminiHandler = {
  selectors: {
    textArea: '.ql-editor.textarea',
    submitButton: 'button.send-button[aria-label]'
  },

  async waitForElement(selector, options = {}) {
    console.log(`[Quick Search AI] Gemini waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log(`[Quick Search AI] Gemini timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

      const findElement = () => {
        const element = document.querySelector(selector);
        // If it's a submit button, check aria-disabled state
        if (selector === this.selectors.submitButton && element) {
          if (element.getAttribute('aria-disabled') === 'true') {
            return null;
          }
        }
        if (element && (!options.checkEnabled || !element.disabled)) {
          clearTimeout(timeout);
          return element;
        }
        return null;
      };

      const element = findElement();
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(mutations => {
        const element = findElement();
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  },

  async handleTextInput(text) {
    const textArea = await this.waitForElement(this.selectors.textArea);
    if (!textArea) {
      throw new Error('Text area not found');
    }
    console.log('find textArea', textArea);

    try {
      console.log('[Quick Search AI] Found Gemini textarea, setting text');
      
      // Set Quill editor content
      textArea.innerHTML = `<p>${text}</p>`;

      // Trigger necessary events
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      textArea.dispatchEvent(new Event('change', { bubbles: true }));

      console.log('[Quick Search AI] Gemini text input successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Gemini text input:', error);
      throw error;
    }
  },

  async handleSubmit() {
    const submitButton = await this.waitForElement(this.selectors.submitButton, { checkEnabled: true });
    if (!submitButton) {
      throw new Error('Submit button not found');
    }

    try {
      console.log('[Quick Search AI] Found Gemini submit button, clicking');
      submitButton.click();
      console.log('[Quick Search AI] Gemini submit successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Gemini submit:', error);
      throw error;
    }
  }
};

// Perplexity related logic
const PerplexityHandler = {
  selectors: {
    textArea: 'textarea[placeholder]',  // Perplexity usually uses textarea with placeholder
    submitButton: 'button[aria-label*="Submit"]'  // Use aria-label to locate submit button
  },

  async waitForElement(selector, options = {}) {
    console.log(`[Quick Search AI] Perplexity waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log(`[Quick Search AI] Perplexity timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

      const findElement = () => {
        const element = document.querySelector(selector);
        // If it's a submit button, check disabled state
        if (selector === this.selectors.submitButton && element) {
          if (element.disabled) {
            return null;
          }
        }
        if (element && (!options.checkEnabled || !element.disabled)) {
          clearTimeout(timeout);
          return element;
        }
        return null;
      };

      const element = findElement();
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(mutations => {
        const element = findElement();
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  },

  async handleTextInput(text) {
    const textArea = await this.waitForElement(this.selectors.textArea);
    if (!textArea) {
      throw new Error('Text area not found');
    }
    console.log('find textArea', textArea);

    try {
      console.log('[Quick Search AI] Found Perplexity textarea, setting text');
      textArea.value = text;
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('[Quick Search AI] Perplexity text input successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Perplexity text input:', error);
      throw error;
    }
  },

  async handleSubmit() {
    const submitButton = await this.waitForElement(this.selectors.submitButton, { checkEnabled: true });
    if (!submitButton) {
      throw new Error('Submit button not found or still disabled');
    }

    try {
      console.log('[Quick Search AI] Found Perplexity submit button, clicking');
      submitButton.click();
      console.log('[Quick Search AI] Perplexity submit successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Perplexity submit:', error);
      throw error;
    }
  }
};

// Copilot related logic
const CopilotHandler = {
  selectors: {
    textArea: 'textarea[placeholder]',  // Copilot uses placeholder textarea
    submitButton: 'button[aria-label*="Submit"]'  // Use aria-label to locate submit button
  },

  async waitForElement(selector, options = {}) {
    console.log(`[Quick Search AI] Copilot waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log(`[Quick Search AI] Copilot timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

      const findElement = () => {
        const element = document.querySelector(selector);
        // If it's a submit button, check disabled state
        if (selector === this.selectors.submitButton && element) {
          if (element.disabled) {
            return null;
          }
        }
        if (element && (!options.checkEnabled || !element.disabled)) {
          clearTimeout(timeout);
          return element;
        }
        return null;
      };

      const element = findElement();
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(mutations => {
        const element = findElement();
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  },

  async handleTextInput(text) {
    const textArea = await this.waitForElement(this.selectors.textArea);
    if (!textArea) {
      throw new Error('Text area not found');
    }
    console.log('find textArea', textArea);

    try {
      console.log('[Quick Search AI] Found Copilot textarea, setting text');
      textArea.value = text;
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[Quick Search AI] Copilot text input successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Copilot text input:', error);
      throw error;
    }
  },

  async handleSubmit() {
    const submitButton = await this.waitForElement(this.selectors.submitButton, { checkEnabled: true });
    if (!submitButton) {
      throw new Error('Submit button not found or still disabled');
    }

    try {
      console.log('[Quick Search AI] Found Copilot submit button, clicking');
      submitButton.click();
      console.log('[Quick Search AI] Copilot submit successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Copilot submit:', error);
      throw error;
    }
  }
};

// Wenxin Yiyan related logic
const YiyanHandler = {
  selectors: {
    textArea: '.yc-editor[contenteditable="true"]',  // Use Yiyan's editor class name
    submitButton: '#sendBtn'  // Use send button ID
  },

  async waitForElement(selector, options = {}) {
    console.log(`[Quick Search AI] Yiyan waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log(`[Quick Search AI] Yiyan timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

      const findElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          clearTimeout(timeout);
          return element;
        }
        return null;
      };

      const element = findElement();
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(mutations => {
        const element = findElement();
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  },

  async handleTextInput(text) {
    const textArea = await this.waitForElement(this.selectors.textArea);
    if (!textArea) {
      throw new Error('Text area not found');
    }
    console.log('find textArea', textArea);

    try {
      console.log('[Quick Search AI] Found Yiyan textarea, setting text');
      
      // First focus editor
      textArea.focus();
      
      // Use execCommand to insert text
      document.execCommand('insertText', false, text);
      
      // If execCommand doesn't work, fall back to directly setting innerHTML
      if (!textArea.textContent) {
        textArea.innerHTML = `<p class="yc-editor-paragraph">${text}</p>`;
      }

      // Trigger necessary events
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      textArea.dispatchEvent(new Event('change', { bubbles: true }));

      console.log('[Quick Search AI] Yiyan text input successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Yiyan text input:', error);
      throw error;
    }
  },

  async handleSubmit() {
    const submitButton = await this.waitForElement(this.selectors.submitButton, { checkEnabled: true });
    if (!submitButton) {
      throw new Error('Submit button not found or still disabled');
    }

    try {
      console.log('[Quick Search AI] Found Yiyan submit button, clicking');
      submitButton.click();
      console.log('[Quick Search AI] Yiyan submit successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Yiyan submit:', error);
      throw error;
    }
  }
};

// Kimi related logic
const KimiHandler = {
  selectors: {
    textArea: '.chat-input-editor[contenteditable="true"]',  // Kimi's editor
    submitButton: '.send-button'  // Kimi's send button
  },

  async waitForElement(selector, options = {}) {
    console.log(`[Quick Search AI] Kimi waiting for element: ${selector}`);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        console.log(`[Quick Search AI] Kimi timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

      const findElement = () => {
        const element = document.querySelector(selector);
        console.log('Finding element:', selector, element); // Add debug log
        if (selector === this.selectors.submitButton && element) {
          const container = element.closest('.send-button-container');
          if (container && container.classList.contains('disabled')) {
            return null;
          }
        }
        if (element) {
          clearTimeout(timeout);
          return element;
        }
        return null;
      };

      // First try direct lookup
      const element = findElement();
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(mutations => {
        const element = findElement();
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  },

  async handleTextInput(text) {
    const textArea = await this.waitForElement(this.selectors.textArea);
    if (!textArea) {
      throw new Error('Text area not found');
    }
    console.log('find textArea', textArea);

    try {
      console.log('[Quick Search AI] Found Kimi textarea, setting text');
      
      // First focus editor
      textArea.focus();
      
      // Use execCommand to insert text
      document.execCommand('insertText', false, text);
      
      // If execCommand doesn't work, fall back to directly setting innerHTML
      if (!textArea.textContent) {
        textArea.innerHTML = `<p>${text}</p>`;
      }

      // Trigger necessary events
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      textArea.dispatchEvent(new Event('change', { bubbles: true }));

      console.log('[Quick Search AI] Kimi text input successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Kimi text input:', error);
      throw error;
    }
  },

  async handleSubmit() {
    const submitButton = await this.waitForElement(this.selectors.submitButton, { checkEnabled: true });
    if (!submitButton) {
      throw new Error('Submit button not found or still disabled');
    }

    try {
      console.log('[Quick Search AI] Found Kimi submit button, clicking');
      submitButton.click();
      console.log('[Quick Search AI] Kimi submit successful');
    } catch (error) {
      console.error('[Quick Search AI] Error during Kimi submit:', error);
      throw error;
    }
  }
};

// Wait for page to fully load
async function waitForFullLoad() {
  await new Promise(resolve => {
    if (document.readyState === 'complete') {
      console.log('[Quick Search AI] Page already fully loaded');
      resolve();
    } else {
      console.log('[Quick Search AI] Waiting for page to fully load');
      window.addEventListener('load', () => {
        console.log('[Quick Search AI] Page load complete');
        resolve();
      });
    }
  });
  console.log('[Quick Search AI] Additional wait complete');
  return true;
}

// Main function
async function init() {
  console.log('[Quick Search AI] Initializing');

  const data = await chrome.storage.local.get(['selectedText', 'aiProvider']);
  const selectedText = data.selectedText;
  const aiProvider = data.aiProvider;

  // Select handler based on AI provider
  const handler = aiProvider === 'deepseek' ? DeepSeekHandler : 
                 aiProvider === 'chatgpt' ? ChatGPTHandler :
                 aiProvider === 'grok' ? GrokHandler :
                 aiProvider === 'gemini' ? GeminiHandler :
                 aiProvider === 'perplexity' ? PerplexityHandler :
                 aiProvider === 'copilot' ? CopilotHandler :
                 aiProvider === 'yiyan' ? YiyanHandler :
                 aiProvider === 'kimi' ? KimiHandler :
                 QianwenHandler;
  
  if (!selectedText) {
    console.log('[Quick Search AI] No text selected');
    return;
  }
  
  try {
    // Wait for page to fully load
    await waitForFullLoad();
    
    // Execute text input first, then submit
    await handler.handleTextInput(selectedText);
    await handler.handleSubmit();

    // Clear stored text
    await chrome.storage.local.remove('selectedText');
    console.log('[Quick Search AI] Process completed');
    
  } catch (error) {
    console.error('[Quick Search AI] Error:', error);
  }
}

// Start processing
init(); 