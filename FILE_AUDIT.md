# Krystle's Cottage — File Audit Report
_Generated: 2026-05-27_

---

## Summary

| Category | Count | Action |
|---|---|---|
| Orphaned client pages | 1 | Review / wire up or delete |
| Orphaned client components | 1 | Delete |
| Orphaned server routes | 1 | Review / wire up or delete |
| Stale junk files | 5 | Delete |
| Committed files that should be gitignored | 4 | Remove from tracking |
| Stale client dependencies | 2 | Uninstall |
| Redundant client dependencies | 1 pair | Consolidate |
| Old branding in package.json `name` fields | 2 | Rename |
| Old branding in doc content | 1 | Update |

---

## 1. Orphaned Client Pages

### `client/src/pages/Cuisine.jsx` ⚠️
**Not imported in App.jsx. Has no route.**

This page exists with a full implementation — it imports `BarcodeScanner`, `PhotoUpload`, and calls `/api/cuisine`. It looks like a partially-built feature that never got wired up. The paired server route (`server/routes/cuisine.js`) also exists but is never mounted.

**Decision needed:** Either add it to App.jsx with a route, or delete both this file and the server route together.

---

## 2. Orphaned Client Components

### `client/src/components/ProductCard.jsx` ❌
**Not imported anywhere in the codebase.**

Grep confirms zero imports outside of the file itself. Nothing in pages or other components references it.

**Recommendation: Delete.**

---

## 3. Orphaned Server Routes

### `server/routes/cuisine.js` ⚠️
**Exists but is never mounted in `server/index.js`.**

Paired with the orphaned `Cuisine.jsx` page above. The route file exists and has logic, but no `app.use('/api/cuisine', ...)` call exists in index.js.

**Decision needed:** Wire it up alongside Cuisine.jsx, or delete both.

---

## 4. Stale Junk Files (safe to delete)

### `rename_kitchen_to_cottage.bat`
One-time rename script. The rename already happened. This is dead.

### `git-fix-commit.bat`
One-time git repair script. Served its purpose.

### `server/.fuse_hidden0000000b00000001`
### `server/.fuse_hidden0000000b00000002`
Linux FUSE filesystem temp files — these are leftover artifacts from file operations on a Linux filesystem (likely from when the server ran on Render or a Linux dev box). They're binary, ~32KB each, and have no business being in the repo.

**Recommendation: Delete all four.**

---

## 5. Files Committed That Should Be Gitignored

These are already listed in `.gitignore` but appear to still be present in the working directory (and may be tracked by git):

### `server/data.db`
### `server/data.db-wal`
Both are in `.gitignore` under `# SQLite database`. If they're showing up in `git status`, they need to be removed from tracking with `git rm --cached`.

### `desktop.ini`
Windows metadata file. Listed in `.gitignore`. Shouldn't be committed.

### `client/.env.production`
`.env.production` is listed in `.gitignore` (as `.env.production`). If this file contains real API keys or URLs, it should **never** be in the repo. Verify it's not tracked.

**Recommendation:** Run `git ls-files --error-unmatch <file>` on each to confirm tracking status, then `git rm --cached` as needed.

---

## 6. Stale Client Dependencies

These are in `client/package.json` but have zero usage anywhere in `client/src/`:

### `date-fns`
Installed but not imported in a single file. No `from 'date-fns'` anywhere in the codebase.

**Recommendation: `npm uninstall date-fns` in client/.**

---

## 7. Potentially Redundant Client Dependencies

### `@zxing/browser` + `@zxing/library` vs `jsqr`
All three are barcode/QR scanning libraries and all are used in `BarcodeScanner.jsx`. `@zxing/*` handles camera-based scanning; `jsqr` decodes raw image data. Worth checking whether both approaches are actually needed in that component, or if one can be dropped to reduce bundle weight. Not a safe auto-delete — needs a look at `BarcodeScanner.jsx` first.

---

## 8. Old Branding in `package.json` `name` Fields

### `client/package.json` → `"name": "krystles-brand-hub-client"`
### `server/package.json` → `"name": "krystles-brand-hub-server"`

Both still use the old `krystles-brand-hub` name. Low priority since `name` in package.json is mostly cosmetic for private apps, but worth updating to `krystles-cottage-client` / `krystles-cottage-server` for consistency.

---

## 9. Old Branding in Document Content

### `ROADMAP.md`
Contains at least one reference to `KrystlesKitchen` in the text. Not a code issue — just a doc that needs a find-and-replace pass.

---

## Notes on Files That Look Suspicious But Are Fine

- **`client/src/pages/Kitchen.jsx`** — "Kitchen" here is an intentional feature name (the recipes section), not a rename leftover. It IS imported and routed in App.jsx at `/kitchen`. Leave it alone.
- **`server/scripts/compress-existing.js`** and **`server/scripts/make-superadmin.js`** — These are one-off CLI utility scripts, not route files, so they're not "missing" from index.js. They're run manually (`node server/scripts/make-superadmin.js`). Keep them — they're useful.
- **`setup.sh`** / **`start.bat`** — Dev convenience scripts. Keep if you use them.
- **`client/scripts/generate-icons.js`** — Build utility for PWA icons. Not referenced in package.json scripts but harmless to keep.
- **`server/data.db-wal`** — WAL journal file for SQLite. Goes with data.db. See section 5.
