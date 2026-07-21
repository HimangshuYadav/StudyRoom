const Note = require('../models/Note');

/**
 * Fetches the shared document notes for a given study room.
 *
 * @function getNotes
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.roomId - The ID of the study room.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with the room's Note document (newly generated empty content if none existed).
 *
 * Implementation Steps:
 * 1. Read roomId from req.params.roomId.
 * 2. Search for a Note document matching the roomId.
 * 3. If no Note exists, return a default mock representation with empty content (e.g. { roomId, content: '' }).
 * 4. Respond with the found or default Note document as JSON.
 */
async function getNotes(req, res) {
  // TODO: find Note by roomId, if none exist return empty content, else return note
  return res.json({ roomId: req.params.roomId, content: '' });
}

/**
 * Saves and updates the shared notes document in a room (upsert logic).
 *
 * @function saveNotes
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.roomId - The ID of the study room to update.
 * @param {Object} req.body - Payload sent by client.
 * @param {string} req.body.content - The text content of the notes.
 * @param {Object} req.user - Decoded logged-in user profile from middleware.
 * @param {string} req.user.id - The ID of the user editing the notes.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with the updated Note document JSON.
 *
 * Implementation Steps:
 * 1. Read roomId from req.params.roomId and content from req.body.content.
 * 2. Find and update (upsert) the Note document corresponding to the roomId.
 * 3. Update the content, set lastEditedBy to req.user.id, and update the updatedAt timestamp to Date.now.
 * 4. Save/return the updated Note object.
 */
async function saveNotes(req, res) {
  // TODO: find Note by roomId, upsert new content, lastEditedBy, and updatedAt, return note
  return res.json({ roomId: req.params.roomId, content: req.body.content, lastEditedBy: req.user?.id || 'mock-user-id' });
}

module.exports = {
  getNotes,
  saveNotes
};
