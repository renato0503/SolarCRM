import { dbAddLead } from './firebase.js';
import { showToast, formatPhone } from './utils.js';
import { getSettings } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('leadForm');
  const submitBtn = document.getElementById('submitBtn');
  const telefoneInput = document.getElementById('telefone');

  // Phone mask
  telefoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 6) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      e.target.value = `(${value.slice(0, 2)}`;
    } else {
      e.target.value = '';
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnText = submitBtn.querySelector('span');
    const spinner = submitBtn.querySelector('.spinner');

    // Collect form data
    const leadData = {
      nome: document.getElementById('nome').value.trim(),
      telefone: telefoneInput.value.replace(/\D/g, ''),
      email: document.getElementById('email').value.trim(),
      cidade: document.getElementById('cidade').value.trim(),
      uf: document.getElementById('uf').value,
      consumo_mensal_kwh: Number(document.getElementById('consumo').value) || 0,
      tipo_local: document.getElementById('tipo_local').value,
      origem: document.getElementById('origem').value,
      segmento: document.getElementById('segmento').value,
      observacoes: document.getElementById('observacoes').value.trim(),
      status: 'Novo',
      data_criacao: new Date().toISOString()
    };

    // Validation
    const errors = validateForm(leadData);
    if (errors.length > 0) {
      errors.forEach(err => showToast(err, 'error'));
      return;
    }

    // Show loading state
    btnText.textContent = 'Enviando...';
    spinner.style.display = 'block';
    submitBtn.disabled = true;

    try {
      // Save lead to database
      const savedLead = await dbAddLead(leadData);
      console.log('Lead salvo:', savedLead);

      // Get company settings for WhatsApp
      const settings = getSettings();
      const empresaTelefone = settings.empresaTelefone || '67993515206';

      // Build WhatsApp message
      const tipoLocalText = leadData.tipo_local === 'urbano' ? 'Área Urbana' : 'Área Rural';
      const segmentoText = {
        residencial: 'Residencial',
        comercial: 'Comercial/Empresa',
        industrial: 'Industrial',
        rural: 'Rural/Fazenda',
        condominio: 'Condomínio'
      }[leadData.segmento] || leadData.segmento;

      const origemText = {
        whatsapp: 'WhatsApp',
        instagram: 'Instagram',
        facebook: 'Facebook',
        google: 'Google/Busca',
        indicacao: 'Indicação',
        rua: 'Abordagem na rua',
        feira: 'Feira/Evento',
        outro: 'Outro'
      }[leadData.origem] || leadData.origem;

      let mensagem = `☀️ *NOVO LEAD - Spark*\n\n`;
      mensagem += `*Nome:* ${leadData.nome}\n`;
      mensagem += `*Telefone:* ${formatPhone(leadData.telefone)}\n`;
      mensagem += `*Email:* ${leadData.email}\n`;
      mensagem += `*Cidade:* ${leadData.cidade}/${leadData.uf}\n`;
      mensagem += `*Consumo:* ${leadData.consumo_mensal_kwh > 0 ? leadData.consumo_mensal_kwh + ' kWh/mês' : 'Não informado'}\n`;
      mensagem += `*Local:* ${tipoLocalText}\n`;
      mensagem += `*Segmento:* ${segmentoText}\n`;
      mensagem += `*Origem:* ${origemText}\n`;
      
      if (leadData.observacoes) {
        mensagem += `*Obs:* ${leadData.observacoes}\n`;
      }
      
      mensagem += `\n📅 *Data:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;

      // Encode message for WhatsApp URL
      const mensagemEncoded = encodeURIComponent(mensagem);
      const whatsappUrl = `https://wa.me/55${empresaTelefone}?text=${mensagemEncoded}`;

      // Show success toast
      showToast('Lead salvo com sucesso! Redirecionando para WhatsApp...', 'success');

      // Open WhatsApp after short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        
        // Reset form
        form.reset();
        btnText.textContent = '☀️ Solicitar Contato';
        spinner.style.display = 'none';
        submitBtn.disabled = false;

        // Show confirmation
        showToast('Lead enviado! Nossa equipe entrará em contato em breve.', 'success');
      }, 1500);

    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      showToast('Erro ao salvar lead. Tente novamente.', 'error');
      btnText.textContent = '☀️ Solicitar Contato';
      spinner.style.display = 'none';
      submitBtn.disabled = false;
    }
  });

  function validateForm(data) {
    const errors = [];

    if (!data.nome || data.nome.length < 2) {
      errors.push('Informe seu nome completo.');
    }

    if (!data.telefone || data.telefone.length < 10) {
      errors.push('Informe um número de WhatsApp válido (com DDD).');
    }

    if (!data.email || !data.email.includes('@')) {
      errors.push('Informe um e-mail válido.');
    }

    if (!data.cidade || data.cidade.length < 2) {
      errors.push('Informe sua cidade.');
    }

    if (!data.uf) {
      errors.push('Selecione seu estado (UF).');
    }

    if (!data.tipo_local) {
      errors.push('Selecione se o local é urbano ou rural.');
    }

    if (!data.origem) {
      errors.push('Selecione como nos encontrou.');
    }

    if (!data.segmento) {
      errors.push('Selecione o tipo de interesse.');
    }

    return errors;
  }
});