const apiKeyInput = document.getElementById('api-key-input');
const settingButton = document.getElementById('setting-button');
const startRecognitionButton = document.getElementById('start-recognition-button');
const enterPromoteButton = document.getElementById('enter-promot-button');
const promptInput = document.getElementById('prompt-input');
const conversationDisplay = document.getElementById('conversation-display');
const voiceAnswer = document.getElementById('voice');
const pitch = document.querySelector("#pitch");
const pitchValue = document.querySelector(".pitch-value");
const rate = document.querySelector("#rate");
const rateValue = document.querySelector(".rate-value");
const settingDiv = document.getElementById('setting-div');
const clearButton = document.getElementById('clear-conversation-button');
const saveButton = document.getElementById('save-conversation-button');
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
const languageSelect = document.getElementById('language-select');
const temperatureRange = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperatureValue');
const updateButton = document.getElementById('update-button');
const settingDivL = document.getElementById('settingDiv');
const themeSelect = document.getElementById('theme-select');
const topicList = document.getElementById('topic-list');
const newTopicButton = document.getElementById('new-topic-button');
const treeContainer = document.getElementById('tree-container');
const contextWindowRange = document.getElementById('context-window');
const contextWindowValue = document.getElementById('contextWindowValue');

var currentTopicId = null;
var selectedContextIds = new Set();
var currentMessageId = null;
var voice = false;
var you = "You";
var bot = "Chatbot";
var waiting = "waiting...";
var enterApiKey = "Please enter an API key";
var startTalk = "Start Talk";
var noanswer = "I have a mind block, please ask another question.";
var stopTalk = "Stop Talk";
var historyList = [];
var model = "gpt-3.5-turbo-16k";
var temperature = 0.7;
var contextWindow = 10;
var uploadedFilesContent = "";

//get the time stemp from the date
function getTimestamp(date) {
  //return YYYY-MM-DD HH:MM:SS
  return `[${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] `;
}
function show() {
  apiKeyInput.style.visibility = "visible";
}
// blink "off" state
function hideAPIDisp() {
  apiKeyInput.style.visibility = "hidden";
}
function remindAPIKey() {
  conversationDisplay.innerHTML = `<p>${enterApiKey}</p>` + conversationDisplay.innerHTML;
  settingDiv.style.display = "block";
  apiKeyInput.scrollIntoView();
  var blinkDelay = 900;
  var blinkTimes = 3;
  for (var i = blinkDelay; i < blinkDelay * (blinkTimes + 1); i = i + blinkDelay) {
    setTimeout("hide()", i);
    setTimeout("show()", i + blinkDelay / 2);
  }
}

