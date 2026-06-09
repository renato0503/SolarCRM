// Configurações globais e padrões do SolarCRM

const CONFIG_KEY = 'solarcrm_config';

const defaultSettings = {
  hsp: 4.5,                   // Horas de Sol Pleno médias do Brasil
  tarifaEnergia: 0.95,        // Tarifa média cobrada pela distribuidora (R$/kWh)
  margemLucro: 30,            // Margem de lucro padrão aplicada sobre equipamentos (%)
  performanceRatio: 0.80,     // Taxa de eficiência e perdas padrão do sistema (PR)
  empresaNome: "SolarCRM",
  empresaTelefone: "5567993515206", // Telefone padrão do vendedor/administrador
  taxaMinimaGrid: 50          // Taxa mínima de rede da distribuidora (kWh) (Ex: Bifásico)
};

// Carrega as configurações (com fallback para localStorage)
export function getSettings() {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Erro ao carregar configurações do localStorage:", e);
    }
  }
  return defaultSettings;
}

// Salva novas configurações
export function saveSettings(newSettings) {
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  return updated;
}
