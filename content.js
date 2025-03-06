// 从存储中获取助手配置
async function getAssistantConfig(id) {
  const data = await chrome.storage.sync.get('aiAssistants');
  return data.aiAssistants?.assistants[id];
}

// AI 助手配置
const AI_CONFIGS = {
  chatgpt: {
    inputMethod: 'innerHTML',
    submitMethod: 'enterKey',
    submitCheck: 'disabled',
  },
  deepseek: {
    inputMethod: 'value',
    submitMethod: 'click',
    submitCheck: 'aria-disabled',
  },
  qianwen: {
    inputMethod: 'value',
    submitMethod: 'multiClick',
    submitCheck: 'disabled',
  },
  gemini: {
    inputMethod: 'execCommand',
    submitMethod: 'click',
    submitCheck: 'disabled'
  },
  perplexity: {
    inputMethod: 'value',
    submitMethod: 'click',
    submitCheck: 'disabled'
  },
  grok: {
    inputMethod: 'value',
    submitMethod: 'click',
    submitCheck: 'disabled'
  },
  copilot: {
    inputMethod: 'value',
    submitMethod: 'click',
    submitCheck: 'aria-disabled'
  },
  ernie: {
    inputMethod: 'execCommand',
    submitMethod: 'click',
    submitCheck: 'disabled'
  },
  kimi: {
    inputMethod: 'execCommand',
    submitMethod: 'multiClick',
    submitCheck: 'class'
  }
  // ... 其他 AI 助手的配置
};

// 通用 AI Handler 类
class AIHandler {
  constructor(aiId) {
    this.aiId = aiId;
    this.config = AI_CONFIGS[aiId];
  }
  
  // 获取选择器
  async getSelectors() {
    const assistant = await getAssistantConfig(this.aiId);
    if (!assistant?.selectors) {
      console.error(`[Quick Ask AI] Selectors not found for ${this.aiId}`);
      throw new Error('Selectors not found');
    }
    return assistant.selectors;
  }
  
