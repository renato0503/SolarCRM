import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy,
  deleteDoc,
  where
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js';

// Credenciais Firebase via variáveis de ambiente (nunca commitar .env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDStqxnwdR6hYxypR1Xm_2cLM0MQRphytE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "solarcrm-60ce1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "solarcrm-60ce1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "solarcrm-60ce1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "797245411122",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:797245411122:web:bcfa64de128b1fd5d1112b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XQQZCQQ1FE9"
};

let app, auth, db;
let isMock = false;

// Tenta inicializar o Firebase. Caso falte chaves ou dê erro, usa o MockDB (localStorage)
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'SUA_API_KEY';

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    getAnalytics(app);
    console.log("🔥 Firebase inicializado com sucesso!");
  } catch (error) {
    console.warn("⚠️ Falha ao conectar ao Firebase. Ativando Modo de Teste Local (MockDB):", error);
    isMock = true;
  }
} else {
  console.log("ℹ️ Credenciais do Firebase ausentes. Ativando Modo de Teste Local (MockDB).");
  isMock = true;
}

// ==========================================
// MOCK DATABASE & AUTH (LOCAL STORAGE)
// ==========================================
const MOCK_LEADS_KEY = 'solarcrm_mock_leads';
const MOCK_PROPOSTAS_KEY = 'solarcrm_mock_propostas';
const MOCK_USER_KEY = 'solarcrm_mock_user';

