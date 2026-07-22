const Message = require('../models/Message');
const Note = require('../models/Note');
const groqClient = require('../utils/groqClient');

function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function getRoomPublicNotesText(roomId) {
  if (!roomId) return '';
  try {
    const notes = await Note.find({ roomId, isPublic: true }).limit(5);
    return notes.map(n => `--- Note: ${n.title} ---\n${n.content}`).join('\n\n');
  } catch {
    return '';
  }
}

async function summarizeRoom(req, res) {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ error: 'roomId is required.' });

    const [messages, noteText] = await Promise.all([
      Message.find({ roomId }).sort({ createdAt: -1 }).limit(50),
      getRoomPublicNotesText(roomId),
    ]);

    const messageText = messages
      .slice()
      .reverse()
      .map((m) => `${m.senderName ? m.senderName + ': ' : ''}${m.text}`)
      .join('\n');

    const prompt = `You are an assistant summarizing a study group's activity.

Recent chat messages:
${messageText || '(no messages yet)'}

Shared room notes:
${noteText || '(no notes yet)'}

Write a concise bulleted summary of the active discussion topics and key points. Bullet points only, no preamble.`;

    const summary = await groqClient.getCompletion(prompt, { maxTokens: 600 });
    return res.json({ summary: summary.trim() });
  } catch (err) {
    console.error('summarizeRoom error:', err);
    return res.status(500).json({ error: 'Failed to generate summary.' });
  }
}

async function generateQuestions(req, res) {
  try {
    const { topic, roomId } = req.body;

    let noteText = '';
    if (roomId) {
      noteText = await getRoomPublicNotesText(roomId);
    }

    // Derive topic from notes if not explicitly provided
    const effectiveTopic = topic?.trim() || noteText.split('\n')[0]?.slice(0, 80) || 'General Knowledge';

    const prompt = `You are a quiz generator for a study app.

Topic: ${effectiveTopic}
${noteText ? `\nRelevant room notes:\n${noteText.slice(0, 600)}\n` : ''}
Write exactly 5 multiple choice questions on this topic. Each question must have exactly 4 options (A, B, C, D format) and one correct answer.

Respond with ONLY valid JSON, no markdown fences:
[{"question": "string", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A. ..."}]`;

    const raw = await groqClient.getCompletion(prompt, { maxTokens: 1200 });
    const cleaned = stripCodeFences(raw);

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('generateQuestions parse error, raw:', raw);
      return res.status(502).json({ error: 'AI returned an unparseable response. Please try again.' });
    }

    return res.json({ questions, topic: effectiveTopic });
  } catch (err) {
    console.error('generateQuestions error:', err);
    return res.status(500).json({ error: 'Failed to generate questions.' });
  }
}

async function explainDoubt(req, res) {
  try {
    const { question, roomId } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required.' });

    let noteText = '';
    if (roomId) {
      noteText = await getRoomPublicNotesText(roomId);
    }

    const prompt = `You are a friendly, patient tutor helping a student with a doubt.
${noteText ? `\nStudy group notes for context:\n${noteText.slice(0, 600)}\n` : ''}
Student's question: ${question}

Provide a clear, step-by-step explanation. Use simple language, be encouraging, and structure your answer with numbered steps or short paragraphs.`;

    const explanation = await groqClient.getCompletion(prompt, { maxTokens: 700 });
    return res.json({ explanation: explanation.trim() });
  } catch (err) {
    console.error('explainDoubt error:', err);
    return res.status(500).json({ error: 'Failed to generate explanation.' });
  }
}

module.exports = { summarizeRoom, generateQuestions, explainDoubt };