# LunaTrack

A cycle-tracking web app. Static HTML/CSS/vanilla JS front end, backed by
real Supabase auth + Postgres. No mock/demo data — every page reads and
writes real rows for the signed-in user.

## Folder structure

Everything is one flat folder — every HTML, CSS, and JS file sits directly
at the root, with no subfolders (GitHub's drag-and-drop web uploader
flattens subfolders, so keeping the project subfolder-free means uploading
it that way can't break anything).

```
index.html                  landing page
login.html                  sign in / create account
dashboard.html, calendar.html, log.html, insights.html,
history.html, settings.html, help.html, learn.html, ai-chat.html
style.css, animations.css, responsive.css     landing page styles
app.css, dashboard.css, app-responsive.css    app shell + page styles
main.js, components.js, animations.js         landing page scripts
app.js                      shell + real Supabase data layer
auth.js, supabase-client.js auth + client config
dashboard.js, calendar.js, log.js, insights.js,
ai-chat.js, help-content.js, learn-content.js  page-specific logic
netlify.toml
supabase/schema.sql         database schema + Row Level Security
```

## Running it locally

Don't open the HTML files directly (`file://...`) — serve the folder:
```
npx serve .
```
or
```
python -m http.server 5500
```

## Setup (required — there's no demo mode anymore)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste in `supabase/schema.sql` → Run.
   Creates every table, RLS policy, the avatars storage bucket, and the
   `delete_own_account` function.
3. **Project Settings → API** → copy your **Project URL** and **anon
   public** key into `supabase-client.js`.
4. Reload. If Supabase isn't configured, every protected page shows an
   honest "Supabase isn't connected yet" notice instead of fake data.

### "Continue with Google" (optional)
1. Google Cloud Console → OAuth Client ID → add redirect URI:
   `https://<project-ref>.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → Google → paste Client ID/Secret.

## Turning on real AI Chat (optional)

The AI Chat page works out of the box using a small set of built-in
keyword-matched replies grounded in your real cycle data. To upgrade it
to a real Claude-backed model:

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and
   log in / link it to your project (`supabase login`, `supabase link`).
2. Get an API key from [console.anthropic.com](https://console.anthropic.com).
3. Set it as a secret (never put this in client-side code):
   ```
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Deploy the function:
   ```
   supabase functions deploy ai-chat
   ```

That's it — `ai-chat.js` automatically tries the real function first on
every message and silently falls back to the built-in replies if the
function isn't deployed or the call fails, so nothing breaks either way.
The function code is in `supabase/functions/ai-chat/index.ts` if you'd
like to read or customize the prompt.

## What's real now

- **Auth**: real sign up/in/out, session persistence, per-user data
  isolation via Row Level Security (verified by reading every policy in
  `schema.sql` — each one scopes to `auth.uid()`).
- **Profile**: real name (editable), real email, real avatar (Supabase
  Storage, `avatars` bucket, one folder per user).
- **Cycle setup, logs, notes, notifications**: all read/write Supabase
  directly. Notes and daily logs persist across refresh and re-login.
- **Insights & History**: computed from your actual `daily_logs` — no
  data shows an honest empty state instead of a fake chart.
- **Calendar**: uses the real current date (`new Date()`), not a fixed
  mock date.
- **Dashboard greeting**: real name, time-of-day-aware, shown on both
  mobile and desktop.
- **Dark mode**: a blocking script in every page's `<head>` applies the
  saved theme before first paint — no flash of the wrong theme.
- **Help Center & Learn**: real, searchable content — not "coming soon".
- **Account deletion**: a `security definer` Postgres function
  (`delete_own_account`) that a user can call on themselves; cascades
  clean up every table via existing foreign keys.

## Known limitations / what to verify yourself

I can't run a live Supabase session from where this was built, so while
every query and policy was written and read carefully, you should still
walk through the full checklist once against your own project:
create two accounts, confirm each only sees its own data, refresh
mid-session, log out and back in, and try the delete-account flow on a
throwaway account first.

The landing page's mobile layout was refined (spacing, CTA sizing, card
padding) rather than fully rebuilt from scratch — a ground-up visual
redesign with new imagery is a larger, separate design pass.
