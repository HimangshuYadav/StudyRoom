const Message = require('../models/Message');
const Note = require('../models/Note');

// Track online users per room: Map<roomId, Map<socketId, {userId, userName}>>
const roomOnlineUsers = new Map();

function getRoomUserList(roomId) {
  const room = roomOnlineUsers.get(roomId);
  if (!room) return [];
  return Array.from(room.values());
}

function registerChatHandlers(io) {
  io.on('connection', (socket) => {
    socket.data.roomId = null;
    socket.data.userName = null;
    socket.data.userId = null;

    // 1. Join room — send history + online list
    socket.on('joinRoom', async ({ roomId, userName, userId }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userName = userName;
      socket.data.userId = userId;

      // Track online presence
      if (!roomOnlineUsers.has(roomId)) {
        roomOnlineUsers.set(roomId, new Map());
      }
      roomOnlineUsers.get(roomId).set(socket.id, { userId, userName });

      // Send last 30 messages to the joining user
      try {
        const history = await Message.find({ roomId })
          .sort({ createdAt: -1 })
          .limit(30)
          .lean();
        socket.emit('messageHistory', history.reverse());
      } catch (err) {
        console.error('Error loading message history:', err);
      }

      // Broadcast updated online list to everyone in room
      const onlineList = getRoomUserList(roomId);
      io.to(roomId).emit('onlineUsers', onlineList);

      // Notify others someone joined
      socket.to(roomId).emit('userJoined', { userName, socketId: socket.id });
    });

    // 2. Send message
    socket.on('sendMessage', async ({ roomId, userId, userName, text }) => {
      try {
        if (!text || !text.trim()) return;

        const message = await Message.create({
          roomId,
          senderId: userId,
          senderName: userName,
          text: text.trim(),
          createdAt: new Date(),
        });

        io.to(roomId).emit('newMessage', message);
      } catch (err) {
        socket.emit('messageError', { error: 'Failed to send message.' });
      }
    });

    // 3. Typing indicator
    socket.on('typing', ({ roomId, userName, isTyping }) => {
      socket.to(roomId).emit('userTyping', { userName, isTyping });
    });

    // 4. Real-time Multi-Note sync
    socket.on('updateNotes', async ({ roomId, noteId, title, content, isPublic, userId }) => {
      // If public note, broadcast live to all other clients in the room
      if (isPublic !== false) {
        socket.to(roomId).emit('notesUpdated', {
          noteId,
          title,
          content: content || '',
          updatedBy: socket.data.userName || 'Someone',
        });
      }

      // Persist to DB
      try {
        if (noteId) {
          await Note.findByIdAndUpdate(
            noteId,
            {
              ...(title ? { title } : {}),
              content: content || '',
              ...(typeof isPublic === 'boolean' ? { isPublic } : {}),
              lastEditedBy: userId || socket.data.userId,
              updatedAt: Date.now(),
            }
          );
        }
      } catch (err) {
        console.error('Error saving note via socket:', err);
      }
    });

    // 5. Note Topic Created / Deleted Notification
    socket.on('noteListChanged', ({ roomId }) => {
      socket.to(roomId).emit('refreshNoteList');
    });

    // 6. Disconnect — clean up online list
    socket.on('disconnect', () => {
      const { roomId, userName } = socket.data;

      if (roomId) {
        const room = roomOnlineUsers.get(roomId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            roomOnlineUsers.delete(roomId);
          }
        }

        const onlineList = getRoomUserList(roomId);
        io.to(roomId).emit('onlineUsers', onlineList);
        socket.to(roomId).emit('userLeft', { userName, socketId: socket.id });
      }
    });
  });
}

module.exports = { registerChatHandlers };
