/* ==========================================================================
   LunaTrack App — calendar.js
   Powers calendar.html: month navigation, period/estimated/logged
   markers, and the date-details modal.
   ========================================================================== */

(function () {
  const { data, buildMonthGrid, dateKey, TODAY } = LunaApp;
  const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let viewYear = TODAY.getFullYear();
  let viewMonth = TODAY.getMonth();

  const cd = LunaApp.getCycleDates();
  const cycleStart = cd.cycleStart;
  const nextPeriodStart = cd.nextPeriodStart;
  const nextPeriodEnd = cd.nextPeriodEnd;
  const currentWindow = { ovulation: cd.ovulation, fertileStart: cd.fertileStart };
  const nextWindow = { ovulation: cd.nextOvulation, fertileStart: cd.nextFertileStart };

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function isBetween(d, start, end) { return d >= start && d <= end; }

  function computeCycleDay(date) {
    const msDay = 86400000;
    if (date >= nextPeriodStart) {
      return Math.floor((date - nextPeriodStart) / msDay) + 1;
    }
    if (date >= cycleStart) {
      return Math.floor((date - cycleStart) / msDay) + 1;
    }
    return null;
  }

  function renderCalendar() {
    const grid = buildMonthGrid(viewYear, viewMonth);
    document.getElementById('calMonthLabel').textContent = grid.monthLabel;

    const weekdaysEl = document.getElementById('fullCalWeekdays');
    if (weekdaysEl.children.length === 0) {
      weekdaysEl.innerHTML = WEEKDAY_LABELS.map((w) => `<span>${w}</span>`).join('');
    }

    const daysEl = document.getElementById('fullCalDays');
    daysEl.innerHTML = grid.cells.map((day) => {
      if (!day) return `<button class="is-empty" tabindex="-1" aria-hidden="true"></button>`;
      const date = new Date(viewYear, viewMonth, day);
      const key = dateKey(viewYear, viewMonth, day);
      const entry = data.loggedDays[key];
      const classes = [];
      const isOvulation = isSameDay(date, currentWindow.ovulation) || isSameDay(date, nextWindow.ovulation);
      const isFertile = isBetween(date, currentWindow.fertileStart, currentWindow.ovulation) || isBetween(date, nextWindow.fertileStart, nextWindow.ovulation);
      if (entry && entry.period) classes.push('is-period');
      else if (isOvulation) classes.push('is-ovulation');
      else if (isFertile) classes.push('is-fertile');
      else if (isBetween(date, nextPeriodStart, nextPeriodEnd)) classes.push('is-estimated');
      if (isSameDay(date, TODAY)) classes.push('is-today');
      const dot = entry ? '<span class="log-dot"></span>' : '';
      return `<button class="${classes.join(' ')}" data-day="${day}" aria-label="${grid.monthLabel} ${day}">${day}${dot}</button>`;
    }).join('');

    daysEl.querySelectorAll('button[data-day]').forEach((btn) => {
      btn.addEventListener('click', () => openDateDetails(Number(btn.dataset.day)));
    });
  }

  function openDateDetails(day) {
    const date = new Date(viewYear, viewMonth, day);
    const key = dateKey(viewYear, viewMonth, day);
    const entry = data.loggedDays[key];
    const cycleDay = computeCycleDay(date);
    const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const isOvulation = isSameDay(date, currentWindow.ovulation) || isSameDay(date, nextWindow.ovulation);
    const isFertile = isBetween(date, currentWindow.fertileStart, currentWindow.ovulation) || isBetween(date, nextWindow.fertileStart, nextWindow.ovulation);
    const phase = cycleDay !== null ? LunaApp.cyclePhase(cycleDay, data.currentCycle.periodLength, data.currentCycle.ovulationDay) : null;

    document.getElementById('ddModalDate').textContent = label;
    document.getElementById('ddModalCycleDay').textContent = cycleDay !== null ? `Cycle day ${cycleDay}${phase ? ` · ${phase}` : ''}` : 'Outside logged cycle range';
    document.getElementById('ddModalPeriod').textContent = entry && entry.period ? 'Logged' : (isBetween(date, nextPeriodStart, nextPeriodEnd) ? 'Estimated' : 'Not logged');
    document.getElementById('ddModalFertility').textContent = isOvulation ? 'Estimated ovulation day' : (isFertile ? 'In fertile window (estimated)' : 'Outside fertile window');
    document.getElementById('ddModalSymptoms').textContent = entry && entry.symptoms.length ? entry.symptoms.join(', ') : 'None';
    document.getElementById('ddModalMood').textContent = entry && entry.mood ? entry.mood : '—';
    document.getElementById('ddModalNotes').textContent = entry && entry.notes ? entry.notes : 'No notes for this day.';

    LunaApp.openModal('modalDateDetails');
  }

  function initNav() {
    document.getElementById('calPrevBtn').addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      renderCalendar();
    });
    document.getElementById('calNextBtn').addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      renderCalendar();
    });
    document.getElementById('calTodayBtn').addEventListener('click', () => {
      viewYear = TODAY.getFullYear();
      viewMonth = TODAY.getMonth();
      renderCalendar();
    });
  }

  function init() {
    initNav();
    renderCalendar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
