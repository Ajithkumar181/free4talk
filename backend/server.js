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
  getUserStatus
} = require('./routes/userstatus');

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

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id, 'Transport:', socket.conn.transport.name);

  socket.on('user-online', async (user_id) => {
  console.log(`🟢 User ${user_id} is online`);
  await setUserOnline(user_id);
  
  // Fetch additional user status info from DB (example)
  const userStatus = await getUserStatus(user_id);

  const payload = {
    user_id,
    is_online: true,
    status_message: userStatus.status_message || '',   // custom status message
    last_active_at: userStatus.last_active_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  // Send update to self
  socket.emit('user-status-update', payload);

  // Broadcast to others
  socket.broadcast.emit('user-status-update', payload);
});

socket.on('user-offline', async (user_id) => {
  console.log(`🔴 User ${user_id} is offline`);
  await setUserOffline(user_id);
  
  const payload = {
    user_id,
    is_online: false,
    status_message: '',            // offline usually no status
    last_active_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Send update to self
  socket.emit('user-status-update', payload);

  // Broadcast to others
  socket.broadcast.emit('user-status-update', payload);
});

  socket.on('heartbeat', async (user_id) => {
    console.log(`❤️ Heartbeat from ${user_id}`);
    await updateLastActive(user_id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    // Optional: mark user offline if needed here
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
