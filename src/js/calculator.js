import { getEquipamentosLocais } from './firebase.js';
import { getSettings, getLigacaoInfo, getFioBTUSD, getFioBProgressivo } from './config.js';
import { getHSP, getHSPMensal, getVariacaoSazonal, MESES } from './irradiacao.js';
import {
  calcularTIR, calcularPaybackDetalhado,
  gerarProjecao6Anos, gerarTabelaFinanciamento, gerarFluxoCaixaAcumulado
} from './financeiro.js';

export async function gerarPropostaAsync(dadosLead, configsCustom = {}) {
  const EQUIPAMENTOS = await getEquipamentosLocais();
  return calcularProposta(dadosLead, configsCustom, EQUIPAMENTOS);
}

export function gerarProposta(dadosLead, configsCustom = {}) {
  const EQUIPAMENTOS = getEquipamentosLocais();
  return calcularProposta(dadosLead, configsCustom, EQUIPAMENTOS);
}

function calcularProposta(dadosLead, configsCustom, EQUIPAMENTOS) {
  const settings = { ...getSettings(), ...configsCustom };
  const {
    consumo_mensal_kwh,
    tipo_telha,
    orientacao = settings.orientacao || 'norte',
    inclinacao = settings.inclinacao || 10,
    tipo_ligacao = settings.tipoLigacao || 'bifasico',
    tipo_cliente = 'residencial'
  } = dadosLead;

  // ===== 1. HSP E IRRADIAÇÃO =====
  const hsp = getHSP(orientacao, inclinacao);
  const hspMensal = getHSPMensal(orientacao, inclinacao);
  const variacaoSazonal = getVariacaoSazonal(orientacao, inclinacao);

  const ligacaoInfo = getLigacaoInfo(tipo_ligacao);
  const custoDisponibilidadeKwh = ligacaoInfo.custoDisponibilidadeKwh;

  // ===== 2. DIMENSIONAMENTO =====
  const potenciaNecessariaKwp = consumo_mensal_kwh / (hsp * 30 * settings.performanceRatio);
  const painel = EQUIPAMENTOS.paineis[0];
  const potenciaPainelKw = painel.potenciaW / 1000;
  const numeroPaineis = Math.ceil(potenciaNecessariaKwp / potenciaPainelKw);
  const potenciaRealKwp = numeroPaineis * potenciaPainelKw;
  const areaNecessaria = painel.area
    ? Number((numeroPaineis * painel.area).toFixed(2))
    : Number((numeroPaineis * 2.76).toFixed(2));

  // ===== 3. SELEÇÃO DO INVERSOR =====
  const inversor = selecionarInversor(potenciaRealKwp, tipo_ligacao, EQUIPAMENTOS);
  const fatorDimensionamento = Number((potenciaRealKwp * 1000 / inversor.potenciaMaxW).toFixed(2));
  const numInversores = fatorDimensionamento > 1.6
    ? Math.ceil(potenciaRealKwp * 1000 / (inversor.potenciaMaxW * 1.2))
    : 1;

  // ===== 4. ESTRUTURA E KIT ELÉTRICO =====
  const estruturaInfo = EQUIPAMENTOS.estruturas[tipo_telha] || EQUIPAMENTOS.estruturas['ceramica'];
  const kitEletrico = EQUIPAMENTOS.kitsEletricos[0];

  // ===== 5. VALOR DO KIT (custo dos equipamentos - preço fornecedor) =====
  const custoPaineis = numeroPaineis * painel.precoUnitario;
  const custoInversor = inversor.precoUnitario * numInversores;
  const custoEstrutura = numeroPaineis * estruturaInfo.precoPorPainel;
  const custoKitEletrico = kitEletrico.precoBase + (kitEletrico.precoAdicionalPorKw * potenciaRealKwp);
  const valorKit = custoPaineis + custoInversor + custoEstrutura + custoKitEletrico;

  // ===== 6. CUSTOS ADICIONAIS (serviços não inclusos no kit) =====
  const freteValor = Number(dadosLead.frete_valor) || EQUIPAMENTOS.frete.minimo || 350.00;
  const distanciaKm = Number(dadosLead.distancia_km) || 10.0;

  let taxaLocalidade = 0.00;
  if (distanciaKm > 25.0) taxaLocalidade = 450.00;
  else if (distanciaKm >= 15.0) taxaLocalidade = 250.00;

  const servicoInfo = EQUIPAMENTOS.servicos;
  const custoServicos = servicoInfo.custoFixo + (servicoInfo.custoPorKwp * potenciaRealKwp) + taxaLocalidade;
  const custosAdicionais = custoServicos + freteValor;

  // ===== 7. FATOR DE PREÇO E PREÇO CALCULADO =====
  const fatorPreco = 1 + (settings.margemLucro / 100);
  const valorKitComMarkup = valorKit * fatorPreco;
  const custosAdicionaisComMarkup = custosAdicionais * fatorPreco;
  const precoCalculado = valorKitComMarkup + custosAdicionaisComMarkup;

  // ===== 8. IMPOSTO (alíquota sobre o lucro) =====
  const custoDiretoTotal = valorKit + custosAdicionais;
  const lucroBruto = precoCalculado - custoDiretoTotal;
  const aliquotaImposto = settings.aliquotaImposto || 0.085;
  const valorImposto = lucroBruto * aliquotaImposto;

  // ===== 9. PREÇO DE VENDA FINAL =====
  const precoFinal = precoCalculado - valorImposto;

  // ===== 10. MARGEM DE LUCRO EFETIVA =====
  const margemLucroValor = precoFinal - custoDiretoTotal;
  const margemLucroEfetiva = precoFinal > 0
    ? Number((margemLucroValor / precoFinal).toFixed(4))
    : 0;

  // ===== 11. GERAÇÃO DE ENERGIA =====
  const geracaoEstimadaKwh = Math.round(potenciaRealKwp * hsp * 30 * settings.performanceRatio);
  const geracaoAnual = geracaoEstimadaKwh * 12;
  const geracaoMensalDetalhada = hspMensal.map(
    (irr, i) => Math.round(potenciaRealKwp * irr * 30 * settings.performanceRatio)
  );
  const geracaoMaximaMensal = Math.max(...geracaoMensalDetalhada);

  // ===== 12. ANÁLISE FINANCEIRA =====
  const anoAtual = new Date().getFullYear();
  const fioBRaw = settings.fioB;
  const fioBTUSD = getFioBTUSD(anoAtual);

  const contaSemSistema = consumo_mensal_kwh * settings.tarifaEnergia;

  const autoconsumo = tipo_cliente === 'comercial' ? 0.70
    : (tipo_cliente === 'rural' ? 0.30 : 0.25);

  const tusdGAtual = fioBRaw * getFioBProgressivo(anoAtual).percFioB;
  const creditoInjecao = geracaoEstimadaKwh * (1 - autoconsumo) * (settings.tarifaEnergia - tusdGAtual);
  const consumoFaturadoSolar = Math.max(custoDisponibilidadeKwh, consumo_mensal_kwh * autoconsumo);
  const contaComSistema = Math.max(0, (consumoFaturadoSolar * settings.tarifaEnergia) - creditoInjecao);

  const economiaMensal = Math.max(0, contaSemSistema - contaComSistema);
  const economiaAnual = economiaMensal * 12;

  // ===== 13. PROJEÇÃO 6 ANOS COM FIO B PROGRESSIVO =====
  const projecao6Anos = gerarProjecao6Anos(
    precoFinal, economiaAnual, fioBRaw, settings.tarifaEnergia,
    autoconsumo, custoDisponibilidadeKwh, settings.inflacaoAnual
  );

  // ===== 14. TIR E PAYBACK =====
  const fluxos = [-precoFinal, ...projecao6Anos.map(a => a.economiaAnual)];
  const tirCalculada = calcularTIR(fluxos);
  const tirMensal = Number((tirCalculada * 100).toFixed(2));
  const tirAnual = Number(((Math.pow(1 + tirCalculada, 12) - 1) * 100).toFixed(2));

  const payback = calcularPaybackDetalhado(precoFinal, economiaAnual, settings.inflacaoAnual);
  const caixaAcumulado = gerarFluxoCaixaAcumulado(precoFinal, projecao6Anos);

  // ===== 15. FINANCIAMENTO =====
  const tabelaFinanciamento = gerarTabelaFinanciamento(precoFinal, 0);

  // ===== 16. ECOLOGIA =====
  const co2EvitadoTons = Number(((geracaoAnual * 0.12) / 1000).toFixed(1));
  const arvoresEquivalentes = Math.round((geracaoAnual * 0.12) / 15);

  // ===== RETORNO COMPLETO =====
  return {
    // ----- Dados de entrada -----
    dadosLead,
    configuracoes: {
      orientacao,
      inclinacao,
      hsp,
      hspMensal,
      tarifaEnergia: settings.tarifaEnergia,
      performanceRatio: settings.performanceRatio,
      fatorPreco,
      margemLucroNominal: settings.margemLucro,
      aliquotaImposto,
      tipoLigacao: tipo_ligacao,
      ligacaoNome: ligacaoInfo.nome,
      custoDisponibilidadeKwh,
      fioB: fioBRaw,
      fioBTUSD,
      autoconsumo,
      inflacaoAnual: settings.inflacaoAnual
    },

    // ----- Dimensionamento (equivale às linhas 18-21 do xlsm) -----
    sistema: {
      potenciaNecessariaKwp: Number(potenciaNecessariaKwp.toFixed(2)),
      potenciaRealKwp: Number(potenciaRealKwp.toFixed(2)),
      numeroPaineis,
      areaNecessaria,
      painel: {
        nome: painel.nome,
        potenciaW: painel.potenciaW,
        marca: painel.marca,
        eficiencia: painel.eficiencia || 22.6,
        areaUnidade: painel.area || 2.76,
        precoUnitario: painel.precoUnitario
      },
      inversor: {
        nome: inversor.nome,
        potenciaMaxW: inversor.potenciaMaxW,
        marca: inversor.marca,
        tipo: inversor.tipo,
        precoUnitario: inversor.precoUnitario,
        quantidade: numInversores
      },
      fatorDimensionamento,
      estrutura: {
        nome: estruturaInfo.nome,
        precoPorPainel: estruturaInfo.precoPorPainel
      },
      kitEletrico: {
        nome: kitEletrico.nome,
        precoBase: kitEletrico.precoBase,
        precoAdicionalPorKw: kitEletrico.precoAdicionalPorKw,
        itens: kitEletrico.itens || []
      }
    },

    // ----- Precificação (equivale às colunas I/J do xlsm) -----
    precificacao: {
      valorKit: Number(valorKit.toFixed(2)),
      custoServicos: Number(custoServicos.toFixed(2)),
      freteValor: Number(freteValor.toFixed(2)),
      taxaLocalidade: Number(taxaLocalidade.toFixed(2)),
      custosAdicionais: Number(custosAdicionais.toFixed(2)),
      custoDiretoTotal: Number(custoDiretoTotal.toFixed(2)),
      fatorPreco: Number(fatorPreco.toFixed(2)),
      precoCalculado: Number(precoCalculado.toFixed(2)),
      valorImposto: Number(valorImposto.toFixed(2)),
      precoFinal: Number(precoFinal.toFixed(2)),
      margemLucroValor: Number(margemLucroValor.toFixed(2)),
      margemLucroEfetiva: Number((margemLucroEfetiva * 100).toFixed(2)),
      distanciaKm
    },

    // ----- Desmembramento de preços de venda -----
    precosVenda: {
      precoPaineisKit: Number((custoPaineis + custoKitEletrico) * fatorPreco).toFixed(2),
      precoInversor: Number(custoInversor * fatorPreco).toFixed(2),
      precoEstrutura: Number(custoEstrutura * fatorPreco).toFixed(2),
      precoServicos: Number(custoServicos * fatorPreco).toFixed(2),
      precoFrete: Number(freteValor * fatorPreco).toFixed(2),
      taxaLocalidadeVenda: Number(taxaLocalidade * fatorPreco).toFixed(2)
    },

    // ----- Energia -----
    energia: {
      geracaoEstimadaKwh,
      geracaoMaximaMensal,
      geracaoAnual,
      geracaoMensal: geracaoMensalDetalhada,
      hspMensal,
      hsp,
      contaSemSistema: Number(contaSemSistema.toFixed(2)),
      contaComSistema: Number(contaComSistema.toFixed(2)),
      economiaMensal: Number(economiaMensal.toFixed(2)),
      economiaAnual: Number(economiaAnual.toFixed(2))
    },

    // ----- Financeiro -----
    financeiro: {
      paybackAnos: payback.paybackAnos,
      paybackMeses: payback.paybackMesesTotal,
      paybackSaldo: payback.saldoAcumulado,
      tirMensal,
      tirAnual,
      projecao6Anos,
      caixaAcumulado,
      tabelaFinanciamento,
      fluxosTIR: fluxos
    },

    // ----- Ecologia -----
    ecologia: {
      co2EvitadoTons,
      arvoresEquivalentes,
      geracaoAnual
    },

    MESES,
    dataCriacao: new Date().toISOString()
  };
}

