// Gallery: photos.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS meal_photos (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      group_id          TEXT NOT NULL,
      recipe_id         TEXT,
      inventory_item_id TEXT,
      vacuum_seal_id    TEXT,
      image_path        TEXT NOT NULL,
      caption           TEXT DEFAULT '',
      stage             TEXT DEFAULT 'plated',
      created_at        TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id)  REFERENCES users(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );
  `);
};
