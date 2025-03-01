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
  yiyan: {
    inputMethod: 'execCommand',
    submitMethod: 'click',
    submitCheck: 'disabled'
  },
  kimi: {
    inputMethod: 'execCommand',
    submitMethod: 'multiClick',
    submitCheck: 'class'
  },
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
      console.error(`[Quick Search AI] Selectors not found for ${this.aiId}`);
      throw new Error('Selectors not found');
    }
    return assistant.selectors;
  }
  
  // 等待元素出现
  async waitForElement(selector, options = {}) {
    console.log(`[Quick Search AI] ${this.aiId} waiting for element: ${selector}`);
    return new Promise((resolve, reject) => {
      let observer;
      const timeout = setTimeout(() => {
        observer?.disconnect();
        console.log(`[Quick Search AI] ${this.aiId} timeout waiting for: ${selector}`);
        resolve(null);
      }, 10000);

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
    try {
      const selectors = await this.getSelectors();
      const textArea = await this.waitForElement(selectors.textArea);
      if (!textArea) {
        throw new Error('Text area not found');
      }
      
      switch (this.config.inputMethod) {
        case 'innerHTML':
          textArea.innerHTML = `<p>${text}</p>`;
          textArea.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: text
          }));
          break;
          
        case 'execCommand':
          textArea.focus();
          textArea.innerHTML = '';
          document.execCommand('insertText', false, text);
          if (!textArea.textContent) {
            textArea.innerHTML = `<p>${text}</p>`;
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
      
      console.log(`[Quick Search AI] ${this.aiId} text input successful`);
      return textArea;
    } catch (error) {
      console.error(`[Quick Search AI] Error during ${this.aiId} text input:`, error);
      throw error;
    }
  }

  // 处理提交
  async handleSubmit(textArea) {
    try {
      const selectors = await this.getSelectors();
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

      console.log(`[Quick Search AI] ${this.aiId} submit successful`);
    } catch (error) {
      console.error(`[Quick Search AI] Error during ${this.aiId} submit:`, error);
      throw error;
    }
  }
}

// 主函数
async function init() {
  console.log('[Quick Search AI] Initializing');

  try {
    // 监听来自 popup 的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'detectSelector') {
        detectSelector(request.type).then(selector => {
          sendResponse({ selector });
        });
        return true; // 保持消息通道开启
      }
    });

    // 等待页面加载完成
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve));
    }

    // 检查是否有待处理的查询操作
    const data = await chrome.storage.local.get(['selectedText', 'aiProvider']);
    if (data.selectedText && data.aiProvider) {
      // 清除存储的数据
      await chrome.storage.local.remove(['selectedText', 'aiProvider']);

      // 使用通用 Handler 处理查询
      const handler = new AIHandler(data.aiProvider);
      const textArea = await handler.handleTextInput(data.selectedText);
      await handler.handleSubmit(textArea);
    }
  } catch (error) {
    console.error('[Quick Search AI] Error:', error);
  }
}

// Start processing
init();

// 检测选择器
async function detectSelector(type) {
  try {
    // 显示遮罩层和提示
    const overlay = createOverlay();
    const hint = showDetectHint(type);

    // 等待页面加载完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    console.error('[Quick Search AI] Error detecting selector:', error);
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