require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const noteRoutes = require('./routes/noteRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { registerChatHandlers } = require('./sockets/chatSocket');

// Initialize database connection
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configure EJS view engine and directory resolution
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Body parsing and static asset routing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// API route mounts
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiRoutes);

// EJS Page Route definitions
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'StudyRoom - Login' });
});

app.get('/signup', (req, res) => {
  res.render('signup', { title: 'StudyRoom - Signup' });
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: 'StudyRoom - Dashboard' });
});

app.get('/room/:id', (req, res) => {
  res.render('room', { title: 'StudyRoom - Collaboration Workspace', roomId: req.params.id });
});

// Bind Socket.io events
registerChatHandlers(io);

// Start server listening
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`StudyRoom server listening on port ${PORT}`);
});
