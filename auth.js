/* ==========================================================================
   LunaTrack — auth.js
   Thin wrapper around Supabase Auth. Every function here is safe to call
   whether or not Supabase is configured — in demo mode (see
   supabase-client.js) they resolve to sensible no-ops so nothing else in
   the app has to branch on "are we live yet?".

   Everything that touches the network is wrapped in try/catch and, for the
   page guard specifically, a hard timeout PLUS a visible manual "Continue"
   link that appears after 2.5s — so a flaky connection, a misconfigured
   project, or a genuine bug can never leave someone stuck on a loading
   screen with no way out.
   ========================================================================== */

const LunaAuth = (() => {

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
  }

  /**
   * The current local session, or null. This reads from localStorage/memory
   * — no network round-trip — so it's fast and can't hang. Prefer this for
   * "is someone logged in" checks like the page guard.
   */
  async function getSession() {
    if (!LunaSupabase.isConfigured) return null;
    try {
      const { data, error } = await LunaSupabase.client.auth.getSession();
      if (error) {
        console.warn('LunaTrack auth: getSession() returned an error.', error.message);
        return null;
      }
      return (data && data.session) || null;
    } catch (e) {
      console.warn('LunaTrack auth: getSession() threw.', e);
      return null;
    }
  }

  /** Current session's user, or null. Resolves immediately to null in demo mode. */
  async function getUser() {
    const session = await getSession();
    return (session && session.user) || null;
  }

  async function signUp(email, password) {
    if (!LunaSupabase.isConfigured) return { error: 'Supabase is not configured yet.' };
    try {
      const { data, error } = await LunaSupabase.client.auth.signUp({ email, password });
      return { user: data && data.user, session: data && data.session, error: error && error.message };
    } catch (e) {
      return { error: (e && e.message) || 'Something went wrong signing up. Check your connection and try again.' };
    }
  }

  async function signIn(email, password) {
    if (!LunaSupabase.isConfigured) return { error: 'Supabase is not configured yet.' };
    try {
      const { data, error } = await LunaSupabase.client.auth.signInWithPassword({ email, password });
      return { user: data && data.user, session: data && data.session, error: error && error.message };
    } catch (e) {
      return { error: (e && e.message) || 'Something went wrong signing in. Check your connection and try again.' };
    }
  }

  /**
   * Redirects the browser to Google's sign-in screen, then back to
   * dashboard.html. Requires the Google provider to be turned on in your
   * Supabase dashboard (Authentication → Providers → Google) with a Google
   * Cloud OAuth Client ID/Secret — see the note on login.html.
   */
  async function signInWithGoogle() {
    if (!LunaSupabase.isConfigured) return { error: 'Supabase is not configured yet.' };
    try {
      const redirectTo = window.location.href.replace(/login\.html.*$/, 'dashboard.html');
      const { error } = await LunaSupabase.client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) return { error: error.message };
      return {}; // browser is navigating to Google now; nothing left to do here
    } catch (e) {
      return { error: (e && e.message) || 'Something went wrong starting Google sign-in.' };
    }
  }

  async function signOut() {
    if (!LunaSupabase.isConfigured) return;
    try {
      await LunaSupabase.client.auth.signOut();
    } catch (e) {
      console.warn('LunaTrack auth: signOut() failed.', e);
    }
  }

  /**
   * Call at the top of every authenticated page (dashboard, calendar, etc.).
   * In demo mode this resolves instantly and does nothing — the app behaves
   * exactly as it does today. Once Supabase is configured, it redirects
   * signed-out visitors to login.html before any page content is shown.
   *
   * Two independent safety nets so this can never hang indefinitely:
   *  - a 4s hard timeout on the session check itself
   *  - a "Taking longer than expected?" link that appears after 2.5s,
   *    letting you jump to login.html manually at any point
   */
  async function requireAuth() {
    if (!LunaSupabase.isConfigured) return true;

    const guard = document.getElementById('authGuardOverlay');
    const escapeHatch = document.getElementById('authGuardEscape');
    if (guard) { guard.hidden = false; guard.style.display = 'flex'; }

    const escapeTimer = setTimeout(() => {
      if (escapeHatch) escapeHatch.hidden = false;
    }, 2500);

    console.info('LunaTrack auth: checking session…');
    const session = await withTimeout(getSession(), 4000);
    clearTimeout(escapeTimer);
    console.info('LunaTrack auth: session check finished.', session ? 'signed in' : 'signed out');

    if (!session) {
      window.location.href = 'login.html';
      return false;
    }
    if (guard) { guard.hidden = true; guard.style.display = 'none'; }
    return true;
  }

  /** Call at the top of login.html — if already signed in, skip straight to the dashboard. */
  async function redirectIfSignedIn() {
    if (!LunaSupabase.isConfigured) return;
    const session = await withTimeout(getSession(), 4000);
    if (session) window.location.href = 'dashboard.html';
  }

  return { getSession, getUser, signUp, signIn, signInWithGoogle, signOut, requireAuth, redirectIfSignedIn };
})();
