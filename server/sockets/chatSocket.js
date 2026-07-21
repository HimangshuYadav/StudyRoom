const Message = require('../models/Message');

/**
 * Attaches real-time Socket.io event listeners for collaborative classroom chat interactions.
 * Sets up listeners for joining rooms, sending messages, tracking typing, and disconnect states.
 *
 * @function registerChatHandlers
 * @param {Object} io - The Socket.io server instance attached to the server port.
 * @returns {void}
 *
 * Implementation Steps:
 * 1. Listen for new connection events via io.on('connection', socket => { ... }).
 * 2. On 'joinRoom' event (input: { roomId, userName }):
 *    - Call socket.join(roomId) to attach the socket to the room channel.
 *    - Broadcast 'userJoined' payload to all other sockets in roomId.
 * 3. On 'sendMessage' event (input: { roomId, senderId, senderName, text }):
 *    - Create and save a new Message document in MongoDB.
 *    - Emit 'newMessage' event containing the saved message to all clients in the roomId.
 * 4. On 'typing' event (input: { roomId, userName }):
 *    - Broadcast 'userTyping' payload containing userName to all other client sockets in the room.
 * 5. On 'disconnect' event:
 *    - Broadcast 'userLeft' message containing relevant identifiers to active room members if trackable.
 */
function registerChatHandlers(io) {
  io.on('connection', (socket) => {
    // Track which room + user this socket belongs to, so we can
    // announce departure on disconnect (socket.io doesn't give you
    // this info automatically once the socket has left).
    socket.data.roomId = null;
    socket.data.userName = null;

    // 1. Join room event listener
    socket.on('joinRoom', ({ roomId, userName }) => {
      socket.join(roomId);

      // Remember for later (typing/disconnect cleanup)
      socket.data.roomId = roomId;
      socket.data.userName = userName;

      // Notify everyone else already in the room
      socket.to(roomId).emit('userJoined', {
        userName,
        socketId: socket.id,
        roomId,
      });
    });








    // 2. Send message event listener
    socket.on('sendMessage', async ({ roomId, senderId, senderName, text }) => {
      try {
        if (!text || !text.trim()) return; // ignore empty messages

        const message = await Message.create({
          roomId,
          senderId,
          senderName,
          text,
          createdAt: new Date(),
        });

        // Broadcast to everyone in the room, including the sender,
        // so the sender's own UI updates from the same source of truth.
        io.to(roomId).emit('newMessage', message);
      } catch (err) {
        // Let the sending client know something went wrong instead
        // of failing silently.
        socket.emit('messageError', {
          error: 'Failed to send message.',
          details: err.message,
        });
      }
    });







    // 3. User typing event listener
    socket.on('typing', ({ roomId, userName }) => {
      // socket.to() excludes the sender — no one needs to see their own typing indicator
      socket.to(roomId).emit('userTyping', { userName });
    });






    // 4. Disconnect event listener
    socket.on('disconnect', () => {
      const { roomId, userName } = socket.data;

      if (roomId) {
        socket.to(roomId).emit('userLeft', {
          userName,
          socketId: socket.id,
          roomId,
        });
      }
    });
  });
}

module.exports = {
  registerChatHandlers
};
