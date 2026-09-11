/* ==========================================================================
   LunaTrack — main.js
   Mobile navigation, smooth scrolling, button interactions, app bootstrap.
   ========================================================================== */

(function () {

  /** Wires the hamburger button to open/close the full-screen mobile menu. */
  function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    const closeMenu = () => {
      menu.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    };

    const openMenu = () => {
      menu.classList.add('is-open');
      toggle.classList.add('is-active');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.style.overflow = 'hidden';
    };

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /** Smooth-scrolls to in-page anchors, accounting for the fixed navbar height. */
  function initSmoothScroll() {
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
    ) || 84;

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - (navH - 6);
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /** Buttons carrying data-toast fire a confirmation toast instead of navigating (no backend yet). */
  function initToastButtons() {
    document.querySelectorAll('[data-toast]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        LunaComponents.showToast(btn.getAttribute('data-toast'));
      });
    });
  }

  /** Highlights the current section's nav link as the user scrolls. */
  function initActiveNavLink() {
    const sections = document.querySelectorAll('main section[id]');
    const links = document.querySelectorAll('.nav-links a');
    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );

    sections.forEach((s) => observer.observe(s));
  }

  function init() {
    LunaComponents.initIcons();
    LunaComponents.renderMiniCalendar('#heroMiniCal');
    initMobileNav();
    initSmoothScroll();
    initToastButtons();
    initActiveNavLink();
    LunaAnimations.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
