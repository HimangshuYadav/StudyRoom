const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Note = require('../models/Note');

// Configure Multer storage
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('file');

/**
 * GET /api/notes/:roomId
 * Lists all public notes + user's private notes for the room.
 * Auto-creates "General Notes" if no notes exist yet.
 */
async function listNotes(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required.' });
    }

    let notes = await Note.find({
      roomId,
      $or: [
        { isPublic: true },
        { createdBy: userId }
      ]
    }).sort({ isPublic: -1, updatedAt: -1 });

    // Auto-create default General Notes if no note exists at all
    if (notes.length === 0) {
      const defaultNote = new Note({
        roomId,
        title: 'General Notes',
        content: '',
        isPublic: true,
        createdBy: userId,
        lastEditedBy: userId
      });
      await defaultNote.save();
      notes = [defaultNote];
    }

    return res.json(notes);
  } catch (err) {
    console.error('listNotes error:', err);
    return res.status(500).json({ error: 'Failed to fetch notes.' });
  }
}

/**
 * POST /api/notes/:roomId
 * Creates a new note topic (public or private).
 */
async function createNote(req, res) {
  try {
    const { roomId } = req.params;
    const { title, isPublic, content } = req.body;
    const userId = req.user.id;

    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const note = new Note({
      roomId,
      title: title.trim(),
      content: content || '',
      isPublic: isPublic !== false, // default true unless explicitly false
      createdBy: userId,
      lastEditedBy: userId
    });

    await note.save();
    return res.status(201).json(note);
  } catch (err) {
    console.error('createNote error:', err);
    return res.status(500).json({ error: 'Failed to create note.' });
  }
}

/**
 * GET /api/notes/detail/:noteId
 * Fetches a single note by ID with attachments.
 */
async function getNoteById(req, res) {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    // Access check: must be public or created by user
    if (!note.isPublic && note.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied to private note.' });
    }

    return res.json(note);
  } catch (err) {
    console.error('getNoteById error:', err);
    return res.status(500).json({ error: 'Failed to fetch note.' });
  }
}

/**
 * PUT /api/notes/detail/:noteId
 * Updates note content, title, or visibility.
 */
async function updateNote(req, res) {
  try {
    const { noteId } = req.params;
    const { title, content, isPublic } = req.body;
    const userId = req.user.id;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    if (!note.isPublic && note.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied to private note.' });
    }

    if (title && title.trim()) note.title = title.trim();
    if (typeof content === 'string') note.content = content;
    if (typeof isPublic === 'boolean') note.isPublic = isPublic;

    note.lastEditedBy = userId;
    note.updatedAt = Date.now();

    await note.save();
    return res.json(note);
  } catch (err) {
    console.error('updateNote error:', err);
    return res.status(500).json({ error: 'Failed to update note.' });
  }
}

/**
 * DELETE /api/notes/detail/:noteId
 * Deletes a note topic. Only creator can delete.
 */
async function deleteNote(req, res) {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    if (note.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Only the creator can delete this note.' });
    }

    // Delete attached physical files
    if (note.attachments && note.attachments.length > 0) {
      note.attachments.forEach(att => {
        const filePath = path.join(uploadsDir, att.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Note.findByIdAndDelete(noteId);
    return res.json({ message: 'Note deleted successfully.' });
  } catch (err) {
    console.error('deleteNote error:', err);
    return res.status(500).json({ error: 'Failed to delete note.' });
  }
}

/**
 * POST /api/notes/detail/:noteId/upload
 * Uploads a file attachment to the note.
 */
function uploadAttachment(req, res) {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided.' });
    }

    try {
      const { noteId } = req.params;
      const userId = req.user.id;

      const note = await Note.findById(noteId);
      if (!note) {
        // Clean up uploaded file if note doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Note not found.' });
      }

      if (!note.isPublic && note.createdBy.toString() !== userId) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Access denied.' });
      }

      const attachment = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };

      note.attachments.push(attachment);
      note.lastEditedBy = userId;
      note.updatedAt = Date.now();
      await note.save();

      return res.status(201).json(note);
    } catch (dbErr) {
      console.error('uploadAttachment DB error:', dbErr);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Failed to save attachment record.' });
    }
  });
}

/**
 * DELETE /api/notes/detail/:noteId/attachment/:attachmentId
 * Deletes a file attachment from a note.
 */
async function deleteAttachment(req, res) {
  try {
    const { noteId, attachmentId } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    if (!note.isPublic && note.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const att = note.attachments.id(attachmentId);
    if (!att) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }

    // Delete physical file
    const filePath = path.join(uploadsDir, att.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    att.deleteOne();
    note.lastEditedBy = userId;
    note.updatedAt = Date.now();
    await note.save();

    return res.json(note);
  } catch (err) {
    console.error('deleteAttachment error:', err);
    return res.status(500).json({ error: 'Failed to delete attachment.' });
  }
}

module.exports = {
  listNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  uploadAttachment,
  deleteAttachment
};