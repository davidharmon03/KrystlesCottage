// Kitchen: recipes.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      ingredients TEXT NOT NULL,
      steps       TEXT NOT NULL,
      tags        TEXT DEFAULT '[]',
      skill_tags  TEXT DEFAULT '[]',
      author_id   TEXT NOT NULL,
      group_id    TEXT,
      is_public   INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (group_id)  REFERENCES groups(id)
    );
  `);

  // recipes migration: sides field
  const _recipeCols = await db.all('PRAGMA table_info(recipes)');
  if (!_recipeCols.find(c => c.name === 'sides')) {
    await db.run("ALTER TABLE recipes ADD COLUMN sides TEXT DEFAULT ''");
  }

  // recipes migration: servings and times (minutes), all optional
  for (const col of ['servings', 'prep_time', 'cook_time']) {
    if (!_recipeCols.find(c => c.name === col)) {
      await db.run(`ALTER TABLE recipes ADD COLUMN ${col} INTEGER`);
    }
  }
};
