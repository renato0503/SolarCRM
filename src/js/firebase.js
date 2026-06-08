import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
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
  deleteDoc
} from 'firebase/firestore';

// Configuração do Firebase carregada a partir de variáveis de ambiente do Vite (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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

// ==========================================
// EXPORTS DAS APIS DA APLICAÇÃO (FACADE)
// ==========================================

export const firebaseIsMock = () => isMock;

// --- LEADS ---

export async function dbAddLead(leadData) {
  const cleanLead = {
    nome: leadData.nome || '',
    telefone: leadData.telefone || '',
    email: leadData.email || '',
    endereco: leadData.endereco || '',
    consumo_mensal_kwh: Number(leadData.consumo_mensal_kwh) || 0,
    data_criacao: new Date().toISOString()
  };

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

export async function dbGetLeads() {
  if (!isMock) {
    try {
      const q = query(collection(db, 'leads'), orderBy('data_criacao', 'desc'));
      const querySnapshot = await getDocs(q);
      const leads = [];
      querySnapshot.forEach((doc) => {
        leads.push({ id: doc.id, ...doc.data() });
      });
      return leads;
    } catch (e) {
      console.error("Erro no Firestore ao buscar leads:", e);
      throw e;
    }
  } else {
    // Retorna ordenado por data_criacao desc
    return getMockLeads().sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
  }
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
  if (!isMock) {
    try {
      const docRef = doc(db, 'propostas', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (e) {
      console.error("Erro no Firestore ao buscar proposta:", e);
      throw e;
    }
  } else {
    const propostas = getMockPropostas();
    return propostas.find(p => p.id === id) || null;
  }
}

export async function dbGetLead(id) {
  if (!isMock) {
    try {
      const docRef = doc(db, 'leads', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (e) {
      console.error("Erro no Firestore ao buscar lead:", e);
      throw e;
    }
  } else {
    const leads = getMockLeads();
    return leads.find(l => l.id === id) || null;
  }
}

export async function dbGetProposals() {
  if (!isMock) {
    try {
      const q = query(collection(db, 'propostas'), orderBy('data_criacao', 'desc'));
      const querySnapshot = await getDocs(q);
      const propostas = [];
      querySnapshot.forEach((doc) => {
        propostas.push({ id: doc.id, ...doc.data() });
      });
      return propostas;
    } catch (e) {
      console.error("Erro no Firestore ao buscar propostas:", e);
      throw e;
    }
  } else {
    return getMockPropostas().sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
  }
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (e) {
      console.error("Erro no Firebase Auth:", e);
      throw e;
    }
  } else {
    // Autenticação mockada: aceita qualquer email de vendedor da empresa e senha >= 6 digitos
    if (email.includes('@solarcrm.com.br') || email === 'vendedor@solarcrm.com.br' || email === 'admin@admin.com') {
      if (password.length >= 6) {
        const user = { email, uid: 'mock_uid_123', displayName: 'Vendedor Solar' };
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
        // Dispara callback se registrado
        if (authCallback) authCallback(user);
        return user;
      }
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
