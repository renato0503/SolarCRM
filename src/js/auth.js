import { authLogin, authLogout, authOnStateChange, authGetCurrentUser, authSendPasswordReset, getUserProfile, isAdmin, isVendedor, logAudit } from './firebase.js';
import { showToast } from './utils.js';

/**
 * Envia email de redefinição de senha
 * @param {string} email 
 */
export async function resetPassword(email) {
  try {
    await authSendPasswordReset(email);
    showToast(`Email de redefinição enviado para ${email}`, 'success');
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar reset:", error);
    showToast(error.message || "Erro ao enviar email de redefinição.", 'error');
    throw error;
  }
}

/**
 * Verifica se o usuário atual é administrador
 * @returns {Promise<boolean>}
 */
export async function checkIsAdmin() {
  const user = authGetCurrentUser();
  if (!user) return false;
  const profile = await getUserProfile(user.uid);
  return profile && profile.role === 'admin';
}

/**
 * Verifica se o usuário tem uma role específica
 * @param {string} role - 'admin' ou 'vendedor'
 * @returns {Promise<boolean>}
 */
export async function checkRole(role) {
  const user = authGetCurrentUser();
  if (!user) return false;
  const profile = await getUserProfile(user.uid);
  return profile && profile.role === role;
}

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

export async function reauth(password) {
  try {
    await authReauthenticate(password);
    showToast("Reautenticação realizada com sucesso.", 'success');
    return { success: true };
  } catch (error) {
    console.error("Erro na reautenticação:", error);
    showToast(error.message || "Erro ao reautenticar. Verifique sua senha.", 'error');
    throw error;
  }
}

/**
 * Garante que a página atual é acessível apenas para usuários autenticados.
 * Caso não esteja autenticado, redireciona para login.html.
 * @param {string[]} [allowedRoles] - Roles permitidos para acessar a página
 */
export function protegerRota(allowedRoles) {
  authOnStateChange(async (user) => {
    if (!user) {
      window.location.href = './login.html';
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const profile = await getUserProfile(user.uid);
      if (!profile || !allowedRoles.includes(profile.role)) {
        showToast('Acesso não autorizado para esta função.', 'error');
        window.location.href = './dashboard.html';
        return;
      }
    }

    console.log("Rota protegida - acesso permitido");
  });
}

/**
 * Evita que usuários logados acessem a tela de login (redireciona para o dashboard).
 */
export function protegerLogin() {
  authOnStateChange((user) => {
    if (user) {
      window.location.href = './dashboard.html';
    }
  });
}

/**
 * Registra uma alteração de status de lead/proposta para auditoria
 * @param {string} action - 'create' | 'update' | 'delete' | 'status_change'
 * @param {string} entityType - 'lead' | 'proposal'
 * @param {string} entityId - ID da entidade
 * @param {Object} details - Detalhes da alteração
 */
export async function auditAction(action, entityType, entityId, details = {}) {
  const user = authGetCurrentUser();
  if (!user) return;
  
  const userProfile = await getUserProfile(user.uid);
  await logAudit(action, entityType, entityId, user.uid, {
    ...details,
    userEmail: user.email,
    userName: userProfile?.nome || user.displayName,
    userRole: userProfile?.role || 'unknown'
  });
}

/**
 * Registra login do usuário
 */
export async function auditLogin() {
  const user = authGetCurrentUser();
  if (!user) return;
  
  await logAudit('login', 'user', user.uid, user.uid, {
    email: user.email,
    timestamp: new Date().toISOString()
  });
}

/**
 * Registra logout do usuário
 */
export async function auditLogout() {
  const user = authGetCurrentUser();
  if (!user) return;
  
  await logAudit('logout', 'user', user.uid, user.uid, {
    email: user.email,
    timestamp: new Date().toISOString()
  });
}
