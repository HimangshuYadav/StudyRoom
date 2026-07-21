const Room = require('../models/Room');

/**
 * Creates a new collaborative study room.
 * Generates a random unique 6-character join code and sets up initial membership.
 *
 * @function createRoom
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Form fields.
 * @param {string} req.body.name - The name of the room.
 * @param {string} req.body.topic - The primary topic/subject of the room.
 * @param {Object} req.user - Decoded logged-in user profile from middleware.
 * @param {string} req.user.id - The unique user ID of the creator.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with the created room JSON document or an error.
 *
 * Implementation Steps:
 * 1. Read room name and topic from req.body.
 * 2. Generate a random 6-character alphanumeric joinCode string.
 * 3. Construct a new Room document with createdBy set to req.user.id, and members array initialized with [req.user.id].
 * 4. Save the room document in MongoDB.
 * 5. Return the created room object with status 201 via res.json.
 */
async function createRoom(req, res) {
  // TODO: generate joinCode, create Room doc with creator and member, save and return
  return res.status(201).json({ id: 'mock-room-id', name: req.body.name, joinCode: 'ABC123' });
}

/**
 * Adds the logged-in user to an existing study room using a join code.
 *
 * @function joinRoom
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Form fields.
 * @param {string} req.body.joinCode - The unique 6-character string associated with a room.
 * @param {Object} req.user - Decoded logged-in user profile from middleware.
 * @param {string} req.user.id - The user ID joining the room.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with the updated room JSON document, or a 404/error.
 *
 * Implementation Steps:
 * 1. Find the Room in MongoDB matching the query joinCode.
 * 2. If no room matches, return a 404 Not Found error response.
 * 3. Check if req.user.id is already present in room.members array.
 * 4. If not present, push req.user.id into the members array and save the document.
 * 5. Return the updated room JSON object.
 */
async function joinRoom(req, res) {
  // TODO: find room by joinCode, check/add user ID to members list, return room
  return res.json({ id: 'mock-room-id', joinCode: req.body.joinCode, members: [req.user?.id || 'mock-user-id'] });
}

/**
 * Retrieves a single room details populating member profiles.
 *
 * @function getRoomById
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameter attributes.
 * @param {string} req.params.id - The Room ID to retrieve.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with the populated room details, or a 404 error.
 *
 * Implementation Steps:
 * 1. Retrieve the room ID from req.params.id.
 * 2. Find the Room by ID in the database and chain .populate('members') to load member details.
 * 3. If no room is found, return 404 error.
 * 4. Return the populated room JSON object.
 */
async function getRoomById(req, res) {
  // TODO: find room by ID, populate members fields, return room JSON
  return res.json({ id: req.params.id, name: 'Mock Room', members: [] });
}

/**
 * Lists public collaborative study rooms.
 *
 * @function listPublicRooms
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with a JSON array of rooms.
 *
 * Implementation Steps:
 * 1. Fetch Room documents from the database.
 * 2. Sort rooms by createdAt in descending order.
 * 3. Apply a limit of 50 documents.
 * 4. Return the retrieved array of rooms as a JSON response.
 */
async function listPublicRooms(req, res) {
  // TODO: fetch all rooms up to limit 50 sorted desc, return array
  return res.json([]);
}

module.exports = {
  createRoom,
  joinRoom,
  getRoomById,
  listPublicRooms
};
