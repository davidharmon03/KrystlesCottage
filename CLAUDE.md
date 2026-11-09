# Krystle's Cottage — read this first

Private group meal-prep and lifestyle app for a small closed group (up to 5 couples).
Not a public product. This project stands alone: no other project's rules, personas,
or routines apply here.

## The stack

| Part | What |
|---|---|
| `client/` | React + Vite + Tailwind. Pages in `client/src/pages/`, one per section |
| `server/` | Node + Express. Routes in `server/routes/`, one per feature area |
| Database | SQLite — `server/data.db`, schema in `server/db.js` |
| Hosting | David's own PC. One Express process serves the API **and** the built website (`client/dist`), on `127.0.0.1:3001` only |
| Address | krystlescottage.com and www — Cloudflare Tunnel `krystlescottage` (id `6c535744-…`) to `127.0.0.1:3001`. Config: `%USERPROFILE%\.cloudflared\krystlescottage.yml`. Live since 2026-11-09 |

Render was removed (2026-11-09) — don't bring it back. Settings live in `server/.env`
(never committed). Run it live: `npm run build` in `client/`, then `node index.js` in
`server/`. For development: `npm run dev` in `server/` and `client/` separately.

## The sections

Kitchen (recipes), Corner (group finance), Cuisine (inventory, shopping, barcode),
Garden (plants, harvest), Entrée Swap (weekly assignments), Orders (menu + requests),
plus Chat, Calendar, Gallery, Billing.

## Rules

- **`ROADMAP.md` is the working doc.** Read it before starting anything — it carries
  what's done, what's next, and the backlog. Update it when you finish something;
  it is not a changelog, so don't log routine work there.
- **Say "entrée", never "meal".** The rename was a deliberate refactor — the app is
  for batch-prepping freezer-friendly main dishes. The DB table is `swap_entrees`.
- **Don't regenerate the service worker.** `sw.js` is hand-written on purpose, to
  dodge a Workbox bug with the apostrophe in "Krystle's". Leave it alone.
- **Security is already hardened** — helmet + CSP, express-rate-limit,
  express-validator, bcrypt, upload MIME checks. Don't undo these when adding routes;
  new endpoints get validation and rate limiting like the existing ones.
- **This is a private group app.** Features are for a known set of members, not
  anonymous public users. Don't add open sign-up flows.

## Before it goes public — read this

- **The GitHub repo is public.** Never put a password, key or secret in the code. The
  old built-in admin password (removed 2026-11-09) is still in git history, so the
  live admin account must not use it.
- **The live database is `server/data.db` on this PC.** It is real data now: back it
  up before any change that touches it.
- **Email is a placeholder** (`server/utils/email.js` only prints to the console), so
  verification, invite and reset emails aren't sent yet.

## Documentation

`ROADMAP.md` is the live one. The rest are historical write-ups, accurate for when
they were written but not maintained: `REFACTOR_PLAN.md`, `RECIPE_IMPORT_URL.md`,
`CAMERA_BARCODE_SCANNER.md`, `RENDER_SETUP.md` (obsolete — Render is gone), `FILE_AUDIT.md` (dated 2026-05-27),
and `Krystle's_Cottage_Project.md` (brand vision, pasted in with escaped markdown).
