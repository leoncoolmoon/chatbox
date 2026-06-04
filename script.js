const apiKeyInput = document.getElementById('api-key-input');
const startRecognitionButton = document.getElementById('start-recognition-button');
const enterPromoteButton = document.getElementById('enter-promot-button');
const promptInput = document.getElementById('prompt-input');
const conversationDisplay = document.getElementById('conversation-display');
const voiceAnswer = document.getElementById('voice');
const pitch = document.querySelector("#pitch");
const pitchValue = document.querySelector(".pitch-value");
const rate = document.querySelector("#rate");
const rateValue = document.querySelector(".rate-value");
const clearButton = document.getElementById('clear-conversation-button');
const saveButton = document.getElementById('save-conversation-button');
const languageSelect = document.getElementById('language-select');
const temperatureRange = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperatureValue');
const themeSelect = document.getElementById('theme-select');
const topicList = document.getElementById('topic-list');
const newTopicButton = document.getElementById('new-topic-button');
const treeContainer = document.getElementById('tree-container');
const contextWindowRange = document.getElementById('context-window');
const contextWindowValue = document.getElementById('contextWindowValue');
const providerSelect = document.getElementById('provider-select');
const baseUrlInput = document.getElementById('base-url-input');
const modelInput = document.getElementById('model-input');
const fileUpload = document.getElementById('file-upload');
const fileListDiv = document.getElementById('file-list');
const promptListDiv = document.getElementById('prompt-list');
const addPromptButton = document.getElementById('add-prompt-button');
const exportHistoryBtn = document.getElementById('export-history-button');
const importHistoryBtn = document.getElementById('import-history-button');
const historyImportFile = document.getElementById('history-import-file');
const exportSettingsBtn = document.getElementById('export-settings-button');
const importSettingsBtn = document.getElementById('import-settings-button');
const settingsImportFile = document.getElementById('settings-import-file');
const showKeyBtn = document.getElementById('showKeyBtn');
const fetchModelsBtn = document.getElementById('fetch-models-button');
// model-input is now a <select>, no separate datalist needed
const menuToggle = document.getElementById('menu-toggle');
const mobileSettingsBtn = document.getElementById('mobile-settings-button');
const closeSettingsBtn = document.getElementById('close-settings');
const closeSidebarBtn = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const rightPanel = document.getElementById('settings-section');

var currentTopicId = null;
var currentMessageId = null;
var selectedContextIds = new Set();
var voice = false;
var you = "You";
var bot = "Chatbot";
var corsErrorMsg = "Failed to fetch models. This may be due to CORS restrictions from the provider. Try entering the model name manually.";
var waiting = "waiting...";
var enterApiKey = "Please enter an API key";
var startTalk = "Start Talk";
var noanswer = "I have a mind block, please ask another question.";
var stopTalk = "Stop Talk";
var historyList = [];
var model = "gpt-3.5-turbo";
var temperature = 0.7;
var contextWindow = 10;
var uploadedFilesContent = "";

// Time formatting
function getTimestamp(date) {
  return `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}]`;
}

// XSS and Line Breaks
function filterXSS(data) {
  if (typeof data !== 'string') return data;
  return data.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, "<br>");
}

// UI Toggles
if (showKeyBtn) showKeyBtn.onclick = () => {
    apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
};

const isMobile = () => window.innerWidth <= 768;

if (menuToggle) menuToggle.onclick = () => {
    if (isMobile()) sidebar.classList.toggle('open');
    else sidebar.classList.remove('collapsed');
};

if (mobileSettingsBtn) mobileSettingsBtn.onclick = () => {
    if (isMobile()) rightPanel.classList.add('open');
    else rightPanel.classList.remove('collapsed');
};

if (closeSettingsBtn) closeSettingsBtn.onclick = () => {
    if (isMobile()) rightPanel.classList.remove('open');
    else rightPanel.classList.add('collapsed');
};

