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
const promptNameInput = document.getElementById('prompt-name-input');
const savePromptButton = document.getElementById('save-prompt-button');
const deletePromptButton = document.getElementById('delete-prompt-button');
const selectPromptButton = document.getElementById('select-prompt-button');
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
const showMetadataToggle = document.getElementById('show-metadata-toggle');
const closeSettingsBtn = document.getElementById('close-settings');
const closeTreeBtn = document.getElementById('close-tree');
const closeSidebarBtn = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const rightPanel = document.getElementById('right-panel');

var currentTopicId = null;
var currentMessageId = null;
var activeChatAbortController = null;
var isGenerating = false;
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
var overwriteConfirm = "Prompt name already exists. Overwrite?";
var inputRequired = "Please enter both name and content.";
var deleteConfirm = "Delete this message?";
var deleteTopicConfirm = "Delete this topic and all its messages?";
var stoppedText = "Stopped";
var historyList = [];
var model = "gpt-3.5-turbo";
var temperature = 0.7;
var contextWindow = 10;
var uploadedFilesContent = "";
var bestAssistant = "You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.";

// iSaid: bridge for voice/other callers → chat
iSaid = (content) => {
    chat([{ role: "user", content: content }]);
};

// System prompt textarea
const systemPromptInput = document.getElementById('system-prompt-input');

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
    else sidebar.classList.toggle('collapsed');
};

if (mobileSettingsBtn) mobileSettingsBtn.onclick = () => {
    // 无论桌面还是移动，⚙️ 只控制 settings-section 的显示
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) settingsSection.classList.toggle('collapsed');
    // 移动端同时确保 right-panel 打开
    if (isMobile()) rightPanel.classList.add('open');
};

if (closeSidebarBtn) closeSidebarBtn.onclick = () => {
    sidebar.classList.remove('open');
};

if (closeSettingsBtn) closeSettingsBtn.onclick = () => {
    rightPanel.classList.remove('open');
};

if (closeTreeBtn) closeTreeBtn.onclick = () => {
    rightPanel.classList.remove('open');
};

// Core Chat
async function chat(message) {
  if (isGenerating) return;
  isGenerating = true;
  conversationDisplay.classList.add('generating');

  const provider = providerSelect.value;
  const def = PROVIDERS[provider] || { needsKey: 'optional' };

  if (def.needsKey === true && !apiKeyInput.value.trim()) {
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
    messagesToSend.unshift({ role: "system", content: bestAssistant });
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

  // Update local display immediately
  const convIndex = Date.now();
  const userDiv = document.createElement('div');
  userDiv.className = 'userdiv';
  userDiv.innerHTML = `<p class="timeStemp">${getTimestamp(new Date())} — Double-click to branch</p>`
      + `<p class="userText">${filterXSS(transcript)} <span class="regen-chat" title="Regenerate">🔄</span></p>`;
  conversationDisplay.appendChild(userDiv);

  const regenBtn = userDiv.querySelector('.regen-chat');
  if (regenBtn) {
    regenBtn.onclick = async (e) => {
        e.stopPropagation();
        if (userMessageId) {
            const messages = await storage.getAllMessagesByTopic(currentTopicId);
            const msg = messages.find(m => m.id === userMessageId);
            if (msg) {
                currentMessageId = msg.parentId || null;
                iSaid(msg.content);
            }
        } else {
            iSaid(transcript);
        }
    };
  }

  const botDiv = document.createElement('div');
  botDiv.className = 'botdiv';
  botDiv.id = `waiting-${convIndex}`;
  botDiv.innerHTML = `<p class="botText">${waiting} <span class="stop-chat" onclick="if(activeChatAbortController) activeChatAbortController.abort()">×</span></p>`;
  conversationDisplay.appendChild(botDiv);

  conversationDisplay.scrollTo(0, conversationDisplay.scrollHeight);

  const baseUrl = (baseUrlInput.value || "https://api.openai.com/v1").trim();
  const apiUrl = baseUrl.endsWith('/') ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";

  if (activeChatAbortController) activeChatAbortController.abort();
  activeChatAbortController = new AbortController();

  try {
    const headers = { "Content-Type": "application/json" };
    const apiKey = apiKeyInput.value.trim();
    if (apiKey && def.needsKey !== false) {
        headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            model: modelInput.value || model,
            messages: [...messagesToSend, { role: "user", content: transcript }],
            temperature: parseFloat(temperatureRange.value)
        }),
        signal: activeChatAbortController.signal
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
        const answer = data.choices[0].message.content;
        const metaModel = data.model || "";
        const metaUsage = data.usage ? `${data.usage.total_tokens} tokens` : "";
        const metaText = [metaModel, metaUsage].filter(Boolean).join(" | ");

        const waitingDiv = document.getElementById(`waiting-${convIndex}`);
        if (waitingDiv) {
            let html = `<p class="botText">${filterXSS(answer)}</p>`;
            if (showMetadataToggle.checked && metaText) {
                html += `<div class="bot-metadata">${metaText}</div>`;
            }
            waitingDiv.innerHTML = html;
            conversationDisplay.scrollTo(0, conversationDisplay.scrollHeight);
        }

        // Save Bot Message
        if (currentTopicId) {
            currentMessageId = await storage.addMessage({
                topicId: currentTopicId,
                parentId: userMessageId,
                role: "assistant",
                content: answer,
                timestamp: new Date(),
                metadata: metaText
            });
            updateTree();
        }

        if (voiceAnswer.checked) tts(answer);
    } else {
        throw new Error(data.error?.message || "Unknown error");
    }
  } catch (error) {
    if (error.name === 'AbortError') {
        const waitingDiv = document.getElementById(`waiting-${convIndex}`);
        if (waitingDiv) waitingDiv.innerHTML = `<p class="botText" style="color:orange;">${stoppedText}</p>`;
        return;
    }
    console.error(error);
    const waitingDiv = document.getElementById(`waiting-${convIndex}`);
    let msg = error.message;
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        msg = "Network error or CORS restriction. Check your Base URL and provider status.";
    }
    if (waitingDiv) waitingDiv.innerHTML = `<p class="botText" style="color:red;">Error: ${msg}</p>`;
  } finally {
    activeChatAbortController = null;
    isGenerating = false;
    conversationDisplay.classList.remove('generating');
  }
}

