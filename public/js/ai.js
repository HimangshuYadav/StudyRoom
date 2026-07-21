/**
 * Requests an AI summary of the workspace chat and documents, updating the display card with the outcome.
 *
 * @function handleSummarize
 * @param {string} roomId - The database reference ID of the collaborative room.
 * @returns {void}
 *
 * Implementation Steps:
 * 1. Find the '#ai-summary-output' placeholder block and set loading text.
 * 2. Dispatch a POST fetch to '/api/ai/summarize' passing roomId in body, along with JWT token headers.
 * 3. Extract the returned summary text from the JSON response.
 * 4. Update the innerText of the summary card displaying the AI response.
 */
function handleSummarize(roomId) {
  // TODO: fetch POST /api/ai/summarize, extract response, update DOM
}

/**
 * Triggers the AI model to generate 5 practice multiple-choice questions matching notes.
 *
 * @function handleGenerateQuestions
 * @param {string} roomId - The database reference ID of the collaborative room.
 * @returns {void}
 *
 * Implementation Steps:
 * 1. Find the '#ai-quiz-output' container and set loading status.
 * 2. Send POST request to '/api/ai/questions' passing roomId and topic headers.
 * 3. Retrieve the JSON list of questions.
 * 4. Render the list of questions, option lists, and answer reveals dynamically in the quiz container.
 */
function handleGenerateQuestions(roomId) {
  // TODO: fetch POST /api/ai/questions, parse array, construct and render HTML structures in DOM
}

/**
 * Submits a concept doubt query to AI tutor and displays the explanations.
 *
 * @function handleExplainDoubt
 * @param {string} roomId - The database reference ID of the collaborative room.
 * @param {string} questionText - The plain text question/doubt query.
 * @returns {void}
 *
 * Implementation Steps:
 * 1. Locate the '#ai-doubt-output' card and display loading feedback.
 * 2. Send POST query to '/api/ai/explain' carrying roomId and doubt questions.
 * 3. Receive resulting explanation string from the AI service.
 * 4. Populate explanation content into the DOM output card.
 */
function handleExplainDoubt(roomId, questionText) {
  // TODO: fetch POST /api/ai/explain, extract text, update DOM
}

// Bind DOM event listeners on load
document.addEventListener('DOMContentLoaded', () => {
  const workspace = document.querySelector('.room-workspace');
  if (workspace) {
    const roomId = workspace.getAttribute('data-room-id');

    // Summarize button hook
    const summarizeBtn = document.getElementById('ai-summarize-btn');
    if (summarizeBtn) {
      summarizeBtn.addEventListener('click', () => handleSummarize(roomId));
    }

    // MCQ quiz button hook
    const quizBtn = document.getElementById('ai-quiz-btn');
    if (quizBtn) {
      quizBtn.addEventListener('click', () => handleGenerateQuestions(roomId));
    }

    // Doubt form submission hook
    const doubtForm = document.getElementById('ai-doubt-form');
    if (doubtForm) {
      doubtForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const doubtInput = document.getElementById('ai-doubt-input');
        if (doubtInput) {
          handleExplainDoubt(roomId, doubtInput.value);
        }
      });
    }
  }
});
