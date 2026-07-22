const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { verifyToken } = require('../middleware/authMiddleware');

// List notes for room (public + user's private notes)
router.get('/:roomId', verifyToken, noteController.listNotes);

// Create new note topic
router.post('/:roomId', verifyToken, noteController.createNote);

// Get single note detail
router.get('/detail/:noteId', verifyToken, noteController.getNoteById);

// Update note detail (title, content, isPublic)
router.put('/detail/:noteId', verifyToken, noteController.updateNote);

// Delete note topic
router.delete('/detail/:noteId', verifyToken, noteController.deleteNote);

// Upload file attachment
router.post('/detail/:noteId/upload', verifyToken, noteController.uploadAttachment);

// Delete file attachment
router.delete('/detail/:noteId/attachment/:attachmentId', verifyToken, noteController.deleteAttachment);

module.exports = router;
