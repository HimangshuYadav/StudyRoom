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

function getMockQuestions(topic) {
  return [
    {
      question: `What is the primary definition or concept behind "${topic}"?`,
      options: [
        `A. A fundamental principle essential to "${topic}"`,
        `B. An unrelated secondary attribute`,
        `C. A deprecated historical approach`,
        `D. A theoretical construct not used in practice`
      ],
      answer: `A. A fundamental principle essential to "${topic}"`
    },
    {
      question: `Which of the following best represents a core application of "${topic}"?`,
      options: [
        `A. Minimizing system complexity and structure`,
        `B. Implementing efficient real-world workflows related to it`,
        `C. Discarding modern best practices`,
        `D. Relying purely on legacy static systems`
      ],
      answer: `B. Implementing efficient real-world workflows related to it`
    },
    {
      question: `When designing systems using "${topic}", what is a primary concern?`,
      options: [
        `A. Ensuring proper scalability, stability, and integration`,
        `B. Avoiding any use of documentation`,
        `C. Maximizing execution latency`,
        `D. Restricting user access completely`
      ],
      answer: `A. Ensuring proper scalability, stability, and integration`
    },
    {
      question: `What is a common misconception about "${topic}"?`,
      options: [
        `A. That it is extremely simple and requires no planning`,
        `B. That it requires proper architecture and design`,
        `C. That it is a standard industry practice`,
        `D. That it can be validated through manual and automated testing`
      ],
      answer: `A. That it is extremely simple and requires no planning`
    },
    {
      question: `Which tool or method is most commonly associated with analyzing "${topic}"?`,
      options: [
        `A. Dynamic runtime analysis and structured testing`,
        `B. Visual inspection of compile logs only`,
        `C. Manual estimation without metrics`,
        `D. Disabling errors and warnings`
      ],
      answer: `A. Dynamic runtime analysis and structured testing`
    }
  ];
}

function getMockExplanation(question, topic) {
  return `### Simulated AI Explanation for: "${question}"

Since the **GROQ_API_KEY** is not configured or failed to authenticate, this is a simulated tutor response.

1. **Understanding the Core Concept**: The question asks about "${question}". In the context of ${topic || 'your notes'}, this represents a fundamental query about how components interact.
2. **Step-by-Step Breakdown**:
   - **Step 1**: Analyze the requirements and identify the key dependencies.
   - **Step 2**: Implement the solution in modular steps, ensuring validation at each phase.
   - **Step 3**: Test the integration under different scenarios to guarantee robust behavior.
3. **Best Practices**:
   - Always verify environment variables and keys.
   - Design clean fallback logic for third-party service dependencies.
   
*Note: To receive real AI-generated tutoring, configure a valid **GROQ_API_KEY** in the \`.env\` file.*`;
}

function getMockSummary(topic) {
  return `• **Simulated Room Summary**: Room activity was analyzed.
• **Primary Subject**: Discussion touched upon "${topic || 'General study topics'}".
• **Key Takeaways**:
  - Reviewed the active workspace, notes, and messages in this session.
  - Recommended setting up unit tests and validation files.
  - Demonstrated client-server communication using Express and Socket.io.
• *Note: Configure a valid **GROQ_API_KEY** in the \`.env\` file to enable real AI summarization.*`;
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

    const derivedTopic = noteText.split('\n')[0]?.replace(/^--- Note:\s*/i, '').replace(/\s*---$/i, '').trim() || 'General Knowledge';

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('placeholder') || process.env.GROQ_API_KEY === 'gsk_your_groq_api_key_here') {
      console.warn('⚠️ GROQ_API_KEY is not configured or is a placeholder. Using mock summary.');
      return res.json({ summary: getMockSummary(derivedTopic) });
    }

    const prompt = `You are an assistant summarizing a study group's activity.

Recent chat messages:
${messageText || '(no messages yet)'}

Shared room notes:
${noteText || '(no notes yet)'}

Write a concise bulleted summary of the active discussion topics and key points. Bullet points only, no preamble.`;

    try {
      const summary = await groqClient.getCompletion(prompt, { maxTokens: 600 });
      return res.json({ summary: summary.trim() });
    } catch (err) {
      console.warn('⚠️ Groq API failed. Falling back to mock summary.', err.message);
      return res.json({ summary: getMockSummary(derivedTopic) });
    }
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
    const effectiveTopic = topic?.trim() || noteText.split('\n')[0]?.replace(/^--- Note:\s*/i, '').replace(/\s*---$/i, '').trim() || 'General Knowledge';

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('placeholder') || process.env.GROQ_API_KEY === 'gsk_your_groq_api_key_here') {
      console.warn('⚠️ GROQ_API_KEY is not configured or is a placeholder. Using mock questions.');
      const questions = getMockQuestions(effectiveTopic);
      return res.json({ questions, topic: effectiveTopic });
    }

    const prompt = `You are a quiz generator for a study app.

Topic: ${effectiveTopic}
${noteText ? `\nRelevant room notes:\n${noteText.slice(0, 600)}\n` : ''}
Write exactly 5 multiple choice questions on this topic. Each question must have exactly 4 options (A, B, C, D format) and one correct answer.

Respond with ONLY valid JSON, no markdown fences:
[{"question": "string", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A. ..."}]`;

    try {
      const raw = await groqClient.getCompletion(prompt, { maxTokens: 1200 });
      const cleaned = stripCodeFences(raw);
      const questions = JSON.parse(cleaned);
      return res.json({ questions, topic: effectiveTopic });
    } catch (err) {
      console.warn('⚠️ Groq API failed to generate questions, falling back to mock questions.', err.message);
      const questions = getMockQuestions(effectiveTopic);
      return res.json({ questions, topic: effectiveTopic });
    }
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

    const derivedTopic = noteText.split('\n')[0]?.replace(/^--- Note:\s*/i, '').replace(/\s*---$/i, '').trim() || 'General Knowledge';

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('placeholder') || process.env.GROQ_API_KEY === 'gsk_your_groq_api_key_here') {
      console.warn('⚠️ GROQ_API_KEY is not configured or is a placeholder. Using mock explanation.');
      return res.json({ explanation: getMockExplanation(question, derivedTopic) });
    }

    const prompt = `You are a friendly, patient tutor helping a student with a doubt.
${noteText ? `\nStudy group notes for context:\n${noteText.slice(0, 600)}\n` : ''}
Student's question: ${question}

Provide a clear, step-by-step explanation. Use simple language, be encouraging, and structure your answer with numbered steps or short paragraphs.`;

    try {
      const explanation = await groqClient.getCompletion(prompt, { maxTokens: 700 });
      return res.json({ explanation: explanation.trim() });
    } catch (err) {
      console.warn('⚠️ Groq API failed to explain doubt, falling back to mock explanation.', err.message);
      return res.json({ explanation: getMockExplanation(question, derivedTopic) });
    }
  } catch (err) {
    console.error('explainDoubt error:', err);
    return res.status(500).json({ error: 'Failed to generate explanation.' });
  }
}

module.exports = { summarizeRoom, generateQuestions, explainDoubt };