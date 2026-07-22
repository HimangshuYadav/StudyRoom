/**
 * StudyRoom — AI Tutor panel
 * Handles summarize, explain doubt, and quiz generation.
 * All buttons are wired inside DOMContentLoaded.
 */

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) return;
  const icons = {
    success: '<svg class="icon icon-sm"><use href="#icon-check-circle"/></svg>',
    error: '<svg class="icon icon-sm"><use href="#icon-x-circle"/></svg>',
    info: '<svg class="icon icon-sm"><use href="#icon-info"/></svg>'
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-body">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('hiding'); toast.addEventListener('transitionend', () => toast.remove()); }, 3500);
}

function setLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;"></span> Thinking…';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.orig;
  }
}

// ── Summarize ─────────────────────────────────────────────────────────────────
async function handleSummarize(roomId) {
  const btn    = document.getElementById('ai-summarize-btn');
  const output = document.getElementById('ai-summary-output');
  if (!output || !btn) return;

  setLoading(btn, true);
  output.textContent = '';

  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ roomId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    output.textContent = data.summary || 'No summary available.';
    showToast('Summary generated!', 'success');
  } catch (err) {
    output.textContent = 'Could not generate summary. Please try again.';
    showToast(err.message || 'AI error', 'error');
  } finally {
    setLoading(btn, false);
  }
}

// ── Explain Doubt ─────────────────────────────────────────────────────────────
async function handleExplainDoubt(roomId) {
  const btn      = document.getElementById('ai-explain-btn');
  const input    = document.getElementById('ai-doubt-input');
  const output   = document.getElementById('ai-doubt-output');
  if (!btn || !input || !output) return;

  const question = input.value.trim();
  if (!question) return showToast('Please enter a question first.', 'info');

  setLoading(btn, true);
  output.textContent = '';

  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/api/ai/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ roomId, question }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    output.textContent = data.explanation || 'No explanation returned.';
    showToast('Explanation ready!', 'success');
  } catch (err) {
    output.textContent = 'Could not retrieve explanation. Please try again.';
    showToast(err.message || 'AI error', 'error');
  } finally {
    setLoading(btn, false);
  }
}

// ── Generate Quiz ─────────────────────────────────────────────────────────────
async function handleGenerateQuestions(roomId) {
  const btn    = document.getElementById('ai-quiz-btn');
  const topicInput = document.getElementById('ai-quiz-topic-input');
  const output = document.getElementById('ai-quiz-output');
  if (!btn || !output) return;

  const topic = topicInput?.value.trim() || '';

  setLoading(btn, true);
  output.innerHTML = '';

  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/api/ai/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ roomId, topic }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const questions = data.questions || [];
    if (!questions.length) {
      output.innerHTML = '<p style="color:var(--ink-300); font-size:0.85rem; font-style:italic;">No questions generated.</p>';
      return;
    }

    output.innerHTML = questions.map((q, i) => `
      <div class="quiz-question-card">
        <div class="quiz-q-text">${i + 1}. ${escapeHtml(q.question)}</div>
        <div class="quiz-options" data-answer="${escapeHtml(q.answer)}">
          ${(q.options || []).map(opt => `
            <div class="quiz-option" data-option="${escapeHtml(opt)}">
              ${escapeHtml(opt)}
            </div>
          `).join('')}
        </div>
        <button class="quiz-reveal-btn" onclick="this.previousElementSibling.querySelectorAll('.quiz-option').forEach(o => {
          if (o.dataset.option === this.closest('.quiz-question-card').querySelector('.quiz-options').dataset.answer) {
            o.classList.add('correct');
          }
        }); this.style.display='none';">Show Answer</button>
      </div>
    `).join('');

    // Wire option clicks
    output.querySelectorAll('.quiz-question-card').forEach(card => {
      const optionsEl = card.querySelector('.quiz-options');
      const answer    = optionsEl.dataset.answer;
      optionsEl.querySelectorAll('.quiz-option').forEach(opt => {
        opt.addEventListener('click', () => {
          if (optionsEl.classList.contains('answered')) return;
          optionsEl.classList.add('answered');
          optionsEl.querySelectorAll('.quiz-option').forEach(o => {
            if (o.dataset.option === answer) o.classList.add('correct');
            else o.classList.add('incorrect');
          });
          card.querySelector('.quiz-reveal-btn').style.display = 'none';
        });
      });
    });

    showToast(`Quiz generated on "${data.topic || 'topic'}"!`, 'success');
  } catch (err) {
    output.innerHTML = '<p style="color:var(--ink-300); font-size:0.85rem; font-style:italic;">Could not generate quiz. Please try again.</p>';
    showToast(err.message || 'AI error', 'error');
  } finally {
    setLoading(btn, false);
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const workspace = document.querySelector('.room-workspace');
  if (!workspace) return;

  const roomId = workspace.getAttribute('data-room-id');

  const summarizeBtn = document.getElementById('ai-summarize-btn');
  const explainBtn   = document.getElementById('ai-explain-btn');
  const quizBtn      = document.getElementById('ai-quiz-btn');

  if (summarizeBtn) summarizeBtn.addEventListener('click', () => handleSummarize(roomId));
  if (explainBtn)   explainBtn.addEventListener('click',   () => handleExplainDoubt(roomId));
  if (quizBtn)      quizBtn.addEventListener('click',      () => handleGenerateQuestions(roomId));

  // Submit doubt on Enter
  const doubtInput = document.getElementById('ai-doubt-input');
  if (doubtInput) {
    doubtInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleExplainDoubt(roomId);
    });
  }
});