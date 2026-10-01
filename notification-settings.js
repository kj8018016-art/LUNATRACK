/* ==========================================================================
   LunaTrack App — notification-settings.js
   Powers notification-settings.html: per-type on/off + preferred time,
   saved to notification_preferences (one row per user per type). Missing
   rows just mean "using the default" — nothing is written until the user
   actually changes something, so a brand-new account has sensible defaults
   without needing 7 rows pre-seeded on signup.
   ========================================================================== */

(function () {
  const DEFAULT_TIME = { daily_checkin: '20:00', hydration: '14:00', mood_check: '18:00' };

  function syncTimeRowVisibility(type, enabled) {
    const row = document.querySelector('.np-time-row[data-time-for="' + type + '"]');
    if (row) row.style.display = enabled ? '' : 'none';
  }

  async function loadPrefs(userId) {
    const { data: rows, error } = await LunaSupabase.client.from('notification_preferences').select('type, enabled, preferred_time').eq('user_id', userId);
    if (error) { LunaApp.showToast('Could not load preferences'); return {}; }
    const byType = {};
    (rows || []).forEach(function (r) { byType[r.type] = r; });
    return byType;
  }

  async function saveField(userId, type, field, value) {
    const payload = { user_id: userId, type: type, updated_at: new Date().toISOString() };
    payload[field] = value;
    const { error } = await LunaSupabase.client.from('notification_preferences').upsert(payload, { onConflict: 'user_id,type' });
    if (error) { LunaApp.showToast('Could not save preference'); return false; }
    return true;
  }

  /** Saves the IANA timezone once so preferred times can be interpreted correctly later — quiet, no toast, not user-initiated. */
  async function ensureTimezoneSaved(userId) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      await LunaSupabase.client.from('preferences').upsert({ user_id: userId, timezone: tz, updated_at: new Date().toISOString() });
    } catch (e) { /* Intl not available or write failed — not critical, just skip */ }
  }

  async function init() {
    const user = await LunaAuth.getUser();
    if (!user) return;

    ensureTimezoneSaved(user.id);
    const prefs = await loadPrefs(user.id);

    document.querySelectorAll('.np-toggle').forEach(function (toggle) {
      const type = toggle.dataset.type;
      const row = prefs[type];
      const enabled = row ? row.enabled : true;
      toggle.checked = enabled;
      syncTimeRowVisibility(type, enabled);

      toggle.addEventListener('change', async function () {
        syncTimeRowVisibility(type, toggle.checked);
        const ok = await saveField(user.id, type, 'enabled', toggle.checked);
        if (ok) LunaApp.showToast('Preferences saved');
      });
    });

    document.querySelectorAll('.np-time').forEach(function (input) {
      const type = input.dataset.type;
      const row = prefs[type];
      input.value = (row && row.preferred_time) ? row.preferred_time.slice(0, 5) : DEFAULT_TIME[type];

      input.addEventListener('change', async function () {
        if (!input.value) return;
        const ok = await saveField(user.id, type, 'preferred_time', input.value);
        if (ok) LunaApp.showToast('Reminder time saved');
      });
    });
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
