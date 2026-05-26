# Database setup (Neon Postgres)

The app supports **two modes**:

| Mode | When | Data | Login |
|------|------|------|-------|
| **Local** | `NEXT_PUBLIC_USE_SERVER_DB` unset | `localStorage` | Staff in local storage (`admin` / `admin123` on first run) |
| **Server** | `DATABASE_URL` + `SESSION_SECRET` + `NEXT_PUBLIC_USE_SERVER_DB=true` | Neon via API | Workspace + staff (`happus` / `admin` / `admin123` seeded) |

Auth uses **custom staff login** (not Neon Auth): passwords stay server-side.

---

## 1. Create a Neon project

1. [Neon Console](https://console.neon.tech) → create a project.
2. Copy the **pooled** connection string into `.env.local` as `DATABASE_URL`.

---

## 2. Configure environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_USE_SERVER_DB=true`, and `NEXT_PUBLIC_WORKSPACE_ID=happus` (must match `tenants.slug` in Neon).

On **Vercel**, add the same variables in Project → Settings → Environment Variables.

Restart the dev server after changing env vars.

---

## 3. Run migrations

```bash
npm run db:migrate
```

Or run `db/migrations/001_initial_schema.sql` and `002_tenants.sql` in the Neon SQL Editor.

---

## 4. Multi-tenant (one URL, no subdomains)

Each customer has a row in **`tenants`**:

| Column | Example |
|--------|---------|
| `slug` | `happus` (Workspace ID at login) |
| `restaurant_id` | `rest-happus-tadka` |

All POS, inventory, and ledger data is scoped by **`restaurant_id`** in the signed session. Restaurants never see each other’s data.

**Isolation layers:**

1. **Session** — JWT stores `restaurantId` for this workspace only  
2. **API** — `resolveRestaurantId()` checks session matches `NEXT_PUBLIC_WORKSPACE_ID` tenant  
3. **Postgres RLS** — migration `003_row_level_security.sql` enforces `app.restaurant_id` on every query  

Run `npm run db:migrate` after pulling to apply RLS (includes dropping unused `orders` / `products` / `users` tables if present).

**Login:** username `admin` + password `admin123` (workspace is fixed via `NEXT_PUBLIC_WORKSPACE_ID`, default `happus`)

**Add a new restaurant:**

```sql
INSERT INTO restaurants (id, name, location) VALUES ('rest-acme', 'Acme Cafe', 'City');
INSERT INTO tenants (id, slug, name, restaurant_id)
VALUES ('tenant-acme', 'acme', 'Acme Cafe', 'rest-acme');
-- then insert staff for rest-acme
```

Staff log in with workspace **`acme`**.

---

## 5. Verify

1. `npm run dev`
2. `/login` → Workspace **`happus`**, **`admin`** / **`admin123`**
3. Add a sale — refresh; data persists.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 503 on login | `DATABASE_URL` and `SESSION_SECRET` missing on server |
| Workspace not found | Add row in `tenants` with matching `slug` |
| Restaurant not found | Run migrations on Neon |
| Still using localStorage | Set `NEXT_PUBLIC_USE_SERVER_DB=true` |
| Wrong restaurant data | Log out; sign in with the correct Workspace ID |
