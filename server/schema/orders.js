// Orders: menu items and requests.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id          TEXT PRIMARY KEY,
      recipe_id   TEXT REFERENCES recipes(id) ON DELETE CASCADE,
      group_id    TEXT REFERENCES groups(id),
      available   INTEGER DEFAULT 1,
      price       TEXT DEFAULT '',
      note        TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS meal_requests (
      id           TEXT PRIMARY KEY,
      menu_item_id TEXT REFERENCES menu_items(id),
      group_id     TEXT REFERENCES groups(id),
      requester_id TEXT REFERENCES users(id),
      quantity     INTEGER DEFAULT 1,
      note         TEXT DEFAULT '',
      status       TEXT DEFAULT 'pending',
      requested_at TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );
  `);
};
