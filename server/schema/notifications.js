// Notifications (the preference column itself lives on users, in accounts.js).
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      group_id   TEXT,
      type       TEXT NOT NULL,
      title      TEXT NOT NULL,
      message    TEXT,
      link       TEXT,
      is_read    INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id)  REFERENCES users(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );
  `);

  // Migrate notification pref key: in_app_kultivate → in_app_garden
  const _usersWithPrefs = await db.all(
    "SELECT id, notification_prefs FROM users WHERE notification_prefs LIKE '%in_app_kultivate%'"
  );
  for (const u of _usersWithPrefs) {
    try {
      const prefs = JSON.parse(u.notification_prefs || '{}');
      if ('in_app_kultivate' in prefs) {
        prefs.in_app_garden = prefs.in_app_kultivate;
        delete prefs.in_app_kultivate;
        await db.run('UPDATE users SET notification_prefs = ? WHERE id = ?', [
          JSON.stringify(prefs),
          u.id,
        ]);
      }
    } catch {}
  }
};