async function autoSummarize(messages) {
    const provider = providerSelect.value;
    const def = PROVIDERS[provider] || { needsKey: 'optional' };
    const baseUrl = (baseUrlInput.value || "https://api.openai.com/v1").trim();
    const apiUrl = baseUrl.endsWith('/') ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
    try {
        const headers = { "Content-Type": "application/json" };
        const apiKey = apiKeyInput.value.trim();
        if (apiKey && def.needsKey !== false) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
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
    roots.forEach(root => renderTreeNode(root, treeContainer, 0, null));
}

async function deleteMessageUI(id) {
    if (!confirm(deleteConfirm)) return;
    const messages = await storage.getAllMessagesByTopic(currentTopicId);
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    await storage.deleteMessage(id);

    if (currentMessageId === id) {
        currentMessageId = msg.parentId || null;
    }

    const updatedMessages = await storage.getAllMessagesByTopic(currentTopicId);
    const branch = getLinearBranch(updatedMessages, currentMessageId);
    renderMessages(branch);
    updateTree();
}

async function deleteTopicUI(id) {
    if (!confirm(deleteTopicConfirm)) return;
    await storage.deleteTopic(id);
    if (currentTopicId === id) {
        currentTopicId = null;
        currentMessageId = null;
        conversationDisplay.innerHTML = '';
        updateTree();
    }
    loadTopics();
}

function renderTreeNode(node, container, level = 0, parentRole = null) {
    const isRoot = level === 0;
    const isAssistantFollowingUser = node.role === 'assistant' && parentRole === 'user';

    // Wrapper: provides the vertical rail + horizontal connector via CSS
    const wrapper = document.createElement('div');
    if (isRoot) {
        wrapper.className = 'tree-root-wrapper';
    } else {
        wrapper.className = 'tree-node-wrapper' + (isAssistantFollowingUser ? ' no-indent' : '');
    }

    // Node pill
    const div = document.createElement('div');
    div.className = 'tree-node'
        + (node.id === currentMessageId ? ' active' : '')
        + (selectedContextIds.has(node.id) ? ' selected' : '');

    const hasChildren = node.children && node.children.length > 0;

    // Collapse toggle (only when there are children)
    if (hasChildren) {
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        toggle.textContent = '−';
        toggle.onclick = (e) => {
            e.stopPropagation();
            const kids = wrapper.querySelector('.tree-children');
            const collapsed = kids.classList.toggle('collapsed');
            toggle.textContent = collapsed ? '+' : '−';
        };
        div.appendChild(toggle);
    }

    // Role icon + label
    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = (node.role === 'user' ? '👤 ' : '🤖 ') + node.content;
    // Native tooltips can be unstable if content is too long or contains complex formatting.
    // Use raw content truncated to a safe length for stability.
    //label.title = filterXSS(node.content.slice(0, 1000).replace("<br>",""));
    label.title = node?.content ? node.content.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/g, " ").slice(0, 600) : "";
    div.appendChild(label);

    // Delete button
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'tree-delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteMessageUI(node.id);
    };
    div.appendChild(deleteBtn);

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

    wrapper.appendChild(div);

    // Recursively render children inside a collapsible container
    if (hasChildren) {
        const childContainer = document.createElement('div');
        childContainer.className = 'tree-children';
        node.children.forEach(child => renderTreeNode(child, childContainer, level + 1, node.role));
        wrapper.appendChild(childContainer);
    }

    container.appendChild(wrapper);
}

