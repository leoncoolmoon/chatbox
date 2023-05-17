const apiKeyInput = document.getElementById('api-key-input');
const startRecognitionButton = document.getElementById('start-recognition-button');
const conversationDisplay = document.getElementById('conversation-display');

startRecognitionButton.addEventListener('click', () => {
  // Requesting user permission for speech recognition
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.addEventListener('result', e => {
    const transcript = Array.from(e.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');

    // Call the GPT chatbot API to generate response from the command
    fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyInput.value}`
      },
      body: JSON.stringify({
        prompt: transcript,
        max_tokens: 60,
        temperature: 0.5,
        n: 1,
        stop: ['\n']
      })
    })
    .then(response => response.json())
    .then(data => {
      const answer = data.choices[0].text.trim();

      // Display the conversation
      conversationDisplay.innerHTML += `<p>You: ${transcript}</p><p>Chatbot: ${answer}</p>`;

      // Use Web Speech API to TTS the answer
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(answer);
      synth.speak(utterance);
    });
  });

  recognition.start();
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
