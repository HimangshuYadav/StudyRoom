/**
 * StudyRoom — Shared Notes sync
 * Auto-saves with debounce, shows status badge, character count.
 */
document.addEventListener('DOMContentLoaded', () => {
  const workspace = document.querySelector('.room-workspace');
  if (!workspace) return;

  const roomId    = workspace.getAttribute('data-room-id');
  const token     = localStorage.getItem('token');
  const textarea  = document.getElementById('shared-notes-editor');
  const statusEl  = document.getElementById('notes-status');
  const charCount = document.getElementById('notes-char-count');

  if (!textarea) return;

  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.textContent  = text;
    statusEl.className    = cls;
  }

  function updateCharCount() {
    if (charCount) charCount.textContent = textarea.value.length;
  }

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

  async function saveNotes() {
    setStatus('Saving…', 'saving');
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

  let debounce;
  textarea.addEventListener('input', () => {
    updateCharCount();
    setStatus('Unsaved', 'saving');
    clearTimeout(debounce);
    debounce = setTimeout(saveNotes, 1500);
  });
});