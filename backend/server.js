require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const userRoutes = require('./routes/users');
const { 
  router: userStatusRouter,
  setUserOnline,
  setUserOffline,
  updateLastActive,
  getUserStatus,
  getUsersOnline 
} = require('./routes/userstatus');
const friendRoutes = require('./routes/friends');
const groupRoutes = require('./routes/group');
const groupmemberRoutes = require('./routes/groupmember');

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Prefer websocket first, fallback to polling
});

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: 'POST,GET,PUT,DELETE,OPTIONS',
  credentials: true,
}));
app.use(express.json());
app.use('/users', userRoutes);
app.use('/userstatus', userStatusRouter);
app.use('/friends', friendRoutes);
app.use('/group', groupRoutes);
app.use('/groupMembers', groupmemberRoutes);

io.on('connection', async (socket) => {
  console.log('🔌 New client connected:', socket.id, 'Transport:', socket.conn.transport.name);

  try {
    // Fetch all users currently online from your DB
    const onlineUsers = await getUsersOnline(); // should return array of user status objects

    // Emit the full online users list to the new client only
    socket.emit('online-users-list', onlineUsers);
  } catch (err) {
    console.error('Error fetching online users:', err);
  }

  socket.on('user-online', async (user_id) => {
    try {
      console.log(`🟢 User ${user_id} is online`);
      await setUserOnline(user_id);

      // Fetch additional user status info from DB
      const userStatus = await getUserStatus(user_id);

      const payload = {
        user_id,
        is_online: true,
        status_message: userStatus.status_message || '',
        last_active_at: userStatus.last_active_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Send update to self
      socket.emit('user-status-update', payload);
      // Broadcast to others
      socket.broadcast.emit('user-status-update', payload);
    } catch (err) {
      console.error('Error handling user-online:', err);
    }
  });

  socket.on('user-offline', async (user_id) => {
    try {
      console.log(`🔴 User ${user_id} is offline`);
      await setUserOffline(user_id);

      const payload = {
        user_id,
        is_online: false,
        status_message: '',
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      socket.emit('user-status-update', payload);
      socket.broadcast.emit('user-status-update', payload);
    } catch (err) {
      console.error('Error handling user-offline:', err);
    }
  });

  socket.on('heartbeat', async (user_id) => {
    try {
      console.log(`❤️ Heartbeat from ${user_id}`);

      await updateLastActive(user_id);

      const userStatus = await getUserStatus(user_id);

      if (!userStatus) {
        console.warn(`User status not found for user_id ${user_id}`);
        return;
      }

      const payload = {
        user_id,
        is_online: userStatus.is_online,
        status_message: userStatus.status_message || '',
        last_active_at: userStatus.last_active_at ? userStatus.last_active_at.toISOString() : new Date().toISOString(),
        updated_at: userStatus.updated_at ? userStatus.updated_at.toISOString() : new Date().toISOString(),
      };

      socket.emit('user-status-update', payload);
      socket.broadcast.emit('user-status-update', payload);
    } catch (err) {
      console.error('Error handling heartbeat:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    // Optional: handle user offline logic if needed here
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
