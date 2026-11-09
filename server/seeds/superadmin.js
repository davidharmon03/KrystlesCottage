async function _seedSuperadmin(db) {
  const ADMIN_EMAIL = 'davidharmon03@gmail.com';
  const existing = await db.get('SELECT id, role, account_tier FROM users WHERE email = ?', [
    ADMIN_EMAIL,
  ]);

  // Never create this account with a password written in the code: the repo is
  // public. On a fresh database, register normally, then run
  // scripts/make-superadmin.js. This only promotes an account that already exists.
  if (!existing) return;
  if (existing.role !== 'superadmin' || existing.account_tier !== 'paid') {
    await db.run(
      `UPDATE users SET role = 'superadmin', must_change_password = 0, account_tier = 'paid', email_verified = 1 WHERE email = ?`,
      [ADMIN_EMAIL]
    );
    console.log('Superadmin seeded: davidharmon03@gmail.com');
  }
}

module.exports = _seedSuperadmin;
