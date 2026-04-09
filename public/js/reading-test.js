if (!api.token) {
  window.location.href = '/login';
}

const topicTitle = document.getElementById('topic-title');
const targetPassage = document.getElementById('target-passage');
const timerDisplay = document.getElementById('timer-display');
const adhdControls = document.getElementById('adhd-controls');
const btnNextSentence = document.getElementById('btn-next-sentence');
const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');
const transcriptPreview = document.getElementById('transcript-preview');

const params = new URLSearchParams(window.location.search);
const topic = params.get('topic') || 'General';
const limit = parseInt(params.get('limit')) || 100;

topicTitle.innerText = `${topic} Reading Test`;

let currentUser = null;
let currentMask = null;
let generatedPlainText = '';

api.getMe().then(user => {
  if (!user.onboardingComplete) window.location.href = '/onboarding';
  currentUser = user;
  if(window.Theming) Theming.apply(user.specification);
  generateContent();
}).catch(() => { window.location.href = '/login'; });

async function generateContent() {
  try {
    let resText = '';
    const cachedTopic = sessionStorage.getItem('currentGenerateTopic');
    const cachedText = sessionStorage.getItem('currentGenerateText');

    if (cachedTopic && cachedTopic.toLowerCase() === topic.toLowerCase() && cachedText) {
      resText = cachedText;
      // Also simulate a tiny delay so UI isn't jarringly fast
      await new Promise(r => setTimeout(r, 400));
    } else {
      const res = await api.generateContent(topic, limit);
      resText = res.text;
    }

    generatedPlainText = resText;
    
    // Enable Mic
    micBtn.disabled = false;
    micBtn.classList.remove('bg-slate-300', 'cursor-not-allowed');
    micBtn.classList.add('bg-sky-600', 'hover:bg-sky-700', 'hover:scale-105');
    micStatus.innerText = "Click the microphone to start reading";

    if (currentUser.specification === 'ADHD') {
      currentMask = new AdhdReadingMask(resText, targetPassage, btnNextSentence, adhdControls);
    } else {
      adhdControls.classList.add('hidden');
      targetPassage.innerHTML = `<p class="fade-in">${resText}</p>`;
    }

    // Calc time limit (assume 130 WPM)
    const words = resText.split(' ').length;
    const seconds = Math.ceil((words / 130) * 60);
    timerDisplay.innerText = `Time Limit: ${seconds}s`;
    timerDisplay.classList.remove('hidden');

  } catch (e) {
    console.error("Reading Test Gen Error", e);
    targetPassage.innerHTML = '<p class="text-red-500 font-bold">Error generating content. Please try again.</p>';
  }
}

// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  micStatus.innerText = "Speech API not supported in this browser.";
} else {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let isRecording = false;
  let finalTranscript = '';

  micBtn.addEventListener('click', () => {
    if (isRecording) {
      recognition.stop();
    } else {
      finalTranscript = '';
      transcriptPreview.innerText = '';
      recognition.start();
    }
  });

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add('bg-red-500', 'animate-pulse');
    micBtn.classList.remove('bg-sky-600');
    micStatus.innerText = "Listening...";
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      else interimTranscript += event.results[i][0].transcript;
    }
    transcriptPreview.innerText = finalTranscript + interimTranscript;
  };

  recognition.onend = async () => {
    isRecording = false;
    micBtn.classList.remove('bg-red-500', 'animate-pulse');
    micBtn.classList.add('bg-sky-600');
    micStatus.innerText = "Evaluating...";
    
    if (finalTranscript.trim().length > 0) {
      try {
        await api.sendEvaluation(finalTranscript); 
        micStatus.innerHTML = "Evaluation complete! <a href='/history' class='text-sky-600 underline font-bold'>View History</a>";
      } catch (error) {
        micStatus.innerText = "Failed to evaluate check console.";
      }
    } else {
      micStatus.innerText = "No speech detected. Click to try again.";
    }
  };
}
