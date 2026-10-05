# jamb-utme-lab
# JAMB UTME Lab — Admin Panel

Separate admin panel project for JAMB Lab. Manages questions, PINs, tasks, users, and traffic.

## URLs
- **Admin panel**: https://jamb-utme-lab.vercel.app/admin/login
- **Live site (separate)**: https://jamb-lab.vercel.app

## Architecture
- **Fully separate** from live site
- Own Vercel KV database
- Question bank is exported as `question-bank.json` → manually committed to the live site
- Receives anonymous pings from live site for traffic tracking

## Environment Variables (set in Vercel)
| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | your admin password |
| `SESSION_SECRET` | random 32-char string |
| `KV_REST_API_URL` | (auto-added by Vercel KV) |
| `KV_REST_API_TOKEN` | (auto-added by Vercel KV) |

## First-time Setup
1. Create Vercel KV database → connect to this project
2. Add `ADMIN_PASSWORD` and `SESSION_SECRET` env vars
3. Deploy
4. Visit `/admin/login` → log in
5. Go to `Questions` → click **Import** → upload your `question-bank.json`
6. Go to `Questions` → click **Export** → commit the exported file to the live site repo

## Adding Traffic Tracking to Live Site
Add this snippet to the live site's `js/main.js` inside `init()`:
```javascript
// Ping admin for traffic tracking (silent)
fetch('https://jamb-utme-lab.vercel.app/api/ping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ uid: localStorage.getItem('jamb_uid') || 'anon' })
}).catch(() => {});
