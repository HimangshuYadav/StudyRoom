const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route mapping for Listing Public Study Rooms
// GET /api/rooms -> Returns array of active/public rooms
router.get('/', roomController.listPublicRooms);

// Route mapping for Creating a Room
// POST /api/rooms/create -> Requires token authentication, creates room
router.post('/create', verifyToken, roomController.createRoom);

// Route mapping for Joining a Room by Join Code
// POST /api/rooms/join -> Requires token authentication, adds user to members
router.post('/join', verifyToken, roomController.joinRoom);

// Route mapping for Retrieving Room Details
// GET /api/rooms/:id -> Requires token authentication, retrieves single room
router.get('/:id', verifyToken, roomController.getRoomById);

module.exports = router;
