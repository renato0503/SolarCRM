import { EQUIPAMENTOS } from './equipamentos.js';
import { getSettings } from './config.js';

/**
 * Calcula a proposta solar com base nos dados do lead e configurações atuais.
 * @param {Object} dadosLead 
 * @param {Object} [configsCustom] - Permite sobrescrever configurações globais
 * @returns {Object} Proposta completa
 */
export function gerarProposta(dadosLead, configsCustom = {}) {
  const settings = { ...getSettings(), ...configsCustom };
  const { consumo_mensal_kwh, tipo_telha } = dadosLead;
  
  // 1. Potência Necessária (kWp)
  // Fórmula: consumo / (HSP * 30 * PR)
  const potenciaNecessariaKwp = consumo_mensal_kwh / (settings.hsp * 30 * settings.performanceRatio);
  
  // 2. Painéis Solares
  const painel = EQUIPAMENTOS.paineis[0]; // Usamos o painel de 550W padrão
  const potenciaPainelKw = painel.potenciaW / 1000;
  const numeroPaineis = Math.ceil(potenciaNecessariaKwp / potenciaPainelKw);
  const potenciaRealKwp = numeroPaineis * potenciaPainelKw;
  const custoPaineis = numeroPaineis * painel.precoUnitario;
  
  // 3. Inversor
  // Inversores admitem sobredimensionamento (overclock) de até 20% (ou seja, potência real * 0.83 >= potência nominal)
  let inversorSelecionado = EQUIPAMENTOS.inversores.find(
    inv => inv.potenciaMaxW >= (potenciaRealKwp * 1000 * 0.83)
  );
  
  // Se for maior que todos, escolhe o maior disponível
  if (!inversorSelecionado) {
    inversorSelecionado = EQUIPAMENTOS.inversores[EQUIPAMENTOS.inversores.length - 1];
  }
  const custoInversor = inversorSelecionado.precoUnitario;
  
  // 4. Estrutura de Fixação
  const estruturaInfo = EQUIPAMENTOS.estruturas[tipo_telha] || EQUIPAMENTOS.estruturas['ceramica'];
  const custoEstrutura = numeroPaineis * estruturaInfo.precoPorPainel;
  
  // 5. Kit Elétrico
  const kitEletrico = EQUIPAMENTOS.kitsEletricos[0];
  const custoKitEletrico = kitEletrico.precoBase + (kitEletrico.precoAdicionalPorKw * potenciaRealKwp);
  
  // 6. Custo Total de Equipamentos (Subtotal)
  const custoEquipamentos = custoPaineis + custoInversor + custoEstrutura + custoKitEletrico;
  
  // 7. Serviços de Engenharia e Instalação
  // Frete e Logística (calculado e repassado por CEP)
  const freteValor = Number(dadosLead.frete_valor) || 350.00;
  const distanciaKm = Number(dadosLead.distancia_km) || 10.0;

  // 7. Serviços de Engenharia e Instalação
  const servicoInfo = EQUIPAMENTOS.servicos;
  
  // Taxa de deslocamento de instalação em função da localidade (CEP)
  let taxaInstalacaoLocalidade = 0.00;
  if (distanciaKm > 25.0) {
    taxaInstalacaoLocalidade = 450.00;
  } else if (distanciaKm >= 15.0) {
    taxaInstalacaoLocalidade = 250.00;
  }
  
  const custoServicos = servicoInfo.custoFixo + (servicoInfo.custoPorKwp * potenciaRealKwp) + taxaInstalacaoLocalidade;
  
  // Custo Direto Total (Equipamentos + Serviços + Frete)
  const custoDiretoTotal = custoEquipamentos + custoServicos + freteValor;
  
  // 8. Preço Final (Com Margem de Lucro)
  const margem = settings.margemLucro; // ex: 30%
  const precoFinal = custoDiretoTotal * (1 + margem / 100);
  const margemLucroValor = precoFinal - custoDiretoTotal;

  // Preços finais de venda (com margem incluída) para exibição detalhada ao cliente
  const markupFactor = (1 + margem / 100);
  const precoPaineis = (custoPaineis + custoKitEletrico) * markupFactor;
  const precoInversor = custoInversor * markupFactor;
  const precoEstrutura = custoEstrutura * markupFactor;
  const precoServicos = custoServicos * markupFactor;
  const precoFrete = freteValor * markupFactor;
  const taxaLocalidadeVenda = taxaInstalacaoLocalidade * markupFactor;
  
  // 9. Geração Estimada de Energia (Mensal)
  const geracaoEstimadaKwh = potenciaRealKwp * settings.hsp * 30 * settings.performanceRatio;
  
  // 10. Economia e Retorno Financeiro
  // Descontamos a taxa mínima obrigatória de rede para calcular a economia real
  const consumoFaturável = Math.max(0, consumo_mensal_kwh - settings.taxaMinimaGrid);
  const economiaMensal = consumoFaturável * settings.tarifaEnergia;
  const economiaAnual = economiaMensal * 12;
  const paybackAnos = economiaAnual > 0 ? (precoFinal / economiaAnual) : 0;
  
  return {
    dadosLead,
    potenciaNecessariaKwp: Number(potenciaNecessariaKwp.toFixed(2)),
    potenciaRealKwp: Number(potenciaRealKwp.toFixed(2)),
    numeroPaineis,
    painelSelecionado: painel.nome,
    inversorSelecionado: inversorSelecionado.nome,
    estruturaSelecionada: estruturaInfo.nome,
    custoEquipamentos: Number(custoEquipamentos.toFixed(2)),
    custoServicos: Number(custoServicos.toFixed(2)),
    custoDiretoTotal: Number(custoDiretoTotal.toFixed(2)),
    frete_valor: freteValor,
    distancia_km: distanciaKm,
    preco_paineis: Number(precoPaineis.toFixed(2)),
    preco_inversor: Number(precoInversor.toFixed(2)),
    preco_estrutura: Number(precoEstrutura.toFixed(2)),
    preco_servicos: Number(precoServicos.toFixed(2)),
    preco_frete: Number(precoFrete.toFixed(2)),
    taxa_localidade_venda: Number(taxaLocalidadeVenda.toFixed(2)),
    margemLucro: Number(margem),
    margemLucroValor: Number(margemLucroValor.toFixed(2)),
    precoFinal: Number(precoFinal.toFixed(2)),
    geracaoEstimadaKwh: Math.round(geracaoEstimadaKwh),
    economiaMensal: Number(economiaMensal.toFixed(2)),
    economiaAnual: Number(economiaAnual.toFixed(2)),
    paybackAnos: Number(paybackAnos.toFixed(1)),
    dataCriacao: new Date().toISOString()
  };
}
