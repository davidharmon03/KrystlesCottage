# Krystle's Kitchen — Roadmap

Full-stack group kitchen app (React + Node/Express + SQLite) deployed on Render. This is a working dev doc — not a changelog.

---

## ✅ Completed

- ✅ **Recipe URL Import** — cheerio-based JSON-LD parser, OG fallback, two-step ImportRecipeModal
- ✅ **Entrée Refactor** — recipe auto-scaling (inline servings adjuster, real-time ingredient math), ingredient parser, `sides` column added, all "meal" UI text → "entrée"
- ✅ **Spending Charts** — bar + doughnut via Chart.js in Corner.jsx, backend stats endpoint
- ✅ **Kitchen Orders Page** — Orders.jsx with menu manager + meal requests, separate admin and client views, status flow + notifications
- ✅ **Security Hardening** — helmet + CSP, rate limiting (express-rate-limit), input validation (express-validator), bcrypt, file upload MIME hardening, forgot/reset password flow
- ✅ **PWA Setup** — vite-plugin-pwa, hand-written sw.js (bypasses Workbox apostrophe-in-path bug), manifest, install prompt, tested on real phone over WiFi
- ✅ **JWT Auto-Refresh** — 15min access token + 7-day refresh token, axios interceptor with 401 queue, silent refresh, server-side revocation on logout
- ✅ **Page Renames** — Korner → Corner, Kuzine → Cuisine, Kultivate → Garden; source files renamed, routes updated, nav labels cleaned
- ✅ **Render Cloud Deployment** — render.yaml Blueprint, backend + static client live at krystlescottage-server.onrender.com / krystlescottage-client.onrender.com
- ✅ **Render Production Setup** — Node 18.20.4, cheerio 1.0.0, sqlite3 5.1.6 for compatibility; 5 GB persistent disk for database; DB_PATH env var pointing to /mnt/data/data.db; custom domain (www.krystlescottage.com) configured; both services on paid tier; CORS configured; registration working ✅
- ✅ **GitHub Repo Cleanup** — .gitignore improved, README rewritten clean
- ✅ **App Renamed to Krystle's Cottage** — "Krystle's Brand Hub" → "Krystle's Cottage" across all files
- ✅ **Server Route File Renames** — korner.js→corner.js, kuzine.js→cuisine.js, kultivate.js→garden.js; API paths updated end-to-end including all frontend axios calls
- ✅ **Garden Page Fix** — calendar endpoint was querying wrong table; `in_app_kultivate` notif pref key → `in_app_garden`; auth loading guard added
- ✅ **Dashboard Account Status Card** — shows name, email, system role badge (Superadmin/Admin/Member), group membership status (Free Account vs Group Member ✓), group name + role, password change warning, Create/Join group CTA when ungrouped
- ✅ **Group Chat** — full stack (Chat.jsx, chat route, messages table)
- ✅ **Notification Preferences** — NotificationBell, prefs in Profile.jsx, DB column + API endpoints
- ✅ **Group Sync Mode** — SyncContext.jsx, sync-ping endpoint, last_synced_at tracking
- ✅ **Payment Integration** — Stripe, billing route, Billing.jsx
- ✅ **Data Export** — export route + ZIP download button in Profile.jsx
- ✅ **Print-Friendly Views** — @media print CSS, print button in Kitchen.jsx
- ✅ **Superadmin User Management** — admin users list with role badges, inline role editing
- ✅ **Onboarding Flow** — Welcome.jsx, post-registration redirect, Dashboard cleanup
- ✅ **Cuisine → Pantry Rename** — server/routes/pantry.js created, all API endpoints updated, client/src/pages/Pantry.jsx with all API calls updated, imports and navigation labels across App.jsx, Layout.jsx, Dashboard.jsx, Gallery.jsx updated; deployment pending
- ✅ **Cottage Laws Page** — CottageLaws.jsx with Tennessee Food Freedom Act summary, allowed/prohibited foods table, labeling requirements, frozen food guide (non-perishable vs perishable TCS foods), sales/distribution rules, links to official TN Dept of Agriculture + CottageFoodLicense.com; deployment pending

---

## 🔧 Next Up

- 🔄 **Deploy Pending Changes** — (Pantry rename + Cottage Laws) pending `git push` from Windows (git index.lock issue in Linux sandbox); after push, redeploy both Render services
- 🔄 **Live App Testing** — in progress; found 404 on first load (resolves on refresh, due to Pantry not yet deployed); continue testing registration, login, core features; fix any bugs in production
- 🔲 **Cross-device Responsive Testing** — manual (PC, Android, iPhone, Z Fold, iPad, Mac)
- 🔲 **Feature Development** — TBD (next phase)

---

## 📋 Backlog

- 🔲 **Image Compression** — sharp/WebP on upload (deferred until images are in use)

---

*Last updated: May 2026*
