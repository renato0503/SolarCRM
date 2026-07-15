import { protegerRota } from '../auth.js';
import { 
  getEquipamentos, 
  saveEquipamento, 
  deleteEquipamento,
  authGetCurrentUser,
  getUserProfile 
} from '../firebase.js';
import { showToast, formatCurrency } from '../utils.js';

protegerRota(['admin']);

let equipamentosData = {};
let currentFilter = 'todos';

document.addEventListener('DOMContentLoaded', async () => {
  const user = authGetCurrentUser();
  if (user) {
    const profile = await getUserProfile(user.uid);
    document.getElementById('userEmail').textContent = `${user.email} (${profile?.role === 'admin' ? 'Admin' : 'Vendedor'})`;
  }

  await carregarEquipamentos();
  setupEventListeners();
});

async function carregarEquipamentos() {
  try {
    equipamentosData = await getEquipamentos();
    renderizarEquipamentos();
  } catch (e) {
    console.error(e);
    showToast('Erro ao carregar equipamentos', 'error');
  }
}

function setupEventListeners() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.tipo;
      renderizarEquipamentos();
    });
  });

  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const btnCloseEdit = document.getElementById('btnCloseEdit');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  btnCloseEdit.addEventListener('click', () => editModal.classList.remove('active'));
  btnCancelEdit.addEventListener('click', () => editModal.classList.remove('active'));
  
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.remove('active');
  });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await salvarEquipamento();
  });
}

function renderizarEquipamentos() {
  const container = document.getElementById('equipamentosList');
  container.innerHTML = '';

  if (currentFilter === 'todos') {
    for (const [tipo, items] of Object.entries(equipamentosData)) {
      if (Array.isArray(items)) {
        items.forEach(item => {
          container.appendChild(criarCardEquipamento(item, tipo));
        });
      } else if (tipo === 'estruturas') {
        for (const [key, item] of Object.entries(items)) {
          container.appendChild(criarCardEquipamento({ ...item, id: key }, 'estruturas'));
        }
      } else if (tipo === 'servicos') {
        container.appendChild(criarCardEquipamento(items, 'servicos'));
      }
    }
  } else if (currentFilter === 'estruturas') {
    for (const [key, item] of Object.entries(equipamentosData.estruturas || {})) {
      container.appendChild(criarCardEquipamento({ ...item, id: key }, 'estruturas'));
    }
  } else if (currentFilter === 'servicos') {
    container.appendChild(criarCardEquipamento(equipamentosData.servicos, 'servicos'));
  } else {
    const items = equipamentosData[currentFilter] || [];
    items.forEach(item => {
      container.appendChild(criarCardEquipamento(item, currentFilter));
    });
  }
}

function criarCardEquipamento(item, tipo) {
  const card = document.createElement('div');
  card.className = 'equipamento-card';
  
  const badgeClass = {
    paineis: 'badge-painel',
    inversores: 'badge-inversor',
    estruturas: 'badge-estrutura',
    kitsEletricos: 'badge-painel',
    servicos: 'badge-servico'
  }[tipo] || 'badge-painel';

  const tipoLabel = {
    paineis: 'Painel Solar',
    inversores: 'Inversor',
    estruturas: 'Estrutura',
    kitsEletricos: 'Kit Elétrico',
    servicos: 'Serviço'
  }[tipo] || tipo;

  let precoDisplay = '';
  if (tipo === 'paineis' || tipo === 'inversores') {
    precoDisplay = formatCurrency(item.precoUnitario);
  } else if (tipo === 'estruturas') {
    precoDisplay = formatCurrency(item.precoPorPainel) + '/painel';
  } else if (tipo === 'kitsEletricos') {
    precoDisplay = formatCurrency(item.precoBase);
  } else if (tipo === 'servicos') {
    precoDisplay = formatCurrency(item.custoFixo) + ' (fixo)';
  }

  let potenciaDisplay = '';
  if (item.potenciaW) potenciaDisplay = `${item.potenciaW}W`;
  else if (item.potenciaMaxW) potenciaDisplay = `${item.potenciaMaxW}W`;

  card.innerHTML = `
    <div class="equipamento-header">
      <div>
        <span class="badge ${badgeClass}">${tipoLabel}</span>
        <span class="equipamento-nome" style="margin-left: 0.75rem;">${item.nome}</span>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="action-btn edit-btn" data-id="${item.id}" data-tipo="${tipo}" title="Editar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div class="equipamento-meta">
        ${item.marca ? `Fornecedor: ${item.marca}` : ''}
        ${potenciaDisplay ? ` | ${potenciaDisplay}` : ''}
      </div>
      <div class="equipamento-preco">${precoDisplay}</div>
    </div>
  `;

  card.querySelector('.edit-btn').addEventListener('click', () => {
    abrirModalEdicao(item, tipo);
  });

  return card;
}

function abrirModalEdicao(item, tipo) {
  const editModal = document.getElementById('editModal');
  
  document.getElementById('editId').value = item.id;
  document.getElementById('editTipo').value = tipo;
  document.getElementById('editNome').value = item.nome || '';
  document.getElementById('editPreco').value = item.precoUnitario || item.precoPorPainel || item.precoBase || item.custoFixo || 0;
  document.getElementById('editMarca').value = item.marca || '';

  const potenciaGroup = document.getElementById('editPotenciaGroup');
  const potenciaInput = document.getElementById('editPotencia');
  
  if (tipo === 'paineis' || tipo === 'inversores') {
    potenciaGroup.style.display = 'block';
    potenciaInput.value = item.potenciaW || item.potenciaMaxW || '';
  } else {
    potenciaGroup.style.display = 'none';
    potenciaInput.value = '';
  }

  editModal.classList.add('active');
}

async function salvarEquipamento() {
  const id = document.getElementById('editId').value;
  const tipo = document.getElementById('editTipo').value;
  const nome = document.getElementById('editNome').value.trim();
  const preco = parseFloat(document.getElementById('editPreco').value);
  const marca = document.getElementById('editMarca').value.trim();
  const potencia = parseFloat(document.getElementById('editPotencia').value) || null;

  if (!nome || isNaN(preco)) {
    showToast('Preencha todos os campos corretamente', 'error');
    return;
  }

  try {
    const data = { id, nome, marca };
    
    if (tipo === 'paineis') {
      data.precoUnitario = preco;
      if (potencia) data.potenciaW = potencia;
    } else if (tipo === 'inversores') {
      data.precoUnitario = preco;
      if (potencia) data.potenciaMaxW = potencia;
    } else if (tipo === 'estruturas') {
      data.precoPorPainel = preco;
    } else if (tipo === 'kitsEletricos') {
      data.precoBase = preco;
    } else if (tipo === 'servicos') {
      data.custoFixo = preco;
    }

    await saveEquipamento(tipo, data);
    
    document.getElementById('editModal').classList.remove('active');
    showToast('Equipamento atualizado com sucesso!', 'success');
    await carregarEquipamentos();
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar equipamento', 'error');
  }
}