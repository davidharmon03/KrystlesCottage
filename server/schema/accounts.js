// Accounts: users, sign-in tokens, password resets, two-factor codes.
// Run once at start-up by server/db.js. Each step only adds what is missing,
// so it is safe to run on a database that already has it.

module.exports = async function setup(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // users migrations
  const _userCols = await db.all('PRAGMA table_info(users)');
  if (!_userCols.find(c => c.name === 'social_links'))
    await db.run("ALTER TABLE users ADD COLUMN social_links TEXT DEFAULT '{}'");
  if (!_userCols.find(c => c.name === 'avatar_path'))
    await db.run('ALTER TABLE users ADD COLUMN avatar_path TEXT');
  if (!_userCols.find(c => c.name === 'role'))
    await db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member'");
  if (!_userCols.find(c => c.name === 'account_tier'))
    await db.run("ALTER TABLE users ADD COLUMN account_tier TEXT NOT NULL DEFAULT 'free'");
  if (!_userCols.find(c => c.name === 'email_verified'))
    await db.run('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0');
  if (!_userCols.find(c => c.name === 'email_verification_token'))
    await db.run('ALTER TABLE users ADD COLUMN email_verification_token TEXT');
  if (!_userCols.find(c => c.name === 'email_verification_expires'))
    await db.run('ALTER TABLE users ADD COLUMN email_verification_expires TEXT');
  // Ensure all admin/superadmin users are on the paid tier
  await db.run(
    "UPDATE users SET account_tier = 'paid' WHERE role IN ('admin', 'superadmin') AND account_tier != 'paid'"
  );

  // Security: password reset tokens + refresh tokens
  await db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used       INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked    INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Notification preferences JSON column on users
  try {
    await db.run(`ALTER TABLE users ADD COLUMN notification_prefs TEXT DEFAULT '{}'`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
  }

  // Group Sync Mode
  try {
    await db.run(`ALTER TABLE users ADD COLUMN sync_mode TEXT DEFAULT 'auto'`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
  }

  // Security: must_change_password flag on users
  try {
    await db.run(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
  }

  // Phone number field on users
  try {
    await db.run(`ALTER TABLE users ADD COLUMN phone TEXT`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
  }

  // Payment Integration: plan + Stripe fields on users
  try {
    await db.run(`ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
  }
  try {
    await db.run(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
  }
  try {
    await db.run(`ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
  }

  // 2FA codes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS two_fa_codes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code       TEXT NOT NULL,
      purpose    TEXT NOT NULL DEFAULT 'login',
      expires_at DATETIME NOT NULL,
      used       INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS two_fa_sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT NOT NULL UNIQUE,
      purpose    TEXT NOT NULL DEFAULT 'login',
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
