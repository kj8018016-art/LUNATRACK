/* ==========================================================================
   LunaTrack App — notifications.js
   Powers notifications.html: the full notification center (the dropdown
   only shows the latest 8). Reuses LunaApp.notifItemHTML so a notification
   looks identical here and in the bell dropdown, and keeps the bell's badge
   in sync via LunaApp.renderNotifPanel() after any read/unread change.
   ========================================================================== */

(function () {
  function render() {
    const list = document.getElementById('nfList');
    const notifs = LunaApp.data.notifications || [];
    const unread = notifs.filter(function (n) { return !n.read; }).length;

    const countEl = document.getElementById('nfCount');
    countEl.hidden = unread === 0;
    countEl.textContent = unread + ' new';

    const clearBtn = document.getElementById('nfClearAll');
    clearBtn.disabled = unread === 0;

    list.innerHTML = notifs.length
      ? notifs.map(LunaApp.notifItemHTML).join('')
      : '<div class="notif-empty">\ud83c\udf38 Nothing here yet \u2014 reminders will show up as they happen.</div>';
  }

  async function init() {
    LunaApp.data.notifications = await LunaApp.loadNotifications(100); // full history here, not just the dropdown's latest 8
    render();

    document.getElementById('nfList').addEventListener('click', async function (e) {
      const item = e.target.closest('.notif-item');
      if (!item) return;
      await LunaApp.markNotificationRead(item.getAttribute('data-id'));
      render();
      LunaApp.renderNotifPanel();
      const href = item.getAttribute('data-href');
      if (href) window.location.href = href;
    });

    document.getElementById('nfClearAll').addEventListener('click', async function () {
      await LunaApp.markAllNotificationsRead();
      render();
      LunaApp.renderNotifPanel();
    });
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
