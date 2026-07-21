const Groq = require('groq-sdk');

let groqClient = null;

/**
 * Returns a singleton Groq client.
 *
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
 * Sends a prompt to a Groq-hosted AI model and returns the generated response.
 *
 * @param {string} prompt
 * @param {Object} [options={}]
 * @param {number} [options.temperature=0.7]
 * @param {number} [options.maxTokens=512]
 * @returns {Promise<string>}
 */
async function getCompletion(prompt, options = {}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('A valid prompt is required.');
  }

  const {
    temperature = 0.7,
    maxTokens = 512,
  } = options;

  try {
    const groq = getGroqClient();

    const response = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('No completion was returned by the Groq API.');
    }

    return content;
  } catch (error) {
    console.error('Groq API Error:', error);

    throw new Error(
      error.message || 'Failed to generate AI completion.'
    );
  }
}

module.exports = {
  getCompletion,
};