// Entrée Swap: schedules, weeks, entrées, ratings (includes the swap_meals -> swap_entrees migration).
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS swap_schedule (
      id         TEXT PRIMARY KEY,
      group_id   TEXT NOT NULL,
      week_start TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(group_id, week_start),
      FOREIGN KEY (group_id)   REFERENCES groups(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS swap_assignments (
      id            TEXT PRIMARY KEY,
      schedule_id   TEXT NOT NULL,
      user_id       TEXT NOT NULL,
      day_of_week   INTEGER NOT NULL,
      recipe_id     TEXT,
      meal_name     TEXT NOT NULL DEFAULT '',
      notes         TEXT,
      delivery_date TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (schedule_id) REFERENCES swap_schedule(id),
      FOREIGN KEY (user_id)     REFERENCES users(id),
      FOREIGN KEY (recipe_id)   REFERENCES recipes(id)
    );
    CREATE TABLE IF NOT EXISTS swap_weeks (
      id         TEXT PRIMARY KEY,
      group_id   TEXT NOT NULL,
      swap_day   TEXT NOT NULL,
      week_label TEXT DEFAULT '',
      status     TEXT DEFAULT 'active',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id)   REFERENCES groups(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS swap_meals (
      id         TEXT PRIMARY KEY,
      week_id    TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      meal_name  TEXT NOT NULL,
      recipe_id  TEXT,
      status     TEXT DEFAULT 'assigned',
      notes      TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (week_id)   REFERENCES swap_weeks(id),
      FOREIGN KEY (user_id)   REFERENCES users(id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    );
    CREATE TABLE IF NOT EXISTS meal_ratings (
      id         TEXT PRIMARY KEY,
      meal_id    TEXT NOT NULL,
      rated_by   TEXT NOT NULL,
      stars      INTEGER NOT NULL CHECK(stars >= 1 AND stars <= 5),
      comment    TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(meal_id, rated_by),
      FOREIGN KEY (meal_id)   REFERENCES swap_meals(id),
      FOREIGN KEY (rated_by)  REFERENCES users(id)
    );
  `);

  // Phase 1 Migration: Rename swap_meals to swap_entrees
  const _mealTableExists = await db.all(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='swap_meals'
  `);

  if (_mealTableExists.length > 0) {
    const _entreeTableExists = await db.all(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='swap_entrees'
    `);

    if (_entreeTableExists.length === 0) {
      // Backup old table
      await db.run('ALTER TABLE swap_meals RENAME TO swap_meals_backup');

      // Create new table
      await db.run(`
        CREATE TABLE IF NOT EXISTS swap_entrees (
          id         TEXT PRIMARY KEY,
          week_id    TEXT NOT NULL,
          user_id    TEXT NOT NULL,
          entree_name TEXT NOT NULL,
          recipe_id  TEXT,
          notes      TEXT DEFAULT '',
          status     TEXT DEFAULT 'assigned',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (week_id)  REFERENCES swap_weeks(id),
          FOREIGN KEY (user_id)  REFERENCES users(id),
          FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        )
      `);

      // Copy data
      await db.run(`
        INSERT INTO swap_entrees (id, week_id, user_id, entree_name, recipe_id, notes, status, created_at, updated_at)
        SELECT id, week_id, user_id, meal_name, recipe_id, notes, status, datetime('now'), updated_at
        FROM swap_meals_backup
      `);

      // Update meal_ratings foreign key
      const _ratingsBackupExists = await db.all(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='meal_ratings_backup'
      `);

      if (_ratingsBackupExists.length === 0) {
        await db.run('ALTER TABLE meal_ratings RENAME TO meal_ratings_backup');

        await db.run(`
          CREATE TABLE IF NOT EXISTS meal_ratings (
            id         TEXT PRIMARY KEY,
            entree_id  TEXT NOT NULL,
            rated_by   TEXT NOT NULL,
            stars      INTEGER NOT NULL CHECK(stars >= 1 AND stars <= 5),
            comment    TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(entree_id, rated_by),
            FOREIGN KEY (entree_id)  REFERENCES swap_entrees(id),
            FOREIGN KEY (rated_by)   REFERENCES users(id)
          )
        `);

        await db.run(`
          INSERT INTO meal_ratings
          SELECT id, meal_id, rated_by, stars, comment, created_at
          FROM meal_ratings_backup
        `);
      }

      // Create entree_sides table
      await db.run(`
        CREATE TABLE IF NOT EXISTS entree_sides (
          id         TEXT PRIMARY KEY,
          entree_id  TEXT NOT NULL,
          side_name  TEXT NOT NULL,
          sort_order INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (entree_id) REFERENCES swap_entrees(id) ON DELETE CASCADE
        )
      `);

      await db.run(`
        CREATE INDEX idx_entree_sides_entree_id ON entree_sides(entree_id)
      `);

      // Drop backup tables
      await db.run('DROP TABLE IF EXISTS meal_ratings_backup');
      await db.run('DROP TABLE IF EXISTS swap_meals_backup');
    }
  }
};
