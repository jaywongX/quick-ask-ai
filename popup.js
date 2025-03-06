import { DEFAULT_ASSISTANTS, FEATURE_TEMPLATES, SHORTCUT_CONSTANTS } from './config.js';
import { i18n } from './i18n.js';

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
  await initializeUI();
  setupEventListeners();
});

// 初始化UI
async function initializeUI() {
  const data = await loadAssistantsData();
  renderAIList(data.assistants);
  initializeDragAndDrop();
  
  // 初始化页面国际化
  i18n.initializeI18n();
}

// 加载AI助手数据
async function loadAssistantsData() {
  const result = await chrome.storage.sync.get('aiAssistants');
  
  // 返回数据，如果不存在则返回默认值
  return result.aiAssistants || DEFAULT_ASSISTANTS;
}

// 保存AI助手数据
async function saveAssistantsData(data) {
  try {
    // 检查数据大小
    const jsonSize = new Blob([JSON.stringify(data)]).size;
    if (jsonSize > chrome.storage.sync.QUOTA_BYTES) {
      throw new Error('Storage quota exceeded');
    }
    
    await chrome.storage.sync.set({ aiAssistants: data });
  } catch (error) {
    if (error.message === 'Storage quota exceeded') {
      showToast(i18n.getMessage('storageQuotaExceeded'), 'error');
    }
    throw error;
  }
}

// 渲染AI列表
function renderAIList(assistants) {
  const aiList = document.getElementById('aiList');
  aiList.innerHTML = '';

  // 按order排序
  const sortedAssistants = Object.entries(assistants)
    .sort(([_, a], [__, b]) => a.order - b.order);

  sortedAssistants.forEach(([id, assistant]) => {
    const aiItem = createAIListItem(assistant, id);
    aiList.appendChild(aiItem);
  });
}

// 创建AI列表项
function createAIListItem(assistant, id) {
  const item = document.createElement('div');
  item.className = 'ai-item';
  item.draggable = true;
  item.dataset.id = id;

  const dragDiv = document.createElement('div');
  dragDiv.className = 'ai-drag';
  dragDiv.textContent = '↕️';

  const nameDiv = document.createElement('div');
  nameDiv.className = 'ai-name';
  nameDiv.textContent = i18n.getMessage(id);

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'ai-actions';
  actionsDiv.innerHTML = `
    <button class="toggle-btn ${assistant.enabled ? 'enabled' : 'disabled'}" data-action="toggle">
      ${assistant.enabled ? i18n.getMessage('status_enabled') : i18n.getMessage('status_disabled')}
    </button>
    <button class="action-btn" data-action="edit" title="${i18n.getMessage('button_edit')}">⚙️</button>
    <button class="action-btn" data-action="delete" title="${i18n.getMessage('button_delete')}">🗑️</button>
  `;

  item.appendChild(dragDiv);
  item.appendChild(nameDiv);
  item.appendChild(actionsDiv);

  return item;
}

// 配置常量
const CONFIG = {
  GITHUB_ISSUES: 'https://github.com/jaywongX/quick-ask-ai/issues',
  GITHUB_REPO: 'https://github.com/jaywongX/quick-ask-ai',
  DONATE_URLS: {
    DOMESTIC: 'https://afdian.com/a/jaywong',    // 国内捐赠链接
    OVERSEAS: 'https://ko-fi.com/jaywong'        // 国外捐赠链接
  }
};

// 当前编辑的AI助手ID
let currentEditId = null;
// 快捷键相关的变量
let isRecording = false;
let currentModifiers = [];
let currentKey = '';

// 对话框管理
const DialogManager = {
  activeDialogs: new Set(),
  
  showDialog(dialogId) {
    // 打开新对话框
    const dialog = document.getElementById(dialogId);
    dialog.classList.remove('hidden');
    this.activeDialogs.add(dialogId);
  },
  
  hideDialog(dialogId) {
    document.getElementById(dialogId).classList.add('hidden');
    this.activeDialogs.delete(dialogId);
  },
  
  // 隐藏所有对话框
  hideAllDialogs() {
    this.activeDialogs.forEach(dialogId => {
      document.getElementById(dialogId).classList.add('hidden');
    });
    this.activeDialogs.clear();
  }
};

