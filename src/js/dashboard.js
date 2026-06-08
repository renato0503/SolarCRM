import { protegerRota, logout } from './auth.js';
import { 
  dbGetLeads, 
  dbGetProposals, 
  dbUpdateProposalStatus, 
  dbDeleteLeadAndProposal, 
  authGetCurrentUser,
  firebaseIsMock
} from './firebase.js';
import { formatCurrency, showToast } from './utils.js';
import { getSettings, saveSettings } from './config.js';

// Ativa proteção de rota - redireciona se não estiver logado
protegerRota();

document.addEventListener('DOMContentLoaded', async () => {
  // Configuração inicial do usuário no cabeçalho
  const user = authGetCurrentUser();
  if (user) {
    document.getElementById('userEmail').textContent = `${user.email} ${firebaseIsMock() ? '(Teste)' : '(Firebase)'}`;
  }

  // Elementos do DOM
  const crmTableBody = document.getElementById('crmTableBody');
  const btnLogout = document.getElementById('btnLogout');
  const btnConfig = document.getElementById('btnConfig');
  const searchInput = document.getElementById('crmSearch');
  
  // Modais e Config
  const configModal = document.getElementById('configModal');
  const btnCloseConfig = document.getElementById('btnCloseConfig');
  const btnCancelConfig = document.getElementById('btnCancelConfig');
  const configForm = document.getElementById('configForm');
  
  // Elementos de Estatísticas
  const statTotal = document.getElementById('statTotal');
  const statEnviadas = document.getElementById('statEnviadas');
  const statFaturamento = document.getElementById('statFaturamento');
  const statFechadosCount = document.getElementById('statFechadosCount');

  // Variáveis globais de dados
  let leads = [];
  let propostas = [];
  let currentFilter = 'Todos';
  let searchQuery = '';

  // Logout
  btnLogout.addEventListener('click', logout);

  // --- CARGA DE DADOS & RENDER ---

  async function carregarDadosCRM() {
    try {
      crmTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
            <div class="spinner" style="margin: 0 auto 1rem auto;"></div>
            Carregando base de clientes...
          </td>
        </tr>
      `;

      leads = await dbGetLeads();
      propostas = await dbGetProposals();
      
      renderizarCRM();
      atualizarEstatisticas();
    } catch (e) {
      console.error(e);
      showToast("Falha ao sincronizar com o banco de dados. Recarregando...", "error");
    }
  }

  function atualizarEstatisticas() {
    const totalLeads = leads.length;
    const totalEnviados = propostas.filter(p => p.status === 'Enviado').length;
    const propostasFechadas = propostas.filter(p => p.status === 'Fechado');
    const totalFechados = propostasFechadas.length;
    
    // Soma de faturamento
    const faturamentoTotal = propostasFechadas.reduce((soma, prop) => soma + prop.preco_final, 0);

    statTotal.textContent = totalLeads.toString();
    statEnviadas.textContent = totalEnviados.toString();
    statFechadosCount.textContent = totalFechados.toString();
    statFaturamento.textContent = formatCurrency(faturamentoTotal);
  }

  function renderizarCRM() {
    crmTableBody.innerHTML = '';
    
    // Mapeamento rápido de leads
    const leadsMap = new Map(leads.map(l => [l.id, l]));

    // Filtra propostas com base nas regras do dashboard
    const propostasFiltradas = propostas.filter(prop => {
      const lead = leadsMap.get(prop.lead_id) || {};
      const nomeCliente = (lead.nome || '').toLowerCase();
      const telefoneCliente = (lead.telefone || '');
      
      // Filtro de Busca
      const matchesSearch = nomeCliente.includes(searchQuery.toLowerCase()) || 
                            telefoneCliente.includes(searchQuery);

      // Filtro de Status
      const matchesStatus = currentFilter === 'Todos' || prop.status === currentFilter;

      return matchesSearch && matchesStatus;
    });

    if (propostasFiltradas.length === 0) {
      crmTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
            Nenhum lead ou proposta localizada para os filtros atuais.
          </td>
        </tr>
      `;
      return;
    }

    propostasFiltradas.forEach(prop => {
      const lead = leadsMap.get(prop.lead_id);
      if (!lead) return; // ignora se não tiver lead associado

      const tr = document.createElement('tr');
      
      // Nome e contatos do lead
      const tdLead = document.createElement('td');
      tdLead.innerHTML = `
        <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">${lead.nome}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
          ${lead.email} <br>
          <span style="font-family: monospace;">${formatPhone(lead.telefone)}</span>
        </div>
      `;
      tr.appendChild(tdLead);

      // Consumo
      const tdConsumo = document.createElement('td');
      tdConsumo.innerHTML = `
        <div style="font-weight: 500;">${lead.consumo_mensal_kwh} kWh</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize;">${prop.tipo_telha}</div>
      `;
      tr.appendChild(tdConsumo);

      // Dimensionamento
      const tdDim = document.createElement('td');
      tdDim.innerHTML = `
        <div style="font-weight: 600; color: var(--solar-orange);">${prop.potencia_kwp} kWp</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${prop.numero_paineis} painéis x 550W</div>
      `;
      tr.appendChild(tdDim);

      // Custo / Preço
      const tdPreco = document.createElement('td');
      tdPreco.innerHTML = `
        <div style="font-weight: 600; color: #fff;">${formatCurrency(prop.preco_final)}</div>
        <div style="font-size: 0.75rem; color: var(--status-fechado);">Retorno: ${prop.payback_anos} anos</div>
      `;
      tr.appendChild(tdPreco);

      // Status Badge Selector
      const tdStatus = document.createElement('td');
      
      const selectStatus = document.createElement('select');
      selectStatus.className = 'form-control';
      selectStatus.style.padding = '0.25rem 0.5rem';
      selectStatus.style.fontSize = '0.75rem';
      selectStatus.style.width = '120px';
      selectStatus.style.borderRadius = '20px';
      selectStatus.style.border = 'none';
      
      // Define a cor de fundo do badge de acordo com o status
      const styleStatus = (status) => {
        if (status === 'Novo') {
          selectStatus.style.backgroundColor = 'var(--status-novo-bg)';
          selectStatus.style.color = 'var(--status-novo)';
        } else if (status === 'Enviado') {
          selectStatus.style.backgroundColor = 'var(--status-enviado-bg)';
          selectStatus.style.color = 'var(--status-enviado)';
        } else if (status === 'Fechado') {
          selectStatus.style.backgroundColor = 'var(--status-fechado-bg)';
          selectStatus.style.color = 'var(--status-fechado)';
        } else if (status === 'Perdido') {
          selectStatus.style.backgroundColor = 'var(--status-perdido-bg)';
          selectStatus.style.color = 'var(--status-perdido)';
        }
      };

      const statuses = ['Novo', 'Enviado', 'Fechado', 'Perdido'];
      statuses.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        opt.selected = prop.status === s;
        selectStatus.appendChild(opt);
      });
      
      styleStatus(prop.status);

      selectStatus.addEventListener('change', async (e) => {
        const novoStatus = e.target.value;
        try {
          await dbUpdateProposalStatus(prop.id, novoStatus);
          prop.status = novoStatus;
          styleStatus(novoStatus);
          atualizarEstatisticas();
          showToast(`Status atualizado para ${novoStatus}!`, 'success');
        } catch (err) {
          showToast("Erro ao atualizar status.", "error");
          selectStatus.value = prop.status; // reverte no DOM
        }
      });

      tdStatus.appendChild(selectStatus);
      tr.appendChild(tdStatus);

      // Ações
      const tdAcoes = document.createElement('td');
      const actionGroup = document.createElement('div');
      actionGroup.className = 'action-btn-group';

      // 🔗 Link proposta
      const btnLink = document.createElement('button');
      btnLink.className = 'action-btn';
      btnLink.title = "Ver Proposta Comercial";
      btnLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
      btnLink.addEventListener('click', () => {
        window.open(`./proposta.html?id=${prop.id}`, '_blank');
      });
      actionGroup.appendChild(btnLink);

      // 🟢 Enviar WhatsApp
      const btnZap = document.createElement('button');
      btnZap.className = 'action-btn whatsapp';
      btnZap.title = "Disparar WhatsApp";
      btnZap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="fill: currentColor;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
      btnZap.addEventListener('click', async () => {
        await enviarWhatsApp(prop, lead);
        // Atualiza status local para "Enviado" e atualiza a tabela/estatísticas
        prop.status = 'Enviado';
        selectStatus.value = 'Enviado';
        styleStatus('Enviado');
        atualizarEstatisticas();
      });
      actionGroup.appendChild(btnZap);

      // ❌ Excluir
      const btnDel = document.createElement('button');
      btnDel.className = 'action-btn delete';
      btnDel.title = "Remover Lead";
      btnDel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
      btnDel.addEventListener('click', async () => {
        if (confirm(`Deseja realmente remover o cliente ${lead.nome} e suas propostas associadas?`)) {
          try {
            await dbDeleteLeadAndProposal(lead.id);
            showToast("Lead removido com sucesso!", "success");
            // Recarrega
            carregarDadosCRM();
          } catch (err) {
            showToast("Erro ao deletar lead.", "error");
          }
        }
      });
      actionGroup.appendChild(btnDel);

      tdAcoes.appendChild(actionGroup);
      tr.appendChild(tdAcoes);

      crmTableBody.appendChild(tr);
    });
  }

  // --- MENSAGEM WHATSAPP (FASE 4) ---

  async function enviarWhatsApp(proposta, lead) {
    try {
      // 1. Atualizar no Firestore/MockDB para status 'Enviado'
      await dbUpdateProposalStatus(proposta.id, 'Enviado');
      showToast("Atualizando status da proposta para 'Enviado'...", "info");

      // 2. Monta texto customizado com emojis e quebras de linha (%0A)
      // Calculamos economia percentual: (Economia mensal dividida por tarifa*consumo) aprox. 95%
      const economiaPorcentagem = 95;
      const linkProposta = new URL('./proposta.html', window.location.href).href + `?id=${proposta.id}`;
      
      const textoMensagem = `Olá *${lead.nome}*! ☀️ Aqui é a equipe da SolarCRM.%0A%0A` +
        `Fizemos a simulação para o seu projeto de energia solar e ele já está pronto!%0A%0A` +
        `📊 *Resumo da Simulação:*%0A` +
        `• Gerador Solar de *${proposta.potencia_kwp} kWp* (${proposta.numero_paineis} painéis)%0A` +
        `• Geração Estimada: *${proposta.geracao_estimada_kwh} kWh/mês*%0A` +
        `• Economia Anual Estimada: *${formatCurrency(proposta.economia_anual)}*%0A` +
        `• Investimento Total: *${formatCurrency(proposta.preco_final)}*%0A` +
        `• Retorno do Investimento (Payback): *${proposta.payback_anos} anos*%0A%0A` +
        `Acesse o seu link de proposta personalizado para ver a especificação completa e os impactos ecológicos:%0A` +
        `🔗 *${linkProposta}*%0A%0A` +
        `Podemos conversar rapidinho sobre as condições de pagamento?`;

      // 3. Abre API do WhatsApp
      const urlWhatsapp = `https://wa.me/55${lead.telefone}?text=${textoMensagem}`;
      window.open(urlWhatsapp, '_blank');
      showToast("WhatsApp aberto em nova aba!", "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao disparar WhatsApp.", "error");
    }
  }

  // --- FILTROS DE STATUS ---

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      currentFilter = e.target.getAttribute('data-filter');
      renderizarCRM();
    });
  });

  // --- BUSCA EM TEMPO REAL ---

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderizarCRM();
  });

  // --- CONFIGURAÇÕES GLOBAL MODAL ---

  btnConfig.addEventListener('click', () => {
    const settings = getSettings();
    document.getElementById('cfgHsp').value = settings.hsp;
    document.getElementById('cfgTarifa').value = settings.tarifaEnergia;
    document.getElementById('cfgMargem').value = settings.margemLucro;
    document.getElementById('cfgTelefone').value = settings.empresaTelefone;
    
    configModal.classList.add('active');
  });

  function fecharConfig() {
    configModal.classList.remove('active');
  }

  btnCloseConfig.addEventListener('click', fecharConfig);
  btnCancelConfig.addEventListener('click', fecharConfig);

  configForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const hsp = Number(document.getElementById('cfgHsp').value);
    const tarifaEnergia = Number(document.getElementById('cfgTarifa').value);
    const margemLucro = Number(document.getElementById('cfgMargem').value);
    const empresaTelefone = document.getElementById('cfgTelefone').value.trim();

    saveSettings({
      hsp,
      tarifaEnergia,
      margemLucro,
      empresaTelefone
    });

    showToast("Parâmetros do CRM atualizados com sucesso!", "success");
    fecharConfig();
    
    // Recarrega dados e renderiza novamente para recalcular (se houvesse recalculo, mas se aplica a novos leads)
    carregarDadosCRM();
  });

  // Inicializa o carregamento da tabela
  carregarDadosCRM();
});

// Helper de telefone local
function formatPhone(value) {
  if (!value) return '';
  value = value.replace(/\D/g, '');
  if (value.length === 11) {
    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  } else if (value.length === 10) {
    return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
  }
  return value;
}
