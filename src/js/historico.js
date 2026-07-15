import { dbGetLeads, dbGetProposals } from './firebase.js';
import { showToast, formatCurrency, formatPhone } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('searchForm');
  const telefoneInput = document.getElementById('telefone');
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsList = document.getElementById('resultsList');
  const noResults = document.getElementById('noResults');

  // Phone mask
  telefoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 6) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      e.target.value = `(${value.slice(0, 2)}`;
    } else {
      e.target.value = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const telefone = telefoneInput.value.replace(/\D/g, '');

    if (telefone.length < 10) {
      showToast('Digite um número de WhatsApp válido.', 'error');
      return;
    }

    try {
      showToast('Buscando seus orçamentos...', 'info');

      // Get all leads and proposals
      const [leads, proposals] = await Promise.all([dbGetLeads(), dbGetProposals()]);

      // Filter leads by phone
      const leadsDoTelefone = leads.filter(lead => {
        const leadPhone = (lead.telefone || '').replace(/\D/g, '');
        return leadPhone === telefone || leadPhone.endsWith(telefone) || telefone.endsWith(leadPhone);
      });

      if (leadsDoTelefone.length === 0) {
        resultsContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
      }

      // Get proposals for these leads
      const propostasDoTelefone = proposals.filter(prop => {
        return leadsDoTelefone.some(lead => lead.id === prop.lead_id);
      });

      // Build results HTML
      resultsList.innerHTML = '';

      leadsDoTelefone.forEach(lead => {
        const propostasDoLead = propostasDoTelefone.filter(p => p.lead_id === lead.id);

        if (propostasDoLead.length === 0) {
          // Lead without proposal
          const card = document.createElement('div');
          card.className = 'glass-card';
          card.style.marginBottom = '1rem';
          card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <h3 style="font-size: 1.125rem; font-weight: 600;">${lead.nome}</h3>
                <p style="color: var(--text-muted); font-size: 0.875rem;">${formatPhone(lead.telefone)} · ${lead.cidade || ''}/${lead.uf || ''}</p>
              </div>
              <span style="background: var(--status-novo-bg); color: var(--status-novo); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">Aguardando</span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.875rem; text-align: center; padding: 1rem;">
              Nenhuma proposta gerada ainda. Entre em contato conosco.
            </p>
            <a href="https://wa.me/55${lead.telefone}?text=Olá%20${encodeURIComponent(lead.nome)}!%20Vimos%20seu%20contato%20na%20Spark.%20Podemos%20ajudar%20com%20seu%20projeto%20de%20energia%20solar?" target="_blank" class="btn btn-primary" style="width: 100%;">
              ☀️ Falar via WhatsApp
            </a>
          `;
          resultsList.appendChild(card);
        } else {
          // Lead with proposals
          propostasDoLead.forEach(prop => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.marginBottom = '1rem';
            
            const dataFormatada = new Date(prop.data_criacao).toLocaleDateString('pt-BR');
            const statusClass = prop.status === 'Fechado' ? 'var(--status-fechado)' : 
                               prop.status === 'Enviado' ? 'var(--status-enviado)' : 
                               prop.status === 'Perdido' ? 'var(--status-perdido)' : 'var(--status-novo)';
            const statusBg = prop.status === 'Fechado' ? 'var(--status-fechado-bg)' : 
                            prop.status === 'Enviado' ? 'var(--status-enviado-bg)' : 
                            prop.status === 'Perdido' ? 'var(--status-perdido-bg)' : 'var(--status-novo-bg)';

            card.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                  <h3 style="font-size: 1.125rem; font-weight: 600;">${lead.nome}</h3>
                  <p style="color: var(--text-muted); font-size: 0.875rem;">${formatPhone(lead.telefone)} · ${lead.cidade || ''}/${lead.uf || ''}</p>
                  <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.25rem;">📅 ${dataFormatada}</p>
                </div>
                <span style="background: ${statusBg}; color: ${statusClass}; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${prop.status || 'Novo'}</span>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 1rem;">
                <div style="text-align: center;">
                  <div style="font-size: 1.25rem; font-weight: 700; color: var(--solar-orange);">${prop.potencia_kwp || '-'} kWp</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Potência</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 1.25rem; font-weight: 700;">${prop.numero_paineis || '-'} Painéis</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Módulos</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 1.25rem; font-weight: 700;">${formatCurrency(prop.preco_final || 0)}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Valor Total</div>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem;">
                ${prop.lead_id ? `<a href="./proposta.html?id=${prop.id}" target="_blank" class="btn btn-secondary" style="flex: 1; text-align: center;">📄 Ver Proposta</a>` : ''}
                <a href="https://wa.me/55${lead.telefone}?text=Olá%20${encodeURIComponent(lead.nome)}!%20Seguimos%20com%20sua%20proposta%20de%20energia%20solar.%20Podemos%20conversar?" target="_blank" class="btn btn-primary" style="flex: 1; text-align: center;">☀️ Falar</a>
              </div>
            `;
            resultsList.appendChild(card);
          });
        }
      });

      resultsContainer.style.display = 'block';
      noResults.style.display = 'none';

    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      showToast('Erro ao buscar orçamentos. Tente novamente.', 'error');
    }
  });
});