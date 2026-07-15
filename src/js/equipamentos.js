// Banco de dados local de Equipamentos e Serviços - Expandido
// Baseado na planilha "memoria de calculo.xlsm" (Aba Database)

export const EQUIPAMENTOS = {
  paineis: [
    { id: "painel_dah_620", nome: "Módulo DAH Solar 620W Monocristalino Bifacial N-TopCon", potenciaW: 620, precoUnitario: 410.00, marca: "DAH Solar", largura: 1.16, altura: 2.38, area: 2.76, eficiencia: 22.60 },
    { id: "painel_ronma_610", nome: "Módulo Ronma Solar 610W Monocristalino Bifacial", potenciaW: 610, precoUnitario: 395.00, marca: "Ronma Solar", largura: 1.134, altura: 2.275, area: 2.58, eficiencia: 22.50 },
    { id: "painel_sunova_590", nome: "Módulo Sunova Tangra 590W Monocristalino", potenciaW: 590, precoUnitario: 380.00, marca: "Sunova", largura: 1.134, altura: 2.275, area: 2.58, eficiencia: 22.10 },
    { id: "painel_sunova_570", nome: "Módulo Sunova Tangra 570W Monocristalino", potenciaW: 570, precoUnitario: 365.00, marca: "Sunova", largura: 1.134, altura: 2.275, area: 2.58, eficiencia: 21.80 },
    { id: "painel_jinko_585", nome: "Módulo Jinko Tiger Neo 585W Monocristalino N-Type", potenciaW: 585, precoUnitario: 420.00, marca: "Jinko Solar", largura: 1.134, altura: 1.905, area: 2.16, eficiencia: 22.65 },
    { id: "painel_ja_550", nome: "Módulo JA Solar JAM 550W Monocristalino", potenciaW: 550, precoUnitario: 350.00, marca: "JA Solar", largura: 1.134, altura: 2.275, area: 2.58, eficiencia: 21.30 },
  ],
  inversores: [
    { id: "inv_sof_75", nome: "Inversor Sofar 7.5KTLM Bifásico 220V", potenciaMaxW: 7500, precoUnitario: 2800.00, marca: "Sofar", tipo: "bifasico", fases: 2, mppt: 2 },
    { id: "inv_sof_6", nome: "Inversor Sofar 6KTLM-G2 Bifásico 220V", potenciaMaxW: 6000, precoUnitario: 2500.00, marca: "Sofar", tipo: "bifasico", fases: 2, mppt: 2 },
    { id: "inv_solis_8", nome: "Inversor Solis 8kW Bifásico 220V S6-GR1P8K", potenciaMaxW: 8000, precoUnitario: 2900.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 2 },
    { id: "inv_solis_10", nome: "Inversor Solis 10kW Bifásico 220V 1P10K-4G", potenciaMaxW: 10000, precoUnitario: 3400.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 2 },
    { id: "inv_solis_7", nome: "Inversor Solis 7kW Bifásico 220V 1P7K-5G", potenciaMaxW: 7000, precoUnitario: 2600.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 2 },
    { id: "inv_solis_5", nome: "Inversor Solis 5kW Bifásico 220V S6-GR1P5K", potenciaMaxW: 5000, precoUnitario: 2100.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 1 },
    { id: "inv_solis_4", nome: "Inversor Solis 4kW Bifásico 220V S6-GR1P4K", potenciaMaxW: 4000, precoUnitario: 1900.00, marca: "Solis", tipo: "bifasico", fases: 2, mppt: 1 },
    { id: "inv_gro_6", nome: "Inversor Growatt MIN 6KTL Bifásico 220V", potenciaMaxW: 6000, precoUnitario: 2400.00, marca: "Growatt", tipo: "bifasico", fases: 2, mppt: 2 },
    { id: "inv_gro_8", nome: "Inversor Growatt MIN 8KTL Bifásico 220V", potenciaMaxW: 8000, precoUnitario: 3000.00, marca: "Growatt", tipo: "bifasico", fases: 2, mppt: 2 },
    { id: "inv_gro_10", nome: "Inversor Growatt MIN 10KTL Bifásico 220V", potenciaMaxW: 10000, precoUnitario: 3600.00, marca: "Growatt", tipo: "bifasico", fases: 2, mppt: 2 },
    { id: "inv_gro_15", nome: "Inversor Growatt MID 15K Trifásico 380V", potenciaMaxW: 15000, precoUnitario: 4800.00, marca: "Growatt", tipo: "trifasico", fases: 3, mppt: 2 },
    { id: "inv_gro_20", nome: "Inversor Growatt MID 20K Trifásico 380V", potenciaMaxW: 20000, precoUnitario: 5800.00, marca: "Growatt", tipo: "trifasico", fases: 3, mppt: 2 },
    { id: "inv_gro_25", nome: "Inversor Growatt MAC 25K Trifásico 380V", potenciaMaxW: 25000, precoUnitario: 7200.00, marca: "Growatt", tipo: "trifasico", fases: 3, mppt: 3 },
    { id: "inv_gro_30", nome: "Inversor Growatt MAC 30K Trifásico 380V", potenciaMaxW: 30000, precoUnitario: 8500.00, marca: "Growatt", tipo: "trifasico", fases: 3, mppt: 3 },
    { id: "inv_deye_2", nome: "Inversor Deye SUN2000 Bifásico 220V", potenciaMaxW: 2000, precoUnitario: 1600.00, marca: "Deye", tipo: "bifasico", fases: 2, mppt: 1 },
    { id: "inv_deye_1", nome: "Inversor Deye SUN1000 Bifásico 220V", potenciaMaxW: 1000, precoUnitario: 1200.00, marca: "Deye", tipo: "bifasico", fases: 2, mppt: 1 },
    { id: "inv_fro_4", nome: "Inversor Fronius Primo 4.0-1 Bifásico 220V", potenciaMaxW: 4000, precoUnitario: 3800.00, marca: "Fronius", tipo: "bifasico", fases: 2, mppt: 2 },
    { id: "inv_fro_10", nome: "Inversor Fronius Symo 10.0-3 Trifásico 380V", potenciaMaxW: 10000, precoUnitario: 7200.00, marca: "Fronius", tipo: "trifasico", fases: 3, mppt: 2 },
    { id: "inv_fro_20", nome: "Inversor Fronius Symo 20.0-3 Trifásico 380V", potenciaMaxW: 20000, precoUnitario: 11500.00, marca: "Fronius", tipo: "trifasico", fases: 3, mppt: 2 },
  ],
  estruturas: {
    ceramica: { nome: "Estrutura para Telha Cerâmica", precoPorPainel: 110.00 },
    metalica: { nome: "Estrutura para Telha Metálica", precoPorPainel: 75.00 },
    laje: { nome: "Estrutura com Suporte para Laje / Solo", precoPorPainel: 180.00 },
    fibrocimento: { nome: "Estrutura para Telha Fibrocimento / Ondulada", precoPorPainel: 85.00 },
    fibro_madeira: { nome: "Estrutura para Telha Fibrocimento base Madeira", precoPorPainel: 95.00 }
  },
  kitsEletricos: [
    {
      id: "kit_eletrico_padrao",
      nome: "Kit Elétrico (Cabos CC 4mm², Conectores MC4 Staubli, String Box)",
      precoBase: 1100.00,
      precoAdicionalPorKw: 120.00,
      itens: ["Cabo 4mm² Preto 50m", "Cabo 4mm² Vermelho 50m", "Conectores MC4 (2 pares)", "String Box com DPS"]
    }
  ],
  servicos: {
    nome: "Projeto de Engenharia, ART, Homologação e Mão de Obra de Instalação",
    custoFixo: 2200.00,
    custoPorKwp: 350.00
  },
  frete: {
    minimo: 350.00,
    medio: 650.00,
    maximo: 1100.00
  }
};

