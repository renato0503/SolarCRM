import { dbAddLead, dbAddProposal, authGetCurrentUser, getUserProfile, reservarEstoque, confirmarReserva } from './firebase.js';
import { gerarProposta } from './calculator.js';
import { showToast, formatPhone, cleanPhone, calcularFretePorCEP } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('simulationForm');
  const phoneInput = document.getElementById('telefone');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('span');
  const btnSpinner = submitBtn.querySelector('.spinner');

  phoneInput.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
  });

  const cepInput = document.getElementById('cep');
  cepInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length > 5) {
      e.target.value = val.slice(0, 5) + '-' + val.slice(5);
    } else {
      e.target.value = val;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const errorFeedbacks = form.querySelectorAll('.error-feedback');
    errorFeedbacks.forEach(el => {
      el.style.display = 'none';
      el.textContent = '';
    });
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => input.style.borderColor = '');

    let isValid = true;
    const errors = {};

    const nome = document.getElementById('nome').value.trim();
    const telefoneRaw = phoneInput.value.trim();
    const telefone = cleanPhone(telefoneRaw);
    const email = document.getElementById('email').value.trim();
    const consumoKwh = document.getElementById('consumo_mensal').value;
    const cep = document.getElementById('cep').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const bairro = document.getElementById('bairro').value.trim();
    const tipoTelha = document.getElementById('tipo_telha').value;
    const orientacao = document.getElementById('orientacao')?.value || 'norte';
    const inclinacao = document.getElementById('inclinacao')?.value || '10';
    const tipoLigacao = document.getElementById('tipo_ligacao')?.value || 'bifasico';
    const tipoCliente = document.getElementById('tipo_cliente')?.value || 'residencial';

    if (!nome) { errors.nome = "Nome é obrigatório."; isValid = false; }
    if (telefone.length < 10) { errors.telefone = "Telefone inválido (insira DDD + número)."; isValid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors.email = "E-mail inválido."; isValid = false; }
    if (!consumoKwh || consumoKwh <= 0) { errors.consumo_mensal = "Insira um valor de consumo válido maior que zero."; isValid = false; }

    const cepClean = cep.replace(/\D/g, '');
    if (cepClean.length !== 8) { errors.cep = "CEP inválido (digite os 8 números)."; isValid = false; }
    if (!cidade) { errors.cidade = "Cidade é obrigatória."; isValid = false; }
    if (!bairro) { errors.bairro = "Bairro é obrigatório."; isValid = false; }
    if (!tipoTelha) { errors.tipo_telha = "Selecione o tipo de telhado."; isValid = false; }

    if (!isValid) {
      Object.keys(errors).forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
          input.style.borderColor = 'var(--status-perdido)';
          const feedback = input.nextElementSibling;
          if (feedback && feedback.classList.contains('error-feedback')) {
            feedback.textContent = errors[fieldId];
            feedback.style.display = 'block';
          }
        }
      });
      showToast("Por favor, preencha todos os campos obrigatórios corretamente.", "error");
      return;
    }

    try {
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnSpinner.style.display = 'block';

      const freteInfo = await calcularFretePorCEP(cepClean);

      const user = authGetCurrentUser();
      let vendedorId = null;
      let vendedorNome = null;

      if (user) {
        const profile = await getUserProfile(user.uid);
        vendedorId = user.uid;
        vendedorNome = profile?.nome || user.displayName || user.email;
      }

      const estado = document.getElementById('estado')?.value || 'MT';
      const lgpdConsent = document.getElementById('lgpdConsent');
      if (!lgpdConsent?.checked) {
        showToast("Você precisa aceitar o consentimento LGPD para continuar.", "error");
        return;
      }

      const leadData = {
        nome,
        telefone,
        email,
        endereco: `${cep} (${cidade}/${bairro})`,
        consumo_mensal_kwh: Number(consumoKwh),
        tipo_ligacao: tipoLigacao,
        tipo_cliente: tipoCliente,
        cidade,
        bairro
      };

      const savedLead = await dbAddLead(leadData, vendedorId, vendedorNome);

      const dadosLeadCalculo = {
        consumo_mensal_kwh: Number(consumoKwh),
        tipo_telha: tipoTelha,
        orientacao: orientacao,
        inclinacao: Number(inclinacao),
        tipo_ligacao: tipoLigacao,
        tipo_cliente: tipoCliente,
        cidade,
        bairro,
        frete_valor: freteInfo.freteValor,
        distancia_km: freteInfo.distanciaKm
      };

      const proposalCalculated = gerarProposta(dadosLeadCalculo);

      const painelId = proposalCalculated.sistema.painel.id;
      const inversorId = proposalCalculated.sistema.inversor.id;
      const estruturaId = proposalCalculated.sistema.estrutura.id;
      const numPaineis = proposalCalculated.sistema.numeroPaineis;
      const numInversores = proposalCalculated.sistema.inversor.quantidade || 1;
      reservarEstoque(painelId, numPaineis);
      reservarEstoque(inversorId, numInversores);
      reservarEstoque(estruturaId, numPaineis);

      const proposalData = {
        lead_id: savedLead.id,
        tipo_telha: tipoTelha,
        orientacao: orientacao,
        inclinacao: Number(inclinacao),
        tipo_ligacao: tipoLigacao,
        tipo_cliente: tipoCliente,
        cidade,
        bairro,

        // Flat fields for quick queries (backward compat)
        preco_final: proposalCalculated.precificacao.precoFinal,
        valor_kit: proposalCalculated.precificacao.valorKit,
        fator_preco: proposalCalculated.precificacao.fatorPreco,
        preco_calculado: proposalCalculated.precificacao.precoCalculado,
        valor_imposto: proposalCalculated.precificacao.valorImposto,
        margem_lucro_efetiva: proposalCalculated.precificacao.margemLucroEfetiva,
        economia_mensal: proposalCalculated.energia.economiaMensal,
        economia_anual: proposalCalculated.energia.economiaAnual,
        payback_anos: proposalCalculated.financeiro.paybackAnos,
        payback_meses: proposalCalculated.financeiro.paybackMeses,
        tir_mensal: proposalCalculated.financeiro.tirMensal,
        tir_anual: proposalCalculated.financeiro.tirAnual,
        geracao_estimada_kwh: proposalCalculated.energia.geracaoEstimadaKwh,
        potencia_kwp: proposalCalculated.sistema.potenciaRealKwp,
        numero_paineis: proposalCalculated.sistema.numeroPaineis,
        painel_selecionado: proposalCalculated.sistema.painel.nome,
        inversor_selecionado: proposalCalculated.sistema.inversor.nome,
        estrutura_selecionada: proposalCalculated.sistema.estrutura.nome,
        frete_valor: proposalCalculated.precificacao.freteValor,
        distancia_km: proposalCalculated.precificacao.distanciaKm,
        custo_equipamentos: proposalCalculated.precificacao.valorKit,
        custo_servicos: proposalCalculated.precificacao.custoServicos,
        margem_lucro: proposalCalculated.configuracoes.margemLucroNominal,
        preco_paineis: proposalCalculated.precosVenda.precoPaineisKit,
        preco_inversor: proposalCalculated.precosVenda.precoInversor,
        preco_estrutura: proposalCalculated.precosVenda.precoEstrutura,
        preco_servicos: proposalCalculated.precosVenda.precoServicos,
        preco_frete: proposalCalculated.precosVenda.precoFrete,
        taxa_localidade_venda: proposalCalculated.precosVenda.taxaLocalidadeVenda,
        status: "Novo",

        dados_completos: proposalCalculated
      };

      const savedProposal = await dbAddProposal(proposalData);

      showToast("Simulação realizada com sucesso! Redirecionando...", "success");

      setTimeout(() => {
        window.location.href = `./proposta.html?id=${savedProposal.id}`;
      }, 1000);

    } catch (error) {
      console.error("Erro no envio da simulação:", error);
      showToast("Ocorreu um erro ao salvar sua simulação. Verifique sua conexão e tente novamente.", "error");
      submitBtn.disabled = false;
      btnText.style.display = 'block';
      btnSpinner.style.display = 'none';
    }
  });
});