// 当前要删除的询问模式ID
let deleteFeatureId = null;

// 显示询问模式删除确认对话框
function showDeleteFeatureDialog(id, name) {
  deleteFeatureId = id;
  document.getElementById('deleteFeatureName').textContent = name;
  DialogManager.showDialog('deleteFeatureDialog');
}

// 隐藏询问模式删除确认对话框
function hideDeleteFeatureDialog() {
  DialogManager.hideDialog('deleteFeatureDialog');
  deleteFeatureId = null;
}

// 初始化快捷键设置
function initShortcutSetting() {
  const editShortcut = document.getElementById('editShortcut');
  const clearShortcut = document.getElementById('clearShortcut');
  
  editShortcut.addEventListener('focus', () => {
    isRecording = true;
    editShortcut.value = 'Press keys...';
    currentModifiers = [];
    currentKey = '';
  });
  
  editShortcut.addEventListener('blur', async () => {
    isRecording = false;
    if (!currentKey) {
      const data = await loadAssistantsData();
      const assistant = data.assistants[currentEditId];
      editShortcut.value = assistant?.shortcut?.description || '';
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (!isRecording) return;
    e.preventDefault();
    
    const key = e.key;
    if (SHORTCUT_CONSTANTS.FORBIDDEN_KEYS.includes(key)) return;
    
    // 处理修饰键
    const modifierMap = {
      'Alt': 'Alt',
      'Control': 'Control',
      'Shift': 'Shift'
    };
    
    if (key in modifierMap) {
      const modifier = modifierMap[key];
      if (!currentModifiers.includes(modifier)) {
        currentModifiers.push(modifier);
      }
    } else {
      // 对于字母键，统一存储为大写
      currentKey = key.length === 1 ? key.toUpperCase() : key;
    }
    
    if (currentModifiers.length > SHORTCUT_CONSTANTS.MAX_MODIFIERS) {
      currentModifiers = currentModifiers.slice(-SHORTCUT_CONSTANTS.MAX_MODIFIERS);
    }
    
    const description = [...currentModifiers, currentKey].join(' + ');
    editShortcut.value = description;
    
    if (currentKey) {
      isRecording = false;
      editShortcut.blur();
    }
  });
  
  clearShortcut.addEventListener('click', () => {
    currentModifiers = [];
    currentKey = '';
    editShortcut.value = '';
  });
}

// 设置事件监听器
function setupEventListeners() {
  // 初始化快捷键设置
  initShortcutSetting();

  // 重置按钮
  document.getElementById('resetBtn').addEventListener('click', () => {
    showResetDialog();
  });

  // 重置确认
  document.getElementById('resetConfirm').addEventListener('click', async () => {
    try {
      // 重置设置
      await chrome.storage.sync.set({
        aiAssistants: DEFAULT_ASSISTANTS
      });
      
      // 重新加载数据并更新UI
      const data = await loadAssistantsData();
      renderAIList(data.assistants);
      
      // 通知 background 更新右键菜单
      await updateContextMenus();
      
      // 关闭对话框
      DialogManager.hideAllDialogs();
      
      // 显示成功提示
      showToast(i18n.getMessage('settingsResetSuccess'));
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showToast(i18n.getMessage('settingsResetError'), 'error');
    }
  });

  // 重置取消
  document.getElementById('resetCancel').addEventListener('click', () => {
    hideResetDialog();
  });

  // 反馈按钮
  document.getElementById('feedbackBtn').addEventListener('click', () => {
    openNewTab(CONFIG.GITHUB_ISSUES);
  });

  // 捐赠按钮
  document.getElementById('donateBtn').addEventListener('click', () => {
    showDonateDialog();
  });

  // 捐赠对话框关闭按钮
  document.getElementById('donateClose').addEventListener('click', () => {
    hideDonateDialog();
  });

  // 删除相关函数
  let deleteAssistantId = null;

  function showDeleteDialog(id, name) {
    deleteAssistantId = id;
    document.getElementById('deleteAssistantName').textContent = name;
    DialogManager.showDialog('deleteDialog');
  }

  function hideDeleteDialog() {
    DialogManager.hideDialog('deleteDialog');
    deleteAssistantId = null;
  }

  // 检查是否可以删除AI助手
  function canDeleteAssistant(assistants, id) {
    const enabledAssistants = Object.values(assistants)
      .filter(a => a.enabled && a.id !== id);
    
    if (enabledAssistants.length === 0) {
      showToast(i18n.getMessage('cannotDeleteLastAssistant'), 'error');
      return false;
    }
    return true;
  }

  // 处理删除操作
  async function handleDelete() {
    try {
      const data = await loadAssistantsData();
      
      if (!canDeleteAssistant(data.assistants, deleteAssistantId)) {
        return;
      }

      delete data.assistants[deleteAssistantId];
      await saveAssistantsData(data);
      
      // 更新UI
      renderAIList(data.assistants);
      await updateContextMenus();
      
      // 关闭对话框
      hideDeleteDialog();
      
      showToast(i18n.getMessage('assistantDeletedSuccess'));
    } catch (error) {
      console.error('[Quick Ask AI] Error deleting assistant:', error);
      showToast(i18n.getMessage('assistantDeletedError'), 'error');
    }
  }

  // 更新AI列表操作处理
  document.getElementById('aiList').addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    const aiItem = e.target.closest('.ai-item');
    const id = aiItem.dataset.id;
    const data = await loadAssistantsData();

    switch (action) {
      case 'toggle':
        // 切换启用状态
        data.assistants[id].enabled = !data.assistants[id].enabled;
        await saveAssistantsData(data);
        await updateContextMenus();
        renderAIList(data.assistants);
        break;
        
      case 'edit':
        showEditDialog(id);
        break;
        
      case 'delete':
        showDeleteDialog(id, data.assistants[id].name);
        break;
    }
  });

  // 编辑表单提交
  document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleEditFormSubmit(e);
  });

  // 编辑取消
  document.getElementById('editCancel').addEventListener('click', () => {
    hideEditDialog();
  });

  // 删除确认对话框
  document.getElementById('deleteConfirm').addEventListener('click', handleDelete);
  document.getElementById('deleteCancel').addEventListener('click', hideDeleteDialog);

  // 添加实时验证
  setupFormValidation();

  // 检测按钮点击事件
  document.querySelectorAll('.detect-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const type = e.target.dataset.detect;
      const assistant = await getAssistantConfig(currentEditId);
      
      try {
        e.target.classList.add('detecting');
        e.target.textContent = '🔄 Detecting...';
        
        // 在新标签页中打开AI助手页面
        const tab = await chrome.tabs.create({ url: assistant.url, active: true });
        
        // 等待页面加载完成
        await new Promise(resolve => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          });
        });
        
        // 再等待一小段时间确保 content script 已加载
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 发送消息给content script开始检测
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'detectSelector',
          type: type
        });
        
        if (response.selector) {
          document.getElementById(`edit${type.charAt(0).toUpperCase() + type.slice(1)}Selector`).value = response.selector;
          showToast(i18n.getMessage('selectorDetectedSuccess'));
        } else {
          showToast(i18n.getMessage('selectorDetectedError'), 'error');
        }
      } catch (error) {
        console.error('[Quick Ask AI] Error detecting selector:', error);
        showToast(i18n.getMessage('selectorDetectedError'), 'error');
      } finally {
        e.target.classList.remove('detecting');
        e.target.textContent = '🔍 Detect';
      }
    });
  });

  // 添加询问模式按钮
  document.getElementById('addFeatureBtn').addEventListener('click', () => {
    showFeatureDialog();
  });

  // 询问模式列表的操作
  document.getElementById('featuresList').addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    e.preventDefault();
    e.stopPropagation();
  
    const featureItem = e.target.closest('.feature-item');
    const featureId = featureItem.dataset.id;
    const data = await loadAssistantsData();
    const assistant = data.assistants[currentEditId];
  
    switch (action) {
      case 'editFeature':
        DialogManager.hideDialog('editDialog');
        showFeatureDialog(featureId, assistant.features[featureId]);
        break;
      case 'deleteFeature':
        if (Object.keys(assistant.features).length <= 1) {
          showToast(i18n.getMessage('cannotDeleteLastAskMode'), 'error');
          return;
        }
        if (assistant.currentFeature === featureId) {
          showToast(i18n.getMessage('cannotDeleteCurrentAskMode'), 'error');
          return;
        }
        showDeleteFeatureDialog(featureId, assistant.features[featureId].name);
        break;
    }
  });

  // 询问模式表单提交
  document.getElementById('featureForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFeatureFormSubmit();
  });

  // 询问模式取消按钮
  document.getElementById('featureCancel').addEventListener('click', () => {
    hideFeatureDialog();
  });

  // 处理删除询问模式
  document.getElementById('deleteFeatureConfirm').addEventListener('click', async () => {
    const data = await loadAssistantsData();
    const assistant = data.assistants[currentEditId];
    
    // 从对象中删除该模式
    delete assistant.features[deleteFeatureId];
    
    await saveAssistantsData(data);
    await renderFeaturesList();
    hideDeleteFeatureDialog();
    showToast(i18n.getMessage('askModeDeletedSuccess'));
  });

  document.getElementById('deleteFeatureCancel').addEventListener('click', () => {
    hideDeleteFeatureDialog();
  });

  // 添加功能切换事件监听
  document.getElementById('editCapabilitiesList').addEventListener('click', e => {
    const toggle = e.target.closest('.capability-toggle');
    if (!toggle) return;
    
    e.preventDefault();  // 防止表单提交
    e.stopPropagation(); // 防止事件冒泡
    
    toggle.classList.toggle('active');
  });
}

