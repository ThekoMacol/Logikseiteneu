// Nav: scroll state
const nav = document.getElementById('nav');

// Nav: active link on scroll (scroll-spy)
const navSections = ['problem', 'proof', 'framework', 'prozess'];
const navLinkMap = {};
navSections.forEach(id => {
  const el = document.querySelector(`.nav__links a[href="#${id}"]`);
  if (el) navLinkMap[id] = el;
});

function setActiveNav(id) {
  Object.values(navLinkMap).forEach(a => a.classList.remove('active'));
  if (id && navLinkMap[id]) navLinkMap[id].classList.add('active');
}

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) setActiveNav(entry.target.id);
  });
}, { rootMargin: '-40% 0px -55% 0px' });

navSections.forEach(id => {
  const sec = document.getElementById(id);
  if (sec) sectionObserver.observe(sec);
});
if (nav) {
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Nav: mobile burger
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('navMobile');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.classList.toggle('active', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });
}

// Smooth scroll for anchor links + set active nav on click
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    const sectionId = href && href.startsWith('#') ? href.slice(1) : null;
    if (sectionId && navLinkMap[sectionId]) setActiveNav(sectionId);
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navHeight = nav ? nav.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// Voiceflow chat widget
const vfTrigger = document.getElementById('vfTrigger');
const vfPanel   = document.getElementById('vfPanel');
const vfClose   = document.getElementById('vfClose');

if (vfTrigger && vfPanel && vfClose) {
  const open = () => {
    vfPanel.classList.add('open');
    vfPanel.setAttribute('aria-hidden', 'false');
    vfTrigger.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    vfPanel.classList.remove('open');
    vfPanel.setAttribute('aria-hidden', 'true');
    vfTrigger.setAttribute('aria-expanded', 'false');
  };

  vfTrigger.addEventListener('click', () => {
    vfPanel.classList.contains('open') ? close() : open();
  });
  vfClose.addEventListener('click', close);

  // Any element with data-open-vf opens the chat
  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-vf]')) {
      e.preventDefault();
      open();
    }
  });
}

// Modal
const modalOverlay = document.getElementById('modalOverlay');
const modalBody    = document.getElementById('modalBody');
const modalClose   = document.getElementById('modalClose');

function animateStats() {
  const STEP_MS = 520;
  const hero = modalBody.querySelector('.modal__result-hero');
  const nums = Array.from(modalBody.querySelectorAll('.modal__result-num[data-steps]'));

  // Temporarily set each number to its longest step value to measure max size
  const saved = nums.map(el => el.textContent);
  nums.forEach(el => {
    const steps = el.getAttribute('data-steps').split('|');
    el.textContent = steps.reduce((a, b) => a.length >= b.length ? a : b);
  });

  // Lock grid column widths at the measured max size
  if (hero) {
    const items = Array.from(hero.querySelectorAll('.modal__result-item'));
    const colWidths = items.map(item => item.offsetWidth);
    hero.style.gridTemplateColumns = colWidths.map(w => w + 'px').join(' ');
    hero.style.height = hero.offsetHeight + 'px';
  }

  // Restore original text, then animate from step[0]
  nums.forEach((el, i) => { el.textContent = saved[i]; });

  nums.forEach((el, colIdx) => {
    const steps = el.getAttribute('data-steps').split('|');
    if (steps.length < 2) return;
    el.textContent = steps[0];
    steps.slice(1).forEach((step, i) => {
      setTimeout(() => {
        el.classList.remove('stat-tick');
        void el.offsetWidth;
        el.classList.add('stat-tick');
        el.textContent = step;
      }, (colIdx * 80) + (i + 1) * STEP_MS);
    });
  });
}

function openModal(key) {
  const src = document.getElementById('modal-' + key);
  if (!src || !modalOverlay || !modalBody) return;
  modalBody.innerHTML = src.innerHTML;
  modalOverlay.style.display = 'flex';
  requestAnimationFrame(() => {
    modalOverlay.classList.add('open');
  });
  setTimeout(animateStats, 250);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { modalOverlay.style.display = 'none'; }, 220);
}


document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', () => openModal(btn.dataset.modal));
});

if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalOverlay) {
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Lightbox for photo cards (delegated - works after modal injects content)
const lightbox    = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(src, alt) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightbox) lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target === lightboxImg) closeLightbox(); });

// Delegated: card clicks inside modal
document.addEventListener('click', e => {
  const card = e.target.closest('[data-lightbox]');
  if (!card) return;
  const img = card.querySelector('img');
  if (img) openLightbox(img.src, img.alt);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

// Intersection Observer: fade-in sections
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

document.querySelectorAll(
  '.problem__item, .module, .step, .pillar, .case-study, .about__stat'
).forEach(el => {
  el.classList.add('fade-target');
  observer.observe(el);
});
