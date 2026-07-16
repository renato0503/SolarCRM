import { dbGetProposal, dbGetLead } from './firebase.js';
import { formatCurrency, showToast } from './utils.js';
import { getSettings } from './config.js';
import { gerarTabelaFinanciamento } from './financeiro.js';
import { animate } from 'https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  if (!proposalId) {
    alert("Nenhuma proposta especificada na URL.");
    window.location.href = "./index.html";
    return;
  }

  try {
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

    const dc = proposta.dados_completos;

    const precoFinal = dc ? dc.precificacao.precoFinal : proposta.preco_final;
    const valorKit = dc ? dc.precificacao.valorKit : proposta.valor_kit;
    const fatorPreco = dc ? dc.precificacao.fatorPreco : proposta.fator_preco;
    const valorImposto = dc ? dc.precificacao.valorImposto : proposta.valor_imposto;
    const margemEfetiva = dc ? dc.precificacao.margemLucroEfetiva : proposta.margem_lucro_efetiva;
    const economiaAnual = dc ? dc.energia.economiaAnual : proposta.economia_anual;
    const economiaMensal = dc ? dc.energia.economiaMensal : proposta.economia_mensal;
    const geracaoKwh = dc ? dc.energia.geracaoEstimadaKwh : proposta.geracao_estimada_kwh;
    const paybackAnos = dc ? dc.financeiro.paybackAnos : proposta.payback_anos;
    const paybackMeses = dc ? dc.financeiro.paybackMeses : proposta.payback_meses;
    const tirMensal = dc ? dc.financeiro.tirMensal : (proposta.tir_mensal ?? null);
    const tirAnual = dc ? dc.financeiro.tirAnual : (proposta.tir_anual ?? null);
    const potenciaKwp = dc ? dc.sistema.potenciaRealKwp : proposta.potencia_kwp;
    const numeroPaineis = dc ? dc.sistema.numeroPaineis : proposta.numero_paineis;
    const areaNecessaria = dc ? dc.sistema.areaNecessaria : null;
    const painelInfo = dc ? dc.sistema.painel : null;
    const inversorInfo = dc ? dc.sistema.inversor : null;
    const projecao6Anos = dc ? dc.financeiro.projecao6Anos : null;
    const tabelaFinanciamento = dc ? dc.financeiro.tabelaFinanciamento : null;
    const configs = dc ? dc.configuracoes : null;
    const co2Tons = dc ? dc.ecologia.co2EvitadoTons : null;
    const arvores = dc ? dc.ecologia.arvoresEquivalentes : null;
    const geracaoMensal = dc ? dc.energia.geracaoMensal : null;
    const hspMensal = dc ? dc.energia.hspMensal : null;

    const settings = getSettings();

    // Header
    document.getElementById('lead-nome').textContent = lead.nome;
    document.getElementById('lead-contatos').textContent = `WhatsApp: ${formatPhone(lead.telefone)} | E-mail: ${lead.email}`;
    document.getElementById('lead-endereco').textContent = lead.endereco;
    const leadCidadeEl = document.getElementById('lead-cidade');
    if (leadCidadeEl) leadCidadeEl.textContent = lead.endereco || '';
    const dataProp = proposta.data_criacao ? new Date(proposta.data_criacao) : new Date();
    document.getElementById('prop-data').textContent = dataProp.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    document.getElementById('pdf-signature-client-name').textContent = lead.nome;

    // Financial cards
    document.getElementById('prop-economia-anual').textContent = formatCurrency(economiaAnual);
    document.getElementById('prop-preco-final').textContent = formatCurrency(precoFinal);
    const economia25Anos = economiaAnual * 25;
    document.getElementById('prop-economia-25anos').textContent = `Economia de até ${formatCurrency(economia25Anos)} em 25 anos`;

    // Payback
    if (paybackMeses) {
      const anos = Math.floor(paybackMeses / 12);
      const meses = paybackMeses % 12;
      document.getElementById('prop-payback').textContent = `${anos}a ${meses}m`;
      document.getElementById('prop-payback-detail').textContent = `${paybackMeses} meses`;
    } else {
      document.getElementById('prop-payback').textContent = `${paybackAnos} ${paybackAnos === 1 ? 'ano' : 'anos'}`;
    }

    document.getElementById('prop-tir').textContent = tirMensal ? `${tirMensal}% a.m.` : '—';

    // Specs
    const precoKitGeradorVenda = dc ? Number(dc.precosVenda.precoKitGerador) : 0;
    const precoEstruturaVenda = dc ? Number(dc.precosVenda.precoEstrutura) : (proposta.preco_estrutura || 0);
    const precoServicosVenda = dc ? Number(dc.precosVenda.precoServicos) : (proposta.preco_servicos || 0);
    const precoFreteVenda = dc ? Number(dc.precosVenda.precoFrete) : (proposta.preco_frete || 0);
    const taxaLocalidadeVenda = dc ? Number(dc.precosVenda.taxaLocalidadeVenda) : (proposta.taxa_localidade_venda || 0);

    document.getElementById('spec-paineis').innerHTML = `${numeroPaineis}x ${painelInfo ? painelInfo.nome : proposta.painel_selecionado}<br><span style="font-weight:500;font-size:0.8125rem;color:var(--text-muted);display:block;margin-top:0.15rem;">Kit Gerador: <strong>${formatCurrency(precoKitGeradorVenda)}</strong></span>`;
    document.getElementById('spec-inversor').innerHTML = `${inversorInfo ? inversorInfo.nome : proposta.inversor_selecionado}<br><span style="font-weight:500;font-size:0.8125rem;color:var(--text-muted);display:block;margin-top:0.15rem;">Inversor Homologado: <strong>Incluso no kit</strong></span>`;
    const estruturaNome = dc ? dc.sistema.estrutura.nome : proposta.estrutura_selecionada;
    document.getElementById('spec-estrutura').innerHTML = `${estruturaNome}<br><span style="font-weight:500;font-size:0.8125rem;color:var(--text-muted);display:block;margin-top:0.15rem;">Suportes de Alumínio: <strong>${formatCurrency(precoEstruturaVenda)}</strong></span>`;

    const specServicoEl = document.getElementById('spec-servico');
    if (specServicoEl) {
      let html = `Projeto, ART, Homologação e Instalação<br><span style="font-weight:500;font-size:0.8125rem;color:var(--text-muted);display:block;margin-top:0.15rem;">Mão de Obra e Engenharia: <strong>${formatCurrency(precoServicosVenda)}</strong>`;
      if (taxaLocalidadeVenda > 0) {
        html += ` (inclui taxa local de <strong>${formatCurrency(taxaLocalidadeVenda)}</strong>)`;
      }
      html += `</span>`;
      specServicoEl.innerHTML = html;
    }

    // System info
    if (dc) {
      document.getElementById('prop-potencia').textContent = `${potenciaKwp} kWp`;
      document.getElementById('prop-area').textContent = areaNecessaria ? `${areaNecessaria} m²` : '—';
      document.getElementById('prop-rendimento').textContent = `${(dc.configuracoes.performanceRatio * 100).toFixed(0)}%`;
      document.getElementById('prop-hsp').textContent = `${dc.energia.hsp} kWh/m²/dia`;
      document.getElementById('prop-ligacao').textContent = dc.configuracoes.ligacaoNome;
    }

    // Ecology
    document.getElementById('prop-geracao-kwh').textContent = `${geracaoKwh} kWh / mês`;
    if (co2Tons !== null) {
      document.getElementById('eco-co2').textContent = co2Tons;
      document.getElementById('eco-arvores').textContent = arvores;
    } else {
      const geracaoAnual = geracaoKwh * 12;
      document.getElementById('eco-co2').textContent = ((geracaoAnual * 0.12) / 1000).toFixed(1);
      document.getElementById('eco-arvores').textContent = Math.round((geracaoAnual * 0.12) / 15);
    }

    // Chart
    setTimeout(() => {
      if (geracaoMensal) {
        criarGraficoGeracao(geracaoMensal, geracaoKwh);
      } else {
        criarGraficoGeracaoLegado(geracaoKwh);
      }
    }, 150);

    // Financing table
    if (tabelaFinanciamento && tabelaFinanciamento.length > 0) {
      gerarTabelaFinanciamentoHtml(tabelaFinanciamento);
    } else {
      gerarTabelaParcelasLegado(precoFinal);
    }

    // Entrada slider
    const entradaSlider = document.getElementById('entradaSlider');
    const entradaVal = document.getElementById('entradaVal');
    entradaSlider?.addEventListener('input', () => {
      const pct = parseInt(entradaSlider.value);
      const entradaValor = precoFinal * (pct / 100);
      if (entradaVal) entradaVal.textContent = formatCurrency(entradaValor);
      const saldo = precoFinal - entradaValor;
      const comEntrada = gerarTabelaFinanciamento(precoFinal, entradaValor);
      gerarTabelaFinanciamentoHtml(comEntrada);
    });

    // 6-year projection
    if (projecao6Anos) {
      gerarProjecao6AnosHtml(projecao6Anos, precoFinal);
    }

    // Animations
    animate("#cardSpecs", { opacity: [0, 1], y: [30, 0] }, { duration: 0.8, easing: "ease-out" });
    animate("#cardImpact", { opacity: [0, 1], y: [30, 0] }, { duration: 0.8, easing: "ease-out", delay: 0.2 });

    animarContadorNumero(economiaAnual, document.getElementById('prop-economia-anual'));

    // Buttons
    document.getElementById('btnWhatsappVendedor').addEventListener('click', () => {
      const foneConsultor = (settings.empresaTelefone || "5566996517782").replace(/\D/g, '');
      const mensagem = `Olá! Meu nome é *${lead.nome}* e acabei de realizar uma simulação solar personalizada na Spark.%0A%0A` +
        `📊 *Resumo do meu projeto:*%0A` +
        `• *Potência*: ${potenciaKwp} kWp (${numeroPaineis} painéis)%0A` +
        `• *Geração Estimada*: ${geracaoKwh} kWh/mês%0A` +
        `• *Economia Anual*: ${formatCurrency(economiaAnual)}%0A` +
        `• *Investimento*: ${formatCurrency(precoFinal)}%0A` +
        `• *Payback*: ${paybackAnos} anos%0A%0A` +
        `Gostaria de falar com um especialista sobre o projeto e formas de pagamento. Podemos conversar?`;
      window.open(`https://wa.me/${foneConsultor}?text=${mensagem}`, '_blank');
    });

    document.getElementById('btnPdf').addEventListener('click', () => {
      showToast("Preparando PDF. O download iniciará em uma nova aba...", "info");
      window.open(`./pdf.html?id=${proposalId}`, '_blank');
    });

    // Preview Modal
    const previewModal = document.getElementById('previewModal');
    const previewContent = document.getElementById('previewContent');
    const btnPreview = document.getElementById('btnPreview');
    const btnClosePreview = document.getElementById('btnClosePreview');
    const btnPrintFromPreview = document.getElementById('btnPrintFromPreview');

    btnPreview?.addEventListener('click', () => {
      const doc = document.getElementById('proposal-document');
      if (doc && previewContent) {
        previewContent.innerHTML = doc.cloneNode(true).innerHTML;
        previewModal.style.display = 'flex';
      }
    });

    btnClosePreview?.addEventListener('click', () => {
      previewModal.style.display = 'none';
    });

    previewModal?.addEventListener('click', (e) => {
      if (e.target === previewModal) previewModal.style.display = 'none';
    });

    btnPrintFromPreview?.addEventListener('click', () => {
      window.print();
    });

    const btnPdfCerrado = document.getElementById('btnPdfCerrado');
    if (btnPdfCerrado) {
      btnPdfCerrado.addEventListener('click', () => {
        showToast("Gerando Proposta CERRADO...", "info");
        window.open(`./pdf-cerrado.html?id=${proposalId}`, '_blank');
      });
    }

  } catch (error) {
    console.error("Erro ao carregar proposta comercial:", error);
    showToast("Erro ao buscar dados da proposta. Recarregue a página.", "error");
  }
});

