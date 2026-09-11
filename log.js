/* ==========================================================================
   LunaTrack App — log.js
   Powers log.html: period/symptoms/mood/energy/sleep selection + notes,
   saved to localStorage.
   ========================================================================== */

(function () {
  const { storage, showToast, dateKey, TODAY } = LunaApp;

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
  function applySelection(container, selector, value) {
    if (!container || !value) return;
    const btn = container.querySelector(`${selector}[data-value="${value}"]`);
    if (btn) btn.classList.add('is-selected');
  }

  function addActivity(text) {
    const extra = storage.get('activity-extra', []);
    extra.unshift({ when: 'Just now', text });
    storage.set('activity-extra', extra.slice(0, 10));
  }

  function init() {
    const periodGroup = document.getElementById('logPeriod');
    const symptomGroup = document.getElementById('logSymptoms');
    const moodGroup = document.getElementById('logMood');
    const energyGroup = document.getElementById('logEnergy');
    const sleepGroup = document.getElementById('logSleep');
    const notesField = document.getElementById('logNotes');
    const saveBtn = document.getElementById('saveLogBtn');

    wireSingleSelect(periodGroup, '.pill');
    wireMultiSelect(symptomGroup, '.pill');
    wireSingleSelect(moodGroup, '.pill');
    wireSingleSelect(energyGroup, 'button');
    wireSingleSelect(sleepGroup, 'button');

    const key = 'log-' + dateKey(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    const saved = storage.get(key, null);
    if (saved) {
      applySelection(periodGroup, '.pill', saved.period);
      (saved.symptoms || []).forEach((s) => applySelection(symptomGroup, '.pill', s));
      applySelection(moodGroup, '.pill', saved.mood);
      applySelection(energyGroup, 'button', saved.energy);
      applySelection(sleepGroup, 'button', saved.sleep);
      if (notesField && saved.notes) notesField.value = saved.notes;
    }

    saveBtn.addEventListener('click', () => {
      const entry = {
        period: getSelectedValue(periodGroup, '.pill'),
        symptoms: getSelectedValues(symptomGroup, '.pill'),
        mood: getSelectedValue(moodGroup, '.pill'),
        energy: getSelectedValue(energyGroup, 'button'),
        sleep: getSelectedValue(sleepGroup, 'button'),
        notes: notesField ? notesField.value.trim() : '',
        savedAt: new Date().toISOString(),
      };
      storage.set(key, entry);
      showToast("Today's log saved");
      addActivity("Today's log saved");
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
