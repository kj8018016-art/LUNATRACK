/* ==========================================================================
   LunaTrack — animations.js
   Scroll-driven reveal animations, navbar state, timeline & chart reveals.
   ========================================================================== */

const LunaAnimations = (() => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Fades/slides/scales [data-reveal] elements in as they enter the viewport. */
  function initScrollReveal() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /** Toggles the navbar's compact/glass state based on scroll position. */
  function initNavbarScrollState() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const setState = () => {
      navbar.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    setState();
    window.addEventListener('scroll', setState, { passive: true });
  }

  /** Fills the "How it works" connector line and marks steps active as they reveal. */
  function initTimeline() {
    const timeline = document.getElementById('timeline');
    const fill = document.getElementById('timelineFill');
    if (!timeline || !fill) return;

    const steps = Array.from(timeline.querySelectorAll('.timeline-step'));
    if (!steps.length) return;

    if (prefersReducedMotion) {
      timeline.classList.add('is-filled');
      steps.forEach((s) => s.classList.add('is-active'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timeline.classList.add('is-filled');
            steps.forEach((step, i) => {
              setTimeout(() => step.classList.add('is-active'), i * 220);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(timeline);
  }

  /** Reveals/draws the insights line chart when it scrolls into view. */
  function initChartReveal() {
    const chart = document.getElementById('insightChart');
    if (!chart) return;

    if (prefersReducedMotion) {
      chart.classList.add('is-revealed');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            chart.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(chart);
  }

  function init() {
    initScrollReveal();
    initNavbarScrollState();
    initTimeline();
    initChartReveal();
  }

  return { init };
})();
