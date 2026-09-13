/* ==========================================================================
   LunaTrack App — dashboard.js
   Powers dashboard.html. Waits for the 'lunatrack:data-ready' event fired
   by app.js (once the user's real Supabase data has loaded) before
   touching LunaApp.data — everything here reads real rows, not mock data.
   ========================================================================== */

(function () {
  const RING_CIRCUMFERENCE = 452;

  function greetingWord() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function initGreeting() {
    const { data } = LunaApp;
    const name = data.user.name || (data.user.email ? data.user.email.split('@')[0] : 'there');
    const greeting = greetingWord() + ', ' + name;
    const sub = "Here's a look at your cycle today.";
    ['greetingText', 'mobileGreetingText'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.textContent = greeting;
    });
    ['greetingSub', 'mobileGreetingSub'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.textContent = sub;
    });
  }

  /* ---- Cycle card ---- */
  function initCycleCard() {
    const { data } = LunaApp;
    const cc = data.currentCycle;
    const cardEl = document.getElementById('cycleCardBody');

    if (!cc.hasSetup) {
      if (cardEl) {
        cardEl.innerHTML = ''
          + '<span class="eyebrow">Current cycle</span>'
          + '<p style="color:rgba(251,239,244,0.75);font-size:var(--fs-sm);margin-top:var(--sp-4);max-width:320px">'
          + "You haven't set up your cycle yet. Add your last period date and average cycle length to see predictions here."
          + '</p>'
          + '<button class="btn btn-secondary" id="setupCycleBtn" style="margin-top:var(--sp-5);background:rgba(251,239,244,0.14);border-color:rgba(251,239,244,0.3);color:#fff">Set up my cycle</button>';
        const btn = document.getElementById('setupCycleBtn');
        if (btn) btn.addEventListener('click', function () { LunaApp.openCycleSetupModal('edit'); });
      }
      return;
    }

    const ring = document.getElementById('cycleRing');
    if (!ring) return;
    const fraction = cc.day / cc.cycleLength;
    const offset = Math.round(RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, fraction))));
    ring.style.setProperty('--ring-offset', offset);

    document.getElementById('cycleDayNum').textContent = cc.day;
    document.getElementById('cycleDaysUntil').textContent = cc.daysUntilNext;
    document.getElementById('cyclePeriodLen').textContent = cc.periodLength;
    document.getElementById('cycleStart').textContent = cc.startDate;
    document.getElementById('cycleOvulation').textContent = cc.ovulationDate;
    document.getElementById('cycleNext').textContent = cc.nextPeriodDate;
    document.getElementById('cycleFertileNote').textContent =
      'Fertile window (estimated): ' + cc.fertileWindowLabel + '. Estimates are based on your logged history \u2014 not a guarantee.';

    const phase = LunaApp.cyclePhase(cc.day, cc.periodLength, cc.ovulationDay);
    const phaseChip = document.getElementById('cyclePhaseChip');
    if (phaseChip && phase) phaseChip.textContent = phase + ' phase';

    initCycleProgressBar(cc, phase);

    requestAnimationFrame(function () { setTimeout(function () { ring.classList.add('is-animated'); }, 200); });
  }

  function initCycleProgressBar(cc, phase) {
    const bar = document.getElementById('cycleProgressBar');
    if (!bar) return;

    const periodPct = (cc.periodLength / cc.cycleLength) * 100;
    const follicularSpan = Math.max(0, cc.ovulationDay - 1 - cc.periodLength);
    const follicularPct = (follicularSpan / cc.cycleLength) * 100;
    const ovulationPct = Math.max((1 / cc.cycleLength) * 100, 3.2);
    const lutealPct = Math.max(0, 100 - periodPct - follicularPct - ovulationPct);

    document.getElementById('cpbPeriod').style.width = periodPct + '%';
    document.getElementById('cpbFollicular').style.width = follicularPct + '%';
    document.getElementById('cpbOvulation').style.width = ovulationPct + '%';
    document.getElementById('cpbLuteal').style.width = lutealPct + '%';

    const markerPct = Math.min(100, Math.max(0, ((cc.day - 0.5) / cc.cycleLength) * 100));
    document.getElementById('cpbMarker').style.left = markerPct + '%';

    document.getElementById('cpbDay').textContent = cc.day;
    document.getElementById('cpbTotal').textContent = cc.cycleLength;
    document.getElementById('cpbPhaseLabel').textContent = phase || '\u2014';

    requestAnimationFrame(function () { setTimeout(function () { bar.classList.add('is-animated'); }, 150); });
  }

  /* ---- Recent activity ---- */
  function renderActivity() {
    const list = document.getElementById('activityList');
    if (!list) return;
    const items = LunaApp.data.recentActivity;
    if (!items.length) {
      list.innerHTML = '<div class="empty-state">No activity yet \u2014 log your first entry to see it here.</div>';
      return;
    }
    list.innerHTML = items.map(function (item, i) {
      return '<div class="activity-item"><div class="dot-col"><span class="dot"></span><span class="line"></span></div><div><div class="when">' + item.when + '</div><div class="text">' + item.text + '</div></div></div>';
    }).join('');
  }

  /* ---- Notes ---- */
  function renderNotes() {
    const list = document.getElementById('notesList');
    if (!list) return;
    const notes = LunaApp.data.notes;
    if (!notes.length) {
      list.innerHTML = '<div class="empty-state">No notes yet. Use "Add note" or the quick action above.</div>';
      return;
    }
    list.innerHTML = notes.map(function (n) {
      const d = new Date(n.created_at);
      return '<div class="note-item" data-id="' + n.id + '">'
        + '<div class="note-body"><div class="note-text"></div><div class="note-date">' + LunaApp.fmtShort(d) + '</div></div>'
        + '<button class="note-delete-btn" aria-label="Delete note" data-id="' + n.id + '">' + LunaApp.icon('trash', 14) + '</button>'
        + '</div>';
    }).join('');
    // Set text via textContent (not innerHTML) so note content can never break markup
    list.querySelectorAll('.note-item').forEach(function (el) {
      const id = el.dataset.id;
      const note = notes.find(function (n) { return String(n.id) === String(id); });
      if (note) el.querySelector('.note-text').textContent = note.content;
    });
    list.querySelectorAll('.note-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const id = btn.dataset.id;
        btn.disabled = true;
        const result = await LunaApp.deleteNote(isNaN(id) ? id : Number(id));
        if (result.error) { LunaApp.showToast('Could not delete note'); btn.disabled = false; return; }
        renderNotes();
        LunaApp.showToast('Note deleted');
      });
    });
  }

  /* ---- Selection helpers ---- */
  function wireSingleSelect(container, selector) {
    if (!container) return;
    container.querySelectorAll(selector).forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll(selector).forEach(function (b) { b.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
      });
    });
  }
  function wireMultiSelect(container, selector) {
    if (!container) return;
    container.querySelectorAll(selector).forEach(function (btn) {
      btn.addEventListener('click', function () { btn.classList.toggle('is-selected'); });
    });
  }
  function getSelectedValue(container, selector) {
    const el = container && container.querySelector(selector + '.is-selected');
    return el ? el.dataset.value : null;
  }
  function getSelectedValues(container, selector) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(selector + '.is-selected')).map(function (el) { return el.dataset.value; });
  }
  function applySelection(container, selector, value) {
    if (!container || !value) return;
    const btn = container.querySelector(selector + '[data-value="' + value + '"]');
    if (btn) btn.classList.add('is-selected');
  }

  /* ---- Today's check-in ---- */
  async function initCheckIn() {
    const moodRow = document.getElementById('moodRow');
    const energySeg = document.getElementById('energySeg');
    const symptomPills = document.getElementById('symptomPills');
    const saveBtn = document.getElementById('saveCheckinBtn');
    if (!saveBtn) return;

    wireSingleSelect(moodRow, '.mood-btn');
    wireSingleSelect(energySeg, 'button');
    wireMultiSelect(symptomPills, '.pill');

    const todayLog = await LunaApp.loadTodayLog();
    if (todayLog) {
      applySelection(moodRow, '.mood-btn', todayLog.mood);
      applySelection(energySeg, 'button', todayLog.energy);
      (todayLog.symptoms || []).forEach(function (s) { applySelection(symptomPills, '.pill', s); });
      saveBtn.textContent = 'Update Check-in';
    }

    saveBtn.addEventListener('click', async function () {
      const entry = {
        mood: getSelectedValue(moodRow, '.mood-btn'),
        energy: getSelectedValue(energySeg, 'button'),
        symptoms: getSelectedValues(symptomPills, '.pill'),
        period: todayLog ? todayLog.period_flow : null,
        sleep: todayLog ? todayLog.sleep : null,
        notes: todayLog ? todayLog.notes : null,
      };
      saveBtn.disabled = true;
      const result = await LunaApp.saveDailyLog(entry);
      saveBtn.disabled = false;
      if (result.error) { LunaApp.showToast('Could not save check-in'); return; }
      saveBtn.textContent = 'Update Check-in';
      LunaApp.showToast('Check-in saved');
    });
  }

  /* ---- Mini calendar preview ---- */
  const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  let selectedDay = LunaApp.TODAY.getDate();

  function renderDateDetail(day) {
    const panel = document.getElementById('dateDetailPanel');
    if (!panel) return;
    const { data, TODAY, dateKey, cyclePhase } = LunaApp;
    const key = dateKey(TODAY.getFullYear(), TODAY.getMonth(), day);
    const entry = data.loggedDays[key];
    const label = new Date(TODAY.getFullYear(), TODAY.getMonth(), day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const cycleDay = data.currentCycle.hasSetup ? data.currentCycle.day - (TODAY.getDate() - day) : null;
    const phase = cycleDay > 0 ? cyclePhase(cycleDay, data.currentCycle.periodLength, data.currentCycle.ovulationDay) : null;

    panel.innerHTML = ''
      + '<div class="dd-date">' + label + (day === TODAY.getDate() ? ' \u00b7 Today' : '') + '</div>'
      + '<div class="dd-row"><span>Cycle day</span><span class="v">' + (cycleDay > 0 ? cycleDay : '\u2014') + '</span></div>'
      + '<div class="dd-row"><span>Phase</span><span class="v">' + (phase || '\u2014') + '</span></div>'
      + '<div class="dd-row"><span>Period</span><span class="v">' + (entry ? (entry.period ? 'Logged' : 'Not logged') : 'Not logged') + '</span></div>'
      + '<div class="dd-row"><span>Symptoms</span><span class="v">' + (entry && entry.symptoms.length ? entry.symptoms.join(', ') : 'None') + '</span></div>'
      + '<div class="dd-row"><span>Mood</span><span class="v">' + (entry && entry.mood ? entry.mood : '\u2014') + '</span></div>';
  }

  function initMiniCalendar() {
    const weekdaysEl = document.getElementById('miniCalWeekdays');
    const daysEl = document.getElementById('miniCalDays');
    const monthLbl = document.getElementById('miniCalMonthLbl');
    if (!daysEl) return;

    const { TODAY, buildMonthGrid, getCycleDates } = LunaApp;
    const grid = buildMonthGrid(TODAY.getFullYear(), TODAY.getMonth());
    if (monthLbl) monthLbl.textContent = grid.monthLabel;
    if (weekdaysEl) weekdaysEl.innerHTML = WEEKDAY_LABELS.map(function (w) { return '<span>' + w + '</span>'; }).join('');

    const cd = getCycleDates();
    function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
    function isBetween(d, s, e) { return d >= s && d <= e; }

    daysEl.innerHTML = grid.cells.map(function (day) {
      if (!day) return '<button class="is-empty" tabindex="-1" aria-hidden="true"></button>';
      const date = new Date(TODAY.getFullYear(), TODAY.getMonth(), day);
      const classes = ['day-cell'];
      const entry = LunaApp.data.loggedDays[LunaApp.dateKey(TODAY.getFullYear(), TODAY.getMonth(), day)];
      if (entry && entry.period) classes.push('is-period');
      else if (cd) {
        const isOvulation = isSameDay(date, cd.ovulation) || isSameDay(date, cd.nextOvulation);
        const isFertile = isBetween(date, cd.fertileStart, cd.ovulation) || isBetween(date, cd.nextFertileStart, cd.nextOvulation);
        const isEstimatedPeriod = isBetween(date, cd.nextPeriodStart, cd.nextPeriodEnd);
        if (isOvulation) classes.push('is-ovulation');
        else if (isFertile) classes.push('is-fertile');
        else if (isEstimatedPeriod) classes.push('is-estimated');
      }
      if (day === TODAY.getDate()) classes.push('is-today');
      if (day === selectedDay) classes.push('is-selected');
      return '<button class="' + classes.join(' ') + '" data-day="' + day + '" aria-label="' + grid.monthLabel + ' ' + day + '">' + day + '</button>';
    }).join('');

    daysEl.querySelectorAll('button[data-day]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedDay = Number(btn.dataset.day);
        daysEl.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-selected'); });
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
    const ins = LunaApp.data.insights;

    if (!ins.hasEnoughData) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Not enough data yet. Keep logging your period to see cycle insights here.</div>';
      const chart = document.getElementById('dashChartWrap');
      if (chart) chart.style.display = 'none';
      return;
    }

    grid.innerHTML = ''
      + '<div class="mini-stat"><div class="v">' + ins.avgCycleLength + '</div><div class="k">Avg. cycle (days)</div></div>'
      + '<div class="mini-stat"><div class="v">' + ins.avgPeriodLength + '</div><div class="k">Avg. period (days)</div></div>'
      + '<div class="mini-stat"><div class="v">' + ins.cyclesLogged + '</div><div class="k">Cycles tracked</div></div>'
      + '<div class="mini-stat"><div class="v">\u00b1' + ins.variationDays + '</div><div class="k">Cycle variation</div></div>';

    const chart = document.getElementById('dashChartWrap');
    if (chart && ins.recentCycleLengths.length > 1) {
      const svg = chart.querySelector('svg');
      const lengths = ins.recentCycleLengths;
      const min = Math.min.apply(null, lengths), max = Math.max.apply(null, lengths);
      const rect = svg.getBoundingClientRect();
      const w = Math.max(200, Math.round(rect.width) || 400);
      const h = Math.max(60, Math.round(rect.height) || 120);
      const pad = Math.round(h * 0.14);
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      const points = lengths.map(function (v, i) {
        const x = pad + (i / (lengths.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2 * 0.7);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      const path = chart.querySelector('.chart-path');
      if (path) path.setAttribute('points', points);
    } else if (chart) {
      chart.style.display = 'none';
    }
  }

  /* ---- Quick action modals ---- */
  function initQuickActionModals() {
    const periodPills = document.getElementById('logPeriodPills');
    wireSingleSelect(periodPills, '.pill');
    const savePeriodBtn = document.getElementById('savePeriodBtn');
    if (savePeriodBtn) savePeriodBtn.addEventListener('click', async function () {
      const val = getSelectedValue(periodPills, '.pill') || 'Not started';
      savePeriodBtn.disabled = true;
      const todayLog = await LunaApp.loadTodayLog();
      const result = await LunaApp.saveDailyLog({
        period: val,
        symptoms: todayLog ? todayLog.symptoms : [],
        mood: todayLog ? todayLog.mood : null,
        energy: todayLog ? todayLog.energy : null,
        sleep: todayLog ? todayLog.sleep : null,
        notes: todayLog ? todayLog.notes : null,
      });
      savePeriodBtn.disabled = false;
      LunaApp.closeModal(savePeriodBtn);
      if (result.error) { LunaApp.showToast('Could not save'); return; }
      LunaApp.showToast('Period logged');
      setTimeout(function () { window.location.reload(); }, 500);
    });

    const symptomModalPills = document.getElementById('logSymptomsPills');
    wireMultiSelect(symptomModalPills, '.pill');
    const saveSymptomsBtn = document.getElementById('saveSymptomsBtn');
    if (saveSymptomsBtn) saveSymptomsBtn.addEventListener('click', async function () {
      const vals = getSelectedValues(symptomModalPills, '.pill');
      saveSymptomsBtn.disabled = true;
      const todayLog = await LunaApp.loadTodayLog();
      const result = await LunaApp.saveDailyLog({
        period: todayLog ? todayLog.period_flow : null,
        symptoms: vals,
        mood: todayLog ? todayLog.mood : null,
        energy: todayLog ? todayLog.energy : null,
        sleep: todayLog ? todayLog.sleep : null,
        notes: todayLog ? todayLog.notes : null,
      });
      saveSymptomsBtn.disabled = false;
      LunaApp.closeModal(saveSymptomsBtn);
      if (result.error) { LunaApp.showToast('Could not save'); return; }
      LunaApp.showToast('Symptoms logged');
      setTimeout(function () { window.location.reload(); }, 500);
    });

    const noteText = document.getElementById('addNoteText');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    if (saveNoteBtn) saveNoteBtn.addEventListener('click', async function () {
      const val = noteText ? noteText.value.trim() : '';
      if (!val) { LunaApp.showToast('Write something first'); return; }
      saveNoteBtn.disabled = true;
      const result = await LunaApp.addNote(val);
      saveNoteBtn.disabled = false;
      if (result.error) { LunaApp.showToast('Could not save note'); return; }
      LunaApp.closeModal(saveNoteBtn);
      LunaApp.showToast('Note saved');
      if (noteText) noteText.value = '';
      renderNotes();
    });
  }

  function initEditCycleButton() {
    const btn = document.getElementById('editCycleBtn');
    if (btn) btn.addEventListener('click', function () { LunaApp.openCycleSetupModal('edit'); });
  }

  function init() {
    initGreeting();
    initCycleCard();
    renderActivity();
    renderNotes();
    initCheckIn();
    initMiniCalendar();
    initInsightsPreview();
    initQuickActionModals();
    initEditCycleButton();
    LunaApp.initScrollReveal();
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