if (closeSidebarBtn) closeSidebarBtn.onclick = () => {
    if (isMobile()) sidebar.classList.remove('open');
    else sidebar.classList.add('collapsed');
};

// Core Chat
async function chat(message) {
  if (!apiKeyInput.value) {
    rightPanel.classList.add('open');
    alert(enterApiKey);
    return;
  }

  // Linearize context based on tree or manual selection
  let messagesToSend = [];
  if (selectedContextIds.size > 0) {
    const allMessages = await storage.getAllMessagesByTopic(currentTopicId);
    const selectedMessages = allMessages.filter(m => selectedContextIds.has(m.id));
    selectedMessages.sort((a, b) => a.id - b.id);
    messagesToSend = selectedMessages.map(msg => ({ role: msg.role, content: msg.content }));
  } else {
    // Standard linear branch
    const allMessages = await storage.getAllMessagesByTopic(currentTopicId);
    const branch = getLinearBranch(allMessages, currentMessageId);
    messagesToSend = branch.map(msg => ({ role: msg.role, content: msg.content }));
  }

  // System Prompt
  if (messagesToSend.length === 0 || messagesToSend[0].role !== "system") {
    messagesToSend.unshift({ role: "system", content: "You are a helpful assistant." });
  }

  // Uploaded Files
  if (uploadedFilesContent) {
    messagesToSend.push({ role: "system", content: "The user has uploaded the following files:\n" + uploadedFilesContent });
  }

  // Auto-summarize if too long
  if (messagesToSend.length > contextWindow) {
    const summary = await autoSummarize(messagesToSend);
    if (summary) {
        messagesToSend = [{ role: "system", content: "Summary of previous conversation: " + summary }, ...messagesToSend.slice(-5)];
    }
  }

  const transcript = message[message.length - 1].content;

  // Update local display immediately
  const convIndex = Date.now();
  const userDiv = document.createElement('div');
  userDiv.className = 'userdiv';
  userDiv.innerHTML = `<p class="timeStemp">${getTimestamp(new Date())}</p><p class="userText">${filterXSS(transcript)}</p>`;
  conversationDisplay.appendChild(userDiv);

  const botDiv = document.createElement('div');
  botDiv.className = 'botdiv';
  botDiv.id = `waiting-${convIndex}`;
  botDiv.innerHTML = `<p class="botText">${waiting}</p>`;
  conversationDisplay.appendChild(botDiv);

  conversationDisplay.scrollTo(0, conversationDisplay.scrollHeight);

  // Save User Message
  let userMessageId;
  if (currentTopicId) {
    userMessageId = await storage.addMessage({
        topicId: currentTopicId,
        parentId: currentMessageId,
        role: "user",
        content: transcript,
        timestamp: new Date()
    });
    currentMessageId = userMessageId;
    updateTree();
  }

  const baseUrl = baseUrlInput.value || "https://api.openai.com/v1";
  const apiUrl = baseUrl.endsWith('/') ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";

  try {
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKeyInput.value}`
        },
        body: JSON.stringify({
            model: modelInput.value || model,
            messages: [...messagesToSend, { role: "user", content: transcript }],
            temperature: parseFloat(temperatureRange.value)
        })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
        const answer = data.choices[0].message.content;
        const waitingDiv = document.getElementById(`waiting-${convIndex}`);
        if (waitingDiv) {
            waitingDiv.innerHTML = `<p class="botText">${filterXSS(answer)}</p>`;
            conversationDisplay.scrollTo(0, conversationDisplay.scrollHeight);
        }

        // Save Bot Message
        if (currentTopicId) {
            currentMessageId = await storage.addMessage({
                topicId: currentTopicId,
                parentId: userMessageId,
                role: "assistant",
                content: answer,
                timestamp: new Date()
            });
            updateTree();
        }

        if (voiceAnswer.checked) tts(answer);
    } else {
        throw new Error(data.error?.message || "Unknown error");
    }
  } catch (error) {
    console.error(error);
    const waitingDiv = document.getElementById(`waiting-${convIndex}`);
    if (waitingDiv) waitingDiv.innerHTML = `<p class="botText" style="color:red;">Error: ${error.message}</p>`;
  }
}

async function autoSummarize(messages) {
    const baseUrl = baseUrlInput.value || "https://api.openai.com/v1";
    const apiUrl = baseUrl.endsWith('/') ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKeyInput.value}`
            },
            body: JSON.stringify({
                model: modelInput.value || model,
                messages: [...messages.slice(0, -2), { role: "user", content: "Summarize this conversation very briefly." }],
                temperature: 0.3
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message.content;
    } catch (e) {
        return null;
    }
}

