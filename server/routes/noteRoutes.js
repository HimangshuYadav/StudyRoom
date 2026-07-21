const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route mapping for Retrieving Study Notes
// GET /api/notes/:roomId -> Retrieves notes matching the room ID
router.get('/:roomId', verifyToken, noteController.getNotes);

// Route mapping for Updating/Saving Study Notes
// PUT /api/notes/:roomId -> Upserts notes context with current editor ID
router.put('/:roomId', verifyToken, noteController.saveNotes);

module.exports = router;
