/* ==========================================================================
   LunaTrack App — onboarding.js
   Powers onboarding.html: a 4-step wizard (About You / Lifestyle / Cycle
   Experience / Wellness focus) that personalizes the account created via
   login.html. Reuses LunaApp/LunaAuth/LunaSupabase — same auth + database
   setup as the rest of the app. Nothing here is required to use LunaTrack;
   every field past the name is optional and can be skipped or edited later
   from Settings.
   ========================================================================== */

(function () {
  const TOTAL_STEPS = 4;
  let currentStep = 1;
  const isEditMode = new URLSearchParams(window.location.search).get('edit') === '1';

  const OPTIONS = {
    foods: ['Pizza', 'Pasta', 'Sushi', 'Salads', 'Rice bowls', 'Grilled chicken', 'Soups', 'Sandwiches', 'Tacos', 'Curry', 'Noodles', 'Seafood'],
    cravings: ['Chocolate', 'Sweets', 'Salty snacks', 'Carbs / bread', 'Ice cream', 'Fried food', 'Cheese', 'Fruit', 'Nothing in particular'],
    fruits: ['Bananas', 'Berries', 'Apples', 'Oranges', 'Mango', 'Grapes', 'Watermelon', 'Pineapple', 'Avocado'],
    avoid: ['Dairy', 'Gluten', 'Spicy food', 'Caffeine', 'Red meat', 'Processed sugar', 'Fried food', 'Alcohol', 'None'],
    water: ['Less than 4 cups', '4\u20136 cups', '6\u20138 cups', '8+ cups'],
    activity: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'],
    symptoms: ['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Backache', 'Tenderness', 'Nausea', 'Acne', 'Insomnia'],
    cramp: ['None', 'Mild', 'Moderate', 'Severe'],
    moods: ['Happy', 'Calm', 'Anxious', 'Irritable', 'Sad', 'Sensitive', 'Energetic', 'Low'],
    energy: ['Low', 'Normal', 'High', 'Varies a lot'],
    wellness: ['Period reminders', 'Daily check-ins', 'Hydration', 'Nutrition', 'Mood', 'Cramps', 'Sugar tracking', 'Wellness tips'],
  };

  const state = {
    name: '', age: '', dob: '',
    favoriteFoods: [], periodCravings: [], favoriteFruits: [], avoidFoods: [], waterIntake: '', activityLevel: '',
    symptoms: [], crampLevel: '', moods: [], energyLevel: '', cravings: [],
    wellnessFocus: [],
  };

  function esc(str) {
    return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hydrateStateFromProfile() {
    const u = LunaApp.data.user;
    state.name = u.name || '';
    state.age = u.age != null ? String(u.age) : '';
    state.dob = u.dateOfBirth || '';
    const l = u.lifestyle || {};
    state.favoriteFoods = (l.favoriteFoods || []).slice();
    state.periodCravings = (l.periodCravings || []).slice();
    state.favoriteFruits = (l.favoriteFruits || []).slice();
    state.avoidFoods = (l.avoidFoods || []).slice();
    state.waterIntake = l.waterIntake || '';
    state.activityLevel = l.activityLevel || '';
    const c = u.cycleExperience || {};
    state.symptoms = (c.symptoms || []).slice();
    state.crampLevel = c.crampLevel || '';
    state.moods = (c.moods || []).slice();
    state.energyLevel = c.energyLevel || '';
    state.cravings = (c.cravings || []).slice();
    state.wellnessFocus = (u.wellnessFocus || []).slice();
  }

  /* ---- Chip group builder — reuses .pill / .pill-group, no new CSS needed ---- */
  function chips(field, options, multi) {
    const selected = state[field];
    const isSel = function (opt) { return multi ? selected.indexOf(opt) !== -1 : selected === opt; };
    return '<div class="pill-group" data-field="' + field + '" data-multi="' + (multi ? '1' : '0') + '">'
      + options.map(function (opt) {
          return '<button type="button" class="pill' + (isSel(opt) ? ' is-selected' : '') + '" data-value="' + esc(opt) + '">' + opt + '</button>';
        }).join('')
      + '</div>';
  }

  function fieldBlock(label, optional, innerHTML) {
    return '<div class="form-field"><span class="field-label">' + label + (optional ? ' <span class="ob-optional">(optional)</span>' : '') + '</span>' + innerHTML + '</div>';
  }

  /* ---- Step templates ---- */
  function stepHTML(step) {
    if (step === 1) {
      return ''
        + '<div class="ob-step" data-step="1">'
        + '<div class="ob-eyebrow">Step 1 of ' + TOTAL_STEPS + '</div>'
        + '<h2 class="ob-title">' + (isEditMode ? 'Edit your profile' : 'Welcome to LunaTrack') + '</h2>'
        + '<p class="ob-sub">' + (isEditMode ? "Update your basics any time \u2014 it only takes a minute." : "Let's get to know you a little \u2014 this helps us personalize your experience.") + '</p>'
        + '<div class="ob-avatar-row">'
        + '<div class="ob-avatar-wrap" id="obAvatarWrap">' + LunaApp.avatarHTML(96) + '</div>'
        + '<button type="button" class="ob-avatar-edit" id="obAvatarBtn" aria-label="Change profile picture">' + LunaApp.icon('edit', 13) + '</button>'
        + '<input type="file" id="obAvatarInput" accept="image/*" hidden>'
        + '</div>'
        + '<div class="form-field"><label for="obName">What should we call you?</label><input type="text" id="obName" placeholder="Your name" value="' + esc(state.name) + '"></div>'
        + '<div class="ob-row-2">'
        + '<div class="form-field"><label for="obAge">Age <span class="ob-optional">(optional)</span></label><input type="number" id="obAge" min="8" max="100" inputmode="numeric" placeholder="e.g. 27" value="' + esc(state.age) + '"></div>'
        + '<div class="form-field"><label for="obDob">Date of birth <span class="ob-optional">(optional)</span></label><input type="date" id="obDob" value="' + esc(state.dob) + '"></div>'
        + '</div>'
        + '</div>';
    }
    if (step === 2) {
      return ''
        + '<div class="ob-step" data-step="2">'
        + '<div class="ob-eyebrow">Step 2 of ' + TOTAL_STEPS + '</div>'
        + '<h2 class="ob-title">Lifestyle &amp; preferences</h2>'
        + '<p class="ob-sub">A few food and activity preferences \u2014 pick whatever fits, skip the rest.</p>'
        + fieldBlock('Favorite foods', true, chips('favoriteFoods', OPTIONS.foods, true))
        + fieldBlock('What do you usually crave during your period?', true, chips('periodCravings', OPTIONS.cravings, true))
        + fieldBlock('Favorite fruits', true, chips('favoriteFruits', OPTIONS.fruits, true))
        + fieldBlock('Foods you prefer to avoid', true, chips('avoidFoods', OPTIONS.avoid, true))
        + fieldBlock('Typical water intake', true, chips('waterIntake', OPTIONS.water, false))
        + fieldBlock('Activity level', true, chips('activityLevel', OPTIONS.activity, false))
        + '</div>';
    }
    if (step === 3) {
      return ''
        + '<div class="ob-step" data-step="3">'
        + '<div class="ob-eyebrow">Step 3 of ' + TOTAL_STEPS + '</div>'
        + '<h2 class="ob-title">Your cycle experience</h2>'
        + '<p class="ob-hint">Totally optional \u2014 skip anything that doesn\u2019t apply to you.</p>'
        + fieldBlock('Common period symptoms', true, chips('symptoms', OPTIONS.symptoms, true))
        + fieldBlock('Typical cramps / pain level', true, chips('crampLevel', OPTIONS.cramp, false))
        + fieldBlock('Common moods', true, chips('moods', OPTIONS.moods, true))
        + fieldBlock('Energy level during your period', true, chips('energyLevel', OPTIONS.energy, false))
        + fieldBlock('Common cravings', true, chips('cravings', OPTIONS.cravings, true))
        + '</div>';
    }
    return ''
      + '<div class="ob-step" data-step="4">'
      + '<div class="ob-eyebrow">Step 4 of ' + TOTAL_STEPS + '</div>'
      + '<h2 class="ob-title">What should we focus on?</h2>'
      + '<p class="ob-sub">Pick as many as you\u2019d like \u2014 you can always change these later in Settings.</p>'
      + fieldBlock('LunaTrack should help with\u2026', false, chips('wellnessFocus', OPTIONS.wellness, true))
      + '</div>';
  }

  /* ---- Wiring ---- */
  function wireChips(root) {
    root.querySelectorAll('[data-field]').forEach(function (group) {
      const field = group.dataset.field;
      const multi = group.dataset.multi === '1';
      group.querySelectorAll('.pill').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const val = btn.dataset.value;
          if (multi) {
            const arr = state[field];
            const idx = arr.indexOf(val);
            if (idx === -1) arr.push(val); else arr.splice(idx, 1);
            btn.classList.toggle('is-selected');
          } else {
            const already = btn.classList.contains('is-selected');
            group.querySelectorAll('.pill').forEach(function (b) { b.classList.remove('is-selected'); });
            state[field] = already ? '' : val;
            if (!already) btn.classList.add('is-selected');
          }
        });
      });
    });
  }

  function wireStep1() {
    const fileInput = document.getElementById('obAvatarInput');
    const btn = document.getElementById('obAvatarBtn');
    if (btn && fileInput) {
      btn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', async function () {
        const file = fileInput.files[0];
        if (!file) return;
        LunaApp.showToast('Uploading photo\u2026');
        const result = await LunaApp.uploadAvatar(file);
        if (result.error) { LunaApp.showToast(result.error); return; }
        const wrap = document.getElementById('obAvatarWrap');
        if (wrap) wrap.innerHTML = LunaApp.avatarHTML(96);
        LunaApp.showToast('Profile photo updated');
      });
    }
    const nameInput = document.getElementById('obName');
    if (nameInput) {
      nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') document.getElementById('obNextBtn').click(); });
    }
  }

  function render() {
    const body = document.getElementById('obStepBody');
    body.innerHTML = stepHTML(currentStep);
    wireChips(body);
    if (currentStep === 1) wireStep1();
    updateProgress();
    updateNav();
  }

  function updateProgress() {
    document.querySelectorAll('.op-step').forEach(function (el) {
      const n = Number(el.dataset.step);
      el.classList.toggle('is-active', n === currentStep);
      el.classList.toggle('is-done', n < currentStep);
    });
    document.querySelectorAll('.op-line').forEach(function (line, idx) {
      line.classList.toggle('is-filled', idx < currentStep - 1);
    });
  }

  function updateNav() {
    document.getElementById('obBackBtn').style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    document.getElementById('obSkipBtn').style.display = currentStep === 1 ? 'none' : 'inline-flex';
    document.getElementById('obNextBtn').textContent = currentStep === TOTAL_STEPS ? 'Finish' : 'Continue';
  }

  /* ---- Saving — same auth/database setup as the rest of the app ---- */
  async function saveStep1() {
    const user = await LunaAuth.getUser();
    if (!user) return;
    await LunaApp.saveProfileName(state.name);
    const payload = {
      age: state.age ? parseInt(state.age, 10) : null,
      date_of_birth: state.dob || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await LunaSupabase.client.from('profiles').update(payload).eq('id', user.id);
    if (error) { LunaApp.showToast('Could not save \u2014 try again'); return false; }
    LunaApp.data.user.age = payload.age;
    LunaApp.data.user.dateOfBirth = payload.date_of_birth;
    return true;
  }

  async function saveStep2() {
    const user = await LunaAuth.getUser();
    if (!user) return;
    const lifestyle = {
      favoriteFoods: state.favoriteFoods, periodCravings: state.periodCravings,
      favoriteFruits: state.favoriteFruits, avoidFoods: state.avoidFoods,
      waterIntake: state.waterIntake, activityLevel: state.activityLevel,
    };
    const { error } = await LunaSupabase.client.from('profiles').update({ lifestyle: lifestyle, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (error) { LunaApp.showToast('Could not save \u2014 try again'); return false; }
    LunaApp.data.user.lifestyle = lifestyle;
    return true;
  }

  async function saveStep3() {
    const user = await LunaAuth.getUser();
    if (!user) return;
    const cycleExperience = {
      symptoms: state.symptoms, crampLevel: state.crampLevel,
      moods: state.moods, energyLevel: state.energyLevel, cravings: state.cravings,
    };
    const { error } = await LunaSupabase.client.from('profiles').update({ cycle_experience: cycleExperience, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (error) { LunaApp.showToast('Could not save \u2014 try again'); return false; }
    LunaApp.data.user.cycleExperience = cycleExperience;
    return true;
  }

  async function finishOnboarding() {
    const btn = document.getElementById('obNextBtn');
    btn.disabled = true; btn.textContent = 'Saving\u2026';
    const user = await LunaAuth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }
    const { error } = await LunaSupabase.client.from('profiles').update({
      wellness_focus: state.wellnessFocus,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (error) {
      btn.disabled = false; btn.textContent = 'Finish';
      LunaApp.showToast('Could not save \u2014 try again');
      return;
    }
    LunaApp.data.user.wellnessFocus = state.wellnessFocus;
    LunaApp.data.user.onboardingCompleted = true;
    LunaApp.showToast(isEditMode ? 'Profile updated' : "You're all set!");
    setTimeout(function () { window.location.href = isEditMode ? 'settings.html' : 'dashboard.html'; }, 700);
  }

  async function advance() {
    const nextBtn = document.getElementById('obNextBtn');
    if (currentStep === 1) {
      const nameInput = document.getElementById('obName');
      const name = nameInput.value.trim();
      if (!name) { LunaApp.showToast("Let's start with your name"); nameInput.focus(); return; }
      state.name = name;
      state.age = document.getElementById('obAge').value.trim();
      state.dob = document.getElementById('obDob').value;
      nextBtn.disabled = true;
      const ok = await saveStep1();
      nextBtn.disabled = false;
      if (!ok) return;
    } else if (currentStep === 2) {
      nextBtn.disabled = true;
      const ok = await saveStep2();
      nextBtn.disabled = false;
      if (!ok) return;
    } else if (currentStep === 3) {
      nextBtn.disabled = true;
      const ok = await saveStep3();
      nextBtn.disabled = false;
      if (!ok) return;
    } else {
      await finishOnboarding();
      return;
    }
    currentStep++;
    render();
  }

  function wireNav() {
    document.getElementById('obNextBtn').addEventListener('click', advance);
    document.getElementById('obSkipBtn').addEventListener('click', advance);
    document.getElementById('obBackBtn').addEventListener('click', function () {
      if (currentStep === 1) return;
      currentStep--;
      render();
    });
  }

  function init() {
    if (LunaApp.data.user.onboardingCompleted && !isEditMode) {
      window.location.href = 'dashboard.html';
      return;
    }
    hydrateStateFromProfile();
    wireNav();
    render();
  }

  document.addEventListener('lunatrack:data-ready', init);
})();
