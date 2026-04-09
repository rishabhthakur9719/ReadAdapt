let isLoginMode = true;

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const authSubtitle = document.getElementById('auth-subtitle');
const switchText = document.getElementById('switch-text');
const switchBtn = document.getElementById('switch-btn');
const errorBox = document.getElementById('error-box');

// Redirect if already logged in
if (api.token) {
  api.getMe().then(user => {
    if (user.onboardingComplete) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/onboarding';
    }
  }).catch(() => {
    api.clearToken();
  });
}

switchBtn.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  if (isLoginMode) {
    authSubtitle.innerText = 'Sign in to your account';
    submitBtn.innerText = 'Login';
    switchText.innerText = "Don't have an account?";
    switchBtn.innerText = 'Sign up';
  } else {
    authSubtitle.innerText = 'Create a new account';
    submitBtn.innerText = 'Register';
    switchText.innerText = 'Already have an account?';
    switchBtn.innerText = 'Sign in';
  }
  errorBox.style.display = 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';

  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Loading...';

    let res;
    if (isLoginMode) {
      res = await api.login(email, password);
    } else {
      res = await api.register(email, password);
    }

    if (res.user.onboardingComplete) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/onboarding';
    }
  } catch (error) {
    errorBox.innerText = error.message;
    errorBox.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.innerText = isLoginMode ? 'Login' : 'Register';
  }
});
