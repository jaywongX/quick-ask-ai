import { DEFAULT_ASSISTANTS, DISPLAY_NAMES } from './config.js';

// 在插件安装时初始化数据和菜单
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.sync.set({ aiAssistants: DEFAULT_ASSISTANTS });
  } else if (reason === 'update') {
    const result = await chrome.storage.sync.get('aiAssistants');
    if (result.aiAssistants) {
      const mergedData = mergeConfigurations(result.aiAssistants, DEFAULT_ASSISTANTS);
      await chrome.storage.sync.set({ aiAssistants: mergedData });
    } else {
      await chrome.storage.sync.set({ aiAssistants: DEFAULT_ASSISTANTS });
    }
  }

  // 初始化右键菜单
  await createContextMenus();
});

// 创建右键菜单
async function createContextMenus() {
  // 清除现有菜单
  await chrome.contextMenus.removeAll();
  
  // 创建父菜单
  chrome.contextMenus.create({
    id: "quickSearchAI",
    title: "Quick Search AI",
    contexts: ["selection"]
  });

  // 获取配置并创建子菜单
  const data = await loadAssistantsData();
  const assistants = data.assistants;
  
  // 只为启用的AI助手创建菜单
  Object.entries(assistants)
    .filter(([_, assistant]) => assistant.enabled)
    .sort(([_, a], [__, b]) => a.order - b.order)
    .forEach(([id, assistant]) => {
      chrome.contextMenus.create({
        id: `searchWith${id.charAt(0).toUpperCase()}${id.slice(1)}`,
        parentId: "quickSearchAI",
        title: `Search with ${DISPLAY_NAMES[id]}`,
        contexts: ["selection"]
      });
    });
}

// 合并配置，保留用户的自定义设置
function mergeConfigurations(oldConfig, newConfig) {
  const merged = {
    assistants: { ...newConfig.assistants }
  };

  // 保留用户的启用状态和排序
  Object.keys(oldConfig.assistants).forEach(id => {
    if (merged.assistants[id]) {
      merged.assistants[id].enabled = oldConfig.assistants[id].enabled;
      merged.assistants[id].order = oldConfig.assistants[id].order;
    }
  });

  return merged;
}

// 处理菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const data = await loadAssistantsData();
  const selectedText = info.selectionText;
  
  const menuId = info.menuItemId.replace('searchWith', '').toLowerCase();
  const assistant = data.assistants[menuId];
  
  if (assistant && assistant.enabled) {
    let processedText = selectedText;
    
    if (assistant.currentFeature && assistant.features?.[assistant.currentFeature]) {
      const template = assistant.features[assistant.currentFeature].prompt;
      processedText = template.replace('${text}', selectedText);
    }

    // 查找已存在的标签页
    const existingTabs = await chrome.tabs.query({
      url: [
        `${assistant.url}*`,         // 匹配基础 URL 及其子路径
        `${assistant.url.replace(/\/$/, '')}/*`  // 匹配没有尾部斜杠的 URL 及其子路径
      ]
    });

    if (existingTabs.length > 0 && assistant.tabBehavior === 'reuse') {
      // 复用已有标签页
      await chrome.tabs.update(existingTabs[0].id, {
        active: true
      });
      
      // 存储要处理的文本和 AI 助手 ID
      await chrome.storage.local.set({
        'selectedText': processedText,
        'aiProvider': menuId
      });
      
      // 通知标签页执行查询
      await chrome.tabs.sendMessage(existingTabs[0].id, {
        action: 'executeQuery'
      });
    } else {
      // 创建新标签页
      chrome.tabs.create({
        url: assistant.url
      }, (newTab) => {
        chrome.storage.local.set({
          'selectedText': processedText,
          'aiProvider': menuId
        });
      });
    }
  }
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'createContextMenus') {
    createContextMenus();
  } else if (message.action === 'openAssistant') {
    handleOpenAssistant(message.assistantId, message.selectedText);
  } else if (message.action === 'checkUrl') {
    // 检查URL是否可访问
    checkUrlAccessibility(message.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ isAccessible: false, error: error.message }));
    return true; // 保持消息通道开放
  }
});

// 重置设置
async function resetSettings() {
  // 重置为默认配置
  await chrome.storage.sync.set({
    aiAssistants: DEFAULT_ASSISTANTS
  });
  
  // 重新创建右键菜单
  await createContextMenus();
}

// 加载AI助手数据
async function loadAssistantsData() {
  const result = await chrome.storage.sync.get('aiAssistants');
  
  return result.aiAssistants || DEFAULT_ASSISTANTS;
}

// 检查URL是否可访问
async function checkUrlAccessibility(url) {
  try {
    // 检查 URL 格式
    const urlObj = new URL(url);
    
    // 获取基础域名
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
    
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      mode: 'no-cors'  // 允许跨域请求
    });
    
    // 检查响应状态
    if (!response.ok && response.status !== 0) {  // status 为 0 是因为 no-cors 模式
      throw new Error('URL is not accessible');
    }

    return { isAccessible: true };
  } catch (error) {
    return { 
      isAccessible: false, 
      error: error.message === 'URL is not accessible' 
        ? 'This URL appears to be inaccessible. Please verify the URL is correct and the service is available.'
        : 'Invalid URL format. Please enter a valid base URL (e.g., https://chatgpt.com).'
    };
  }
}

// 处理打开 AI 助手
async function handleOpenAssistant(assistantId, selectedText) {
  try {
    const data = await loadAssistantsData();
    const assistant = data.assistants[assistantId];
    
    if (assistant && assistant.enabled) {
      let processedText = selectedText;
      
      if (assistant.currentFeature && assistant.features?.[assistant.currentFeature]) {
        const template = assistant.features[assistant.currentFeature].prompt;
        processedText = template.replace('${text}', selectedText);
      }

      // 查找已存在的标签页
      const existingTabs = await chrome.tabs.query({
        url: [
          `${assistant.url}*`,         // 匹配基础 URL 及其子路径
          `${assistant.url.replace(/\/$/, '')}/*`  // 匹配没有尾部斜杠的 URL 及其子路径
        ]
      });

      if (existingTabs.length > 0 && assistant.tabBehavior === 'reuse') {
        // 复用已有标签页
        await chrome.tabs.update(existingTabs[0].id, {
          active: true
        });
        
        // 存储要处理的文本和 AI 助手 ID
        await chrome.storage.local.set({
          'selectedText': processedText,
          'aiProvider': assistantId
        });
        
        // 通知标签页执行查询
        await chrome.tabs.sendMessage(existingTabs[0].id, {
          action: 'executeQuery'
        });
      } else {
        // 创建新标签页
        chrome.tabs.create({
          url: assistant.url
        }, (newTab) => {
          chrome.storage.local.set({
            'selectedText': processedText,
            'aiProvider': assistantId
          });
        });
      }
      return { success: true };
    }
    return { success: false, error: 'Assistant not found or disabled' };
  } catch (error) {
    console.error('[Quick Search AI] Error:', error);
    return { success: false, error: error.message };
  }
}