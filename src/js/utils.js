// Utilitários de formatação e interface da Spark

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
 * Dicionário de coordenadas aproximadas do centro de capitais brasileiras
 * para evitar requisições extras e rate-limiting no Nominatim.
 */
const CENTROS_CIDADES = {
  "cuiaba": { lat: -15.5960, lon: -56.0967 },
  "cuiabá": { lat: -15.5960, lon: -56.0967 },
  "campo grande": { lat: -20.4697, lon: -54.6201 },
  "sao paulo": { lat: -23.5505, lon: -46.6333 },
  "são paulo": { lat: -23.5505, lon: -46.6333 },
  "rio de janeiro": { lat: -22.9068, lon: -43.1729 },
  "belo horizonte": { lat: -19.9167, lon: -43.9345 },
  "brasilia": { lat: -15.7942, lon: -47.8822 },
  "brasília": { lat: -15.7942, lon: -47.8822 },
  "salvador": { lat: -12.9777, lon: -38.5016 },
  "fortaleza": { lat: -3.7319, lon: -38.5267 },
  "recife": { lat: -8.0543, lon: -34.8813 },
  "curitiba": { lat: -25.4284, lon: -49.2733 },
  "porto alegre": { lat: -30.0346, lon: -51.2177 },
  "goiania": { lat: -16.6869, lon: -49.2648 },
  "goiânia": { lat: -16.6869, lon: -49.2648 }
};

/**
 * Calcula a distância do CEP digitado até o centro da cidade e classifica o valor do frete.
 * Regras: até 15km = valor mínimo (R$ 350), 15 a 25km = valor médio (R$ 650), acima de 25km = valor máximo (R$ 1100).
 * @param {string} cep - CEP limpo (8 dígitos)
 * @returns {Promise<Object>} Dados de frete e geolocalização
 */
const CEP_CACHE_KEY = 'solarcrm_cep_cache';
const CEP_CACHE_TTL = 86400000; // 24h

export async function calcularFretePorCEP(cep) {
  // Cache check
  try {
    const cache = JSON.parse(localStorage.getItem(CEP_CACHE_KEY) || '{}');
    const cached = cache[cep];
    if (cached && (Date.now() - cached.ts) < CEP_CACHE_TTL) {
      console.log('CEP cache hit:', cep);
      return cached.data;
    }
  } catch (e) {}
  const clean = cep.replace(/\D/g, '');
  
  // 1. Determinar cidade/UF fallback baseado nas faixas de CEP brasileiras (para garantia absoluta)
  let fallbackCidade = "Cuiabá";
  let fallbackUf = "MT";
  
  if (clean.length === 8) {
    const prefix2 = clean.slice(0, 2);
    if (prefix2 === "79") {
      fallbackCidade = "Campo Grande";
      fallbackUf = "MS";
    } else if (prefix2 >= "01" && prefix2 <= "19") {
      fallbackCidade = "São Paulo";
      fallbackUf = "SP";
    } else if (prefix2 >= "20" && prefix2 <= "28") {
      fallbackCidade = "Rio de Janeiro";
      fallbackUf = "RJ";
    } else if (prefix2 === "29") {
      fallbackCidade = "Vitória";
      fallbackUf = "ES";
    } else if (prefix2 >= "30" && prefix2 <= "39") {
      fallbackCidade = "Belo Horizonte";
      fallbackUf = "MG";
    } else if (prefix2 >= "40" && prefix2 <= "48") {
      fallbackCidade = "Salvador";
      fallbackUf = "BA";
    } else if (prefix2 === "49") {
      fallbackCidade = "Aracaju";
      fallbackUf = "SE";
    } else if (prefix2 >= "50" && prefix2 <= "56") {
      fallbackCidade = "Recife";
      fallbackUf = "PE";
    } else if (prefix2 === "57") {
      fallbackCidade = "Maceió";
      fallbackUf = "AL";
    } else if (prefix2 === "58") {
      fallbackCidade = "João Pessoa";
      fallbackUf = "PB";
    } else if (prefix2 === "59") {
      fallbackCidade = "Natal";
      fallbackUf = "RN";
    } else if (prefix2 >= "60" && prefix2 <= "63") {
      fallbackCidade = "Fortaleza";
      fallbackUf = "CE";
    } else if (prefix2 >= "64" && prefix2 <= "65") {
      fallbackCidade = "Teresina";
      fallbackUf = "PI";
    } else if (prefix2 >= "66" && prefix2 <= "68") {
      fallbackCidade = "Belém";
      fallbackUf = "PA";
    } else if (prefix2 === "69") {
      fallbackCidade = "Manaus";
      fallbackUf = "AM";
    } else if (prefix2 >= "70" && prefix2 <= "72") {
      fallbackCidade = "Brasília";
      fallbackUf = "DF";
    } else if (prefix2 >= "73" && prefix2 <= "76") {
      fallbackCidade = "Goiânia";
      fallbackUf = "GO";
    } else if (prefix2 === "77") {
      fallbackCidade = "Palmas";
      fallbackUf = "TO";
    } else if (prefix2 === "78") {
      fallbackCidade = "Cuiabá";
      fallbackUf = "MT";
    } else if (prefix2 >= "80" && prefix2 <= "87") {
      fallbackCidade = "Curitiba";
      fallbackUf = "PR";
    } else if (prefix2 >= "88" && prefix2 <= "89") {
      fallbackCidade = "Florianópolis";
      fallbackUf = "SC";
    } else if (prefix2 >= "90" && prefix2 <= "99") {
      fallbackCidade = "Porto Alegre";
      fallbackUf = "RS";
    }
  }

  let result = {
    cep: clean,
    cidade: fallbackCidade,
    uf: fallbackUf,
    distanciaKm: 10.0,
    freteValor: 350.00,
    tipoFrete: "mínimo"
  };

  if (clean.length !== 8) {
    return result;
  }

  // 2. Tentar obter a cidade e UF via APIs de CEP (ViaCEP e BrasilAPI como fallback)
  let apiData = null;
  try {
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (viaCepRes.ok) {
      const data = await viaCepRes.json();
      if (data && !data.erro && data.localidade) {
        apiData = {
          cidade: data.localidade,
          uf: data.uf
        };
      }
    }
  } catch (e) {
    console.warn("ViaCEP falhou, tentando BrasilAPI...", e);
  }

  if (!apiData) {
    try {
      const brasilApiRes = await fetch(`https://brasilapi.com.br/api/cep/v1/${clean}`);
      if (brasilApiRes.ok) {
        const data = await brasilApiRes.json();
        if (data && data.city) {
          apiData = {
            cidade: data.city,
            uf: data.state
          };
        }
      }
    } catch (e) {
      console.warn("BrasilAPI também falhou.", e);
    }
  }

  // Atualiza cidade/UF no resultado final se obtidos com sucesso das APIs
  if (apiData) {
    result.cidade = apiData.cidade;
    result.uf = apiData.uf;
  }

  // 3. Tentar geolocalizar as coordenadas do CEP e do Centro da Cidade para distância
  try {
    const nomCepRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${clean}&country=Brazil&format=json&limit=1`);
    if (nomCepRes.ok) {
      const nomCepData = await nomCepRes.json();
      if (nomCepData && nomCepData.length > 0) {
        const lat1 = parseFloat(nomCepData[0].lat);
        const lon1 = parseFloat(nomCepData[0].lon);
        
        let lat2 = null;
        let lon2 = null;

        // Se a cidade estiver em nosso dicionário de capitais, usamos a coordenada direta
        const cidadeLower = result.cidade.toLowerCase().trim();
        if (CENTROS_CIDADES[cidadeLower]) {
          lat2 = CENTROS_CIDADES[cidadeLower].lat;
          lon2 = CENTROS_CIDADES[cidadeLower].lon;
        } else {
          // Caso contrário, busca no Nominatim com atraso de 1s para respeitar limite
          await new Promise(resolve => setTimeout(resolve, 1000));
          const nomCityRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(result.cidade)}+${encodeURIComponent(result.uf)}+Brazil&format=json&limit=1`);
          if (nomCityRes.ok) {
            const nomCityData = await nomCityRes.json();
            if (nomCityData && nomCityData.length > 0) {
              lat2 = parseFloat(nomCityData[0].lat);
              lon2 = parseFloat(nomCityData[0].lon);
            }
          }
        }

        if (lat2 !== null && lon2 !== null) {
          // Fórmula de Haversine
          const R = 6371; // km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distanciaKm = R * c;

          result.distanciaKm = Math.round(distanciaKm * 10) / 10;

          // Regras de frete:
          // até 15km = valor minimo (R$ 350)
          // de 15 a 25km = valor médio (R$ 650)
          // acima de 25km = valor maximo (R$ 1100)
          if (distanciaKm > 25.0) {
            result.freteValor = 1100.00;
            result.tipoFrete = "máximo";
          } else if (distanciaKm >= 15.0) {
            result.freteValor = 650.00;
            result.tipoFrete = "médio";
          } else {
            result.freteValor = 350.00;
            result.tipoFrete = "mínimo";
          }
        }
      }
    }
  } catch (geoError) {
    console.warn("Erro ao calcular geolocalização e distância. Mantendo cidade e frete mínimo padrão:", geoError);
  }

  return result;
}

