// Groups, their members and invitations.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      owner_id    TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS group_members (
      id        TEXT PRIMARY KEY,
      group_id  TEXT NOT NULL,
      user_id   TEXT NOT NULL,
      joined_at TEXT DEFAULT (datetime('now')),
      UNIQUE(group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id)  REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS group_invitations (
      id         TEXT PRIMARY KEY,
      group_id   TEXT NOT NULL,
      email      TEXT NOT NULL,
      token      TEXT UNIQUE NOT NULL,
      status     TEXT DEFAULT 'pending',
      invited_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id)   REFERENCES groups(id),
      FOREIGN KEY (invited_by) REFERENCES users(id)
    );
  `);

  // groups migration: max_members
  const _groupCols = await db.all('PRAGMA table_info(groups)');
  if (!_groupCols.find(c => c.name === 'max_members')) {
    await db.run('ALTER TABLE groups ADD COLUMN max_members INTEGER NOT NULL DEFAULT 5');
  }

  try {
    await db.run(`ALTER TABLE group_members ADD COLUMN last_synced_at DATETIME`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
  }
};
