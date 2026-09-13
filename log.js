/* ==========================================================================
   LunaTrack App — log.js
   Powers log.html: period/symptoms/mood/energy/sleep selection + notes,
   saved to Supabase (daily_logs, one row per user per day).
   ========================================================================== */

(function () {
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

  async function init() {
    const periodGroup = document.getElementById('logPeriod');
    const symptomGroup = document.getElementById('logSymptoms');
    const moodGroup = document.getElementById('logMood');
    const energyGroup = document.getElementById('logEnergy');
    const sleepGroup = document.getElementById('logSleep');
    const notesField = document.getElementById('logNotes');
    const saveBtn = document.getElementById('saveLogBtn');
    const dateLabel = document.getElementById('logDateLabel');

    if (dateLabel) dateLabel.textContent = LunaApp.TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    wireSingleSelect(periodGroup, '.pill');
    wireMultiSelect(symptomGroup, '.pill');
    wireSingleSelect(moodGroup, '.pill');
    wireSingleSelect(energyGroup, 'button');
    wireSingleSelect(sleepGroup, 'button');

    const existing = await LunaApp.loadTodayLog();
    if (existing) {
      applySelection(periodGroup, '.pill', existing.period_flow);
      (existing.symptoms || []).forEach(function (s) { applySelection(symptomGroup, '.pill', s); });
      applySelection(moodGroup, '.pill', existing.mood);
      applySelection(energyGroup, 'button', existing.energy);
      applySelection(sleepGroup, 'button', existing.sleep);
      if (notesField && existing.notes) notesField.value = existing.notes;
      saveBtn.textContent = "Update Today's Log";
    }

    saveBtn.addEventListener('click', async function () {
      const entry = {
        period: getSelectedValue(periodGroup, '.pill'),
        symptoms: getSelectedValues(symptomGroup, '.pill'),
        mood: getSelectedValue(moodGroup, '.pill'),
        energy: getSelectedValue(energyGroup, 'button'),
        sleep: getSelectedValue(sleepGroup, 'button'),
        notes: notesField ? notesField.value.trim() : '',
      };
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving\u2026';
      const result = await LunaApp.saveDailyLog(entry);
      saveBtn.disabled = false;
      if (result.error) {
        saveBtn.textContent = "Save Today's Log";
        LunaApp.showToast('Could not save your log \u2014 try again');
        return;
      }
      saveBtn.textContent = "Update Today's Log";
      LunaApp.showToast("Today's log saved");
    });
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
