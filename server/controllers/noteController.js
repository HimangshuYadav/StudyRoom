const Note = require('../models/Note');

async function getNotes(req, res) {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required.' });
    }

    let note = await Note.findOne({ roomId });

    if (!note) {
      // No note exists yet for this room — return a default empty representation
      // without persisting it, so a GET request stays read-only / side-effect free.
      note = { roomId, content: '' };
    }

    return res.json(note);
  } catch (err) {
    console.error('getNotes error:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Room not found.' });
    }
    return res.status(500).json({ error: 'Failed to fetch notes.' });
  }
}

async function saveNotes(req, res) {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required.' });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'content must be a string.' });
    }

    const note = await Note.findOneAndUpdate(
      { roomId },
      {
        content,
        lastEditedBy: req.user.id,
        updatedAt: Date.now()
      },
      {
        new: true,       // return the updated document rather than the original
        upsert: true,    // create the note if it doesn't exist yet
        setDefaultsOnInsert: true
      }
    );

    return res.json(note);
  } catch (err) {
    console.error('saveNotes error:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Room not found.' });
    }
    return res.status(500).json({ error: 'Failed to save notes.' });
  }
}

module.exports = {
  getNotes,
  saveNotes
};