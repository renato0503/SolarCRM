import { login, protegerLogin } from './auth.js';

// Evita acesso se já logado
protegerLogin();

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const submitBtn = document.getElementById('btnLogin');
  const btnText = submitBtn.querySelector('span');
  const btnSpinner = submitBtn.querySelector('.spinner');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnSpinner.style.display = 'block';

      await login(email, password);
    } catch (error) {
      // Erro já é tratado com toast na função login()
      submitBtn.disabled = false;
      btnText.style.display = 'block';
      btnSpinner.style.display = 'none';
    }
  });
});