// 初始化拖拽排序
function initializeDragAndDrop() {
  const aiList = document.getElementById('aiList');
  
  let draggedItem = null;
  
  aiList.addEventListener('dragstart', e => {
    draggedItem = e.target;
    e.target.classList.add('dragging');
  });
  
  aiList.addEventListener('dragend', async e => {
    e.target.classList.remove('dragging');
    
    // 获取新的排序
    const items = [...aiList.children];
    const data = await loadAssistantsData();
    
    // 更新每个助手的顺序
    items.forEach((item, index) => {
      const id = item.dataset.id;
      data.assistants[id].order = index;
    });
    
    // 保存新顺序
    await saveAssistantsData(data);
    
    // 更新右键菜单
    await updateContextMenus();
  });

  // 添加 dragover 事件处理
  aiList.addEventListener('dragover', e => {
    e.preventDefault();
    const draggable = aiList.querySelector('.dragging');
    if (!draggable) return;
  
    const afterElement = getAIListDragAfterElement(aiList, e.clientY);
    if (afterElement) {
      aiList.insertBefore(draggable, afterElement);
    } else {
      aiList.appendChild(draggable);
    }
  });
}

// 获取拖拽后的位置
function getAIListDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.ai-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 更新右键菜单
async function updateContextMenus() {
  try {
    // 通知 background 更新右键菜单
    await chrome.runtime.sendMessage({ action: 'createContextMenus' });
  } catch (error) {
    console.warn('Failed to update context menus:', error);
  }
}

