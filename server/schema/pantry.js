// Pantry / storage: inventory, shopping, vacuum-seal log, bulk buys, product catalog.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id           TEXT PRIMARY KEY,
      group_id     TEXT NOT NULL,
      name         TEXT NOT NULL,
      quantity     TEXT NOT NULL,
      category     TEXT NOT NULL,
      storage_type TEXT NOT NULL,
      notes        TEXT,
      use_by_date  TEXT,
      added_by     TEXT NOT NULL,
      created_at   TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (added_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS shopping_list_items (
      id         TEXT PRIMARY KEY,
      group_id   TEXT NOT NULL,
      name       TEXT NOT NULL,
      quantity   TEXT,
      category   TEXT,
      is_checked INTEGER DEFAULT 0,
      added_by   TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (added_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS vacuum_seal_log (
      id               TEXT PRIMARY KEY,
      group_id         TEXT NOT NULL,
      item_name        TEXT NOT NULL,
      quantity         TEXT,
      seal_date        TEXT NOT NULL,
      expiry_date      TEXT,
      use_by_date      TEXT,
      storage_location TEXT,
      notes            TEXT,
      added_by         TEXT NOT NULL,
      created_at       TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (added_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS bulk_buy_runs (
      id             TEXT PRIMARY KEY,
      group_id       TEXT NOT NULL,
      name           TEXT NOT NULL,
      run_date       TEXT,
      buyer_user_id  TEXT,
      status         TEXT DEFAULT 'planning',
      created_by     TEXT NOT NULL,
      created_at     TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id)      REFERENCES groups(id),
      FOREIGN KEY (buyer_user_id) REFERENCES users(id),
      FOREIGN KEY (created_by)    REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS bulk_buy_items (
      id              TEXT PRIMARY KEY,
      run_id          TEXT NOT NULL,
      group_id        TEXT NOT NULL,
      item_name       TEXT NOT NULL,
      category        TEXT DEFAULT 'other',
      requested_by    TEXT NOT NULL,
      quantity_needed TEXT,
      est_cost        REAL,
      actual_cost     REAL,
      notes           TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (run_id)       REFERENCES bulk_buy_runs(id),
      FOREIGN KEY (group_id)     REFERENCES groups(id),
      FOREIGN KEY (requested_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS products (
      id                 TEXT PRIMARY KEY,
      name               TEXT NOT NULL,
      brand              TEXT,
      category           TEXT DEFAULT 'other',
      store_section      TEXT DEFAULT 'pantry',
      unit_type          TEXT,
      unit_size          TEXT,
      description        TEXT,
      image_url          TEXT,
      image_path         TEXT,
      barcode            TEXT,
      source             TEXT DEFAULT 'custom',
      off_id             TEXT,
      created_by_user_id TEXT,
      is_public          INTEGER DEFAULT 1,
      created_at         TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS shopping_lists (
      id           TEXT PRIMARY KEY,
      group_id     TEXT NOT NULL,
      name         TEXT NOT NULL DEFAULT 'Weekly Shop',
      created_at   TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );
  `);

  const _invCols = await db.all('PRAGMA table_info(inventory_items)');
  if (!_invCols.find(c => c.name === 'use_by_date')) {
    await db.run('ALTER TABLE inventory_items ADD COLUMN use_by_date TEXT');
  }
  const _vsCols = await db.all('PRAGMA table_info(vacuum_seal_log)');
  if (!_vsCols.find(c => c.name === 'use_by_date')) {
    await db.run('ALTER TABLE vacuum_seal_log ADD COLUMN use_by_date TEXT');
  }

  // shopping_list_items migrations
  const _slCols = await db.all('PRAGMA table_info(shopping_list_items)');
  const _slColNames = _slCols.map(c => c.name);
  if (!_slColNames.includes('product_id'))
    await db.run('ALTER TABLE shopping_list_items ADD COLUMN product_id TEXT');
  if (!_slColNames.includes('unit'))
    await db.run('ALTER TABLE shopping_list_items ADD COLUMN unit TEXT');
  if (!_slColNames.includes('store_section'))
    await db.run('ALTER TABLE shopping_list_items ADD COLUMN store_section TEXT');
  if (!_slColNames.includes('list_id'))
    await db.run('ALTER TABLE shopping_list_items ADD COLUMN list_id TEXT');

  // inventory_items migrations
  const _invCols2 = await db.all('PRAGMA table_info(inventory_items)');
  const _invColNames = _invCols2.map(c => c.name);
  if (!_invColNames.includes('product_id'))
    await db.run('ALTER TABLE inventory_items ADD COLUMN product_id TEXT');
  if (!_invColNames.includes('product_image_url'))
    await db.run('ALTER TABLE inventory_items ADD COLUMN product_image_url TEXT');
  if (!_invColNames.includes('storage_location')) {
    await db.run(
      "ALTER TABLE inventory_items ADD COLUMN storage_location TEXT NOT NULL DEFAULT 'pantry'"
    );
    // Migrate from storage_type into storage_location
    await db.run(`UPDATE inventory_items SET storage_location = CASE
      WHEN storage_type IN ('fridge', 'refrigerator') THEN 'refrigerator'
      WHEN storage_type IN ('freezer', 'frozen', 'vacuum-frozen') THEN 'freezer'
      WHEN storage_type = 'pantry' THEN 'pantry'
      ELSE 'pantry'
    END`);
  }
  if (!_invColNames.includes('prep_method')) {
    await db.run("ALTER TABLE inventory_items ADD COLUMN prep_method TEXT NOT NULL DEFAULT 'none'");
  }

  // vacuum_seal_log migrations
  const _vsCols2 = await db.all('PRAGMA table_info(vacuum_seal_log)');
  const _vsColNames = _vsCols2.map(c => c.name);
  if (!_vsColNames.includes('product_id'))
    await db.run('ALTER TABLE vacuum_seal_log ADD COLUMN product_id TEXT');
  if (!_vsColNames.includes('product_image_url'))
    await db.run('ALTER TABLE vacuum_seal_log ADD COLUMN product_image_url TEXT');

  // bulk_buy_items migrations
  const _bbCols = await db.all('PRAGMA table_info(bulk_buy_items)');
  if (!_bbCols.find(c => c.name === 'product_id'))
    await db.run('ALTER TABLE bulk_buy_items ADD COLUMN product_id TEXT');
  if (!_bbCols.find(c => c.name === 'product_image_url'))
    await db.run('ALTER TABLE bulk_buy_items ADD COLUMN product_image_url TEXT');
};
