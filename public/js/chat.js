/**
 * StudyRoom — Chat + Online Presence
 * Initialises Socket.io, loads message history, and manages online member list.
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

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Render a single message ───────────────────────────────────────────────────
function renderMessage(message, currentUserId, container) {
  const isOwn = message.senderId === currentUserId;

  const wrapper = document.createElement('div');
  wrapper.className = `msg-wrapper ${isOwn ? 'own' : 'other'}`;

  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = isOwn ? `You · ${formatTime(message.createdAt)}` : `${escapeHtml(message.senderName || 'Unknown')} · ${formatTime(message.createdAt)}`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = message.text;

  wrapper.appendChild(meta);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
}

function appendSystemMessage(text, container) {
  const el = document.createElement('div');
  el.className = 'msg-system';
  el.textContent = text;
  container.appendChild(el);
}

// ── Update online member list ─────────────────────────────────────────────────
function renderOnlineUsers(users, currentUserId) {
  const list = document.getElementById('online-list');
  const countEl = document.getElementById('members-count');
  if (!list) return;

  if (countEl) countEl.textContent = users.length;

  list.innerHTML = users.map(u => `
    <div class="online-member">
      <div class="member-avatar">${(u.userName || 'U')[0].toUpperCase()}</div>
      <span class="member-name">${escapeHtml(u.userName || 'Unknown')}</span>
      ${u.userId === currentUserId ? '<span class="member-you">(you)</span>' : ''}
    </div>
  `).join('');
}

// ── Main init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const workspace = document.querySelector('.room-workspace');
  if (!workspace) return;

  const token    = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token || !userJson) {
    window.location.href = '/login';
    return;
  }

  const currentUser = JSON.parse(userJson);
  const roomId      = workspace.getAttribute('data-room-id');

  // Sync navbar
  const navLogin  = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const navBadge  = document.getElementById('nav-user-badge');
  const navName   = document.getElementById('nav-username');
  const navAvatar = document.getElementById('nav-avatar');
  const navLogout = document.getElementById('nav-logout');
  if (navLogin)  navLogin.style.display  = 'none';
  if (navSignup) navSignup.style.display = 'none';
  if (navBadge)  navBadge.style.display  = 'flex';
  if (navName)   navName.textContent     = currentUser.name || currentUser.email;
  if (navAvatar) navAvatar.textContent   = (currentUser.name || 'U')[0].toUpperCase();
  if (navLogout) {
    navLogout.style.display = 'inline-flex';
    navLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    });
  }

  // Copy join code on click
  const codePill = document.getElementById('workspace-code');
  if (codePill) {
    codePill.style.cursor = 'pointer';
    codePill.addEventListener('click', () => {
      const code = document.getElementById('code-value')?.textContent;
      if (code) {
        navigator.clipboard.writeText(code);
        showToast(`Invite code "${code}" copied!`, 'success');
      }
    });
  }

  // ── Socket.io ─────────────────────────────────────────────────────────────
  const socket = io();
  window.roomSocket = socket;

  const msgContainer = document.getElementById('chat-messages');
  const form         = document.getElementById('chat-input-form');
  const input        = document.getElementById('chat-message-input');
  const typingEl     = document.getElementById('typing-indicator');
  const typingText   = document.getElementById('typing-text');

  // Join the room
  socket.emit('joinRoom', {
    roomId,
    userId:   currentUser.id,
    userName: currentUser.name || currentUser.email,
  });

  // Load message history
  socket.on('messageHistory', (messages) => {
    if (!msgContainer || !messages.length) return;
    messages.forEach(msg => renderMessage(msg, currentUser.id, msgContainer));
    msgContainer.scrollTop = msgContainer.scrollHeight;
  });

  // New incoming message
  socket.on('newMessage', (message) => {
    if (!msgContainer) return;
    renderMessage(message, currentUser.id, msgContainer);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  });

  // User joined notification
  socket.on('userJoined', ({ userName }) => {
    if (msgContainer) appendSystemMessage(`${userName} joined the room`, msgContainer);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  });

  // User left notification
  socket.on('userLeft', ({ userName }) => {
    if (msgContainer) appendSystemMessage(`${userName} left the room`, msgContainer);
  });

  // Online users list
  socket.on('onlineUsers', (users) => {
    renderOnlineUsers(users, currentUser.id);
  });

  // Typing indicator
  let typingTimeout;
  socket.on('userTyping', ({ userName, isTyping }) => {
    if (!typingEl || !typingText) return;
    if (isTyping) {
      typingText.innerHTML = `<span>${escapeHtml(userName)} is typing</span> <span class="typing-dots"><span></span><span></span><span></span></span>`;
      typingEl.classList.remove('hidden');
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => typingEl.classList.add('hidden'), 3000);
    } else {
      typingEl.classList.add('hidden');
    }
  });

  // Message error
  socket.on('messageError', ({ error }) => showToast(error, 'error'));

  // ── Send message ──────────────────────────────────────────────────────────
  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      socket.emit('sendMessage', {
        roomId,
        userId:   currentUser.id,
        userName: currentUser.name || currentUser.email,
        text,
      });

      input.value = '';
      socket.emit('typing', { roomId, userName: currentUser.name, isTyping: false });
    });

    // Typing events
    let myTypingTimeout;
    input.addEventListener('input', () => {
      socket.emit('typing', { roomId, userName: currentUser.name, isTyping: true });
      clearTimeout(myTypingTimeout);
      myTypingTimeout = setTimeout(() => {
        socket.emit('typing', { roomId, userName: currentUser.name, isTyping: false });
      }, 1500);
    });

    // Send on Enter (Shift+Enter for newline)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });
  }

  // ── Tab system ────────────────────────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(`panel-${btn.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });
});