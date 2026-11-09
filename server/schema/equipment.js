// Equipment: catalog, group gear, container fleet.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS equipment_catalog (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      category       TEXT NOT NULL,
      brand          TEXT,
      description    TEXT,
      image_url      TEXT,
      purchase_url   TEXT,
      is_recommended INTEGER DEFAULT 0,
      created_at     TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS group_equipment (
      id              TEXT PRIMARY KEY,
      group_id        TEXT NOT NULL,
      catalog_item_id TEXT,
      custom_name     TEXT,
      quantity        INTEGER DEFAULT 1,
      owner_user_id   TEXT,
      condition       TEXT DEFAULT 'good',
      notes           TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id)        REFERENCES groups(id),
      FOREIGN KEY (catalog_item_id) REFERENCES equipment_catalog(id),
      FOREIGN KEY (owner_user_id)   REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS container_fleet (
      id             TEXT PRIMARY KEY,
      group_id       TEXT NOT NULL,
      container_type TEXT NOT NULL,
      supply_type    TEXT DEFAULT 'container',
      size_capacity  TEXT,
      material       TEXT,
      description    TEXT,
      purchase_url   TEXT,
      created_at     TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );
  `);
};