// Tree Logic
function getLinearBranch(allMessages, leafId) {
    if (!leafId) return [];
    const branch = [];
    let current = allMessages.find(m => m.id === leafId);
    while (current) {
        branch.unshift(current);
        current = allMessages.find(m => m.id === current.parentId);
    }
    return branch;
}

async function updateTree() {
    if (!currentTopicId) return;
    const messages = await storage.getAllMessagesByTopic(currentTopicId);
    const nodes = {};
    const roots = [];

    messages.forEach(msg => {
        nodes[msg.id] = { ...msg, children: [] };
    });

    messages.forEach(msg => {
        if (msg.parentId && nodes[msg.parentId]) {
            nodes[msg.parentId].children.push(nodes[msg.id]);
        } else {
            roots.push(nodes[msg.id]);
        }
    });

    treeContainer.innerHTML = '';
    roots.forEach(root => renderTreeNode(root, treeContainer));
}

function renderTreeNode(node, container, level = 0) {
    const div = document.createElement('div');
    div.className = 'tree-node' + (node.id === currentMessageId ? ' active' : '') + (selectedContextIds.has(node.id) ? ' selected' : '');
    div.style.marginLeft = (level * 12) + 'px';
    div.textContent = (node.role === 'user' ? '👤 ' : '🤖 ') + node.content.substring(0, 25);

    div.onclick = async (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (selectedContextIds.has(node.id)) selectedContextIds.delete(node.id);
            else selectedContextIds.add(node.id);
            updateTree();
        } else {
            currentMessageId = node.id;
            const messages = await storage.getAllMessagesByTopic(currentTopicId);
            const branch = getLinearBranch(messages, currentMessageId);
            renderMessages(branch);
            updateTree();
            if (window.innerWidth <= 768) rightPanel.classList.remove('open');
        }
    };

    container.appendChild(div);
    node.children.forEach(child => renderTreeNode(child, container, level + 1));
}

function renderMessages(messages) {
    conversationDisplay.innerHTML = '';
    messages.forEach(msg => {
        if (msg.role === 'system') return;
        const div = document.createElement('div');
        div.className = msg.role === 'user' ? 'userdiv' : 'botdiv';
        div.innerHTML = `<p class="timeStemp">${getTimestamp(new Date(msg.timestamp))}</p>`
            + `<p class="${msg.role === 'user' ? 'userText' : 'botText'}">${filterXSS(msg.content)}</p>`;
        conversationDisplay.appendChild(div);
    });
    conversationDisplay.scrollTo(0, conversationDisplay.scrollHeight);
}

// Topics
if (newTopicButton) newTopicButton.onclick = async () => {
    const title = prompt("Topic Title", "New Conversation");
    if (title) {
        const id = await new Promise(r => {
            const req = storage.db.transaction(['topics'], 'readwrite').objectStore('topics').add({ title, createdAt: new Date() });
            req.onsuccess = () => r(req.result);
        });
        await loadTopics();
        await switchTopic(id);
        if (window.innerWidth <= 768) sidebar.classList.remove('open');
    }
};