// 更新显示/隐藏对话框的函数
function showResetDialog() {
  DialogManager.showDialog('resetDialog');
}

function hideResetDialog() {
  DialogManager.hideAllDialogs();
}

// 获取AI助手配置
async function getAssistantConfig(id) {
  const data = await loadAssistantsData();
  return data.assistants[id];
}

// 显示编辑对话框
async function showEditDialog(id) {
  currentEditId = id;
  const data = await loadAssistantsData();
  const assistant = data.assistants[id];
  
  document.getElementById('editName').value = i18n.getMessage(id);
  document.getElementById('editUrl').value = assistant.url;
  document.getElementById('editShortcut').value = assistant.shortcut?.description || '';
  document.getElementById('editTabBehavior').value = assistant.tabBehavior || 'new';
  currentKey = assistant.shortcut?.key || '';
  currentModifiers = assistant.shortcut?.modifiers || [];
  
  // 根据是否有 capabilities 来显示或隐藏相关部分
  const capabilitiesSection = document.getElementById('capabilitiesSection');
  if (assistant.capabilities && Object.keys(assistant.capabilities).length > 0) {
    capabilitiesSection.style.display = 'block';
    // 渲染功能设置列表
    const capabilitiesList = document.getElementById('editCapabilitiesList');
    capabilitiesList.innerHTML = '';
    
    Object.entries(assistant.capabilities).forEach(([capId, capability]) => {
      const button = document.createElement('button');
      button.className = `capability-toggle ${capability.enabled ? 'active' : ''}`;
      button.dataset.capability = capId;
      button.textContent = capability.name;
      capabilitiesList.appendChild(button);
    });
  } else {
    capabilitiesSection.style.display = 'none';
  }
  
  // 渲染询问模式列表
  await renderFeaturesList();
  
  DialogManager.showDialog('editDialog');
}

