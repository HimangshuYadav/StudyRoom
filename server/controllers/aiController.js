const Message = require('../models/Message');
const Note = require('../models/Note');
const groqClient = require('../utils/groqClient');

/**
 * Generates an AI summary of a study room by compiling recent message history and the room's notes.
 *
 * @function summarizeRoom
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Payload sent by client.
 * @param {string} req.body.roomId - The ID of the study room to summarize.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with a JSON object containing the room summary.
 *
 * Implementation Steps:
 * 1. Read roomId from req.body.
 * 2. Fetch the recent 50 messages for this roomId from the Message model.
 * 3. Fetch the latest room Note document for this roomId.
 * 4. Combine the text from the messages and the note content into a comprehensive context prompt.
 * 5. Build an instruction prompting the AI model to output a bulleted summary of active discussion topics and notes.
 * 6. Send the prompt to groqClient.getCompletion(prompt).
 * 7. Return the summary text in the JSON response as { summary: string }.
 */
async function summarizeRoom(req, res) {
  // TODO: fetch messages/notes, build prompt, query groq, return response JSON
  return res.json({ summary: 'Mock Summary: The study group discussed dynamic routing and Mongoose model hooks.' });
}

/**
 * Generates a set of 5 multiple-choice questions (MCQs) based on the room study context.
 *
 * @function generateQuestions
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Payload sent by client.
 * @param {string} req.body.topic - The subject of focus.
 * @param {string} req.body.roomId - The ID of the room to pull context from.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with a JSON array of generated multiple choice questions.
 *
 * Implementation Steps:
 * 1. Extract topic and roomId from req.body.
 * 2. Fetch the room notes context from the Note model.
 * 3. Construct a prompt instructing the AI to write exactly 5 multiple choice questions on the topic.
 * 4. Request the AI to format the response strictly as valid JSON: [{"question": string, "options": string[], "answer": string}].
 * 5. Call groqClient.getCompletion(prompt).
 * 6. Strip any markdown block fences (e.g. ```json ... ```) from the response text.
 * 7. Parse the cleaned response into a Javascript array and send it back as { questions: [...] }.
 */
async function generateQuestions(req, res) {
  // TODO: fetch notes/context, build MCQ prompt, query groq, parse JSON response, return response array
  return res.json({
    questions: [
      {
        question: 'Mock Question: What does Mongoose use to define schemas?',
        options: ['Schema Class', 'JSON text', 'SQL files', 'No-SQL commands'],
        answer: 'Schema Class'
      }
    ]
  });
}

/**
 * Resolves student doubt/questions by providing a tutor-like interactive explanation.
 *
 * @function explainDoubt
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Payload sent by client.
 * @param {string} req.body.question - The question/doubt query from the user.
 * @param {string} req.body.roomId - The ID of the room (for context).
 * @param {Object} res - Express response object.
 * @returns {void} Responds with the AI's step-by-step tutoring explanation.
 *
 * Implementation Steps:
 * 1. Extract the question and roomId from req.body.
 * 2. Optionally fetch room notes content from the Note model to align explanation with room topics.
 * 3. Construct a prompt presenting the user's doubt as a tutoring scenario, instructing the AI to provide a friendly, step-by-step resolution.
 * 4. Call groqClient.getCompletion(prompt).
 * 5. Return the resulting explanation in the response as { explanation: string }.
 */
async function explainDoubt(req, res) {
  // TODO: fetch context, build tutoring prompt, query groq, return response JSON
  return res.json({ explanation: 'Mock Explanation: Mongoose schemas are defined as instances of mongoose.Schema. They allow you to outline fields, validation, and middleware hook options.' });
}

module.exports = {
  summarizeRoom,
  generateQuestions,
  explainDoubt
};
