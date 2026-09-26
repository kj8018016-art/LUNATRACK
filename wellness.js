/* ==========================================================================
   LunaTrack App — wellness.js
   Powers wellness.html: category filtering over LunaWellnessTips.TIPS, plus
   the "For you" personalized section when any pattern-based tips apply.
   ========================================================================== */

(function () {
  function renderChips() {
    const wrap = document.getElementById('tipCategoryChips');
    const cats = LunaWellnessTips.CATEGORIES;
    wrap.innerHTML = '<button class="chat-suggestion-chip is-active-chip" data-cat="all">All</button>'
      + cats.map(function (c) { return '<button class="chat-suggestion-chip" data-cat="' + c.id + '">' + c.emoji + ' ' + c.label + '</button>'; }).join('');

    wrap.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        wrap.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active-chip'); });
        btn.classList.add('is-active-chip');
        renderGrid(btn.dataset.cat);
      });
    });
  }

  function renderGrid(filterCat) {
    const grid = document.getElementById('tipGrid');
    const list = (!filterCat || filterCat === 'all') ? LunaWellnessTips.TIPS : LunaWellnessTips.TIPS.filter(function (t) { return t.cat === filterCat; });
    grid.innerHTML = list.map(function (t, i) {
      const cat = LunaWellnessTips.categoryFor(t.cat);
      return '<div class="tip-card" data-reveal style="transition-delay:' + (Math.min(i, 8) * 40) + 'ms">'
        + '<span class="tip-card-emoji">' + cat.emoji + '</span>'
        + '<div><div class="tip-card-cat">' + cat.label + '</div><p>' + t.text + '</p></div>'
        + '</div>';
    }).join('');
    LunaApp.initScrollReveal();
  }

  function renderPersonalized() {
    const section = document.getElementById('personalizedTipsSection');
    const wrap = document.getElementById('personalizedTips');
    const tips = LunaWellnessTips.getPersonalizedTips();
    if (!tips.length) { section.hidden = true; return; }
    section.hidden = false;
    wrap.innerHTML = tips.map(function (t) {
      return '<div class="personalized-tip-card">'
        + '<span class="emoji">' + t.emoji + '</span>'
        + '<div><h3>' + t.title + '</h3><p>' + t.text + '</p></div>'
        + '</div>';
    }).join('');
  }

  function init() {
    renderPersonalized();
    renderChips();
    renderGrid('all');
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