function renderMessages(messages) {
    conversationDisplay.innerHTML = '';
    messages.forEach(msg => {
        if (msg.role === 'system') return;
        const div = document.createElement('div');
        div.className = msg.role === 'user' ? 'userdiv' : 'botdiv';

        let html = `<p class="timeStemp">${getTimestamp(new Date(msg.timestamp))}${msg.role === 'user' ? ' — Double-click to branch' : ''}</p>`
            + `<p class="${msg.role === 'user' ? 'userText' : 'botText'}">${filterXSS(msg.content)}${msg.role === 'user' ? ' <span class="regen-chat" title="Regenerate">🔄</span>' : ''}</p>`;

        if (msg.role === 'assistant' && msg.metadata && showMetadataToggle.checked) {
            html += `<div class="bot-metadata">${msg.metadata}</div>`;
        }

        div.innerHTML = html;

        if (msg.role === 'user') {
            div.ondblclick = () => editQ(msg.id);
            const regenBtn = div.querySelector('.regen-chat');
            if (regenBtn) {
                regenBtn.onclick = (e) => {
                    e.stopPropagation();
                    currentMessageId = msg.parentId || null;
                    iSaid(msg.content);
                };
            }
        }
        conversationDisplay.appendChild(div);
    });
    conversationDisplay.scrollTo(0, conversationDisplay.scrollHeight);
}

// Edit a past user message: truncate history from that point and re-ask
async function editQ(messageId) {
    const messages = await storage.getAllMessagesByTopic(currentTopicId);
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.role !== 'user') return;

    const changedPrompt = prompt(
        "Edit to create a new branch (original branch is preserved):",
        msg.content
    );
    if (changedPrompt === null || !changedPrompt.trim()) return;
    if (changedPrompt.trim() === msg.content.trim()) {
        alert("Same as original — no new branch created.");
        return;
    }

    // Set currentMessageId to the PARENT of the double-clicked message
    // so the new message branches from the same point
    currentMessageId = msg.parentId || null;

    // Send the new prompt — this will create a new child from the same parent,
    // leaving the original branch fully intact in the tree
    iSaid(changedPrompt.trim());
}

// Topics
if (newTopicButton) newTopicButton.onclick = async () => {
    const title = prompt("Topic Title", "New Conversation");
    if (title) {
        const id = await storage.addTopic({ title, createdAt: new Date() });
        await loadTopics();
        await switchTopic(id);
        if (window.innerWidth <= 768) sidebar.classList.remove('open');
    }
};

