import { DEFAULT_ASSISTANTS } from './config.js';

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
  Object.values(assistants)
    .filter(assistant => assistant.enabled)
    .sort((a, b) => a.order - b.order)
    .forEach(assistant => {
      // 创建AI助手子菜单
      chrome.contextMenus.create({
        id: `searchWith${assistant.id}`,
        parentId: "quickSearchAI",
        title: `Search with ${assistant.name}`,
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
  
  const menuId = info.menuItemId.replace('searchWith', '');
  const assistant = data.assistants[menuId];
  
  if (assistant && assistant.enabled) {
    let processedText = selectedText;
    
    // 使用助手当前选择的询问模式处理文本
    if (assistant.currentFeature && assistant.features?.[assistant.currentFeature]) {
      const template = assistant.features[assistant.currentFeature].prompt;
      processedText = template.replace('${text}', selectedText);
    }

    // 在新标签页中打开AI助手
    chrome.tabs.create({
      url: assistant.url
    }, (newTab) => {
      // 存储要处理的文本和AI助手ID
      chrome.storage.local.set({ 
        'selectedText': processedText,
        'aiProvider': assistant.id
      });
    });
  }
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'createContextMenus') {
    createContextMenus();
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
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors'  // 允许跨域请求
    });
    return { isAccessible: true };
  } catch (error) {
    return { 
      isAccessible: false, 
      error: 'This URL appears to be inaccessible. Please verify the URL is correct and the service is available.'
    };
  }
}