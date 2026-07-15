// Configurações globais e padrões da Spark

const CONFIG_KEY = 'solarcrm_config';

const defaultSettings = {
  orientacao: 'norte',
  inclinacao: 10,

  hsp: 5.09,
  tarifaEnergia: 1.08,
  margemLucro: 45,
  performanceRatio: 0.78,
  empresaNome: "Spark",
  empresaTelefone: "5566996517782",
  taxaMinimaGrid: 50,
  tipoLigacao: 'bifasico',

  inflacaoAnual: 0.08,
  fioB: 0.285,
  aliquotaImposto: 0.085
};

const FIO_B_PROGRESSIVO = {
  2023: { percFioB: 0.15, desc: '15% (2023)' },
  2024: { percFioB: 0.30, desc: '30% (2024)' },
  2025: { percFioB: 0.45, desc: '45% (2025)' },
  2026: { percFioB: 0.60, desc: '60% (2026)' },
  2027: { percFioB: 0.75, desc: '75% (2027)' },
  2028: { percFioB: 0.90, desc: '90% (2028)' },
  2029: { percFioB: 1.00, desc: '100% (2029)' },
  2030: { percFioB: 1.00, desc: '100% (2030)' },
  2031: { percFioB: 1.00, desc: '100% (2031)' }
};

const LIGACAO_CODIGOS = [
  { id: 'monofasico', nome: 'Monofásico', custoDisponibilidadeKwh: 30, taxaDisp: 30 },
  { id: 'bifasico', nome: 'Bifásico', custoDisponibilidadeKwh: 50, taxaDisp: 50 },
  { id: 'trifasico', nome: 'Trifásico', custoDisponibilidadeKwh: 100, taxaDisp: 100 }
];

const TIPO_CLIENTE_CONFIG = {
  'residencial': { autoconsumo: 0.25, label: 'Residencial' },
  'comercial': { autoconsumo: 0.70, label: 'Comercial' },
  'rural': { autoconsumo: 0.30, label: 'Rural' },
  'autoconsumo_remoto': { autoconsumo: 0.00, label: 'Autoconsumo Remoto' }
};

export function getSettings() {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Erro ao carregar configurações do localStorage:", e);
    }
  }
  return { ...defaultSettings };
}

export function saveSettings(newSettings) {
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  return updated;
}

export function getFioBProgressivo(ano) {
  return FIO_B_PROGRESSIVO[ano] || FIO_B_PROGRESSIVO[2026];
}

export function getFioBTUSD(ano) {
  const fioB = getFioBProgressivo(ano);
  const settings = getSettings();
  return settings.fioB * fioB.percFioB;
}

export function getLigacaoInfo(tipo) {
  return LIGACAO_CODIGOS.find(l => l.id === tipo) || LIGACAO_CODIGOS[1];
}

export function getLigacoesDisponiveis() {
  return LIGACAO_CODIGOS;
}

export function getTipoClienteConfig(tipo) {
  return TIPO_CLIENTE_CONFIG[tipo] || TIPO_CLIENTE_CONFIG['residencial'];
}

export function getTiposCliente() {
  return Object.entries(TIPO_CLIENTE_CONFIG).map(([k, v]) => ({ id: k, ...v }));
}
