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
function summarize(text){
  systemctrol(`summ:'please summarize into less then 500 words'][input:'${text}`);
}
var past = "";
var delayQuestion = "";
var lastAnswer = "";
var bestAssistant = "You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.";
//the current conversation check length and summarize
function iSaid(content) {
  //add the control part of the prompt ie the past merries
  var historymemory = conversationDisplay.textContent.replace("You", "User:").replace("Chatbot", "Assistant: ").replace("/n/r", "") ;
  if(historymemory.length >8000 ){
    summarize(historymemory);
    delayQuestion = content;
    return;
  }
  iSaidL(content,historymemory);
}
//the history part of the prompt
function iSaidL(content,history){
  var message = [
    { "role": "system", "content": bestAssistant },
    // {"role": "system", "content": historymemory },
    {"role": "user", "content": history},
    // {"role": "assistant", "content": "" },
    { "role": "user", "content": content }];
  chat(message);
  //console.log(conversationDisplay.textContent.replace("You", "User:").replace("Chatbot", "Assistant: ").replace("/n/r", ""), '');
}
var programCore = "In this setting you are the program core, " +
  "I will ask question in the format '[key:question],[options:'a','b'],[input:content]'" +
  "the first part of the first section is the key for the prompt, the second part is the question i want you to answer, " +
  "the second section is the available options, some question may not contain this section," +
  "if there is option, answer with the one of the options," +
  "if there is no option, answer with short and clear sentences." +
  "the third section is the input section, the content provide the background information for the question, " +
  "some question may not contain this section," +
  "if there is no input section,  answer the question, with short and clear sentences" +
  "you need return your answer with format '[key:answer]'. " +
  "you need to fill the 'key' with the key i provided in the first part of the first section," +
  "and fill the 'answer' with your answer. " +
  "Also you need to give the exact answer without any extra words. ";
function systemctrol(content) {
  //add the control part of the prompt ie classifcation of the language
  var message = [
    { "role": "system", "content": programCore },
    { "role": "user", "content": "[lang:'is this Chinese? answer zh-CN only when it is chinese.'],[option:'en-GB','zh-CN'],[input:'hello world']" },
    { "role": "assistant", "content": "[lang:'en-GB']" },
    { "role": "user", "content": "[lang:'is this Chinese? answer zh-CN only when it is chinese.'],[option:'en-GB','zh-CN'],[input:'你好']" },
    { "role": "assistant", "content": "[lang:'zh-CN']" },
    { "role": "user", "content": "[lang:'is this Chinese? answer zh-CN only when it is chinese.'],[option:'en-GB','zh-CN'],[input:'안녕하세요']" },
    { "role": "assistant", "content": "[lang:'en-GB']" },
    { "role": "user", "content": "[lang:'is this Chinese? answer zh-CN only when it is chinese.'],[input:'hello 用中文怎么说']" },
    { "role": "assistant", "content": "[lang:'zh-CN']" },
    { "role": "user", "content": "[lang:'is this Chinese? answer zh-CN only when it is chinese.'],[option:'en-GB','zh-CN'],[input:'how to speek 你好 in english']" },
    { "role": "assistant", "content": "[lang:'en-GB']" },
    { "role": "user", "content": `[${content} ]` }];
  chat(message);
}
//get the transcript from the message and filter the control part
function getTranscript(message) {
  var t = message.length - 1;
  var transcript = message[t]
  scrpitText = transcript.content;
  if (transcript.role == "user"
    && scrpitText[0] != "["
    && scrpitText[scrpitText.length - 1] != "]") {
    return scrpitText;
  }
  return "";
}
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
  var transcript = getTranscript(message);
  if (transcript != "") {
    console.log(Array.isArray(historyList));
    historyList.push(transcript);
    enterPromoteButton.disabled = true;
    promptInput.disabled = true;
    startRecognitionButton.disabled = true;
    promptInput.value = "";
    //message = [{ "role": "user", "content": transcript }];
    //display a waiting message
    conversationDisplay.innerHTML = `<p class = "timeStemp"> ${getTimestamp()}</p> <div class = "userdiv">${you}:<p class = "userText"> ${transcript} </p></div><div class = "botdiv"><br>${bot}:<p class = "botText"> ${waiting}</p></div>` + conversationDisplay.innerHTML;
  }
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKeyInput.value}`
  };

  const data = {
    //"model": "gpt-3.5-turbo-16k",
    "model": "gpt-4-32k-0613",
    "messages": message,
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
      //dealingfullOriginalReturn(data);
      var answer = data.choices[0].message.content;
      settingDiv.style.display = "none";
      settingButton.style.display = "block";
      //XSS protection
      if (checkCtrlMark(answer)) {
        ttsAnswer(answer);
        answer = filterXSS(answer);
        //replace the waiting message with the answer
        displayAnswer(answer);
      };

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
function checkCtrlMark(data) {

  //filter out the marked return for system ctrl without display, will return false
  //the content is before the filterXSS

  if (data.substring(0, 6) == "[lang:") {
    languageSelect.value = data.substring(7, data.length - 2);
    return false;
  }else if(data.substring(0, 6) == "[summ:"){
    past = data.substring(7, data.length - 2);
    if(historyList[historyList.length].length+lastAnswer.length+past.length<5000){
      past = past+"/n/r+last Question: User:"+historyList[historyList.length]+"Assistant:"+lastAnswer;
    }
    iSaidL(delayQuestion, past);
    return false;
  }
  systemctrol("lang:'is this Chinese? answer zh-CN only when it is chinese.'],[option:'en-GB','zh-CN'],[input:" + data);
  //pass the filter will return true
  return true;
}
function displayAnswer(data) {
  conversationDisplay.innerHTML = conversationDisplay.innerHTML.replace(waiting, data);
  conversationDisplay.scrollTo(0, 0);
  document.cookie = `historyList=${historyList}`;
  document.cookie = `conversation=${conversationDisplay.innerHTML}`;
  lastAnswer = data;
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
  }else{
    //stop the voice
    synth.cancel();
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
  iSaid(promote);
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
    iSaid(promote);
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
    xhr.open("GET", file, true);
    xhr.send();
  } catch (e) {
    console.log(e);
  };

}
