# Supabase setup (Happus Tadka)

The app supports **two modes**:

| Mode | When | Data | Login |
|------|------|------|-------|
| **Local** | No Supabase env vars | `localStorage` | Staff in local storage (`admin` / `admin123` created on first run) |
| **Supabase** | `.env.local` configured | Postgres via API | Staff in `staff` table (`admin` / `admin123` seeded in migration) |

Auth uses **custom staff login** (not Supabase Auth): passwords stay server-side; the browser never receives `password_hash` from list endpoints.

---

## 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) → New project.
2. Copy from **Project Settings → API**:
   - Project URL
   - `anon` public key
   - `service_role` secret key (server only)

---

## 2. Configure environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SESSION_SECRET=your-long-random-secret-at-least-32-characters
```

Restart the dev server after changing env vars.

---

## 3. Run the database migration

**Option A — Supabase Dashboard**

1. Open **SQL Editor** in your project.
2. Paste the contents of `supabase/migrations/20260525000000_initial_schema.sql`.
3. Run the script.

**Option B — Supabase CLI**

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

---

## 4. Verify

1. `npm run dev`
2. Open `/login` → sign in with **`admin`** / **`admin123`**
3. Add a sale or expense — data should persist after refresh (stored in Postgres).

Use **Sync** in the header to reload from the database.

---

## 5. Migrate existing localStorage data

1. Stay in **local mode** (no Supabase env) and use **Dashboard → Export** (or copy `happus-tadka-state` from DevTools → Application → Local Storage).
2. Enable Supabase env and run migrations.
3. Sign in, then either:
   - Manually re-enter data, or
   - Build a one-off import script that calls `PUT /api/state` with your JSON while logged in.

---

## Architecture notes

- **API routes** (`/api/auth/*`, `/api/state`) use the **service role** key and validate an httpOnly **session cookie** (`happus_session`).
- **RLS** is enabled on all tables with **no public policies** — the anon key cannot read/write business data directly.
- Saves replace restaurant-scoped rows (full sync). Fine for a single restaurant; optimize to row-level APIs later if needed.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Stuck on Loading | Check `SESSION_SECRET` length ≥ 16 and restart dev server |
| 503 on login | `SUPABASE_SERVICE_ROLE_KEY` missing on server |
| 500 on load state | Run migration SQL; confirm `rest-happus-tadka` row exists |
| Still using localStorage | `NEXT_PUBLIC_SUPABASE_URL` must be set in `.env.local` |
