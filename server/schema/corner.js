// Corner (group finance): receipts and entrée credits.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id          TEXT PRIMARY KEY,
      group_id    TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      amount      REAL NOT NULL,
      description TEXT,
      image_path  TEXT,
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id)  REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS meal_credits (
      id          TEXT PRIMARY KEY,
      group_id    TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      credits     REAL NOT NULL DEFAULT 0,
      description TEXT,
      added_by    TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id)  REFERENCES users(id),
      FOREIGN KEY (added_by) REFERENCES users(id)
    );
  `);
};
