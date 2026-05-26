# Happus Tadka — Restaurant POS & ERP

Premium dark-mode restaurant management for **Happus Tadka** (Mahendinagar · Ghuiyaghat). Built with the same operational structure as [Patela Farm Management](https://patelafarms.vercel.app/) — inventory, transactions, accounts, POS, and kitchen — with a custom nightlife brand aesthetic.

## Stack

- **Next.js 15** (App Router)
- **Tailwind CSS 4**
- **Framer Motion**
- **Lucide icons**
- PWA-ready (`manifest.json`)

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login) — demo credentials: `admin` / `admin123`

### Optional: Neon Postgres (shared database)

Without env vars, data stays in the browser (`localStorage`). With `DATABASE_URL` configured, the app uses **custom staff login** and syncs state through Next.js API routes.

See **[docs/DATABASE.md](docs/DATABASE.md)** — copy `.env.example` → `.env.local`, run migrations on Neon, then restart `npm run dev`.

Production build:

```bash
npm run build
npm start
```

## Screens

| Route | Purpose |
|-------|---------|
| `/login` | Cinematic auth |
| `/` | Live dashboard (sales heatmap, tables, kitchen feed) |
| `/pos` | Fast cashier — menu grid, sticky order panel, receipt slide-over |
| `/kitchen` | KOT board (new → preparing → ready) |
| `/inventory` | Manual stock cards (Patela-style) |
| `/transactions` | Sales, purchases, expenses |
| `/accounts` | Ledger |
| `/reports` | Revenue analytics |

## Design

- Charcoal base, amber/orange accents, subtle noise + beer-light glows
- Asymmetrical layouts, dense operational spacing
- Command palette: **⌘K**

## Brand assets

Place your logo at `/public/logo.png`.
