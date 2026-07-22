require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const noteRoutes = require('./routes/noteRoutes');
const aiRoutes   = require('./routes/aiRoutes');
const { registerChatHandlers } = require('./sockets/chatSocket');
const Room = require('./models/Room');

// Initialize database connection
connectDB();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

// Configure EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// API route mounts
app.use('/api/auth',  authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai',    aiRoutes);

// ── EJS Page Routes ───────────────────────────────────────────────────────────

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login — StudyRoom' });
});

app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up — StudyRoom' });
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: 'Dashboard — StudyRoom' });
});

// Room workspace — fetch room from DB so EJS can pre-populate name/topic/code
app.get('/room/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'name')
      .lean();

    if (!room) {
      return res.status(404).send('Room not found');
    }

    res.render('room', {
      title: `${room.name} — StudyRoom`,
      room,
    });
  } catch (err) {
    console.error('GET /room/:id error:', err);
    if (err.name === 'CastError') {
      return res.status(404).send('Room not found');
    }
    res.status(500).send('Server error');
  }
});

// Bind Socket.io events
registerChatHandlers(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ StudyRoom server listening on http://localhost:${PORT}`);
});
