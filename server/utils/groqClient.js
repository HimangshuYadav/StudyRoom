const Groq = require('groq-sdk');

let groqClient = null;

/**
 * Returns a singleton Groq client instance.
 * @returns {Groq}
 */
function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not configured.');
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
}

/**
 * Sends a prompt to Groq AI and returns the completion string.
 * Uses llama-3.3-70b-versatile by default with llama-3.1-8b-instant fallback.
 *
 * @param {string} prompt
 * @param {Object} [options={}]
 * @param {string} [options.model='llama-3.3-70b-versatile']
 * @param {number} [options.temperature=0.7]
 * @param {number} [options.maxTokens=768]
 * @returns {Promise<string>}
 */
async function getCompletion(prompt, options = {}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('A valid prompt is required.');
  }

  const {
    model = 'llama-3.3-70b-versatile',
    temperature = 0.7,
    maxTokens = 768,
  } = options;

  const groq = getGroqClient();

  // Try primary model (llama-3.3-70b-versatile)
  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt.trim(),
        },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    if (content) return content;
  } catch (err) {
    console.warn(`Primary model (${model}) failed, trying fallback model (llama-3.1-8b-instant)...`, err.message);
  }

  // Fallback model (llama-3.1-8b-instant)
  try {
    const fallbackResponse = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: prompt.trim(),
        },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const fallbackContent = fallbackResponse.choices?.[0]?.message?.content?.trim();
    if (!fallbackContent) {
      throw new Error('No completion returned by AI model.');
    }
    return fallbackContent;
  } catch (fallbackErr) {
    console.error('Groq AI Error:', fallbackErr);
    throw new Error(fallbackErr.message || 'Failed to generate AI completion.');
  }
}

module.exports = {
  getCompletion,
};