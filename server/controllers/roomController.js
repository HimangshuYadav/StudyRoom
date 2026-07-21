const crypto = require('crypto');
const Room = require('../models/Room');

/**
 * Generates a random 6-character alphanumeric join code (uppercase + digits).
 */
function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Ensures the generated join code doesn't collide with an existing room.
 */
async function generateUniqueJoinCode() {
  let code;
  let existing;
  do {
    code = generateJoinCode();
    existing = await Room.findOne({ joinCode: code });
  } while (existing);
  return code;
}

async function createRoom(req, res) {
  try {
    const { name, topic } = req.body;

    if (!name || !topic) {
      return res.status(400).json({ error: 'Room name and topic are required.' });
    }

    const joinCode = await generateUniqueJoinCode();

    const room = new Room({
      name,
      topic,
      joinCode,
      createdBy: req.user.id,
      members: [req.user.id]
    });

    await room.save();

    return res.status(201).json(room);
  } catch (err) {
    console.error('createRoom error:', err);
    return res.status(500).json({ error: 'Failed to create room.' });
  }
}

async function joinRoom(req, res) {
  try {
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({ error: 'joinCode is required.' });
    }

    const room = await Room.findOne({ joinCode });

    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const alreadyMember = room.members.some(
      (memberId) => memberId.toString() === req.user.id
    );

    if (!alreadyMember) {
      room.members.push(req.user.id);
      await room.save();
    }

    return res.json(room);
  } catch (err) {
    console.error('joinRoom error:', err);
    return res.status(500).json({ error: 'Failed to join room.' });
  }
}

async function getRoomById(req, res) {
  try {
    const { id } = req.params;

    const room = await Room.findById(id).populate('members', '-password');

    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    return res.json(room);
  } catch (err) {
    console.error('getRoomById error:', err);
    // Handle malformed ObjectId gracefully as a 404 rather than a 500
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Room not found.' });
    }
    return res.status(500).json({ error: 'Failed to fetch room.' });
  }
}

async function listPublicRooms(req, res) {
  try {
    const rooms = await Room.find()
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(rooms);
  } catch (err) {
    console.error('listPublicRooms error:', err);
    return res.status(500).json({ error: 'Failed to fetch rooms.' });
  }
}

module.exports = {
  createRoom,
  joinRoom,
  getRoomById,
  listPublicRooms
};