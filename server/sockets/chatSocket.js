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
    // 1. Join room event listener
    socket.on('joinRoom', ({ roomId, userName }) => {
      // TODO: join roomId channel and broadcast userJoined notification
    });

    // 2. Send message event listener
    socket.on('sendMessage', async ({ roomId, senderId, senderName, text }) => {
      // TODO: create and save Message doc in MongoDB, then emit newMessage to all clients in roomId
    });

    // 3. User typing event listener
    socket.on('typing', ({ roomId, userName }) => {
      // TODO: broadcast userTyping indicator to other sockets in roomId
    });

    // 4. Disconnect event listener
    socket.on('disconnect', () => {
      // TODO: broadcast userLeft state updates to relevant channels
    });
  });
}

module.exports = {
  registerChatHandlers
};
