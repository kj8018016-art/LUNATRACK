/* ==========================================================================
   LunaTrack — wellness-tips-content.js
   Static tip content + personalization logic, shared by the dashboard's
   "Today's Wellness Tip" card and the full wellness.html page. General,
   non-personalized tips are plain wellness suggestions — never medical
   advice, and personalized tips only ever describe a pattern the user has
   logged themselves, never a claim that anything will fix or prevent a
   symptom.
   ========================================================================== */

const LunaWellnessTips = (() => {
  const CATEGORIES = [
    { id: 'hydration', label: 'Hydration', emoji: '\ud83d\udca7' },
    { id: 'nutrition', label: 'Nutrition', emoji: '\ud83c\udf4e' },
    { id: 'period-care', label: 'Period Care', emoji: '\ud83c\udf38' },
    { id: 'cramps', label: 'Cramps & Comfort', emoji: '\ud83e\uddd8' },
    { id: 'sleep', label: 'Sleep', emoji: '\ud83d\ude34' },
    { id: 'activity', label: 'Activity', emoji: '\ud83c\udfc3' },
    { id: 'education', label: 'Cycle Education', emoji: '\ud83e\udded' },
  ];

  const TIPS = [
    { cat: 'hydration', text: 'Remember to drink water regularly throughout the day.' },
    { cat: 'hydration', text: 'Keeping a water bottle nearby can make it easier to sip throughout the day.' },
    { cat: 'hydration', text: 'Herbal teas can be a soothing way to add to your fluid intake.' },
    { cat: 'nutrition', text: 'Include a variety of fruits, vegetables and balanced meals in your diet.' },
    { cat: 'nutrition', text: 'Iron-rich foods like leafy greens and legumes can be worth including, especially during your period.' },
    { cat: 'nutrition', text: 'Balanced snacks with protein and fiber can help keep energy steadier through the day.' },
    { cat: 'period-care', text: 'Changing pads, cups, or tampons regularly helps with comfort and hygiene.' },
    { cat: 'period-care', text: 'Wearing comfortable, breathable clothing can make period days a little easier.' },
    { cat: 'period-care', text: 'It\u2019s okay to slow down on heavier flow days \u2014 listen to what your body needs.' },
    { cat: 'cramps', text: 'Gentle stretching, rest or a warm heating pad may help with period discomfort.' },
    { cat: 'cramps', text: 'A warm bath or shower can be a comforting way to ease tension.' },
    { cat: 'cramps', text: 'Slow, deep breathing for a few minutes may help you relax through a wave of discomfort.' },
    { cat: 'sleep', text: 'Try to maintain a consistent sleep routine, especially when you\u2019re feeling tired.' },
    { cat: 'sleep', text: 'Winding down screen time before bed may help you fall asleep more easily.' },
    { cat: 'sleep', text: 'A cool, dark room can make it easier to get comfortable if sleep isn\u2019t coming easily.' },
    { cat: 'activity', text: 'Light movement like walking or stretching can feel good, even on low-energy days.' },
    { cat: 'activity', text: 'It\u2019s okay to scale back workouts during your period \u2014 gentle movement still counts.' },
    { cat: 'activity', text: 'Regular activity you enjoy is easier to stick with than pushing through discomfort.' },
    { cat: 'education', text: 'Cycle lengths vary from person to person \u2014 there isn\u2019t one "normal" number.' },
    { cat: 'education', text: 'Symptoms can shift from cycle to cycle \u2014 tracking helps you notice your own patterns over time.' },
    { cat: 'education', text: 'The luteal phase (after ovulation, before your period) is when many people notice PMS-type symptoms.' },
  ];

  function categoryFor(id) {
    return CATEGORIES.find(function (c) { return c.id === id; }) || CATEGORIES[0];
  }

  /** Tips based only on patterns the user has actually logged — never a claim that anything will fix or prevent a symptom. */
  function getPersonalizedTips() {
    const app = window.LunaApp;
    if (!app || !app.data) return [];
    const ins = app.data.insights || {};
    const tips = [];

    if (ins.lowWaterFrequent) {
      tips.push({ emoji: '\ud83d\udca7', title: 'Hydration reminder', text: 'You\u2019ve logged lower water intake recently. Try keeping water nearby today.' });
    }
    if (ins.crampsFrequent) {
      tips.push({ emoji: '\ud83c\udf38', title: 'Comfort tip', text: 'You\u2019ve logged cramps recently. Gentle stretching or a warm compress may help with comfort.' });
    }
    if (ins.poorSleepFrequent) {
      tips.push({ emoji: '\ud83d\ude34', title: 'Sleep reminder', text: 'You\u2019ve logged some restless nights recently. A calmer wind-down routine before bed might help.' });
    }
    const activity = app.data.user.lifestyle && app.data.user.lifestyle.activityLevel;
    if (activity === 'Sedentary') {
      tips.push({ emoji: '\ud83c\udfc3', title: 'Gentle movement', text: 'A short walk or some light stretching can be a nice way to add movement to your day.' });
    }
    return tips;
  }

  /** One tip for the day — a personalized one when available, otherwise a rotating general tip. Deterministic per day, not per page load. */
  function getTodaysTip() {
    const dayIndex = Math.floor(Date.now() / 86400000);
    const personalized = getPersonalizedTips();
    if (personalized.length) {
      const p = personalized[dayIndex % personalized.length];
      return { emoji: p.emoji, text: p.text, isPersonalized: true };
    }
    const t = TIPS[dayIndex % TIPS.length];
    return { emoji: categoryFor(t.cat).emoji, text: t.text, isPersonalized: false };
  }

  return { CATEGORIES: CATEGORIES, TIPS: TIPS, categoryFor: categoryFor, getPersonalizedTips: getPersonalizedTips, getTodaysTip: getTodaysTip };
})();