var past = "";
var delayQuestion = "";
var lastAnswer = "";
var bestAssistant = "You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.";
//get the Sting transcript from the message and filter the control part
iSaid = (content) => {
  chat([{ "role": "user", "content": content }]);
  //message = [{ "role": "user", "content": message }];
};
// Get the input value display and save it to a cookie
async function chat(message) {
  //check if the api key is empty
  if (!apiKeyInput.value) {
    remindAPIKey();
    enterPromoteButton.disabled = false;
    promptInput.disabled = false;
    startRecognitionButton.disabled = false;
    return;
  }
  //keep a contextWindow history
  if (historyList.length > contextWindow) {
    await autoSummarize();
    while (historyList.length > contextWindow) {
      historyList.shift();
    }
  }
  // If we have selected context, use that instead of the linear branch
  if (selectedContextIds.size > 0) {
    const allMessages = await storage.getAllMessagesByTopic(currentTopicId);
    const selectedMessages = allMessages.filter(m => selectedContextIds.has(m.id));
    // Sort by timestamp or ID to maintain order
    selectedMessages.sort((a, b) => a.id - b.id);
    historyList = selectedMessages.map(msg => ({ role: msg.role, content: msg.content }));
  }

  //add system message to the conversation
  if (historyList.length == 0 || historyList[0].role != "system") {
    historyList.unshift({ "role": "system", "content": bestAssistant });
  }

  var transcript = message[message.length - 1].content;// for display

  console.log(Array.isArray(historyList));
  historyList.push(message[message.length - 1]);//(transcript);
  enterPromoteButton.disabled = true;
  promptInput.disabled = true;
  startRecognitionButton.disabled = true;
  promptInput.value = "";
  var convIndex = historyList.length - 1;
  //message = [{ "role": "user", "content": transcript }];
  //display a waiting message
  conversationDisplay.innerHTML = `<div id = "conv${convIndex}" ondblclick="editQ(${convIndex})"><p class = "timeStemp" > ${getTimestamp(new Date())}  DoubleClick to change.</p>`
    + `<div class = "userdiv"><br>${you}:<p class = "userText"> ${filterXSS(transcript)} </p></div>`
    + `<div class = "botdiv"><br>${bot}:<p class = "botText"> ${waiting}</p></div></div>`
    + conversationDisplay.innerHTML;

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
  }

  const baseUrl = baseUrlInput.value || "https://api.openai.com/v1";
  const apiUrl = baseUrl.endsWith('/') ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKeyInput.value}`
  };

  let messagesToSend = [...historyList];
  if (uploadedFilesContent) {
    messagesToSend.push({ role: "system", content: "The user has uploaded the following files:\n" + uploadedFilesContent });
  }

  const data = {
    "model": modelInput.value || model,
    "messages": messagesToSend,
    "temperature": parseFloat(temperature)
  };


  //send the request to the api
  fetch(apiUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    // .then(data => console.log(data))
    .then(data => {
      //dealingfullOriginalReturn(data);
      const assistantMessage = data.choices[0].message;
      historyList.push(assistantMessage);
      var answer = assistantMessage.content;

      if (currentTopicId) {
        storage.addMessage({
            topicId: currentTopicId,
            parentId: userMessageId,
            role: "assistant",
            content: answer,
            timestamp: new Date()
        }).then(id => {
            currentMessageId = id;
            updateTree();
        });
      }

      settingDiv.style.display = "none";
      settingButton.style.display = "block";
      //XSS protection

      ttsAnswer(answer);
      answer = filterXSS(answer);
      //replace the waiting message with the answer
      displayAnswer(answer);


    }).catch(error => {
      console.error(error.toString())
      if (error.toString().includes("Cannot read properties of undefined")) {
        apiKeyInput.type = "text";
        remindAPIKey();
        apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
      }
      conversationDisplay.innerHTML = conversationDisplay.innerHTML.replace(waiting, noanswer);
    });
  enterPromoteButton.disabled = false;
  promptInput.disabled = false;
  startRecognitionButton.disabled = false;
  //return "I don't know what you are talking about";
}
//edit the question
function editQ(index) {
  if (historyList[index].role == "system") return;
  if (historyList[index].role == "assistant") {
    index = index - 1;
  }
  if (historyList[index].role == "user") {
    var oldPrompt = historyList[index].content;
    var changedPrompt = prompt("if you leave this empty this question history will be deleted from this position.", oldPrompt);
    if (changedPrompt != oldPrompt && changedPrompt != null) {
      //remove any div in conversationDisplay.innerHTML which has the id >= "conv"+index
      var maxIndex = historyList.length - 1;
      for (var i = index; i < maxIndex; i++) {
        var conv = document.getElementById("conv" + i);
        if (conv != null) {
          conv.remove();
        }
      }
      //remove any historyList content form this index
      historyList.splice(index, 1);
      //clear the cookie
      // document.cookie = `historyList=${JSON.stringify(historyList)}`;
      if (changedPrompt != null && changedPrompt != "") {
        //re-ask the question
        iSaid(changedPrompt);
      }
    }
  }
}
function filterXSS(data) {
  data = data.replace(/&/g, '&amp;');
  data = data.replace(/</g, '&lt;');
  data = data.replace(/>/g, '&gt;');
  data = data.replace(/"/g, '&quot;');
  data = data.replace(/\\\\n/g, "+<br>+");
  data = data.replace(/\\\\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
  data = data.replace(/\//g, '&#47;');
  data = data.replace(/'/g, '&#39;');
  data = data.replace(/`/g, '&#96;');
  data = data.replace(/\n/g, "<br>");
  return data;
}