async function loadTopics() {
    const topics = await storage.getAllTopics();
    topicList.innerHTML = '';
    topics.forEach(t => {
        const div = document.createElement('div');
        div.className = 'topic-item' + (t.id === currentTopicId ? ' active' : '');

        const titleSpan = document.createElement('span');
        titleSpan.textContent = t.title;
        div.appendChild(titleSpan);

        const delBtn = document.createElement('span');
        delBtn.className = 'topic-delete-btn';
        delBtn.textContent = '×';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTopicUI(t.id);
        };
        div.appendChild(delBtn);

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
    const provider = providerSelect.value;
    const def = PROVIDERS[provider] || { needsKey: 'optional' };

    if (def.needsKey === true && !apiKeyInput.value.trim()) {
        return alert(enterApiKey);
    }
    const baseUrl = (baseUrlInput.value || "https://api.openai.com/v1").trim();
    const apiUrl = baseUrl.endsWith('/') ? baseUrl + "models" : baseUrl + "/models";

    try {
        fetchModelsBtn.textContent = "⏳";
        const headers = {};
        const apiKey = apiKeyInput.value.trim();
        if (apiKey && def.needsKey !== false) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }
        const response = await fetch(apiUrl, { headers });

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
            alert(corsErrorMsg + " (Network error or CORS restriction. Error: " + e.message + ")");
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
    const prompts = await storage.getAllPrompts();
    promptListDiv.innerHTML = '';
    prompts.forEach(p => {
        const btn = document.createElement('button');
        btn.textContent = p.title;
        btn.style.width = "100%";
        btn.style.marginBottom = "5px";
        btn.style.textAlign = "left";
        btn.onclick = async () => {
            promptNameInput.value = p.title;
            systemPromptInput.value = p.content;
            bestAssistant = p.content;
            await storage.setSetting('systemPrompt', bestAssistant);
            promptListDiv.style.display = 'none';
        };
        promptListDiv.appendChild(btn);
    });
}

// Initial Load
window.addEventListener('load', async () => {
    await storage.init();
    await migrateFromCookies();

    // Settings 默认收起，tree-section 占满
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) settingsSection.classList.add('collapsed');

    // Restore system prompt
    const savedSystemPrompt = await storage.getSetting('systemPrompt');
    if (savedSystemPrompt) {
        bestAssistant = savedSystemPrompt;
        if (systemPromptInput) systemPromptInput.value = savedSystemPrompt;
    }

    const savedProvider = await storage.getSetting('provider') || 'openai';
    if (providerSelect) providerSelect.value = savedProvider;

    await loadProviderSettings(savedProvider);

    currentTopicId = await storage.getSetting('currentTopicId');
    if (currentTopicId) switchTopic(currentTopicId);
    else loadTopics();

    loadPrompts();
    setColorMode(await storage.getSetting('theme-select') || 'system');

    const savedShowMetadata = await storage.getSetting('show-metadata-toggle');
    if (savedShowMetadata !== undefined) {
        showMetadataToggle.checked = savedShowMetadata;
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');

    selectLanguage();

    // ── Post-Init Event Listeners ───────────────────────────
    // Attach listeners that use storage after it is initialized.

    if (systemPromptInput) {
        systemPromptInput.addEventListener('change', async () => {
            bestAssistant = systemPromptInput.value;
            await storage.setSetting('systemPrompt', bestAssistant);
        });
    }

    if (providerSelect) {
        providerSelect.addEventListener('change', async () => {
            if (_previousProvider) await saveCurrentProviderSettings(_previousProvider);
            const provider = providerSelect.value;
            await storage.setSetting('provider', provider);
            await loadProviderSettings(provider);
        });
    }

    [apiKeyInput, baseUrlInput, modelInput].forEach(el => {
        if (el) el.addEventListener('change', async () => {
            await saveCurrentProviderSettings();
        });
    });

    if (showMetadataToggle) {
        showMetadataToggle.addEventListener('change', async () => {
            await storage.setSetting('show-metadata-toggle', showMetadataToggle.checked);
            // Refresh current messages to show/hide metadata
            const allMessages = await storage.getAllMessagesByTopic(currentTopicId);
            const branch = getLinearBranch(allMessages, currentMessageId);
            renderMessages(branch);
        });
    }

    [themeSelect, temperatureRange, contextWindowRange].forEach(el => {
        if (el) el.addEventListener('change', async () => {
            await storage.setSetting(el.id, el.value);
            if (el.id === 'theme-select') setColorMode(el.value);
        });
    });

    if (selectPromptButton) {
        selectPromptButton.onclick = () => {
            promptListDiv.style.display = promptListDiv.style.display === 'none' ? 'block' : 'none';
        };
    }

    if (savePromptButton) {
        savePromptButton.onclick = async () => {
            const title = promptNameInput.value.trim();
            const content = systemPromptInput.value.trim();
            if (!title || !content) {
                alert(inputRequired);
                return;
            }

            const prompts = await storage.getAllPrompts();
            const existing = prompts.find(p => p.title === title);

            if (existing) {
                if (!confirm(overwriteConfirm)) return;
                await storage.updatePrompt({ id: existing.id, title, content });
            } else {
                await storage.addPrompt({ title, content });
            }
            loadPrompts();
        };
    }

    if (deletePromptButton) {
        deletePromptButton.onclick = async () => {
            const title = promptNameInput.value.trim();
            const prompts = await storage.getAllPrompts();
            const existing = prompts.find(p => p.title === title);
            if (existing) {
                await storage.deletePrompt(existing.id);
            }
            promptNameInput.value = "";
            systemPromptInput.value = "";
            bestAssistant = "";
            await storage.setSetting('systemPrompt', "");
            loadPrompts();
        };
    }
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
    if (apiKeyInput)  await storage.setSetting(`provider_apikey_${provider}`, apiKeyInput.value.trim());
    if (baseUrlInput) await storage.setSetting(`provider_url_${provider}`, baseUrlInput.value.trim());
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


function setColorMode(mode) {
    let theme = mode;
    if (mode === 'system') theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
    document.documentElement.setAttribute('data-theme', theme);
}

if (enterPromoteButton) {
    // Left click: send message
    enterPromoteButton.onclick = () => {
        if (promptInput.value.trim()) {
            chat([{ role: "user", content: promptInput.value }]);
            promptInput.value = "";
        }
    };
    // Right click: clear topic history (like original)
    enterPromoteButton.addEventListener('contextmenu', async (e) => {
        e.preventDefault();
        if (confirm("Clear conversation history for this topic?")) {
            if (currentTopicId) {
                await storage.clearMessagesByTopic(currentTopicId);
                currentMessageId = null;
                conversationDisplay.innerHTML = '';
                updateTree();
            }
        }
    });
}

// promptInput: Ctrl+Enter to send, ↑ to browse history
var _historyDisplayIndex = -1;
var _tempHistory = "";
if (promptInput) {
    promptInput.addEventListener('keyup', (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            if (promptInput.value.trim()) {
                chat([{ role: "user", content: promptInput.value }]);
                promptInput.value = "";
                _historyDisplayIndex = -1;
            }
        }
        // ↑ at start of input: browse sent messages
        if (e.key === "ArrowUp" && promptInput.selectionStart === 0) {
            e.preventDefault();
            storage.getAllMessagesByTopic(currentTopicId).then(messages => {
                const userMsgs = messages.filter(m => m.role === 'user');
                if (userMsgs.length === 0) return;
                if (_historyDisplayIndex === -1) _tempHistory = promptInput.value;
                _historyDisplayIndex = Math.min(_historyDisplayIndex + 1, userMsgs.length - 1);
                promptInput.value = userMsgs[userMsgs.length - 1 - _historyDisplayIndex].content;
                promptInput.setSelectionRange(0, 0);
            });
        }
        // ↓ to return toward current input
        if (e.key === "ArrowDown" && promptInput.selectionStart === 0 && _historyDisplayIndex >= 0) {
            e.preventDefault();
            _historyDisplayIndex--;
            if (_historyDisplayIndex < 0) {
                promptInput.value = _tempHistory;
            } else {
                storage.getAllMessagesByTopic(currentTopicId).then(messages => {
                    const userMsgs = messages.filter(m => m.role === 'user');
                    promptInput.value = userMsgs[userMsgs.length - 1 - _historyDisplayIndex].content;
                });
            }
        }
    });
}

// Ctrl+A: select all conversation text
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === "a" && document.activeElement !== promptInput) {
        e.preventDefault();
        window.getSelection().selectAllChildren(conversationDisplay);
    }
});

