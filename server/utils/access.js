// Who may do what — the one shared set of permission checks.
//
// Every section uses these instead of writing its own copy. (Nine slightly
// different copies used to exist; one route forgot the check entirely.)
// In this app a group's "admin" is its owner: groups.owner_id.

const { getDb } = require('../db');

// True when the user belongs to the group.
async function isGroupMember(groupId, userId) {
  if (!groupId || !userId) return false;
  const db = await getDb();
  const row = await db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [
    groupId,
    userId,
  ]);
  return !!row;
}

// True when the user owns (administers) the group.
async function isGroupOwner(groupId, userId) {
  if (!groupId || !userId) return false;
  const db = await getDb();
  const row = await db.get('SELECT id FROM groups WHERE id = ? AND owner_id = ?', [
    groupId,
    userId,
  ]);
  return !!row;
}

// Runs fn() only for a group member; otherwise answers 403.
async function withGroupMember(req, res, groupId, fn) {
  if (!(await isGroupMember(groupId, req.user.id))) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }
  return fn();
}

module.exports = { isGroupMember, isGroupOwner, withGroupMember };