function displayAnswer(data) {
  conversationDisplay.innerHTML = conversationDisplay.innerHTML.replace(waiting, data);
  conversationDisplay.scrollTo(0, 0);
  // document.cookie = `historyList=${JSON.stringify(historyList)}`;
  // document.cookie = `conversation=""`;
  //for cookie
  let cookieDate = new Date();
  cookieDate.setFullYear(cookieDate.getFullYear() + 1); // Cookie will expire in 1 year
  // document.cookie = `expires=${cookieDate.toUTCString()}; path=/`;

  historyDisplayIndex = historyList.length;
  tempHistory = "";
}

function ttsAnswer(answer) {
  console.log(answer);
  //answer = answer.replace(/<br>/g, " ");
  const synth = window.speechSynthesis;
  if (voiceAnswer.checked) {
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = languageSelect.value;
    utterance.pitch = pitch.value;
    utterance.rate = rate.value;
    synth.speak(utterance);
  } else {
    //stop the voice
    synth.cancel();
  }
}
//change language
languageSelect.onchange = () => {
  loadLanguage(languageSelect.value); //load the chinese language
}
providerSelect.onchange = async () => {
    const provider = providerSelect.value;
    if (provider === 'openai') {
        baseUrlInput.value = 'https://api.openai.com/v1';
    } else if (provider === 'nvidia') {
        baseUrlInput.value = 'https://integrate.api.nvidia.com/v1';
    }
    await storage.setSetting('provider', provider);
    await storage.setSetting('baseUrl', baseUrlInput.value);
};

baseUrlInput.onchange = async () => {
    await storage.setSetting('baseUrl', baseUrlInput.value);
};

modelInput.onchange = async () => {
    model = modelInput.value;
    await storage.setSetting('model', model);
};
//change the temperature
temperatureRange.onchange = async () => {
  temperatureValue.textContent = temperatureRange.value;
  temperature = temperatureRange.value;
  await storage.setSetting('temperature', temperature);
};
//change the voice's pitch and rate
pitch.onchange = async () => {
  pitchValue.textContent = pitch.value;
  await storage.setSetting('pitch', pitch.value);
};

rate.onchange = async () => {
  rateValue.textContent = rate.value;
  await storage.setSetting('rate', rate.value);
};

themeSelect.onchange = async () => {
  const theme = themeSelect.value;
  setColorMode(theme);
  await storage.setSetting('theme', theme);
};

contextWindowRange.onchange = async () => {
  contextWindowValue.textContent = contextWindowRange.value;
  contextWindow = parseInt(contextWindowRange.value);
  await storage.setSetting('contextWindow', contextWindow);
};

fileUpload.onchange = async () => {
    uploadedFilesContent = "";
    fileListDiv.innerHTML = "";
    for (const file of fileUpload.files) {
        const reader = new FileReader();
        const content = await new Promise((resolve) => {
            if (file.type === "application/pdf") {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const typedarray = new Uint8Array(e.target.result);
                    try {
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        let text = "";
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            text += content.items.map(s => s.str).join(" ") + "\n";
                        }
                        resolve(text);
                    } catch (e) {
                        console.error("PDF read error", e);
                        resolve("[Error reading PDF: " + file.name + "]");
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsText(file);
            }
        });
        uploadedFilesContent += `\n--- File: ${file.name} ---\n${content}\n`;
        const span = document.createElement('span');
        span.textContent = file.name + " ";
        fileListDiv.appendChild(span);
    }
};

addPromptButton.onclick = async () => {
    const title = prompt("Enter prompt title");
    const content = prompt("Enter prompt content");
    if (title && content) {
        const transaction = storage.db.transaction(['prompts'], 'readwrite');
        const store = transaction.objectStore('prompts');
        await new Promise((resolve) => {
            const req = store.add({ title, content });
            req.onsuccess = () => resolve();
        });
        await loadPrompts();
    }
};

