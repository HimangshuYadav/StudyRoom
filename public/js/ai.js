/**
 * Requests an AI summary of the workspace chat and documents.
 */
async function handleSummarize(roomId) {
  const output = document.getElementById("ai-summary-output");
  if (!output) return;

  output.innerText = "Generating summary...";

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomId }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate summary.");
    }

    const data = await response.json();

    output.innerText = data.summary || "No summary available.";
  } catch (error) {
    console.error(error);
    output.innerText = "Unable to generate summary. Please try again.";
  }
}

/**
 * Generates AI practice MCQs and renders them.
 */
async function handleGenerateQuestions(roomId) {
  const output = document.getElementById("ai-quiz-output");
  if (!output) return;

  output.innerHTML = "<p>Generating quiz...</p>";

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/ai/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomId }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate quiz.");
    }

    const data = await response.json();

    const questions = data.questions || [];

    if (!questions.length) {
      output.innerHTML = "<p>No questions generated.</p>";
      return;
    }

    output.innerHTML = "";

    questions.forEach((question, index) => {
      const card = document.createElement("div");
      card.className = "quiz-question";

      const title = document.createElement("h4");
      title.textContent = `${index + 1}. ${question.question}`;

      const optionList = document.createElement("ul");

      question.options.forEach((option) => {
        const li = document.createElement("li");
        li.textContent = option;
        optionList.appendChild(li);
      });

      const revealBtn = document.createElement("button");
      revealBtn.textContent = "Show Answer";

      const answer = document.createElement("p");
      answer.style.display = "none";
      answer.innerHTML = `<strong>Answer:</strong> ${question.answer}`;

      revealBtn.addEventListener("click", () => {
        answer.style.display =
          answer.style.display === "none" ? "block" : "none";
      });

      card.appendChild(title);
      card.appendChild(optionList);
      card.appendChild(revealBtn);
      card.appendChild(answer);

      output.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    output.innerHTML = "<p>Unable to generate quiz.</p>";
  }
}

/**
 * Sends a doubt to the AI tutor.
 */
async function handleExplainDoubt(roomId, questionText) {
  const output = document.getElementById("ai-doubt-output");
  if (!output) return;

  if (!questionText.trim()) {
    output.innerText = "Please enter a question.";
    return;
  }

  output.innerText = "Thinking...";

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/ai/explain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomId,
        question: questionText,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to retrieve explanation.");
    }

    const data = await response.json();

    output.innerText =
      data.explanation || "No explanation was returned.";
  } catch (error) {
    console.error(error);
    output.innerText =
      "Unable to retrieve explanation. Please try again.";
  }
}