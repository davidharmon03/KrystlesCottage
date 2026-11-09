const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// Opens the database and makes sure every section's tables exist.
//
// Each section keeps its own tables in server/schema/<section>.js and its own
// starter data in server/seeds/. To add or change a table, edit only that
// section's file. New sections go at the end of SECTIONS.

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data.db');
// Ensure the directory exists before SQLite tries to open it
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const SECTIONS = [
  'accounts',
  'groups',
  'kitchen',
  'corner',
  'pantry',
  'garden',
  'equipment',
  'gallery',
  'notifications',
  'swaps',
  'suggestions',
  'orders',
  'chat',
];

const SEEDS = ['sample-data', 'superadmin', 'products', 'plant-guides'];

let _dbPromise = null;

async function getDb() {
  if (!_dbPromise) _dbPromise = _init();
  return _dbPromise;
}

async function _init() {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.run('PRAGMA journal_mode = WAL');
  await db.run('PRAGMA foreign_keys = ON');

  for (const section of SECTIONS) {
    await require(`./schema/${section}`)(db);
  }

  try {
    await db.run('PRAGMA foreign_keys = OFF');
    for (const seed of SEEDS) {
      await require(`./seeds/${seed}`)(db);
    }
  } catch (e) {
    console.warn('[db] Seed warning (non-fatal):', e.message);
  } finally {
    await db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

module.exports = { getDb };