function hideEditDialog() {
  DialogManager.hideDialog('editDialog');
  currentEditId = null;
}

function showDonateDialog() {
  DialogManager.showDialog('donateDialog');
}

function hideDonateDialog() {
  DialogManager.hideDialog('donateDialog');
}

// 添加表单验证函数
function validateForm() {
  const name = document.getElementById('editName').value.trim();
  const url = document.getElementById('editUrl').value.trim();
  const textAreaSelector = document.getElementById('editTextAreaSelector').value.trim();
  const submitSelector = document.getElementById('editSubmitSelector').value.trim();

  // 检查必填项
  if (!name || !url || !textAreaSelector || !submitSelector) {
    showToast(i18n.getMessage('allFieldsRequired'), 'error');
    return false;
  }

  // 验证URL
  try {
    new URL(url);
  } catch (e) {
    showToast(i18n.getMessage('pleaseEnterValidURL'), 'error');
    return false;
  }

  return true;
}

// 处理编辑表单提交
async function handleEditFormSubmit(e) {
  e.preventDefault();
  
  // 显示保存中状态
  const saveButton = document.getElementById('editSave');
  const originalText = saveButton.textContent;
  saveButton.textContent = 'Saving...';
  saveButton.disabled = true;
  
  try {
    let data = {
      assistants: (await loadAssistantsData()).assistants
    };
    
    const assistant = data.assistants[currentEditId];
    if (!assistant) {
      throw new Error(`Assistant not found: ${currentEditId}`);
    }
    
    // 检查 URL 可访问性
    const url = document.getElementById('editUrl').value.trim();
    
    assistant.url = url;
    assistant.tabBehavior = document.getElementById('editTabBehavior').value;
    
    // 更新快捷键设置
    if (currentKey) {
      const newShortcut = {
        enabled: true,
        key: currentKey,
        modifiers: currentModifiers,
        description: document.getElementById('editShortcut').value
      };
      
      const { hasConflict, conflictWith } = await checkShortcutConflict(newShortcut, currentEditId);
      if (hasConflict) {
        showToast(i18n.getMessage('shortcutConflictsWith', conflictWith), 'error');
        return;
      }
      
      assistant.shortcut = newShortcut;
    } else {
      assistant.shortcut = null;
    }
    
    // 更新功能设置
    if (assistant.capabilities) {
      const capabilityToggles = document.querySelectorAll('#editCapabilitiesList .capability-toggle');
      
      capabilityToggles.forEach(toggle => {
        const capId = toggle.dataset.capability;
        assistant.capabilities[capId].enabled = toggle.classList.contains('active');
      });
    }
    
    await saveAssistantsData(data);
    await updateContextMenus();
    renderAIList(data.assistants);
    
    DialogManager.hideDialog('editDialog');
    showToast(i18n.getMessage('settingsSavedSuccess'));
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    // 恢复按钮状态
    saveButton.textContent = originalText;
    saveButton.disabled = false;
  }
}

// 打开新标签页
function openNewTab(url) {
  chrome.tabs.create({ url });
}

// 显示提示信息
function showToast(message, type = 'success') {
  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 动画显示
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // 3秒后移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// 添加实时验证
function setupFormValidation() {
  const inputs = ['editName', 'editUrl', 'editTextAreaSelector', 'editSubmitSelector'];
  
  inputs.forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      validateInput(input);
    });
  });
}

