const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../db');
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/google-login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'ID Token required' });

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleEmail = payload.email;
    const googleName = payload.name;
    const profilePic = payload.picture;

    // Check if user already exists
    const [rows] = await pool.query(
      'SELECT id, username, email, profile_pic_url FROM users WHERE email = ?',
      [googleEmail]
    );

    let userId;
    let username;

    if (rows.length === 0) {
      // Insert new user
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password_hash, profile_pic_url) VALUES (?, ?, ?, ?)',
        [googleName, googleEmail, '', profilePic]
      );
      userId = result.insertId;
      username = googleName;
    } else {
      // User exists
      userId = rows[0].id;
      username = rows[0].username;

      // Optional: Update profile_pic_url if it's missing
      if (!rows[0].profile_pic_url && profilePic) {
        await pool.query(
          'UPDATE users SET profile_pic_url = ? WHERE id = ?',
          [profilePic, userId]
        );
      }
    }

    // Create JWT
    const token = jwt.sign({ id: userId, email: googleEmail }, JWT_SECRET, {
      expiresIn: '1h',
    });

    // Send response
    res.json({
      token,
      userId,
      username,
      email: googleEmail,
      profilePic,
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ error: 'Invalid ID token' });
  }
});


// Update department and year of a user by user id
router.put('/update-user-info', async (req, res) => {
  const { userId, dept, yr } = req.body;

  if (!userId || !dept || !yr) {
    return res.status(400).json({ error: 'User ID, department, and year are required.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE users SET dept = ?, yr = ? WHERE id = ?',
      [dept, yr, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'User info updated successfully.' });
  } catch (err) {
    console.error('Error updating user info:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
//### 4. **Fetch User Profile**
router.get('/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await pool.query(
      `SELECT id, username, email, profile_pic_url, status, dept, yr, last_online 
       FROM users WHERE id = ?`, 
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userProfile = rows[0];
    res.json({ user: userProfile });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await pool.query(
      `SELECT id, username, email, profile_pic_url, status, dept, yr, last_online 
       FROM users WHERE id = ?`, 
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userProfile = rows[0];
    res.json({ user: userProfile });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

//### 5. **Update User Profile**
router.put('/update-user/:id', async (req, res) => {
  const userId = req.params.id;
  const allowedFields = ['username', 'profile_pic_url', 'status', 'dept', 'yr'];
  const updates = [];
  const values = [];

  // Collect only fields that are provided (not undefined)
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  // If no updatable fields provided, respond with error
  if (updates.length === 0) {
    return res.status(400).json({ error: 'At least one field must be provided for update' });
  }

  values.push(userId); // add userId for WHERE clause

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  try {
    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found or no changes made' });
    }

    res.json({ message: 'User profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


//6. **Track User Activity**
// Middleware to update last_online
const updateLastOnline = async (req, res, next) => {
  const userId = req.body.userId || req.userId; // fallback if JWT middleware used

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE users SET last_online = NOW() WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Updated last_online for user ID ${userId}`);
    next();
  } catch (error) {
    console.error('Error updating last_online:', error);
    return res.status(500).json({ error: 'Database error' });
  }
};

// ✅ Final route that tracks activity
router.post('/activity', updateLastOnline, (req, res) => {
  return res.status(200).json({ message: 'User activity recorded successfully' });
});


//7. **User Status Updates**
router.post('/status', async (req, res) => {
  const { userId, status } = req.body;
  if (!userId || !status) {
    return res.status(400).json({ error: 'userId and status are required' });
  }

  try {
    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    res.status(200).json({ message: 'User status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

//10. **User Search / Filtering**
router.get('/search', async (req, res) => {
  try {
    const { username, dept, yr, status } = req.query;

    // Base query
    let sql = `SELECT id, username, email, dept, yr, status FROM users WHERE 1=1`;
    const params = [];

    // Add filters only if present
    if (username) {
      sql += ` AND username LIKE ?`;
      params.push(`%${username}%`);
    }
    if (dept) {
      sql += ` AND dept = ?`;
      params.push(dept);
    }
    if (yr) {
      sql += ` AND yr = ?`;
      params.push(yr);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    // Execute query
    const [rows] = await pool.execute(sql, params);
    res.json({ users: rows });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//11. **Account Creation Timestamp**
router.get('/:id/profile', async (req, res) => {
  try {
    const userId = req.params.id;

    const sql = `SELECT username, email, dept, yr, status, created_at 
                 FROM users WHERE id = ?`;
    const [rows] = await pool.execute(sql, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    res.json({
      username: user.username,
      email: user.email,
      dept: user.dept,
      yr: user.yr,
      status: user.status,
      memberSince: user.created_at // timestamp to show “Member since”
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
