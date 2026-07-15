import { dbGetProposal, dbGetLead } from './firebase.js';
import { formatCurrency } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  if (!proposalId) { alert("Nenhuma proposta especificada."); window.close(); return; }

  const loadingScreen = document.getElementById('loading-screen');

  try {
    const proposta = await dbGetProposal(proposalId);
    if (!proposta) { alert("Proposta não encontrada."); window.close(); return; }

    const lead = await dbGetLead(proposta.lead_id);
    if (!lead) { alert("Lead não localizado."); window.close(); return; }

    const dc = proposta.dados_completos;
    const precoFinal = dc ? dc.precificacao.precoFinal : proposta.preco_final;
    const valorKit = dc ? dc.precificacao.valorKit : proposta.valor_kit;
    const fatorPreco = dc ? dc.precificacao.fatorPreco : proposta.fator_preco;
    const valorImposto = dc ? dc.precificacao.valorImposto : proposta.valor_imposto;
    const margemEfetiva = dc ? dc.precificacao.margemLucroEfetiva : proposta.margem_lucro_efetiva;
    const economiaAnual = dc ? dc.energia.economiaAnual : proposta.economia_anual;
    const geracaoKwh = dc ? dc.energia.geracaoEstimadaKwh : proposta.geracao_estimada_kwh;
    const geracaoAnual = dc ? dc.energia.geracaoAnual : (geracaoKwh * 12);
    const paybackAnos = dc ? dc.financeiro.paybackAnos : proposta.payback_anos;
    const paybackMeses = dc ? dc.financeiro.paybackMeses : null;
    const tirMensal = dc ? dc.financeiro.tirMensal : null;
    const potenciaKwp = dc ? dc.sistema.potenciaRealKwp : proposta.potencia_kwp;
    const numeroPaineis = dc ? dc.sistema.numeroPaineis : proposta.numero_paineis;
    const projecao6Anos = dc ? dc.financeiro.projecao6Anos : null;
    const configs = dc ? dc.configuracoes : null;
    const painelInfo = dc ? dc.sistema.painel : null;
    const inversorInfo = dc ? dc.sistema.inversor : null;

    // Page 1 - Cover
    document.getElementById('cover-potencia').textContent = `${potenciaKwp} kWp`;
    document.getElementById('lead-nome').textContent = lead.nome;
    document.getElementById('lead-contato').textContent = `Contato: ${formatPhone(lead.telefone)}`;
    document.getElementById('lead-endereco').textContent = lead.endereco || '—';
    const cidadeMatch = (lead.endereco || '').match(/\(([^)]+)\)/);
    document.getElementById('lead-cidade').textContent = cidadeMatch ? `Cidade: ${cidadeMatch[1]}` : '—';

    const dataProp = proposta.data_criacao ? new Date(proposta.data_criacao) : new Date();
    document.getElementById('prop-data').textContent = dataProp.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    // Page 2 - Vantagens + Quem Somos
    document.getElementById('eco-geracao-anual').textContent = geracaoAnual.toLocaleString('pt-BR');
    const co2Tons = dc ? dc.ecologia.co2EvitadoTons : ((geracaoAnual * 0.12) / 1000).toFixed(1);
    document.getElementById('eco-co2').textContent = dc ? dc.ecologia.co2EvitadoTons : co2Tons;

    // Page 3 - Specs + Price
    document.getElementById('spec-potencia').textContent = `${potenciaKwp} kWp`;
    const geracaoMax = dc ? Math.max(...dc.energia.geracaoMensal) : Math.round(geracaoKwh * 1.2);
    document.getElementById('spec-geracao-max').textContent = `${geracaoMax} kWh`;
    document.getElementById('cover-geracao-max').textContent = `${geracaoMax} kWh`;
    document.getElementById('spec-geracao-anual').textContent = `${geracaoAnual.toLocaleString('pt-BR')} kWh/ano`;
    document.getElementById('spec-geracao-mensal').textContent = `${geracaoKwh} kWh`;
    document.getElementById('spec-equivalente').textContent = formatCurrency(geracaoKwh * (configs ? configs.tarifaEnergia : 1.08));
    document.getElementById('spec-tarifa').textContent = formatCurrency(configs ? configs.tarifaEnergia : 1.08) + '/kWh';
    document.getElementById('spec-eficiencia').textContent = painelInfo ? `${painelInfo.eficiencia || '22.6'}%` : '22.6%';
    document.getElementById('spec-area').textContent = dc ? `${dc.sistema.areaNecessaria} m²` : '—';

    // Spec list
    const specList = document.getElementById('spec-list');
    const painelNome = painelInfo ? painelInfo.nome : proposta.painel_selecionado;
    const inversorNome = inversorInfo ? inversorInfo.nome : proposta.inversor_selecionado;
    const estruturaNome = dc ? dc.sistema.estrutura.nome : proposta.estrutura_selecionada;
    const precoInversorVenda = dc ? dc.precosVenda.precoInversor : proposta.preco_inversor; 
    const precoEstruturaVenda = dc ? dc.precosVenda.precoEstrutura : proposta.preco_estrutura;
    const precoPaineisVenda = dc ? dc.precosVenda.precoPaineisKit : proposta.preco_paineis;
    const precoServicosVenda = dc ? dc.precosVenda.precoServicos : proposta.preco_servicos;

    specList.innerHTML = `
      <div class="spec-row"><span class="label">Inversor Solar</span><span class="value">${inversorNome}</span><span class="price">${formatCurrency(precoInversorVenda)}</span></div>
      <div class="spec-row"><span class="label">Quadro de Proteção CA</span><span class="value">String Box com DPS</span><span class="price">Incluso</span></div>
      <div class="spec-row"><span class="label">Estrutura de Fixação</span><span class="value">${estruturaNome}</span><span class="price">${formatCurrency(precoEstruturaVenda)}</span></div>
      <div class="spec-row"><span class="label">Módulos</span><span class="value">${numeroPaineis}x ${painelNome}</span><span class="price">${formatCurrency(precoPaineisVenda)}</span></div>
      <div class="spec-row"><span class="label">Mão de Obra de Instalação</span><span class="value">Engenharia + Homologação</span><span class="price">${formatCurrency(precoServicosVenda)}</span></div>
      <div class="spec-row"><span class="label">Projeto de Homologação</span><span class="value">ART + Projeto Elétrico</span><span class="price">Incluso</span></div>
    `;

    document.getElementById('prop-preco-final').textContent = formatCurrency(precoFinal);

    // Page 4 - Financial analysis
    const projTable = document.getElementById('projecaoTable');
    if (projecao6Anos && projTable) {
      let acumulado = -precoFinal;
      let html = '';
      projecao6Anos.forEach(ano => {
        acumulado += ano.economiaAnual;
        const positivo = acumulado >= 0;
        html += `<tr style="${positivo ? 'background:#f0fdf4;' : ''}">
          <td style="font-weight:600;">${ano.ano}</td>
          <td style="text-align:center;">${formatCurrency(ano.contaSemSistema)}</td>
          <td style="text-align:center;">${formatCurrency(ano.contaComSistema)}</td>
          <td style="text-align:right;font-weight:700;color:${positivo ? '#16a34a' : '#ef4444'};">${formatCurrency(acumulado)}</td>
        </tr>`;
      });
      projTable.innerHTML = html;
    }

    if (paybackMeses) {
      const a = Math.floor(paybackMeses / 12);
      const m = paybackMeses % 12;
      document.getElementById('prop-payback').textContent = `${a} ${a === 1 ? 'ano' : 'anos'} e ${m} ${m === 1 ? 'mês' : 'meses'}`;
      document.getElementById('prop-payback-meses').textContent = `${paybackMeses} meses`;
    } else {
      document.getElementById('prop-payback').textContent = `${paybackAnos} ${paybackAnos === 1 ? 'ano' : 'anos'}`;
    }

    document.getElementById('prop-tir').textContent = tirMensal !== null ? `${tirMensal}%` : '—';

    document.getElementById('fio-tarifa').textContent = configs ? formatCurrency(configs.tarifaEnergia) : '—';
    document.getElementById('fio-percentual').textContent = configs ? `${(configs.fioBTUSD * 100).toFixed(1)}` : '28.5';
    document.getElementById('fio-autoconsumo').textContent = configs ? `${(configs.autoconsumo * 100).toFixed(0)}` : '25';
    document.getElementById('fio-disponibilidade').textContent = configs ? configs.custoDisponibilidadeKwh : '50';

    // Page 5 - Warranties
    if (inversorInfo) {
      document.getElementById('garantia-inversor-marca').textContent = inversorInfo.marca || 'Solis';
    }
    if (painelInfo) {
      document.getElementById('garantia-modulo-marca').textContent = painelInfo.marca || 'Ronma Solar';
    }

    document.getElementById('pdf-signature-client-name').textContent = lead.nome;

    // Chart on page 3
    setTimeout(() => {
      const container = document.getElementById('graficoGeracao');
      if (container && typeof ApexCharts !== 'undefined') {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        let dados;
        if (dc && dc.energia.geracaoMensal) {
          dados = dc.energia.geracaoMensal;
        } else {
          const variacao = [1.15, 1.05, 0.95, 0.85, 0.75, 0.68, 0.72, 0.80, 0.90, 1.05, 1.12, 1.20];
          dados = variacao.map(v => Math.round(geracaoKwh * v));
        }
        const chart = new ApexCharts(container, {
          series: [{ name: 'Geração (kWh)', data: dados }],
          chart: { type: 'bar', height: 170, toolbar: { show: false }, background: 'transparent' },
          plotOptions: { bar: { borderRadius: 3, columnWidth: '50%' } },
          colors: ['#FFD700'],
          dataLabels: { enabled: false },
          xaxis: { categories: meses, labels: { style: { colors: '#64748b', fontSize: '9px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: { colors: '#64748b', fontSize: '8px' } } },
          grid: { borderColor: '#f1f5f9', yaxis: { lines: { show: false } } },
          tooltip: { y: { formatter: val => `${val} kWh` } }
        });
        chart.render();
      }
    }, 100);

    loadingScreen.style.display = 'none';

    // Generate PDF
    setTimeout(async () => {
      const docElement = document.getElementById('pdf-content');
      const opt = {
        margin: 0,
        filename: `Proposta_Solar_Spark_${lead.nome.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      try {
        if (typeof html2pdf !== 'undefined') {
          await html2pdf().set(opt).from(docElement).save();
          setTimeout(() => { window.close(); }, 1200);
        } else {
          window.print();
        }
      } catch (err) {
        console.error("Erro na geração do PDF:", err);
        window.print();
      }
    }, 800);

  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Erro ao gerar proposta comercial.");
    window.close();
  }
});

function formatPhone(value) {
  if (!value) return '';
  value = value.replace(/\D/g, '');
  if (value.length === 11) return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  if (value.length === 10) return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
  return value;
}