async function loadTopics() {
    const topics = await new Promise(r => {
        const req = storage.db.transaction(['topics'], 'readonly').objectStore('topics').getAll();
        req.onsuccess = () => r(req.result);
    });
    topicList.innerHTML = '';
    topics.forEach(t => {
        const div = document.createElement('div');
        div.className = 'topic-item' + (t.id === currentTopicId ? ' active' : '');
        div.textContent = t.title;
        div.onclick = () => switchTopic(t.id);
        topicList.appendChild(div);
    });
}

async function switchTopic(id) {
    currentTopicId = id;
    await storage.setSetting('currentTopicId', id);
    const messages = await storage.getAllMessagesByTopic(id);
    currentMessageId = messages.length > 0 ? messages[messages.length-1].id : null;
    const branch = getLinearBranch(messages, currentMessageId);
    renderMessages(branch);
    await loadTopics();
    updateTree();
}

// Model Fetching
if (fetchModelsBtn) fetchModelsBtn.onclick = async () => {
    if (!apiKeyInput.value) return alert("API Key required");
    const baseUrl = baseUrlInput.value || "https://api.openai.com/v1";
    const apiUrl = baseUrl.endsWith('/') ? baseUrl + "models" : baseUrl + "/models";

    try {
        fetchModelsBtn.textContent = "⏳";
        const response = await fetch(apiUrl, {
            headers: {
                "Authorization": `Bearer ${apiKeyInput.value}`,
                "Content-Type": "application/json"
            }
        });

        // 先检查 HTTP 状态，错误时把服务端返回的错误信息显示出来
        if (!response.ok) {
            let errMsg = `HTTP ${response.status}`;
            try {
                const errData = await response.json();
                errMsg += ': ' + (errData.message || errData.error?.message || JSON.stringify(errData));
            } catch (_) {
                errMsg += ': ' + await response.text().catch(() => '');
            }
            throw new Error(errMsg);
        }

        const data = await response.json();

        // 兼容 OpenAI 格式 (data.data[]) 和部分服务商直接返回数组的格式
        const modelList = data.data || (Array.isArray(data) ? data : null);
        if (modelList && modelList.length > 0) {
            // 存储该服务商获取到的模型列表，下次切换回来还能用
            await storage.setSetting(`provider_models_${providerSelect.value}`, JSON.stringify(modelList));
            populateModelDatalist(modelList);
            // 自动选中第一个
            if (modelInput && modelList[0]) {
                modelInput.value = modelList[0].id || modelList[0];
                await saveCurrentProviderSettings();
            }
            alert(`Fetched ${modelList.length} models`);
        } else {
            alert("No models found in response. Response: " + JSON.stringify(data).slice(0, 200));
        }
    } catch (e) {
        if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            alert(corsErrorMsg);
        } else {
            alert("Failed to fetch models: " + e.message);
        }
    } finally {
        fetchModelsBtn.textContent = "🔄";
    }
};

// File Processing
if (fileUpload) fileUpload.onchange = async () => {
    uploadedFilesContent = "";
    fileListDiv.innerHTML = "";
    for (const file of fileUpload.files) {
        const content = await new Promise(resolve => {
            const reader = new FileReader();
            if (file.type === "application/pdf") {
                reader.onload = async e => {
                    const typedarray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let text = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const tc = await page.getTextContent();
                        text += tc.items.map(s => s.str).join(" ") + "\n";
                    }
                    resolve(text);
                };
                reader.readAsArrayBuffer(file);
            } else {
                reader.onload = e => resolve(e.target.result);
                reader.readAsText(file);
            }
        });
        uploadedFilesContent += `\n--- File: ${file.name} ---\n${content}\n`;
        fileListDiv.innerHTML += `<span>${file.name} </span>`;
    }
};