async function loadPrompts() {
    const transaction = storage.db.transaction(['prompts'], 'readonly');
    const store = transaction.objectStore('prompts');
    const prompts = await new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
    });

    promptListDiv.innerHTML = '';
    prompts.forEach(p => {
        const div = document.createElement('div');
        div.className = 'prompt-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '2px';
        div.innerHTML = `<span>${p.title}</span>`;

        const useBtn = document.createElement('button');
        useBtn.textContent = 'Use';
        useBtn.style.padding = '2px 5px';
        useBtn.onclick = () => {
            promptInput.value = p.content;
        };

        const delBtn = document.createElement('button');
        delBtn.textContent = 'X';
        delBtn.style.padding = '2px 5px';
        delBtn.style.backgroundColor = '#f44336';
        delBtn.onclick = async () => {
            const tx = storage.db.transaction(['prompts'], 'readwrite');
            await new Promise((resolve) => {
                const req = tx.objectStore('prompts').delete(p.id);
                req.onsuccess = () => resolve();
            });
            await loadPrompts();
        };

        const btnGroup = document.createElement('div');
        btnGroup.appendChild(useBtn);
        btnGroup.appendChild(delBtn);
        div.appendChild(btnGroup);
        promptListDiv.appendChild(div);
    });
}

exportSettingsBtn.onclick = async () => {
    const settings = {};
    const transaction = storage.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const keys = await new Promise((resolve) => {
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result);
    });
    for (const key of keys) {
        settings[key] = await storage.getSetting(key);
    }

    const promptsTx = storage.db.transaction(['prompts'], 'readonly');
    const prompts = await new Promise((resolve) => {
        const req = promptsTx.objectStore('prompts').getAll();
        req.onsuccess = () => resolve(req.result);
    });

    const data = JSON.stringify({ settings, prompts }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings_backup.json';
    a.click();
};

importSettingsBtn.onclick = () => settingsImportFile.click();

settingsImportFile.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        const { settings, prompts } = JSON.parse(event.target.result);
        if (settings) {
            for (const [key, value] of Object.entries(settings)) {
                await storage.setSetting(key, value);
            }
        }
        if (prompts) {
            const tx = storage.db.transaction(['prompts'], 'readwrite');
            const store = tx.objectStore('prompts');
            await store.clear();
            for (const p of prompts) {
                delete p.id;
                await store.add(p);
            }
        }
        alert('Settings imported. Reloading...');
        location.reload();
    };
    reader.readAsText(file);
};

exportHistoryBtn.onclick = async () => {
    const topicsTx = storage.db.transaction(['topics'], 'readonly');
    const topics = await new Promise((resolve) => {
        const req = topicsTx.objectStore('topics').getAll();
        req.onsuccess = () => resolve(req.result);
    });
    const messagesTx = storage.db.transaction(['messages'], 'readonly');
    const messages = await new Promise((resolve) => {
        const req = messagesTx.objectStore('messages').getAll();
        req.onsuccess = () => resolve(req.result);
    });

    const data = JSON.stringify({ topics, messages }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'history_backup.json';
    a.click();
};

importHistoryBtn.onclick = () => historyImportFile.click();

historyImportFile.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        const { topics, messages } = JSON.parse(event.target.result);
        if (topics) {
            const tx = storage.db.transaction(['topics'], 'readwrite');
            const store = tx.objectStore('topics');
            // Mapping old IDs to new IDs if we want to avoid collisions, but clear is easier for now
            await store.clear();
            for (const t of topics) {
                // delete t.id; // Preserve IDs to maintain tree structure if possible
                await store.put(t);
            }
        }
        if (messages) {
            const tx = storage.db.transaction(['messages'], 'readwrite');
            const store = tx.objectStore('messages');
            await store.clear();
            for (const m of messages) {
                await store.put(m);
            }
        }
        alert('History imported. Reloading...');
        location.reload();
    };
    reader.readAsText(file);
};

newTopicButton.onclick = async () => {
  const title = prompt("Enter topic title", "New Topic");
  if (title) {
    const topic = { title, createdAt: new Date() };
    const transaction = storage.db.transaction(['topics'], 'readwrite');
    const store = transaction.objectStore('topics');
    const id = await new Promise((resolve) => {
        const req = store.add(topic);
        req.onsuccess = () => resolve(req.result);
    });
    await loadTopics();
    await switchTopic(id);
  }
};

async function loadTopics() {
    const transaction = storage.db.transaction(['topics'], 'readonly');
    const store = transaction.objectStore('topics');
    const topics = await new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
    });

    topicList.innerHTML = '';
    topics.forEach(topic => {
        const div = document.createElement('div');
        div.className = 'topic-item' + (topic.id === currentTopicId ? ' active' : '');
        div.textContent = topic.title;
        div.onclick = () => switchTopic(topic.id);
        topicList.appendChild(div);
    });
}

