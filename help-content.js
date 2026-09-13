/* ==========================================================================
   LunaTrack App — help-content.js
   Real Help Center content, organized by category, with client-side search
   and expandable FAQ entries. Waits for the shell before rendering.
   ========================================================================== */

(function () {
  const CATEGORIES = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        { q: 'How do I set up my cycle?', a: 'On your first visit, LunaTrack asks for the first day of your last period, your average cycle length, and your average period length. You can revisit this anytime from the pencil icon on your dashboard\u2019s cycle card, or from Settings \u2192 Cycle setup.' },
        { q: 'What if I don\u2019t know my average cycle length?', a: '28 days is a reasonable starting estimate \u2014 you can always come back and adjust it once you\u2019ve logged a couple of real cycles and LunaTrack shows you your actual average in Insights.' },
        { q: 'Do I need to log every single day?', a: 'No. Logging on the days something is worth noting \u2014 period flow, symptoms, mood \u2014 is enough. The more consistently you log, the more accurate your predictions and insights become.' },
      ],
    },
    {
      id: 'account',
      title: 'Account & Profile',
      items: [
        { q: 'How do I change my name?', a: 'Go to Settings \u2192 Profile, edit the Name field, and click outside the box (or press Tab) to save.' },
        { q: 'Can I change my profile photo?', a: 'Yes \u2014 Settings \u2192 Profile \u2192 Change photo. JPG or PNG files up to 4MB are supported.' },
        { q: 'Can I change my email address?', a: 'Not from within the app yet \u2014 your email is tied to your Supabase account. Contact whoever manages your LunaTrack project if this needs to change.' },
        { q: 'How do I log out?', a: 'Settings \u2192 Profile \u2192 Log out, in the top-right of the Profile card.' },
      ],
    },
    {
      id: 'logging',
      title: 'Logging Symptoms',
      items: [
        { q: 'Where do I log symptoms?', a: 'Use the Log Today page for a full entry (period, symptoms, mood, energy, sleep, notes), or the "Log Symptoms" quick action on your dashboard for something faster.' },
        { q: 'Can I edit a log after saving it?', a: 'Yes \u2014 open Log Today (or use the quick actions) again on the same day and your previous entry will already be filled in. Saving again updates that day\u2019s record.' },
        { q: 'Can I log for a past day I forgot?', a: 'The Log Today page always saves to today\u2019s date. Logging for a specific past date isn\u2019t supported yet.' },
      ],
    },
    {
      id: 'cycle-tracking',
      title: 'Cycle Tracking',
      items: [
        { q: 'How does LunaTrack estimate my next period?', a: 'From your cycle setup (last period date + average cycle length) and, once you have real logged periods, from the actual pattern in your logs \u2014 shown in Insights and History.' },
        { q: 'What are the cycle phases shown on my dashboard?', a: 'Period, Follicular, Ovulation, and Luteal \u2014 estimated from your cycle length and period length. See the Learn section for what each phase means.' },
        { q: 'How accurate are the ovulation and fertile window estimates?', a: 'They\u2019re statistical estimates, not measurements \u2014 useful for general awareness, not for preventing or achieving pregnancy. See our full disclaimer under Understanding LunaTrack.' },
      ],
    },
    {
      id: 'calendar',
      title: 'Calendar',
      items: [
        { q: 'What do the different colors on the calendar mean?', a: 'Solid pink = a period you logged. Dashed outline = an estimated upcoming period. Light purple = your estimated fertile window. Solid purple = your estimated ovulation day. A ring = today.' },
        { q: 'Why don\u2019t I see any estimated days?', a: 'Estimates only show once you\u2019ve completed cycle setup (Settings \u2192 Cycle setup, or the setup prompt on first login).' },
      ],
    },
    {
      id: 'insights',
      title: 'Insights',
      items: [
        { q: 'Why does Insights say "not enough data yet"?', a: 'Insights are calculated from your real logged periods \u2014 you\u2019ll need at least two logged cycles before averages and charts can be shown.' },
        { q: 'Where does "most frequent symptom" come from?', a: 'It\u2019s a count of every symptom you\u2019ve selected across all your daily logs, most-logged first.' },
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      items: [
        { q: 'What triggers a notification?', a: 'Saving a log, adding a note, and a few other in-app actions create a notification so you have a running record of what you\u2019ve done.' },
        { q: 'How do I mark notifications as read?', a: 'Opening the notification panel (the bell icon) automatically marks everything currently shown as read after a moment, or use "Mark all read".' },
        { q: 'Can I turn notifications off?', a: 'Settings \u2192 Preferences has separate toggles for general notifications and period reminders.' },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      items: [
        { q: 'Where is my data stored?', a: 'In your own Supabase project\u2019s Postgres database, protected by Row Level Security \u2014 policies that mean only your signed-in account can ever read or write your rows.' },
        { q: 'Can I export my data?', a: 'Yes \u2014 Settings \u2192 Privacy \u2192 Export downloads a JSON file of your profile, cycle data, insights, and notes.' },
        { q: 'How do I delete my account?', a: 'Settings \u2192 Privacy \u2192 Delete. This permanently removes your account and every row associated with it \u2014 it cannot be undone.' },
      ],
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      items: [
        { q: 'The app is stuck on "Loading your account..."', a: 'This means the sign-in check is taking a while. A "Taking longer than expected?" link appears after a couple of seconds \u2014 use it to go back to the login page and try again.' },
        { q: 'My data isn\u2019t showing up after I logged something', a: 'Try refreshing the page. If it still doesn\u2019t appear, check your internet connection \u2014 saves require a connection to your Supabase project.' },
        { q: 'Dark mode looks inconsistent somewhere', a: 'Let us know which page/section \u2014 dark mode is applied app-wide via a single theme setting, so an inconsistency usually points to a specific component worth fixing.' },
      ],
    },
  ];

  function renderChips() {
    const wrap = document.getElementById('helpCategoryChips');
    wrap.innerHTML = '<button class="chat-suggestion-chip is-active-chip" data-cat="all">All</button>' +
      CATEGORIES.map(function (c) { return '<button class="chat-suggestion-chip" data-cat="' + c.id + '">' + c.title + '</button>'; }).join('');

    wrap.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        wrap.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active-chip'); });
        btn.classList.add('is-active-chip');
        const cat = btn.dataset.cat;
        document.querySelectorAll('.help-section').forEach(function (sec) {
          sec.style.display = (cat === 'all' || sec.dataset.cat === cat) ? '' : 'none';
        });
        document.getElementById('helpSearch').value = '';
      });
    });
  }

  function renderSections() {
    const container = document.getElementById('helpSections');
    container.innerHTML = CATEGORIES.map(function (cat) {
      const items = cat.items.map(function (item) {
        return '<details class="help-item"><summary>' + item.q + '</summary><p>' + item.a + '</p></details>';
      }).join('');
      return '<div class="app-card help-section" data-cat="' + cat.id + '" style="margin-bottom:var(--sp-5)" data-reveal>'
        + '<h2 class="help-section-title">' + cat.title + '</h2>' + items + '</div>';
    }).join('');
    LunaApp.initScrollReveal();
  }

  function initSearch() {
    const input = document.getElementById('helpSearch');
    const noResults = document.getElementById('helpNoResults');
    input.addEventListener('input', function () {
      const q = input.value.trim().toLowerCase();
      let anyVisible = false;

      document.querySelectorAll('.help-section').forEach(function (sec) {
        let sectionHasMatch = false;
        sec.querySelectorAll('.help-item').forEach(function (item) {
          const text = item.textContent.toLowerCase();
          const match = !q || text.indexOf(q) !== -1;
          item.style.display = match ? '' : 'none';
          if (match) sectionHasMatch = true;
          if (q && match) item.open = true;
        });
        sec.style.display = sectionHasMatch ? '' : 'none';
        if (sectionHasMatch) anyVisible = true;
      });

      noResults.style.display = anyVisible ? 'none' : 'block';

      if (!q) {
        document.getElementById('helpCategoryChips').querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active-chip'); });
        document.getElementById('helpCategoryChips').querySelector('[data-cat="all"]').classList.add('is-active-chip');
      }
    });
  }

  function init() {
    renderChips();
    renderSections();
    initSearch();
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