// 验证单个输入
function validateInput(input) {
  const value = input.value.trim();
  let isValid = true;
  let errorMessage = '';

  // 清除现有错误提示
  removeInputError(input);

  // 验证必填
  if (!value) {
    isValid = false;
    errorMessage = 'This field is required';
  }

  // URL特殊验证
  if (input.id === 'editUrl' && value) {
    try {
      const url = new URL(value);
      // 只验证是否是 HTTPS URL
      if (url.protocol !== 'https:') {
        isValid = false;
        errorMessage = 'URL must use HTTPS protocol';
      }
    } catch (e) {
      isValid = false;
      errorMessage = 'Please enter a valid HTTPS URL';
    }
  }

  // 显示错误
  if (!isValid) {
    showInputError(input, errorMessage);
  }

  return isValid;
}

// 移除输入错误
function removeInputError(input) {
  input.classList.remove('error');
  
  // 移除错误消息
  const errorDiv = input.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains('error-message')) {
    errorDiv.remove();
  }
}

// 显示输入错误
function showInputError(input, message) {
  input.classList.add('error');
  
  // 创建或更新错误消息
  let errorDiv = input.nextElementSibling;
  if (!errorDiv || !errorDiv.classList.contains('error-message')) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
  }
  errorDiv.textContent = message;
}

// 当前编辑的询问模式ID
let currentFeatureId = null;

// 显示询问模式对话框
async function showFeatureDialog(id = null, feature = null) {
  currentFeatureId = id;
  const form = document.getElementById('featureForm');
  
  const data = await loadAssistantsData();
  const assistant = data.assistants[currentEditId];
  const features = assistant.features;
  
  if (feature) {
    // 编辑模式
    const template = features[id];
    form.querySelector('#featureName').value = template.name;
    form.querySelector('#featurePrompt').value = template.prompt;
  } else {
    // 新增模式
    form.reset();
  }
  
  DialogManager.showDialog('featureDialog');
}

// 隐藏询问模式对话框
function hideFeatureDialog() {
  DialogManager.hideDialog('featureDialog');
  currentFeatureId = null;
  // 重新显示 AI 助手编辑框并恢复数据
  restoreEditDialog();
}

// 恢复 AI 助手编辑框的数据
async function restoreEditDialog() {
  if (!currentEditId) {
    DialogManager.showDialog('editDialog');
    return;
  }

  const data = await loadAssistantsData();
  const assistant = data.assistants[currentEditId];

  if (!assistant) {
    console.error('[Quick Ask AI] Assistant not found:', currentEditId);
    showToast(i18n.getMessage('errorRestoringAssistantData'), 'error');
    return;
  }

  // 恢复表单数据
  document.getElementById('editName').value = i18n.getMessage(currentEditId);
  document.getElementById('editUrl').value = assistant.url;
  document.getElementById('editShortcut').value = assistant.shortcut?.description || '';
  document.getElementById('editTabBehavior').value = assistant.tabBehavior || 'new';
  currentKey = assistant.shortcut?.key || '';
  currentModifiers = assistant.shortcut?.modifiers || [];

  // 显示对话框
  DialogManager.showDialog('editDialog');
}

