import { dbGetProposal, dbGetLead } from './firebase.js';
import { formatCurrency } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Obter ID da proposta pela URL
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  if (!proposalId) {
    alert("Nenhuma proposta especificada na URL.");
    window.close();
    return;
  }

  const leadNomeEl = document.getElementById('lead-nome');
  const leadContatoEl = document.getElementById('lead-contato');
  const leadEnderecoEl = document.getElementById('lead-endereco');
  const propDataEl = document.getElementById('prop-data');
  
  const propEconomiaAnualEl = document.getElementById('prop-economia-anual');
  const propEconomia25AnosEl = document.getElementById('prop-economia-25anos');
  const propPrecoFinalEl = document.getElementById('prop-preco-final');
  const propPaybackEl = document.getElementById('prop-payback');

  const specPaineisEl = document.getElementById('spec-paineis');
  const specInversorEl = document.getElementById('spec-inversor');
  const specEstruturaEl = document.getElementById('spec-estrutura');
  const specFreteEl = document.getElementById('spec-frete');
  
  const precoPaineisEl = document.getElementById('preco-paineis');
  const precoInversorEl = document.getElementById('preco-inversor');
  const precoEstruturaEl = document.getElementById('preco-estrutura');
  const precoFreteEl = document.getElementById('preco-frete');
  const precoServicosEl = document.getElementById('preco-servicos');

  const propGeracaoKwhEl = document.getElementById('prop-geracao-kwh');
  const ecoCo2El = document.getElementById('eco-co2');
  const ecoArvoresEl = document.getElementById('eco-arvores');
  const pdfSigClient = document.getElementById('pdf-signature-client-name');
  
  const loadingScreen = document.getElementById('loading-screen');

  try {
    // 2. Carregar dados da proposta e do lead
    const proposta = await dbGetProposal(proposalId);
    if (!proposta) {
      alert("Proposta comercial não encontrada.");
      window.close();
      return;
    }

    const lead = await dbGetLead(proposta.lead_id);
    if (!lead) {
      alert("Lead associado à proposta não foi localizado.");
      window.close();
      return;
    }

    // 3. Preencher dados do Lead e Proposta no DOM
    leadNomeEl.textContent = lead.nome;
    leadContatoEl.textContent = `WhatsApp: ${formatPhone(lead.telefone)} | E-mail: ${lead.email}`;
    leadEnderecoEl.textContent = lead.endereco;
    
    if (pdfSigClient) {
      pdfSigClient.textContent = lead.nome;
    }

    const dataProp = proposta.data_criacao ? new Date(proposta.data_criacao) : new Date();
    propDataEl.textContent = `Simulado em: ${dataProp.toLocaleDateString('pt-BR')}`;

    // Valores financeiros
    const precoFinal = proposta.preco_final;
    const economiaAnual = proposta.economia_anual;
    const geracaoKwh = proposta.geracao_estimada_kwh;
    
    propPrecoFinalEl.textContent = formatCurrency(precoFinal);
    propPaybackEl.textContent = `${proposta.payback_anos} ${proposta.payback_anos === 1 ? 'ano' : 'anos'}`;

    const economia25Anos = economiaAnual * 25;
    propEconomia25AnosEl.textContent = `Economia de até ${formatCurrency(economia25Anos)} em 25 anos`;

    // Especificações e Preços
    const precoPaineis = proposta.preco_paineis || (proposta.custo_equipamentos * 0.6 * (1 + proposta.margem_lucro / 100));
    const precoInversor = proposta.preco_inversor || (proposta.custo_equipamentos * 0.3 * (1 + proposta.margem_lucro / 100));
    const precoEstrutura = proposta.preco_estrutura || (proposta.custo_equipamentos * 0.1 * (1 + proposta.margem_lucro / 100));
    const precoServicos = proposta.preco_servicos || (proposta.custo_servicos * (1 + proposta.margem_lucro / 100));
    const precoFrete = proposta.preco_frete || (proposta.frete_valor * (1 + proposta.margem_lucro / 100));

    specPaineisEl.textContent = `${proposta.numero_paineis}x ${proposta.painel_selecionado}`;
    precoPaineisEl.textContent = `Equipamento e Cabos: ${formatCurrency(precoPaineis)}`;

    specInversorEl.textContent = proposta.inversor_selecionado;
    precoInversorEl.textContent = `Inversor Homologado: ${formatCurrency(precoInversor)}`;

    specEstruturaEl.textContent = proposta.estrutura_selecionada;
    precoEstruturaEl.textContent = `Suportes de Fixação: ${formatCurrency(precoEstrutura)}`;

    const dist = proposta.distancia_km || 10.0;
    specFreteEl.textContent = `Entrega e Descarga (${dist} km)`;
    precoFreteEl.textContent = `Valor do Frete comercial: ${formatCurrency(precoFrete)}`;

    let servicosHtml = `Mão de Obra e Homologação: ${formatCurrency(precoServicos)}`;
    if (proposta.taxa_localidade_venda > 0) {
      servicosHtml += ` (incluso taxa local de deslocamento de ${formatCurrency(proposta.taxa_localidade_venda)})`;
    }
    precoServicosEl.textContent = servicosHtml;

    // Métricas ecológicas e geração
    propGeracaoKwhEl.textContent = `${geracaoKwh} kWh / mês`;
    
    const geracaoAnual = geracaoKwh * 12;
    const co2EvitadoTons = (geracaoAnual * 0.12) / 1000;
    const arvoresPlantadas = Math.round((geracaoAnual * 0.12) / 15);
    
    ecoCo2El.textContent = co2EvitadoTons.toFixed(1);
    ecoArvoresEl.textContent = arvoresPlantadas.toString();

    // Ocultar tela de loading antes de iniciar o PDF
    loadingScreen.style.display = 'none';

    // 4. Executar geração do PDF
    setTimeout(async () => {
      const docElement = document.getElementById('pdf-content');
      const opt = {
        margin:       0,
        filename:     `Proposta_Solar_${lead.nome.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: 'css' }
      };

      try {
        if (typeof html2pdf !== 'undefined') {
          await html2pdf().set(opt).from(docElement).save();
          // Fecha a aba após download automático
          setTimeout(() => {
            window.close();
          }, 1200);
        } else {
          console.warn("html2pdf não está disponível. Abrindo diálogo nativo de impressão.");
          window.print();
        }
      } catch (err) {
        console.error("Erro na geração do PDF com html2pdf:", err);
        window.print();
      }
    }, 600);

  } catch (error) {
    console.error("Erro ao carregar proposta comercial no gerador de PDF:", error);
    alert("Erro ao gerar proposta comercial.");
    window.close();
  }
});

// Helper local para telefone formatado
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