async function switchTopic(id) {
    currentTopicId = id;
    await storage.setSetting('currentTopicId', id);
    conversationDisplay.innerHTML = '';
    historyList = [];

    const messages = await storage.getAllMessagesByTopic(id);
    // Find the latest message to set currentMessageId
    if (messages.length > 0) {
        currentMessageId = messages[messages.length - 1].id;
    } else {
        currentMessageId = null;
    }

    // For branching, we only want to show the current branch.
    // For now, let's just show all messages in order of timestamp if it's a linear history.
    // We will refine this once the full tree logic is in place.
    const branch = getLinearBranch(messages, currentMessageId);
    historyList = branch.map(msg => ({ role: msg.role, content: msg.content }));

    renderMessages(branch);
    await loadTopics();
    updateTree();
}

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

function renderMessages(messages) {
    conversationDisplay.innerHTML = '';
    messages.forEach((msg, i) => {
        if (msg.role === 'system') return;
        const div = document.createElement('div');
        div.id = "conv" + i;
        div.innerHTML = `<p class="timeStemp">${getTimestamp(new Date(msg.timestamp))}</p>`
            + `<div class="${msg.role === 'user' ? 'userdiv' : 'botdiv'}"><br>${msg.role === 'user' ? you : bot}:<p class="${msg.role === 'user' ? 'userText' : 'botText'}">${filterXSS(msg.content)}</p></div>`;
        conversationDisplay.prepend(div);
    });
}

