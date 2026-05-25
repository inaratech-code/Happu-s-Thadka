# PWA capabilities (Happus Tadka)

## Enabled features

| Feature | Where |
|--------|--------|
| **Service worker** | `public/sw.js` (production) |
| **Background Sync** | Queues Supabase saves when offline; flushes in SW |
| **Periodic Sync** | Refreshes cache + retries queue every 12h (if permitted) |
| **Tabbed display** | `display_override` includes `tabbed` (Chrome/Edge) |
| **Widgets** | Manifest → `/api/widget/today-sales` |
| **Scope extensions** | `https://happus-tadka.vercel.app` — update if your host differs |

## IARC rating ID

`iarc_rating_id` is only required for **Microsoft Store / game** packages. This restaurant app does not include a rating ID. To publish on the Microsoft Store, complete [IARC certification](https://www.globalratings.com/) and add:

```json
"iarc_rating_id": "your-iarc-uuid-here"
```

to `public/manifest.json`.

## Custom domain

If you deploy off Vercel, edit `scope_extensions[0].origin` in `manifest.json` to match your production URL.