/**
 * Busca fornecedores cadastrados no localStorage e sugere o menor preço
 * para painel, inversor e estrutura, retornando objetos com melhor cotação.
 */
export function obterCotacaoAutomatica() {
  try {
    const raw = localStorage.getItem('solarcrm_fornecedores');
    const fornecedores = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(fornecedores) || fornecedores.length === 0) return null;

    const melhorPainel = fornecedores
      .filter(f => Array.isArray(f.produtos) && f.produtos.some(p => p.tipo === 'painel'))
      .map(f => {
        const painel = f.produtos.find(p => p.tipo === 'painel');
        return { fornecedor: f.nome, preco: Number(painel.preco) || Infinity };
      })
      .sort((a, b) => a.preco - b.preco)[0];

    const melhorInversor = fornecedores
      .filter(f => Array.isArray(f.produtos) && f.produtos.some(p => p.tipo === 'inversor'))
      .map(f => {
        const inversor = f.produtos.find(p => p.tipo === 'inversor');
        return { fornecedor: f.nome, preco: Number(inversor.preco) || Infinity };
      })
      .sort((a, b) => a.preco - b.preco)[0];

    const melhorEstrutura = fornecedores
      .filter(f => Array.isArray(f.produtos) && f.produtos.some(p => p.tipo === 'estrutura'))
      .map(f => {
        const estrutura = f.produtos.find(p => p.tipo === 'estrutura');
        return { fornecedor: f.nome, preco: Number(estrutura.preco) || Infinity };
      })
      .sort((a, b) => a.preco - b.preco)[0];

    return {
      painel: melhorPainel && isFinite(melhorPainel.preco) ? melhorPainel : null,
      inversor: melhorInversor && isFinite(melhorInversor.preco) ? melhorInversor : null,
      estrutura: melhorEstrutura && isFinite(melhorEstrutura.preco) ? melhorEstrutura : null
    };
  } catch (e) {
    console.warn('Erro ao obter cotação automática:', e);
    return null;
  }
}