// Prompts
async function loadPrompts() {
    const prompts = await new Promise(r => {
        storage.db.transaction(['prompts'], 'readonly').objectStore('prompts').getAll().onsuccess = e => r(e.target.result);
    });
    promptListDiv.innerHTML = '';
    prompts.forEach(p => {
        const div = document.createElement('div');
        div.className = 'prompt-item';
        div.innerHTML = `<span title="${p.content}">${p.title}</span>`;
        const btnGroup = document.createElement('div');

        const use = document.createElement('button');
        use.textContent = 'Use';
        use.onclick = () => {
            promptInput.value = p.content;
            if (window.innerWidth <= 768) rightPanel.classList.remove('open');
        };

        const del = document.createElement('button');
        del.textContent = '×';
        del.className = 'del-btn';
        del.onclick = async () => {
            await new Promise(r => storage.db.transaction(['prompts'], 'readwrite').objectStore('prompts').delete(p.id).onsuccess = () => r());
            loadPrompts();
        };

        btnGroup.appendChild(use);
        btnGroup.appendChild(del);
        div.appendChild(btnGroup);
        promptListDiv.appendChild(div);
    });
}

if (addPromptButton) addPromptButton.onclick = async () => {
    const title = prompt("Prompt Title");
    const content = prompt("Prompt Content");
    if (title && content) {
        await new Promise(r => storage.db.transaction(['prompts'], 'readwrite').objectStore('prompts').add({ title, content }).onsuccess = () => r());
        loadPrompts();
    }
};

// Initial Load
window.addEventListener('load', async () => {
    await storage.init();
    await migrateFromCookies();

    const savedProvider = await storage.getSetting('provider') || 'openai';
    if (providerSelect) providerSelect.value = savedProvider;

    await loadProviderSettings(savedProvider);

    currentTopicId = await storage.getSetting('currentTopicId');
    if (currentTopicId) switchTopic(currentTopicId);
    else loadTopics();

    loadPrompts();
    setColorMode(await storage.getSetting('theme-select') || 'system');

    // Register Service Worker
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');

    selectLanguage();
});

// Per-provider config（与 LLMtester 保持一致）
// needsKey: true=必填  'optional'=可选显示  false=隐藏
const PROVIDERS = {
    'openai':    { url: 'https://api.openai.com/v1',                     needsKey: true,       models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],                                                    hint: '在线服务 · <a href="https://platform.openai.com/api-keys" target="_blank">获取 API Key</a>' },
    'nvidia':    { url: 'https://integrate.api.nvidia.com/v1',            needsKey: true,       models: ['meta/llama3-70b-instruct', 'nvidia/llama-3.1-405b-instruct', 'mistralai/mixtral-8x7b-instruct-v0.1'], hint: '在线服务 · <a href="https://build.nvidia.com" target="_blank">获取 API Key</a> · 前缀 nvapi-' },
    'anthropic': { url: 'https://api.anthropic.com/v1',                   needsKey: 'optional', models: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],          hint: '直接调用有 CORS 限制，建议通过 OpenAI 兼容代理访问' },
    'google':    { url: 'https://generativelanguage.googleapis.com/v1beta',needsKey: 'optional', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],                                    hint: '直接调用有 CORS 限制，建议通过 OpenAI 兼容代理访问' },
    'groq':      { url: 'https://api.groq.com/openai/v1',                 needsKey: true,       models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'],                                  hint: '在线服务 · <a href="https://console.groq.com/keys" target="_blank">获取 API Key</a>' },
    'mistral':   { url: 'https://api.mistral.ai/v1',                      needsKey: true,       models: ['mistral-large-latest', 'mistral-medium-latest', 'open-mixtral-8x22b'],                      hint: '在线服务 · <a href="https://console.mistral.ai/api-keys" target="_blank">获取 API Key</a>' },
    'lmstudio':  { url: 'http://localhost:1234/v1',                       needsKey: false,      models: ['luna-ai-llama2', 'mistral-7b-instruct'],                                                    hint: '本地服务 · 默认端口 1234' },
    'ollama':    { url: 'http://localhost:11434/v1',                      needsKey: false,      models: ['llama3', 'mistral', 'phi3'],                                                                hint: '本地服务 · 默认端口 11434' },
    'litellm':   { url: 'http://localhost:4000/v1',                       needsKey: 'optional', models: ['gpt-3.5-turbo', 'claude-3-haiku'],                                                          hint: '本地/自托管 · 默认端口 4000 · 统一代理 100+ 模型' },
    'custom':    { url: '',                                                needsKey: 'optional', models: [],                                                                                           hint: '自定义 OpenAI 兼容端点 · API Key 可留空' },
};