function animarContadorNumero(valorFinal, elemento) {
  const duracao = 1500;
  const tempoInicio = performance.now();
  function atualizar(tempoAtual) {
    const progresso = Math.min((tempoAtual - tempoInicio) / duracao, 1);
    const progressoSuave = 1 - Math.pow(1 - progresso, 3);
    elemento.textContent = formatCurrency(Math.round(progressoSuave * valorFinal));
    if (progresso < 1) requestAnimationFrame(atualizar);
  }
  requestAnimationFrame(atualizar);
}

function gerarTabelaFinanciamentoHtml(tabela) {
  const tableEl = document.getElementById('parcelasTable');
  if (!tableEl) return;
  let html = '';
  tabela.slice(0, 5).forEach(op => {
    html += `<tr style="border-bottom:1px solid var(--border-color);">
      <td style="padding:0.75rem 1rem;font-weight:600;">${op.parcelas}x</td>
      <td style="padding:0.75rem 1rem;text-align:center;color:var(--solar-orange);font-weight:700;">${formatCurrency(op.valorParcela)}</td>
      <td style="padding:0.75rem 1rem;text-align:center;">${formatCurrency(op.valorTotal)}</td>
      <td style="padding:0.75rem 1rem;text-align:center;font-size:0.75rem;color:var(--text-muted);">${op.banco}</td>
    </tr>`;
  });
  tableEl.innerHTML = html;
}

