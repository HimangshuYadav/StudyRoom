const Message = require('../models/Message');
const Note = require('../models/Note');
const groqClient = require('../utils/groqClient');

/**
 * Strips markdown code fences (```json ... ``` or ``` ... ```) that LLMs
 * sometimes wrap around JSON responses, so the remaining text can be parsed safely.
 */
function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function summarizeRoom(req, res) {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required.' });
    }

    const [messages, note] = await Promise.all([
      Message.find({ roomId }).sort({ createdAt: -1 }).limit(50),
      Note.findOne({ roomId })
    ]);

    // Messages were fetched newest-first for the limit; reverse to chronological order for the prompt
    const messageText = messages
      .slice()
      .reverse()
      .map((m) => `${m.senderName ? m.senderName + ': ' : ''}${m.text}`)
      .join('\n');

    const noteText = note?.content || '';

    const prompt = `You are an assistant summarizing a study group's activity.

Recent chat messages:
${messageText || '(no messages yet)'}

Shared room notes:
${noteText || '(no notes yet)'}

Based on the above, write a concise bulleted summary of the active discussion topics and key points from the notes. Respond with bullet points only, no preamble.`;

    const summary = await groqClient.getCompletion(prompt);

    return res.json({ summary: summary.trim() });
  } catch (err) {
    console.error('summarizeRoom error:', err);
    return res.status(500).json({ error: 'Failed to generate room summary.' });
  }
}

async function generateQuestions(req, res) {
  try {
    const { topic, roomId } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'topic is required.' });
    }

    let noteText = '';
    if (roomId) {
      const note = await Note.findOne({ roomId });
      noteText = note?.content || '';
    }

    const prompt = `You are a quiz generator for a study app.

Topic: ${topic}
${noteText ? `\nRelevant room notes for additional context:\n${noteText}\n` : ''}
Write exactly 5 multiple choice questions on this topic. Each question must have exactly 4 options and one correct answer.

Respond with ONLY valid JSON in this exact format, with no markdown fences and no extra text:
[{"question": string, "options": string[], "answer": string}]`;

    const raw = await groqClient.getCompletion(prompt);
    const cleaned = stripCodeFences(raw);

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('generateQuestions parse error:', parseErr, 'raw:', raw);
      return res.status(502).json({ error: 'AI returned an unparseable response. Please try again.' });
    }

    return res.json({ questions });
  } catch (err) {
    console.error('generateQuestions error:', err);
    return res.status(500).json({ error: 'Failed to generate questions.' });
  }
}

async function explainDoubt(req, res) {
  try {
    const { question, roomId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'question is required.' });
    }

    let noteText = '';
    if (roomId) {
      const note = await Note.findOne({ roomId });
      noteText = note?.content || '';
    }

    const prompt = `You are a friendly, patient tutor helping a student with a doubt.
${noteText ? `\nFor context, here are the study group's notes on the current topic:\n${noteText}\n` : ''}
Student's question: ${question}

Provide a clear, step-by-step explanation that resolves the student's doubt. Keep the tone encouraging and easy to follow.`;

    const explanation = await groqClient.getCompletion(prompt);

    return res.json({ explanation: explanation.trim() });
  } catch (err) {
    console.error('explainDoubt error:', err);
    return res.status(500).json({ error: 'Failed to generate explanation.' });
  }
}

module.exports = {
  summarizeRoom,
  generateQuestions,
  explainDoubt
};