export const GARANTIAS = {
  modulos: [
    { marca: "DAH Solar", garantiaFabrica: "15 anos", garantiaProdutividade: "30 anos (87% no ano 30)" },
    { marca: "Ronma Solar", garantiaFabrica: "15 anos", garantiaProdutividade: "30 anos (87% no ano 30)" },
    { marca: "Jinko Solar", garantiaFabrica: "12 anos", garantiaProdutividade: "30 anos (87.4% no ano 30)" },
    { marca: "JA Solar", garantiaFabrica: "12 anos", garantiaProdutividade: "25 anos (84.8% no ano 25)" },
    { marca: "Sunova", garantiaFabrica: "12 anos", garantiaProdutividade: "30 anos (87% no ano 30)" }
  ],
  inversores: [
    { marca: "Sofar", garantiaPadrao: "5 anos", garantiaExtendida: "10 anos" },
    { marca: "Solis", garantiaPadrao: "5 anos", garantiaExtendida: "10 anos" },
    { marca: "Growatt", garantiaPadrao: "5 anos", garantiaExtendida: "10 anos" },
    { marca: "Deye", garantiaPadrao: "5 anos", garantiaExtendida: "10 anos" },
    { marca: "Fronius", garantiaPadrao: "7 anos", garantiaExtendida: "20 anos" }
  ]
};
