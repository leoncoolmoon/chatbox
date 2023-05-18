const apiKeyInput = document.getElementById('api-key-input');
const startRecognitionButton = document.getElementById('start-recognition-button');
const conversationDisplay = document.getElementById('conversation-display');
window.addEventListener("load", () => {
  const cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)api_key\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  if(cookieValue) apiKeyInput.value = cookieValue;
});
//right click the startRecognitionButton to display cookies in alert
startRecognitionButton.addEventListener('contextmenu', () => {
  alert(document.cookie);
});
//left click the startRecognitionButton to start the speech recognition
startRecognitionButton.addEventListener('click', () => {
  // Requesting user permission for speech recognition
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.addEventListener('result', e => {
     const transcript = Array.from(e.results)
       .map(result => result[0])
       .map(result => result.transcript)
      .join('');
    console.log(e);
    // Check if an API key has been provided
    if (!apiKeyInput.value) {
      conversationDisplay.innerHTML += '<p>Please enter an API key</p>';
      return;
    }

    const apiUrl = "https://api.openai.com/v1/chat/completions";    
    const headers = {
      "Content-Type": "application/json",
      "Authorization":`Bearer ${apiKeyInput.value}`
    };
    
    const data = {
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": transcript}],
      "temperature": 0.7
    };
    
    fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    })
      .then(response => response.json())
     // .then(data => console.log(data))
      .then(data => {const  answer = data.choices[0].message.content;
                    
        // Display the conversation
        conversationDisplay.innerHTML += `<p>You: ${transcript}</p><p>Chatbot: ${answer}</p>`;
  
        // Use Web Speech API to TTS the answer
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(answer);
        synth.speak(utterance);
      }).catch(error => console.error(error));
  });
  recognition.start();
  // Get the input value and save it to a cookie
document.cookie = `api_key=${apiKeyInput.value}`;
});

// Registering the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service worker registered successfully:', registration.scope);
      })
      .catch(error => {
        console.log('Service worker registration failed:', error);
      });
  });
}
