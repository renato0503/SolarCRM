import { dbGetProposal, dbGetLead } from './firebase.js';
import { formatCurrency } from './utils.js';
import { getSettings } from './config';
import { animate } from 'motion';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Obter ID da proposta pela URL
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  if (!proposalId) {
    alert("Nenhuma proposta especificada na URL.");
    window.location.href = "./index.html";
    return;
  }

  // Elementos do DOM
  const leadNomeEl = document.getElementById('lead-nome');
  const leadContatosEl = document.getElementById('lead-contatos');
  const leadEnderecoEl = document.getElementById('lead-endereco');
  const propDataEl = document.getElementById('prop-data');
  
  const propEconomiaAnualEl = document.getElementById('prop-economia-anual');
  const propEconomia25AnosEl = document.getElementById('prop-economia-25anos');
  const propPrecoFinalEl = document.getElementById('prop-preco-final');
  const propPaybackEl = document.getElementById('prop-payback');

  const specPaineisEl = document.getElementById('spec-paineis');
  const specInversorEl = document.getElementById('spec-inversor');
  const specEstruturaEl = document.getElementById('spec-estrutura');
  
  const propGeracaoKwhEl = document.getElementById('prop-geracao-kwh');
  const ecoCo2El = document.getElementById('eco-co2');
  const ecoArvoresEl = document.getElementById('eco-arvores');
  
  const btnPdf = document.getElementById('btnPdf');
  const btnWhatsappVendedor = document.getElementById('btnWhatsappVendedor');

  try {
    // 2. Carregar dados da proposta e do lead
    const proposta = await dbGetProposal(proposalId);
    if (!proposta) {
      alert("Proposta comercial não encontrada.");
      window.location.href = "./index.html";
      return;
    }

    const lead = await dbGetLead(proposta.lead_id);
    if (!lead) {
      alert("Lead associado à proposta não foi localizado.");
      window.location.href = "./index.html";
      return;
    }

    const settings = getSettings();

    // 3. Preencher dados do Lead e Proposta no DOM
    leadNomeEl.textContent = lead.nome;
    leadContatosEl.textContent = `WhatsApp: ${formatPhone(lead.telefone)} | E-mail: ${lead.email}`;
    leadEnderecoEl.textContent = lead.endereco;
    
    const pdfSigClient = document.getElementById('pdf-signature-client-name');
    if (pdfSigClient) {
      pdfSigClient.textContent = lead.nome;
    }

    const dataProp = proposta.data_criacao ? new Date(proposta.data_criacao) : new Date();
    propDataEl.textContent = `Simulado em: ${dataProp.toLocaleDateString('pt-BR')}`;

    // Valores finais para animação
    const precoFinal = proposta.preco_final;
    const economiaAnual = proposta.economia_anual;
    const geracaoKwh = proposta.geracao_estimada_kwh;
    
    propPrecoFinalEl.textContent = formatCurrency(precoFinal);
    propPaybackEl.textContent = `${proposta.payback_anos} ${proposta.payback_anos === 1 ? 'ano' : 'anos'}`;

    // Economia acumulada em 25 anos (Tempo médio de vida útil do sistema)
    const economia25Anos = economiaAnual * 25;
    propEconomia25AnosEl.textContent = `Economia de até ${formatCurrency(economia25Anos)} em 25 anos`;

    // Especificações
    specPaineisEl.textContent = `${proposta.numero_paineis}x ${proposta.painel_selecionado}`;
    specInversorEl.textContent = proposta.inversor_selecionado;
    specEstruturaEl.textContent = proposta.estrutura_selecionada;

    const specFreteEl = document.getElementById('spec-frete');
    if (specFreteEl) {
      const dist = proposta.distancia_km || 10.0;
      const freteVal = proposta.frete_valor || 350.00;
      specFreteEl.textContent = `${formatCurrency(freteVal)} (Distância calculada: ${dist} km)`;
    }

    // Métricas ecológicas e geração
    propGeracaoKwhEl.textContent = `${geracaoKwh} kWh / mês`;
    
    // Geração anual total = geracaoKwh * 12
    const geracaoAnual = geracaoKwh * 12;
    // 0.12 kg de CO2 evitados por kWh gerado
    const co2EvitadoTons = (geracaoAnual * 0.12) / 1000;
    // 1 árvore para cada 15 kg de CO2
    const arvoresPlantadas = Math.round((geracaoAnual * 0.12) / 15);
    
    ecoCo2El.textContent = co2EvitadoTons.toFixed(1);
    ecoArvoresEl.textContent = arvoresPlantadas.toString();

    // 4. Animações com Motion One
    // Fade-in e Slide-up dos cards técnicos
    animate("#cardSpecs", { opacity: [0, 1], y: [30, 0] }, { duration: 0.8, easing: "ease-out" });
    animate("#cardImpact", { opacity: [0, 1], y: [30, 0] }, { duration: 0.8, easing: "ease-out", delay: 0.2 });

    // Animação da contagem de Economia Anual
    animarContadorNumero(economiaAnual, propEconomiaAnualEl);

    // 5. Configurar Botão do WhatsApp (Cliente fala com o Vendedor)
    btnWhatsappVendedor.addEventListener('click', () => {
      const foneConsultor = (settings.empresaTelefone || "5567993515206").replace(/\D/g, '');
      
      const mensagem = `Olá! Meu nome é *${lead.nome}* e acabei de realizar uma simulação solar personalizada no SolarCRM.%0A%0A` +
        `📊 *Resumo do meu projeto:*%0A` +
        `• *Potência*: ${proposta.potencia_kwp} kWp (${proposta.numero_paineis} painéis)%0A` +
        `• *Geração Estimada*: ${proposta.geracao_estimada_kwh} kWh/mês%0A` +
        `• *Economia Anual*: ${formatCurrency(proposta.economia_anual)}%0A` +
        `• *Investimento*: ${formatCurrency(proposta.preco_final)}%0A` +
        `• *Payback*: ${proposta.payback_anos} anos%0A%0A` +
        `Gostaria de falar com um especialista para tirar dúvidas sobre o projeto e formas de pagamento. Podemos conversar?`;

      const url = `https://wa.me/${foneConsultor}?text=${mensagem}`;
      window.open(url, '_blank');
    });

    // 6. Configurar Botão de PDF
    btnPdf.addEventListener('click', async () => {
      // Ativa classe de estilo de impressão PDF
      document.body.classList.add('pdf-mode');
      showToast("Gerando arquivo PDF. Aguarde...", "info");

      // Atraso de 150ms para permitir que o navegador repinte a tela em modo PDF antes da captura
      await new Promise(resolve => setTimeout(resolve, 150));

      try {
        const docElement = document.getElementById('proposal-document');
        
        const opt = {
          margin:       0,
          filename:     `Proposta_Solar_${lead.nome.replace(/\s+/g, '_')}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        if (typeof html2pdf !== 'undefined') {
          await html2pdf().set(opt).from(docElement).save();
          showToast("PDF baixado com sucesso!", "success");
        } else {
          console.warn("html2pdf não está disponível. Abrindo diálogo nativo de impressão.");
          showToast("Abrindo diálogo de impressão. Escolha 'Salvar como PDF'.", "info");
          window.print();
        }
      } catch (err) {
        console.error("Erro na geração do PDF com html2pdf:", err);
        showToast("Erro ao gerar PDF. Abrindo diálogo nativo de impressão...", "error");
        window.print();
      } finally {
        // Sempre desativa o estilo de impressão PDF
        document.body.classList.remove('pdf-mode');
      }
    });

  } catch (error) {
    console.error("Erro ao carregar proposta comercial:", error);
    showToast("Erro ao buscar dados da proposta. Recarregue a página.", "error");
  }
});

/**
 * Função de animação de contagem de números de 0 até o valor final.
 */
function animarContadorNumero(valorFinal, elemento) {
  const duracao = 1500; // ms
  const tempoInicio = performance.now();
  
  function atualizar(tempoAtual) {
    const tempoDecorrido = tempoAtual - tempoInicio;
    const progresso = Math.min(tempoDecorrido / duracao, 1);
    
    // Função de atenuação suave (ease-out cubic)
    const progressoSuave = 1 - Math.pow(1 - progresso, 3);
    const valorAtual = Math.round(progressoSuave * valorFinal);
    
    elemento.textContent = formatCurrency(valorAtual);
    
    if (progresso < 1) {
      requestAnimationFrame(atualizar);
    }
  }
  
  requestAnimationFrame(atualizar);
}

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
