import { protegerRota, logout } from './auth.js';
import { 
  dbGetLeads, 
  dbGetProposals, 
  dbUpdateProposalStatus, 
  dbDeleteLeadAndProposal, 
  authGetCurrentUser,
  firebaseIsMock,
  getUserProfile,
  dbAddInteracao,
  dbGetInteracoes
} from './firebase.js';
import { formatCurrency, showToast } from './utils.js';
import { getSettings, saveSettings } from './config.js';

protegerRota();

const THEME_KEY = 'solarcrm_theme';
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefers ? 'dark' : 'light'));
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
  const s = document.getElementById('themeIconSun'), m = document.getElementById('themeIconMoon');
  if (s) s.style.display = t === 'dark' ? 'block' : 'none';
  if (m) m.style.display = t === 'dark' ? 'none' : 'block';
}
function toggleTheme() { applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  document.getElementById('btnThemeToggle')?.addEventListener('click', toggleTheme);

  const user = authGetCurrentUser();
  let currentUserId = null, isAdminUser = false;
  if (user) {
    const profile = await getUserProfile(user.uid);
    currentUserId = user.uid;
    isAdminUser = profile?.role === 'admin';
    document.getElementById('userEmail').textContent = `${user.email} ${firebaseIsMock() ? '(Teste)' : ''} ${isAdminUser ? '(Admin)' : '(Vendedor)'}`;
    if (isAdminUser) {
      const b = document.getElementById('btnAdminEquip'); if (b) b.style.display = 'flex';
      const f = document.getElementById('btnFornecedores'); if (f) f.style.display = 'inline-flex';
      const bk = document.getElementById('btnBackup'); if (bk) bk.style.display = 'inline-flex';
      const rs = document.getElementById('btnRestore'); if (rs) rs.style.display = 'inline-flex';
    }
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
  let paginaAtual = 1;
  const LIMITE_PAGINA = 50;
  let followUpBadges = {};

  btnLogout.addEventListener('click', logout);

  // Notification bell
  const btnNotif = document.getElementById('btnNotificacoes');
  const notifDrop = document.getElementById('notifDropdown');
  const notifBadge = document.getElementById('notifBadge');
  const notifList = document.getElementById('notifList');
  btnNotif?.addEventListener('click', (e) => { e.stopPropagation(); if (notifDrop) notifDrop.style.display = notifDrop.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', () => { if (notifDrop) notifDrop.style.display = 'none'; });
  document.getElementById('btnNotifDismissAll')?.addEventListener('click', () => {
    if (notifList) notifList.innerHTML = '<div style="padding:1.5rem 1rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">Nenhuma notificação pendente</div>';
    if (notifBadge) { notifBadge.style.display = 'none'; notifBadge.textContent = '0'; }
  });

  // Load more button
  document.getElementById('btnLoadMore')?.addEventListener('click', () => {
    paginaAtual++;
    renderizarCRM();
  });

  // Backup button (admin only)
  document.getElementById('btnBackup')?.addEventListener('click', async () => {
    const data = {
      leads, propostas,
      equipamentos: localStorage.getItem('solarcrm_mock_equipamentos'),
      config: localStorage.getItem('solarcrm_config'),
      exportadoEm: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `spark-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!', 'success');
  });

  document.getElementById('btnExportCSV')?.addEventListener('click', () => {
    if (!leads.length) { showToast('Nenhum lead para exportar.', 'error'); return; }
    const headers = ['Nome', 'Telefone', 'Email', 'Endereço', 'Consumo (kWh)', 'Data', 'Status'];
    const rows = leads.map(l => [
      l.nome || '', l.telefone || '', l.email || '', l.endereco || '', l.consumo_mensal_kwh || '', l.data_criacao || '', l.status || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-spark-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('CSV exportado com sucesso!', 'success');
  });

  document.getElementById('btnRestore')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.config) localStorage.setItem('solarcrm_config', data.config);
        if (data.equipamentos) localStorage.setItem('solarcrm_mock_equipamentos', data.equipamentos);
        showToast('Backup restaurado! Recarregue a página.', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (err) { showToast('Arquivo inválido.', 'error'); }
    };
    input.click();
  });

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

      leads = await dbGetLeads(currentUserId, isAdminUser);
      propostas = await dbGetProposals();
      
      await carregarFollowUpBadges();
      atualizarNotificacoes();
      renderizarCRM();
      atualizarEstatisticas();
    } catch (e) {
      console.error(e);
      showToast("Falha ao sincronizar com o banco de dados. Recarregando...", "error");
    }
  }

  async function carregarFollowUpBadges() {
    for (const lead of leads) {
      try {
        const interacoes = await dbGetInteracoes(lead.id);
        if (interacoes.length > 0) {
          followUpBadges[lead.id] = Math.floor((Date.now() - new Date(interacoes[0].data)) / 86400000);
        } else {
          followUpBadges[lead.id] = lead.data_criacao ? Math.floor((Date.now() - new Date(lead.data_criacao)) / 86400000) : 0;
        }
      } catch (e) { followUpBadges[lead.id] = 0; }
    }
  }

  function getFollowUpBadgeHtml(leadId) {
    const d = followUpBadges[leadId];
    if (d === undefined) return '';
    if (d >= 14) return '<span style="background:rgba(239,68,68,0.2);color:#ef4444;padding:2px 6px;border-radius:4px;font-size:0.65rem;">❄️ Frio</span>';
    if (d >= 7) return '<span style="background:rgba(245,158,11,0.2);color:#f59e0b;padding:2px 6px;border-radius:4px;font-size:0.65rem;">⚠️ 7+dias</span>';
    if (d >= 3) return '<span style="background:rgba(59,130,246,0.2);color:#3b82f6;padding:2px 6px;border-radius:4px;font-size:0.65rem;">👀 Atenção</span>';
    return '';
  }

  function atualizarNotificacoes() {
    const leadsMap = new Map(leads.map(l => [l.id, l]));
    const notifs = [];
    propostas.forEach(p => {
      if (p.status === 'Fechado' || p.status === 'Perdido') return;
      const d = followUpBadges[p.lead_id];
      if (!d || d < 3) return;
      const l = leadsMap.get(p.lead_id);
      if (!l) return;
      const level = d >= 14 ? { label: '❄️ Frio', cor: '#ef4444' } : d >= 7 ? { label: '⚠️ 7+ dias', cor: '#f59e0b' } : { label: '👀 Atenção', cor: '#3b82f6' };
      notifs.push({ lead: l, prop: p, dias: d, ...level });
    });
    notifs.sort((a, b) => b.dias - a.dias);
    if (notifBadge) {
      if (notifs.length > 0) { notifBadge.style.display = 'block'; notifBadge.textContent = notifs.length; }
      else notifBadge.style.display = 'none';
    }
    if (notifList) {
      if (notifs.length === 0) {
        notifList.innerHTML = '<div style="padding:1.5rem 1rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">Nenhum lead pendente de follow-up</div>';
      } else {
        notifList.innerHTML = notifs.map(n => `<div style="padding:0.5rem 1rem;border-bottom:1px solid var(--border-color);cursor:pointer" onclick="window.open('./proposta.html?id=${n.prop.id}','_blank')"><div style="display:flex;align-items:center;gap:0.5rem"><span style="font-size:0.65rem;background:${n.cor}20;color:${n.cor};padding:1px 6px;border-radius:4px">${n.label}</span><span style="font-weight:600;font-size:0.82rem;color:var(--text-main)">${n.lead.nome}</span></div><div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${n.dias} dias sem contato | ${formatCurrency(n.prop.preco_final||0)}</div></div>`).join('');
      }
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
      const matchesStatus = currentFilter === 'Todos' || prop.status === currentFilter
        || (currentFilter === 'Atencao' && followUpBadges[prop.lead_id] >= 3 && prop.status !== 'Fechado' && prop.status !== 'Perdido');

      return matchesSearch && matchesStatus;
    });

    // Pagination
    const total = propostasFiltradas.length;
    const slice = propostasFiltradas.slice(0, paginaAtual * LIMITE_PAGINA);

    if (slice.length === 0) {
      crmTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
            Nenhum lead ou proposta localizada para os filtros atuais.
          </td>
        </tr>
      `;
      return;
    }

    slice.forEach(prop => {
      const lead = leadsMap.get(prop.lead_id);
      if (!lead) return; // ignora se não tiver lead associado

      const tr = document.createElement('tr');
      
      // Nome e contatos do lead
      const tdLead = document.createElement('td');
      tdLead.innerHTML = `
        <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">${lead.nome} ${getFollowUpBadgeHtml(lead.id)}</div>
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

    // Load more container
    const loadMoreC = document.getElementById('loadMoreContainer');
    const loadMoreI = document.getElementById('loadMoreInfo');
    if (loadMoreC) {
      if (slice.length < total) {
        loadMoreC.style.display = 'block';
        if (loadMoreI) loadMoreI.textContent = `Exibindo ${slice.length} de ${total} leads`;
      } else if (total > LIMITE_PAGINA) {
        loadMoreC.style.display = 'block';
        if (loadMoreI) loadMoreI.textContent = `Todos os ${total} leads carregados`;
      } else {
        loadMoreC.style.display = 'none';
      }
    }
    paginaAtual = 1; // reset on new filter/search
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

  function atualizarPreviewConfig() {
    const hsp = parseFloat(document.getElementById('cfgHsp')?.value) || 4.5;
    const tarifa = parseFloat(document.getElementById('cfgTarifa')?.value) || 1.08;
    const margem = parseInt(document.getElementById('cfgMargem')?.value) || 45;
    const pr = parseFloat(document.getElementById('cfgPR')?.value) || 0.78;
    document.getElementById('cfgHspVal') && (document.getElementById('cfgHspVal').textContent = hsp.toFixed(1));
    document.getElementById('cfgTarifaVal') && (document.getElementById('cfgTarifaVal').textContent = tarifa.toFixed(2).replace('.', ','));
    document.getElementById('cfgMargemVal') && (document.getElementById('cfgMargemVal').textContent = margem);
    document.getElementById('cfgPRVal') && (document.getElementById('cfgPRVal').textContent = pr.toFixed(2).replace('.', ','));

    const painelW = 620, consumo = 600;
    const pot = consumo / (hsp * 30 * pr);
    const np = Math.ceil(pot / (painelW / 1000));
    document.getElementById('previewPotencia') && (document.getElementById('previewPotencia').textContent = `${(np * painelW / 1000).toFixed(1)} kWp`);
    document.getElementById('previewPaineis') && (document.getElementById('previewPaineis').textContent = `${np} painéis`);
    const custo = np * 410 + 2900 + np * 85 + 1100 + 120 * np * painelW / 1000;
    const custoT = custo + 2200 + 350 * np * painelW / 1000 + 350;
    const preco = custoT * (1 + margem / 100);
    document.getElementById('previewPreco') && (document.getElementById('previewPreco').textContent = formatCurrency(preco));
    const econ = consumo * tarifa * 12 * 0.85;
    document.getElementById('previewPayback') && (document.getElementById('previewPayback').textContent = `${econ > 0 ? (preco / econ).toFixed(1) : '—'} anos`);
  }

  btnConfig.addEventListener('click', () => {
    const s = getSettings();
    const hspEl = document.getElementById('cfgHsp'), tarEl = document.getElementById('cfgTarifa'), marEl = document.getElementById('cfgMargem'), prEl = document.getElementById('cfgPR');
    if (hspEl) hspEl.value = s.hsp;
    if (tarEl) tarEl.value = s.tarifaEnergia;
    if (marEl) marEl.value = s.margemLucro;
    if (prEl) prEl.value = s.performanceRatio;
    document.getElementById('cfgTelefone').value = s.empresaTelefone || '';

    const estrutura = s.custoEstrutura || {};
    document.getElementById('cfgCustoMetalica').value = estrutura.metalica ?? 70;
    document.getElementById('cfgCustoFibrocimento').value = estrutura.fibrocimento ?? 90;

    const faixas = s.custoKitPorFaixa || [];
    document.getElementById('cfgKitFaixa1').value = faixas[0]?.valor ?? 2300;
    document.getElementById('cfgKitFaixa2').value = faixas[1]?.valor ?? 2200;
    document.getElementById('cfgKitFaixa3').value = faixas[2]?.valor ?? 2000;

    const adicionais = s.adicionalCidade || {};
    document.getElementById('cfgAdicionalCidade').value = Object.entries(adicionais)
      .map(([cidade, valor]) => `${cidade}=${valor}`)
      .join(', ');

    atualizarPreviewConfig();
    configModal.classList.add('active');
  });

  ['cfgHsp','cfgTarifa','cfgMargem','cfgPR'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', atualizarPreviewConfig);
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
    const performanceRatio = document.getElementById('cfgPR') ? Number(document.getElementById('cfgPR').value) : 0.78;
    const empresaTelefone = document.getElementById('cfgTelefone').value.trim();

    const custoEstrutura = {
      metalica: Number(document.getElementById('cfgCustoMetalica').value) || 70,
      fibrocimento: Number(document.getElementById('cfgCustoFibrocimento').value) || 90
    };

    const custoKitPorFaixa = [
      { faixaMax: 5, valor: Number(document.getElementById('cfgKitFaixa1').value) || 2300 },
      { faixaMax: 15, valor: Number(document.getElementById('cfgKitFaixa2').value) || 2200 },
      { faixaMax: 30, valor: Number(document.getElementById('cfgKitFaixa3').value) || 2000 }
    ];

    const adicionalCidadeRaw = document.getElementById('cfgAdicionalCidade').value.trim();
    const adicionalCidade = {};
    if (adicionalCidadeRaw) {
      adicionalCidadeRaw.split(',').forEach(item => {
        const [cidade, valor] = item.split('=').map(s => s.trim());
        if (cidade && !isNaN(Number(valor))) {
          adicionalCidade[cidade] = Number(valor);
        }
      });
    }

    saveSettings({ 
      hsp, tarifaEnergia, margemLucro, performanceRatio, empresaTelefone,
      custoEstrutura,
      custoKitPorFaixa,
      adicionalCidade
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

// Tour guiado (Onboarding)
const tourSteps = [
  { element: '#statTotal', popover: { title: 'Indicadores', description: 'Aqui você acompanha leads novos, visitas agendadas, propostas enviadas e vendas fechadas.' } },
  { element: '#crmSearch', popover: { title: 'Busca rápida', description: 'Filtre leads por nome, telefone, cidade ou bairro diretamente nesta barra.' } },
  { element: '.filter-btn', popover: { title: 'Filtro por status', description: 'Selecione o estágio do funil para exibir apenas leads naquela fase.' } },
  { element: '#tableView', popover: { title: 'Lista de leads', description: 'Clique em uma linha para ver detalhes, registrar interações ou avançar o status.' } },
  { element: '#btnConfig', popover: { title: 'Configurações', description: 'Ajuste HSP, tarifa, margem, Performance Ratio e outros parâmetros globais aqui.' } },
  { element: '#btnNotificacoes', popover: { title: 'Notificações', description: 'Acompanhe leads com follow-up pendente e necessitando atenção.' } }
];

function initTour() {
  const btn = document.getElementById('btnTour');
  if (!btn || typeof driver === 'undefined') return;
  btn.addEventListener('click', () => {
    const driverObj = driver.default.tour({
      steps: tourSteps,
      showProgress: true,
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir'
    });
    driverObj.drive();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTour();
});