// Right-click voice checkbox: read entire conversation aloud
if (voiceAnswer) voiceAnswer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    tts(conversationDisplay.textContent);
});

// Export/Import
if (exportSettingsBtn) exportSettingsBtn.onclick = async () => {
    const settings = {};
    const keys = await storage.getAllSettingsKeys();
    for(let k of keys) settings[k] = await storage.getSetting(k);
    const prompts = await storage.getAllPrompts();
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
                for (const p of data.prompts) {
                    delete p.id;
                    await storage.addPrompt(p);
                }
            }
            location.reload();
        } catch (err) { alert("Failed to import settings"); }
    };
    reader.readAsText(file);
};


// Clear: 清空当前 topic 的对话显示和消息记录
if (clearButton) {
    clearButton.addEventListener('click', async () => {
        if (!currentTopicId) {
            conversationDisplay.innerHTML = '';
            return;
        }
        if (!confirm('Clear all messages in this topic?')) return;
        await storage.clearMessagesByTopic(currentTopicId);
        currentMessageId = null;
        conversationDisplay.innerHTML = '';
        updateTree();
    });
    // 右键清空全部 topic 历史（原版右键清空 historyList 的对应行为）
    clearButton.addEventListener('contextmenu', async (e) => {
        e.preventDefault();
        if (!confirm('Clear ALL topics and messages? This cannot be undone.')) return;
        await storage.clearMessagesByTopic(); // undefined means clear all
        await storage.clearAllTopics();
        currentTopicId = null;
        currentMessageId = null;
        conversationDisplay.innerHTML = '';
        topicList.innerHTML = '';
        if (treeContainer) treeContainer.innerHTML = '';
    });
}
 
