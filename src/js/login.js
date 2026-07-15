import { login, protegerLogin, resetPassword } from './auth.js';

// Evita acesso se já logado
protegerLogin();

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const submitBtn = document.getElementById('btnLogin');
  const btnText = submitBtn.querySelector('span');
  const btnSpinner = submitBtn.querySelector('.spinner');

  const forgotModal = document.getElementById('forgotPasswordModal');
  const forgotLink = document.getElementById('forgotPasswordLink');
  const closeForgotModal = document.getElementById('closeForgotModal');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const resetEmailInput = document.getElementById('resetEmail');
  const btnResetPassword = document.getElementById('btnResetPassword');
  const resetSuccessMessage = document.getElementById('resetSuccessMessage');

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
      submitBtn.disabled = false;
      btnText.style.display = 'block';
      btnSpinner.style.display = 'none';
    }
  });

  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotModal.style.display = 'flex';
    resetSuccessMessage.style.display = 'none';
    resetEmailInput.value = document.getElementById('email').value;
  });

  closeForgotModal.addEventListener('click', () => {
    forgotModal.style.display = 'none';
  });

  forgotModal.addEventListener('click', (e) => {
    if (e.target === forgotModal) {
      forgotModal.style.display = 'none';
    }
  });

  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = resetEmailInput.value.trim();
    
    try {
      btnResetPassword.disabled = true;
      btnResetPassword.querySelector('span').style.display = 'none';
      btnResetPassword.querySelector('.spinner').style.display = 'block';

      await resetPassword(email);
      
      resetSuccessMessage.style.display = 'block';
      btnResetPassword.querySelector('span').style.display = 'block';
      btnResetPassword.querySelector('.spinner').style.display = 'none';
      btnResetPassword.disabled = false;
      
      setTimeout(() => {
        forgotModal.style.display = 'none';
        resetSuccessMessage.style.display = 'none';
      }, 3000);
    } catch (error) {
      btnResetPassword.querySelector('span').style.display = 'block';
      btnResetPassword.querySelector('.spinner').style.display = 'none';
      btnResetPassword.disabled = false;
    }
  });
});