// 处理询问模式表单提交
async function handleFeatureFormSubmit() {
  try {
    const form = document.getElementById('featureForm');
    const name = form.querySelector('#featureName').value.trim();
    const prompt = form.querySelector('#featurePrompt').value.trim();
  
    // 验证
    if (!name || !prompt) {
      showToast(i18n.getMessage('allFieldsRequired'), 'error');
      return;
    }
    if (!prompt.includes('${text}')) {
      showToast(i18n.getMessage('promptMustIncludeText'), 'error');
      return;
    }
  
    const data = await loadAssistantsData();
    const assistant = data.assistants[currentEditId];
  
    // 如果是新增模式，生成唯一的 ID
    let id = currentFeatureId;
    if (!id) {
      id = 'mode_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
  
    // 更新或添加询问模式
    assistant.features[id] = {
      name,
      prompt,
      order: Object.keys(assistant.features).length
    };
  
    await saveAssistantsData(data);
    await renderFeaturesList();
    hideFeatureDialog();
    showToast(i18n.getMessage('askModeUpdatedSuccess'));
  } catch (error) {
    console.error('[Quick Ask AI] Error saving ask mode:', error);
    showToast(i18n.getMessage('askModeSaveError'), 'error');
  }
}

// 渲染询问模式列表
async function renderFeaturesList() {
  const featuresList = document.getElementById('featuresList');
  featuresList.innerHTML = '';

  const data = await loadAssistantsData();
  const assistant = data.assistants[currentEditId];
  const features = assistant.features;

  // 按 order 排序
  const sortedFeatures = Object.entries(features)
    .sort(([, a], [, b]) => a.order - b.order);

  sortedFeatures.forEach(([id, feature]) => {
    const featureItem = document.createElement('div');
    featureItem.className = 'feature-item';
    featureItem.dataset.id = id;
    featureItem.draggable = true;

    const dragHandle = document.createElement('div');
    dragHandle.className = 'feature-drag';
    dragHandle.textContent = '↕️';

    const radioContainer = document.createElement('div');
    radioContainer.className = 'feature-radio';
    radioContainer.innerHTML = `
      <input type="radio" 
        name="currentFeature" 
        value="${id}" 
        ${currentEditId && assistant.currentFeature === id ? 'checked' : ''}>
    `;

    // 添加单选框 change 事件监听
    const radio = radioContainer.querySelector('input[type="radio"]');
    radio.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const data = await loadAssistantsData();
        const assistant = data.assistants[currentEditId];
        assistant.currentFeature = id;
        await saveAssistantsData(data);
      }
    });

    const contentDiv = document.createElement('div');
    contentDiv.className = 'feature-content';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'feature-name';
    nameDiv.textContent = feature.name;

    const promptDiv = document.createElement('div');
    promptDiv.className = 'feature-prompt';
    promptDiv.textContent = feature.prompt;

    contentDiv.appendChild(nameDiv);
    contentDiv.appendChild(promptDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'feature-actions';
    actionsDiv.innerHTML = `
      <button class="action-btn" data-action="editFeature" title="Edit">⚙️</button>
      <button class="action-btn" data-action="deleteFeature" title="Delete">🗑️</button>
    `;

    featureItem.appendChild(dragHandle);
    featureItem.appendChild(radioContainer);
    featureItem.appendChild(contentDiv);
    featureItem.appendChild(actionsDiv);
    featuresList.appendChild(featureItem);
  });

  // 初始化拖拽排序
  initializeFeaturesDragAndDrop();
}

// 初始化询问模式的拖拽排序
function initializeFeaturesDragAndDrop() {
  const featuresList = document.getElementById('featuresList');
  let lastY = 0;  // 记录上次的Y坐标
  
  featuresList.addEventListener('dragstart', e => {
    if (e.target.classList.contains('feature-item')) {
      e.target.classList.add('dragging');
      lastY = e.clientY;  // 记录开始拖动时的位置
    }
  });
  
  featuresList.addEventListener('dragover', e => {
    e.preventDefault();
    const draggable = featuresList.querySelector('.dragging');
    if (!draggable) return;
    
    // 计算移动距离
    const moveDistance = Math.abs(e.clientY - lastY);
    // 只有移动距离超过阈值才更新位置
    if (moveDistance > 10) {
      const afterElement = getFeaturesListDragAfterElement(featuresList, e.clientY);
      if (afterElement) {
        featuresList.insertBefore(draggable, afterElement);
      } else {
        featuresList.appendChild(draggable);
      }
      lastY = e.clientY;  // 更新最后位置
    }
  });
  
  featuresList.addEventListener('dragend', async e => {
    if (e.target.classList.contains('feature-item')) {
      e.target.classList.remove('dragging');
      
      // 更新顺序
      const items = [...featuresList.querySelectorAll('.feature-item')];
      const data = await loadAssistantsData();
      const assistant = data.assistants[currentEditId];
      
      // 更新每个特性的顺序
      items.forEach((item, index) => {
        const featureId = item.dataset.id;
        if (assistant.features[featureId]) {
          assistant.features[featureId].order = index;
        }
      });
      
      await saveAssistantsData(data);
    }
  });
}

