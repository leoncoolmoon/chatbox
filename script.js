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
const modelOptions = document.getElementById('model-options');
const menuToggle = document.getElementById('menu-toggle');
const mobileSettingsBtn = document.getElementById('mobile-settings-button');
const closeSettingsBtn = document.getElementById('close-settings');
const sidebar = document.getElementById('sidebar');
const rightPanel = document.getElementById('right-panel');

var currentTopicId = null;
var currentMessageId = null;
var selectedContextIds = new Set();
var voice = false;
var you = "You";
var bot = "Chatbot";
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

if (menuToggle) menuToggle.onclick = () => {
    sidebar.classList.toggle('open');
};

if (mobileSettingsBtn) mobileSettingsBtn.onclick = () => {
    rightPanel.classList.add('open');
};

if (closeSettingsBtn) closeSettingsBtn.onclick = () => {
    rightPanel.classList.remove('open');
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
            headers: { "Authorization": `Bearer ${apiKeyInput.value}` }
        });
        const data = await response.json();
        if (data.data) {
            modelOptions.innerHTML = '';
            data.data.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                modelOptions.appendChild(opt);
            });
            alert(`Fetched ${data.data.length} models`);
        }
    } catch (e) {
        alert("Failed to fetch models: " + e.message);
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
        div.style = "display:flex; justify-content:space-between; margin-bottom:5px;";
        div.innerHTML = `<span>${p.title}</span>`;
        const use = document.createElement('button');
        use.textContent = 'Use';
        use.onclick = () => promptInput.value = p.content;
        div.appendChild(use);
        promptListDiv.appendChild(div);
    });
}

// Initial Load
window.addEventListener('load', async () => {
    await storage.init();
    await migrateFromCookies();

    if (apiKeyInput) {
        apiKeyInput.value = await storage.getSetting('api_key') || '';
        if (!apiKeyInput.value && rightPanel) rightPanel.classList.add('open');
    }

    if (providerSelect) providerSelect.value = await storage.getSetting('provider') || 'openai';
    if (baseUrlInput) baseUrlInput.value = await storage.getSetting('baseUrl') || 'https://api.openai.com/v1';
    if (modelInput) {
        modelInput.value = await storage.getSetting('model') || 'gpt-3.5-turbo';
        model = modelInput.value;
    }

    currentTopicId = await storage.getSetting('currentTopicId');
    if (currentTopicId) switchTopic(currentTopicId);
    else loadTopics();

    loadPrompts();
    setColorMode(await storage.getSetting('theme') || 'system');

    // Register Service Worker
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');

    selectLanguage();
});

// Event Listeners for Persistence
[apiKeyInput, baseUrlInput, modelInput, providerSelect, themeSelect, temperatureRange, contextWindowRange].forEach(el => {
    if (el) el.addEventListener('change', async () => {
        const key = el.id.replace(/-([a-z])/g, g => g[1].toUpperCase()).replace('Input','').replace('Select','').replace('Range','');
        await storage.setSetting(el.id === 'api-key-input' ? 'api_key' : el.id, el.value);
        if (el.id === 'theme-select') setColorMode(el.value);

        if (el.id === 'provider-select') {
            const defaults = {
                'openai': 'https://api.openai.com/v1',
                'nvidia': 'https://integrate.api.nvidia.com/v1',
                'anthropic': 'https://api.anthropic.com/v1',
                'google': 'https://generativelanguage.googleapis.com/v1beta',
                'groq': 'https://api.groq.com/openai/v1',
                'mistral': 'https://api.mistral.ai/v1'
            };
            if (defaults[el.value]) {
                baseUrlInput.value = defaults[el.value];
                await storage.setSetting('baseUrl', baseUrlInput.value);
            }
        }
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

function tts(text) {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = parseFloat(rate.value);
    utter.pitch = parseFloat(pitch.value);
    synth.speak(utter);
}

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