// 根据 needsKey 更新 API Key 输入框的显示状态
function applyProviderUI(provider) {
    const def = PROVIDERS[provider];
    if (!def) return;
    const keyLabel = document.getElementById('apiKeyInputLabel');
    const keyWrap = apiKeyInput ? apiKeyInput.closest('.input-with-toggle') : null;
    const keyLabelEl = keyLabel;

    // 显示 hint（如果有对应元素）
    const hintEl = document.getElementById('provider-hint');
    if (hintEl) hintEl.innerHTML = def.hint || '';

    if (def.needsKey === true) {
        if (keyLabelEl) keyLabelEl.style.display = '';
        if (keyWrap) keyWrap.style.display = '';
        if (keyLabelEl) keyLabelEl.textContent = 'API Key';
    } else if (def.needsKey === 'optional') {
        if (keyLabelEl) keyLabelEl.style.display = '';
        if (keyWrap) keyWrap.style.display = '';
        if (keyLabelEl) keyLabelEl.textContent = 'API Key（可选）';
    } else {
        if (keyLabelEl) keyLabelEl.style.display = 'none';
        if (keyWrap) keyWrap.style.display = 'none';
    }
}

// 记录上一个服务商，用于切换时正确保存
let _previousProvider = null;

// 保存指定服务商的设置（不传则用当前选中值）
async function saveCurrentProviderSettings(providerOverride) {
    const provider = providerOverride || (providerSelect ? providerSelect.value : null);
    if (!provider) return;
    if (apiKeyInput)  await storage.setSetting(`provider_apikey_${provider}`, apiKeyInput.value);
    if (baseUrlInput) await storage.setSetting(`provider_url_${provider}`, baseUrlInput.value);
    if (modelInput)   await storage.setSetting(`provider_model_${provider}`, modelInput.value);
}

// 加载某服务商的已保存设置（首次使用则填默认值）
async function loadProviderSettings(provider) {
    const def = PROVIDERS[provider] || { url: '', models: [], needsKey: 'optional', hint: '' };

    const savedKey   = await storage.getSetting(`provider_apikey_${provider}`) || '';
    const savedUrl   = await storage.getSetting(`provider_url_${provider}`);
    const savedModel = await storage.getSetting(`provider_model_${provider}`) || def.models[0] || '';

    if (apiKeyInput)  apiKeyInput.value  = savedKey;
    // 如果从未存过该服务商的 URL，始终用默认值
    if (baseUrlInput) baseUrlInput.value = (savedUrl !== null && savedUrl !== undefined && savedUrl !== '') ? savedUrl : def.url;

    // 填充模型列表：优先用上次获取到的完整列表，没有则用默认
    const savedModelsJson = await storage.getSetting(`provider_models_${provider}`);
    const modelList = savedModelsJson ? JSON.parse(savedModelsJson) : def.models;
    populateModelDatalist(modelList);
    if (modelInput) modelInput.value = savedModel;

    // 更新 API Key 显示状态
    applyProviderUI(provider);

    _previousProvider = provider;
}

function populateModelDatalist(modelList) {
    if (!modelInput) return;
    const current = modelInput.value;
    modelInput.innerHTML = '';
    modelList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = typeof m === 'string' ? m : (m.id || '');
        opt.textContent = opt.value;
        modelInput.appendChild(opt);
    });
    // 恢复之前选中的值（如果还在列表里）
    if (current && [...modelInput.options].some(o => o.value === current)) {
        modelInput.value = current;
    }
}

