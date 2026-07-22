/**
 * StudyRoom — Dashboard logic
 * Handles room creation, joining, listing, deletion, and search.
 */

// ── Utilities ─────────────────────────────────────────────────────────────────
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
  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3500);
}

function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;"></span>';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || originalText;
  }
}

function syncNavbar() {
  const userJson = localStorage.getItem('user');
  const navLogin    = document.getElementById('nav-login');
  const navSignup   = document.getElementById('nav-signup');
  const navBadge    = document.getElementById('nav-user-badge');
  const navUsername = document.getElementById('nav-username');
  const navAvatar   = document.getElementById('nav-avatar');
  const navLogout   = document.getElementById('nav-logout');

  if (userJson) {
    const user = JSON.parse(userJson);
    if (navLogin)    navLogin.style.display = 'none';
    if (navSignup)   navSignup.style.display = 'none';
    if (navBadge)    navBadge.style.display = 'flex';
    if (navUsername) navUsername.textContent = user.name || user.email;
    if (navAvatar)   navAvatar.textContent = (user.name || 'U')[0].toUpperCase();
    if (navLogout) {
      navLogout.style.display = 'inline-flex';
      navLogout.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      });
    }
  }
}

function formatTimeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getToken() {
  return localStorage.getItem('token');
}

function getCurrentUser() {
  const json = localStorage.getItem('user');
  return json ? JSON.parse(json) : null;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast(`Copied "${text}" to clipboard!`, 'success'));
}

// ── Render Rooms ──────────────────────────────────────────────────────────────
let allRooms = [];

