const form = document.getElementById('onboarding-form');
const specSelect = document.getElementById('specification');
const submitBtn = document.getElementById('submit-btn');
const errorBox = document.getElementById('error-box');

if (!api.token) {
  window.location.href = '/login';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('hidden');

  try {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Saving...';

    await api.completeOnboarding({
      specification: specSelect.value
    });

    window.location.href = '/dashboard';
  } catch (error) {
    errorBox.innerText = error.message;
    errorBox.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.innerText = 'Complete Setup';
  }
});
