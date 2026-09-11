/* ==========================================================================
   LunaTrack App — insights.js
   Powers insights.html: stat cards + three charts built from
   LunaApp.data.insights.
   ========================================================================== */

(function () {
  const { data } = LunaApp;
  const ins = data.insights;

  function fillStats() {
    const map = {
      statAvgCycle: `${ins.avgCycleLength} days`,
      statAvgPeriod: `${ins.avgPeriodLength} days`,
      statShortest: `${ins.shortestCycle} days`,
      statLongest: `${ins.longestCycle} days`,
    };
    Object.keys(map).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  }

  function buildLinePoints(values, w, h, pad) {
    const min = Math.min(...values), max = Math.max(...values);
    return values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2 * 0.7);
      return { x: +x.toFixed(1), y: +y.toFixed(1), v };
    });
  }

  function renderLineChart(svgId, values, color) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    // Size the viewBox to the SVG's real rendered pixel box (instead of a
    // fixed 560x180 stretched with preserveAspectRatio="none") so circles
    // stay circular and the stroke doesn't distort at wide card widths.
    const rect = svg.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width) || 560);
    const h = Math.max(100, Math.round(rect.height) || 180);
    const pad = Math.round(h * 0.14);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const baseline = svg.querySelector('.chart-baseline');
    if (baseline) {
      const baseY = h - pad;
      baseline.setAttribute('x1', 0);
      baseline.setAttribute('y1', baseY);
      baseline.setAttribute('x2', w);
      baseline.setAttribute('y2', baseY);
    }

    const points = buildLinePoints(values, w, h, pad);
    const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(' ');

    const path = svg.querySelector('.chart-path');
    if (path) path.setAttribute('points', pointsAttr);

    svg.querySelectorAll('.chart-dot, .chart-val').forEach((n) => n.remove());
    points.forEach((p) => {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.setAttribute('r', 4);
      dot.setAttribute('fill', color);
      dot.setAttribute('class', 'chart-dot');
      svg.appendChild(dot);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', p.x); label.setAttribute('y', h - 4);
      label.setAttribute('font-size', '11'); label.setAttribute('fill', 'var(--c-ink-faint)');
      label.setAttribute('text-anchor', 'middle'); label.setAttribute('class', 'chart-val');
      label.textContent = p.v;
      svg.appendChild(label);
    });
  }

  function renderAllCharts() {
    renderLineChart('cycleLengthChart', ins.recentCycleLengths, 'var(--c-burgundy)');
    renderLineChart('periodLengthChart', ins.recentPeriodLengths, 'var(--c-lavender)');
  }

  function renderSymptomBars() {
    const wrap = document.getElementById('symptomBars');
    if (!wrap) return;
    const max = Math.max(...ins.symptomFrequency.map((s) => s.count));
    wrap.innerHTML = ins.symptomFrequency.map((s) => {
      const pct = Math.round((s.count / max) * 100);
      return `
      <div class="bar-row">
        <span class="bar-label">${s.name}</span>
        <span class="bar-track"><span class="bar-fill" data-pct="${pct}"></span></span>
        <span class="bar-count">${s.count}×</span>
      </div>`;
    }).join('');

    // Animate fills in directly (same approach as the dashboard's cycle
    // ring) instead of depending on the shared scroll-reveal observer,
    // which can race with this page's own render pass.
    requestAnimationFrame(() => {
      setTimeout(() => {
        wrap.querySelectorAll('.bar-fill').forEach((el) => {
          el.style.width = el.dataset.pct + '%';
        });
      }, 120);
    });
  }

  function init() {
    fillStats();
    renderAllCharts();
    renderSymptomBars();
    LunaApp.initScrollReveal();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderAllCharts, 150);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