function gerarTabelaParcelasLegado(valorTotal) {
  const tableEl = document.getElementById('parcelasTable');
  if (!tableEl) return;
  const taxaMensal = 0.0149;
  const opcoes = [12, 24, 36, 48, 60];
  let html = '';
  opcoes.forEach(n => {
    const parcela = valorTotal * (taxaMensal * Math.pow(1 + taxaMensal, n)) / (Math.pow(1 + taxaMensal, n) - 1);
    const total = parcela * n;
    html += `<tr style="border-bottom:1px solid var(--border-color);">
      <td style="padding:0.75rem 1rem;font-weight:600;">${n}x</td>
      <td style="padding:0.75rem 1rem;text-align:center;color:var(--solar-orange);font-weight:700;">${formatCurrency(parcela)}</td>
      <td style="padding:0.75rem 1rem;text-align:center;">${formatCurrency(total)}</td>
      <td style="padding:0.75rem 1rem;text-align:center;color:var(--text-muted);">—</td>
    </tr>`;
  });
  tableEl.innerHTML = html;
}

function gerarProjecao6AnosHtml(projecao, investimento) {
  const tableEl = document.getElementById('projecaoTable');
  if (!tableEl) return;
  let acumulado = -investimento;
  let html = '';
  projecao.forEach(ano => {
    acumulado += ano.economiaAnual;
    const positivo = acumulado >= 0;
    html += `<tr style="border-bottom:1px solid var(--border-color);${positivo ? 'background:rgba(34,197,94,0.05);' : ''}">
      <td style="padding:0.6rem 0.75rem;font-weight:600;">${ano.ano}</td>
      <td style="padding:0.6rem 0.75rem;">${formatCurrency(ano.contaSemSistema)}</td>
      <td style="padding:0.6rem 0.75rem;color:var(--solar-orange);">${formatCurrency(ano.contaComSistema)}</td>
      <td style="padding:0.6rem 0.75rem;color:${positivo ? 'var(--status-fechado)' : 'var(--status-perdido)'};font-weight:700;">${formatCurrency(acumulado)}</td>
    </tr>`;
  });
  tableEl.innerHTML = html;
}

