// Banco de dados local de Equipamentos e Serviços

export const EQUIPAMENTOS = {
  paineis: [
    {
      id: "painel_550w",
      nome: "Painel Solar 550W Monocristalino Half-Cell",
      potenciaW: 550,
      precoUnitario: 520.00, // Preço de custo unitário em R$
      marca: "Jinko Solar / Canadian"
    }
  ],
  inversores: [
    { id: "inv_3kw", nome: "Inversor Monofásico 3kW - 220V", potenciaMaxW: 3000, precoUnitario: 2200.00, marca: "Deye / Growatt" },
    { id: "inv_5kw", nome: "Inversor Monofásico 5kW - 220V", potenciaMaxW: 5000, precoUnitario: 3100.00, marca: "Deye / Growatt" },
    { id: "inv_8kw", nome: "Inversor Trifásico 8kW - 220V/380V", potenciaMaxW: 8000, precoUnitario: 4500.00, marca: "Deye / Growatt" },
    { id: "inv_10kw", nome: "Inversor Trifásico 10kW - 220V/380V", potenciaMaxW: 10000, precoUnitario: 5200.00, marca: "Deye / Growatt" },
    { id: "inv_15kw", nome: "Inversor Trifásico 15kW - 220V/380V", potenciaMaxW: 15000, precoUnitario: 6800.00, marca: "Deye / Growatt" },
    { id: "inv_20kw", nome: "Inversor Trifásico 20kW - 220V/380V", potenciaMaxW: 20000, precoUnitario: 8100.00, marca: "Deye / Growatt" }
  ],
  estruturas: {
    // Custo por painel para cada tipo de estrutura de fixação
    ceramica: { nome: "Estrutura para Telha Cerâmica", precoPorPainel: 110.00 },
    metalica: { nome: "Estrutura para Telha Metálica", precoPorPainel: 75.00 },
    laje: { nome: "Estrutura com Suporte para Laje / Solo", precoPorPainel: 180.00 },
    fibrocimento: { nome: "Estrutura para Telha Fibrocimento / Ondulada", precoPorPainel: 85.00 }
  },
  kitsEletricos: [
    {
      id: "kit_eletrico_padrao",
      nome: "Kit Elétrico (Cabos CC, Conectores MC4 e String Box)",
      precoBase: 950.00,
      precoAdicionalPorKw: 100.00 // Custo cresce levemente com o tamanho do sistema
    }
  ],
  servicos: {
    nome: "Projeto de Engenharia, Homologação e Mão de Obra de Instalação",
    custoFixo: 2200.00,
    custoPorKwp: 350.00 // Custo de instalação adicional por kWp
  }
};
