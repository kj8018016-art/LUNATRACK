/* ==========================================================================
   LunaTrack App — insights.js
   Powers insights.html: stat cards + three charts built from
   LunaApp.data.insights — all derived from the user's real daily_logs.
   Shows a clear empty state until there's enough real data.
   ========================================================================== */

(function () {
  function fillStats(ins) {
    const map = {
      statAvgCycle: ins.avgCycleLength !== null ? ins.avgCycleLength + ' days' : '\u2014',
      statAvgPeriod: ins.avgPeriodLength !== null ? ins.avgPeriodLength + ' days' : '\u2014',
      statShortest: ins.shortestCycle !== null ? ins.shortestCycle + ' days' : '\u2014',
      statLongest: ins.longestCycle !== null ? ins.longestCycle + ' days' : '\u2014',
    };
    Object.keys(map).forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  }

  function buildLinePoints(values, w, h, pad) {
    const min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    return values.map(function (v, i) {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
      return { x: +x.toFixed(1), y: +y.toFixed(1), v: v };
    });
  }

  function renderLineChart(svgId, values, color) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width) || 560);
    const h = Math.max(100, Math.round(rect.height) || 180);
    const pad = Math.round(h * 0.14);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    const baseline = svg.querySelector('.chart-baseline');
    if (baseline) {
      const baseY = h - pad;
      baseline.setAttribute('x1', 0); baseline.setAttribute('y1', baseY);
      baseline.setAttribute('x2', w); baseline.setAttribute('y2', baseY);
    }

    const points = buildLinePoints(values, w, h, pad);
    const pointsAttr = points.map(function (p) { return p.x + ',' + p.y; }).join(' ');

    const path = svg.querySelector('.chart-path');
    if (path) path.setAttribute('points', pointsAttr);

    svg.querySelectorAll('.chart-dot, .chart-val').forEach(function (n) { n.remove(); });
    points.forEach(function (p) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.setAttribute('r', 4);
      dot.setAttribute('fill', color); dot.setAttribute('class', 'chart-dot');
      svg.appendChild(dot);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', p.x); label.setAttribute('y', h - 4);
      label.setAttribute('font-size', '11'); label.setAttribute('fill', 'var(--c-ink-faint)');
      label.setAttribute('text-anchor', 'middle'); label.setAttribute('class', 'chart-val');
      label.textContent = p.v;
      svg.appendChild(label);
    });
  }

  function renderSymptomBars(ins) {
    const wrap = document.getElementById('symptomBars');
    const emptyState = document.getElementById('symptomBarsEmpty');
    if (!wrap) return;

    if (!ins.symptomFrequency.length) {
      wrap.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    wrap.style.display = '';
    if (emptyState) emptyState.style.display = 'none';

    const max = Math.max.apply(null, ins.symptomFrequency.map(function (s) { return s.count; }));
    wrap.innerHTML = ins.symptomFrequency.map(function (s) {
      const pct = Math.round((s.count / max) * 100);
      return '<div class="bar-row"><span class="bar-label">' + s.name + '</span><span class="bar-track"><span class="bar-fill" data-pct="' + pct + '"></span></span><span class="bar-count">' + s.count + '\u00d7</span></div>';
    }).join('');

    requestAnimationFrame(function () {
      setTimeout(function () {
        wrap.querySelectorAll('.bar-fill').forEach(function (el) { el.style.width = el.dataset.pct + '%'; });
      }, 120);
    });
  }

  function toggleEmptyState(ins) {
    const emptyBanner = document.getElementById('insightsEmptyBanner');
    const content = document.getElementById('insightsContent');
    if (!emptyBanner || !content) return;
    if (ins.hasEnoughData || ins.symptomFrequency.length) {
      emptyBanner.style.display = 'none';
      content.style.display = '';
    } else {
      emptyBanner.style.display = 'block';
      content.style.display = 'none';
    }
  }

  function renderAllCharts() {
    const ins = LunaApp.data.insights;
    if (ins.recentCycleLengths.length > 1) renderLineChart('cycleLengthChart', ins.recentCycleLengths, 'var(--c-burgundy)');
    if (ins.recentPeriodLengths.length > 1) renderLineChart('periodLengthChart', ins.recentPeriodLengths, 'var(--c-lavender)');
  }

  function init() {
    const ins = LunaApp.data.insights;
    toggleEmptyState(ins);
    fillStats(ins);
    renderAllCharts();
    renderSymptomBars(ins);
    LunaApp.initScrollReveal();

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderAllCharts, 150);
    });
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
