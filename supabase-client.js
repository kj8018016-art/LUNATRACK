/* ==========================================================================
   LunaTrack — supabase-client.js
   Fill in SUPABASE_URL and SUPABASE_ANON_KEY (Project Settings → API in
   your Supabase dashboard) to switch LunaTrack from demo mode into a real,
   logged-in app backed by Postgres.

   Until both are filled in — or if SUPABASE_URL isn't a valid full URL —
   LunaSupabase.isConfigured is false and every auth-aware piece of the app
   (the guard in app.js, the login page, the logout button in Settings)
   quietly no-ops. The app keeps working exactly as it does today, with
   mock data and localStorage. Nothing breaks by leaving this unconfigured.

   IMPORTANT: SUPABASE_URL must be the FULL address, starting with
   "https://" — e.g. 'https://abcdefghijklmno.supabase.co', no trailing
   slash. Just the project ID, or a URL missing "https://", will make the
   browser try to resolve requests relative to whatever page you're on
   instead of your Supabase project — on a file:// page that shows up as a
   confusing "Unsafe attempt to load URL file:///..." error. The check
   below catches that case and falls back to demo mode instead.
   ========================================================================== */

const SUPABASE_URL = '';       // e.g. 'https://abcdefghijk.supabase.co'
const SUPABASE_ANON_KEY = '';  // e.g. 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

const LunaSupabase = (() => {
  const urlLooksValid = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test((SUPABASE_URL || '').trim());
  const keyPresent = Boolean(SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim().length > 20);

  if (SUPABASE_URL && !urlLooksValid) {
    console.warn(
      'LunaTrack: SUPABASE_URL doesn\'t look like a full Supabase URL (expected something like ' +
      '"https://abcdefghijk.supabase.co"). Falling back to demo mode until this is fixed — ' +
      'see app/js/supabase-client.js.'
    );
  }

  const isConfigured = urlLooksValid && keyPresent;

  let client = null;
  if (isConfigured) {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim());
    } else {
      // Credentials are set but the CDN script didn't load (offline, blocked, etc).
      console.warn('LunaTrack: Supabase credentials are set but the Supabase client script did not load.');
    }
  }

  return { isConfigured: isConfigured && Boolean(client), client };
})();
