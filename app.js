/* ==========================================================================
   LunaTrack App — app.js
   Shared shell for every authenticated page: navigation, theme, modals,
   toasts, notifications, and the real (Supabase-backed) data layer.
   Individual pages (dashboard.js, calendar.js, log.js, insights.js) read
   LunaApp.data — populated by LunaApp.loadUserData() — and call the CRUD
   helpers exported at the bottom of this file.

   There is no mock/demo data anymore. If Supabase isn't configured (see
   supabase-client.js), every protected page shows a "connect Supabase"
   notice instead of fake numbers — see renderConfigGate() below.
   ========================================================================== */

const LunaApp = (() => {

  /* ---- Icon paths (viewBox 0 0 24 24, stroke-based) ---- */
  const ICONS = {
    home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13 6.5 17.5 11"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 14l4-5 3 3 4-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.3 1-1.3 1.9v.3"/><path d="M12 17h.01"/>',
    book: '<path d="M4 19.5V6a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Z"/><path d="M6 17h13"/>',
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
    moon: '<path d="M20 12a8 8 0 1 1-8-8 6.5 6.5 0 0 0 8 8Z"/>',
    chat: '<path d="M4 4h16v12H8l-4 4V4Z"/><path d="M8 9h8M8 12.5h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    plug: '<path d="M9 3v4M15 3v4M6 7h12l-1 5a5 5 0 0 1-10 0Z"/><path d="M12 16v5"/>',
  };

  function icon(name, size) {
    const s = size || 20;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }

  /* -------------------------------------------------------------------------
     REAL DATA MODEL — populated by loadUserData() from Supabase. Nothing
     here is mock data; every field starts empty and is filled from the
     signed-in user's own rows.
     ------------------------------------------------------------------------- */
  const data = {
    user: {
      id: null, name: '', initials: '?', email: '', avatarUrl: null, memberSince: '',
      age: null, dateOfBirth: null, onboardingCompleted: false,
      lifestyle: {}, cycleExperience: {}, wellnessFocus: [],
    },
    currentCycle: {
      hasSetup: false,
      day: null, cycleLength: 28, periodLength: 5,
      startDate: '', nextPeriodDate: '', daysUntilNext: null,
      ovulationDay: null, ovulationDate: '', fertileWindowLabel: '',
    },
    cycles: [],
    insights: {
      hasEnoughData: false,
      avgCycleLength: null, avgPeriodLength: null, shortestCycle: null, longestCycle: null,
      variationDays: null, cyclesLogged: 0, recentCycleLengths: [], recentPeriodLengths: [],
      symptomFrequency: [],
    },
    recentActivity: [],
    notifications: [],
    notes: [],
    loggedDays: {},
  };

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

  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  const MS_DAY = 86400000;

  function isoDate(d) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }
  function dateFromISO(iso) {
    const parts = iso.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  function fmtShort(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function dateKey(y, m, d) { return y + '-' + (m + 1) + '-' + d; }

  function relativeTime(iso) {
    const then = new Date(iso);
    const diffMs = Date.now() - then.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    if (days < 7) return days + 'd ago';
    return fmtShort(then);
  }

  const DEFAULT_CYCLE_SETUP = { cycleLength: 28, periodLength: 5 };

  function computeCycleInfo(setup) {
    const lastStart = dateFromISO(setup.lastPeriodStart);
    const cycleLength = Number(setup.cycleLength) || DEFAULT_CYCLE_SETUP.cycleLength;
    const periodLength = Number(setup.periodLength) || DEFAULT_CYCLE_SETUP.periodLength;

    const daysSinceStart = Math.max(0, Math.floor((TODAY - lastStart) / MS_DAY));
    const cycleIndex = Math.floor(daysSinceStart / cycleLength);
    const currentCycleStart = new Date(lastStart);
    currentCycleStart.setDate(lastStart.getDate() + cycleIndex * cycleLength);
    // The current cycle's own estimated period window (e.g. Sep 11-15) —
    // this was previously computed nowhere as a range, only nextPeriodStart/
    // nextPeriodEnd (one full cycle later) was, which is why the calendar
    // only ever shaded the period *after* this one and skipped this one.
    const currentCycleEnd = new Date(currentCycleStart);
    currentCycleEnd.setDate(currentCycleStart.getDate() + periodLength - 1);

    const day = daysSinceStart - cycleIndex * cycleLength + 1;

    const nextPeriodStartDate = new Date(currentCycleStart);
    nextPeriodStartDate.setDate(currentCycleStart.getDate() + cycleLength);
    const nextPeriodEndDate = new Date(nextPeriodStartDate);
    nextPeriodEndDate.setDate(nextPeriodStartDate.getDate() + periodLength - 1);
    const daysUntilNext = Math.round((nextPeriodStartDate - TODAY) / MS_DAY);

    // One cycle further back, so browsing to the previous month doesn't
    // show a blank calendar with no estimate either (same bug, one cycle
    // earlier).
    const previousCycleStart = new Date(currentCycleStart);
    previousCycleStart.setDate(currentCycleStart.getDate() - cycleLength);
    const previousCycleEnd = new Date(previousCycleStart);
    previousCycleEnd.setDate(previousCycleStart.getDate() + periodLength - 1);

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
      hasSetup: true,
      day: day, cycleLength: cycleLength, periodLength: periodLength,
      startDate: fmtShort(currentCycleStart),
      nextPeriodDate: fmtShort(nextPeriodStartDate),
      daysUntilNext: daysUntilNext,
      ovulationDay: ovulationDay,
      ovulationDate: fmtShort(ovulationDate),
      fertileWindowLabel: fmtShort(fertileStartDate) + ' \u2013 ' + fmtShort(ovulationDate),
      dates: {
        cycleStart: currentCycleStart,
        cycleEnd: currentCycleEnd,
        previousCycleStart: previousCycleStart,
        previousCycleEnd: previousCycleEnd,
        nextPeriodStart: nextPeriodStartDate,
        nextPeriodEnd: nextPeriodEndDate,
        ovulation: ovulationDate,
        fertileStart: fertileStartDate,
        nextOvulation: nextOvulationDate,
        nextFertileStart: nextFertileStartDate,
      },
    };
  }

  function getCycleDates() {
    if (!data.currentCycle.hasSetup) return null;
    const raw = storage.get('cycle-setup-raw', null);
    if (!raw) return null;
    return computeCycleInfo(raw).dates;
  }

  async function saveCycleSetup(setup) {
    const user = await LunaAuth.getUser();
    if (!user) return { error: 'Not signed in.' };
    const { error } = await LunaSupabase.client.from('cycle_setups').upsert({
      user_id: user.id,
      last_period_start: setup.lastPeriodStart,
      cycle_length: setup.cycleLength,
      period_length: setup.periodLength,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
    storage.set('cycle-setup-raw', setup);
    Object.assign(data.currentCycle, computeCycleInfo(setup));
    return {};
  }

  async function getCycleSetupRaw() {
    const user = await LunaAuth.getUser();
    if (!user) return null;
    const { data: row, error } = await LunaSupabase.client
      .from('cycle_setups').select('last_period_start, cycle_length, period_length')
      .eq('user_id', user.id).maybeSingle();
    if (error || !row) return null;
    const setup = { lastPeriodStart: row.last_period_start, cycleLength: row.cycle_length, periodLength: row.period_length };
    storage.set('cycle-setup-raw', setup);
    return setup;
  }

  function deriveCyclesFromLogs(logsRows) {
    const periodDates = (logsRows || [])
      .filter(function (l) { return l.period_flow && l.period_flow !== 'Not started'; })
      .map(function (l) { return l.log_date; })
      .sort();
    if (!periodDates.length) return [];

    const runs = [];
    let run = [periodDates[0]];
    for (let i = 1; i < periodDates.length; i++) {
      const prev = dateFromISO(run[run.length - 1]);
      const cur = dateFromISO(periodDates[i]);
      const gap = Math.round((cur - prev) / MS_DAY);
      if (gap <= 2) run.push(periodDates[i]);
      else { runs.push(run); run = [periodDates[i]]; }
    }
    runs.push(run);

    const cycles = runs.map(function (r) {
      const start = r[0], end = r[r.length - 1];
      const periodLength = Math.round((dateFromISO(end) - dateFromISO(start)) / MS_DAY) + 1;
      return { start: start, end: end, periodLength: periodLength, cycleLength: null };
    });

    for (let i = 0; i < cycles.length - 1; i++) {
      cycles[i].cycleLength = Math.round((dateFromISO(cycles[i + 1].start) - dateFromISO(cycles[i].start)) / MS_DAY);
    }

    return cycles.reverse();
  }

  function computeInsightsFromCycles(cycles, logsRows) {
    const completed = cycles.filter(function (c) { return c.cycleLength; });
    const lengths = completed.map(function (c) { return c.cycleLength; });
    const periodLengths = cycles.map(function (c) { return c.periodLength; });

    const symptomCounts = {};
    (logsRows || []).forEach(function (l) {
      (l.symptoms || []).forEach(function (s) { symptomCounts[s] = (symptomCounts[s] || 0) + 1; });
    });
    const symptomFrequency = Object.entries(symptomCounts)
      .sort(function (a, b) { return b[1] - a[1]; })
      .map(function (e) { return { name: e[0], count: e[1] }; });

    return {
      hasEnoughData: lengths.length >= 2,
      avgCycleLength: lengths.length ? Math.round(lengths.reduce(function (a, b) { return a + b; }, 0) / lengths.length) : null,
      avgPeriodLength: periodLengths.length ? Math.round(periodLengths.reduce(function (a, b) { return a + b; }, 0) / periodLengths.length) : null,
      shortestCycle: lengths.length ? Math.min.apply(null, lengths) : null,
      longestCycle: lengths.length ? Math.max.apply(null, lengths) : null,
      variationDays: lengths.length > 1 ? Math.round((Math.max.apply(null, lengths) - Math.min.apply(null, lengths)) / 2) : null,
      cyclesLogged: lengths.length,
      recentCycleLengths: lengths.slice(0, 6).reverse(),
      recentPeriodLengths: periodLengths.slice(0, 6).reverse(),
      symptomFrequency: symptomFrequency,
    };
  }

  async function loadTodayLog() {
    const user = await LunaAuth.getUser();
    if (!user) return null;
    const { data: row, error } = await LunaSupabase.client
      .from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', isoDate(TODAY)).maybeSingle();
    if (error) { console.warn('LunaTrack: failed to load today\'s log.', error.message); return null; }
    return row;
  }

  async function saveDailyLog(entry, logDateIso) {
    const user = await LunaAuth.getUser();
    if (!user) return { error: 'Not signed in.' };
    const logDate = logDateIso || isoDate(TODAY);
    const { data: row, error } = await LunaSupabase.client
      .from('daily_logs')
      .upsert({
        user_id: user.id,
        log_date: logDate,
        period_flow: entry.period || null,
        symptoms: entry.symptoms || [],
        mood: entry.mood || null,
        energy: entry.energy || null,
        sleep: entry.sleep || null,
        notes: entry.notes || null,
        cramp_level: entry.crampLevel || null,
        water_intake: entry.waterIntake || null,
        cravings: entry.cravings || [],
      }, { onConflict: 'user_id,log_date' })
      .select().single();
    if (error) return { error: error.message };

    if (entry.period && entry.period !== 'Not started') {
      await maybeAdvanceCycleBaseline(logDate, user.id);
    }

    addNotification('Your log for ' + fmtShort(dateFromISO(logDate)) + ' was saved.');
    return { log: row };
  }

  /**
   * If a logged period start looks like the first day of a NEW cycle (the
   * day before it wasn't already logged as a period day), and it's later
   * than the currently known baseline, move cycle_setups.last_period_start
   * forward to it — so every future prediction (next period, ovulation,
   * fertile window, the calendar) recalculates from the newest real data
   * instead of staying anchored to the original setup date forever.
   * Never moves the baseline backward, and never fires for a day that's
   * just a continuation of an already-logged period.
   */
  async function maybeAdvanceCycleBaseline(logDateIso, userId) {
    try {
      const setup = storage.get('cycle-setup-raw', null);
      if (!setup) return;

      const logDate = dateFromISO(logDateIso);
      const prevDay = new Date(logDate);
      prevDay.setDate(logDate.getDate() - 1);

      const { data: prevRow } = await LunaSupabase.client
        .from('daily_logs').select('period_flow')
        .eq('user_id', userId).eq('log_date', isoDate(prevDay)).maybeSingle();
      const prevWasPeriod = prevRow && prevRow.period_flow && prevRow.period_flow !== 'Not started';
      if (prevWasPeriod) return; // continuation of an existing run, not a new start

      const currentBaseline = dateFromISO(setup.lastPeriodStart);
      if (logDate <= currentBaseline) return; // never move the baseline backward

      await saveCycleSetup({ lastPeriodStart: logDateIso, cycleLength: setup.cycleLength, periodLength: setup.periodLength });
    } catch (e) {
      console.warn('LunaTrack: could not advance cycle baseline.', e);
    }
  }

  async function loadNotes() {
    const user = await LunaAuth.getUser();
    if (!user) return [];
    const { data: rows, error } = await LunaSupabase.client
      .from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (error) { console.warn('LunaTrack: failed to load notes.', error.message); return []; }
    return rows || [];
  }

  async function addNote(content) {
    const trimmed = (content || '').trim();
    if (!trimmed) return { error: 'Write something before saving.' };
    const user = await LunaAuth.getUser();
    if (!user) return { error: 'Not signed in.' };
    const { data: row, error } = await LunaSupabase.client
      .from('notes').insert({ user_id: user.id, content: trimmed, note_date: isoDate(TODAY) }).select().single();
    if (error) return { error: error.message };
    data.notes.unshift(row);
    addNotification('Note added.');
    return { note: row };
  }

  async function deleteNote(id) {
    const user = await LunaAuth.getUser();
    if (!user) return { error: 'Not signed in.' };
    const { error } = await LunaSupabase.client.from('notes').delete().eq('id', id).eq('user_id', user.id);
    if (!error) data.notes = data.notes.filter(function (n) { return n.id !== id; });
    return { error: error && error.message };
  }

  async function loadNotifications() {
    const user = await LunaAuth.getUser();
    if (!user) return [];
    const { data: rows, error } = await LunaSupabase.client
      .from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
    if (error) { console.warn('LunaTrack: failed to load notifications.', error.message); return []; }
    return (rows || []).map(function (n) { return { id: n.id, text: n.body, time: relativeTime(n.created_at), read: n.read }; });
  }

  function addNotification(body) {
    LunaAuth.getUser().then(function (user) {
      if (!user) return;
      LunaSupabase.client.from('notifications').insert({ user_id: user.id, body: body }).then(function (res) {
        if (res.error) console.warn('LunaTrack: failed to create notification.', res.error.message);
      });
    });
  }

  async function markAllNotificationsRead() {
    const user = await LunaAuth.getUser();
    if (!user) return;
    await LunaSupabase.client.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    data.notifications.forEach(function (n) { n.read = true; });
  }

  async function saveProfileName(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return { error: "Name can't be empty." };
    const user = await LunaAuth.getUser();
    if (!user) return { error: 'Not signed in.' };
    const { error } = await LunaSupabase.client.from('profiles')
      .update({ name: trimmed, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (error) return { error: error.message };
    data.user.name = trimmed;
    data.user.initials = trimmed[0].toUpperCase();
    return {};
  }

  async function uploadAvatar(file) {
    const user = await LunaAuth.getUser();
    if (!user) return { error: 'Not signed in.' };
    if (!file.type.startsWith('image/')) return { error: 'Please choose an image file.' };
    if (file.size > 4 * 1024 * 1024) return { error: 'Please choose an image under 4MB.' };

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = user.id + '/avatar.' + ext;

    const { error: upErr } = await LunaSupabase.client.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (upErr) return { error: upErr.message };

    const { data: pub } = LunaSupabase.client.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = pub.publicUrl + '?v=' + Date.now();

    const { error: updErr } = await LunaSupabase.client.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
    if (updErr) return { error: updErr.message };

    data.user.avatarUrl = avatarUrl;
    return { url: avatarUrl };
  }

  async function loadUserData() {
    if (!LunaSupabase.isConfigured) return false;
    const user = await LunaAuth.getUser();
    if (!user) return false;

    data.user.id = user.id;
    data.user.email = user.email || '';

    const results = await Promise.all([
      LunaSupabase.client.from('profiles').select('name, avatar_url, member_since, age, date_of_birth, onboarding_completed, lifestyle, cycle_experience, wellness_focus').eq('id', user.id).maybeSingle(),
      LunaSupabase.client.from('cycle_setups').select('last_period_start, cycle_length, period_length').eq('user_id', user.id).maybeSingle(),
      LunaSupabase.client.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(200),
      LunaSupabase.client.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      LunaSupabase.client.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ]);
    const profile = results[0].data;
    const setupRow = results[1].data;
    const logsRows = results[2].data;
    const notesRows = results[3].data;
    const notifRows = results[4].data;

    const fallbackName = user.email ? user.email.split('@')[0] : 'there';
    data.user.name = (profile && profile.name) || fallbackName;
    data.user.initials = (data.user.name || '?').trim()[0].toUpperCase();
    data.user.avatarUrl = profile && profile.avatar_url;
    data.user.memberSince = profile && profile.member_since ? fmtShort(new Date(profile.member_since)) : '';
    data.user.age = (profile && profile.age != null) ? profile.age : null;
    data.user.dateOfBirth = (profile && profile.date_of_birth) || null;
    data.user.onboardingCompleted = Boolean(profile && profile.onboarding_completed);
    data.user.lifestyle = (profile && profile.lifestyle) || {};
    data.user.cycleExperience = (profile && profile.cycle_experience) || {};
    data.user.wellnessFocus = (profile && profile.wellness_focus) || [];

    if (setupRow) {
      const raw = { lastPeriodStart: setupRow.last_period_start, cycleLength: setupRow.cycle_length, periodLength: setupRow.period_length };
      storage.set('cycle-setup-raw', raw);
      Object.assign(data.currentCycle, computeCycleInfo(raw));
    }

    data.loggedDays = {};
    (logsRows || []).forEach(function (row) {
      const d = dateFromISO(row.log_date);
      data.loggedDays[dateKey(d.getFullYear(), d.getMonth(), d.getDate())] = {
        period: Boolean(row.period_flow && row.period_flow !== 'Not started'),
        symptoms: row.symptoms || [],
        mood: row.mood, energy: row.energy, sleep: row.sleep, notes: row.notes || '',
      };
    });

    data.cycles = deriveCyclesFromLogs(logsRows);
    data.insights = computeInsightsFromCycles(data.cycles, logsRows);

    data.notes = notesRows || [];

    data.notifications = (notifRows || []).map(function (n) { return { id: n.id, text: n.body, time: relativeTime(n.created_at), read: n.read }; });

    const activity = [];
    (logsRows || []).slice(0, 4).forEach(function (l) { activity.push({ when: fmtShort(dateFromISO(l.log_date)), text: 'Log saved' }); });
    (notesRows || []).slice(0, 2).forEach(function (n) { activity.push({ when: fmtShort(new Date(n.created_at)), text: 'Note added' }); });
    data.recentActivity = activity.slice(0, 6);

    return true;
  }

  function showToast(message, opts) {
    opts = opts || {};
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = icon('check', 16) + '<span></span>';
    toast.querySelector('span').textContent = message;
    stack.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });
    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { toast.remove(); }, 400);
    }, opts.duration || 3000);
  }

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
    document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeModal(backdrop);
      });
    });
    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(btn); });
    });
    document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () { openModal(btn.getAttribute('data-open-modal')); });
    });
    window.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.modal-backdrop.is-open').forEach(function (b) { closeModal(b); });
    });
  }

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html', iconName: 'home' },
    { id: 'calendar', label: 'Calendar', href: 'calendar.html', iconName: 'calendar' },
    { id: 'log', label: 'Log Today', href: 'log.html', iconName: 'edit' },
    { id: 'insights', label: 'Insights', href: 'insights.html', iconName: 'chart' },
    { id: 'history', label: 'History', href: 'history.html', iconName: 'clock' },
    { id: 'learn', label: 'Learn', href: 'learn.html', iconName: 'book' },
    { id: 'ai-chat', label: 'AI Chat', href: 'ai-chat.html', iconName: 'chat', badge: 'Beta' },
  ];

  const BOTTOM_NAV_ITEMS = [
    { id: 'dashboard', label: 'Home', href: 'dashboard.html', iconName: 'home' },
    { id: 'calendar', label: 'Calendar', href: 'calendar.html', iconName: 'calendar' },
    { id: 'log', label: 'Log', href: 'log.html', iconName: 'edit' },
    { id: 'insights', label: 'Insights', href: 'insights.html', iconName: 'chart' },
    { id: 'settings', label: 'Profile', href: 'settings.html', iconName: 'user' },
  ];

  function navLinkHTML(item, active, extraClass) {
    const cls = ['sidebar-link', active ? 'is-active' : '', extraClass || ''].join(' ').trim();
    const badge = item.badge ? '<span class="nav-soon-badge">' + item.badge + '</span>' : '';
    return '<a class="' + cls + '" href="' + item.href + '">' + icon(item.iconName, 19) + '<span>' + item.label + '</span>' + badge + '</a>';
  }

  function avatarHTML(size) {
    if (data.user.avatarUrl) {
      return '<img src="' + data.user.avatarUrl + '" alt="' + data.user.name + '" class="avatar avatar-img" style="width:' + size + 'px;height:' + size + 'px;">';
    }
    return '<span class="avatar" style="width:' + size + 'px;height:' + size + 'px;">' + data.user.initials + '</span>';
  }

  function renderSidebar(activePage) {
    const el = document.getElementById('sidebarRoot');
    if (!el) return;
    const links = NAV_ITEMS.map(function (item) { return navLinkHTML(item, item.id === activePage); }).join('');
    el.innerHTML = ''
      + '<aside class="app-sidebar">'
      + '<button class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-label="Collapse sidebar">' + icon('chevronRight', 13) + '</button>'
      + '<a class="brand" href="dashboard.html"><span class="brand-mark" style="display:inline-flex;vertical-align:-6px;margin-right:6px;">' + icon('moon', 24) + '</span><span class="brand-text">LunaTrack</span></a>'
      + '<nav class="sidebar-nav" aria-label="Primary">' + links + '</nav>'
      + '<div class="sidebar-foot">'
      + navLinkHTML({ id: 'settings', label: 'Settings', href: 'settings.html', iconName: 'settings' }, activePage === 'settings')
      + '<a class="sidebar-link" href="help.html">' + icon('help', 19) + '<span>Help</span></a>'
      + '<a class="sidebar-profile" href="settings.html">' + avatarHTML(34) + '<span class="who"><span class="name">' + (data.user.name || 'Your account') + '</span></span></a>'
      + '</div></aside>';
  }

  function renderMobileTopbar(pageTitle) {
    const el = document.getElementById('mobileTopbarRoot');
    if (!el) return;
    el.innerHTML = ''
      + '<header class="mobile-topbar">'
      + '<button class="icon-btn" id="drawerToggle" aria-label="Open menu" aria-expanded="false" aria-controls="appDrawer" style="background:transparent;border-color:transparent;">' + icon('menu', 20) + '</button>'
      + '<a class="brand" href="dashboard.html">' + (pageTitle || 'LunaTrack') + '</a>'
      + '<div class="dropdown-anchor"><button class="icon-btn" id="mobileNotifToggle" aria-label="Notifications" style="background:transparent;border-color:transparent;">' + icon('bell', 19) + '<span class="notif-dot" id="mobileNotifDot" hidden></span></button></div>'
      + '</header>';
  }

  function renderDrawer(activePage) {
    const el = document.getElementById('drawerRoot');
    if (!el) return;
    const links = NAV_ITEMS.map(function (item) { return navLinkHTML(item, item.id === activePage); }).join('');
    el.innerHTML = ''
      + '<div class="drawer-overlay" id="drawerOverlay"></div>'
      + '<div class="app-drawer" id="appDrawer">'
      + '<a class="brand" href="dashboard.html">LunaTrack</a>'
      + '<nav class="sidebar-nav" aria-label="Primary">' + links + '</nav>'
      + '<div class="sidebar-foot">'
      + navLinkHTML({ id: 'settings', label: 'Settings', href: 'settings.html', iconName: 'settings' }, activePage === 'settings')
      + '<a class="sidebar-link" href="help.html">' + icon('help', 19) + '<span>Help</span></a>'
      + '</div></div>';
  }

  function renderBottomNav(activePage) {
    const el = document.getElementById('bottomNavRoot');
    if (!el) return;
    const items = BOTTOM_NAV_ITEMS.map(function (item) {
      const active = item.id === activePage;
      return '<a class="bottom-nav-link ' + (active ? 'is-active' : '') + '" href="' + item.href + '" aria-label="' + item.label + '">' + icon(item.iconName, 20) + '</a>';
    }).join('');
    el.innerHTML = '<nav class="bottom-nav"><div class="bottom-nav-list">' + items + '</div></nav>';
  }

  function renderTopbarActions() {
    const el = document.getElementById('topbarActions');
    if (!el) return;
    el.innerHTML = ''
      + '<div class="dropdown-anchor"><button class="icon-btn" id="notifToggle" aria-label="Notifications" aria-haspopup="true">' + icon('bell', 18) + '<span class="notif-dot" id="notifDot" hidden></span></button><div class="notif-panel" id="notifPanel" role="menu"></div></div>'
      + '<a href="settings.html" title="' + data.user.name + '">' + avatarHTML(36) + '</a>';
  }

  function renderNotifPanel() {
    const panel = document.getElementById('notifPanel');
    const unread = data.notifications.filter(function (n) { return !n.read; }).length;

    [document.getElementById('notifDot'), document.getElementById('mobileNotifDot')].forEach(function (dot) {
      if (dot) dot.hidden = unread === 0;
    });

    if (!panel) return;
    const list = data.notifications.length
      ? data.notifications.map(function (n) {
          return '<div class="notif-item ' + (n.read ? 'is-read' : '') + '"><span class="dot"></span><div><p>' + n.text + '</p><time>' + n.time + '</time></div></div>';
        }).join('')
      : '<div class="notif-empty">You\'re all caught up.</div>';

    panel.innerHTML = '<div class="notif-head"><h3>Notifications</h3><button id="notifClearAll">Mark all read</button></div><div class="notif-list">' + list + '</div>';

    const clearBtn = document.getElementById('notifClearAll');
    if (clearBtn) {
      clearBtn.addEventListener('click', async function () {
        await markAllNotificationsRead();
        renderNotifPanel();
      });
    }
  }

  function initNotifications() {
    renderNotifPanel();
    const panel = document.getElementById('notifPanel');
    const toggle = document.getElementById('notifToggle');

    if (toggle && panel) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const willOpen = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', willOpen);
        if (willOpen) setTimeout(async function () { await markAllNotificationsRead(); renderNotifPanel(); }, 1200);
      });
      document.addEventListener('click', function (e) {
        if (!panel.contains(e.target) && e.target !== toggle) panel.classList.remove('is-open');
      });
    }

    const mobileToggle = document.getElementById('mobileNotifToggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', async function () {
        const unread = data.notifications.filter(function (n) { return !n.read; }).length;
        showToast(unread ? ('You have ' + unread + ' new notification' + (unread === 1 ? '' : 's')) : "You're all caught up");
        await markAllNotificationsRead();
        renderNotifPanel();
      });
    }
  }

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
    toggle.addEventListener('click', function () {
      drawer.classList.contains('is-open') ? close() : open();
    });
    overlay.addEventListener('click', close);
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  }

  function initSidebarCollapse() {
    const btn = document.getElementById('sidebarCollapseBtn');
    const shell = document.querySelector('.app-shell');
    if (!btn || !shell) return;

    function apply(collapsed) {
      shell.classList.toggle('is-sidebar-collapsed', collapsed);
      btn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    }

    apply(storage.get('sidebar-collapsed', false));

    btn.addEventListener('click', function () {
      const next = !shell.classList.contains('is-sidebar-collapsed');
      apply(next);
      storage.set('sidebar-collapsed', next);
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 260);
    });
  }

  function cycleSetupModalHTML() {
    return ''
      + '<div class="modal-backdrop" id="modalCycleSetup"><div class="modal-box">'
      + '<div class="modal-head"><div><h3 id="csuTitle">Set up your cycle</h3><div class="card-sub" id="csuSubtitle">This helps LunaTrack estimate your next period and fertile window.</div></div>'
      + '<button class="modal-close" id="csuCloseBtn" data-close-modal aria-label="Close">' + icon('x', 16) + '</button></div>'
      + '<div class="form-field"><label for="csuLastPeriod">First day of your last period</label><input type="date" id="csuLastPeriod"></div>'
      + '<div class="form-field"><label for="csuCycleLength">Average cycle length (days)</label><input type="number" id="csuCycleLength" min="21" max="40" inputmode="numeric"></div>'
      + '<div class="form-field" style="margin-bottom:0"><label for="csuPeriodLength">Average period length (days)</label><input type="number" id="csuPeriodLength" min="2" max="10" inputmode="numeric"></div>'
      + '<p id="csuError" style="color:var(--c-burgundy);font-size:var(--fs-xs);display:none;margin-top:var(--sp-3)"></p>'
      + '<div class="modal-actions"><button class="btn btn-secondary" id="csuSkipBtn" style="display:none">Skip for now</button><button class="btn btn-primary" id="csuSaveBtn">Save & Continue</button></div>'
      + '</div></div>';
  }

  async function openCycleSetupModal(mode) {
    let setup = storage.get('cycle-setup-raw', null);
    if (!setup) setup = await getCycleSetupRaw();
    if (!setup) setup = { lastPeriodStart: isoDate(TODAY), cycleLength: 28, periodLength: 5 };
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

    document.getElementById('csuSaveBtn').addEventListener('click', async function () {
      const form = readForm();
      if (!form.lastPeriodStart || !form.cycleLength || !form.periodLength) { showError('Please fill in all three fields.'); return; }
      if (form.periodLength >= form.cycleLength) { showError('Period length should be shorter than cycle length.'); return; }
      if (dateFromISO(form.lastPeriodStart) > TODAY) { showError("That date is in the future \u2014 use your most recent period's start date."); return; }
      const btn = document.getElementById('csuSaveBtn');
      btn.disabled = true; btn.textContent = 'Saving\u2026';
      const result = await saveCycleSetup(form);
      btn.disabled = false; btn.textContent = 'Save & Continue';
      if (result.error) { showError(result.error); return; }
      closeModal(document.getElementById('modalCycleSetup'));
      showToast('Cycle info saved');
      setTimeout(function () { window.location.reload(); }, 500);
    });

    document.getElementById('csuSkipBtn').addEventListener('click', function () {
      closeModal(document.getElementById('modalCycleSetup'));
    });
  }

  function initOnboarding() {
    if (document.body.dataset.page === 'onboarding') return; // the onboarding page handles its own flow
    injectCycleSetupModal();
    if (!data.currentCycle.hasSetup) {
      setTimeout(function () { openCycleSetupModal('onboarding'); }, 450);
    }
  }

  function buildMonthGrid(year, month) {
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { cells: cells, monthLabel: monthLabel, daysInMonth: daysInMonth, year: year, month: month };
  }

  function cyclePhase(day, periodLength, ovulationDay) {
    if (day === null || day === undefined || day < 1) return null;
    if (day <= periodLength) return 'Period';
    if (day < ovulationDay) return 'Follicular';
    if (day === ovulationDay) return 'Ovulation';
    return 'Luteal';
  }

  function initScrollReveal(root) {
    const scope = root || document;
    const targets = scope.querySelectorAll('[data-reveal]');
    if (!targets.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { targets.forEach(function (el) { el.classList.add('is-revealed'); }); return; }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { observer.observe(el); });
  }

  function renderConfigGate() {
    const main = document.getElementById('appMain') || document.body;
    main.innerHTML = ''
      + '<div class="app-main-inner" style="max-width:520px;padding-top:var(--sp-9)">'
      + '<div class="app-card" style="text-align:center">'
      + '<div class="edu-icon" style="margin:0 auto var(--sp-5);">' + icon('plug', 24) + '</div>'
      + '<h2 style="font-family:var(--font-display);font-size:var(--fs-xl);margin-bottom:var(--sp-3)">Supabase isn\'t connected yet</h2>'
      + '<p style="color:var(--c-ink-soft);font-size:var(--fs-sm)">LunaTrack needs a Supabase project to store your account and data. Add your project URL and anon key to <code>supabase-client.js</code>, run <code>supabase/schema.sql</code>, then reload.</p>'
      + '<a href="index.html" class="btn btn-secondary" style="margin-top:var(--sp-6)">Back to home</a>'
      + '</div></div>';
  }

  async function init() {
    if (typeof LunaSupabase === 'undefined' || !LunaSupabase.isConfigured) {
      renderConfigGate();
      return;
    }
    if (typeof LunaAuth !== 'undefined') {
      const authed = await LunaAuth.requireAuth();
      if (!authed) return;
    }

    await loadUserData();

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
    initSidebarCollapse();
    initScrollReveal();
    initOnboarding();

    document.dispatchEvent(new CustomEvent('lunatrack:data-ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    data: data, storage: storage, icon: icon, showToast: showToast, openModal: openModal, closeModal: closeModal,
    setTheme: setTheme, initTheme: initTheme, applyTheme: applyTheme,
    dateKey: dateKey, buildMonthGrid: buildMonthGrid, dateFromISO: dateFromISO, isoDate: isoDate, fmtShort: fmtShort,
    TODAY: TODAY, initScrollReveal: initScrollReveal, cyclePhase: cyclePhase,
    getCycleDates: getCycleDates, openCycleSetupModal: openCycleSetupModal, saveCycleSetup: saveCycleSetup,
    loadTodayLog: loadTodayLog, saveDailyLog: saveDailyLog, loadNotes: loadNotes, addNote: addNote, deleteNote: deleteNote,
    loadNotifications: loadNotifications, markAllNotificationsRead: markAllNotificationsRead, addNotification: addNotification,
    saveProfileName: saveProfileName, uploadAvatar: uploadAvatar, avatarHTML: avatarHTML, loadUserData: loadUserData,
  };
})();
