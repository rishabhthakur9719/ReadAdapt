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
  generateQuiz();
}).catch(() => { window.location.href = '/login'; });

async function generateQuiz() {
  try {
    const res = await api.generateQuiz(topic, 3, 'Medium');
    currentQuizzesData = res.questions;
    
    quizContainer.classList.remove('flex', 'flex-col', 'justify-center');
    quizContainer.innerHTML = currentQuizzesData.map((q, qIndex) => `
      <div class="quiz-question-block bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <p class="font-bold text-lg mb-4 text-slate-800">${qIndex + 1}. ${q.question}</p>
        <div class="space-y-3 pl-2">
          ${q.options.map((opt, oIndex) => `
            <label class="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition">
              <input type="radio" name="q_${qIndex}" value="${oIndex}" class="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500">
              <span class="text-slate-700">${opt}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');

    quizActions.style.display = 'flex';

    if (currentUser.specification === 'ADHD') {
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
  currentQuizzesData.forEach((q, idx) => {
    const selected = document.querySelector(`input[name="q_${idx}"]:checked`);
    if (selected && parseInt(selected.value) === q.correctIndex) {
      score++;
    }
  });

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
