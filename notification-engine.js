/* ==========================================================================
   LunaTrack — notification-engine.js
   Decides WHICH reminders to create and inserts them — the "intelligence"
   from the notification center (section 5/6 of the spec). This runs once
   per page load for a signed-in user (wired from app.js's init), which is
   enough to populate a real, working notification center during normal use.
   It is NOT a background scheduler: it can only create a notification while
   someone has the app open. True background delivery (server-side, works
   even when the app is closed) is explicitly deferred to a later step.

   Every insert carries a `dedupe_key` (unique per user+key via a DB index),
   so re-running this on every page load is safe — a repeat insert for a key
   already used today simply fails quietly, never creating a duplicate.
   ========================================================================== */

const LunaNotificationEngine = (() => {
  const MS_DAY = 86400000;

  // Fallback for any type with no saved preference row yet.
  const DEFAULTS = {
    daily_checkin:      { enabled: true, time: '20:00' },
    missed_checkin:     { enabled: true, time: null },
    mood_check:         { enabled: true, time: '18:00' },
    hydration:          { enabled: true, time: '14:00' },
    period_reminder:    { enabled: true, time: null },
    ovulation_reminder: { enabled: true, time: null },
    wellness_tips:      { enabled: true, time: null },
  };

  function firstName(fullName) {
    return fullName ? fullName.trim().split(/\s+/)[0] : '';
  }

  async function loadPrefs(userId) {
    const { data: rows, error } = await LunaSupabase.client.from('notification_preferences').select('type, enabled, preferred_time').eq('user_id', userId);
    if (error) { console.warn('LunaTrack: could not load notification preferences.', error.message); return null; }
    const prefs = {};
    Object.keys(DEFAULTS).forEach(function (type) {
      const row = (rows || []).find(function (r) { return r.type === type; });
      prefs[type] = {
        enabled: row ? row.enabled : DEFAULTS[type].enabled,
        time: row && row.preferred_time ? row.preferred_time.slice(0, 5) : DEFAULTS[type].time,
      };
    });
    return prefs;
  }

  /** True once local wall-clock time has passed the preferred time (or there is no specific time to wait for). */
  function isDue(timeStr) {
    if (!timeStr) return true;
    const parts = timeStr.split(':');
    const h = Number(parts[0]), m = Number(parts[1]);
    const now = new Date();
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
  }

  function todayKey(type, app) {
    return type + ':' + app.isoDate(app.TODAY);
  }

  /** Inserts a notification unless one with this exact dedupe_key already exists for the user (DB-enforced, so this is safe to call every page load). */
  async function insertOnce(userId, type, title, body, dedupeKey) {
    const { error } = await LunaSupabase.client.from('notifications').insert({
      user_id: userId, type: type, title: title, body: body, read: false, dedupe_key: dedupeKey,
    });
    if (error && error.code !== '23505') { // 23505 = unique_violation, i.e. "already sent today" — expected, not a failure
      console.warn('LunaTrack: could not create notification.', error.message);
    }
    return !error;
  }

  async function run() {
    const app = window.LunaApp;
    if (!app || !app.data || !app.data.user || !app.data.user.id) return;
    const userId = app.data.user.id;

    const prefs = await loadPrefs(userId);
    if (!prefs) return;

    const name = firstName(app.data.user.name);
    const hey = name ? ('Hey ' + name + ' ') : 'Hey ';
    let createdAny = false;

    // ---- Daily check-in vs. missed check-in — never both, and only one per day ----
    const todayLog = await app.loadTodayLog();
    const checkedIn = Boolean(todayLog && (todayLog.mood || todayLog.energy || todayLog.cramp_level));
    if (!checkedIn) {
      if (prefs.daily_checkin.enabled && isDue(prefs.daily_checkin.time)) {
        const ok = await insertOnce(userId, 'daily_checkin', 'Daily Check-in',
          hey + '\ud83c\udf38 How are you feeling today? Take a few seconds to update your LunaTrack.', todayKey('daily_checkin', app));
        createdAny = createdAny || ok;
      } else if (prefs.missed_checkin.enabled && isDue('21:30')) {
        const ok = await insertOnce(userId, 'missed_checkin', 'Missed Check-in',
          (name || 'Hey') + ', looks like today\u2019s check-in is still open \u2014 no pressure, just a gentle nudge whenever you\u2019re ready \ud83c\udf19', todayKey('missed_checkin', app));
        createdAny = createdAny || ok;
      }
    }

    // ---- Mood check ----
    if (prefs.mood_check.enabled && isDue(prefs.mood_check.time) && !(todayLog && todayLog.mood)) {
      const ok = await insertOnce(userId, 'mood_check', 'Mood Check',
        hey + '\ud83d\udc97 How are you feeling today?', todayKey('mood_check', app));
      createdAny = createdAny || ok;
    }

    // ---- Hydration ----
    if (prefs.hydration.enabled && isDue(prefs.hydration.time) && !(todayLog && todayLog.water_intake)) {
      const ok = await insertOnce(userId, 'hydration', 'Hydration',
        (name ? (name + ', remember') : 'Remember') + ' to take a little water break \ud83d\udca7', todayKey('hydration', app));
      createdAny = createdAny || ok;
    }

    // ---- Period / ovulation reminders — only meaningful once cycle setup exists ----
    if (app.data.currentCycle.hasSetup) {
      const cd = app.getCycleDates();
      if (cd) {
        const daysUntilPeriod = app.data.currentCycle.daysUntilNext;
        if (prefs.period_reminder.enabled && daysUntilPeriod != null && daysUntilPeriod >= 0 && daysUntilPeriod <= 3) {
          const ok = await insertOnce(userId, 'period_reminder', 'Period Reminder',
            hey + '\ud83c\udf37 your period may be approaching based on your cycle history.', todayKey('period_reminder', app));
          createdAny = createdAny || ok;
        }
        const daysUntilOvulation = Math.round((cd.ovulation - app.TODAY) / MS_DAY);
        if (prefs.ovulation_reminder.enabled && daysUntilOvulation != null && daysUntilOvulation >= 0 && daysUntilOvulation <= 1) {
          const ok = await insertOnce(userId, 'ovulation_reminder', 'Ovulation Window',
            hey + '\ud83c\udf3c you\u2019re entering your predicted ovulation window.', todayKey('ovulation_reminder', app));
          createdAny = createdAny || ok;
        }
      }
    }

    // ---- Wellness tip — at most a couple of times a week, not daily ----
    if (prefs.wellness_tips.enabled && isDue('10:00') && window.LunaWellnessTips) {
      const dayOfYear = Math.floor((app.TODAY - new Date(app.TODAY.getFullYear(), 0, 0)) / MS_DAY);
      if (dayOfYear % 3 === 0) {
        const tip = LunaWellnessTips.getTodaysTip();
        const ok = await insertOnce(userId, 'wellness_tips', 'Wellness Tip',
          hey + tip.emoji + ' today\u2019s wellness tip is ready for you: ' + tip.text, todayKey('wellness_tips', app));
        createdAny = createdAny || ok;
      }
    }

    if (createdAny && typeof app.refreshNotifications === 'function') {
      app.refreshNotifications();
    }
  }

  return { run: run };
})();
