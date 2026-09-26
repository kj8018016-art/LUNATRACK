/* ==========================================================================
   LunaTrack App — sugar-history.js
   Powers sugar-history.html. Reuses LunaApp.data.recentLogs (already fetched
   by app.js — no new query) and LunaApp.phaseBucketForDate (the existing
   cycle-length/period-length math) to group sugar logs into Before/During/
   After period. Insight text only appears with enough data and a real gap
   between phases — never a claim about sugar causing or preventing symptoms.
   ========================================================================== */

(function () {
  const LEVEL_VALUE = { Low: 1, Moderate: 2, High: 3 };
  const LEVEL_EMOJI = { Low: '\ud83c\udf6c', Moderate: '\ud83c\udf6d', High: '\ud83c\udf6b' };
  const PHASE_LABEL = { before: 'Before period', during: 'During period', after: 'After period' };
  const PHASE_ELEMENT_ID = { before: 'shBefore', during: 'shDuring', after: 'shAfter' };

  function bucketize() {
    const logs = (LunaApp.data.recentLogs || []).filter(function (l) { return l.sugar_intake; });
    const buckets = { before: [], during: [], after: [] };
    logs.forEach(function (l) {
      const date = LunaApp.dateFromISO(l.log_date);
      const phase = LunaApp.phaseBucketForDate(date);
      if (phase) buckets[phase].push(l);
    });
    return { logs: logs, buckets: buckets };
  }

  function avgOf(list) {
    return list.reduce(function (sum, l) { return sum + (LEVEL_VALUE[l.sugar_intake] || 0); }, 0) / list.length;
  }

  function avgLabel(list) {
    if (list.length < 2) return null;
    const avg = avgOf(list);
    if (avg < 1.67) return 'Mostly Low';
    if (avg < 2.34) return 'Mostly Moderate';
    return 'Mostly High';
  }

  function renderStats(buckets) {
    ['before', 'during', 'after'].forEach(function (key) {
      const list = buckets[key];
      const label = avgLabel(list);
      const valueEl = document.getElementById(PHASE_ELEMENT_ID[key] + 'Value');
      const countEl = document.getElementById(PHASE_ELEMENT_ID[key] + 'Count');
      if (valueEl) valueEl.textContent = label || (list.length ? 'Not enough data yet' : 'No logs yet');
      if (countEl) countEl.textContent = list.length + (list.length === 1 ? ' log' : ' logs');
    });
  }

  /** Only surfaces a pattern sentence with real data and a real gap — never a cause/effect claim. */
  function renderInsight(buckets, totalCount) {
    const box = document.getElementById('shInsight');
    if (!box) return;
    if (totalCount < 6) { box.hidden = true; return; }

    const avgs = {};
    Object.keys(buckets).forEach(function (key) {
      if (buckets[key].length >= 2) avgs[key] = avgOf(buckets[key]);
    });
    const keys = Object.keys(avgs);
    if (keys.length < 2) { box.hidden = true; return; }

    keys.sort(function (a, b) { return avgs[b] - avgs[a]; });
    const highest = keys[0];
    const restAvgs = keys.slice(1).map(function (k) { return avgs[k]; });
    const maxRest = Math.max.apply(null, restAvgs);
    if (avgs[highest] - maxRest < 0.4) { box.hidden = true; return; } // not a clear enough gap to call it a pattern

    box.hidden = false;
    box.querySelector('p').textContent = 'Your recent logs show higher sugar intake around ' + PHASE_LABEL[highest].toLowerCase() + '.';
  }

  function renderList(logs) {
    const list = document.getElementById('shHistoryList');
    if (!list) return;
    if (!logs.length) {
      list.innerHTML = '<div class="empty-state">No sugar logs yet \u2014 use "Log Sugar" on your dashboard to start.</div>';
      return;
    }
    const sorted = logs.slice().sort(function (a, b) { return b.log_date.localeCompare(a.log_date); });
    list.innerHTML = sorted.slice(0, 30).map(function (l) {
      const date = LunaApp.dateFromISO(l.log_date);
      const phase = LunaApp.phaseBucketForDate(date);
      const phaseLabel = phase ? PHASE_LABEL[phase] : '\u2014';
      const noteHTML = l.sugar_note ? '<span class="len" style="max-width:200px;text-align:right;white-space:normal">' + l.sugar_note + '</span>' : '';
      return '<div class="history-row" style="cursor:default">'
        + '<div><div class="tag">' + phaseLabel + '</div><div class="range">' + LunaApp.fmtShort(date) + '</div></div>'
        + '<div style="display:flex;align-items:center;gap:var(--sp-4)">' + noteHTML + '<span class="len">' + (LEVEL_EMOJI[l.sugar_intake] || '') + ' ' + l.sugar_intake + '</span></div>'
        + '</div>';
    }).join('');
  }

  function init() {
    const cycleNote = document.getElementById('shNoCycleNote');
    if (cycleNote) cycleNote.hidden = LunaApp.data.currentCycle.hasSetup;

    const bucketed = bucketize();
    renderStats(bucketed.buckets);
    renderInsight(bucketed.buckets, bucketed.logs.length);
    renderList(bucketed.logs);
    LunaApp.initScrollReveal();
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
