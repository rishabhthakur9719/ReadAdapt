if (!api.token) {
  window.location.href = '/login';
}

const userInfo = document.getElementById('user-info');
const navUsername = document.getElementById('nav-username');
const logoutBtn = document.getElementById('logout-btn');
const userMenuBtn = document.getElementById('user-menu-btn');
const userDropdown = document.getElementById('user-dropdown');
const profileBtn = document.getElementById('profile-btn');

const searchTopic = document.getElementById('search-topic');
const wordLimit = document.getElementById('word-limit');
const btnSearch = document.getElementById('btn-search');
const loadingSpinner = document.getElementById('loading-spinner');
const contentContainer = document.getElementById('content-container');
const generatedTitle = document.getElementById('generated-title');
const generatedContent = document.getElementById('generated-content');
const btnTakeReading = document.getElementById('btn-take-reading');
const btnTakeQuiz = document.getElementById('btn-take-quiz');

let currentUser = null;
let validatedTopic = '';
let validatedLimit = 100;

api.getMe().then(user => {
  if (!user.onboardingComplete) window.location.href = '/onboarding';
  currentUser = user;
  userInfo.innerText = `${user.email} (${user.specification})`;
  navUsername.innerText = user.email.split('@')[0];
  if(window.Theming) Theming.apply(user.specification);
}).catch(() => {
  window.location.href = '/login';
});

userMenuBtn.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
document.addEventListener('click', (e) => {
  if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
    userDropdown.classList.add('hidden');
  }
});

logoutBtn.addEventListener('click', () => {
  api.clearToken();
  sessionStorage.removeItem('currentGenerateTopic');
  sessionStorage.removeItem('currentGenerateText');
  window.location.href = '/login';
});

profileBtn.addEventListener('click', () => window.location.href = '/onboarding'); 

btnSearch.addEventListener('click', async () => {
  const topic = searchTopic.value.trim();
  const limit = parseInt(wordLimit.value) || 100;

  if (!topic) {
    alert("Please enter a topic to search.");
    return;
  }

  btnSearch.disabled = true;
  btnSearch.classList.add('opacity-50', 'cursor-not-allowed');
  contentContainer.classList.add('hidden');
  loadingSpinner.classList.remove('hidden');

  try {
    const res = await api.generateContent(topic, limit);
    const generatedText = res.text;

    sessionStorage.setItem('currentGenerateTopic', topic);
    sessionStorage.setItem('currentGenerateText', generatedText);
    
    validatedTopic = topic;
    validatedLimit = limit;
    
    generatedTitle.innerText = `${topic} Study Material`;
    generatedContent.innerText = generatedText;

    loadingSpinner.classList.add('hidden');
    contentContainer.classList.remove('hidden');

  } catch (error) {
    console.error("Dashboard API Error:", error);
    alert('Failed to generate content. Let\'s check that the API key is active.');
    loadingSpinner.classList.add('hidden');
  } finally {
    btnSearch.disabled = false;
    btnSearch.classList.remove('opacity-50', 'cursor-not-allowed');
  }
});

btnTakeReading.addEventListener('click', () => {
  window.location.href = `/reading-test?topic=${encodeURIComponent(validatedTopic)}&limit=${validatedLimit}`;
});

btnTakeQuiz.addEventListener('click', () => {
  window.location.href = `/quiz-test?topic=${encodeURIComponent(validatedTopic)}`;
});
