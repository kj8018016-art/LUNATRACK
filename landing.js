/* ==========================================================================
   LunaTrack — landing.js
   Powers the redesigned index.html: mobile menu toggle (closes itself when
   a link is tapped, matching the rest of the app's mobile nav behavior) and
   a simple scroll-reveal using IntersectionObserver.
   ========================================================================== */

(function () {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { menu.classList.remove('is-open'); });
    });
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = document.querySelectorAll('[data-reveal]');
  if (revealTargets.length) {
    if (prefersReducedMotion) {
      revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealTargets.forEach(function (el) { io.observe(el); });
    }
  }
})();
