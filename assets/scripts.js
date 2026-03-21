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

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([includeSharedPartial('header'), includeSharedPartial('footer')]);
  setupNav();
});
