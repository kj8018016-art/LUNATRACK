/* ==========================================================================
   LunaTrack App — app.js
   Shared shell for every authenticated page: navigation, theme, modals,
   toasts, notifications, and the centralized mock data object. Individual
   pages (dashboard.js, calendar.js, log.js, insights.js) read LunaApp.data
   and call LunaApp.* helpers.

   When Supabase is connected, LunaApp.data becomes the shape live queries
   should be normalized into, and LunaApp.storage.* calls are the seams
   where API calls will replace localStorage reads/writes.
   ========================================================================== */

const LunaApp = (() => {

  /* ---- Icon paths (viewBox 0 0 24 24, stroke-based, matches landing style) ---- */
  const ICONS = {
    home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13 6.5 17.5 11"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 14l4-5 3 3 4-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.3 1-1.3 1.9v.3"/><path d="M12 17h.01"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    droplet: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12Z"/>',
    heart: '<path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z"/>',
    note: '<path d="M4 19V7a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M14 5v5h5"/>',
    trash: '<path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    moon: '<path d="M20 12a8 8 0 1 1-8-8 6.5 6.5 0 0 0 8 8Z"/>',
    chat: '<path d="M4 4h16v12H8l-4 4V4Z"/><path d="M8 9h8M8 12.5h5"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    download: '<path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  };

  function icon(name, size) {
    const s = size || 20;
    return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }

  /* -------------------------------------------------------------------------
     MOCK DATA — centralized, single source of truth for the frontend.
     This shape is what a future Supabase-backed data layer should return.
     ------------------------------------------------------------------------- */
  const data = {
    user: { name: 'Maya', initials: 'M', email: 'maya@example.com', memberSince: 'Jan 2026' },

    currentCycle: {
      day: 14,
      cycleLength: 28,
      periodLength: 5,
      startDate: 'Aug 27',
      nextPeriodDate: 'Sep 24',
      daysUntilNext: 15,
      ovulationDay: 14,
      ovulationDate: 'Sep 9',
      fertileWindowLabel: 'Sep 4 – Sep 9',
    },

    cycles: [
      { label: 'Current', range: 'Aug 27 – Sep 23', length: 28, periodLength: 5 },
      { label: 'Previous', range: 'Jul 30 – Aug 26', length: 28, periodLength: 5 },
      { label: 'Previous', range: 'Jul 2 – Jul 29', length: 27, periodLength: 4 },
      { label: 'Previous', range: 'Jun 4 – Jul 1', length: 29, periodLength: 5 },
      { label: 'Previous', range: 'May 7 – Jun 3', length: 28, periodLength: 5 },
      { label: 'Previous', range: 'Apr 9 – May 6', length: 30, periodLength: 6 },
    ],

    insights: {
      avgCycleLength: 28,
      avgPeriodLength: 5,
      shortestCycle: 26,
      longestCycle: 30,
      variationDays: 2,
      cyclesLogged: 6,
      recentCycleLengths: [27, 29, 28, 30, 27, 28],
      recentPeriodLengths: [4, 5, 5, 6, 5, 5],
      symptomFrequency: [
        { name: 'Fatigue', count: 9 },
        { name: 'Cramps', count: 7 },
        { name: 'Bloating', count: 6 },
        { name: 'Headache', count: 5 },
        { name: 'Backache', count: 4 },
      ],
    },

    recentActivity: [
      { when: 'Today', text: 'Check-in completed' },
      { when: 'Yesterday', text: 'Headache logged' },
      { when: 'Sep 5', text: 'Period ended' },
      { when: 'Sep 1', text: 'Mood recorded' },
    ],

    notifications: [
      { id: 1, text: 'Your cycle log was saved.', time: '2h ago', read: false },
      { id: 2, text: 'Your estimated period is approaching.', time: '1d ago', read: false },
      { id: 3, text: 'Your weekly cycle summary is ready.', time: '3d ago', read: true },
    ],

    /** Per-date logged info, keyed by "YYYY-M-D", used by the calendar & dashboard preview. */
    loggedDays: {
      '2026-9-1': { period: false, symptoms: ['Fatigue'], mood: 'Good', notes: '' },
      '2026-9-5': { period: false, symptoms: [], mood: 'Okay', notes: 'Period ended today.' },
      '2026-8-27': { period: true, symptoms: ['Cramps', 'Headache'], mood: 'Low', notes: '' },
      '2026-8-28': { period: true, symptoms: ['Cramps'], mood: 'Okay', notes: '' },
      '2026-8-29': { period: true, symptoms: [], mood: 'Good', notes: '' },
      '2026-8-30': { period: true, symptoms: [], mood: 'Good', notes: '' },
      '2026-8-31': { period: true, symptoms: ['Bloating'], mood: 'Okay', notes: '' },
    },
  };

  /* -------------------------------------------------------------------------
     STORAGE — thin localStorage wrapper. These are the seams that get
     swapped for real Supabase reads/writes in Step 3.
     ------------------------------------------------------------------------- */
  const PREFIX = 'lunatrack:';
  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    },
  };

  /* -------------------------------------------------------------------------
     CYCLE SETUP — the user-editable source of truth for cycle math.
     Right now this lives in localStorage under 'cycle-setup'. When real
     accounts exist (Step 3), getCycleSetup/saveCycleSetup are the exact
     seam to swap for a Supabase profile read/write — everything else in
     the app (dashboard, calendar, onboarding) only ever talks to these
     two functions and computeCycleInfo(), never to localStorage directly.
     ------------------------------------------------------------------------- */
  const TODAY = new Date(2026, 8, 9); // Fixed reference "today" (Sep 9, 2026) so mock data stays consistent.
  const MS_DAY = 86400000;
  const DEFAULT_CYCLE_SETUP = { lastPeriodStart: '2026-08-27', cycleLength: 28, periodLength: 5 };

  function getCycleSetup() {
    return storage.get('cycle-setup', DEFAULT_CYCLE_SETUP);
  }

  function saveCycleSetup(setup) {
    storage.set('cycle-setup', setup);
    storage.set('onboarding-complete', true);

    if (LunaSupabase && LunaSupabase.isConfigured) {
      LunaAuth.getUser().then((user) => {
        if (!user) return;
        LunaSupabase.client.from('cycle_setups').upsert({
          user_id: user.id,
          last_period_start: setup.lastPeriodStart,
          cycle_length: setup.cycleLength,
          period_length: setup.periodLength,
          updated_at: new Date().toISOString(),
        }).then(({ error }) => {
          if (error) console.warn('LunaTrack: failed to save cycle setup to Supabase.', error.message);
        });
      });
    }
  }

  /**
   * Pulls the signed-in user's cycle setup from Supabase into the local
   * cache, so the existing synchronous getCycleSetup() reads (dashboard,
   * calendar, onboarding — all already rendered by the time this async
   * call resolves) see the real data. If the cloud copy differs from
   * what's cached locally (e.g. first time on a new device), it updates
   * the cache and reloads once — guarded by sessionStorage so a slow or
   * failing network can't cause a reload loop. No-ops instantly in demo
   * mode or once the cache is already in sync.
   */
  async function syncCycleSetupFromCloud() {
    if (!LunaSupabase || !LunaSupabase.isConfigured) return;
    const user = await LunaAuth.getUser();
    if (!user) return;

    const { data: rows, error } = await LunaSupabase.client
      .from('cycle_setups')
      .select('last_period_start, cycle_length, period_length')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('LunaTrack: failed to load cycle setup from Supabase.', error.message);
      return;
    }
    if (!rows) return; // brand-new account — let onboarding handle it locally, same as demo mode

    const existing = storage.get('cycle-setup', null);
    const matches = existing
      && existing.lastPeriodStart === rows.last_period_start
      && existing.cycleLength === rows.cycle_length
      && existing.periodLength === rows.period_length;
    if (matches) return;

    storage.set('cycle-setup', {
      lastPeriodStart: rows.last_period_start,
      cycleLength: rows.cycle_length,
      periodLength: rows.period_length,
    });
    storage.set('onboarding-complete', true);

    if (!sessionStorage.getItem('lunatrack_cloud_sync_reloaded')) {
      sessionStorage.setItem('lunatrack_cloud_sync_reloaded', '1');
      window.location.reload();
    }
  }

  function fmtShort(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

  /** Derives every date/label the app needs from a { lastPeriodStart, cycleLength, periodLength } setup. */
  function computeCycleInfo(setup) {
    const lastStart = new Date(setup.lastPeriodStart + 'T00:00:00');
    const cycleLength = Number(setup.cycleLength) || DEFAULT_CYCLE_SETUP.cycleLength;
    const periodLength = Number(setup.periodLength) || DEFAULT_CYCLE_SETUP.periodLength;

    const daysSinceStart = Math.max(0, Math.floor((TODAY - lastStart) / MS_DAY));
    const cycleIndex = Math.floor(daysSinceStart / cycleLength);
    const currentCycleStart = new Date(lastStart);
    currentCycleStart.setDate(lastStart.getDate() + cycleIndex * cycleLength);

    const day = daysSinceStart - cycleIndex * cycleLength + 1;

    const nextPeriodStartDate = new Date(currentCycleStart);
    nextPeriodStartDate.setDate(currentCycleStart.getDate() + cycleLength);
    const nextPeriodEndDate = new Date(nextPeriodStartDate);
    nextPeriodEndDate.setDate(nextPeriodStartDate.getDate() + periodLength - 1);
    const daysUntilNext = Math.round((nextPeriodStartDate - TODAY) / MS_DAY);

    // Ovulation is estimated via a ~14-day luteal phase, never earlier than a few days after the period ends.
    const ovulationDay = Math.max(periodLength + 3, cycleLength - 14);
    const ovulationDate = new Date(currentCycleStart);
    ovulationDate.setDate(currentCycleStart.getDate() + ovulationDay - 1);
    const fertileStartDate = new Date(ovulationDate);
    fertileStartDate.setDate(ovulationDate.getDate() - 5);

    const nextOvulationDate = new Date(nextPeriodStartDate);
    nextOvulationDate.setDate(nextPeriodStartDate.getDate() + ovulationDay - 1);
    const nextFertileStartDate = new Date(nextOvulationDate);
    nextFertileStartDate.setDate(nextOvulationDate.getDate() - 5);

    return {
      day, cycleLength, periodLength,
      startDate: fmtShort(currentCycleStart),
      nextPeriodDate: fmtShort(nextPeriodStartDate),
      daysUntilNext,
      ovulationDay,
      ovulationDate: fmtShort(ovulationDate),
      fertileWindowLabel: `${fmtShort(fertileStartDate)} – ${fmtShort(ovulationDate)}`,
      dates: {
        cycleStart: currentCycleStart,
        nextPeriodStart: nextPeriodStartDate,
        nextPeriodEnd: nextPeriodEndDate,
        ovulation: ovulationDate,
        fertileStart: fertileStartDate,
        nextOvulation: nextOvulationDate,
        nextFertileStart: nextFertileStartDate,
      },
    };
  }

  function getCycleDates() { return computeCycleInfo(getCycleSetup()).dates; }

  // Populate data.currentCycle from the saved (or default) setup so every page — without
  // any extra wiring — reads live, edit-aware values the moment LunaApp is available.
  Object.assign(data.currentCycle, computeCycleInfo(getCycleSetup()));

  /* -------------------------------------------------------------------------
     TOAST SYSTEM
     ------------------------------------------------------------------------- */
  function showToast(message, opts) {
    opts = opts || {};
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `${icon('check', 16)}<span></span>`;
    toast.querySelector('span').textContent = message;
    stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 400);
    }, opts.duration || 3000);
  }

  /* -------------------------------------------------------------------------
     THEME
     ------------------------------------------------------------------------- */
  function applyTheme(pref) {
    const root = document.documentElement;
    const resolved = pref === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : pref;
    if (resolved === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }

  function setTheme(pref) {
    storage.set('theme', pref);
    applyTheme(pref);
  }

  function initTheme() {
    const pref = storage.get('theme', 'light');
    applyTheme(pref);
    return pref;
  }

  /* -------------------------------------------------------------------------
     MODALS
     ------------------------------------------------------------------------- */
  function openModal(id) {
    const backdrop = document.getElementById(id);
    if (!backdrop) return;
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    const firstField = backdrop.querySelector('input, textarea, button.pill, .modal-close');
    if (firstField) firstField.focus();
  }

  function closeModal(el) {
    const backdrop = el.closest ? el.closest('.modal-backdrop') : el;
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initModals() {
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal(backdrop);
      });
    });
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn));
    });
    document.querySelectorAll('[data-open-modal]').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn.getAttribute('data-open-modal')));
    });
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.modal-backdrop.is-open').forEach((b) => closeModal(b));
    });
  }

  /* -------------------------------------------------------------------------
     NAVIGATION DATA
     ------------------------------------------------------------------------- */
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html', iconName: 'home' },
    { id: 'calendar', label: 'Calendar', href: 'calendar.html', iconName: 'calendar' },
    { id: 'log', label: 'Log Today', href: 'log.html', iconName: 'edit' },
    { id: 'insights', label: 'Insights', href: 'insights.html', iconName: 'chart' },
    { id: 'history', label: 'History', href: 'history.html', iconName: 'clock' },
    { id: 'ai-chat', label: 'AI Chat', href: 'ai-chat.html', iconName: 'chat', badge: 'Beta' },
  ];

  const BOTTOM_NAV_ITEMS = [
    { id: 'dashboard', label: 'Home', href: 'dashboard.html', iconName: 'home' },
    { id: 'calendar', label: 'Calendar', href: 'calendar.html', iconName: 'calendar' },
    { id: 'log', label: 'Log', href: 'log.html', iconName: 'edit', isLog: true },
    { id: 'insights', label: 'Insights', href: 'insights.html', iconName: 'chart' },
    { id: 'settings', label: 'Profile', href: 'settings.html', iconName: 'user' },
  ];

  function navLinkHTML(item, active, extraClass) {
    const cls = ['sidebar-link', active ? 'is-active' : '', extraClass || ''].join(' ').trim();
    const badge = item.badge ? `<span class="nav-soon-badge">${item.badge}</span>` : '';
    return `<a class="${cls}" href="${item.href}">${icon(item.iconName, 19)}<span>${item.label}</span>${badge}</a>`;
  }

  /* -------------------------------------------------------------------------
     SHELL RENDERING
     ------------------------------------------------------------------------- */
  function renderSidebar(activePage) {
    const el = document.getElementById('sidebarRoot');
    if (!el) return;
    const links = NAV_ITEMS.map((item) => navLinkHTML(item, item.id === activePage)).join('');
    el.innerHTML = `
      <aside class="app-sidebar">
        <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-label="Collapse sidebar">${icon('chevronRight', 13)}</button>
        <a class="brand" href="dashboard.html">
          <span class="brand-mark" style="display:inline-flex;vertical-align:-6px;margin-right:6px;">${icon('moon', 24)}</span><span class="brand-text">LunaTrack</span>
        </a>
        <nav class="sidebar-nav" aria-label="Primary">${links}</nav>
        <div class="sidebar-foot">
          ${navLinkHTML({ id: 'settings', label: 'Settings', href: 'settings.html', iconName: 'settings' }, activePage === 'settings')}
          <a class="sidebar-link" href="#" id="helpLink">${icon('help', 19)}<span>Help</span></a>
          <a class="sidebar-profile" href="settings.html">
            <span class="avatar">${data.user.initials}</span>
            <span class="who"><span class="name">${data.user.name}</span><span class="role">${data.user.email}</span></span>
          </a>
        </div>
      </aside>`;
  }

  function renderMobileTopbar(pageTitle) {
    const el = document.getElementById('mobileTopbarRoot');
    if (!el) return;
    el.innerHTML = `
      <header class="mobile-topbar">
        <button class="icon-btn" id="drawerToggle" aria-label="Open menu" aria-expanded="false" aria-controls="appDrawer" style="background:transparent;border-color:transparent;">${icon('menu', 20)}</button>
        <a class="brand" href="dashboard.html">${pageTitle || 'LunaTrack'}</a>
        <div class="dropdown-anchor">
          <button class="icon-btn" id="mobileNotifToggle" aria-label="Notifications" style="background:transparent;border-color:transparent;">${icon('bell', 19)}<span class="notif-dot" id="mobileNotifDot" hidden></span></button>
        </div>
      </header>`;
  }

  function renderDrawer(activePage) {
    const el = document.getElementById('drawerRoot');
    if (!el) return;
    const links = NAV_ITEMS.map((item) => navLinkHTML(item, item.id === activePage)).join('');
    el.innerHTML = `
      <div class="drawer-overlay" id="drawerOverlay"></div>
      <div class="app-drawer" id="appDrawer">
        <a class="brand" href="dashboard.html">LunaTrack</a>
        <nav class="sidebar-nav" aria-label="Primary">${links}</nav>
        <div class="sidebar-foot">
          ${navLinkHTML({ id: 'settings', label: 'Settings', href: 'settings.html', iconName: 'settings' }, activePage === 'settings')}
          <a class="sidebar-link" href="#" id="helpLinkDrawer">${icon('help', 19)}<span>Help</span></a>
        </div>
      </div>`;
  }

  function renderBottomNav(activePage) {
    const el = document.getElementById('bottomNavRoot');
    if (!el) return;
    const items = BOTTOM_NAV_ITEMS.map((item) => {
      const active = item.id === activePage;
      if (item.isLog) {
        return `<a class="bottom-nav-link is-log ${active ? 'is-active' : ''}" href="${item.href}">
          <span class="bottom-nav-log-btn">${icon('edit', 17)}</span><span>${item.label}</span>
        </a>`;
      }
      return `<a class="bottom-nav-link ${active ? 'is-active' : ''}" href="${item.href}">${icon(item.iconName, 20)}<span>${item.label}</span></a>`;
    }).join('');
    el.innerHTML = `<nav class="bottom-nav"><div class="bottom-nav-list">${items}</div></nav>`;
  }

  function renderTopbarActions() {
    const el = document.getElementById('topbarActions');
    if (!el) return;
    el.innerHTML = `
      <div class="dropdown-anchor">
        <button class="icon-btn" id="notifToggle" aria-label="Notifications" aria-haspopup="true">
          ${icon('bell', 18)}<span class="notif-dot" id="notifDot" hidden></span>
        </button>
        <div class="notif-panel" id="notifPanel" role="menu"></div>
      </div>
      <a href="settings.html" class="avatar" title="${data.user.name}">${data.user.initials}</a>`;
  }

  /* -------------------------------------------------------------------------
     NOTIFICATIONS
     ------------------------------------------------------------------------- */
  function getNotifications() {
    const readIds = storage.get('notif-read', []);
    return data.notifications.map((n) => ({ ...n, read: n.read || readIds.includes(n.id) }));
  }

  function renderNotifPanel() {
    const panel = document.getElementById('notifPanel');
    const notifs = getNotifications();
    const unread = notifs.filter((n) => !n.read).length;

    [document.getElementById('notifDot'), document.getElementById('mobileNotifDot')].forEach((dot) => {
      if (dot) dot.hidden = unread === 0;
    });

    if (!panel) return;
    const list = notifs.length
      ? notifs.map((n) => `
          <div class="notif-item ${n.read ? 'is-read' : ''}">
            <span class="dot"></span>
            <div><p>${n.text}</p><time>${n.time}</time></div>
          </div>`).join('')
      : `<div class="notif-empty">You're all caught up.</div>`;

    panel.innerHTML = `
      <div class="notif-head"><h3>Notifications</h3><button id="notifClearAll">Clear all</button></div>
      <div class="notif-list">${list}</div>`;

    const clearBtn = document.getElementById('notifClearAll');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        storage.set('notif-read', data.notifications.map((n) => n.id));
        renderNotifPanel();
      });
    }
  }

  function initNotifications() {
    renderNotifPanel();
    const panel = document.getElementById('notifPanel');
    const toggle = document.getElementById('notifToggle');

    function markAllRead() {
      const readIds = data.notifications.map((n) => n.id);
      storage.set('notif-read', readIds);
      renderNotifPanel();
    }

    if (toggle && panel) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', willOpen);
        if (willOpen) setTimeout(markAllRead, 1200);
      });
      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== toggle) panel.classList.remove('is-open');
      });
    }

    const mobileToggle = document.getElementById('mobileNotifToggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        showToast(`You have ${getNotifications().filter((n) => !n.read).length || 'no'} new notifications`);
        setTimeout(markAllRead, 400);
      });
    }
  }

  /* -------------------------------------------------------------------------
     MOBILE DRAWER WIRING
     ------------------------------------------------------------------------- */
  function initDrawer() {
    const toggle = document.getElementById('drawerToggle');
    const drawer = document.getElementById('appDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (!toggle || !drawer || !overlay) return;

    function close() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    function open() {
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    toggle.addEventListener('click', () => {
      drawer.classList.contains('is-open') ? close() : open();
    });
    overlay.addEventListener('click', close);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  }

  function initHelpLinks() {
    document.querySelectorAll('#helpLink, #helpLinkDrawer').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Help center is coming soon');
      });
    });
  }

  /* -------------------------------------------------------------------------
     SIDEBAR COLLAPSE (desktop) — icon-only rail, persisted in localStorage.
     ------------------------------------------------------------------------- */
  function initSidebarCollapse() {
    const btn = document.getElementById('sidebarCollapseBtn');
    const shell = document.querySelector('.app-shell');
    if (!btn || !shell) return;

    function apply(collapsed) {
      shell.classList.toggle('is-sidebar-collapsed', collapsed);
      btn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    }

    apply(storage.get('sidebar-collapsed', false));

    btn.addEventListener('click', () => {
      const next = !shell.classList.contains('is-sidebar-collapsed');
      apply(next);
      storage.set('sidebar-collapsed', next);
      // Sidebar width changes the main column's width without firing a
      // real window resize — nudge anything listening for resize (e.g.
      // the insights charts) to re-measure once the transition settles.
      setTimeout(() => window.dispatchEvent(new Event('resize')), 260);
    });
  }

  /* -------------------------------------------------------------------------
     CYCLE SETUP MODAL — shared across every page. Used both for first-run
     onboarding (a real login would trigger this once per new account) and
     for later edits (dashboard's edit button, Settings > Cycle setup).
     ------------------------------------------------------------------------- */
  function cycleSetupModalHTML() {
    return `
      <div class="modal-backdrop" id="modalCycleSetup">
        <div class="modal-box">
          <div class="modal-head">
            <div>
              <h3 id="csuTitle">Set up your cycle</h3>
              <div class="card-sub" id="csuSubtitle">This helps LunaTrack estimate your next period and fertile window.</div>
            </div>
            <button class="modal-close" id="csuCloseBtn" data-close-modal aria-label="Close">${icon('x', 16)}</button>
          </div>
          <div class="form-field">
            <label for="csuLastPeriod">First day of your last period</label>
            <input type="date" id="csuLastPeriod">
          </div>
          <div class="form-field">
            <label for="csuCycleLength">Average cycle length (days)</label>
            <input type="number" id="csuCycleLength" min="21" max="40" inputmode="numeric">
          </div>
          <div class="form-field" style="margin-bottom:0">
            <label for="csuPeriodLength">Average period length (days)</label>
            <input type="number" id="csuPeriodLength" min="2" max="10" inputmode="numeric">
          </div>
          <p id="csuError" style="color:var(--c-burgundy);font-size:var(--fs-xs);display:none;margin-top:var(--sp-3)"></p>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="csuSkipBtn" style="display:none">Skip for now</button>
            <button class="btn btn-primary" id="csuSaveBtn">Save & Continue</button>
          </div>
        </div>
      </div>`;
  }

  function openCycleSetupModal(mode) {
    const setup = getCycleSetup();
    document.getElementById('csuLastPeriod').value = setup.lastPeriodStart;
    document.getElementById('csuCycleLength').value = setup.cycleLength;
    document.getElementById('csuPeriodLength').value = setup.periodLength;
    document.getElementById('csuError').style.display = 'none';

    const isOnboarding = mode === 'onboarding';
    document.getElementById('csuTitle').textContent = isOnboarding ? 'Welcome to LunaTrack' : 'Update your cycle info';
    document.getElementById('csuSubtitle').textContent = isOnboarding
      ? "Let's set up your cycle so your dashboard is accurate from day one."
      : 'Changing this recalculates your dashboard, calendar, and predictions.';
    document.getElementById('csuSkipBtn').style.display = isOnboarding ? 'inline-flex' : 'none';
    document.getElementById('csuCloseBtn').style.visibility = isOnboarding ? 'hidden' : 'visible';

    openModal('modalCycleSetup');
  }

  function injectCycleSetupModal() {
    if (document.getElementById('modalCycleSetup')) return;
    document.body.insertAdjacentHTML('beforeend', cycleSetupModalHTML());

    function readForm() {
      return {
        lastPeriodStart: document.getElementById('csuLastPeriod').value,
        cycleLength: parseInt(document.getElementById('csuCycleLength').value, 10),
        periodLength: parseInt(document.getElementById('csuPeriodLength').value, 10),
      };
    }
    function showError(msg) {
      const el = document.getElementById('csuError');
      el.textContent = msg;
      el.style.display = 'block';
    }

    document.getElementById('csuSaveBtn').addEventListener('click', () => {
      const form = readForm();
      if (!form.lastPeriodStart || !form.cycleLength || !form.periodLength) {
        showError('Please fill in all three fields.'); return;
      }
      if (form.periodLength >= form.cycleLength) {
        showError('Period length should be shorter than cycle length.'); return;
      }
      if (new Date(form.lastPeriodStart + 'T00:00:00') > TODAY) {
        showError("That date is in the future — use your most recent period's start date."); return;
      }
      saveCycleSetup(form);
      closeModal(document.getElementById('modalCycleSetup'));
      showToast('Cycle info saved');
      // A full reload keeps every page's cycle math (dashboard, calendar,
      // predictions) trivially consistent with the newly saved setup.
      setTimeout(() => window.location.reload(), 500);
    });

    document.getElementById('csuSkipBtn').addEventListener('click', () => {
      storage.set('onboarding-complete', true);
      closeModal(document.getElementById('modalCycleSetup'));
    });
  }

  function initOnboarding() {
    injectCycleSetupModal();
    if (!storage.get('onboarding-complete', false)) {
      // In a real, logged-in build this fires once per new account (no
      // cycle-setup on file yet) rather than once per browser.
      setTimeout(() => openCycleSetupModal('onboarding'), 450);
    }
  }

  /* -------------------------------------------------------------------------
     CALENDAR HELPERS — shared by dashboard preview + full calendar page
     ------------------------------------------------------------------------- */
  function dateKey(y, m, d) { return `${y}-${m + 1}-${d}`; }

  function buildMonthGrid(year, month) {
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { cells, monthLabel, daysInMonth, year, month };
  }

  /**
   * Labels which phase a given cycle day falls in — mirrors the phase
   * language used on the landing page's cycle visual, kept consistent here.
   * Estimated, not diagnostic.
   */
  function cyclePhase(day, periodLength, ovulationDay) {
    if (day === null || day === undefined || day < 1) return null;
    if (day <= periodLength) return 'Period';
    if (day < ovulationDay) return 'Follicular';
    if (day === ovulationDay) return 'Ovulation';
    return 'Luteal';
  }

  /* -------------------------------------------------------------------------
     SCROLL REVEAL — generic [data-reveal] animator, shared across app pages.
     ------------------------------------------------------------------------- */
  function initScrollReveal(root) {
    const scope = root || document;
    const targets = scope.querySelectorAll('[data-reveal]');
    if (!targets.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { targets.forEach((el) => el.classList.add('is-revealed')); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((el) => observer.observe(el));
  }

  /* -------------------------------------------------------------------------
     BOOTSTRAP
     ------------------------------------------------------------------------- */
  async function init() {
    if (typeof LunaAuth !== 'undefined') {
      const authed = await LunaAuth.requireAuth();
      if (!authed) return; // requireAuth is already redirecting to login.html
    }

    await syncCycleSetupFromCloud();

    const page = document.body.dataset.page || '';
    const title = document.body.dataset.title || 'LunaTrack';

    initTheme();
    renderSidebar(page);
    renderMobileTopbar(title);
    renderDrawer(page);
    renderBottomNav(page);
    renderTopbarActions();

    injectCycleSetupModal();

    initModals();
    initDrawer();
    initNotifications();
    initHelpLinks();
    initSidebarCollapse();
    initScrollReveal();
    initOnboarding();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    data, storage, icon, showToast, openModal, closeModal, setTheme, initTheme, applyTheme,
    dateKey, buildMonthGrid, TODAY, initScrollReveal, cyclePhase,
    getCycleSetup, saveCycleSetup, getCycleDates, openCycleSetupModal,
  };
})();
