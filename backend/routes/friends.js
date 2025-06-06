const express = require('express');
const router = express.Router();
const db = require('../db'); // your MySQL connection

//### 1. Send Friend Request
router.post('/send-request', async (req, res) => {
  const { userId, friendId } = req.body;

  if (userId === friendId) {
    return res.status(400).json({ message: 'You cannot send a request to yourself.' });
  }

  try {
    // Check if both users exist
    const [userA] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
    const [userB] = await db.execute('SELECT id FROM users WHERE id = ?', [friendId]);

    if (userA.length === 0 || userB.length === 0) {
      return res.status(400).json({ message: 'One or both users do not exist.' });
    }

    // Check if a friend request or friendship already exists (in either direction)
    const [rows] = await db.execute(
      `SELECT * FROM friends 
       WHERE (user_id = ? AND friend_id = ?)
          OR (user_id = ? AND friend_id = ?)`,
      [userId, friendId, friendId, userId]
    );

    if (rows.length > 0) {
      return res.status(400).json({ message: 'Friend request or friendship already exists.' });
    }

    // Insert new friend request with 'pending' status
    await db.execute(
      `INSERT INTO friends (user_id, friend_id, status)
       VALUES (?, ?, 'pending')`,
      [userId, friendId]
    );

    return res.status(200).json({ message: 'Friend request sent.' });

  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});



//### 2. Accept Friend Request
router.post('/accept-request', async (req, res) => {
  const { userId, friendId } = req.body; // userId = B (accepter), friendId = A (request sender)

  if (userId === friendId) {
    return res.status(400).json({ message: 'Invalid operation.' });
  }

  try {
    // Check if the friend request exists and is pending (from friendId -> userId)
    const [rows] = await db.execute(
      `SELECT * FROM friends 
       WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
      [friendId, userId]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No pending friend request found.' });
    }

    // Update the status to 'accepted' for the existing request
    await db.execute(
      `UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?`,
      [friendId, userId]
    );

    // Optional: Insert reciprocal friendship record (userId -> friendId)
    // Check if reciprocal record exists first
    const [reciprocal] = await db.execute(
      `SELECT * FROM friends WHERE user_id = ? AND friend_id = ?`,
      [userId, friendId]
    );

    if (reciprocal.length === 0) {
      await db.execute(
        `INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')`,
        [userId, friendId]
      );
    } else {
      // If reciprocal exists but not accepted, update it
      await db.execute(
        `UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?`,
        [userId, friendId]
      );
    }

    return res.status(200).json({ message: 'Friend request accepted.' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});


//### 3. Block/Unblock Users
router.post('/block-unblock', async (req, res) => {
  const { userId, targetId, action } = req.body;

  try {
    // Step 1: Check if both users exist
    const [users] = await db.execute(
      'SELECT id FROM users WHERE id IN (?, ?)',
      [userId, targetId]
    );
    if (users.length !== 2) {
      return res.status(400).json({ message: 'One or both users do not exist.' });
    }

    if (action === 'block') {
      // Check if record exists
      const [existing] = await db.execute(
        'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?',
        [userId, targetId]
      );

      if (existing.length > 0) {
        // Update existing record to blocked
        await db.execute(
          'UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?',
          ['blocked', userId, targetId]
        );
      } else {
        // Insert new record with blocked status
        await db.execute(
          'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
          [userId, targetId, 'blocked']
        );
      }

      return res.status(200).json({ message: 'User blocked successfully.' });

    } else if (action === 'unblock') {
      // Option 1: Delete the block record
      // Option 2: Update status to something else, e.g. 'pending' or remove record
      // Here we delete the record

      await db.execute(
        'DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = ?',
        [userId, targetId, 'blocked']
      );

      return res.status(200).json({ message: 'User unblocked successfully.' });

    } else {
      return res.status(400).json({ message: 'Invalid action.' });
    }
  } catch (error) {
    console.error('Error in block/unblock:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});


//### 4. Fetch Mutual Friends and Friend Lists
router.get('/friends/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.profile_pic_url
       FROM friends f
       JOIN users u ON (u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END)
       WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'`,
      [userId, userId, userId]
    );

    return res.status(200).json({ friends: rows });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});


//### 5. Control Chat Permissions Based on Friendships
// POST /api/chat/can-chat
router.post('/can-chat', async (req, res) => {
  const { userA, userB } = req.body;

  if (!userA || !userB) {
    return res.status(400).json({ error: 'Missing user IDs' });
  }

  try {
    // Check for accepted friendship
    const [friends] = await db.query(
      `SELECT * FROM friends
       WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
       AND status = 'accepted'`,
      [userA, userB, userB, userA]
    );

    // Check for block status
    const [blocked] = await db.query(
      `SELECT * FROM friends
       WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
       AND status = 'blocked'`,
      [userA, userB, userB, userA]
    );

    if (friends.length > 0 && blocked.length === 0) {
      return res.json({ canChat: true });
    } else {
      return res.status(403).json({ canChat: false, message: 'Chat not allowed' });
    }
  } catch (err) {
    console.error('Error checking chat permission:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
