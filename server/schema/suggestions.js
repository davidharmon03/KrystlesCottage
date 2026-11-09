// Entrée suggestions and feature requests, with votes.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS meal_suggestions (
      id                   TEXT PRIMARY KEY,
      group_id             TEXT NOT NULL,
      suggested_by_user_id TEXT NOT NULL,
      meal_name            TEXT NOT NULL,
      recipe_id            TEXT,
      description          TEXT DEFAULT '',
      status               TEXT DEFAULT 'open',
      created_at           TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id)             REFERENCES groups(id),
      FOREIGN KEY (suggested_by_user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS suggestion_votes (
      id            TEXT PRIMARY KEY,
      suggestion_id TEXT NOT NULL,
      user_id       TEXT NOT NULL,
      vote          TEXT NOT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      UNIQUE(suggestion_id, user_id),
      FOREIGN KEY (suggestion_id) REFERENCES meal_suggestions(id),
      FOREIGN KEY (user_id)       REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS feature_requests (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      category    TEXT DEFAULT 'other',
      status      TEXT DEFAULT 'submitted',
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS feature_request_votes (
      id         TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(request_id, user_id),
      FOREIGN KEY (request_id) REFERENCES feature_requests(id),
      FOREIGN KEY (user_id)    REFERENCES users(id)
    );
  `);
};
