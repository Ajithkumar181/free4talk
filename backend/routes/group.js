const express = require('express');
const router = express.Router();
const db = require('../db'); // your MySQL connection

router.post('/create', async (req, res) => {
  const { group_name, group_pic_url = null, created_by, initial_members } = req.body;

  // Validation: group_name and created_by required
  if (!group_name || !created_by) {
    return res.status(400).json({ error: '`group_name` and `created_by` are required fields.' });
  }

  if (initial_members !== undefined && !Array.isArray(initial_members)) {
    return res.status(400).json({ error: '`initial_members` must be an array if provided.' });
  }

  if (Array.isArray(initial_members)) {
    for (const member of initial_members) {
      if (typeof member.user_id !== 'number' || member.user_id === created_by) {
        return res.status(400).json({ error: 'Each member must have a valid numeric user_id different from the creator.' });
      }
    }
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Insert group
    const [groupResult] = await connection.execute(
      `INSERT INTO \`groups\` (group_name, group_pic_url, created_by, created_at)
       VALUES (?, ?, ?, NOW())`,
      [group_name, group_pic_url, created_by]
    );

    const group_id = groupResult.insertId;

    // Prepare members list: creator as admin
    const membersToInsert = [
      [group_id, created_by, 'admin', new Date()]
    ];

    // Combine all user_ids to remove from previous groups (creator + initial members)
    const usersToRemove = new Set([created_by]);
    if (Array.isArray(initial_members)) {
      for (const member of initial_members) {
        usersToRemove.add(member.user_id);
      }
    }

    // Delete these users from any previous groups
    const userIdsArray = Array.from(usersToRemove);
    if (userIdsArray.length > 0) {
      await connection.query(
        `DELETE FROM group_members WHERE user_id IN (?)`,
        [userIdsArray]
      );
    }

    // Add initial members (optional)
    if (Array.isArray(initial_members)) {
      for (const member of initial_members) {
        membersToInsert.push([
          group_id,
          member.user_id,
          member.role && ['admin', 'co-admin', 'member', 'guest'].includes(member.role) ? member.role : 'member',
          new Date()
        ]);
      }
    }

    if (membersToInsert.length > 0) {
      await connection.query(
        `INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES ?`,
        [membersToInsert]
      );
    }

    await connection.commit();

    res.status(201).json({ group_id });
  } catch (err) {
    await connection.rollback();
    console.error('Create Group Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

module.exports = router;
