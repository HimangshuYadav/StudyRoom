const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now }
});

const noteSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    default: 'General Notes'
  },
  content: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [attachmentSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Note = mongoose.model('Note', noteSchema);

// Drop old single-note unique index if it exists in MongoDB
Note.collection.dropIndex('roomId_1').catch(() => {
  // Ignored if index doesn't exist
});

module.exports = Note;
