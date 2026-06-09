// Utilitários de formatação e interface do SolarCRM

/**
 * Exibe um toast temporário na tela.
 * @param {string} message - Texto do toast
 * @param {'success' | 'error' | 'info'} type - Tipo do toast
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icone com base no tipo
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="stroke: var(--status-fechado);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="stroke: var(--status-perdido);"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="stroke: var(--status-novo);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div style="font-size: 0.875rem; font-weight: 500; line-height: 1.4;">${message}</div>
  `;

  container.appendChild(toast);

  // Remove o toast após 4.5 segundos
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 300);
  }, 4500);
}

/**
 * Formata um número como moeda BRL (Ex: R$ 1.500,00)
 * @param {number} value 
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata número de telefone para (XX) XXXXX-XXXX
 * @param {string} value 
 */
export function formatPhone(value) {
  if (!value) return '';
  value = value.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  
  if (value.length > 6) {
    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  } else if (value.length > 2) {
    return `(${value.slice(0, 2)}) ${value.slice(2)}`;
  } else if (value.length > 0) {
    return `(${value.slice(0, 2)}`;
  }
  return value;
}

/**
 * Remove formatação do telefone deixando apenas números
 * @param {string} phone 
 */
export function cleanPhone(phone) {
  return phone.replace(/\D/g, '');
}

/**
 * Calcula a distância do CEP digitado até o centro da cidade e classifica o valor do frete.
 * Regras: até 15km = valor mínimo (R$ 350), 15 a 25km = valor médio (R$ 650), acima de 25km = valor máximo (R$ 1100).
 * @param {string} cep - CEP limpo (8 dígitos)
 * @returns {Promise<Object>} Dados de frete e geolocalização
 */
export async function calcularFretePorCEP(cep) {
  const clean = cep.replace(/\D/g, '');
  
  // Valores padrão/fallback (caso dê algum erro ou offline)
  const fallbackResult = {
    cep: clean,
    cidade: "Campo Grande",
    uf: "MS",
    distanciaKm: 10.0,
    freteValor: 350.00,
    tipoFrete: "mínimo"
  };

  if (clean.length !== 8) {
    return fallbackResult;
  }

  try {
    // 1. Busca detalhes do CEP no ViaCEP
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!viaCepRes.ok) throw new Error("Erro ao acessar ViaCEP");
    const viaCepData = await viaCepRes.json();
    if (viaCepData.erro) throw new Error("CEP inexistente");

    const cidade = viaCepData.localidade;
    const uf = viaCepData.uf;

    // 2. Busca coordenadas do CEP no Nominatim (OpenStreetMap)
    const nomCepRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${clean}&country=Brazil&format=json&limit=1`);
    if (!nomCepRes.ok) throw new Error("Erro no geocoding do CEP");
    const nomCepData = await nomCepRes.json();

    // 3. Busca coordenadas do Centro da Cidade no Nominatim
    const nomCityRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cidade)}+${encodeURIComponent(uf)}+Brazil&format=json&limit=1`);
    if (!nomCityRes.ok) throw new Error("Erro no geocoding do centro da cidade");
    const nomCityData = await nomCityRes.json();

    if (nomCepData.length > 0 && nomCityData.length > 0) {
      const lat1 = parseFloat(nomCepData[0].lat);
      const lon1 = parseFloat(nomCepData[0].lon);
      const lat2 = parseFloat(nomCityData[0].lat);
      const lon2 = parseFloat(nomCityData[0].lon);

      // Distância de Haversine
      const R = 6371; // Raio da Terra em km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanciaKm = R * c;

      // Classificação do frete
      let freteValor = 350.00;
      let tipoFrete = "mínimo";

      if (distanciaKm > 25.0) {
        freteValor = 1100.00;
        tipoFrete = "máximo";
      } else if (distanciaKm >= 15.0) {
        freteValor = 650.00;
        tipoFrete = "médio";
      }

      return {
        cep: clean,
        cidade,
        uf,
        distanciaKm: Math.round(distanciaKm * 10) / 10,
        freteValor,
        tipoFrete
      };
    }
  } catch (error) {
    console.warn("Falha ao calcular frete exato via API. Usando fallback de frete mínimo:", error);
  }

  return fallbackResult;
}

