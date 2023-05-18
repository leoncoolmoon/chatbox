const apiKeyInput = document.getElementById('api-key-input');
const apiModifyButton = document.getElementById('modify-api-button');
const startRecognitionButton = document.getElementById('start-recognition-button');
const enterPromoteButton = document.getElementById('enter-promot-button');
const promptInput = document.getElementById('prompt-input');
const conversationDisplay = document.getElementById('conversation-display');
var voice = false;
function chart(transcript) {
//display a waitting message
  conversationDisplay.innerHTML += `<p>You: ${transcript}</p><p>Chatbot: waitting...</p>`;
  if (!apiKeyInput.value) {
    conversationDisplay.innerHTML += '<p>Please enter an API key</p>';
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

  fetch(apiUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    // .then(data => console.log(data))
    .then(data => {
     const answer = data.choices[0].message.content;
      apiKeyInput.style.display = "none";
      apiModifyButton.style.display = "block";
      //replace the waitting message with the answer
      conversationDisplay.innerHTML = conversationDisplay.innerHTML.replace("waitting...", answer);
      tts(answer);
    }).catch(error => console.error(error));
  //return "I don't know what you are talking about";
}

function tts(answer) {
  if(voice){
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(answer);
  synth.speak(utterance);
}
}



//left click the apiModifyButton to modify the api key
apiModifyButton.addEventListener('click', () => {
  apiKeyInput.style.display = "block";
  apiModifyButton.style.display = "none";
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
  if (this.value != "Start Recognition") {
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
    this.value = "Stop Recognition";
    //this.style.backgroundColor = "#ff0000";
  } else {
    recognition.stop();
    this.value = "Start Recognition";
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
    apiKeyInput.style.display = "none";
    apiModifyButton.style.display = "block";
  } else {
    apiKeyInput.value = "";
    apiKeyInput.style.display = "block";
    apiModifyButton.style.display = "none";
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