function renderRooms(rooms) {
  const grid = document.getElementById('rooms-grid');
  const countLabel = document.getElementById('room-count-label');
  if (!grid) return;

  allRooms = rooms;

  if (countLabel) countLabel.textContent = `(${rooms.length})`;

  if (!rooms.length) {
    grid.innerHTML = `
      <div class="rooms-empty">
        <div class="empty-icon">
          <svg class="icon icon-2xl"><use href="#icon-building"/></svg>
        </div>
        <p>No rooms yet — be the first to create one!</p>
      </div>`;
    return;
  }

  const currentUser = getCurrentUser();

  grid.innerHTML = rooms.map((room, i) => {
    const isCreator = currentUser && room.createdBy && room.createdBy._id === currentUser.id;
    const memberCount = Array.isArray(room.members) ? room.members.length : 0;
    const creatorName = room.createdBy?.name || 'Unknown';
    const timeAgo = room.createdAt ? formatTimeAgo(room.createdAt) : '';

    return `
    <div class="room-card" style="animation-delay: ${i * 0.05}s" data-room-id="${room._id}">
      <div class="room-card-top">
        <div class="room-info">
          <div class="room-name">${escapeHtml(room.name)}</div>
          <div class="room-topic">
            <svg class="icon icon-sm"><use href="#icon-book-open"/></svg> ${escapeHtml(room.topic)}
          </div>
        </div>
        <div class="room-actions-top">
          ${isCreator ? `<button class="btn-icon danger delete-room-btn" title="Delete room" data-room-id="${room._id}"><svg class="icon icon-sm"><use href="#icon-trash"/></svg></button>` : ''}
        </div>
      </div>

      <div class="room-meta">
        <span class="badge badge-members">
          <svg class="icon icon-sm"><use href="#icon-users"/></svg> ${memberCount} member${memberCount !== 1 ? 's' : ''}
        </span>
        <span
          class="badge badge-code"
          title="Click to copy invite code"
          onclick="copyToClipboard('${room.joinCode}')"
        >
          <svg class="icon icon-sm"><use href="#icon-hash"/></svg> ${room.joinCode}
        </span>
        <span class="badge badge-creator">by ${escapeHtml(creatorName)} · ${timeAgo}</span>
      </div>

      <div class="room-card-footer">
        <button class="btn-join-room" data-room-id="${room._id}">
          Enter Room <svg class="icon icon-sm"><use href="#icon-arrow-right"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  // Wire up join buttons
  grid.querySelectorAll('.btn-join-room').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomId = btn.dataset.roomId;
      handleJoinById(roomId, btn);
    });
  });

  // Wire up delete buttons
  grid.querySelectorAll('.delete-room-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteRoom(btn.dataset.roomId, btn);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ── Fetch Rooms ───────────────────────────────────────────────────────────────
async function fetchRooms() {
  const token = getToken();
  try {
    const res = await fetch('/api/rooms', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch rooms');
    const rooms = await res.json();
    renderRooms(rooms);
  } catch (err) {
    const grid = document.getElementById('rooms-grid');
    if (grid) {
      grid.innerHTML = `<div class="rooms-empty"><div class="empty-icon"><svg class="icon icon-2xl"><use href="#icon-alert"/></svg></div><p>Failed to load rooms. Please refresh.</p></div>`;
    }
  }
}

// ── Create Room ───────────────────────────────────────────────────────────────
async function handleCreateRoom(e) {
  e.preventDefault();
  const token = getToken();
  const name  = document.getElementById('room-name-input').value.trim();
  const topic = document.getElementById('room-topic-input').value.trim();
  const btn   = document.getElementById('create-room-btn');

  if (!name || !topic) return showToast('Please enter a room name and topic.', 'error');

  setButtonLoading(btn, true);
  try {
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, topic }),
    });
    const data = await res.json();
    if (!res.ok) {
      setButtonLoading(btn, false);
      return showToast(data.error || 'Failed to create room.', 'error');
    }
    showToast('Room created! Taking you in…', 'success');
    setTimeout(() => { window.location.href = `/room/${data._id}`; }, 600);
  } catch {
    setButtonLoading(btn, false);
    showToast('Network error. Please try again.', 'error');
  }
}

// ── Join by Code ──────────────────────────────────────────────────────────────
async function handleJoinByCode(e) {
  e.preventDefault();
  const token = getToken();
  const joinCode = document.getElementById('join-code-input').value.trim().toUpperCase();
  const btn = document.getElementById('join-code-btn');

  if (!joinCode || joinCode.length !== 6) return showToast('Please enter a valid 6-character code.', 'error');

  setButtonLoading(btn, true);
  try {
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ joinCode }),
    });
    const data = await res.json();
    if (!res.ok) {
      setButtonLoading(btn, false);
      return showToast(data.error || 'Room not found.', 'error');
    }
    showToast('Joined! Taking you in…', 'success');
    setTimeout(() => { window.location.href = `/room/${data._id}`; }, 600);
  } catch {
    setButtonLoading(btn, false);
    showToast('Network error. Please try again.', 'error');
  }
}

// ── Join by ID (from card button) ─────────────────────────────────────────────
async function handleJoinById(roomId, btn) {
  const token = getToken();
  if (btn) { btn.disabled = true; btn.textContent = 'Joining…'; }

  try {
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ joinCode: allRooms.find(r => r._id === roomId)?.joinCode }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (btn) { btn.disabled = false; btn.innerHTML = 'Enter Room <svg class="icon icon-sm"><use href="#icon-arrow-right"/></svg>'; }
      return showToast(data.error || 'Failed to join room.', 'error');
    }
    window.location.href = `/room/${data._id}`;
  } catch {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Enter Room <svg class="icon icon-sm"><use href="#icon-arrow-right"/></svg>'; }
    showToast('Network error. Please try again.', 'error');
  }
}

// ── Delete Room ───────────────────────────────────────────────────────────────
async function handleDeleteRoom(roomId, btn) {
  const token = getToken();
  if (!confirm('Delete this room? This cannot be undone.')) return;

  const card = btn.closest('.room-card');
  if (card) { card.style.opacity = '0.4'; card.style.pointerEvents = 'none'; }

  try {
    const res = await fetch(`/api/rooms/${roomId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      if (card) { card.style.opacity = ''; card.style.pointerEvents = ''; }
      return showToast(data.error || 'Failed to delete room.', 'error');
    }
    showToast('Room deleted.', 'success');
    if (card) {
      card.style.transform = 'scale(0.9)';
      card.style.transition = 'all 0.3s ease';
      setTimeout(() => { card.remove(); }, 300);
    }
    allRooms = allRooms.filter(r => r._id !== roomId);
    const countLabel = document.getElementById('room-count-label');
    if (countLabel) countLabel.textContent = `(${allRooms.length})`;
  } catch {
    if (card) { card.style.opacity = ''; card.style.pointerEvents = ''; }
    showToast('Network error. Please try again.', 'error');
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
function handleSearch(query) {
  if (!query.trim()) {
    renderRooms(allRooms);
    return;
  }
  const q = query.toLowerCase();
  const filtered = allRooms.filter(
    r =>
      r.name.toLowerCase().includes(q) ||
      r.topic.toLowerCase().includes(q) ||
      (r.createdBy?.name || '').toLowerCase().includes(q)
  );
  renderRooms(filtered);
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }

  syncNavbar();
  fetchRooms();

  // Create Room
  const createForm = document.getElementById('create-room-form');
  if (createForm) createForm.addEventListener('submit', handleCreateRoom);

  // Join by Code
  const joinForm = document.getElementById('join-code-form');
  if (joinForm) joinForm.addEventListener('submit', handleJoinByCode);

  // Search (wired safely inside DOMContentLoaded)
  const searchInput = document.getElementById('room-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  // Auto-uppercase join code input
  const joinCodeInput = document.getElementById('join-code-input');
  if (joinCodeInput) {
    joinCodeInput.addEventListener('input', () => {
      joinCodeInput.value = joinCodeInput.value.toUpperCase();
    });
  }
});