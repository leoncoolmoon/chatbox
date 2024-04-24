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
const modelSelect = document.getElementById('model-select');
const languageSelect = document.getElementById('language-select');
const temperatureRange = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperatureValue');
const updateButton = document.getElementById('update-button');
const settingDivL = document.getElementById('settingDiv');
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
function chat(message) {
  //check if the api key is empty
  if (!apiKeyInput.value) {
    remindAPIKey();
    enterPromoteButton.disabled = false;
    promptInput.disabled = false;
    startRecognitionButton.disabled = false;
    return;
  }
  //keep a 10 history
  if (historyList.length > 10) {
    historyList.shift();
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
    + `<div class = "userdiv"><br>${you}:<p class = "userText"> ${transcript} </p></div>`
    + `<div class = "botdiv"><br>${bot}:<p class = "botText"> ${waiting}</p></div></div>`
    + conversationDisplay.innerHTML;

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKeyInput.value}`
  };

  const data = {
    "model": model,
    "messages": historyList,
    "temperature": temperature
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
      historyList.push(data.choices[0].message);
      var answer = data.choices[0].message.content;
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
    if (changedPrompt != oldPrompt) {
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
      document.cookie = `historyList=${JSON.stringify(historyList)}`;
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
  document.cookie = `historyList=${JSON.stringify(historyList)}`;
  document.cookie = `conversation=""`;
  //for cookie
  let cookieDate = new Date();
  cookieDate.setFullYear(cookieDate.getFullYear() + 1); // Cookie will expire in 1 year
  document.cookie = `expires=${cookieDate.toUTCString()}; path=/`;

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
//change the model
modelSelect.onchange = () => {
  model = modelSelect.value;
  document.cookie = `model=${model}`;
}
//change the temperature
temperatureRange.onchange = () => {
  temperatureValue.textContent = temperatureRange.value;
  temperature = temperatureRange.value;
};
//change the voice's pitch and rate
pitch.onchange = () => {
  pitchValue.textContent = pitch.value;
  document.cookie = `pitch=${pitch.value}`;
};

rate.onchange = () => {
  rateValue.textContent = rate.value;
  document.cookie = `rate=${rate.value}`;
};
//add function when press ctrl +a in the page, all the conversationDisplay div content will be selected
window.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === "a") {
    e.preventDefault();
    window.getSelection().selectAllChildren(conversationDisplay);
  }
});
//left click the clearButton to clear the conversation
clearButton.addEventListener('click', () => {
  conversationDisplay.innerHTML = "";
  document.cookie = `conversation=`;
  historyList = [];
  document.cookie = `historyList=`;
});
//right click the voiceAnswer to read everything answer
voiceAnswer.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  ttsAnswer(conversationDisplay.textContent);
});
//left click the saveButton to save the conversation
saveButton.addEventListener('click', () => {
  const link = document.createElement("a");
  const file = new Blob([conversationDisplay.textContent], { type: 'text/plain ; charset=utf-8' });
  link.href = URL.createObjectURL(file);
  link.download = "chatBox_" + getTimestamp(new Date()) + ".txt";
  link.click();
  URL.revokeObjectURL(link.href);
});
//left click the apiModifyButton to modify the api key
settingButton.addEventListener('click', () => {
  if (settingDiv.style.display == "none") {
    settingDiv.style.display = "block";
  } else {
    settingDiv.style.display = "none";
    document.cookie = `api_key=${apiKeyInput.value};`;
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
      promptInput.selectionStart = 0;
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
  document.cookie = `api_key=${apiKeyInput.value}`;
});
//update-button to update the pwa
// updateButton.addEventListener('click', () => {

//   try {
//     navigator.serviceWorker.getRegistration().then(function (registration) {
//       // 强制更新Service Worker
//       if (registration) {
//         registration.update();
//       }
//     });
//   } catch (e) { console.log(e); }

// });

// Registering the service worker
window.addEventListener('load', () => {
  //load cookies
  if (document.cookie) {
    apiKeyInput.value = document.cookie.replace(/(?:(?:^|.*;\s*)api_key\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    settingDiv.style.display = apiKeyInput.value != "" ? "none" : "block";
    pitchValue.textContent = document.cookie.replace(/(?:(?:^|.*;\s*)pitch\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    pitch.value = pitchValue.textContent;
    rateValue.textContent = document.cookie.replace(/(?:(?:^|.*;\s*)rate\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    rate.value = rateValue.textContent;
    var expired = new Date(document.cookie.replace(/(?:(?:^|.*;\s*)expires\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
    //cookieDate is one year before the expired date
    var cookieDate = new Date();
    cookieDate.setFullYear(expired.getFullYear() - 1);
    var historyListj = document.cookie.replace(/(?:(?:^|.*;\s*)historyList\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    //change historyList from string to array
    historyList = JSON.parse(historyListj);
    //conversationDisplay.innerHTML = document.cookie.replace(/(?:(?:^|.*;\s*)conversation\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    //convert historyList to conversationDisplay
    for (var i = 0; i < historyList.length; i++) {
      var convIndex = i;
      var role = historyList[i].role;
      var content = historyList[i].content;
      if (role != "system") {
        conversationDisplay.innerHTML = `<div id = "conv${role == "assistant" ? convIndex - 1 : convIndex}" ondblclick="editQ(${role == "assistant" ? convIndex - 1 : convIndex})"><p class = "timeStemp" > ${getTimestamp(cookieDate)}  DoubleClick to change.</p>`
          + `<div class = ${role == "assistant" ? "botdiv" : "userdiv"}><br>${role == "assistant" ? bot : you}:<p class = ${role == "assistant" ? "botText" : "userText"}> ${content} </p></div></div>`
          + conversationDisplay.innerHTML;
      }
    }
    model = document.cookie.replace(/(?:(?:^|.*;\s*)model\s*\=\s*([^;]*).*$)|^.*$/, "$1") || "gpt-3.5-turbo-16k";
    temperature = document.cookie.replace(/(?:(?:^|.*;\s*)temperature\s*\=\s*([^;]*).*$)|^.*$/, "$1") || 0.7;
    try {
      navigator.serviceWorker.controller.postMessage(
        { action: 'GET_CACHE_NAME' },
        [new MessageChannel().port2]
      );
    } catch (e) { console.log(e); }

  } else {
    settingDiv.style.display = "block";
  }
  //get browser's theme color and change the webpage's theme color
  setColorMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light");
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
  setColorMode(newColorScheme);
});
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('Current CACHE_NAME:', event.data.cacheName);
  document.getElementById('version').textContent = event.data.cacheName;
});
//detect browser's language change
window.onlanguagechange = function () {
  selectLanguage();
};

//change the webpage's theme color
function setColorMode(colorScheme) {
  document.body.style.backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  document.body.style.color = colorScheme === "dark" ? "#ffffff" : "#000000";
  const inputElements = document.querySelectorAll('select, input, textarea');
  // Loop through each input element and change its color
  for (let i = 0; i < inputElements.length; i++) {
    inputElements[i].style.color = colorScheme === "dark" ? "#ffffff" : "#000000";
    inputElements[i].style.backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  }
  // promptInput.style.color = colorScheme === "dark" ? "#ffffff" : "#000000";
  // promptInput.style.backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
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
