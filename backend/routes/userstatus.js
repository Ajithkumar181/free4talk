const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ Shared logic (used by both HTTP & Socket.IO)
//### ✅ Use Case 1: Set Online/Offline Status
async function setUserOnline(user_id) {
  if (!user_id) throw new Error('user_id is required');

  return await db.execute(
    `INSERT INTO user_status (user_id, is_online, last_active_at, updated_at)
     VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       is_online = 1,
       last_active_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`,
    [user_id]
  );
}

async function setUserOffline(user_id) {
  if (!user_id) throw new Error('user_id is required');

  return await db.execute(
    `INSERT INTO user_status (user_id, is_online, updated_at)
     VALUES (?, 0, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       is_online = 0,
       updated_at = CURRENT_TIMESTAMP`,
    [user_id]
  );
}

// ✅ HTTP Route – Set Online
//### ✅ Use Case 1: Set Online/Offline Status
router.post('/online', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  try {
    const [result] = await setUserOnline(user_id);
    res.json({ message: 'User set to online', affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ HTTP Route – Set Offline
router.post('/offline', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  try {
    const [result] = await setUserOffline(user_id);
    res.json({ message: 'User set to offline', affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//### ✅ Use Case 2: Update Last Active Timestamp
async function updateLastActive(user_id) {
  if (!user_id) throw new Error('user_id is required');

  return await db.execute(
    `INSERT INTO user_status (user_id, last_active_at, updated_at)
     VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       last_active_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`,
    [user_id]
  );
}

// HTTP POST route to update last active timestamp
router.post('/last-active', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  try {
    const [result] = await updateLastActive(user_id);
    res.json({ message: 'Last active updated', affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//### ✅ Use Case 3: Set Custom Status Message
async function setStatusMessage(user_id, status_message) {
  if (!user_id) throw new Error('user_id is required');
  if (typeof status_message !== 'string') throw new Error('status_message must be a string');

  return await db.execute(
    `INSERT INTO user_status (user_id, status_message, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       status_message = VALUES(status_message),
       updated_at = CURRENT_TIMESTAMP`,
    [user_id, status_message]
  );
}

// HTTP Route — Update Custom Status Message
router.post('/status-message', async (req, res) => {
  const { user_id, status_message } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  if (!status_message) return res.status(400).json({ error: 'status_message is required' });

  try {
    const [result] = await setStatusMessage(user_id, status_message);
    res.json({ message: 'Status message updated', affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//after socket io(online/offline) used to emit to others
async function getUserStatus(user_id) {
  const sql = `
    SELECT user_id, is_online, last_active_at, status_message, updated_at
    FROM user_status
    WHERE user_id = ?
  `;

  try {
    const [rows] = await db.execute(sql, [user_id]);
    if (rows.length > 0) {
      return rows[0];
    } else {
      return {
        user_id,
        is_online: 0,
        last_active_at: null,
        status_message: '',
        updated_at: null,
      };
    }
  } catch (error) {
    console.error('Error fetching user status:', error);
    throw error;
  }
}

//get all users
async function getUsersOnline() {
  try {
    const [rows] = await db.query(
      `SELECT user_id, is_online, status_message, last_active_at, updated_at
       FROM user_status
       WHERE is_online = 1`
    );
    // rows is an array of user status objects currently online
    return rows;
  } catch (error) {
    console.error('Error fetching online users:', error);
    return [];
  }
}


module.exports = {
  router,
  setUserOnline,
  setUserOffline,
  updateLastActive,
  setStatusMessage,
  getUserStatus,
  getUsersOnline 
};

