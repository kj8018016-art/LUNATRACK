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

  /* ---- Mood support suggestions ---- */
  const CHEER_SUGGESTIONS = [
    { emoji: '\ud83d\udeb6\u200d\u2640\ufe0f', text: 'Take a short walk' },
    { emoji: '\ud83d\udca7', text: 'Drink some water' },
    { emoji: '\ud83c\udfb5', text: 'Listen to calming music' },
    { emoji: '\ud83c\udf2c\ufe0f', text: 'Try a short breathing exercise' },
    { emoji: '\ud83d\udecf\ufe0f', text: 'Rest for a few minutes' },
    { emoji: '\ud83d\udcdd', text: 'Write down how you\u2019re feeling' },
    { emoji: '\ud83c\udf6a', text: 'Have a snack' },
    { emoji: '\ud83d\udc9c', text: 'Talk to someone you trust' },
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function isLowMood(mood) { return mood === 'Low' || mood === 'Difficult'; }

  /** Shows/hides + resets the gentle mood-support card based on today's mood. Never framed as medical/psychological advice. */
  function showMoodSupport(mood) {
    const card = document.getElementById('moodSupportCard');
    if (!card) return;
    if (!isLowMood(mood)) { card.hidden = true; return; }

    card.hidden = false;
    const cheerBtn = document.getElementById('cheerMeUpBtn');
    const list = document.getElementById('cheerList');
    const disclaimer = document.getElementById('cheerDisclaimer');
    list.hidden = true; list.innerHTML = '';
    disclaimer.hidden = true;
    cheerBtn.hidden = false;
    cheerBtn.onclick = function () {
      const shuffled = shuffle(CHEER_SUGGESTIONS);
      list.innerHTML = shuffled.map(function (s, i) {
        return '<li style="animation-delay:' + (i * 60) + 'ms"><span class="cheer-emoji">' + s.emoji + '</span><span>' + s.text + '</span></li>';
      }).join('');
      list.hidden = false;
      disclaimer.hidden = false;
      cheerBtn.hidden = true;
    };
  }

  function checkinSummaryText(log) {
    const moodMap = { Great: '\ud83d\ude0a Great', Good: '\ud83d\ude42 Good', Okay: '\ud83d\ude10 Okay', Low: '\ud83d\ude14 Low', Difficult: '\ud83d\ude23 Difficult' };
    const parts = [];
    if (log.mood) parts.push(moodMap[log.mood] || log.mood);
    if (log.energy) parts.push(log.energy + ' energy');
    if (log.cramp_level && log.cramp_level !== 'None') parts.push(log.cramp_level.toLowerCase() + ' pain');
    return parts.length ? parts.join(' \u00b7 ') : 'Logged for today.';
  }

  /* ---- Wellness snapshot — water intake (today), pain (today), activity level (profile) ---- */
  const WATER_PCT = { 'Less than 4 cups': 25, '4\u20136 cups': 55, '6\u20138 cups': 80, '8+ cups': 100 };
  const PAIN_LEVEL = { None: 0, Mild: 1, Moderate: 2, Severe: 3 };
  const ACTIVITY_PCT = { Sedentary: 20, 'Lightly active': 45, 'Moderately active': 70, 'Very active': 95 };

  function renderWellnessSnapshot(log) {
    const cupFill = document.getElementById('wsCupFill');
    if (!cupFill) return; // card not on this page
    const waterValue = document.getElementById('wsWaterValue');
    const painDots = document.querySelectorAll('#wsPainDots .ws-dot');
    const painValue = document.getElementById('wsPainValue');
    const activityFill = document.getElementById('wsActivityFill');
    const activityValue = document.getElementById('wsActivityValue');

    if (log && log.water_intake) {
      waterValue.textContent = log.water_intake;
      requestAnimationFrame(function () { cupFill.style.height = (WATER_PCT[log.water_intake] || 0) + '%'; });
    } else {
      cupFill.style.height = '0%';
      waterValue.textContent = 'Log today\u2019s check-in';
    }

    if (log && log.cramp_level) {
      painValue.textContent = log.cramp_level;
      const lvl = PAIN_LEVEL[log.cramp_level] || 0;
      painDots.forEach(function (dot) {
        const d = Number(dot.dataset.level);
        setTimeout(function () { dot.classList.toggle('is-filled', d <= lvl); }, d * 90);
      });
    } else {
      painDots.forEach(function (dot) { dot.classList.remove('is-filled'); });
      painValue.textContent = 'Log today\u2019s check-in';
    }

    const activity = LunaApp.data.user.lifestyle && LunaApp.data.user.lifestyle.activityLevel;
    if (activity) {
      activityValue.textContent = activity;
      requestAnimationFrame(function () { activityFill.style.width = (ACTIVITY_PCT[activity] || 0) + '%'; });
    } else {
      activityFill.style.width = '0%';
      activityValue.textContent = 'Set in your profile';
    }
  }

  async function initWellnessSnapshot(preloadedLog) {
    const log = preloadedLog !== undefined ? preloadedLog : await LunaApp.loadTodayLog();
    renderWellnessSnapshot(log);
  }

  /* ---- Today's check-in ---- */
  async function initCheckIn() {
    const moodRow = document.getElementById('moodRow');
    const energySeg = document.getElementById('energySeg');
    const painPills = document.getElementById('painPills');
    const symptomPills = document.getElementById('symptomPills');
    const waterPills = document.getElementById('waterPills');
    const cravingPills = document.getElementById('cravingPills');
    const notesInput = document.getElementById('checkinNotes');
    const saveBtn = document.getElementById('saveCheckinBtn');
    const formView = document.getElementById('checkinFormView');
    const doneView = document.getElementById('checkinDoneView');
    const editBtn = document.getElementById('editCheckinBtn');
    if (!saveBtn) return;

    wireSingleSelect(moodRow, '.mood-btn');
    wireSingleSelect(energySeg, 'button');
    wireSingleSelect(painPills, '.pill');
    wireMultiSelect(symptomPills, '.pill');
    wireSingleSelect(waterPills, '.pill');
    wireMultiSelect(cravingPills, '.pill');

    // "None" craving is exclusive with every other craving option, and vice versa
    if (cravingPills) {
      cravingPills.querySelectorAll('.pill').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.dataset.value === 'None') {
            if (btn.classList.contains('is-selected')) {
              cravingPills.querySelectorAll('.pill').forEach(function (b) { if (b !== btn) b.classList.remove('is-selected'); });
            }
          } else if (btn.classList.contains('is-selected')) {
            const noneBtn = cravingPills.querySelector('.pill[data-value="None"]');
            if (noneBtn) noneBtn.classList.remove('is-selected');
          }
        });
      });
    }

    let todayLog = await LunaApp.loadTodayLog();

    function fillForm(log) {
      applySelection(moodRow, '.mood-btn', log.mood);
      applySelection(energySeg, 'button', log.energy);
      applySelection(painPills, '.pill', log.cramp_level);
      (log.symptoms || []).forEach(function (s) { applySelection(symptomPills, '.pill', s); });
      applySelection(waterPills, '.pill', log.water_intake);
      (log.cravings || []).forEach(function (s) { applySelection(cravingPills, '.pill', s); });
      if (notesInput) notesInput.value = log.notes || '';
    }

    // "Checked in today" means the quick check-in fields specifically were set —
    // a period-only log from the Log Today page shouldn't count as a check-in.
    function isCheckedIn(log) { return Boolean(log && (log.mood || log.energy || log.cramp_level)); }

    function showDoneView(log) {
      doneView.hidden = false;
      formView.hidden = true;
      document.getElementById('checkinDoneSummary').textContent = checkinSummaryText(log);
      showMoodSupport(log.mood);
    }

    function showFormView(log) {
      doneView.hidden = true;
      formView.hidden = false;
      if (log) fillForm(log);
      showMoodSupport(log ? log.mood : null);
    }

    if (isCheckedIn(todayLog)) {
      fillForm(todayLog); // so Edit opens pre-filled
      showDoneView(todayLog);
    } else {
      showFormView(todayLog);
    }

    if (editBtn) editBtn.addEventListener('click', function () { showFormView(todayLog); });

    saveBtn.addEventListener('click', async function () {
      const entry = {
        mood: getSelectedValue(moodRow, '.mood-btn'),
        energy: getSelectedValue(energySeg, 'button'),
        crampLevel: getSelectedValue(painPills, '.pill'),
        symptoms: getSelectedValues(symptomPills, '.pill'),
        waterIntake: getSelectedValue(waterPills, '.pill'),
        cravings: getSelectedValues(cravingPills, '.pill'),
        notes: notesInput ? notesInput.value.trim() : (todayLog ? todayLog.notes : null),
        period: todayLog ? todayLog.period_flow : null,
        sleep: todayLog ? todayLog.sleep : null,
      };
      saveBtn.disabled = true;
      const result = await LunaApp.saveDailyLog(entry);
      saveBtn.disabled = false;
      if (result.error) { LunaApp.showToast('Could not save check-in'); return; }
      todayLog = result.log;
      LunaApp.showToast('Check-in saved');
      showDoneView(todayLog);
      renderWellnessSnapshot(todayLog);
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
        const isEstimatedPeriod = isBetween(date, cd.previousCycleStart, cd.previousCycleEnd)
          || isBetween(date, cd.cycleStart, cd.cycleEnd)
          || isBetween(date, cd.nextPeriodStart, cd.nextPeriodEnd);
        if (isEstimatedPeriod) classes.push('is-estimated');
        else if (isFertile) classes.push('is-fertile');
        else if (isOvulation) classes.push('is-ovulation');
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
    if (!LunaApp.data.user.onboardingCompleted) {
      window.location.href = 'onboarding.html';
      return;
    }
    initGreeting();
    initCycleCard();
    renderActivity();
    renderNotes();
    initCheckIn();
    initWellnessSnapshot();
    initMiniCalendar();
    initInsightsPreview();
    initQuickActionModals();
    initEditCycleButton();
    LunaApp.initScrollReveal();
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
