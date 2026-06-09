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
  const servicoInfo = EQUIPAMENTOS.servicos;
  const custoServicos = servicoInfo.custoFixo + (servicoInfo.custoPorKwp * potenciaRealKwp);
  
  // Frete e Logística (calculado e repassado por CEP)
  const freteValor = Number(dadosLead.frete_valor) || 350.00;
  const distanciaKm = Number(dadosLead.distancia_km) || 10.0;
  
  // Custo Direto Total (Equipamentos + Serviços + Frete)
  const custoDiretoTotal = custoEquipamentos + custoServicos + freteValor;
  
  // 8. Preço Final (Com Margem de Lucro)
  const margem = settings.margemLucro; // ex: 30%
  const precoFinal = custoDiretoTotal * (1 + margem / 100);
  const margemLucroValor = precoFinal - custoDiretoTotal;
  
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