  // 等待元素出现
  async waitForElement(selector, options = {}) {
    console.log(`[Quick Ask AI] ${this.aiId} waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      let observer;
      const timeout = setTimeout(() => {
        observer?.disconnect();
        console.log(`[Quick Ask AI] ${this.aiId} timeout waiting for: ${selector}`);
        resolve(null);
      }, 5000);

      const findElement = () => {
        const element = document.querySelector(selector);
        if (element && options.checkEnabled) {
          if (this.isButtonDisabled(element)) {
            return null;
          }
        }
        if (element && (!options.checkEnabled || !this.isButtonDisabled(element))) {
          clearTimeout(timeout);
          return element;
        }
        return null;
      };

      const element = findElement();
      if (element) {
        return resolve(element);
      }

      if (!document.body) {
        document.addEventListener('DOMContentLoaded', () => {
          observer = new MutationObserver(mutations => {
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
        return;
      }

      observer = new MutationObserver(mutations => {
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
  }

  // 检查按钮是否禁用
  isButtonDisabled(button) {
    switch (this.config.submitCheck) {
      case 'disabled':
        return button.disabled;
      case 'aria-disabled':
        return button.getAttribute('aria-disabled') === 'true';
      case 'class':
        return button.closest('.send-button-container')?.classList.contains('disabled');
      default:
        return false;
    }
  }

  // 处理文本输入
  async handleTextInput(text) {
    // 防止 XSS
    text = text.replace(/[<>]/g, '');
    
    const selectors = await this.getSelectors();
    console.log('[Quick Ask AI] text input selectors', selectors);
    const textArea = await this.waitForElement(selectors.textArea, { timeout: 5000 });
    
    if (!textArea) {
      throw new Error('Text area not found');
    }
    
    switch (this.config.inputMethod) {
      case 'innerHTML':
        // 创建文本节点
        while (textArea.firstChild) {
          textArea.removeChild(textArea.firstChild);
        }
        const p = document.createElement('p');
        p.textContent = text;
        textArea.appendChild(p);
        textArea.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        }));
        break;
        
      case 'execCommand':
        textArea.focus();
        document.execCommand('insertText', false, text);
        if (!textArea.textContent) {
          const p = document.createElement('p');
          p.textContent = text;
          textArea.appendChild(p);
        }
        ['input', 'change', 'keyup', 'keydown'].forEach(eventType => {
          textArea.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
        break;
        
      default: // value
        textArea.value = text;
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
        textArea.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    console.log(`[Quick Ask AI] ${this.aiId} text input successful`);
    return textArea;
  }

  // 处理提交
  async handleSubmit(textArea) {
    try {
      const selectors = await this.getSelectors();
      console.log('[Quick Ask AI] submit selectors', selectors);
      const submitButton = await this.waitForElement(selectors.submitButton, { checkEnabled: true });

      // 如果找不到提交按钮但配置了回车键提交
      if (!submitButton && this.config.submitMethod === 'enterKey' && textArea) {
        textArea.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        }));
        return;
      }

      if (!submitButton) {
        throw new Error('Submit button not found or still disabled');
      }

      switch (this.config.submitMethod) {
        case 'multiClick':
          ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            submitButton.dispatchEvent(new MouseEvent(eventType, {
              bubbles: true,
              cancelable: true,
              view: window
            }));
          });
          break;
        default: // click
          submitButton.click();
      }

      console.log(`[Quick Ask AI] ${this.aiId} submit successful`);
    } catch (error) {
      console.error(`[Quick Ask AI] Error during ${this.aiId} submit:`, error);
      throw error;
    }
  }

  // 处理功能状态
  async handleCapabilities() {
    const assistant = await getAssistantConfig(this.aiId);
    if (!assistant?.capabilities) {
      console.log(`[Quick Ask AI] No capabilities for ${this.aiId}`);
      return;
    }
    const promises = [];
    
    Object.entries(assistant.capabilities).forEach(([capId, capability]) => {
      if (!capability.selector) return;
      console.log('[Quick Ask AI] capability.selector', capability.selector);
      const buttonText = capability.name;
      
      const promise = new Promise(resolve => {
        waitForElement(capability.selector, buttonText, (element) => {
          console.log('[Quick Ask AI] found element', element);
          const isActive = this.checkButtonState(element, this.aiId);
          
          if (isActive !== capability.enabled) {
            element.click();
            console.log(`[Quick Ask AI] ${this.aiId} clicked button: `, element);
          }
          resolve();
        }, 5000, this.aiId);
      });
      
      promises.push(promise);
    });
    
    // 等待所有功能按钮处理完成
    await Promise.all(promises);
  }

  // 检查按钮状态的方法
  checkButtonState(element, aiId) {
    switch (aiId) {
      case 'chatgpt':
        return this.checkChatGPTState(element);
      case 'deepseek':
        return this.checkDeepSeekState(element);
      case 'perplexity':
        return this.checkPerplexityState(element);
      case 'qianwen':
        return this.checkQianwenState(element);
      case 'kimi':
        return this.checkKimiState(element);
      default:
        return this.checkDefaultState(element);
    }
  }

  // 各个 AI 助手的状态检查方法
  checkChatGPTState(element) {
    return element.getAttribute('aria-pressed') === 'true';
  }
  
  checkDeepSeekState(element) {
    const style = window.getComputedStyle(element);
    return style.backgroundColor !== 'rgb(255, 255, 255)';
  }
  
  checkPerplexityState(element) {
    // 找到按钮的开关元素
    const switchButton = element.querySelector('button[role="switch"]');
    return switchButton?.getAttribute('data-state') === 'checked';
  }
  
  checkQianwenState(element) {
    return element.classList.contains('active');
  }
  
  checkKimiState(element) {
    return element.classList.contains('open');
  }
  
  checkDefaultState(element) {
    return element.classList.contains('active') || 
           element.getAttribute('aria-pressed') === 'true';
  }
}

// 初始化快捷键监听
async function initShortcutListener() {
  document.addEventListener('keydown', async (e) => {
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.isContentEditable) {
      return;
    }

    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) return;
    
    await handleShortcutMatch(e, selectedText);
  });
}

// 处理快捷键匹配
async function handleShortcutMatch(e, selectedText) {
  const data = await chrome.storage.sync.get('aiAssistants');
  const assistants = data.aiAssistants.assistants;
  
  for (const [id, assistant] of Object.entries(assistants)) {
    if (!assistant.shortcut?.enabled) continue;
    
    const { key, modifiers } = assistant.shortcut;
    const matchesKey = e.key.toLowerCase() === key.toLowerCase();
    
    const matchesModifiers = 
      modifiers.includes('Alt') === e.altKey &&
      modifiers.includes('Control') === e.ctrlKey &&
      modifiers.includes('Shift') === e.shiftKey;
    
    if (matchesKey && matchesModifiers) {
      e.preventDefault();
      await openAssistantWithShortcut(id, selectedText);
      break;
    }
  }
}

// 使用快捷键打开助手
async function openAssistantWithShortcut(assistantId, selectedText) {
  try {
    await chrome.runtime.sendMessage({
      action: 'openAssistant',
      assistantId,
      selectedText
    });
  } catch (error) {
    if (error.message !== 'The message port closed before a response was received.') {
      console.error('[Quick Ask AI] Error:', error);
    }
  }
}

// 初始化消息监听
function initMessageListener() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detectSelector') {
      detectSelector(request.type).then(selector => {
        sendResponse({ selector });
      });
      return true;
    }
  });
}

// 初始化功能状态
async function initCapabilities() {
  const currentUrl = window.location.href;
  const data = await chrome.storage.sync.get('aiAssistants');
  
  const [assistantId, _] = Object.entries(data.aiAssistants.assistants).find(
    ([_, a]) => currentUrl.startsWith(a.url)
  ) || [];
  
  if (assistantId) {
    const handler = new AIHandler(assistantId);
    return {
      handler,
      capabilitiesPromise: handler.handleCapabilities()
    };
  }
  
  return { handler: null, capabilitiesPromise: Promise.resolve() };
}

// 处理待处理的查询
async function handlePendingQuery(handler, capabilitiesPromise) {
  const data = await chrome.storage.local.get(['selectedText', 'aiProvider']);
  console.log('[Quick Ask AI] handlePendingQuery', data);
  if (!data.selectedText || !data.aiProvider) {
    console.log('[Quick Ask AI] No pending query');
    return;
  }
  
  await capabilitiesPromise;
  await chrome.storage.local.remove(['selectedText', 'aiProvider']);

  if (!handler || handler.aiId !== data.aiProvider) {
    handler = new AIHandler(data.aiProvider);
  }
  
  const textArea = await handler.handleTextInput(data.selectedText);
  await handler.handleSubmit(textArea);
}

// 主初始化函数
async function init() {
  console.log('[Quick Ask AI] Initializing');

  try {
    // 初始化各个模块
    await initShortcutListener();
    initMessageListener();

    // 等待页面加载完成
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve));
    }

    // 初始化功能状态
    const { handler, capabilitiesPromise } = await initCapabilities();

    // 处理待处理的查询
    await handlePendingQuery(handler, capabilitiesPromise);

  } catch (error) {
    console.error('[Quick Ask AI] Error:', error);
  }
}

// Start processing
init();

// 监听来自 background 的消息
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'executeQuery') {
    let cleanup;
    try {
      chrome.storage.local.get(['selectedText', 'aiProvider'], async (data) => {
        if (data.selectedText && data.aiProvider) {
          const handler = new AIHandler(data.aiProvider);
          cleanup = () => {
            // 清理资源
            handler.cleanup?.();
          };
          try {
            const textArea = await handler.handleTextInput(data.selectedText);
            if (textArea) {
              await handler.handleSubmit(textArea);
            }
          } finally {
            cleanup?.();
          }
        }
      });
    } catch (error) {
      // 检查是否是扩展上下文失效错误
      if (error.message.includes('Extension context invalidated')) {
        console.log('[Quick Ask AI] Extension reloaded, stopping execution');
        return;
      }
      console.error('[Quick Ask AI] Error:', error);
    }
  }
});

// 检测选择器
async function detectSelector(type) {
  try {
    // 显示遮罩层和提示
    const overlay = createOverlay();
    const hint = showDetectHint(type);

    return new Promise((resolve) => {
      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 移除遮罩和提示
        overlay.remove();
        hint.remove();

        document.removeEventListener('click', clickHandler, true);
        const selector = generateOptimalSelector(e.target);
        resolve(selector);
      };
      
      // 对于文本输入框，使用 mouseover 事件代替 click
      if (type === 'textArea') {
        const mouseoverHandler = (e) => {
          const element = e.target;
          // 检查是否是可输入元素
          if (element.tagName === 'TEXTAREA' || 
              element.contentEditable === 'true' ||
              (element.tagName === 'DIV' && element.getAttribute('role') === 'textbox') ||
              element.classList.contains('ql-editor')) {
            
            overlay.remove();
            hint.remove();
            document.removeEventListener('mouseover', mouseoverHandler, true);
            const selector = generateOptimalSelector(element);
            resolve(selector);
          }
        };
        document.addEventListener('mouseover', mouseoverHandler, true);
      } else {
        // 对于提交按钮，继续使用 click 事件
        document.addEventListener('click', clickHandler, true);
      }

      // 添加取消按钮
      const cancelBtn = createCancelButton();
      cancelBtn.addEventListener('click', () => {
        overlay.remove();
        hint.remove();
        cancelBtn.remove();
        document.removeEventListener('click', clickHandler, true);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('[Quick Ask AI] Error detecting selector:', error);
    return null;
  }
}

// 创建半透明遮罩层
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999998;
    cursor: crosshair;
  `;
  document.body.appendChild(overlay);
  return overlay;
}

// 创建取消按钮
function createCancelButton() {
  const btn = document.createElement('button');
  btn.textContent = 'Cancel Detection';
  btn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 999999;
    font-family: system-ui;
  `;
  document.body.appendChild(btn);
  return btn;
}

// 显示检测提示
function showDetectHint(type) {
  const hint = document.createElement('div');
  hint.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 999999;
    font-family: system-ui;
  `;
  hint.textContent = type === 'textArea' ? 
    'Move mouse over the text input area' : 
    'Click on the submit/send button (may need to click multiple times)';
  document.body.appendChild(hint);
  
  return hint;  // 返回提示元素以便后续移除
}

// 检测文本输入区域
async function detectTextAreaSelector() {
  const possibleSelectors = [
    // 常见的文本输入选择器模式
    'textarea',
    '[contenteditable="true"]',
    '[role="textbox"]',
    '.ql-editor',
    '[data-gramm="false"]'
  ];

  // 尝试找到可能的文本输入区域
  const elements = [];
  for (const selector of possibleSelectors) {
    const found = document.querySelectorAll(selector);
    elements.push(...found);
  }

  // 分析每个元素的特征
  const candidates = elements.map(element => {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    
    return {
      element,
      score: calculateElementScore(element, {
        // 可见性
        isVisible: rect.width > 0 && rect.height > 0 && styles.display !== 'none',
        // 大小适中
        hasReasonableSize: rect.width > 100 && rect.height > 30,
        // 位置在视口内
        isInViewport: rect.top >= 0 && rect.top <= window.innerHeight,
        // 可编辑
        isEditable: element.isContentEditable || element.tagName === 'TEXTAREA',
        // 没有被禁用
        isEnabled: !element.disabled,
        // 在页面底部区域
        isNearBottom: rect.top > window.innerHeight * 0.5
      })
    };
  });

  // 选择得分最高的元素
  const bestCandidate = candidates
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)[0];

  if (!bestCandidate) {
    throw new Error('No suitable text input area found');
  }

  // 生成最优选择器
  return {
    selector: generateOptimalSelector(bestCandidate.element),
    confidence: bestCandidate.score / 5 // 转换为0-1的置信度
  };
}

// 检测提交按钮
async function detectSubmitButtonSelector() {
  const possibleSelectors = [
    'button[type="submit"]',
    'button:has(svg)', // 常见的发送图标按钮
    '[role="button"]',
    'button',
    '.send-button',
    '[aria-label*="send" i]',
    '[aria-label*="submit" i]'
  ];

  const elements = [];
  for (const selector of possibleSelectors) {
    const found = document.querySelectorAll(selector);
    elements.push(...found);
  }

  const candidates = elements.map(element => {
    const rect = element.getBoundingClientRect();
    const text = element.textContent.toLowerCase();
    
    return {
      element,
      score: calculateElementScore(element, {
        // 基本特征
        isVisible: rect.width > 0 && rect.height > 0,
        isClickable: element.tagName === 'BUTTON' || element.role === 'button',
        // 文本特征
        hasRelevantText: /send|submit|确认|发送/.test(text),
        // 位置特征
        isNearTextArea: isNearElement('textarea', element, 100),
        // 图标特征
        hasSendIcon: element.querySelector('svg') !== null
      })
    };
  });

  const bestCandidate = candidates
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)[0];

