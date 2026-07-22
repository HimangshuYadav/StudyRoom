/**
 * StudyRoom — Shared Notes Sync
 * Real-time collaborative notes via Socket.io + REST fallback + auto-save badge.
 */
document.addEventListener('DOMContentLoaded', () => {
  const workspace = document.querySelector('.room-workspace');
  if (!workspace) return;

  const roomId    = workspace.getAttribute('data-room-id');
  const token     = localStorage.getItem('token');
  const userJson  = localStorage.getItem('user');
  const currentUser = userJson ? JSON.parse(userJson) : {};

  const textarea  = document.getElementById('shared-notes-editor');
  const statusEl  = document.getElementById('notes-status');
  const charCount = document.getElementById('notes-char-count');

  if (!textarea) return;

  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className   = cls;
  }

  function updateCharCount() {
    if (charCount) charCount.textContent = textarea.value.length;
  }

  // Load notes initially from MongoDB
  async function loadNotes() {
    setStatus('Loading…', 'saving');
    try {
      const res = await fetch(`/api/notes/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      textarea.value = data.content || '';
      updateCharCount();
      setStatus('Saved', 'saved');
    } catch {
      setStatus('Load failed', 'error');
    }
  }

  // Save notes to MongoDB via REST API (backup)
  async function saveNotesREST() {
    try {
      const res = await fetch(`/api/notes/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: textarea.value }),
      });
      if (!res.ok) throw new Error();
      setStatus('Saved', 'saved');
    } catch {
      setStatus('Save failed', 'error');
    }
  }

  loadNotes();

  // Handle local user input — emit socket event live + debounce REST backup save
  let restDebounce;
  let socketDebounce;

  textarea.addEventListener('input', () => {
    updateCharCount();
    setStatus('Saving…', 'saving');

    // Emit live to room members via Socket.io (150ms debounce for smooth typing)
    clearTimeout(socketDebounce);
    socketDebounce = setTimeout(() => {
      if (window.roomSocket) {
        window.roomSocket.emit('updateNotes', {
          roomId,
          content: textarea.value,
          userId: currentUser.id
        });
      }
    }, 150);

    // REST persistence backup (1.5s debounce)
    clearTimeout(restDebounce);
    restDebounce = setTimeout(saveNotesREST, 1500);
  });

  // Listen for real-time updates from other room members
  function setupSocketListener() {
    if (!window.roomSocket) {
      setTimeout(setupSocketListener, 200);
      return;
    }

    window.roomSocket.on('notesUpdated', ({ content, updatedBy }) => {
      // Avoid overwriting if cursor is active and content matches
      const start = textarea.selectionStart;
      const end   = textarea.selectionEnd;

      textarea.value = content;
      updateCharCount();

      // Restore cursor position if focused
      if (document.activeElement === textarea) {
        textarea.setSelectionRange(start, end);
      }

      setStatus(`Edited by ${updatedBy}`, 'saved');
      setTimeout(() => setStatus('Saved', 'saved'), 2500);
    });
  }

  setupSocketListener();
});