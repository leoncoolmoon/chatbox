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
var voice = false;

  //get the current time
  function getTimestamp() {
    const date = new Date();
    //return YYYY-MM-DD HH:MM:SS
    return `[${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] `;
  }

// Get the input value display and save it to a cookie
function chart(transcript) {
//display a waitting message
  conversationDisplay.innerHTML =`<p class = "timeStemp"> ${getTimestamp()}</p> <p class = "userText"> ${transcript}: You</p><p class = "botText">Chatbot: waitting...</p>` + conversationDisplay.innerHTML;
  if (!apiKeyInput.value) {
    conversationDisplay.innerHTML = '<p>Please enter an API key</p>' + conversationDisplay.innerHTML;
    return;
  }
 
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
     const answer = data.choices[0].message.content;
      settingDiv.style.display = "none";
      settingButton.style.display = "block";
      //replace the waitting message with the answer
      conversationDisplay.innerHTML = conversationDisplay.innerHTML.replace("waitting...", answer);
      document.cookie = `conversation=${conversationDisplay.innerHTML}`;
      tts(answer);
    }).catch(error => console.error(error));
  //return "I don't know what you are talking about";
}

function tts(answer) {
  if(voice || voiceAnswer.checked){
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(answer);
  utterance.pitch = pitch.value;
  utterance.rate = rate.value;
  synth.speak(utterance);
}
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
//left click the saveButton to save the conversation
saveButton.addEventListener('click', () => {

   const link = document.createElement("a");
   const file = new Blob([conversationDisplay.innerHTML.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
   link.href = URL.createObjectURL(file);
   link.download = "chatBox_"+getTimestamp()+".txt";
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

//left click the enterPromoteButton to promote the chatbot
enterPromoteButton.addEventListener('click', () => {
  voice = false;
  const promote = promptInput.value;
  promptInput.value = "";
  chart(promote);
});
//when press enter to promote the chatbot
promptInput.addEventListener('keyup', (e) => {
  if (e.key === "Enter") {
    voice = false;
    const promote = promptInput.value;
    promptInput.value = "";
    chart(promote);
  }
});


//right click the startRecognitionButton to display cookies in alert
startRecognitionButton.addEventListener('contextmenu', () => {
  alert(document.cookie);
  return false;
});

//left click the startRecognitionButton to start the speech recognition
startRecognitionButton.addEventListener('click', () => {
  // Requesting user permission for speech recognition
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  if (this.value != "Start Talk") {
    voice = true;
    recognition.addEventListener('result', e => {
      const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      console.log(e);
      // Check if an API key has been provided
      chart(transcript);
    });
    recognition.start();
    this.value = "Stop Talk";
    //this.style.backgroundColor = "#ff0000";
  } else {
    recognition.stop();
    this.value = "Start Talk";
   // this.style.backgroundColor = "#00ff00";
  }
  // Get the input value and save it to a cookie
  document.cookie = `api_key=${apiKeyInput.value}`;
});

// Registering the service worker

window.addEventListener('load', () => {
  const cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)api_key\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  if (cookieValue) {
    apiKeyInput.value = cookieValue;
    settingDiv.style.display = "none";
    pitchValue.textContent = document.cookie.replace(/(?:(?:^|.*;\s*)pitch\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    pitch.value = pitchValue.textContent;
    rateValue.textContent = document.cookie.replace(/(?:(?:^|.*;\s*)rate\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    rate.value = rateValue.textContent;
    conversationDisplay.innerHTML = document.cookie.replace(/(?:(?:^|.*;\s*)conversation\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  } else {
    settingDiv.style.display = "block";
  }
  //get browser's theme color and change the webpage's theme color
  setColorMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light");

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service worker registered successfully:', registration.scope);
      })
      .catch(error => {
        console.log('Service worker registration failed:', error);
      });

  }
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  const newColorScheme = event.matches ? "dark" : "light";
  setColorMode(newColorScheme);
});
function setColorMode(colorScheme) {
  if (colorScheme === "dark") {
    // set page color theme in dark mode
    document.body.style.backgroundColor = "#000000";
    document.body.style.color = "#ffffff";
    apiKeyInput.style.backgroundColor = "#000000";
    apiKeyInput.style.color = "#ffffff";
    promptInput.style.backgroundColor = "#000000";
    promptInput.style.color = "#ffffff";
  } else {
    // set page color theme in light mode
    document.body.style.backgroundColor = "#ffffff";
    document.body.style.color = "#000000";
    apiKeyInput.style.backgroundColor = "#ffffff";
    apiKeyInput.style.color = "#000000";
    promptInput.style.backgroundColor = "#ffffff";
    promptInput.style.color = "#000000";
  }
}

function showPassword() {
    apiKeyInput.type = apiKeyInput.type === "password"? "text":"password";
 }
