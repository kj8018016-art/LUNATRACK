/* ==========================================================================
   LunaTrack App — learn-content.js
   Real educational content, organized by category, opened in a read-more
   modal. General information only — not medical advice.
   ========================================================================== */

(function () {
  const ARTICLES = [
    {
      cat: 'Basics', title: 'What is a menstrual cycle?',
      summary: 'The basics of what a cycle is and why length varies from person to person.',
      body: '<p>A menstrual cycle is counted from the first day of one period to the first day of the next. While 28 days is often used as a reference point, cycles anywhere from about 21 to 35 days are considered typical for adults.</p><p>Cycle length can vary from month to month for the same person, influenced by stress, travel, illness, weight changes, and many other factors \u2014 a single unusually long or short cycle isn\u2019t automatically a cause for concern.</p>'
    },
    {
      cat: 'Basics', title: 'Understanding the four cycle phases',
      summary: 'What Period, Follicular, Ovulation, and Luteal actually mean.',
      body: '<h4>Period (menstruation)</h4><p>The uterine lining sheds. Typically the first 3\u20137 days of the cycle.</p><h4>Follicular phase</h4><p>Runs from the first day of the period until ovulation. Hormone levels rise as the body prepares to release an egg.</p><h4>Ovulation</h4><p>An egg is released, usually around the midpoint of the cycle. This is when the fertile window is at its highest.</p><h4>Luteal phase</h4><p>The time between ovulation and the next period, typically fairly consistent at around 12\u201314 days, even when the rest of the cycle varies.</p>'
    },
    {
      cat: 'Symptoms', title: 'Common symptoms across the cycle',
      summary: 'Cramps, bloating, headaches, fatigue, and mood changes — what\u2019s common.',
      body: '<p>Many people notice patterns like cramping or bloating around their period, or mood and energy shifts in the days leading up to it (sometimes called premenstrual symptoms). Fatigue, headaches, breast tenderness, and changes in appetite are also commonly reported.</p><p>Symptom patterns are personal \u2014 tracking what you notice, and when, is one of the most useful things logging can do for you over time.</p>'
    },
    {
      cat: 'Symptoms', title: 'Why tracking symptoms is useful',
      summary: 'How consistent logging turns into useful patterns over time.',
      body: '<p>A single logged symptom tells you very little on its own. Logged consistently over a few cycles, patterns start to emerge \u2014 for example, a symptom that reliably shows up a few days before your period, or one that\u2019s become more or less frequent over time.</p><p>LunaTrack\u2019s Insights page surfaces these patterns automatically once you\u2019ve logged enough real data \u2014 there\u2019s no need to track it separately yourself.</p>'
    },
    {
      cat: 'Patterns', title: 'What counts as a "regular" cycle?',
      summary: 'How much variation is normal, and when a change might be worth noting.',
      body: '<p>Some month-to-month variation in cycle length is normal for most people. A helpful way to think about regularity is the spread between your shortest and longest recent cycles, rather than a single "ideal" number.</p><p>A significant or sudden change in your usual pattern \u2014 cycles becoming much longer or shorter, or stopping altogether \u2014 is generally worth discussing with a healthcare provider, especially if it persists over more than a cycle or two.</p>'
    },
    {
      cat: 'Wellness', title: 'Sleep, stress, and your cycle',
      summary: 'How everyday factors can shift cycle timing and symptoms.',
      body: '<p>Sleep quality, stress levels, exercise changes, travel, and illness can all influence cycle timing and how symptoms feel from one cycle to the next. This is one reason a single irregular cycle usually isn\u2019t a cause for alarm on its own.</p><p>Logging notes alongside your symptoms (a stressful week, a change in routine) can help you connect the dots later when you look back at your history.</p>'
    },
    {
      cat: 'Wellness', title: 'When to seek professional medical advice',
      summary: 'Signs worth bringing to a doctor or healthcare provider.',
      body: '<p>Consider speaking with a healthcare professional if you notice: periods that suddenly become much heavier, longer, or more painful than usual; cycles that stop for several months without an obvious reason (like pregnancy); bleeding between periods; or symptoms that are significantly interfering with daily life.</p><p>LunaTrack is a tracking tool, not a diagnostic one \u2014 it can help you describe your patterns clearly to a provider, but it can\u2019t tell you what\u2019s causing a change.</p>'
    },
    {
      cat: 'Privacy', title: 'How LunaTrack handles your health data',
      summary: 'Where your data lives and who can access it.',
      body: '<p>Your cycle and symptom data is stored in a Supabase project\u2019s database, protected by Row Level Security policies \u2014 rules enforced by the database itself that only allow your signed-in account to read or write your own rows.</p><p>You can export a copy of your data at any time from Settings \u2192 Privacy, and permanently delete your account and all associated data from the same page.</p>'
    },
  ];

  function renderChips() {
    const cats = ['All'].concat(Array.from(new Set(ARTICLES.map(function (a) { return a.cat; }))));
    const wrap = document.getElementById('learnCategoryChips');
    wrap.innerHTML = cats.map(function (c, i) {
      return '<button class="chat-suggestion-chip' + (i === 0 ? ' is-active-chip' : '') + '" data-cat="' + c + '">' + c + '</button>';
    }).join('');
    wrap.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        wrap.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active-chip'); });
        btn.classList.add('is-active-chip');
        renderGrid(btn.dataset.cat);
      });
    });
  }

  function renderGrid(filterCat) {
    const grid = document.getElementById('learnGrid');
    const list = (!filterCat || filterCat === 'All') ? ARTICLES : ARTICLES.filter(function (a) { return a.cat === filterCat; });
    grid.innerHTML = list.map(function (a, i) {
      return '<div class="learn-card" data-reveal style="transition-delay:' + (i * 40) + 'ms" data-index="' + ARTICLES.indexOf(a) + '">'
        + '<div class="learn-cat">' + a.cat + '</div><h3>' + a.title + '</h3><p>' + a.summary + '</p>'
        + '<span class="read-more">Read more \u2192</span></div>';
    }).join('');
    grid.querySelectorAll('.learn-card').forEach(function (card) {
      card.addEventListener('click', function () { openArticle(Number(card.dataset.index)); });
    });
    LunaApp.initScrollReveal();
  }

  function openArticle(index) {
    const a = ARTICLES[index];
    document.getElementById('learnModalCat').textContent = a.cat;
    document.getElementById('learnModalTitle').textContent = a.title;
    document.getElementById('learnModalBody').innerHTML = a.body;
    LunaApp.openModal('modalLearnArticle');
  }

  function init() {
    renderChips();
    renderGrid('All');
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
