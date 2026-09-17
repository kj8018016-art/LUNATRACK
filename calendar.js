/* ==========================================================================
   LunaTrack App — calendar.js
   Powers calendar.html: month navigation, real logged-day markers pulled
   from Supabase (via LunaApp.data.loggedDays), and the date-details modal.
   Uses the real current date (LunaApp.TODAY) throughout — no hardcoding.
   ========================================================================== */

(function () {
  const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let viewYear, viewMonth;

  function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function isBetween(d, start, end) { return start && end && d >= start && d <= end; }

  /** True if `date` falls within ANY of the previous/current/next estimated
      period windows — not just the single "next" one. This is the fix for
      the bug where only the period one full cycle after "today" ever
      rendered, and the current (or previous) cycle's own estimate silently
      never showed at all. */
  function isEstimatedPeriod(date, cd) {
    if (!cd) return false;
    return isBetween(date, cd.previousCycleStart, cd.previousCycleEnd)
      || isBetween(date, cd.cycleStart, cd.cycleEnd)
      || isBetween(date, cd.nextPeriodStart, cd.nextPeriodEnd);
  }

  function computeCycleDay(date) {
    const { data, TODAY } = LunaApp;
    if (!data.currentCycle.hasSetup) return null;
    const cd = LunaApp.getCycleDates();
    if (!cd) return null;
    const msDay = 86400000;
    if (date >= cd.nextPeriodStart) return Math.floor((date - cd.nextPeriodStart) / msDay) + 1;
    if (date >= cd.cycleStart) return Math.floor((date - cd.cycleStart) / msDay) + 1;
    if (date >= cd.previousCycleStart) return Math.floor((date - cd.previousCycleStart) / msDay) + 1;
    return null;
  }

  function renderCalendar() {
    const { data, buildMonthGrid, dateKey, TODAY } = LunaApp;
    const grid = buildMonthGrid(viewYear, viewMonth);
    document.getElementById('calMonthLabel').textContent = grid.monthLabel;

    const weekdaysEl = document.getElementById('fullCalWeekdays');
    if (weekdaysEl.children.length === 0) {
      weekdaysEl.innerHTML = WEEKDAY_LABELS.map(function (w) { return '<span>' + w + '</span>'; }).join('');
    }

    const cd = LunaApp.getCycleDates();

    const daysEl = document.getElementById('fullCalDays');
    daysEl.innerHTML = grid.cells.map(function (day) {
      if (!day) return '<button class="is-empty" tabindex="-1" aria-hidden="true"></button>';
      const date = new Date(viewYear, viewMonth, day);
      const key = dateKey(viewYear, viewMonth, day);
      const entry = data.loggedDays[key];
      const classes = [];
      // Priority when states could visually conflict: a real logged period
      // always wins, then the estimated-period window, then fertile window,
      // then ovulation day. "Today" is intentionally NOT part of this
      // priority chain — it's pushed separately below so it always coexists
      // with whichever of the above applies, instead of replacing it.
      const isOvulation = cd && (isSameDay(date, cd.ovulation) || isSameDay(date, cd.nextOvulation));
      const isFertile = cd && (isBetween(date, cd.fertileStart, cd.ovulation) || isBetween(date, cd.nextFertileStart, cd.nextOvulation));
      const isEstimated = isEstimatedPeriod(date, cd);
      if (entry && entry.period) classes.push('is-period');
      else if (isEstimated) classes.push('is-estimated');
      else if (isFertile) classes.push('is-fertile');
      else if (isOvulation) classes.push('is-ovulation');
      if (isSameDay(date, TODAY)) classes.push('is-today');
      const dot = entry ? '<span class="log-dot"></span>' : '';
      return '<button class="' + classes.join(' ') + '" data-day="' + day + '" aria-label="' + grid.monthLabel + ' ' + day + '">' + day + dot + '</button>';
    }).join('');

    daysEl.querySelectorAll('button[data-day]').forEach(function (btn) {
      btn.addEventListener('click', function () { openDateDetails(Number(btn.dataset.day)); });
    });
  }

  function openDateDetails(day) {
    const { data, dateKey } = LunaApp;
    const date = new Date(viewYear, viewMonth, day);
    const key = dateKey(viewYear, viewMonth, day);
    const entry = data.loggedDays[key];
    const cycleDay = computeCycleDay(date);
    const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const cd = LunaApp.getCycleDates();
    const isOvulation = cd && (isSameDay(date, cd.ovulation) || isSameDay(date, cd.nextOvulation));
    const isFertile = cd && (isBetween(date, cd.fertileStart, cd.ovulation) || isBetween(date, cd.nextFertileStart, cd.nextOvulation));
    const phase = (cycleDay !== null && data.currentCycle.hasSetup) ? LunaApp.cyclePhase(cycleDay, data.currentCycle.periodLength, data.currentCycle.ovulationDay) : null;

    document.getElementById('ddModalDate').textContent = label;
    document.getElementById('ddModalCycleDay').textContent = cycleDay !== null ? ('Cycle day ' + cycleDay + (phase ? (' \u00b7 ' + phase) : '')) : 'No cycle setup yet';
    document.getElementById('ddModalPeriod').textContent = entry && entry.period ? 'Logged' : (isEstimatedPeriod(date, cd) ? 'Estimated' : 'Not logged');
    document.getElementById('ddModalFertility').textContent = isOvulation ? 'Estimated ovulation day' : (isFertile ? 'In fertile window (estimated)' : 'Outside fertile window');
    document.getElementById('ddModalSymptoms').textContent = entry && entry.symptoms.length ? entry.symptoms.join(', ') : 'None';
    document.getElementById('ddModalMood').textContent = entry && entry.mood ? entry.mood : '\u2014';
    document.getElementById('ddModalNotes').textContent = entry && entry.notes ? entry.notes : 'No notes for this day.';

    LunaApp.openModal('modalDateDetails');
  }

  function initNav() {
    document.getElementById('calPrevBtn').addEventListener('click', function () {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      renderCalendar();
    });
    document.getElementById('calNextBtn').addEventListener('click', function () {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      renderCalendar();
    });
    document.getElementById('calTodayBtn').addEventListener('click', function () {
      viewYear = LunaApp.TODAY.getFullYear();
      viewMonth = LunaApp.TODAY.getMonth();
      renderCalendar();
    });
  }

  function init() {
    viewYear = LunaApp.TODAY.getFullYear();
    viewMonth = LunaApp.TODAY.getMonth();
    initNav();
    renderCalendar();
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