// 切换服务商：先把当前设置存到【旧服务商】，再加载新的
if (providerSelect) providerSelect.addEventListener('change', async () => {
    // change 触发时 value 已是新值，用 _previousProvider 保存旧的
    if (_previousProvider) await saveCurrentProviderSettings(_previousProvider);
    const provider = providerSelect.value;
    await storage.setSetting('provider', provider);
    await loadProviderSettings(provider);
});

// URL / Key / Model 变动时实时保存到当前服务商
[apiKeyInput, baseUrlInput, modelInput].forEach(el => {
    if (el) el.addEventListener('change', async () => {
        await saveCurrentProviderSettings();
    });
});

[themeSelect, temperatureRange, contextWindowRange].forEach(el => {
    if (el) el.addEventListener('change', async () => {
        await storage.setSetting(el.id, el.value);
        if (el.id === 'theme-select') setColorMode(el.value);
    });
});

function setColorMode(mode) {
    let theme = mode;
    if (mode === 'system') theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
    document.documentElement.setAttribute('data-theme', theme);
}

if (enterPromoteButton) enterPromoteButton.onclick = () => {
    if (promptInput.value.trim()) {
        chat([{ role: "user", content: promptInput.value }]);
        promptInput.value = "";
    }
};

// Export/Import
if (exportSettingsBtn) exportSettingsBtn.onclick = async () => {
    const settings = {};
    const keys = await new Promise(r => storage.db.transaction(['settings']).objectStore('settings').getAllKeys().onsuccess = e => r(e.target.result));
    for(let k of keys) settings[k] = await storage.getSetting(k);
    const prompts = await new Promise(r => storage.db.transaction(['prompts']).objectStore('prompts').getAll().onsuccess = e => r(e.target.result));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({settings, prompts})], {type:'application/json'}));
    a.download = 'settings.json';
    a.click();
};

if (importSettingsBtn) importSettingsBtn.onclick = () => settingsImportFile.click();
if (settingsImportFile) settingsImportFile.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.settings) {
                for (let k in data.settings) await storage.setSetting(k, data.settings[k]);
            }
            if (data.prompts) {
                const tx = storage.db.transaction(['prompts'], 'readwrite');
                const store = tx.objectStore('prompts');
                data.prompts.forEach(p => {
                    delete p.id;
                    store.add(p);
                });
            }
            location.reload();
        } catch (err) { alert("Failed to import settings"); }
    };
    reader.readAsText(file);
};

if (exportHistoryBtn) exportHistoryBtn.onclick = async () => {
    const topics = await new Promise(r => storage.db.transaction(['topics']).objectStore('topics').getAll().onsuccess = e => r(e.target.result));
    const messages = await new Promise(r => storage.db.transaction(['messages']).objectStore('messages').getAll().onsuccess = e => r(e.target.result));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({topics, messages})], {type:'application/json'}));
    a.download = 'chat_history.json';
    a.click();
};

if (importHistoryBtn) importHistoryBtn.onclick = () => historyImportFile.click();
if (historyImportFile) historyImportFile.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.topics) {
                const tx = storage.db.transaction(['topics'], 'readwrite');
                const store = tx.objectStore('topics');
                data.topics.forEach(t => store.put(t));
            }
            if (data.messages) {
                const tx = storage.db.transaction(['messages'], 'readwrite');
                const store = tx.objectStore('messages');
                data.messages.forEach(m => store.put(m));
            }
            location.reload();
        } catch (err) { alert("Failed to import history"); }
    };
    reader.readAsText(file);
};

// TTS 语音列表（异步加载）
let _ttsVoices = [];
function _loadVoices() {
    _ttsVoices = window.speechSynthesis.getVoices();
}
window.speechSynthesis.onvoiceschanged = _loadVoices;
_loadVoices();

