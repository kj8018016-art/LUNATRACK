# LunaTrack

A cycle-tracking web app. Static HTML/CSS/vanilla JS front end, with an
optional real Supabase backend (auth + Postgres) that's off by default.

## Folder structure

Everything is one flat folder — every HTML, CSS, and JS file sits directly
at the root, with no subfolders. This is deliberate: GitHub's drag-and-drop
"Upload files" web UI silently flattens subfolders, so keeping the project
subfolder-free means uploading it that way can't break anything.

```
index.html            ← landing page
login.html             sign in / create account
dashboard.html
calendar.html
log.html
insights.html
history.html
settings.html
ai-chat.html
style.css, animations.css, responsive.css     ← landing page styles
app.css, dashboard.css, app-responsive.css    ← app shell + page styles
main.js, components.js, animations.js         ← landing page scripts
app.js, dashboard.js, calendar.js, log.js,
insights.js, ai-chat.js, auth.js,
supabase-client.js                             ← app scripts
netlify.toml
supabase/schema.sql   ← database schema + Row Level Security (not loaded
                          by the browser, so this one's fine in a subfolder)
```

## Running it locally

Don't open the HTML files directly (`file://...`) — some browser features
(Supabase session storage in particular) behave inconsistently under
`file://`. Serve the folder instead:

```
npx serve .
```
or
```
python -m http.server 5500
```
then open the printed `http://localhost:...` address.

## Demo mode (default — no setup required)

Out of the box, `supabase-client.js` has empty credentials. In this state
the whole app runs on mock data and `localStorage` — every page is open,
nothing requires an account. This is what you get if you deploy as-is.

## Turning on real accounts

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste in `supabase/schema.sql` → Run.
   This creates all the tables and Row Level Security policies.
3. **Project Settings → API** → copy your **Project URL** and **anon
   public** key into `supabase-client.js`:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```
   The URL must start with `https://` and end in `.supabase.co` — if it
   doesn't match that shape, the app deliberately falls back to demo mode
   and logs a warning, instead of failing in a confusing way.
4. Reload. Every page now redirects signed-out visitors to `login.html`.

## Turning on "Continue with Google"

1. In [Google Cloud Console](https://console.cloud.google.com/), create an
   OAuth Client ID (Web application).
   - Add this to **Authorized redirect URIs**:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. In Supabase: **Authentication → Providers → Google** → paste in the
   Client ID and Client Secret → Save.
3. That's it — the "Continue with Google" button on `login.html` already
   calls `supabase.auth.signInWithOAuth({ provider: 'google' })`.

## Deploying (GitHub + Netlify)

1. Upload every file at the root of a GitHub repo (drag-and-drop is fine —
   there are no subfolders to lose except `supabase/`, which doesn't need
   to be uploaded at all for the site to work; it's just for your own
   reference when setting up Supabase).
2. In Netlify: **Add new site → Import an existing project** → pick the
   repo.
3. Build command: leave blank. Publish directory: leave blank
   (`netlify.toml` already pins it to the repo root).
4. Deploy. If you configured Supabase, also add your production Netlify
   URL to Supabase's **Authentication → URL Configuration → Site URL /
   Redirect URLs**, or sign-in redirects will bounce back to the wrong
   place.

## What's still local-only

Cycle setup (last period date, cycle length, period length) is fully wired
to Supabase once configured. Daily logs, check-ins, notes, and
notifications still live in `localStorage` only — the tables and RLS
policies for them already exist in `schema.sql`; wiring each one up
follows the same pattern as `saveCycleSetup()` / `syncCycleSetupFromCloud()`
in `app.js`.
