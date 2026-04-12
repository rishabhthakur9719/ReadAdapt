if (!api.token) {
  window.location.href = '/login';
}

const reportsContainer = document.getElementById('reports-container');
const quizzesContainer = document.getElementById('quizzes-container');

api.getMe().then(user => {
  if (!user.onboardingComplete) window.location.href = '/onboarding';
  if(window.Theming) Theming.apply(user.specification);
  loadHistory();
}).catch(() => {
  window.location.href = '/login';
});

async function loadHistory() {
  api.getReports().then(renderReports).catch(console.error);
  api.getQuizzes().then(renderQuizzes).catch(console.error);
}

function renderReports(reports) {
  if (!reports || !reports.length) return reportsContainer.innerHTML = `<p class="text-slate-500 italic">No readings yet.</p>`;
  reportsContainer.innerHTML = reports.map(r => `
    <div class="p-4 border rounded-xl bg-slate-50 border-slate-200">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm text-slate-500">${new Date(r.date).toLocaleDateString()}</span>
        <span class="font-bold text-sky-600">${r.accuracyScore}% Accuracy</span>
      </div>
      <p class="text-sm text-slate-600 capitalize">${r.missedWords.length > 0 ? 'Missed Words: ' + r.missedWords.slice(0,5).join(', ') : 'Perfect reading!'}</p>
    </div>
  `).join('');

  if(reports && reports.length) {
       const dates = reports.map(r => new Date(r.date).toLocaleDateString()).reverse();
       const scores = reports.map(r => r.accuracyScore).reverse();
       
       const ctx = document.getElementById('accuracyChart').getContext('2d');
       new Chart(ctx, {
           type: 'line',
           data: {
               labels: dates,
               datasets: [{
                   label: 'Accuracy %',
                   data: scores,
                   borderColor: 'rgb(2, 132, 199)',
                   backgroundColor: 'rgba(2, 132, 199, 0.1)',
                   tension: 0.3,
                   fill: true
               }]
           },
           options: { scales: { y: { min: 0, max: 100 } } }
       });
  }
}

function renderQuizzes(quizzes) {
  if (!quizzes || !quizzes.length) return quizzesContainer.innerHTML = `<p class="text-slate-500 italic">No quizzes yet.</p>`;
  quizzesContainer.innerHTML = quizzes.map(q => `
    <div class="p-4 border rounded-xl bg-slate-50 border-slate-200">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-bold text-slate-700">${q.topic}</span>
        <span class="font-bold text-indigo-600 px-3 py-1 bg-indigo-100 rounded-full">${q.score} / ${q.totalQuestions}</span>
      </div>
      <span class="text-sm text-slate-500">${new Date(q.date).toLocaleDateString()}</span>
    </div>
  `).join('');

  if(quizzes && quizzes.length) {
       const dates = quizzes.map(q => new Date(q.date).toLocaleDateString()).reverse();
       const scores = quizzes.map(q => (q.score / q.totalQuestions) * 100).reverse();
       
       const ctx = document.getElementById('quizChart').getContext('2d');
       new Chart(ctx, {
           type: 'line',
           data: {
               labels: dates,
               datasets: [{
                   label: 'Score %',
                   data: scores,
                   borderColor: 'rgb(79, 70, 229)',
                   backgroundColor: 'rgba(79, 70, 229, 0.1)',
                   tension: 0.3,
                   fill: true
               }]
           },
           options: { scales: { y: { min: 0, max: 100 } } }
       });
  }
}