function tts(text) {
    const synth = window.speechSynthesis;
    synth.cancel(); // 停止上一句
    const utter = new SpeechSynthesisUtterance(text);

    // 语速和语调：读取 slider 当前值，fallback 到默认
    utter.rate  = rate  ? parseFloat(rate.value)  : 1.0;
    utter.pitch = pitch ? parseFloat(pitch.value) : 1.0;

    // 语言：优先用用户在 UI 里选的，fallback 到浏览器语言
    const lang = (languageSelect && languageSelect.value) || navigator.language || 'en';
    utter.lang = lang;

    // 从已加载的 voices 里找第一个匹配语言的声音
    if (_ttsVoices.length > 0) {
        // 先精确匹配（如 zh-CN），再匹配语言前缀（如 zh）
        const exact  = _ttsVoices.find(v => v.lang === lang);
        const prefix = _ttsVoices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (exact || prefix) utter.voice = exact || prefix;
    }

    synth.speak(utter);
}

// rate / pitch slider 实时更新显示值
if (rate) rate.addEventListener('input', () => {
    if (rateValue) rateValue.textContent = parseFloat(rate.value).toFixed(1);
});
if (pitch) pitch.addEventListener('input', () => {
    if (pitchValue) pitchValue.textContent = parseFloat(pitch.value).toFixed(1);
});

function selectLanguage() {
  var lang = navigator.language || navigator.userLanguage;
  if (languageSelect) languageSelect.value = lang;
  loadLanguage(lang);
}

function loadLanguage(lang) {
  var file = lang.startsWith('zh') ? "cn.json" : "en.json";
  try {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        document.title = data.title;
        document.getElementById("titleHead").innerHTML = data.title;

        startRecognitionButton.textContent = data.button1;
        startTalk = data.button1;
        stopTalk = data.button0;

        promptInput.setAttribute("placeholder", data.label1);
        document.getElementById("voiceLabel").innerHTML = data.label2;
        apiKeyInput.setAttribute("placeholder", data.label3);
        document.getElementById("apiKeyInputLabel").innerHTML = data.label3;

        if (document.getElementById("speechSettingLabel")) document.getElementById("speechSettingLabel").innerHTML = data.label5;
        if (document.getElementById("rateLabel")) document.getElementById("rateLabel").innerHTML = data.label6 + ": " + rateValue.innerHTML;
        if (document.getElementById("pitchLabel")) document.getElementById("pitchLabel").innerHTML = data.label7 + ": " + pitchValue.innerHTML;
        document.getElementById("languageSelectLabel").innerHTML = data.label8;
        document.getElementById("modelSelectLabel").innerHTML = data.label9;

        document.getElementById("themeSelectLabel").innerHTML = data.label10;
        document.getElementById("contextWindowLabel").innerHTML = data.label11 + ": " + contextWindowValue.innerHTML;
        document.getElementById("providerSelectLabel").innerHTML = data.label12;
        document.getElementById("baseUrlLabel").innerHTML = data.label13;
        document.getElementById("promptLibraryLabel").innerHTML = data.label14;
        document.getElementById("treeTitle").innerHTML = data.label15;
        document.getElementById("topicsTitle").innerHTML = data.label16;
        if (data.text6) corsErrorMsg = data.text6;

        newTopicButton.textContent = data.button6;
        exportHistoryBtn.textContent = data.button7;
        importHistoryBtn.textContent = data.button8;
        addPromptButton.textContent = data.button9;
        exportSettingsBtn.textContent = data.button10;
        importSettingsBtn.textContent = data.button11;
        enterPromoteButton.textContent = data.button12;

        you = data.text1;
        bot = data.text2;
        waiting = data.text3;
        enterApiKey = data.text4;
        noanswer = data.text5;
      }
    }
    xhr.open("GET", file, true);
    xhr.send();
  } catch (e) { console.log(e); }
}