// 获取拖拽后的位置
function getFeaturesListDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.feature-item:not(.dragging)')];
  
  // 添加最小移动阈值（像素）
  const THRESHOLD = 10;
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    // 只有当移动距离超过阈值时才触发排序
    if (Math.abs(offset) < THRESHOLD) {
      return closest;
    }
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 渲染助手配置
async function renderAssistant(assistant) {
  // ... 现有代码 ...
  
  // 渲染功能设置
  const capabilitiesList = assistantElem.querySelector('.capabilities-list');
  capabilitiesList.innerHTML = '';
  
  if (assistant.capabilities) {
    Object.entries(assistant.capabilities).forEach(([capId, capability]) => {
      const button = document.createElement('button');
      button.className = `capability-toggle ${capability.enabled ? 'active' : ''}`;
      button.dataset.capability = capId;
      button.textContent = capability.name;
      capabilitiesList.appendChild(button);
    });
  }
}

function initEditDialog() {
  const editDialog = document.getElementById('editDialog');
  const editForm = document.getElementById('editForm');
  const editName = document.getElementById('editName');
  const editUrl = document.getElementById('editUrl');
  const editShortcut = document.getElementById('editShortcut');
  const clearShortcut = document.getElementById('clearShortcut');
  
  let currentAssistant = null;
  
  // 快捷键录入处理
  let isRecording = false;
  let currentModifiers = [];
  let currentKey = '';
  
  editShortcut.addEventListener('focus', () => {
    isRecording = true;
    editShortcut.value = 'Press keys...';
    currentModifiers = [];
    currentKey = '';
  });
  
  editShortcut.addEventListener('blur', () => {
    isRecording = false;
    if (!currentKey) {
      editShortcut.value = currentAssistant?.shortcut?.description || '';
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (!isRecording) return;
    e.preventDefault();
    
    const key = e.key;
    if (SHORTCUT_CONSTANTS.FORBIDDEN_KEYS.includes(key)) return;
    
    if (SHORTCUT_CONSTANTS.MODIFIER_KEYS.includes(key)) {
      if (!currentModifiers.includes(key)) {
        currentModifiers.push(key);
      }
    } else {
      currentKey = key;
    }
    
    if (currentModifiers.length > SHORTCUT_CONSTANTS.MAX_MODIFIERS) {
      currentModifiers = currentModifiers.slice(-SHORTCUT_CONSTANTS.MAX_MODIFIERS);
    }
    
    const description = [...currentModifiers, currentKey].join(' + ');
    editShortcut.value = description;
    
    if (currentKey) {
      isRecording = false;
      editShortcut.blur();
    }
  });
  
  clearShortcut.addEventListener('click', () => {
    currentModifiers = [];
    currentKey = '';
    editShortcut.value = '';
  });
  
  // 打开编辑对话框
  function openEditDialog(assistant) {
    currentAssistant = assistant;
    editName.value = assistant.name;
    editUrl.value = assistant.url;
    editShortcut.value = assistant.shortcut?.description || '';
    // ... 其他初始化代码
  }
  
  // 在保存快捷键之前检查冲突
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (currentKey) {
      const newShortcut = {
        enabled: true,
        key: currentKey,
        modifiers: currentModifiers,
        description: editShortcut.value
      };
      
      const { hasConflict, conflictWith } = await checkShortcutConflict(newShortcut, currentAssistant.id);
      if (hasConflict) {
        showToast(i18n.getMessage('shortcutConflictsWith', conflictWith), 'error');
        return;
      }
    }
    // ... 保存逻辑
  });
}

// 在 popup.js 中添加快捷键冲突检查
async function checkShortcutConflict(newShortcut, currentAssistantId) {
  const data = await loadAssistantsData();
  const assistants = data.assistants;
  
  for (const [id, assistant] of Object.entries(assistants)) {
    if (id === currentAssistantId) continue;
    if (!assistant.shortcut?.enabled) continue;
    
    const existing = assistant.shortcut;
    if (existing.key === newShortcut.key && 
        arraysEqual(existing.modifiers, newShortcut.modifiers)) {
      return {
        hasConflict: true,
        conflictWith: i18n.getMessage(id)
      };
    }
  }
  return { hasConflict: false };
}

function arraysEqual(a, b) {
  return a.length === b.length && 
         a.every((val, index) => val === b[index]);
}