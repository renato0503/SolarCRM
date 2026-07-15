import { protegerRota, checkIsAdmin } from './auth.js';
import { 
  dbGetLeads, 
  dbGetProposals, 
  authGetCurrentUser,
  getUserProfile,
  firebaseIsMock
} from './firebase.js';
import { formatCurrency } from './utils.js';

protegerRota();

const THEME_KEY = 'solarcrm_theme';

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  
  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');
  
  if (theme === 'dark') {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  
  document.getElementById('btnThemeToggle')?.addEventListener('click', toggleTheme);

  const user = authGetCurrentUser();
  let currentUserId = null;
  let isAdminUser = false;
  
  if (user) {
    const profile = await getUserProfile(user.uid);
    currentUserId = user.uid;
    isAdminUser = profile?.role === 'admin';
    const roleLabel = isAdminUser ? '(Admin)' : '(Vendedor)';
    document.getElementById('userEmail').textContent = `${user.email} ${firebaseIsMock() ? '(Teste)' : ''} ${roleLabel}`;
  }

  let leads = [];
  let propostas = [];
  let periodo = 6;

  document.querySelectorAll('[data-periodo]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-periodo]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      periodo = parseInt(e.target.dataset.periodo);
      renderizarGraficos();
      atualizarKPIs();
    });
  });

  async function carregarDados() {
    try {
      leads = await dbGetLeads(currentUserId, isAdminUser);
      propostas = await dbGetProposals();
      renderizarGraficos();
      atualizarKPIs();
      renderizarVendedores();
    } catch (e) {
      console.error(e);
    }
  }

  function getLeadsPorPeriodo() {
    const agora = new Date();
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - periodo);
    
    return leads.filter(l => {
      if (!l.data_criacao) return false;
      const dataLead = new Date(l.data_criacao);
      return dataLead >= inicio && dataLead <= agora;
    });
  }

  function getPropostasPorPeriodo() {
    const agora = new Date();
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - periodo);
    
    return propostas.filter(p => {
      if (!p.data_criacao) return false;
      const dataProposta = new Date(p.data_criacao);
      return dataProposta >= inicio && dataProposta <= agora;
    });
  }

  function atualizarKPIs() {
    const leadsPeriodo = getLeadsPorPeriodo();
    const propsPeriodo = getPropostasPorPeriodo();
    
    const totalLeads = leadsPeriodo.length;
    const fechadas = propsPeriodo.filter(p => p.status === 'Fechado').length;
    const conversao = totalLeads > 0 ? ((fechadas / totalLeads) * 100).toFixed(1) : 0;
    const faturamento = propsPeriodo.filter(p => p.status === 'Fechado').reduce((s, p) => s + (p.preco_final || 0), 0);
    const ticketMedio = fechadas > 0 ? faturamento / fechadas : 0;

    document.getElementById('kpiTotalLeads').textContent = totalLeads;
    document.getElementById('kpiConversao').textContent = conversao + '%';
    document.getElementById('kpiFaturamento').textContent = formatCurrency(faturamento);
    document.getElementById('kpiTicketMedio').textContent = formatCurrency(ticketMedio);
  }

  function renderizarGraficos() {
    if (typeof ApexCharts === 'undefined') {
      setTimeout(renderizarGraficos, 300);
      return;
    }
    renderizarGraficoFaturamento();
    renderizarGraficoStatus();
    renderizarGraficoEvolucao();
  }

  function renderizarGraficoFaturamento() {
    const container = document.getElementById('graficoFaturamento');
    if (!container || typeof ApexCharts === 'undefined') return;

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesAtual = new Date().getMonth();
    const ultimosMeses = [];
    
    for (let i = periodo - 1; i >= 0; i--) {
      const mesIdx = (mesAtual - i + 12) % 12;
      ultimosMeses.push({ nome: meses[mesIdx], idx: mesIdx });
    }

    const faturamentoPorMes = ultimosMeses.map(m => {
      return propostas
        .filter(p => {
          if (p.status !== 'Fechado' || !p.data_criacao) return false;
          const dataMes = new Date(p.data_criacao).getMonth();
          const dataAno = new Date(p.data_criacao).getFullYear();
          const anoAtual = new Date().getFullYear();
          return dataMes === m.idx && dataAno === anoAtual;
        })
        .reduce((sum, p) => sum + (p.preco_final || 0), 0);
    });

    if (window.graficoFaturamentoInstance) {
      window.graficoFaturamentoInstance.destroy();
    }

    const options = {
      series: [{
        name: 'Faturamento',
        data: faturamentoPorMes
      }],
      chart: {
        type: 'area',
        height: 200,
        toolbar: { show: false },
        background: 'transparent'
      },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 100]
        }
      },
      colors: ['#f97316'],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ultimosMeses.map(m => m.nome),
        labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { 
          style: { colors: 'rgba(255,255,255,0.5)', fontSize: '11px' },
          formatter: (val) => 'R$ ' + (val / 1000).toFixed(0) + 'k'
        }
      },
      grid: { 
        borderColor: 'rgba(255,255,255,0.05)',
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: false } }
      },
      tooltip: { 
        theme: 'dark',
        y: { formatter: (val) => 'R$ ' + val.toLocaleString('pt-BR') }
      }
    };

    window.graficoFaturamentoInstance = new ApexCharts(container, options);
    window.graficoFaturamentoInstance.render();
  }

  function renderizarGraficoStatus() {
    const container = document.getElementById('graficoStatus');
    if (!container || typeof ApexCharts === 'undefined') return;

    const propsPeriodo = getPropostasPorPeriodo();
    const statusCounts = {
      'Novo': 0,
      'Qualificação': 0,
      'Enviado': 0,
      'Negociação': 0,
      'Fechado': 0,
      'Perdido': 0
    };

    propsPeriodo.forEach(p => {
      if (statusCounts.hasOwnProperty(p.status)) {
        statusCounts[p.status]++;
      }
    });

    if (window.graficoStatusInstance) {
      window.graficoStatusInstance.destroy();
    }

    const options = {
      series: Object.values(statusCounts),
      chart: {
        type: 'donut',
        height: 200,
        background: 'transparent'
      },
      labels: Object.keys(statusCounts),
      colors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#f97316', '#22c55e', '#ef4444'],
      legend: {
        position: 'right',
        labels: { colors: 'rgba(255,255,255,0.7)' }
      },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: { show: true, color: '#fff' },
              value: { show: true, color: '#fff' }
            }
          }
        }
      },
      stroke: { width: 0 },
      tooltip: { theme: 'dark' }
    };

    window.graficoStatusInstance = new ApexCharts(container, options);
    window.graficoStatusInstance.render();
  }

  function renderizarGraficoEvolucao() {
    const container = document.getElementById('graficoEvolucao');
    if (!container || typeof ApexCharts === 'undefined') return;

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesAtual = new Date().getMonth();
    const ultimosMeses = [];
    
    for (let i = 5; i >= 0; i--) {
      const mesIdx = (mesAtual - i + 12) % 12;
      ultimosMeses.push({ nome: meses[mesIdx], idx: mesIdx });
    }

    const leadsPorMes = ultimosMeses.map(m => {
      return leads.filter(l => {
        if (!l.data_criacao) return false;
        const dataMes = new Date(l.data_criacao).getMonth();
        const dataAno = new Date(l.data_criacao).getFullYear();
        const anoAtual = new Date().getFullYear();
        return dataMes === m.idx && dataAno === anoAtual;
      }).length;
    });

    const fechadasPorMes = ultimosMeses.map(m => {
      return propostas.filter(p => {
        if (p.status !== 'Fechado' || !p.data_criacao) return false;
        const dataMes = new Date(p.data_criacao).getMonth();
        const dataAno = new Date(p.data_criacao).getFullYear();
        const anoAtual = new Date().getFullYear();
        return dataMes === m.idx && dataAno === anoAtual;
      }).length;
    });

    if (window.graficoEvolucaoInstance) {
      window.graficoEvolucaoInstance.destroy();
    }

    const options = {
      series: [
        { name: 'Leads', data: leadsPorMes },
        { name: 'Fechados', data: fechadasPorMes }
      ],
      chart: {
        type: 'bar',
        height: 200,
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        bar: { borderRadius: 4, columnWidth: '40%' }
      },
      colors: ['#3b82f6', '#22c55e'],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ultimosMeses.map(m => m.nome),
        labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '11px' } }
      },
      grid: { 
        borderColor: 'rgba(255,255,255,0.05)',
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: false } }
      },
      legend: {
        labels: { colors: 'rgba(255,255,255,0.7)' }
      },
      tooltip: { theme: 'dark' }
    };

    window.graficoEvolucaoInstance = new ApexCharts(container, options);
    window.graficoEvolucaoInstance.render();
  }

  function renderizarVendedores() {
    const container = document.getElementById('vendedoresList');
    
    const vendedorStats = {};
    
    propostas.forEach(p => {
      const lead = leads.find(l => l.id === p.lead_id);
      if (!lead || !lead.vendedorNome) return;
      
      const nome = lead.vendedorNome;
      if (!vendedorStats[nome]) {
        vendedorStats[nome] = { total: 0, fechados: 0, faturamento: 0 };
      }
      vendedorStats[nome].total++;
      if (p.status === 'Fechado') {
        vendedorStats[nome].fechados++;
        vendedorStats[nome].faturamento += p.preco_final || 0;
      }
    });

    const sortedVendors = Object.entries(vendedorStats)
      .map(([nome, stats]) => ({
        nome,
        ...stats,
        conversao: stats.total > 0 ? ((stats.fechados / stats.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.faturamento - a.faturamento);

    if (sortedVendors.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Nenhum dado de vendedor encontrado.</p>';
      return;
    }

    const maxFaturamento = Math.max(...sortedVendors.map(v => v.faturamento), 1);

    container.innerHTML = sortedVendors.map(v => {
      const iniciais = v.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const progresso = (v.faturamento / maxFaturamento) * 100;
      
      return `
        <div class="vendor-row">
          <div class="vendor-avatar">${iniciais}</div>
          <div class="vendor-info">
            <div class="vendor-name">${v.nome}</div>
            <div class="vendor-stats">
              ${v.total} leads · ${v.fechados} fechados · ${v.conversao}% conversão
            </div>
            <div class="progress-bar" style="margin-top: 0.5rem;">
              <div class="progress-fill" style="width: ${progresso}%;"></div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: var(--solar-orange); font-size: 1rem;">${formatCurrency(v.faturamento)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">faturamento</div>
          </div>
        </div>
      `;
    }).join('');
  }

  carregarDados();
});