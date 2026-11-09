// Garden: plants, harvests, seasonal calendar, plant guides, plots.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS garden_plants (
      id               TEXT PRIMARY KEY,
      group_id         TEXT NOT NULL,
      plant_name       TEXT NOT NULL,
      date_planted     TEXT NOT NULL,
      expected_harvest TEXT,
      status           TEXT DEFAULT 'growing',
      notes            TEXT,
      added_by         TEXT NOT NULL,
      created_at       TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (added_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS harvest_logs (
      id                 TEXT PRIMARY KEY,
      group_id           TEXT NOT NULL,
      plant_id           TEXT,
      plant_name         TEXT NOT NULL,
      harvest_date       TEXT NOT NULL,
      yield_amount       TEXT NOT NULL,
      notes              TEXT,
      added_to_inventory INTEGER DEFAULT 0,
      added_by           TEXT NOT NULL,
      created_at         TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (plant_id) REFERENCES garden_plants(id),
      FOREIGN KEY (added_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS seasonal_calendar (
      id          TEXT PRIMARY KEY,
      group_id    TEXT NOT NULL,
      title       TEXT NOT NULL,
      event_type  TEXT NOT NULL,
      start_date  TEXT NOT NULL,
      end_date    TEXT,
      description TEXT,
      added_by    TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (added_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS plant_guides (
      id                            INTEGER PRIMARY KEY AUTOINCREMENT,
      common_name                   TEXT NOT NULL,
      scientific_name               TEXT,
      type                          TEXT NOT NULL DEFAULT 'vegetable',
      description                   TEXT,
      planting_seasons              TEXT DEFAULT '[]',
      usda_zones                    TEXT,
      days_to_germinate             INTEGER,
      days_to_harvest               INTEGER,
      space_needed_sqft             REAL,
      spacing_between_plants_inches INTEGER,
      row_spacing_inches            INTEGER,
      sunlight                      TEXT DEFAULT 'full_sun',
      water_frequency               TEXT,
      soil_type                     TEXT,
      companion_plants              TEXT DEFAULT '[]',
      avoid_planting_with           TEXT DEFAULT '[]',
      tips                          TEXT,
      image_url                     TEXT,
      resource_links                TEXT DEFAULT '[]',
      created_at                    TEXT DEFAULT (datetime('now'))
    );
  `);

  // garden_plants migration: plant_guide_id FK
  const _gpCols = await db.all('PRAGMA table_info(garden_plants)');
  if (!_gpCols.find(c => c.name === 'plant_guide_id')) {
    await db.run('ALTER TABLE garden_plants ADD COLUMN plant_guide_id INTEGER');
  }

  // Garden Plots tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS garden_plots (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id     TEXT NOT NULL,
      name         TEXT NOT NULL,
      type         TEXT NOT NULL DEFAULT 'raised_bed',
      width        REAL,
      length       REAL,
      bucket_size  TEXT,
      bucket_count INTEGER DEFAULT 1,
      notes        TEXT,
      created_at   TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );
    CREATE TABLE IF NOT EXISTS garden_plot_cells (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      plot_id  INTEGER NOT NULL,
      cell_x   INTEGER NOT NULL,
      cell_y   INTEGER NOT NULL,
      label    TEXT,
      color    TEXT,
      FOREIGN KEY (plot_id) REFERENCES garden_plots(id) ON DELETE CASCADE
    );
  `);
};