async function autoSummarize() {
    if (historyList.length <= 5) return;

    const messagesToSummarize = historyList.slice(0, historyList.length - 2); // Keep last few
    const summaryPrompt = "Please summarize the preceding conversation briefly to maintain context.";

    const baseUrl = baseUrlInput.value || "https://api.openai.com/v1";
    const apiUrl = baseUrl.endsWith('/') ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKeyInput.value}`
    };

    const data = {
        "model": modelInput.value || model,
        "messages": [...messagesToSummarize, { role: "user", content: summaryPrompt }],
        "temperature": 0.3
    };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data)
        });
        const result = await response.json();
        const summary = result.choices[0].message.content;

        // Replace summarized messages with a single system message
        historyList.splice(0, messagesToSummarize.length, { role: "system", content: "Previous conversation summary: " + summary });
        console.log("Context summarized");
    } catch (e) {
        console.error("Summarization failed", e);
    }
}

async function updateTree() {
    if (!currentTopicId) return;
    const messages = await storage.getAllMessagesByTopic(currentTopicId);

    // Build tree representation
    const nodes = {};
    const root = { id: null, children: [] };
    nodes[null] = root;

    messages.forEach(msg => {
        nodes[msg.id] = { ...msg, children: [] };
    });

    messages.forEach(msg => {
        const parentId = msg.parentId;
        if (nodes[parentId] !== undefined) {
            nodes[parentId].children.push(nodes[msg.id]);
        } else {
             root.children.push(nodes[msg.id]);
        }
    });

    treeContainer.innerHTML = '';
    renderTreeNode(root, treeContainer);
}

function renderTreeNode(node, container, level = 0) {
    if (node.id !== null) {
        const div = document.createElement('div');
        div.className = 'tree-node' + (node.id === currentMessageId ? ' active' : '') + (selectedContextIds.has(node.id) ? ' selected' : '');
        div.style.marginLeft = (level * 10) + 'px';
        div.style.padding = '5px';
        div.style.cursor = 'pointer';
        div.style.fontSize = '12px';
        div.style.borderLeft = '1px solid var(--input-border)';
        div.textContent = (node.role === 'user' ? '👤 ' : '🤖 ') + node.content.substring(0, 30) + (node.content.length > 30 ? '...' : '');
        div.onclick = async (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (selectedContextIds.has(node.id)) {
                    selectedContextIds.delete(node.id);
                } else {
                    selectedContextIds.add(node.id);
                }
                updateTree();
            } else {
                currentMessageId = node.id;
                const messages = await storage.getAllMessagesByTopic(currentTopicId);
                const branch = getLinearBranch(messages, currentMessageId);
                historyList = branch.map(msg => ({ role: msg.role, content: msg.content }));
                renderMessages(branch);
                updateTree();
            }
        };
        container.appendChild(div);
    }

    node.children.forEach(child => renderTreeNode(child, container, node.id === null ? 0 : level + 1));
}

//add function when press ctrl +a in the page, all the conversationDisplay div content will be selected
window.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === "a") {
    e.preventDefault();
    window.getSelection().selectAllChildren(conversationDisplay);
  }
});
//left click the clearButton to clear the conversation
clearButton.addEventListener('click', async () => {
  conversationDisplay.innerHTML = "";
  historyList = [];
  if (currentTopicId) {
    await storage.clearMessagesByTopic(currentTopicId);
  }
});
//right click the voiceAnswer to read everything answer
voiceAnswer.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  ttsAnswer(conversationDisplay.textContent);
});
//left click the saveButton to save the conversation
saveButton.addEventListener('click', () => {
  const link = document.createElement("a");
  const file = new Blob([conversationDisplay.innerText], { type: 'text/plain ; charset=utf-8' });
  link.href = URL.createObjectURL(file);
  link.download = "chatBox_" + getTimestamp(new Date()) + ".txt";
  link.click();
  URL.revokeObjectURL(link.href);
});
//left click the apiModifyButton to modify the api key
settingButton.addEventListener('click', async () => {
  if (settingDiv.style.display == "none") {
    settingDiv.style.display = "block";
  } else {
    settingDiv.style.display = "none";
    await storage.setSetting('api_key', apiKeyInput.value);
  }
});
//right click the settingButton to display/hide the languageSelect
/*settingButton.addEventListener('contextmenu', function (e) {
   e.preventDefault();
  languageSelect.style.display = languageSelect.style.display == "none" ? "block" : "none";
  return false;
});*/
//left click the enterPromoteButton to promote the chatbot
enterPromoteButton.addEventListener('click', () => {
  voice = false;
  const promote = promptInput.value;
  iSaid(promote);
});
//right click the enterPromoteButton to clear the history promote
enterPromoteButton.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  historyList = [];
  return false;
});

var historyDisplayIndex = historyList.length;
var tempHistory = "";
//when press enter to promote the chatbot
promptInput.addEventListener('keyup', (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    voice = false;
    const promote = promptInput.value;
    iSaid(promote);
  }
  // the cursor is at the beginning of the promptInput and press the up key to display the last history
  if (e.key === "ArrowUp" && promptInput.selectionStart == 0 && historyDisplayIndex >= 0) {
    e.preventDefault();
    if (historyDisplayIndex == historyList.length) {
      tempHistory = promptInput.value;
    }
    historyDisplayIndex = historyDisplayIndex - 1 > 0 ? historyDisplayIndex - 1 : historyList.length;
    if (historyDisplayIndex == historyList.length) {
      promptInput.value = tempHistory;
    } else {
      promptInput.value = historyList[historyDisplayIndex].content;
      promptInput.setSelectionRange(0, 0);
    }
  }
});
//right click the startRecognitionButton to display cookies in alert
startRecognitionButton.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  alert(document.cookie);
  console.log(document.cookie);
  return false;
});

//left click the startRecognitionButton to start the speech recognition
startRecognitionButton.addEventListener('click', () => {
  // Requesting user permission for speech recognition
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = languageSelect.value;
  if (this.value != startTalk) {
    voice = true;
    recognition.addEventListener('result', e => {
      const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      console.log(e);
      // Check if an API key has been provided
      iSaid(transcript);
    });
    recognition.start();
    this.value = stopTalk;
    //this.style.backgroundColor = "#ff0000";
  } else {
    recognition.stop();
    this.value = startTalk;
    // this.style.backgroundColor = "#00ff00";
  }
  // Get the input value and save it to a cookie
  // document.cookie = `api_key=${apiKeyInput.value}`;
});

// Registering the service worker
window.addEventListener('load', async () => {
  await storage.init();
  await migrateFromCookies();

  const savedApiKey = await storage.getSetting('api_key');
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
    settingDiv.style.display = "none";
  } else {
    settingDiv.style.display = "block";
  }

  pitch.value = await storage.getSetting('pitch') || 1.0;
  pitchValue.textContent = pitch.value;
  rate.value = await storage.getSetting('rate') || 1.0;
  rateValue.textContent = rate.value;

  providerSelect.value = await storage.getSetting('provider') || 'openai';
  baseUrlInput.value = await storage.getSetting('baseUrl') || 'https://api.openai.com/v1';
  modelInput.value = await storage.getSetting('model') || "gpt-3.5-turbo";
  model = modelInput.value;
  temperature = await storage.getSetting('temperature') || 0.7;
  contextWindow = await storage.getSetting('contextWindow') || 10;
  contextWindowRange.value = contextWindow;
  contextWindowValue.textContent = contextWindow;
  const savedTheme = await storage.getSetting('theme') || 'system';
  themeSelect.value = savedTheme;
  setColorMode(savedTheme);

  currentTopicId = await storage.getSetting('currentTopicId');
  await loadTopics();
  if (currentTopicId) {
      await switchTopic(currentTopicId);
  }
  await loadPrompts();

  //load language
  selectLanguage();
  // check if the browser supports service worker, then register it
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service worker registered successfully:', registration.scope);
      })
      .catch(error => {
        console.log('Service worker registration failed:', error);
      });
    navigator.serviceWorker.getRegistration().then(function (registration) {
      if (registration) {
        registration.update();
      }
    });
  }
});
//detect browser's theme color change
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  const newColorScheme = event.matches ? "dark" : "light";
  if (themeSelect.value === 'system') {
    setColorMode('system');
  }
});
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('Current CACHE_NAME:', event.data.cacheName);
  const versionEl = document.getElementById('version');
  if (versionEl) versionEl.textContent = event.data.cacheName;
});
//detect browser's language change
window.onlanguagechange = function () {
  selectLanguage();
};

//change the webpage's theme color
function setColorMode(colorScheme) {
  if (colorScheme === 'system') {
    colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
  }
  document.documentElement.setAttribute('data-theme', colorScheme);
}

function showAPIKEY() {
  apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
}
function selectLanguage() {
  var lang = navigator.language || navigator.userLanguage;
  languageSelect.value = lang;
  loadLanguage(lang);
}
//load language from json file
function loadLanguage(lang) {
  var file = lang.startsWith('zh') ? "cn.json" : "en.json";
  document.getElementById("language-select").value = lang;
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
        enterPromoteButton.textContent = data.button2;
        clearButton.textContent = data.button3;
        saveButton.textContent = data.button4;
        settingButton.textContent = data.button5;
        settingDivL.innerHTML = data.button5;
        promptInput.setAttribute("placeholder", data.label1);
        // document.getElementById("inputLabel").innerHTML = data.label1;
        document.getElementById("voiceLabel").innerHTML = data.label2;
        voiceAnswer.setAttribute("placeholder", data.label2);
        apiKeyInput.setAttribute("placeholder", data.label3);
        document.getElementById("apiKeyInputLabel").innerHTML = data.label3;
        document.getElementById("showKeyLabel").innerHTML = data.label4;
        document.getElementById("showKey").setAttribute("placeholder", data.label4);
        document.getElementById("speechSettingLabel").innerHTML = data.label5;
        document.getElementById("rateLabel").innerHTML = data.label6;
        document.getElementById("pitchLabel").innerHTML = data.label7;
        document.getElementById("languageSelectLabel").innerHTML = data.label8;
        document.getElementById("modelSelectLabel").innerHTML = data.label9;
        document.getElementById("themeSelectLabel").innerHTML = data.label10;
        document.getElementById("contextWindowLabel").innerHTML = data.label11;
        document.getElementById("providerSelectLabel").innerHTML = data.label12;
        document.getElementById("baseUrlLabel").innerHTML = data.label13;
        document.getElementById("promptLibraryLabel").innerHTML = data.label14;
        newTopicButton.textContent = data.button6;
        exportHistoryBtn.textContent = data.button7;
        importHistoryBtn.textContent = data.button8;
        addPromptButton.textContent = data.button9;
        exportSettingsBtn.textContent = data.button10;
        importSettingsBtn.textContent = data.button11;

        you = data.text1;
        bot = data.text2;
        waiting = data.text3;
        enterApiKey = data.text4;
        noanswer = data.text5;
      }
    }
    xhr.open("GET", file, true);
    xhr.send();
  } catch (e) {
    console.log(e);
  };

}
