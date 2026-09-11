/* ==========================================================================
   LunaTrack App — dashboard.js
   Powers dashboard.html: cycle ring, quick actions, check-in, mini
   calendar preview, insights preview, and recent activity.
   ========================================================================== */

(function () {
  const { data, storage, showToast, dateKey, buildMonthGrid, TODAY } = LunaApp;
  const RING_CIRCUMFERENCE = 452;

  /* ---- Cycle ring + header stats ---- */
  function initCycleCard() {
    const ring = document.getElementById('cycleRing');
    if (!ring) return;
    const cc = data.currentCycle;
    const fraction = cc.day / cc.cycleLength;
    const offset = Math.round(RING_CIRCUMFERENCE * (1 - fraction));
    ring.style.setProperty('--ring-offset', offset);

    document.getElementById('cycleDayNum').textContent = cc.day;
    document.getElementById('cycleDaysUntil').textContent = cc.daysUntilNext;
    document.getElementById('cyclePeriodLen').textContent = cc.periodLength;
    document.getElementById('cycleStart').textContent = cc.startDate;
    document.getElementById('cycleOvulation').textContent = cc.ovulationDate;
    document.getElementById('cycleNext').textContent = cc.nextPeriodDate;
    document.getElementById('cycleFertileNote').textContent =
      `Fertile window (estimated): ${cc.fertileWindowLabel}. Estimates are based on your logged history — not a guarantee.`;

    const phase = LunaApp.cyclePhase(cc.day, cc.periodLength, cc.ovulationDay);
    const phaseChip = document.getElementById('cyclePhaseChip');
    if (phaseChip && phase) phaseChip.textContent = `${phase} phase`;

    initCycleProgressBar(cc, phase);

    requestAnimationFrame(() => setTimeout(() => ring.classList.add('is-animated'), 200));
  }

  /** Segmented "loading bar" style timeline: period → follicular → ovulation → luteal, with a marker for today. */
  function initCycleProgressBar(cc, phase) {
    const bar = document.getElementById('cycleProgressBar');
    if (!bar) return;

    const periodPct = (cc.periodLength / cc.cycleLength) * 100;
    const follicularSpan = Math.max(0, cc.ovulationDay - 1 - cc.periodLength);
    const follicularPct = (follicularSpan / cc.cycleLength) * 100;
    const ovulationPct = Math.max((1 / cc.cycleLength) * 100, 3.2); // floor width so the sliver stays visible
    const lutealPct = Math.max(0, 100 - periodPct - follicularPct - ovulationPct);

    document.getElementById('cpbPeriod').style.width = periodPct + '%';
    document.getElementById('cpbFollicular').style.width = follicularPct + '%';
    document.getElementById('cpbOvulation').style.width = ovulationPct + '%';
    document.getElementById('cpbLuteal').style.width = lutealPct + '%';

    const markerPct = Math.min(100, Math.max(0, ((cc.day - 0.5) / cc.cycleLength) * 100));
    document.getElementById('cpbMarker').style.left = markerPct + '%';

    document.getElementById('cpbDay').textContent = cc.day;
    document.getElementById('cpbTotal').textContent = cc.cycleLength;
    document.getElementById('cpbPhaseLabel').textContent = phase || '—';

    requestAnimationFrame(() => setTimeout(() => bar.classList.add('is-animated'), 150));
  }

  /* ---- Recent activity (with locally-added entries persisted) ---- */
  function getActivity() {
    const extra = storage.get('activity-extra', []);
    return extra.concat(data.recentActivity);
  }

  function addActivity(text) {
    const extra = storage.get('activity-extra', []);
    extra.unshift({ when: 'Just now', text });
    storage.set('activity-extra', extra.slice(0, 10));
    renderActivity();
  }

  function renderActivity() {
    const list = document.getElementById('activityList');
    if (!list) return;
    const items = getActivity();
    list.innerHTML = items.map((item, i) => `
      <div class="activity-item" ${i === items.length - 1 ? '' : ''}>
        <div class="dot-col"><span class="dot"></span><span class="line"></span></div>
        <div><div class="when">${item.when}</div><div class="text">${item.text}</div></div>
      </div>`).join('');
  }

  /* ---- Pill / mood / segmented selection helpers (shared micro-interaction) ---- */
  function wireSingleSelect(container, selector) {
    if (!container) return;
    container.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll(selector).forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
    });
  }

  function wireMultiSelect(container, selector) {
    if (!container) return;
    container.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener('click', () => btn.classList.toggle('is-selected'));
    });
  }

  function getSelectedValue(container, selector) {
    const el = container && container.querySelector(`${selector}.is-selected`);
    return el ? el.dataset.value : null;
  }

  function getSelectedValues(container, selector) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(`${selector}.is-selected`)).map((el) => el.dataset.value);
  }

  /* ---- Today's check-in ---- */
  function initCheckIn() {
    const moodRow = document.getElementById('moodRow');
    const energySeg = document.getElementById('energySeg');
    const symptomPills = document.getElementById('symptomPills');
    const saveBtn = document.getElementById('saveCheckinBtn');
    if (!saveBtn) return;

    wireSingleSelect(moodRow, '.mood-btn');
    wireSingleSelect(energySeg, 'button');
    wireMultiSelect(symptomPills, '.pill');

    const key = 'checkin-' + dateKey(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    const saved = storage.get(key, null);
    if (saved) {
      if (saved.mood && moodRow) {
        const btn = moodRow.querySelector(`[data-value="${saved.mood}"]`);
        if (btn) btn.classList.add('is-selected');
      }
      if (saved.energy && energySeg) {
        const btn = energySeg.querySelector(`[data-value="${saved.energy}"]`);
        if (btn) btn.classList.add('is-selected');
      }
      if (saved.symptoms && symptomPills) {
        saved.symptoms.forEach((s) => {
          const btn = symptomPills.querySelector(`[data-value="${s}"]`);
          if (btn) btn.classList.add('is-selected');
        });
      }
      saveBtn.textContent = 'Update Check-in';
    }

    saveBtn.addEventListener('click', () => {
      const entry = {
        mood: getSelectedValue(moodRow, '.mood-btn'),
        energy: getSelectedValue(energySeg, 'button'),
        symptoms: getSelectedValues(symptomPills, '.pill'),
        savedAt: new Date().toISOString(),
      };
      storage.set(key, entry);
      saveBtn.textContent = 'Update Check-in';
      showToast('Check-in saved');
      addActivity('Check-in completed');
    });
  }

  /* ---- Mini calendar preview ---- */
  const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  let selectedDay = TODAY.getDate();

  function renderDateDetail(day) {
    const panel = document.getElementById('dateDetailPanel');
    if (!panel) return;
    const key = dateKey(TODAY.getFullYear(), TODAY.getMonth(), day);
    const entry = data.loggedDays[key];
    const label = new Date(TODAY.getFullYear(), TODAY.getMonth(), day)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const cycleDay = data.currentCycle.day - (TODAY.getDate() - day);
    const phase = cycleDay > 0 ? LunaApp.cyclePhase(cycleDay, data.currentCycle.periodLength, data.currentCycle.ovulationDay) : null;

    panel.innerHTML = `
      <div class="dd-date">${label}${day === TODAY.getDate() ? ' · Today' : ''}</div>
      <div class="dd-row"><span>Cycle day</span><span class="v">${cycleDay > 0 ? cycleDay : '—'}</span></div>
      <div class="dd-row"><span>Phase</span><span class="v">${phase || '—'}</span></div>
      <div class="dd-row"><span>Period</span><span class="v">${entry ? (entry.period ? 'Logged' : 'Not logged') : 'Not logged'}</span></div>
      <div class="dd-row"><span>Symptoms</span><span class="v">${entry && entry.symptoms.length ? entry.symptoms.join(', ') : 'None'}</span></div>
      <div class="dd-row"><span>Mood</span><span class="v">${entry && entry.mood ? entry.mood : '—'}</span></div>`;
  }

  function initMiniCalendar() {
    const weekdaysEl = document.getElementById('miniCalWeekdays');
    const daysEl = document.getElementById('miniCalDays');
    const monthLbl = document.getElementById('miniCalMonthLbl');
    if (!daysEl) return;

    const grid = buildMonthGrid(TODAY.getFullYear(), TODAY.getMonth());
    if (monthLbl) monthLbl.textContent = grid.monthLabel;
    if (weekdaysEl) weekdaysEl.innerHTML = WEEKDAY_LABELS.map((w) => `<span>${w}</span>`).join('');

    const cd = LunaApp.getCycleDates();
    function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
    function isBetween(d, s, e) { return d >= s && d <= e; }

    daysEl.innerHTML = grid.cells.map((day) => {
      if (!day) return `<button class="is-empty" tabindex="-1" aria-hidden="true"></button>`;
      const date = new Date(TODAY.getFullYear(), TODAY.getMonth(), day);
      const classes = ['day-cell'];
      const isOvulation = isSameDay(date, cd.ovulation) || isSameDay(date, cd.nextOvulation);
      const isFertile = isBetween(date, cd.fertileStart, cd.ovulation) || isBetween(date, cd.nextFertileStart, cd.nextOvulation);
      const isEstimatedPeriod = isBetween(date, cd.nextPeriodStart, cd.nextPeriodEnd);
      if (isOvulation) classes.push('is-ovulation');
      else if (isFertile) classes.push('is-fertile');
      else if (isEstimatedPeriod) classes.push('is-estimated');
      if (day === TODAY.getDate()) classes.push('is-today');
      if (day === selectedDay) classes.push('is-selected');
      return `<button class="${classes.join(' ')}" data-day="${day}" aria-label="${grid.monthLabel} ${day}">${day}</button>`;
    }).join('');

    daysEl.querySelectorAll('button[data-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedDay = Number(btn.dataset.day);
        daysEl.querySelectorAll('button').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        renderDateDetail(selectedDay);
      });
    });

    renderDateDetail(selectedDay);
  }

  /* ---- Insights preview ---- */
  function initInsightsPreview() {
    const grid = document.getElementById('dashMiniStats');
    if (!grid) return;
    const ins = data.insights;
    grid.innerHTML = `
      <div class="mini-stat"><div class="v">${ins.avgCycleLength}</div><div class="k">Avg. cycle (days)</div></div>
      <div class="mini-stat"><div class="v">${ins.avgPeriodLength}</div><div class="k">Avg. period (days)</div></div>
      <div class="mini-stat"><div class="v">${ins.cyclesLogged}</div><div class="k">Cycles tracked</div></div>
      <div class="mini-stat"><div class="v">±${ins.variationDays}</div><div class="k">Cycle variation</div></div>`;

    const chart = document.getElementById('dashChartWrap');
    if (chart) {
      const svg = chart.querySelector('svg');
      const lengths = ins.recentCycleLengths;
      const min = Math.min(...lengths), max = Math.max(...lengths);
      const rect = svg.getBoundingClientRect();
      const w = Math.max(200, Math.round(rect.width) || 400);
      const h = Math.max(60, Math.round(rect.height) || 120);
      const pad = Math.round(h * 0.14);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const points = lengths.map((v, i) => {
        const x = pad + (i / (lengths.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2 * 0.7);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      const path = chart.querySelector('.chart-path');
      if (path) path.setAttribute('points', points);
    }
  }

  /* ---- Quick action modals ---- */
  function initQuickActionModals() {
    // Log Period
    const periodPills = document.getElementById('logPeriodPills');
    wireSingleSelect(periodPills, '.pill');
    const savePeriodBtn = document.getElementById('savePeriodBtn');
    if (savePeriodBtn) savePeriodBtn.addEventListener('click', () => {
      const val = getSelectedValue(periodPills, '.pill') || 'Not started';
      LunaApp.closeModal(savePeriodBtn);
      showToast('Period logged');
      addActivity(`Period logged: ${val}`);
    });

    // Log Symptoms
    const symptomModalPills = document.getElementById('logSymptomsPills');
    wireMultiSelect(symptomModalPills, '.pill');
    const saveSymptomsBtn = document.getElementById('saveSymptomsBtn');
    if (saveSymptomsBtn) saveSymptomsBtn.addEventListener('click', () => {
      const vals = getSelectedValues(symptomModalPills, '.pill');
      LunaApp.closeModal(saveSymptomsBtn);
      showToast('Symptoms logged');
      addActivity(vals.length ? `Symptoms logged: ${vals.join(', ')}` : 'Symptoms logged');
    });

    // Add Note
    const noteText = document.getElementById('addNoteText');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    if (saveNoteBtn) saveNoteBtn.addEventListener('click', () => {
      const val = noteText ? noteText.value.trim() : '';
      LunaApp.closeModal(saveNoteBtn);
      showToast('Note saved');
      addActivity('Note added');
      if (noteText) noteText.value = '';
    });
  }

  function initLearnMore() {
    const btn = document.getElementById('learnMoreBtn');
    if (btn) btn.addEventListener('click', () => showToast('Educational content is coming soon'));
  }

  function initEditCycleButton() {
    const btn = document.getElementById('editCycleBtn');
    if (btn) btn.addEventListener('click', () => LunaApp.openCycleSetupModal('edit'));
  }

  function init() {
    initCycleCard();
    renderActivity();
    initCheckIn();
    initMiniCalendar();
    initInsightsPreview();
    initQuickActionModals();
    initLearnMore();
    initEditCycleButton();
    LunaApp.initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
