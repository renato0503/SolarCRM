import { dbAddLead, dbAddProposal } from './firebase.js';
import { gerarProposta } from './calculator.js';
import { showToast, formatPhone, cleanPhone } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('simulationForm');
  const phoneInput = document.getElementById('telefone');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('span');
  const btnSpinner = submitBtn.querySelector('.spinner');

  // Máscara de telefone dinâmica
  phoneInput.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
  });

  // Evento de submissão do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset de erros anteriores
    const errorFeedbacks = form.querySelectorAll('.error-feedback');
    errorFeedbacks.forEach(el => {
      el.style.display = 'none';
      el.textContent = '';
    });
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => input.style.borderColor = '');

    // Validação de campos
    let isValid = true;
    const errors = {};

    const nome = document.getElementById('nome').value.trim();
    const telefoneRaw = phoneInput.value.trim();
    const telefone = cleanPhone(telefoneRaw);
    const email = document.getElementById('email').value.trim();
    const consumoKwh = document.getElementById('consumo_mensal').value;
    const endereco = document.getElementById('endereco').value.trim();
    const tipoTelha = document.getElementById('tipo_telha').value;
    const orientacao = document.getElementById('orientacao').value;

    if (!nome) {
      errors.nome = "Nome é obrigatório.";
      isValid = false;
    }
    
    if (telefone.length < 10) {
      errors.telefone = "Telefone inválido (insira DDD + número).";
      isValid = false;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "E-mail inválido.";
      isValid = false;
    }

    if (!consumoKwh || consumoKwh <= 0) {
      errors.consumo_mensal = "Insira um valor de consumo válido maior que zero.";
      isValid = false;
    }

    if (!endereco) {
      errors.endereco = "Endereço é obrigatório.";
      isValid = false;
    }

    if (!tipoTelha) {
      errors.tipo_telha = "Selecione o tipo de telhado.";
      isValid = false;
    }

    // Exibe erros se houver
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

    // Fluxo de envio do Lead e Proposta
    try {
      // Ativa spinner de loading
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnSpinner.style.display = 'block';

      // 1. Salvar Lead no Firestore / MockDB
      const leadData = {
        nome,
        telefone,
        email,
        endereco,
        consumo_mensal_kwh: Number(consumoKwh)
      };

      const savedLead = await dbAddLead(leadData);

      // 2. Gerar proposta baseada nos dados do Lead
      const dadosLeadCalculo = {
        consumo_mensal_kwh: Number(consumoKwh),
        tipo_telha: tipoTelha
      };
      
      const proposalCalculated = gerarProposta(dadosLeadCalculo);
      
      // Adiciona referências extras para a proposta
      const proposalData = {
        lead_id: savedLead.id,
        tipo_telha: tipoTelha,
        orientacao: orientacao,
        potencia_kwp: proposalCalculated.potenciaRealKwp,
        custo_equipamentos: proposalCalculated.custoEquipamentos,
        custo_servicos: proposalCalculated.custoServicos,
        margem_lucro: proposalCalculated.margemLucro,
        preco_final: proposalCalculated.precoFinal,
        economia_mensal: proposalCalculated.economiaMensal,
        economia_anual: proposalCalculated.economiaAnual,
        payback_anos: proposalCalculated.paybackAnos,
        geracao_estimada_kwh: proposalCalculated.geracaoEstimadaKwh,
        numero_paineis: proposalCalculated.numeroPaineis,
        inversor_selecionado: proposalCalculated.inversorSelecionado,
        painel_selecionado: proposalCalculated.painelSelecionado,
        estrutura_selecionada: proposalCalculated.estruturaSelecionada,
        status: "Novo"
      };

      // 3. Salvar Proposta no Firestore / MockDB
      const savedProposal = await dbAddProposal(proposalData);

      showToast("Simulação realizada com sucesso! Redirecionando...", "success");

      // Redireciona para a página da proposta
      setTimeout(() => {
        window.location.href = `./proposta.html?id=${savedProposal.id}`;
      }, 1000);

    } catch (error) {
      console.error("Erro no envio da simulação:", error);
      showToast("Ocorreu um erro ao salvar sua simulação. Verifique sua conexão e tente novamente.", "error");
      
      // Desativa spinner de loading
      submitBtn.disabled = false;
      btnText.style.display = 'block';
      btnSpinner.style.display = 'none';
    }
  });
});
