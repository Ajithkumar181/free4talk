// Load .env variables at the very start
require('dotenv').config();

const express = require('express'); 
const userRoutes = require('./routes/users');
const cors = require('cors');
const app = express();

// Allow requests from your frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL, // use env or fallback
  methods: 'POST,GET,PUT,DELETE,OPTIONS',
  credentials: true,
}));

app.use(express.json());
app.use('/users', userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
