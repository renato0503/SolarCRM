import { dbGetLeads, dbGetProposals } from './firebase.js';
import { formatCurrency, formatPhone } from './utils.js';

// Update clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
  
  // Update last update time
  document.getElementById('lastUpdate').textContent = `Última atualização: ${hours}:${minutes}:${seconds}`;
}

// Format relative time
function getRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

// Load and display data
async function loadData() {
  try {
    const [leads, proposals] = await Promise.all([dbGetLeads(), dbGetProposals()]);

    // Count by status
    const statusCounts = {
      Novo: 0,
      Qualificação: 0,
      'Proposta Enviada': 0,
      Negociação: 0,
      Fechado: 0,
      Perdido: 0
    };

    proposals.forEach(prop => {
      const status = prop.status || 'Novo';
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      } else if (status === 'Enviado') {
        statusCounts['Proposta Enviada']++;
      }
    });

    // Update kanban counts
    document.getElementById('countNovo').textContent = statusCounts.Novo;
    document.getElementById('countQualificacao').textContent = statusCounts.Qualificação;
    document.getElementById('countProposta').textContent = statusCounts['Proposta Enviada'];
    document.getElementById('countNegociacao').textContent = statusCounts.Negociação;
    document.getElementById('countFechado').textContent = statusCounts.Fechado;

    // Update stats
    document.getElementById('statTotalLeads').textContent = leads.length;
    
    const fechadas = proposals.filter(p => p.status === 'Fechado');
    const faturamento = fechadas.reduce((sum, p) => sum + (p.preco_final || 0), 0);
    document.getElementById('statFaturamento').textContent = formatCurrency(faturamento);
    
    const enviadas = proposals.filter(p => p.status === 'Enviado' || p.status === 'Proposta Enviada');
    document.getElementById('statEnviadas').textContent = proposals.length;

    const totalComStatus = proposals.filter(p => p.status).length;
    const conversao = totalComStatus > 0 ? Math.round((statusCounts.Fechado / totalComStatus) * 100) : 0;
    document.getElementById('statConversao').textContent = `${conversao}%`;

    // Render growth chart
    if (typeof ApexCharts !== 'undefined') {
      renderizarGraficoCrescimento(leads);
    } else {
      setTimeout(() => renderizarGraficoCrescimento(leads), 200);
    }

    // Build activity list
    const activityList = document.getElementById('activityList');
    
    if (leads.length === 0) {
      activityList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
          Nenhuma atividade registrada ainda.
        </div>
      `;
      return;
    }

    // Combine leads and proposals for activity feed
    const activities = [];

    leads.forEach(lead => {
      activities.push({
        type: 'novo',
        name: lead.nome,
        detail: 'Lead cadastrado',
        time: lead.data_criacao,
        phone: lead.telefone
      });

      // Find proposals for this lead
      const propLead = proposals.filter(p => p.lead_id === lead.id);
      propLead.forEach(prop => {
        if (prop.status === 'Enviado' || prop.status === 'Proposta Enviada') {
          activities.push({
            type: 'enviado',
            name: lead.nome,
            detail: `Proposta enviada · ${formatCurrency(prop.preco_final || 0)}`,
            time: prop.data_criacao,
            phone: lead.telefone
          });
        }
        if (prop.status === 'Fechado') {
          activities.push({
            type: 'fechado',
            name: lead.nome,
            detail: `Venda fechada · ${formatCurrency(prop.preco_final || 0)}`,
            time: prop.data_criacao,
            phone: lead.telefone
          });
        }
      });
    });

    // Sort by time (most recent first) and take top 10
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const topActivities = activities.slice(0, 10);

    activityList.innerHTML = topActivities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          ${activity.type === 'novo' ? '🆕' : activity.type === 'fechado' ? '✅' : '📤'}
        </div>
        <div class="activity-content">
          <div class="activity-name">${activity.name}</div>
          <div class="activity-detail">${activity.detail}</div>
        </div>
        <div class="activity-time">${getRelativeTime(activity.time)}</div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Erro ao carregar dados do TV:', error);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Start clock
  updateClock();
  setInterval(updateClock, 1000);

  // Load data
  loadData();
  setInterval(loadData, 30000); // Refresh every 30 seconds
});

function renderizarGraficoCrescimento(leads) {
  const container = document.getElementById('graficoCrescimento');
  if (!container || window.graficoCrescimentoInstance || typeof ApexCharts === 'undefined') return;

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const mesAtual = new Date().getMonth();
  const ultimos6Meses = [];
  
  for (let i = 5; i >= 0; i--) {
    const mesIdx = (mesAtual - i + 12) % 12;
    ultimos6Meses.push({ nome: meses[mesIdx], idx: mesIdx });
  }

  const leadsPorMes = ultimos6Meses.map(m => {
    return leads.filter(l => {
      if (!l.data_criacao) return false;
      const dataMes = new Date(l.data_criacao).getMonth();
      return dataMes === m.idx;
    }).length;
  });

  if (window.graficoCrescimentoInstance) {
    window.graficoCrescimentoInstance.destroy();
  }

  const options = {
    series: [{
      name: 'Leads',
      data: leadsPorMes
    }],
    chart: {
      type: 'area',
      height: 140,
      toolbar: { show: false },
      background: 'transparent',
      sparkline: { enabled: false }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    colors: ['#ff6b00'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: ultimos6Meses.map(m => m.nome),
      labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '10px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '10px' } }
    },
    grid: { 
      borderColor: 'rgba(255,255,255,0.05)',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } }
    },
    tooltip: { 
      theme: 'dark',
      x: { show: true },
      y: { formatter: (val) => `${val} leads` }
    }
  };

  window.graficoCrescimentoInstance = new ApexCharts(container, options);
  window.graficoCrescimentoInstance.render();
}