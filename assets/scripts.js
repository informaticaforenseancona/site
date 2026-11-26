function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  if (!mobileMenu) {
    return;
  }

  const isOpen = mobileMenu.classList.toggle('show');
  mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function setupNav() {
  const navToggle = document.getElementById('nav-toggle');
  const closeMenuBtn = document.getElementById('mobileMenuClose');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!navToggle || !mobileMenu) {
    return;
  }

  navToggle.addEventListener('click', toggleMobileMenu);
  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', toggleMobileMenu);
  }

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('show');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });
}

function trackInteraction(eventName, link) {
  if (typeof window.gtag !== 'function' || !link) {
    return;
  }

  window.gtag('event', eventName, {
    link_url: link.href,
    link_text: link.textContent.trim()
  });
}

function setupAnalyticsEvents() {
  document.querySelectorAll('a[href*="linkedin.com"]').forEach((link) => {
    link.addEventListener('click', () => trackInteraction('linkedin_click', link));
  });

  document.querySelectorAll('a.cta-button').forEach((link) => {
    link.addEventListener('click', () => trackInteraction('cta_click', link));
  });

  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    link.addEventListener('click', () => trackInteraction('internal_navigation_click', link));
  });
}

async function includeSharedPartial(name) {
  const slot = document.querySelector(`[data-include="${name}"]`);
  if (!slot) {
    return;
  }

  try {
    const response = await fetch(`common/${name}.html`);
    if (!response.ok) {
      throw new Error(`Impossibile caricare ${name}.html: ${response.status}`);
    }

    const html = await response.text();
    const fragment = document.createElement('template');
    fragment.innerHTML = html.trim();
    slot.replaceWith(fragment.content.cloneNode(true));
  } catch (error) {
    console.error(error);
    slot.remove();
  }
}

const CONTACT_FALLBACK_URL = 'https://www.linkedin.com/in/cristian-federiconi/';

// Modulo di contatto: invio via Web3Forms con hCaptcha, senza mostrare l'indirizzo email nel sito.
function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) {
    return;
  }

  const status = document.getElementById('contact-form-status');
  const submitButton = form.querySelector('button[type="submit"]');
  const serviceSelect = form.elements.servizio;

  // Le pagine dei servizi linkano a contatti.html?servizio=<slug>#modulo.
  const requestedService = new URLSearchParams(window.location.search).get('servizio');
  const requestedOption = Array.from(serviceSelect.options).find(
    (option) => requestedService && option.dataset.slug === requestedService
  );
  if (requestedOption) {
    requestedOption.selected = true;
  }

  document.querySelectorAll('a[href="#informativa"]').forEach((link) => {
    link.addEventListener('click', () => {
      document.getElementById('informativa').open = true;
    });
  });

  const showStatus = (state, message, link) => {
    status.dataset.state = state;
    status.textContent = message;
    if (link) {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.text;
      status.append(' ', anchor, '.');
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const captchaResponse = form.querySelector('[name="h-captcha-response"]');
    if (!captchaResponse || !captchaResponse.value) {
      showStatus('error', 'Completa il controllo anti-bot prima di inviare.');
      return;
    }

    const data = new FormData(form);
    const payload = {
      access_key: data.get('access_key'),
      subject: `Richiesta dal sito: ${data.get('servizio')}`,
      from_name: data.get('from_name'),
      nome: data.get('nome'),
      email: data.get('email'),
      servizio: data.get('servizio'),
      messaggio: data.get('messaggio'),
      'h-captcha-response': captchaResponse.value
    };

    submitButton.disabled = true;
    showStatus('pending', 'Invio in corso…');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || (result.body && result.body.message) || `HTTP ${response.status}`);
      }

      form.reset();
      showStatus('success', "Richiesta inviata. Ti rispondo all'indirizzo email che hai indicato.");
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'contact_form_submit', { request_type: payload.servizio });
      }
    } catch (error) {
      console.error('Invio del modulo non riuscito:', error);
      showStatus('error', 'Invio non riuscito. Riprova tra qualche minuto oppure', {
        href: CONTACT_FALLBACK_URL,
        text: 'scrivimi su LinkedIn'
      });
    } finally {
      submitButton.disabled = false;
      if (window.hcaptcha) {
        window.hcaptcha.reset();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupContactForm();
  await Promise.all([includeSharedPartial('header'), includeSharedPartial('footer')]);
  setupNav();
  setupAnalyticsEvents();
});
