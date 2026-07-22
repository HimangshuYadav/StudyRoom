/**
 * StudyRoom — Multi-Topic Private & Public Notes with File Uploads
 * Real-time collaboration, topic switching, and attachment management.
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

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  const workspace = document.querySelector('.room-workspace');
  if (!workspace) return;

  const roomId      = workspace.getAttribute('data-room-id');
  const token       = localStorage.getItem('token');
  const userJson    = localStorage.getItem('user');
  const currentUser = userJson ? JSON.parse(userJson) : {};

  // DOM Elements
  const textarea         = document.getElementById('shared-notes-editor');
  const statusEl         = document.getElementById('notes-status');
  const charCount        = document.getElementById('notes-char-count');
  const topicSelect      = document.getElementById('note-topic-select');
  const visBadge         = document.getElementById('active-note-vis');
  const btnDeleteNote    = document.getElementById('btn-delete-note');
  const btnNewTopic      = document.getElementById('btn-new-topic');
  const newTopicForm     = document.getElementById('new-topic-form');
  const newTopicTitle    = document.getElementById('new-topic-title');
  const newTopicPublic   = document.getElementById('new-topic-public');
  const btnCancelTopic   = document.getElementById('btn-cancel-topic');
  const fileInput        = document.getElementById('note-file-input');
  const attachmentsList  = document.getElementById('attachments-list');
  const attachmentsCount = document.getElementById('attachments-count');

  if (!textarea || !topicSelect) return;

  // State
  let allNotes = [];
  let activeFilter = 'all';
  let activeNote = null;
  let restDebounce = null;
  let socketDebounce = null;

  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className   = cls;
  }

  function updateCharCount() {
    if (charCount) charCount.textContent = textarea.value.length;
  }

  // ── Fetch & Filter Notes List ───────────────────────────────────────────────
  async function fetchNotes(keepActiveId = null) {
    setStatus('Loading…', 'saving');
    try {
      const res = await fetch(`/api/notes/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      allNotes = await res.json();

      renderTopicSelectOptions();

      // Select target note or default to first note
      const filtered = getFilteredNotes();
      let targetNote = null;

      if (keepActiveId) {
        targetNote = filtered.find(n => n._id === keepActiveId);
      }
      if (!targetNote && filtered.length > 0) {
        targetNote = filtered[0];
      }

      if (targetNote) {
        topicSelect.value = targetNote._id;
        loadActiveNote(targetNote._id);
      } else {
        activeNote = null;
        textarea.value = '';
        updateCharCount();
        renderAttachments([]);
        setStatus('No Notes', 'saved');
      }
    } catch {
      setStatus('Load failed', 'error');
    }
  }

  function getFilteredNotes() {
    if (activeFilter === 'public') {
      return allNotes.filter(n => n.isPublic);
    }
    if (activeFilter === 'private') {
      return allNotes.filter(n => !n.isPublic);
    }
    return allNotes;
  }

  function renderTopicSelectOptions() {
    const filtered = getFilteredNotes();
    if (filtered.length === 0) {
      topicSelect.innerHTML = '<option value="">No notes found</option>';
      return;
    }

    topicSelect.innerHTML = filtered.map(n => {
      const lockIcon = n.isPublic ? '' : '🔒 ';
      const mineBadge = (n.createdBy === currentUser.id) ? ' (me)' : '';
      return `<option value="${n._id}">${lockIcon}${escapeHtml(n.title)}${mineBadge}</option>`;
    }).join('');
  }

  // ── Load Note Detail into Editor ────────────────────────────────────────────
  async function loadActiveNote(noteId) {
    setStatus('Loading…', 'saving');
    try {
      const res = await fetch(`/api/notes/detail/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const note = await res.json();
      activeNote = note;

      textarea.value = note.content || '';
      updateCharCount();

      // Visibility badge
      if (visBadge) {
        if (note.isPublic) {
          visBadge.className = 'vis-badge public';
          visBadge.innerHTML = '<svg class="icon icon-sm"><use href="#icon-eye"/></svg> Public Note';
        } else {
          visBadge.className = 'vis-badge private';
          visBadge.innerHTML = '<svg class="icon icon-sm"><use href="#icon-lock"/></svg> Private Note';
        }
      }

      // Delete button: show if creator
      if (btnDeleteNote) {
        const canDelete = (note.createdBy === currentUser.id);
        btnDeleteNote.style.display = canDelete ? 'flex' : 'none';
      }

      renderAttachments(note.attachments || []);
      setStatus('Saved', 'saved');
    } catch (err) {
      console.error(err);
      setStatus('Failed to load note', 'error');
    }
  }

  // ── Render Attachments List ─────────────────────────────────────────────────
  function renderAttachments(attachments) {
    if (attachmentsCount) attachmentsCount.textContent = attachments.length;
    if (!attachmentsList) return;

    if (!attachments || attachments.length === 0) {
      attachmentsList.innerHTML = '<div style="font-size:0.75rem; color:var(--ink-300); font-style:italic;">No files attached yet</div>';
      return;
    }

    attachmentsList.innerHTML = attachments.map(att => `
      <div class="attachment-pill" data-att-id="${att._id}">
        <div class="att-info">
          <svg class="icon icon-sm" style="color:var(--clay-dark)"><use href="#icon-file-text"/></svg>
          <a href="${att.path}" target="_blank" download="${escapeHtml(att.originalName)}" class="att-name" title="${escapeHtml(att.originalName)}">
            ${escapeHtml(att.originalName)}
          </a>
          <span class="att-size">${formatFileSize(att.size)}</span>
        </div>
        <div class="att-actions">
          <a href="${att.path}" target="_blank" download="${escapeHtml(att.originalName)}" class="att-btn" title="Download">
            <svg class="icon icon-sm"><use href="#icon-download"/></svg>
          </a>
          ${activeNote && (activeNote.createdBy === currentUser.id) ? `
            <button type="button" class="att-btn delete-att-btn" data-att-id="${att._id}" title="Delete file">
              <svg class="icon icon-sm" style="color:var(--clay-dark)"><use href="#icon-trash"/></svg>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Wire attachment delete buttons
    attachmentsList.querySelectorAll('.delete-att-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleDeleteAttachment(btn.dataset.attId);
      });
    });
  }

  // ── Save Active Note (Live Socket + REST backup) ───────────────────────────
  function triggerSave() {
    if (!activeNote) return;
    setStatus('Saving…', 'saving');

    // 1. Live Socket event (if public note)
    clearTimeout(socketDebounce);
    socketDebounce = setTimeout(() => {
      if (window.roomSocket && activeNote) {
        window.roomSocket.emit('updateNotes', {
          roomId,
          noteId: activeNote._id,
          title: activeNote.title,
          content: textarea.value,
          isPublic: activeNote.isPublic,
          userId: currentUser.id
        });
      }
    }, 150);

    // 2. REST persistence (1.5s debounce)
    clearTimeout(restDebounce);
    restDebounce = setTimeout(saveREST, 1500);
  }

  async function saveREST() {
    if (!activeNote) return;
    try {
      const res = await fetch(`/api/notes/detail/${activeNote._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: textarea.value
        })
      });
      if (!res.ok) throw new Error();
      setStatus('Saved', 'saved');
    } catch {
      setStatus('Save failed', 'error');
    }
  }

  textarea.addEventListener('input', () => {
    updateCharCount();
    setStatus('Unsaved', 'saving');
    triggerSave();
  });

  // ── Topic Selector Switch ──────────────────────────────────────────────────
  topicSelect.addEventListener('change', (e) => {
    const noteId = e.target.value;
    if (noteId) loadActiveNote(noteId);
  });

  // ── Filter Pills Switch (All / Public / Private) ───────────────────────────
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.filter;
      renderTopicSelectOptions();

      const filtered = getFilteredNotes();
      if (filtered.length > 0) {
        topicSelect.value = filtered[0]._id;
        loadActiveNote(filtered[0]._id);
      } else {
        activeNote = null;
        textarea.value = '';
        updateCharCount();
        renderAttachments([]);
        setStatus('No Notes', 'saved');
      }
    });
  });

  // ── Create New Topic ────────────────────────────────────────────────────────
  if (btnNewTopic && newTopicForm) {
    btnNewTopic.addEventListener('click', () => {
      newTopicForm.classList.toggle('hidden');
      if (!newTopicForm.classList.contains('hidden')) {
        newTopicTitle.focus();
      }
    });
  }

  if (btnCancelTopic && newTopicForm) {
    btnCancelTopic.addEventListener('click', () => {
      newTopicForm.classList.add('hidden');
    });
  }

  if (newTopicForm) {
    newTopicForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = newTopicTitle.value.trim();
      const isPublic = newTopicPublic.checked;

      if (!title) return showToast('Please enter a topic title.', 'error');

      try {
        const res = await fetch(`/api/notes/${roomId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title, isPublic, content: '' })
        });
        const newNote = await res.json();
        if (!res.ok) throw new Error(newNote.error);

        newTopicTitle.value = '';
        newTopicForm.classList.add('hidden');
        showToast(`Topic "${newNote.title}" created!`, 'success');

        // Notify room if public topic created
        if (newNote.isPublic && window.roomSocket) {
          window.roomSocket.emit('noteListChanged', { roomId });
        }

        await fetchNotes(newNote._id);
      } catch (err) {
        showToast(err.message || 'Failed to create topic.', 'error');
      }
    });
  }

  // ── Delete Note Topic ───────────────────────────────────────────────────────
  if (btnDeleteNote) {
    btnDeleteNote.addEventListener('click', async () => {
      if (!activeNote) return;
      if (!confirm(`Delete topic "${activeNote.title}" and its attachments?`)) return;

      try {
        const res = await fetch(`/api/notes/detail/${activeNote._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast('Note topic deleted.', 'success');

        if (activeNote.isPublic && window.roomSocket) {
          window.roomSocket.emit('noteListChanged', { roomId });
        }

        await fetchNotes();
      } catch (err) {
        showToast(err.message || 'Failed to delete note.', 'error');
      }
    });
  }

  // ── File Upload Attachment ──────────────────────────────────────────────────
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !activeNote) return;

      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be under 10MB.', 'error');
        fileInput.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      setStatus('Uploading…', 'saving');
      try {
        const res = await fetch(`/api/notes/detail/${activeNote._id}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const updatedNote = await res.json();
        if (!res.ok) throw new Error(updatedNote.error);

        activeNote = updatedNote;
        renderAttachments(updatedNote.attachments || []);
        showToast(`File "${file.name}" uploaded!`, 'success');
        setStatus('Saved', 'saved');
      } catch (err) {
        showToast(err.message || 'Failed to upload file.', 'error');
        setStatus('Upload failed', 'error');
      } finally {
        fileInput.value = '';
      }
    });
  }

  // ── Delete File Attachment ──────────────────────────────────────────────────
  async function handleDeleteAttachment(attachmentId) {
    if (!activeNote) return;
    if (!confirm('Delete this file attachment?')) return;

    try {
      const res = await fetch(`/api/notes/detail/${activeNote._id}/attachment/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedNote = await res.json();
      if (!res.ok) throw new Error(updatedNote.error);

      activeNote = updatedNote;
      renderAttachments(updatedNote.attachments || []);
      showToast('Attachment deleted.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete attachment.', 'error');
    }
  }

  // ── Socket Listeners for Real-Time Sync ─────────────────────────────────────
  function setupSocketListeners() {
    if (!window.roomSocket) {
      setTimeout(setupSocketListeners, 200);
      return;
    }

    // Real-time note content edit from another member
    window.roomSocket.on('notesUpdated', ({ noteId, title, content, updatedBy }) => {
      if (activeNote && activeNote._id === noteId) {
        const start = textarea.selectionStart;
        const end   = textarea.selectionEnd;

        textarea.value = content;
        activeNote.content = content;
        updateCharCount();

        if (document.activeElement === textarea) {
          textarea.setSelectionRange(start, end);
        }

        setStatus(`Edited by ${updatedBy}`, 'saved');
        setTimeout(() => setStatus('Saved', 'saved'), 2500);
      }
    });

    // Refresh topic list when someone creates or deletes a public note
    window.roomSocket.on('refreshNoteList', () => {
      fetchNotes(activeNote ? activeNote._id : null);
    });
  }

  setupSocketListeners();

  // Initial load
  fetchNotes();
});