function getMockLeads() {
  const data = localStorage.getItem(MOCK_LEADS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMockLeads(leads) {
  localStorage.setItem(MOCK_LEADS_KEY, JSON.stringify(leads));
}

function getMockPropostas() {
  const data = localStorage.getItem(MOCK_PROPOSTAS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMockPropostas(propostas) {
  localStorage.setItem(MOCK_PROPOSTAS_KEY, JSON.stringify(propostas));
}

// Helpers para carregar dados estáticos do JSON do repositório (MVP)
async function fetchStaticPropostas() {
  try {
    const res = await fetch('./api/propostas.json');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Erro ao buscar propostas estáticas:", e);
  }
  return [];
}

async function fetchStaticLeads() {
  try {
    const res = await fetch('./api/leads.json');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Erro ao buscar leads estáticos:", e);
  }
  return [];
}

// ==========================================
// EXPORTS DAS APIS DA APLICAÇÃO (FACADE)
// ==========================================

export const firebaseIsMock = () => isMock;

// --- LEADS ---

export async function dbAddLead(leadData, vendedorId = null, vendedorNome = null) {
  const cleanLead = {
    nome: leadData.nome || '',
    telefone: leadData.telefone || '',
    email: leadData.email || '',
    endereco: leadData.endereco || '',
    consumo_mensal_kwh: Number(leadData.consumo_mensal_kwh) || 0,
    data_criacao: new Date().toISOString()
  };

  if (vendedorId) {
    cleanLead.vendedorId = vendedorId;
    cleanLead.vendedorNome = vendedorNome || 'Vendedor';
  }

  if (!isMock) {
    try {
      const docRef = await addDoc(collection(db, 'leads'), cleanLead);
      return { id: docRef.id, ...cleanLead };
    } catch (e) {
      console.error("Erro no Firestore ao salvar lead:", e);
      throw e;
    }
  } else {
    const leads = getMockLeads();
    const newLead = { id: 'lead_' + Math.random().toString(36).substr(2, 9), ...cleanLead };
    leads.push(newLead);
    saveMockLeads(leads);
    return newLead;
  }
}

export async function dbGetLeads(vendedorId = null, isAdminUser = false) {
  let list = [];
  if (!isMock) {
    try {
      let q;
      if (vendedorId && !isAdminUser) {
        q = query(collection(db, 'leads'), where('vendedorId', '==', vendedorId), orderBy('data_criacao', 'desc'));
      } else {
        q = query(collection(db, 'leads'), orderBy('data_criacao', 'desc'));
      }
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (e) {
      console.error("Erro no Firestore ao buscar leads:", e);
    }
  }

  const localList = getMockLeads();
  const staticList = await fetchStaticLeads();
  
  let combined = [...localList];
  staticList.forEach(item => {
    if (!combined.some(c => c.id === item.id)) {
      combined.push(item);
    }
  });

  if (vendedorId && !isAdminUser) {
    combined = combined.filter(l => l.vendedorId === vendedorId);
  }

  return combined.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
}

// --- PROPOSTAS ---

export async function dbAddProposal(proposalData) {
  const cleanProposal = {
    ...proposalData,
    data_criacao: proposalData.dataCriacao || new Date().toISOString()
  };
  delete cleanProposal.dataCriacao; // padroniza para snake_case no banco

  if (!isMock) {
    try {
      // Usaremos o mesmo ID para a proposta e o lead se possível, ou um ID gerado
      const docRef = await addDoc(collection(db, 'propostas'), cleanProposal);
      return { id: docRef.id, ...cleanProposal };
    } catch (e) {
      console.error("Erro no Firestore ao salvar proposta:", e);
      throw e;
    }
  } else {
    const propostas = getMockPropostas();
    const newProposal = { id: 'prop_' + Math.random().toString(36).substr(2, 9), ...cleanProposal };
    propostas.push(newProposal);
    saveMockPropostas(propostas);
    return newProposal;
  }
}

export async function dbGetProposal(id) {
  let proposal = null;
  if (!isMock) {
    try {
      const docRef = doc(db, 'propostas', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        proposal = { id: docSnap.id, ...docSnap.data() };
      }
    } catch (e) {
      console.error("Erro no Firestore ao buscar proposta:", e);
    }
  }

  if (proposal) return proposal;

  const propostas = getMockPropostas();
  proposal = propostas.find(p => p.id === id) || null;
  if (proposal) return proposal;

  const staticPropostas = await fetchStaticPropostas();
  return staticPropostas.find(p => p.id === id) || null;
}

export async function dbGetLead(id) {
  let lead = null;
  if (!isMock) {
    try {
      const docRef = doc(db, 'leads', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        lead = { id: docSnap.id, ...docSnap.data() };
      }
    } catch (e) {
      console.error("Erro no Firestore ao buscar lead:", e);
    }
  }

  if (lead) return lead;

  const leads = getMockLeads();
  lead = leads.find(l => l.id === id) || null;
  if (lead) return lead;

  const staticLeads = await fetchStaticLeads();
  return staticLeads.find(l => l.id === id) || null;
}

export async function dbGetProposals() {
  let list = [];
  if (!isMock) {
    try {
      const q = query(collection(db, 'propostas'), orderBy('data_criacao', 'desc'));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (e) {
      console.error("Erro no Firestore ao buscar propostas:", e);
    }
  }

  const localList = getMockPropostas();
  const staticList = await fetchStaticPropostas();

  const combined = [...localList];
  staticList.forEach(item => {
    if (!combined.some(c => c.id === item.id)) {
      combined.push(item);
    }
  });

  return combined.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
}

export async function dbUpdateProposalStatus(id, newStatus) {
  if (!isMock) {
    try {
      const docRef = doc(db, 'propostas', id);
      await updateDoc(docRef, { status: newStatus });
      return true;
    } catch (e) {
      console.error("Erro no Firestore ao atualizar status da proposta:", e);
      throw e;
    }
  } else {
    const propostas = getMockPropostas();
    const index = propostas.findIndex(p => p.id === id);
    if (index !== -1) {
      propostas[index].status = newStatus;
      saveMockPropostas(propostas);
      return true;
    }
    return false;
  }
}

export async function dbDeleteLeadAndProposal(leadId) {
  if (!isMock) {
    try {
      // Exclui o lead
      await deleteDoc(doc(db, 'leads', leadId));
      
      // Exclui propostas ligadas a esse lead
      const propostas = await dbGetProposals();
      const propsDoLead = propostas.filter(p => p.lead_id === leadId);
      for (const p of propsDoLead) {
        await deleteDoc(doc(db, 'propostas', p.id));
      }
      return true;
    } catch (e) {
      console.error("Erro ao deletar lead/proposta:", e);
      throw e;
    }
  } else {
    // Mock
    let leads = getMockLeads();
    leads = leads.filter(l => l.id !== leadId);
    saveMockLeads(leads);

    let propostas = getMockPropostas();
    propostas = propostas.filter(p => p.lead_id !== leadId);
    saveMockPropostas(propostas);
    return true;
  }
}

// --- AUTHENTICATION ---

export async function authLogin(email, password) {
  if (!isMock) {
    try {
      if (auth && auth.currentUser) {
        await signOut(auth);
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        const isAdminEmail = email === 'admin@admin.com' || email.includes('admin');
        await setDoc(docRef, {
          email: user.email,
          nome: user.displayName || (isAdminEmail ? 'Administrador' : 'Vendedor'),
          role: isAdminEmail ? 'admin' : 'vendedor',
          createdAt: new Date().toISOString()
        });
      }
      
      return user;
    } catch (e) {
      console.error("Erro no Firebase Auth:", e);
      throw e;
    }
  } else {
    localStorage.removeItem(MOCK_USER_KEY);
    const isAdminEmail = email === 'admin@admin.com' || email.includes('admin');
    const isValidDomain = email.includes('@solarcrm.com.br') || email === 'vendedor@solarcrm.com.br' || isAdminEmail;
    
    if (isValidDomain && password.length >= 6) {
      const uid = isAdminEmail ? 'mock_admin_001' : 'mock_vendedor_001';
      const role = isAdminEmail ? 'admin' : 'vendedor';
      const user = { 
        email, 
        uid, 
        displayName: isAdminEmail ? 'Administrador' : 'Vendedor Solar' 
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
      localStorage.setItem('solarcrm_user_profile_' + uid, JSON.stringify({ 
        id: uid, 
        role, 
        nome: user.displayName,
        email 
      }));
      
      if (authCallback) authCallback(user);
      return user;
    }
    throw new Error("Credenciais inválidas. Use um e-mail com @solarcrm.com.br e senha de 6+ dígitos.");
  }
}

export async function authLogout() {
  if (!isMock) {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Erro ao deslogar:", e);
      throw e;
    }
  } else {
    localStorage.removeItem(MOCK_USER_KEY);
    if (authCallback) authCallback(null);
  }
}

let authCallback = null;

export function authOnStateChange(callback) {
  if (!isMock) {
    return onAuthStateChanged(auth, callback);
  } else {
    authCallback = callback;
    const user = authGetCurrentUser();
    callback(user);
    // Retorna uma função de unsubscribe vazia
    return () => { authCallback = null; };
  }
}

export function authGetCurrentUser() {
  if (!isMock) {
    return auth ? auth.currentUser : null;
  } else {
    const user = localStorage.getItem(MOCK_USER_KEY);
    return user ? JSON.parse(user) : null;
  }
}

export async function authSendPasswordReset(email) {
  if (!isMock) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (e) {
      console.error("Erro ao enviar reset de senha:", e);
      throw e;
    }
  } else {
    if (email.includes('@solarcrm.com.br') || email === 'admin@admin.com' || email === 'vendedor@solarcrm.com.br') {
      return { success: true };
    }
    throw new Error("E-mail não encontrado.");
  }
}

export async function getUserProfile(uid) {
  if (!isMock) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (e) {
      console.error("Erro ao buscar perfil do usuário:", e);
      return null;
    }
  } else {
    const stored = localStorage.getItem('solarcrm_user_profile_' + uid);
    if (stored) {
      return JSON.parse(stored);
    }
    return { id: uid, role: 'vendedor', nome: 'Vendedor Solar' };
  }
}

export async function setUserProfile(uid, data) {
  if (!isMock) {
    try {
      await setDoc(doc(db, 'users', uid), data, { merge: true });
      return true;
    } catch (e) {
      console.error("Erro ao salvar perfil do usuário:", e);
      return false;
    }
  } else {
    localStorage.setItem('solarcrm_user_profile_' + uid, JSON.stringify(data));
    return true;
  }
}

export function isAdmin(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return false;
}

export function isVendedor(user) {
  if (!user) return false;
  return user.role === 'vendedor' || user.role === 'admin';
}

const MOCK_AUDIT_KEY = 'solarcrm_mock_audit';

function getMockAudit() {
  const data = localStorage.getItem(MOCK_AUDIT_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMockAudit(audit) {
  localStorage.setItem(MOCK_AUDIT_KEY, JSON.stringify(audit));
}

export async function logAudit(action, entityType, entityId, userId, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    id: 'audit_' + Date.now(),
    action,
    entityType,
    entityId,
    userId,
    details,
    timestamp
  };

  if (!isMock) {
    try {
      await addDoc(collection(db, 'audit_log'), logEntry);
      return logEntry;
    } catch (e) {
      console.error("Erro ao salvar log de auditoria:", e);
      return null;
    }
  } else {
    const audit = getMockAudit();
    audit.unshift(logEntry);
    if (audit.length > 500) audit.pop();
    saveMockAudit(audit);
    return logEntry;
  }
}

export async function getAuditLog(limitCount = 100) {
  if (!isMock) {
    try {
      const q = query(collection(db, 'audit_log'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      return logs.slice(0, limitCount);
    } catch (e) {
      console.error("Erro ao buscar logs de auditoria:", e);
      return [];
    }
  } else {
    const audit = getMockAudit();
    return audit.slice(0, limitCount);
  }
}

const MOCK_EQUIPAMENTOS_KEY = 'solarcrm_mock_equipamentos';
let equipamentosCache = null;

export function getEquipamentosLocais() {
  return {
    paineis: [
      { id: "painel_dah_620", nome: "Módulo DAH Solar 620W Monocristalino Bifacial N-TopCon", potenciaW: 620, precoUnitario: 410.00, marca: "DAH Solar", largura: 1.16, altura: 2.38, area: 2.76, eficiencia: 22.60 },
      { id: "painel_ronma_610", nome: "Módulo Ronma Solar 610W Monocristalino Bifacial", potenciaW: 610, precoUnitario: 395.00, marca: "Ronma Solar", largura: 1.134, altura: 2.275, area: 2.58, eficiencia: 22.50 },
      { id: "painel_sunova_590", nome: "Módulo Sunova Tangra 590W Monocristalino", potenciaW: 590, precoUnitario: 380.00, marca: "Sunova", largura: 1.134, altura: 2.275, area: 2.58, eficiencia: 22.10 },
      { id: "painel_jinko_585", nome: "Módulo Jinko Tiger Neo 585W Monocristalino N-Type", potenciaW: 585, precoUnitario: 420.00, marca: "Jinko Solar", largura: 1.134, altura: 1.905, area: 2.16, eficiencia: 22.65 },
      { id: "painel_ja_550", nome: "Módulo JA Solar JAM 550W Monocristalino", potenciaW: 550, precoUnitario: 350.00, marca: "JA Solar", largura: 1.134, altura: 2.275, area: 2.58, eficiencia: 21.30 }
    ],
    inversores: [
      { id: "inv_sof_75", nome: "Inversor Sofar 7.5KTLM Bifásico 220V", potenciaMaxW: 7500, precoUnitario: 2800.00, marca: "Sofar", tipo: "bifasico", fases: 2, mppt: 2 },
      { id: "inv_sof_6", nome: "Inversor Sofar 6KTLM-G2 Bifásico 220V", potenciaMaxW: 6000, precoUnitario: 2500.00, marca: "Sofar", tipo: "bifasico", fases: 2, mppt: 2 },
      { id: "inv_solis_8", nome: "Inversor Solis 8kW Bifásico 220V S6-GR1P8K", potenciaMaxW: 8000, precoUnitario: 2900.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 2 },
      { id: "inv_solis_10", nome: "Inversor Solis 10kW Bifásico 220V 1P10K-4G", potenciaMaxW: 10000, precoUnitario: 3400.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 2 },
      { id: "inv_solis_7", nome: "Inversor Solis 7kW Bifásico 220V 1P7K-5G", potenciaMaxW: 7000, precoUnitario: 2600.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 2 },
      { id: "inv_solis_5", nome: "Inversor Solis 5kW Bifásico 220V S6-GR1P5K", potenciaMaxW: 5000, precoUnitario: 2100.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 1 },
      { id: "inv_solis_4", nome: "Inversor Solis 4kW Bifásico 220V S6-GR1P4K", potenciaMaxW: 4000, precoUnitario: 1900.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 1 },
      { id: "inv_gro_6", nome: "Inversor Growatt MIN 6KTL Bifásico 220V", potenciaMaxW: 6000, precoUnitario: 2400.00, marca: "Growatt", tipo: "bifasico", fases: 2, mppt: 2 },
      { id: "inv_gro_8", nome: "Inversor Growatt MIN 8KTL Bifásico 220V", potenciaMaxW: 8000, precoUnitario: 3000.00, marca: "Growatt", tipo: "bifasico", fases: 2, mppt: 2 },
      { id: "inv_gro_10", nome: "Inversor Growatt MIN 10KTL Bifásico 220V", potenciaMaxW: 10000, precoUnitario: 3600.00, marca: "Growatt", tipo: "bifasico", fases: 2, mppt: 2 },
      { id: "inv_gro_15", nome: "Inversor Growatt MID 15K Trifásico 380V", potenciaMaxW: 15000, precoUnitario: 4800.00, marca: "Growatt", tipo: "trifasico", fases: 3, mppt: 2 },
      { id: "inv_gro_20", nome: "Inversor Growatt MID 20K Trifásico 380V", potenciaMaxW: 20000, precoUnitario: 5800.00, marca: "Growatt", tipo: "trifasico", fases: 3, mppt: 2 },
      { id: "inv_deye_2", nome: "Inversor Deye SUN2000 Bifásico 220V", potenciaMaxW: 2000, precoUnitario: 1600.00, marca: "Deye", tipo: "bifasico", fases: 2, mppt: 1 },
      { id: "inv_deye_1", nome: "Inversor Deye SUN1000 Bifásico 220V", potenciaMaxW: 1000, precoUnitario: 1200.00, marca: "Deye", tipo: "bifasico", fases: 2, mppt: 1 },
      { id: "inv_fro_4", nome: "Inversor Fronius Primo 4.0-1 Bifásico 220V", potenciaMaxW: 4000, precoUnitario: 3800.00, marca: "Fronius", tipo: "bifasico", fases: 2, mppt: 2 },
      { id: "inv_fro_10", nome: "Inversor Fronius Symo 10.0-3 Trifásico 380V", potenciaMaxW: 10000, precoUnitario: 7200.00, marca: "Fronius", tipo: "trifasico", fases: 3, mppt: 2 }
    ],
    estruturas: {
      ceramica: { nome: "Estrutura para Telha Cerâmica", precoPorPainel: 110.00 },
      metalica: { nome: "Estrutura para Telha Metálica", precoPorPainel: 75.00 },
      laje: { nome: "Estrutura com Suporte para Laje / Solo", precoPorPainel: 180.00 },
      fibrocimento: { nome: "Estrutura para Telha Fibrocimento / Ondulada", precoPorPainel: 85.00 },
      fibro_madeira: { nome: "Estrutura para Telha Fibrocimento base Madeira", precoPorPainel: 95.00 }
    },
    kitsEletricos: [
      { id: "kit_eletrico_padrao", nome: "Kit Elétrico (Cabos CC 4mm², Conectores MC4 Staubli, String Box)", precoBase: 1100.00, precoAdicionalPorKw: 120.00, itens: ["Cabo 4mm² Preto 50m", "Cabo 4mm² Vermelho 50m", "Conectores MC4 (2 pares)", "String Box com DPS"] }
    ],
    servicos: { nome: "Projeto de Engenharia, ART, Homologação e Mão de Obra de Instalação", custoFixo: 2200.00, custoPorKwp: 350.00 },
    frete: { minimo: 350.00, medio: 650.00, maximo: 1100.00 }
  };
}

export async function getEquipamentos() {
  if (equipamentosCache) {
    return equipamentosCache;
  }

  if (!isMock) {
    try {
      const equipamentos = {};
      const tipos = ['paineis', 'inversores', 'kitsEletricos'];
      
      for (const tipo of tipos) {
        const q = query(collection(db, 'equipamentos'), where('tipo', '==', tipo), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        equipamentos[tipo] = [];
        querySnapshot.forEach((doc) => {
          equipamentos[tipo].push({ id: doc.id, ...doc.data() });
        });
      }

      const qEstrutura = query(collection(db, 'equipamentos'), where('tipo', '==', 'estruturas'), where('active', '==', true));
      const estruturaSnap = await getDocs(qEstrutura);
      equipamentos.estruturas = {};
      estruturaSnap.forEach((doc) => {
        equipamentos.estruturas[doc.id] = { id: doc.id, ...doc.data() };
      });

      const qServicos = query(collection(db, 'equipamentos'), where('tipo', '==', 'servicos'), where('active', '==', true));
      const servicosSnap = await getDocs(qServicos);
      if (!servicosSnap.empty) {
        const servicosData = servicosSnap.docs[0].data();
        equipamentos.servicos = { id: servicosSnap.docs[0].id, ...servicosData };
      } else {
        equipamentos.servicos = getEquipamentosLocais().servicos;
      }

      const qFrete = query(collection(db, 'equipamentos'), where('tipo', '==', 'frete'), where('active', '==', true));
      const freteSnap = await getDocs(qFrete);
      if (!freteSnap.empty) {
        const freteData = freteSnap.docs[0].data();
        equipamentos.frete = { id: freteSnap.docs[0].id, ...freteData };
      } else {
        equipamentos.frete = getEquipamentosLocais().frete;
      }

      equipamentosCache = equipamentos;
      return equipamentos;
    } catch (e) {
      console.error("Erro ao buscar equipamentos do Firestore:", e);
      return getEquipamentosLocais();
    }
  } else {
    const stored = localStorage.getItem(MOCK_EQUIPAMENTOS_KEY);
    if (stored) {
      equipamentosCache = JSON.parse(stored);
      return equipamentosCache;
    }
    const locais = getEquipamentosLocais();
    equipamentosCache = locais;
    return locais;
  }
}

export async function saveEquipamento(tipo, data) {
  const now = new Date().toISOString();
  
  if (!isMock) {
    try {
      const docData = {
        tipo,
        ...data,
        updatedAt: now,
        active: true
      };
      
      if (data.id) {
        await setDoc(doc(db, 'equipamentos', data.id), docData, { merge: true });
        return { success: true, id: data.id };
      } else {
        const docRef = await addDoc(collection(db, 'equipamentos'), {
          ...docData,
          createdAt: now
        });
        return { success: true, id: docRef.id };
      }
    } catch (e) {
      console.error("Erro ao salvar equipamento:", e);
      throw e;
    }
  } else {
    const stored = localStorage.getItem(MOCK_EQUIPAMENTOS_KEY);
    let equipList = stored ? JSON.parse(stored) : {};
    
    if (!equipList[tipo]) {
      equipList[tipo] = [];
    }
    
    if (data.id) {
      const index = equipList[tipo].findIndex(e => e.id === data.id);
      if (index !== -1) {
        equipList[tipo][index] = { ...equipList[tipo][index], ...data, updatedAt: now };
      } else {
        equipList[tipo].push({ id: data.id, ...data, updatedAt: now, active: true });
      }
    } else {
      const newId = tipo + '_' + Date.now();
      equipList[tipo].push({ id: newId, ...data, createdAt: now, updatedAt: now, active: true });
    }
    
    localStorage.setItem(MOCK_EQUIPAMENTOS_KEY, JSON.stringify(equipList));
    equipamentosCache = null;
    return { success: true };
  }
}

export async function deleteEquipamento(tipo, id) {
  if (!isMock) {
    try {
      await updateDoc(doc(db, 'equipamentos', id), { active: false, deletedAt: new Date().toISOString() });
      return { success: true };
    } catch (e) {
      console.error("Erro ao deletar equipamento:", e);
      throw e;
    }
  } else {
    const stored = localStorage.getItem(MOCK_EQUIPAMENTOS_KEY);
    let equipList = stored ? JSON.parse(stored) : {};
    
    if (equipList[tipo]) {
      equipList[tipo] = equipList[tipo].filter(e => e.id !== id);
      localStorage.setItem(MOCK_EQUIPAMENTOS_KEY, JSON.stringify(equipList));
      equipamentosCache = null;
    }
    return { success: true };
  }
}

export function invalidateEquipamentosCache() {
  equipamentosCache = null;
}

const MOCK_INTERACOES_KEY = 'solarcrm_mock_interacoes';

export async function dbAddInteracao(interacaoData) {
  const cleanInteracao = {
    leadId: interacaoData.leadId,
    tipo: interacaoData.tipo || 'nota',
    descricao: interacaoData.descricao || '',
    vendedorId: interacaoData.vendedorId || null,
    vendedorNome: interacaoData.vendedorNome || 'Vendedor',
    data: new Date().toISOString(),
    proximoContato: interacaoData.proximoContato || null
  };

  if (!isMock) {
    try {
      const docRef = await addDoc(collection(db, 'interacoes'), cleanInteracao);
      return { id: docRef.id, ...cleanInteracao };
    } catch (e) {
      console.error("Erro no Firestore ao salvar interação:", e);
      throw e;
    }
  } else {
    const interacoes = JSON.parse(localStorage.getItem(MOCK_INTERACOES_KEY) || '[]');
    const newInteracao = { id: 'int_' + Date.now(), ...cleanInteracao };
    interacoes.unshift(newInteracao);
    if (interacoes.length > 500) interacoes.pop();
    localStorage.setItem(MOCK_INTERACOES_KEY, JSON.stringify(interacoes));
    return newInteracao;
  }
}

export async function dbGetInteracoes(leadId) {
  if (!isMock) {
    try {
      const q = query(
        collection(db, 'interacoes'), 
        where('leadId', '==', leadId),
        orderBy('data', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (e) {
      console.error("Erro no Firestore ao buscar interações:", e);
      return [];
    }
  } else {
    const interacoes = JSON.parse(localStorage.getItem(MOCK_INTERACOES_KEY) || '[]');
    return interacoes.filter(i => i.leadId === leadId).sort((a, b) => new Date(b.data) - new Date(a.data));
  }
}

export async function dbUpdateLead(leadId, data) {
  if (!isMock) {
    try {
      await updateDoc(doc(db, 'leads', leadId), data);
      return true;
    } catch (e) {
      console.error("Erro ao atualizar lead:", e);
      return false;
    }
  } else {
    const leads = getMockLeads();
    const index = leads.findIndex(l => l.id === leadId);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...data };
      saveMockLeads(leads);
      return true;
    }
    return false;
  }
}
