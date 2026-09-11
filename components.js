/* ==========================================================================
   LunaTrack — components.js
   Reusable UI components and simulated data.
   In a future pass, the mock data here is replaced by live Supabase queries.
   ========================================================================== */

const LunaComponents = (() => {

  /* ---- Simulated cycle data (stand-in for Supabase `cycle_records`) ---- */
  const mockCycleData = {
    currentDay: 14,
    cycleLength: 28,
    periodLength: 5,
    nextPeriodDate: 'Oct 3',
    averageCycleLength: 28,
    averagePeriodLength: 5,
    variationDays: 2,
    cyclesLogged: 12,
    trackingStreakDays: 34,
    recentCycleLengths: [27, 29, 28, 30, 27],
    mostLoggedMood: 'Calm',
    mostLoggedSymptom: 'Fatigue',
  };

  /**
   * Renders a small 7-column calendar grid of dots representing a period
   * window, a fertile window, and "today" — used in the hero dashboard
   * preview. Purely decorative/simulated; not a real calendar.
   */
  function renderMiniCalendar(target, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    const totalDots = options.totalDots || 28;
    const periodDays = options.periodDays || [0, 1, 2, 3, 4];
    const fertileDays = options.fertileDays || [12, 13, 14, 15, 16];
    const todayIndex = options.todayIndex ?? 13;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < totalDots; i++) {
      const span = document.createElement('span');
      if (periodDays.includes(i)) span.classList.add('is-period');
      else if (fertileDays.includes(i)) span.classList.add('is-fertile');
      if (i === todayIndex) span.classList.add('is-today');
      frag.appendChild(span);
    }
    el.innerHTML = '';
    el.appendChild(frag);
  }

  /**
   * Toast notifications. Queues a small message in the bottom-right toast
   * stack, auto-dismissing after `duration` ms.
   */
  function showToast(message, { duration = 3200 } = {}) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
      <span></span>
    `;
    toast.querySelector('span').textContent = message;
    stack.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('is-visible'));

    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  /** Initializes Lucide icon replacement if the CDN script has loaded. */
  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  return { mockCycleData, renderMiniCalendar, showToast, initIcons };
})();
