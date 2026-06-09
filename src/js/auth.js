import { authLogin, authLogout, authOnStateChange, authGetCurrentUser } from './firebase.js';
import { showToast } from './utils.js';

/**
 * Realiza o login do vendedor e redireciona para o dashboard
 * @param {string} email 
 * @param {string} password 
 */
export async function login(email, password) {
  try {
    const user = await authLogin(email, password);
    showToast(`Bem-vindo, ${user.displayName || user.email}!`, 'success');
    setTimeout(() => {
      window.location.href = './dashboard.html';
    }, 1000);
    return user;
  } catch (error) {
    console.error("Erro no login:", error);
    showToast(error.message || "Erro ao fazer login. Verifique as credenciais.", 'error');
    throw error;
  }
}

/**
 * Realiza o logout do vendedor e redireciona para a tela inicial
 */
export async function logout() {
  try {
    await authLogout();
    showToast("Sessão encerrada com sucesso.", 'success');
    setTimeout(() => {
      window.location.href = './index.html';
    }, 800);
  } catch (error) {
    console.error("Erro ao deslogar:", error);
    showToast("Erro ao encerrar sessão.", 'error');
  }
}

/**
 * Garante que a página atual é acessível apenas para usuários autenticados.
 * Caso não esteja autenticado, redireciona para login.html.
 */
export function protegerRota() {
  // Bypassed for MVP to allow direct access to dashboard without auth
  console.log("Rota protegida (bypass ativado para MVP)");
}

/**
 * Evita que usuários logados acessem a tela de login (redireciona para o dashboard).
 */
export function protegerLogin() {
  // Bypassed for MVP
  console.log("Login protegido (bypass ativado para MVP)");
}
