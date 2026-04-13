if (!api.token) {
  window.location.href = '/login';
}

const topicTitle = document.getElementById('topic-title');
const targetPassage = document.getElementById('target-passage');
const timerDisplay = document.getElementById('timer-display');
const adhdControls = document.getElementById('adhd-controls');
const btnNextSentence = document.getElementById('btn-next-sentence');
const micBtn = document.getElementById('mic-btn');
const btnFinishReading = document.getElementById('btn-finish-reading');
const micStatus = document.getElementById('mic-status');
const transcriptPreview = document.getElementById('transcript-preview');

const params = new URLSearchParams(window.location.search);
const topic = params.get('topic') || 'General';
const limit = parseInt(params.get('limit')) || 100;

topicTitle.innerText = `${topic} Reading Test`;

let currentUser = null;
let currentMask = null;
let generatedPlainText = '';
let targetWordArray = [];
let remainingSeconds = 0;
let timerInterval = null;

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
      const adhdControls = document.getElementById('adhd-controls');
      const btnNextSentence = document.getElementById('btn-next-sentence');
      const btnPrevSentence = document.getElementById('btn-prev-sentence'); // Get new Prev button
      
      currentMask = new AdhdReadingMask(resText, targetPassage, btnPrevSentence, btnNextSentence, adhdControls);
      
    // NEW: Explicit Dyslexia Force-Styling for Reading Test
    } else if (currentUser.specification === 'Dyslexia') {
      adhdControls.classList.add('hidden');
      // Force the heavy classes directly into the paragraph tag
      targetPassage.innerHTML = `<p class="text-2xl md:text-3xl text-slate-700 font-['Lexend'] font-extrabold tracking-[0.2em] leading-[2.5] text-left p-4">${resText}</p>`;
      
    // Normal / Default check
    } else {
      adhdControls.classList.add('hidden');
      targetPassage.innerHTML = `<p class="fade-in text-lg md:text-xl text-slate-700 leading-relaxed text-justify">${resText}</p>`;
    }

    // Calc time limit (assume 130 WPM)
    targetWordArray = generatedPlainText.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(w => w.length > 0);

    const words = targetWordArray.length;
    remainingSeconds = Math.ceil((words / 130) * 60);
    timerDisplay.innerText = `Time Limit: ${remainingSeconds}s`;
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
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let isRecording = false;
  let finalTranscript = '';

  micBtn.addEventListener('click', () => {
    if (!isRecording) {
      finalTranscript = '';
      transcriptPreview.innerText = '';
      recognition.start();
      micBtn.classList.add('hidden');
      btnFinishReading.classList.remove('hidden');
    }
  });

  btnFinishReading.addEventListener('click', () => {
      recognition.stop();
      executeEvaluation();
  });

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add('bg-red-500', 'animate-pulse');
    micBtn.classList.remove('bg-sky-600');
    micStatus.innerText = "Listening...";

    // Start Timer
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
          clearInterval(timerInterval);
          timerDisplay.innerText = "Time's Up!";
          timerDisplay.classList.replace('text-sky-600', 'text-red-500');
          recognition.stop();
          executeEvaluation();
      } else {
          timerDisplay.innerText = `Time Limit: ${remainingSeconds}s`;
      }
    }, 1000);
  };

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + " ";
    }
    
    // Real time transcript tracking match logic
    const spokenArray = finalTranscript.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(w => w.length > 0);
    
    let previewHTML = '';
    for (let i = 0; i < spokenArray.length; i++) {
        if (targetWordArray[i] && targetWordArray[i] === spokenArray[i]) {
            previewHTML += `<span class="text-green-500">${spokenArray[i]}</span> `;
        } else {
            previewHTML += `<span class="text-red-500 font-bold">${spokenArray[i]}</span> `;
        }
    }
    transcriptPreview.innerHTML = previewHTML;
  };

  recognition.onend = () => {
     // Hardware cutoff fallback. Real evaluation runs on executeEvaluation button click.
     isRecording = false;
  };

  async function executeEvaluation() {
    isRecording = false;
    clearInterval(timerInterval);
    btnFinishReading.classList.add('hidden');
    micBtn.classList.remove('hidden', 'bg-red-500', 'animate-pulse');
    micBtn.classList.add('bg-sky-600');
    micStatus.innerText = "Evaluating...";
    
    if (finalTranscript.trim().length > 0) {
      const spokenWords = finalTranscript.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(w => w.length > 0);
      let correct = 0;
      let missedStr = '';
      
      const spokenSet = new Set(spokenWords);
      targetWordArray.forEach(word => {
          if(spokenSet.has(word)) correct++;
          else missedStr += `<span class="inline-block bg-red-100 text-red-600 px-2 py-1 rounded text-sm m-1">${word}</span>`;
      });
      const incorrect = targetWordArray.length - correct;
      
      transcriptPreview.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-4 text-center">
            <h4 class="font-bold text-2xl text-slate-800 mb-2">Result: <span class="text-red-500">${incorrect} Missed</span> / ${targetWordArray.length} Target Words</h4>
            <div class="text-sm text-slate-600 mt-4 leading-relaxed">
               <strong class="uppercase tracking-wider">Missed Words:</strong><br/>
               ${missedStr || '<span class="text-green-600 font-bold mt-2 inline-block">Perfect! No missed target words.</span>'}
            </div>
        </div>
      `;

      try {
        await api.sendEvaluation(finalTranscript, generatedPlainText); 
        micStatus.innerHTML = "Evaluation complete! <a href='/history' class='text-sky-600 underline font-bold px-4 py-2 border rounded hover:bg-sky-50 transition'>View History</a>";
      } catch (error) {
        micStatus.innerText = "Failed to evaluate against database.";
      }
    } else {
      micStatus.innerText = "No speech detected. Click mic to try again.";
    }
  }
}
