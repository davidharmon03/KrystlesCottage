// Shared group helpers.

const DEFAULT_MAX_MEMBERS = 5;

// True when the group has a free member slot. Groups can buy extra slots, so the
// limit comes from groups.max_members, never a fixed number.
async function groupHasRoom(db, groupId) {
  const row = await db.get(
    `SELECT g.max_members,
            (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
     FROM groups g WHERE g.id = ?`,
    [groupId]
  );
  if (!row) return false;
  return row.member_count < (row.max_members || DEFAULT_MAX_MEMBERS);
}

module.exports = { groupHasRoom, DEFAULT_MAX_MEMBERS };
