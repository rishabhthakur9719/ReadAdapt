if (!api.token) {
  window.location.href = '/login';
}

const topicTitle = document.getElementById('topic-title');
const quizContainer = document.getElementById('quiz-container');
const submitQuizBtn = document.getElementById('submit-quiz-btn');
const btnQuizNext = document.getElementById('btn-quiz-next');
const quizResult = document.getElementById('quiz-result');
const quizScoreText = document.getElementById('quiz-score-text');
const quizActions = document.getElementById('quiz-actions');
const quizConfigContainer = document.getElementById('quiz-config-container');
const btnStartQuiz = document.getElementById('btn-start-quiz');
const btnStartQuizMobile = document.getElementById('btn-start-quiz-mobile');
const quizNumQ = document.getElementById('quiz-num-q');
const quizDifficulty = document.getElementById('quiz-difficulty');

const params = new URLSearchParams(window.location.search);
const topic = params.get('topic') || 'General';

topicTitle.innerText = `${topic} Quiz`;

let currentUser = null;
let currentQuizzesData = [];
let currentMask = null;

api.getMe().then(user => {
  if (!user.onboardingComplete) window.location.href = '/onboarding';
  currentUser = user;
  if(window.Theming) Theming.apply(user.specification);
  // generateQuiz() removed from init.
}).catch(() => { window.location.href = '/login'; });

const initQuizFetch = () => {
    const num = parseInt(quizNumQ.value) || 3;
    const diff = quizDifficulty.value || 'Intermediate';
    const sourceText = sessionStorage.getItem('currentGenerateText');
    
    quizConfigContainer.style.display = 'none';
    quizContainer.style.display = 'block';
    
    generateQuiz(num, diff, sourceText);
};

btnStartQuiz.addEventListener('click', initQuizFetch);
btnStartQuizMobile.addEventListener('click', initQuizFetch);

async function generateQuiz(num, diff, sourceText) {
  try {
    const res = await api.generateQuiz(topic, num, diff, sourceText);
    currentQuizzesData = res.questions;
    
    // NEW: Check for Dyslexia mode and swap the text styling classes
    let qTextClass = "font-bold text-lg mb-4 text-slate-800";
    let optTextClass = "text-slate-700";
    if (currentUser.specification === 'Dyslexia') {
        qTextClass = "text-xl md:text-2xl text-slate-900 font-['Lexend'] font-bold tracking-[0.2em] leading-[2.5] mb-4";
        optTextClass = "text-lg md:text-xl text-slate-900 font-['Lexend'] font-bold tracking-[0.2em] leading-[2.5]";
    }

    quizContainer.classList.remove('flex', 'flex-col', 'justify-center');
    quizContainer.innerHTML = currentQuizzesData.map((q, qIndex) => `
      <div class="quiz-question-block bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <p class="${qTextClass}">${qIndex + 1}. ${q.question}</p>
        <div class="space-y-4 pl-2">
          ${q.options.map((opt, oIndex) => `
            <label class="flex items-center space-x-4 cursor-pointer p-3 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition">
              <input type="radio" name="q_${qIndex}" value="${oIndex}" class="w-5 h-5 mt-1 shrink-0 text-indigo-600 border-gray-300 focus:ring-indigo-500">
              <span class="${optTextClass}">${opt}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');

    quizActions.style.display = 'flex';

    if (currentUser.specification === 'ADHD') {
      const qBlocks = document.querySelectorAll('.quiz-question-block');
      qBlocks.forEach(block => block.classList.add('opacity-20', 'pointer-events-none'));
      currentMask = new AdhdQuizMask(btnQuizNext, submitQuizBtn);
    } else {
      submitQuizBtn.classList.remove('hidden');
    }

  } catch (e) {
    quizContainer.innerHTML = '<p class="text-red-500 font-bold">Error generating quiz. Please try again.</p>';
  }
}

submitQuizBtn.addEventListener('click', async () => {
  let score = 0;
  
  // Extract tracking array before replacing innerHTML
  const userAnswers = currentQuizzesData.map((q, idx) => {
    const selected = document.querySelector(`input[name="q_${idx}"]:checked`);
    return selected ? parseInt(selected.value) : -1;
  });

  // Inject review rendering
 // NEW: Check for Dyslexia mode and swap the text styling classes for the Review screen
  let qTextClass = "font-bold text-lg mb-4 text-slate-800";
  let optTextClass = "text-slate-700";
  if (currentUser.specification === 'Dyslexia') {
      qTextClass = "text-xl md:text-2xl text-slate-900 font-['Lexend'] font-bold tracking-[0.2em] leading-[2.5] mb-4";
      optTextClass = "text-lg md:text-xl text-slate-900 font-['Lexend'] font-bold tracking-[0.2em] leading-[2.5]";
  }

  // Inject review rendering
  quizContainer.innerHTML = currentQuizzesData.map((q, idx) => {
    const selectedVal = userAnswers[idx];
    if (selectedVal === q.correctIndex) {
      score++;
    }
    
    return `
      <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6">
        <p class="${qTextClass}">${idx + 1}. ${q.question}</p>
        <div class="space-y-4 pl-2">
          ${q.options.map((opt, oIndex) => {
             let optClass = 'bg-white border-slate-200';
             if (oIndex === q.correctIndex) {
                 optClass = 'bg-green-100 border-green-500 font-bold'; 
             } else if (oIndex === selectedVal && selectedVal !== q.correctIndex) {
                 optClass = 'bg-red-100 border-red-500 font-bold text-red-800'; 
             }
             return `
            <div class="flex items-start space-x-4 p-4 rounded-lg border transition ${optClass}">
              <span class="${optTextClass}">${opt}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  // Reveal review without Adhd constraints on results
  const newqElements = document.querySelectorAll('.quiz-question-block');
  newqElements.forEach(el => el.style.display = 'block');

  quizScoreText.innerText = `You scored ${score} out of ${currentQuizzesData.length}!`;
  quizResult.classList.remove('hidden');
  
  if(score === currentQuizzesData.length) {
    quizResult.classList.add('bg-green-100', 'text-green-800');
  } else {
    quizResult.classList.add('bg-yellow-100', 'text-yellow-800');
  }
  
  quizActions.style.display = 'none';
  
  try {
    await api.submitQuizReport(topic, score, currentQuizzesData.length);
  } catch(e) {
    console.error("Failed to save report");
  }
});
