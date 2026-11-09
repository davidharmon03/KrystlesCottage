# Krystle's Cottage — Roadmap

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
- ✅ **Full Project Rename** — KrystlesCottage across GitHub repo, local folder, render.yaml, and all file references
- ✅ **Freemium Tier** — paid gate on group creation; free users can join via invite code; 5-member base cap; upgrade modal with Coming Soon payment placeholder
- ✅ **Expandable Group Slots** — group owners can add +5 member slots in packs (Coming Soon payment); `max_members` column on groups table
- ✅ **Superadmin-Only Account Creation** — only superadmins can create superadmin accounts; temp password generated and displayed on creation; `must_change_password` enforced
- ✅ **Admin Groups View** — superadmins can see all groups, member counts, expandable member lists with roles and join dates
- ✅ **Print Center** — expanded Label Generator to full Print Center with 4 print types: Bag Labels, Weekly Menu, Shopping List, Meal Cards
- ✅ **Dashboard Group Card Redesign** — group members displayed inside the group card with dividers; superadmin sees correct "Admin Access" badge and group CTA
- ✅ **Account Status Card Fix** — superadmin no longer shows as "Free Account"; role badge and group status display correctly for all roles
- ✅ **Change Password in Profile** — dedicated Change Password section added to Profile.jsx
- ✅ **Admin Role Page Visibility Fix** — admin page was superadmin-only; now correctly accessible to `admin` role
- ✅ **SPA 404 Fix** — `_redirects` file + `render.yaml` rewrite rule added; direct route loads no longer 404
- ✅ **Email Verification Flow** — verification required before joining a group or going paid; verification email sent on registration; gated routes enforce verified status
- ✅ **Group Invite via Email** — group owners can send invite codes to any email address; recipient receives invite link
- ✅ **Change Email Address in Profile** — users can update their email in Profile.jsx; triggers re-verification flow on change
- ✅ **Collapsible Sidebar Navigation** — Kitchen, Storage, Community, Admin Panel groups with collapse/expand toggle and localStorage persistence
- ✅ **Storage Sub-Routes** — Storage split into Pantry / Refrigerator / Freezer at `/storage/pantry`, `/storage/refrigerator`, `/storage/freezer`
- ✅ **Storage Location + Prep Method Split** — inventory now uses two dropdowns (`storage_location` + `prep_method`) replacing the single "Storage type" field
- ✅ **Expiry Logic Matrix** — expiry calculations updated with full location + prep_method matrix covering all storage/prep combinations
- ✅ **Menus & Orders Page** — Cuisine.jsx wired up at `/orders`
- ✅ **Superadmin Plan Management Gate** — plan management actions locked to superadmin role on both backend (route middleware) and frontend (conditional UI)
- ✅ **Calendar Event Type Filter Pills** — filter pills added to calendar view: All, Expirations, Added Items, Bulk Buy Trips, Garden Harvests
- ✅ **Garden Section Expanded** — Garden split into subpages (Plots, Plants, Harvest Log, Calendar, Growing Guides) with sidebar nav matching Kitchen/Storage style
- ✅ **Garden Plots Page** — plot types (Raised Bed, Bucket, Row), blueprint designer with color-coded cell labeling, saved to DB

---

## 🚨 Infrastructure

- 🟡 **Hosting moved to David's PC (2026-11-09)** — Render removed. One server now serves the site and the API; the database is a real file on this PC, so the old "resets on redeploy" problem is gone. krystlescottage.com is live through a Cloudflare Tunnel. Still to do: start the app and tunnel automatically when the PC boots, and real email (the email code is a placeholder).

---

## 🔧 Next Up

- 🔲 **Stripe Payment Integration** — wire Stripe into the existing freemium gate and group slot expansion (placeholders already in place)
- 🔲 **Real Email Provider** — swap placeholder in `server/utils/email.js` with SendGrid or Resend for production email delivery
- 🔲 **Cross-device Responsive Testing** — manual (PC, Android, iPhone, Z Fold, iPad, Mac)
- 🔲 **Manual File Deletions** — remove `ProductCard.jsx`, `rename_kitchen_to_cottage.bat`, `git-fix-commit.bat`, and any `.fuse_hidden` files from the repo
- 🔲 **Garden Subpages (implementation)** — Plants, Harvest Log, Calendar, Growing Guides are scaffolded only; need full implementation
- 🔲 **Garden Map View** — A top-down visual layout of the entire garden space showing all plots (raised beds, buckets, rows) arranged spatially like a blueprint/map. Users can drag and position plots on a canvas to represent where they physically are in the yard. Shows at-a-glance what's planted where across all plots. Connects to the existing Plots and Plants data.

---

## 📋 Backlog

- 🔲 **Image Compression** — sharp/WebP on upload (deferred until images are in use)
- 🔲 **Recipe → Shopping List Integration** — Planning meals or selecting recipes should auto-generate or populate the Shopping List with missing ingredients. Core workflow connection.
- 🔲 **Harvest Log → Inventory Integration** — Logging a harvest in Garden should offer to add the item directly to Pantry inventory, with quantity and storage location pre-filled.
- 🔲 **Garden Calendar → Group Calendar Sync** — Planting dates, expected harvest dates, and garden tasks added in the Garden Calendar should appear on the main Group Calendar so the whole group sees them.
- 🔲 **Plants Page (Garden)** — Build out the scaffold: track what's planted in each plot/cell, planting date, expected harvest date, and link back to the blueprint cell so clicking a cell shows plant details.
- 🔲 **Harvest Log (Garden)** — Build out the scaffold: log harvests with quantity, date, and which plot. Connects to Harvest → Inventory integration.
- 🔲 **Growing Guides (Garden)** — Build out the scaffold: reference guides per plant type with spacing, watering, companion plants, common issues. Could be seeded with common plants or user-added.
- 🔲 **In-App Notifications** — Alert badges for expiring inventory, new group chat messages, harvest reminders, new items added to Meal Gallery.
- 🔲 **Meal Planning / Weekly Menu Builder** — Plan meals Monday–Sunday, assign recipes per day, auto-generate shopping list from planned meals. May overlap with or replace current Menus & Orders page — evaluate when building.
- 🔲 **Photo Uploads** — Image upload support for Meal Gallery (meal photos), Garden (plot/plant photos), and Recipes. Needs file storage solution (Cloudinary or similar).
- 🔲 **Cottage Laws — Legal Reference by Location** — The Cottage Laws page is a reference database of actual cottage food laws by state, county, and city. Admins should be able to add/update legal entries. Members can look up their jurisdiction's rules. Consider searchable by state/county.

---

*Last updated: June 2, 2026*
