// AI Provider Configuration
const aiProviders = {
  searchWithDeepSeek: {
    title: "Search with DeepSeek AI",
    url: "https://chat.deepseek.com/",
    provider: "deepseek"
  },
  searchWithQianwen: {
    title: "Search with Qianwen",
    url: "https://tongyi.aliyun.com/qianwen/",
    provider: "qianwen"
  },
  searchWithChatGPT: {
    title: "Search with ChatGPT",
    url: "https://chat.openai.com/",
    provider: "chatgpt"
  },
  searchWithGrok: {
    title: "Search with Grok",
    url: "https://grok.com/",
    provider: "grok"
  },
  searchWithGemini: {
    title: "Search with Google Gemini",
    url: "https://gemini.google.com/app",
    provider: "gemini"
  },
  searchWithPerplexity: {
    title: "Search with Perplexity",
    url: "https://www.perplexity.ai/",
    provider: "perplexity"
  },
  searchWithCopilot: {
    title: "Search with Microsoft Copilot",
    url: "https://copilot.microsoft.com/",
    provider: "copilot"
  },
  searchWithYiyan: {
    title: "Search with Wenxin Yiyan",
    url: "https://yiyan.baidu.com/",
    provider: "yiyan"
  },
  searchWithKimi: {
    title: "Search with Kimi",
    url: "https://kimi.moonshot.cn/",
    provider: "kimi"
  }
};

chrome.runtime.onInstalled.addListener(() => {
  // 创建父菜单
  chrome.contextMenus.create({
    id: "quickSearchAI",
    title: "Quick Search AI",
    contexts: ["selection"]
  });

  // 创建子菜单项
  Object.entries(aiProviders).forEach(([id, config]) => {
    chrome.contextMenus.create({
      id,
      parentId: "quickSearchAI",
      title: config.title,
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  const provider = aiProviders[info.menuItemId];
  
  if (provider) {
    chrome.tabs.create({
      url: provider.url
    }, (newTab) => {
      chrome.storage.local.set({ 
        'selectedText': selectedText,
        'aiProvider': provider.provider
      });
    });
  }
});