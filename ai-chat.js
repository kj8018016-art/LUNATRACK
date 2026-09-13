/* ==========================================================================
   LunaTrack App — ai-chat.js
   Powers ai-chat.html. This is a scripted preview, not a live model — it
   answers from LunaApp.data (the user's real logged data) using keyword
   matching. Swapping in a real model later means replacing getReply()
   with an API call; the UI/conversation state stays the same.
   ========================================================================== */

(function () {
  let data, cc, ins;

  const messagesEl = document.getElementById('chatMessages');
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

  function renderMessage(role, text) {
    const row = document.createElement('div');
    row.className = 'chat-row from-' + role;
    row.innerHTML = '<span class="chat-avatar-sm">' + (role === 'ai' ? 'AI' : (data.user.initials || '?')) + '</span><span class="chat-bubble"></span>';
    row.querySelector('.chat-bubble').textContent = text;
    messagesEl.appendChild(row);
    scrollToBottom();
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'chat-row from-ai chat-typing-row';
    row.id = 'chatTypingRow';
    row.innerHTML = '<span class="chat-avatar-sm">AI</span><span class="chat-bubble"><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span></span>';
    messagesEl.appendChild(row);
    scrollToBottom();
  }

  function hideTyping() {
    const row = document.getElementById('chatTypingRow');
    if (row) row.remove();
  }

  function getReply(message) {
    const m = message.toLowerCase();

    if (/(period|bleed)/.test(m)) {
      if (!cc.hasSetup) return "You haven't set up your cycle yet \u2014 head to your dashboard and tap \"Set up my cycle\" so I can estimate your next period.";
      return 'Your estimated next period starts around ' + cc.nextPeriodDate + " \u2014 that's about " + cc.daysUntilNext + ' days from today. This is estimated from your logged cycles, so it may shift as you log more.';
    }
    if (/(ovulat|fertile)/.test(m)) {
      if (!cc.hasSetup) return "You haven't set up your cycle yet \u2014 add your last period date on the dashboard and I can estimate your fertile window.";
      return "You're estimated to ovulate around " + cc.ovulationDate + ', with a fertile window of ' + cc.fertileWindowLabel + '. This is a prediction based on your logged history, not a guarantee.';
    }
    if (/(symptom|cramp|headache|bloat)/.test(m)) {
      if (!ins.symptomFrequency.length) return "You haven't logged any symptoms yet \u2014 once you do, I can tell you which ones come up most often.";
      const top = ins.symptomFrequency[0];
      return 'Your most frequently logged symptom is ' + top.name.toLowerCase() + ', logged ' + top.count + ' times. You can log symptoms anytime from the Log Today page or the quick actions on your dashboard.';
    }
    if (/(mood|feel)/.test(m)) {
      return "I can't see today's check-in from here yet, but you can log your mood anytime in Today's Check-in on the dashboard \u2014 it takes about 10 seconds.";
    }
    if (/(cycle length|average|how long)/.test(m)) {
      if (!ins.hasEnoughData) return "You've not logged enough cycles yet for an average \u2014 keep logging your period and I'll be able to tell you once you've got a couple of cycles in.";
      return 'Your average cycle length is ' + ins.avgCycleLength + ' days, with cycles ranging from ' + ins.shortestCycle + ' to ' + ins.longestCycle + ' days over the last ' + ins.cyclesLogged + ' cycles you\u2019ve logged.';
    }
    if (/(log|track|add|record)/.test(m)) {
      return 'You can log your period, symptoms, mood, and notes from the Log Today page, or use the quick-action cards at the top of your dashboard for something faster.';
    }
    if (/(calendar|date|day)/.test(m)) {
      return 'Your calendar shows logged period days, your estimated fertile window and ovulation day, and upcoming predictions \u2014 tap any date there for the full breakdown.';
    }
    if (/(hi|hello|hey)/.test(m)) {
      return 'Hey ' + data.user.name + '! Ask me about your period, ovulation, symptoms, or how to use LunaTrack.';
    }
    if (/(thank|thanks)/.test(m)) {
      return 'Anytime! Let me know if anything else comes up.';
    }
    return "I'm still a preview, so I can only help with a few things right now \u2014 try asking about your period, ovulation, symptoms, or cycle length.";
  }

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    renderMessage('user', trimmed);
    inputEl.value = '';
    setInputEnabled(false);

    showTyping();
    const delay = 550 + Math.min(900, trimmed.length * 18);
    setTimeout(function () {
      hideTyping();
      renderMessage('ai', getReply(trimmed));
      setInputEnabled(true);
      inputEl.focus();
    }, delay);
  }

  function setInputEnabled(enabled) {
    inputEl.disabled = !enabled;
    sendBtn.disabled = !enabled;
  }

  function initInput() {
    sendBtn.addEventListener('click', function () { sendMessage(inputEl.value); });
    inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMessage(inputEl.value); });
  }

  function initSuggestions() {
    document.querySelectorAll('.chat-suggestion-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { sendMessage(chip.textContent); });
    });
  }

  function init() {
    data = LunaApp.data;
    cc = data.currentCycle;
    ins = data.insights;

    renderMessage('ai', 'Hi ' + data.user.name + " \ud83d\udc4b I'm your LunaTrack assistant. Ask me about your cycle, symptoms, or how to use the app.");
    initInput();
    initSuggestions();
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
