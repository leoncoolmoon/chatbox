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
const languageSelect = document.getElementById('language-select');
var voice = false;
var you = "You";
var bot = "Chatbot";
var waiting = "waiting...";
var enterApiKey = "Please enter an API key";
var startTalk = "Start Talk";
var noanswer = "I have a mind block, please ask another question.";
var stopTalk = "Stop Talk";
var historyList = [];
//get the current time
function getTimestamp() {
  const date = new Date();
  //return YYYY-MM-DD HH:MM:SS
  return `[${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] `;
}
function show() {
  apiKeyInput.style.visibility = "visible";
}
// blink "off" state
function hide() {
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
// Get the input value display and save it to a cookie
function chat(transcript) {
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
  console.log(Array.isArray(historyList));
  historyList.push(transcript);
  enterPromoteButton.disabled = true;
  promptInput.disabled = true;
  startRecognitionButton.disabled = true;
  promptInput.value = "";
  //display a waiting message
  conversationDisplay.innerHTML = `<p class = "timeStemp"> ${getTimestamp()}</p> <div class = "userdiv">${you}:<p class = "userText"> ${transcript} </p></div><div class = "botdiv"><br>${bot}:<p class = "botText"> ${waiting}</p></div>` + conversationDisplay.innerHTML;
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKeyInput.value}`
  };

  const data = {
    "model": "gpt-3.5-turbo",
    "messages": [{ "role": "user", "content": transcript }],
    "temperature": 0.7
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
      var answer = data.choices[0].message.content;
      settingDiv.style.display = "none";
      settingButton.style.display = "block";
      //XSS protection
      answer = answer.replace(/&/g, '&amp;');
      answer = answer.replace(/</g, '&lt;');
      answer = answer.replace(/>/g, '&gt;');
      answer = answer.replace(/"/g, '&quot;');
      answer = answer.replace(/\\\\n/g, "+<br>+");
      answer = answer.replace(/\\\\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
      answer = answer.replace(/\//g, '&#47;');
      answer = answer.replace(/'/g, '&#39;');
      answer = answer.replace(/`/g, '&#96;');
      answer = answer.replace(/\n/g, "<br>");
      //replace the waiting message with the answer
      conversationDisplay.innerHTML = conversationDisplay.innerHTML.replace(waiting, answer);
      conversationDisplay.scrollTo(0, 0);
      document.cookie = `historyList=${historyList}`;
      document.cookie = `conversation=${conversationDisplay.innerHTML}`;
      tts(answer);
    }).catch(error => {
      console.error(error.toString())
      if (error.toString().includes("Cannot read properties of undefined")){
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

function tts(answer) {
  if (voiceAnswer.checked) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.pitch = pitch.value;
    utterance.rate = rate.value;
    synth.speak(utterance);
  }
}
//change language
languageSelect.onchange = () => {
  loadLanguage(languageSelect.value); //load the chinese language
}

//change the voice's pitch and rate
pitch.onchange = () => {
  pitchValue.textContent = pitch.value;
  document.cookie = `pitch=${pitch.value}`;
};

rate.onchange = () => {
  rateValue.textContent = rate.value;
  document.cookie = `rate=${rate.value}`;
};
//left click the clearButton to clear the conversation
clearButton.addEventListener('click', () => {
  conversationDisplay.innerHTML = "";
  document.cookie = `conversation=`;
});
//right click the voiceAnswer to read everything answer
voiceAnswer.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  tts(conversationDisplay.textContent);
});
//left click the saveButton to save the conversation
saveButton.addEventListener('click', () => {
  const link = document.createElement("a");
  const file = new Blob([conversationDisplay.textContent], { type: 'text/plain ; charset=utf-8' });
  link.href = URL.createObjectURL(file);
  link.download = "chatBox_" + getTimestamp() + ".txt";
  link.click();
  URL.revokeObjectURL(link.href);
});
//left click the apiModifyButton to modify the api key
settingButton.addEventListener('click', () => {
  if (settingDiv.style.display == "none")
    settingDiv.style.display = "block";
  else
    settingDiv.style.display = "none";
  document.cookie = `api_key=${apiKeyInput.value}`;
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
  chat(promote);
});
//right click the enterPromoteButton to clear the history promote
enterPromoteButton.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  historyList = [];
  return false;
});
//when press enter to promote the chatbot
promptInput.addEventListener('keyup', (e) => {
  if (e.key === "Enter") {
    voice = false;
    const promote = promptInput.value;
    chat(promote);
  }
  if (e.key === "Up") {
    promptInput.value = historyList[historyList.length - 1];
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
  if (this.value != startTalk) {
    voice = true;
    recognition.addEventListener('result', e => {
      const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      console.log(e);
      // Check if an API key has been provided
      chat(transcript);
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

// Registering the service worker
window.addEventListener('load', () => {
  //load cookies
  if (!document.cookie) {
    apiKeyInput.value = document.cookie.replace(/(?:(?:^|.*;\s*)api_key\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    settingDiv.style.display = "none";
    pitchValue.textContent = document.cookie.replace(/(?:(?:^|.*;\s*)pitch\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    pitch.value = pitchValue.textContent;
    rateValue.textContent = document.cookie.replace(/(?:(?:^|.*;\s*)rate\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    rate.value = rateValue.textContent;
    conversationDisplay.innerHTML = document.cookie.replace(/(?:(?:^|.*;\s*)conversation\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    historyList = document.cookie.replace(/(?:(?:^|.*;\s*)historyList\s*\=\s*([^;]*).*$)|^.*$/, "$1").split(",");
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

  }
});
//detect browser's theme color change
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  const newColorScheme = event.matches ? "dark" : "light";
  setColorMode(newColorScheme);
});

//detect browser's language change
window.onlanguagechange = function () {
  selectLanguage();
};

//change the webpage's theme color
function setColorMode(colorScheme) {
  document.body.style.backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  document.body.style.color = colorScheme === "dark" ? "#ffffff" : "#000000";
  const inputElements = document.querySelectorAll('input[type="text"]');
  // Loop through each input element and change its color
  for (let i = 0; i < inputElements.length; i++) {
    inputElements[i].style.color = colorScheme === "dark" ? "#ffffff" : "#000000";
    inputElements[i].style.backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  }
}

function showAPIKEY() {
  apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
}
function selectLanguage() {
  var lang = navigator.language || navigator.userLanguage;
  languageSelect.setAttribute("value", lang);
  loadLanguage(lang);
}
//load language from json file
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
        enterPromoteButton.textContent = data.button2;
        clearButton.textContent = data.button3;
        saveButton.textContent = data.button4;
        settingButton.textContent = data.button5;

        promptInput.setAttribute("placeholder", data.label1);
        document.getElementById("inputLabel").innerHTML = data.label1;
        document.getElementById("voiceLabel").innerHTML = data.label2;
        voiceAnswer.setAttribute("placeholder", data.label2);
        apiKeyInput.setAttribute("placeholder", data.label3);
        document.getElementById("apiKeyInputLabel").innerHTML = data.label3;
        document.getElementById("showKeyLabel").innerHTML = data.label4;
        document.getElementById("showKey").setAttribute("placeholder", data.label4);
        document.getElementById("speechSettingLabel").innerHTML = data.label5;
        document.getElementById("rateLabel").innerHTML = data.label6;
        document.getElementById("pitchLabel").innerHTML = data.label7;
        you = data.text1;
        bot = data.text2;
        waiting = data.text3;
        enterApiKey = data.text4;
        noanswer = data.text5;
      }
    }
  } catch (e) {
    console.log(e);
  };
  xhr.open("GET", file, true);
  xhr.send();
}