  if (!bestCandidate) {
    throw new Error('No suitable submit button found');
  }

  return {
    selector: generateOptimalSelector(bestCandidate.element),
    confidence: bestCandidate.score / 5
  };
}

// 计算元素得分
function calculateElementScore(element, criteria) {
  return Object.values(criteria).reduce((score, value) => {
    return score + (value ? 1 : 0);
  }, 0);
}

// 生成最优选择器
function generateOptimalSelector(element) {
  // 尝试不同的选择器策略
  const strategies = [
    // ID选择器
    () => element.id ? `#${element.id}` : null,
    
    // 特殊属性选择器
    () => {
      const attrs = ['data-testid', 'aria-label', 'name', 'role', 'placeholder'];
      for (const attr of attrs) {
        const value = element.getAttribute(attr);
        if (value) return `[${attr}="${value}"]`;
      }
      return null;
    },
    
    // 类选择器（选择最具特征性的类）
    () => {
      const classes = Array.from(element.classList)
        .filter(c => !/^(js-|is-|has-)/.test(c)); // 过滤掉状态类
      if (classes.length) return `.${classes[0]}`;
      return null;
    },
    
    // 标签+属性组合选择器
    () => element.type ? `${element.tagName.toLowerCase()}[type="${element.type}"]` : null,
    
    // 后备选择器：使用标签名
    () => element.tagName.toLowerCase()
  ];

  // 返回第一个有效的选择器
  for (const strategy of strategies) {
    const selector = strategy();
    if (selector && document.querySelector(selector) === element) {
      return selector;
    }
  }

  // 如果所有策略都失败，返回一个基于路径的选择器
  const path = [];
  let current = element;
  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    if (current.id) {
      path.unshift(`#${current.id}`);
      break;
    } else if (current.classList.length) {
      path.unshift(`.${Array.from(current.classList)[0]}`);
    } else {
      path.unshift(tag);
    }
    current = current.parentElement;
  }
  return path.join(' > ');
}

