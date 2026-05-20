/**
 * One-time script to promote a user to superadmin.
 * Usage: node server/scripts/make-superadmin.js <email>
 * Example: node server/scripts/make-superadmin.js davidharmon03@gmail.com
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { getDb } = require('../db');

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node make-superadmin.js <email>');
    process.exit(1);
  }

  const db = await getDb();
  const user = await db.get('SELECT id, name, email, role FROM users WHERE email = ?', [email.toLowerCase()]);

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  if (user.role === 'superadmin') {
    console.log(`${user.name} (${user.email}) is already a superadmin.`);
    process.exit(0);
  }

  await db.run("UPDATE users SET role = 'superadmin' WHERE id = ?", [user.id]);
  console.log(`✅ Done! ${user.name} (${user.email}) is now a superadmin.`);
  console.log(`They can log in and will be redirected to /admin automatically.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