function selecionarInversor(potenciaRealKwp, tipoLigacao, EQUIPAMENTOS) {
  const tensaoSistema = tipoLigacao === 'monofasico' ? 'monofasico'
    : tipoLigacao === 'trifasico' ? 'trifasico'
    : 'bifasico';

  const compativeis = EQUIPAMENTOS.inversores.filter(inv => {
    const okTipo = !(inv.tipo === 'trifasico' && tensaoSistema === 'monofasico');
    return okTipo;
  });

  if (compativeis.length === 0) return EQUIPAMENTOS.inversores[0];

  const potenciaAlvo = potenciaRealKwp * 1000;

  let melhor = compativeis[0];
  let melhorDiff = Infinity;

  for (const inv of compativeis) {
    if (inv.potenciaMaxW >= potenciaAlvo * 0.7) {
      const diff = Math.abs(inv.potenciaMaxW - potenciaAlvo * 0.83);
      if (diff < melhorDiff) {
        melhorDiff = diff;
        melhor = inv;
      }
    }
  }

  if (melhorDiff === Infinity) {
    return compativeis.reduce((a, b) =>
      Math.abs(a.potenciaMaxW - potenciaAlvo) < Math.abs(b.potenciaMaxW - potenciaAlvo) ? a : b
    );
  }

  return melhor;
}
