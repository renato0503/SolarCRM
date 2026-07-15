/* ============================================
   SPARK ENGENHARIA ELÉTRICA - JavaScript Principal
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ----- MOBILE MENU -----
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.classList.toggle('no-scroll');
    });

    // Fechar ao clicar em link
    nav.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        nav.classList.remove('open');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  // ----- HEADER SCROLL SHADOW -----
  const header = document.querySelector('.header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  });

  // ----- ACTIVE NAV LINK -----
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

  // ----- SCROLL REVEAL (fade-in) -----
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ----- FORM VALIDATION -----
  const form = document.querySelector('.form');
  if (form) {
    const inputs = form.querySelectorAll('.form__input, .form__select, .form__textarea');
    const submitBtn = form.querySelector('button[type="submit"]');
    const toast = document.getElementById('form-toast');

    // Real-time validation on blur
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          validateField(input);
        }
      });
    });

    function validateField(field) {
      const errorEl = field.parentElement.querySelector('.form__error');
      if (!errorEl) return true;

      let valid = true;
      let message = '';

      if (field.hasAttribute('required') && !field.value.trim()) {
        valid = false;
        message = 'Este campo é obrigatório';
      } else if (field.type === 'email' && field.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value.trim())) {
          valid = false;
          message = 'Informe um e-mail válido';
        }
      } else if (field.id === 'telefone' && field.value.trim()) {
        const phone = field.value.replace(/\D/g, '');
        if (phone.length < 10) {
          valid = false;
          message = 'Informe um telefone válido (DDD + número)';
        }
      }

      if (!valid) {
        field.classList.add('error');
        errorEl.textContent = message;
      } else {
        field.classList.remove('error');
        errorEl.textContent = '';
      }

      return valid;
    }

    // Phone mask
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 6) {
          value = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7)}`;
        } else if (value.length > 2) {
          value = `(${value.slice(0,2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
          value = `(${value}`;
        }
        e.target.value = value;
      });
    }

    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate all fields
      let allValid = true;
      inputs.forEach(input => {
        if (!validateField(input)) allValid = false;
      });

      if (!allValid) {
        showToast('Preencha todos os campos corretamente', 'error');
        return;
      }

      // Disable button
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }

      // Collect data
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => { data[key] = value; });

      try {
        // Tenta enviar para o CRM via Firebase (se disponível)
        const response = await trySendToCRM(data);

        if (response.success) {
          showToast('Orçamento solicitado com sucesso! Entraremos em contato.', 'success');
          form.reset();
          // Redireciona após 2s
          setTimeout(() => {
            window.location.href = response.redirect || '/orcamento.html?sucesso=true';
          }, 2000);
        } else {
          showToast('Erro ao enviar. Tente novamente ou ligue para nós.', 'error');
        }
      } catch (err) {
        console.error('Erro no envio:', err);
        showToast('Erro de conexão. Seu pedido foi salvo localmente.', 'error');
        // Fallback: salva localmente
        saveLocalLead(data);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Solicitar Orçamento';
        }
      }
    });

    // Toast helper
    function showToast(message, type = 'success') {
      if (!toast) return;
      toast.textContent = message;
      toast.className = `toast toast--${type} show`;
      setTimeout(() => toast.classList.remove('show'), 4000);
    }
  }

  // ----- CRM INTEGRATION -----
  async function trySendToCRM(data) {
    // Tenta Firebase primeiro (se configurado)
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        await db.collection('leads').add({
          ...data,
          origem: 'site',
          status: 'Novo',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, redirect: '/orcamento.html?sucesso=true' };
      } catch (e) {
        console.warn('Firebase não disponível, tentando API...', e);
      }
    }

    // Fallback: API REST
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          origem: 'site',
          status: 'Novo',
          createdAt: new Date().toISOString()
        })
      });
      if (response.ok) {
        return { success: true, redirect: '/orcamento.html?sucesso=true' };
      }
    } catch (e) {
      console.warn('API não disponível', e);
    }

    return { success: false };
  }

  // Fallback: salva no localStorage
  function saveLocalLead(data) {
    try {
      const leads = JSON.parse(localStorage.getItem('spark_leads') || '[]');
      leads.push({ ...data, createdAt: new Date().toISOString(), status: 'Novo', origem: 'site' });
      localStorage.setItem('spark_leads', JSON.stringify(leads));
      showToast('Orçamento salvo! Entraremos em contato em breve.', 'success');
    } catch (e) {
      console.error('Erro ao salvar localmente:', e);
    }
  }

  // ----- COPYRIGHT YEAR -----
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ----- SMOOTH SCROLL FOR ANCHOR LINKS -----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('🏭 Spark Engenharia Elétrica - Site carregado com sucesso!');
});