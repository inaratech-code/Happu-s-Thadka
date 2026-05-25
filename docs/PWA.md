# PWA capabilities (Happus Tadka)

## Enabled features

| Feature | Where |
|--------|--------|
| **Service worker** | `public/sw.js` |
| **Background Sync** | Offline Supabase save queue |
| **Periodic Sync** | Cache refresh + queue retry |
| **Tabbed display** | `display_override`: `tabbed` |
| **Window controls overlay** | `display_override`: `window-controls-overlay` + `.app-titlebar` CSS |
| **Push notifications** | `push` / `notificationclick` in `sw.js`; subscribe via Settings |
| **Widgets** | `/api/widget/today-sales` |
| **IARC rating** | `iarc_rating_id` in `manifest.json` |

## IARC rating ID

The manifest includes `iarc_rating_id` for PWABuilder / Microsoft Store checks. **Replace it** with your real certificate ID from [IARC](https://portal.globalratings.com/) before store submission. The bundled value is a placeholder.

## Web Push (optional)

1. Generate keys: `npx web-push generate-vapid-keys`
2. Add to `.env.local`:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY` (server only; wire to your push sender later)
3. Deploy, then enable notifications under **Settings**.

## Custom domain

Update `scope_extensions[0].origin` in `public/manifest.json` if not using `happus-tadka.vercel.app`.
