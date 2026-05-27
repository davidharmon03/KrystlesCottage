const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { getDb } = require('../db');
const { superadminMiddleware, twoFaMiddleware } = require('../middleware/auth');

// All admin routes require superadmin role + valid 2FA session
router.use(superadminMiddleware);
router.use(twoFaMiddleware);

// POST /api/admin/users — create a new user (superadmin only)
// Returns the generated temp password so the superadmin can share credentials.
router.post('/users', async (req, res) => {
  try {
    const db = await getDb();
    const { name, email, role = 'member' } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!['member', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Only superadmins can assign the superadmin role (middleware already enforces
    // that callers are superadmins, but we guard explicitly for clarity)
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmins can create superadmin accounts' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Generate a readable temporary password
    const tempPassword = crypto.randomBytes(5).toString('hex').toUpperCase() + '!k9';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const id = uuidv4();
    const account_tier = ['admin', 'superadmin'].includes(role) ? 'paid' : 'free';

    await db.run(
      `INSERT INTO users (id, name, email, password, role, account_tier, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [id, name.trim(), email.toLowerCase().trim(), passwordHash, role, account_tier]
    );

    const created = await db.get(
      'SELECT id, name, email, role, account_tier, must_change_password, created_at FROM users WHERE id = ?',
      [id]
    );

    res.status(201).json({ user: created, tempPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/admin/stats — platform overview
router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    const totalUsers   = await db.get("SELECT COUNT(*) as count FROM users WHERE role != 'superadmin'");
    const paidUsers    = await db.get("SELECT COUNT(*) as count FROM users WHERE plan = 'pro' AND role != 'superadmin'");
    const freeUsers    = await db.get("SELECT COUNT(*) as count FROM users WHERE plan = 'free' AND role != 'superadmin'");
    const totalGroups  = await db.get("SELECT COUNT(*) as count FROM groups");
    const totalMembers = await db.get("SELECT COUNT(*) as count FROM group_members");
    const newThisWeek  = await db.get("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days') AND role != 'superadmin'");

    res.json({
      totalUsers:   totalUsers.count,
      paidUsers:    paidUsers.count,
      freeUsers:    freeUsers.count,
      totalGroups:  totalGroups.count,
      totalMembers: totalMembers.count,
      newThisWeek:  newThisWeek.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// GET /api/admin/users — all users with group info
router.get('/users', async (req, res) => {
  try {
    const db = await getDb();
    const { search, plan, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    const params = [];

    if (search) {
      conditions.push("(u.name LIKE ? OR u.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (plan && plan !== 'all') {
      conditions.push("u.plan = ?");
      params.push(plan);
    }

    const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const users = await db.all(`
      SELECT
        u.id, u.name, u.email, u.plan, u.role, u.created_at,
        u.must_change_password,
        u.stripe_customer_id,
        COALESCE(
          (SELECT g.name FROM groups g WHERE g.owner_id = u.id LIMIT 1),
          (SELECT g.name FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = u.id AND g.owner_id != u.id LIMIT 1)
        ) AS group_name,
        CASE
          WHEN (SELECT 1 FROM groups WHERE owner_id = u.id LIMIT 1) IS NOT NULL THEN 'owner'
          WHEN (SELECT 1 FROM group_members WHERE user_id = u.id LIMIT 1) IS NOT NULL THEN 'member'
          ELSE NULL
        END AS group_role
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const total = await db.get(`
      SELECT COUNT(*) as count FROM users u ${where}
    `, params);

    res.json({ users, total: total.count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// GET /api/admin/users/:id — single user detail with all group members
router.get('/users/:id', async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get(`
      SELECT u.id, u.name, u.email, u.plan, u.role, u.created_at,
             u.stripe_customer_id, u.stripe_subscription_id,
             g.id AS group_id, g.name AS group_name, g.invite_code
      FROM users u
      LEFT JOIN groups g ON g.owner_id = u.id
      WHERE u.id = ?
    `, [req.params.id]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get group members if user owns a group
    let members = [];
    if (user.group_id) {
      members = await db.all(`
        SELECT u.id, u.name, u.email, u.plan, gm.joined_at
        FROM group_members gm
        JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = ?
        ORDER BY gm.joined_at ASC
      `, [user.group_id]);
    }

    // Get groups user is a member of (not owner)
    const memberOf = await db.all(`
      SELECT g.id, g.name, gm.joined_at,
             u.name AS owner_name, u.email AS owner_email
      FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      JOIN users u ON u.id = g.owner_id
      WHERE gm.user_id = ? AND g.owner_id != ?
      ORDER BY gm.joined_at DESC
    `, [user.id, user.id]);

    res.json({ user, members, memberOf });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

// PUT /api/admin/users/:id/plan — change user plan (superadmin only)
router.put('/users/:id/plan', async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Only superadmins can change subscription plans' });
    const db = await getDb();
    const { plan } = req.body;
    if (!['free', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    await db.run("UPDATE users SET plan = ? WHERE id = ?", [plan, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// PUT /api/admin/users/:id/role — change user role (legacy)
router.put('/users/:id/role', async (req, res) => {
  try {
    const db = await getDb();
    const { role } = req.body;
    if (!['member', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    await db.run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const db = await getDb();
    const { role } = req.body;
    if (!['member', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    // Only superadmins may assign the superadmin role
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmins can assign the superadmin role' });
    }
    const user = await db.get("SELECT role FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Promote admins/superadmins to paid tier automatically
    const account_tier = ['admin', 'superadmin'].includes(role) ? 'paid' : undefined;
    if (account_tier) {
      await db.run("UPDATE users SET role = ?, account_tier = ? WHERE id = ?", [role, account_tier, req.params.id]);
    } else {
      await db.run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/admin/users/:id — delete user account
router.delete('/users/:id', async (req, res) => {
  try {
    const db = await getDb();
    // Don't allow deleting superadmins
    const user = await db.get("SELECT role FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'superadmin') return res.status(403).json({ error: 'Cannot delete superadmin accounts' });

    await db.run("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/groups — all groups with owner info and per-group member list
router.get('/groups', async (req, res) => {
  try {
    const db = await getDb();

    const groups = await db.all(`
      SELECT g.id, g.name, g.invite_code, g.max_members, g.created_at,
             u.id AS owner_id, u.name AS owner_name, u.email AS owner_email,
             (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
      FROM groups g
      JOIN users u ON u.id = g.owner_id
      ORDER BY g.created_at DESC
    `);

    // Fetch all members for all groups in one query
    const allMembers = await db.all(`
      SELECT gm.group_id, gm.joined_at,
             u.id, u.name, u.email
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      ORDER BY gm.joined_at ASC
    `);

    const membersByGroup = {};
    for (const m of allMembers) {
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
      membersByGroup[m.group_id].push(m);
    }

    const result = groups.map(g => {
      const raw = membersByGroup[g.id] || [];
      const members = raw.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        group_role: m.id === g.owner_id ? 'owner' : 'member',
        joined_at: m.joined_at,
      }));
      // owner first
      members.sort((a, b) => (a.group_role === 'owner' ? -1 : 1));

      return {
        id: g.id,
        name: g.name,
        invite_code: g.invite_code,
        owner_name: g.owner_name,
        owner_email: g.owner_email,
        member_count: g.member_count,
        max_members: g.max_members,
        created_at: g.created_at,
        members,
      };
    });

    res.json(result