// Save: 把当前对话导出为 txt 文件（同原版）
if (saveButton) {
    saveButton.addEventListener('click', () => {
        const text = conversationDisplay.innerText || conversationDisplay.textContent;
        if (!text.trim()) { alert('Nothing to save.'); return; }
        const link = document.createElement('a');
        const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
        link.href = URL.createObjectURL(file);
        link.download = 'chatBox_' + getTimestamp(new Date()).replace(/[:\[\] ]/g, '_') + '.txt';
        link.click();
        URL.revokeObjectURL(link.href);
    });
}

if (exportHistoryBtn) exportHistoryBtn.onclick = async () => {
    const topics = await storage.getAllTopics();
    const messages = await storage.getAllMessages();
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
                for (const t of data.topics) await storage.putTopic(t);
            }
            if (data.messages) {
                for (const m of data.messages) await storage.putMessage(m);
            }
            location.reload();
        } catch (err) { alert("Failed to import history"); }
    };
    reader.readAsText(file);
};

// ── STT（语音识别）──────────────────────────────────────────
if (startRecognitionButton) {
    // Right-click: show debug info (storage keys)
    startRecognitionButton.addEventListener('contextmenu', async (e) => {
        e.preventDefault();
        const keys = await storage.getAllSettingsKeys();
        alert('Storage keys: ' + keys.join(', '));
    });

    startRecognitionButton.addEventListener('click', function() {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!window.SpeechRecognition) {
            alert('您的浏览器不支持语音识别，请使用 Chrome 或 Edge。');
            return;
        }

        const recognition = new window.SpeechRecognition();
        recognition.lang = languageSelect ? languageSelect.value : navigator.language;

        if (startRecognitionButton.textContent !== startTalk) {
            // 当前是录音中 → 停止
            recognition.stop();
            startRecognitionButton.textContent = startTalk;
        } else {
            // 当前是待机 → 开始录音
            recognition.addEventListener('result', e => {
                const transcript = Array.from(e.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');

                // 识别结果填入输入框并直接发送
                if (transcript.trim()) {
                    chat([{ role: 'user', content: transcript }]);
                }
            });

            recognition.addEventListener('end', () => {
                startRecognitionButton.textContent = startTalk;
            });

            recognition.addEventListener('error', (e) => {
                startRecognitionButton.textContent = startTalk;
                if (e.error === 'not-allowed') {
                    alert('麦克风权限被拒绝，请在浏览器地址栏左侧允许麦克风访问。');
                }
            });

            recognition.start();
            startRecognitionButton.textContent = stopTalk;
        }
    });
}

// ── TTS（语音合成）──────────────────────────────────────────

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
        document.getElementById("systemPromptLabel").innerHTML = data.label17;
        document.getElementById("promptNameLabel").innerHTML = data.label18;
        if (document.getElementById("showMetadataLabel")) document.getElementById("showMetadataLabel").innerHTML = data.label19;
        if (data.text6) corsErrorMsg = data.text6;
        if (data.text7) overwriteConfirm = data.text7;
        if (data.text8) inputRequired = data.text8;
        if (data.text9) deleteConfirm = data.text9;
        if (data.text10) deleteTopicConfirm = data.text10;
        if (data.text11) stoppedText = data.text11;

        newTopicButton.textContent = data.button6;
        exportHistoryBtn.textContent = data.button7;
        importHistoryBtn.textContent = data.button8;
        if (savePromptButton) savePromptButton.textContent = data.button13;
        if (deletePromptButton) deletePromptButton.textContent = data.button14;
        if (selectPromptButton) selectPromptButton.textContent = data.button15;
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