// 检查元素是否在目标元素附近
function isNearElement(targetSelector, element, threshold) {
  const target = document.querySelector(targetSelector);
  if (!target) return false;

  const targetRect = target.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const distance = Math.sqrt(
    Math.pow(targetRect.left - elementRect.left, 2) +
    Math.pow(targetRect.top - elementRect.top, 2)
  );

  return distance <= threshold;
}

// 处理选中文本
async function handleSelectedText(text) {
  const data = await chrome.storage.local.get(['selectedText', 'aiProvider']);
  const assistants = await loadAssistantsData();
  const assistant = assistants.assistants[data.aiProvider];

  if (assistant) {
    const textArea = document.querySelector(assistant.selectors.textArea);
    const submitButton = document.querySelector(assistant.selectors.submitButton);

    if (textArea && submitButton) {
      // 填充文本
      if (textArea.tagName === 'DIV') {
        textArea.textContent = data.selectedText;
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        textArea.value = data.selectedText;
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 点击提交按钮
      submitButton.click();
    }
  }
}

// 等待功能按钮出现的辅助函数
function waitForElement(selector, buttonText, callback, timeout = 5000, aiId) {
  const startTime = Date.now();
  let observer;
  let found = false;
  
  function check() {
    if (found) return;
    const elements = document.querySelectorAll(selector);
    const element = Array.from(elements).find(el => el.textContent.includes(buttonText));
    
    if (element) {
      found = true;
      callback(element);
      observer?.disconnect();
      return;
    }
  
    if (Date.now() - startTime >= timeout) {
      console.error(`[Quick Ask AI] Button not found: ${buttonText}`);
      observer?.disconnect();
      return;
    }
  }
  
  check();
  
  observer = new MutationObserver(check);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}