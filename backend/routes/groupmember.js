const express = require('express');
const router = express.Router();
const pool = require('../db'); // <-- Make sure this is at the top and only once

// 1. Add user to group
router.post('/addUser', async (req, res) => {
  const { group_id, user_id, role = 'member' } = req.body;

  if (!group_id || !user_id) {
    return res.status(400).json({ error: 'group_id and user_id are required' });
  }

  try {
    // Step 1: Check if user already in the same group
    const [existingRows] = await pool.execute(
      `SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?`,
      [group_id, user_id]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ message: 'User is already a member of the group' });
    }

    // Step 2: Delete user membership from any other group(s)
    await pool.execute(
      `DELETE FROM group_members WHERE user_id = ?`,
      [user_id]
    );

    // Step 3: Insert user into the new group
    await pool.execute(
      `INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)`,
      [group_id, user_id, role]
    );

    console.log(`✅ User ${user_id} moved to group ${group_id} as ${role}`);

    return res.status(201).json({ message: 'User added to group successfully' });

  } catch (err) {
    console.error('❌ DB Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 2. Remove user from group (only admin/co-admin can remove)
router.delete('/removeUser', async (req, res) => {
  const { group_id, user_id_to_remove, requested_by } = req.body;

  if (!group_id || !user_id_to_remove || !requested_by) {
    return res.status(400).json({ error: 'group_id, user_id_to_remove, and requested_by are required' });
  }

  try {
    // Check if requester is admin or co-admin
    const [roleRows] = await pool.execute(
      `SELECT role FROM group_members WHERE group_id = ? AND user_id = ?`,
      [group_id, requested_by]
    );

    if (roleRows.length === 0) {
      return res.status(403).json({ error: 'Requesting user is not a member of the group' });
    }

    const requesterRole = roleRows[0].role;
    if (requesterRole !== 'admin' && requesterRole !== 'co-admin') {
      return res.status(403).json({ error: 'Only admin or co-admin can remove members' });
    }

    // Check if target user is in the group
    const [targetRows] = await pool.execute(
      `SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?`,
      [group_id, user_id_to_remove]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'User to remove is not in the group' });
    }

    // Delete user from group
    await pool.execute(
      `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`,
      [group_id, user_id_to_remove]
    );

    console.log(`🚫 User ${user_id_to_remove} was removed from group ${group_id} by user ${requested_by}`);

    return res.status(200).json({ message: 'User removed from group successfully' });

  } catch (err) {
    console.error('❌ DB Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. List members of a group with pagination
router.get('/members', async (req, res) => {
  const group_id = req.query.group_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (!group_id) {
    return res.status(400).json({ error: 'group_id is required' });
  }

  if (limit < 1 || offset < 0) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  try {
    // Pass group_id as parameter, but inject limit & offset as numbers
    const [rows] = await pool.execute(
      `SELECT user_id, role, joined_at
       FROM group_members
       WHERE group_id = ?
       ORDER BY joined_at ASC
       LIMIT ${limit} OFFSET ${offset}`,
      [group_id]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM group_members WHERE group_id = ?`,
      [group_id]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return res.json({
      page,
      limit,
      total_members: total,
      total_pages: totalPages,
      members: rows
    });

  } catch (err) {
    console.error('❌ DB Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 4. Update member role (only admin can update)
router.put('/updateRole', async (req, res) => {
  const { group_id, target_user_id, new_role, requested_by } = req.body;

  const validRoles = ['admin', 'co-admin', 'member', 'guest'];

  if (!group_id || !target_user_id || !new_role || !requested_by) {
    return res.status(400).json({ error: 'group_id, target_user_id, new_role, and requested_by are required' });
  }

  if (!validRoles.includes(new_role)) {
    return res.status(400).json({ error: 'Invalid role provided' });
  }

  try {
    const [requesterRows] = await pool.execute(
      `SELECT role FROM group_members WHERE group_id = ? AND user_id = ?`,
      [group_id, requested_by]
    );

    if (requesterRows.length === 0 || requesterRows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update roles' });
    }

    const [targetRows] = await pool.execute(
      `SELECT role FROM group_members WHERE group_id = ? AND user_id = ?`,
      [group_id, target_user_id]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'Target user is not in the group' });
    }

    const old_role = targetRows[0].role;

    await pool.execute(
      `UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?`,
      [new_role, group_id, target_user_id]
    );

    console.log(`🔁 Role of user ${target_user_id} in group ${group_id} updated from '${old_role}' to '${new_role}' by admin ${requested_by}`);

    return res.status(200).json({ message: 'Role updated successfully' });

  } catch (err) {
    console.error('❌ DB Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Fetch membership information
router.get('/membership', async (req, res) => {
  const { group_id, user_id } = req.query;

  if (!group_id || !user_id) {
    return res.status(400).json({ error: 'group_id and user_id are required' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT role, joined_at 
       FROM group_members 
       WHERE group_id = ? AND user_id = ?`,
      [group_id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User is not a member of the group' });
    }

    const { role, joined_at } = rows[0];

    return res.status(200).json({
      group_id: parseInt(group_id),
      user_id: parseInt(user_id),
      role,
      joined_at
    });

  } catch (err) {
    console.error('❌ DB Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