function formatPhone(value) {
  if (!value) return '';
  value = value.replace(/\D/g, '');
  if (value.length === 11) return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  if (value.length === 10) return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
  return value;
}

function criarGraficoGeracao(dadosMensais, media) {
  const container = document.getElementById('graficoGeracao');
  if (!container || window.graficoGeracaoInstance || typeof ApexCharts === 'undefined') return;
  if (window.graficoGeracaoInstance) window.graficoGeracaoInstance.destroy();
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const options = {
    series: [{ name: 'Geração (kWh)', data: dadosMensais }],
    chart: { type: 'bar', height: 130, toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
    colors: ['#FFD700'],
    dataLabels: { enabled: false },
    xaxis: { categories: meses, labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '10px' } } },
    grid: { borderColor: 'rgba(255,255,255,0.05)', xaxis: { lines: { show: false } }, yaxis: { lines: { show: false } } },
    tooltip: { theme: 'dark', y: { formatter: (val) => `${val} kWh` } }
  };
  window.graficoGeracaoInstance = new ApexCharts(container, options);
  window.graficoGeracaoInstance.render();
}

function criarGraficoGeracaoLegado(geracaoMensalKwh) {
  const container = document.getElementById('graficoGeracao');
  if (!container || window.graficoGeracaoInstance || typeof ApexCharts === 'undefined') return;
  if (window.graficoGeracaoInstance) window.graficoGeracaoInstance.destroy();
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const variacao = [1.15, 1.05, 0.95, 0.85, 0.75, 0.68, 0.72, 0.80, 0.90, 1.05, 1.12, 1.20];
  const dados = variacao.map(v => Math.round(geracaoMensalKwh * v));
  const options = {
    series: [{ name: 'Geração (kWh)', data: dados }],
    chart: { type: 'bar', height: 130, toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
    colors: ['#FFD700'],
    dataLabels: { enabled: false },
    xaxis: { categories: meses, labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '10px' } } },
    yaxis: { labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '10px' } } },
    grid: { borderColor: 'rgba(255,255,255,0.05)' },
    tooltip: { theme: 'dark' }
  };
  window.graficoGeracaoInstance = new ApexCharts(container, options);
  window.graficoGeracaoInstance.render();
}
