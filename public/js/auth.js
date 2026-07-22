/**
 * StudyRoom — Toast notification system + shared auth utilities
 */

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg class="icon icon-sm"><use href="#icon-check-circle"/></svg>',
    error: '<svg class="icon icon-sm"><use href="#icon-x-circle"/></svg>',
    info: '<svg class="icon icon-sm"><use href="#icon-info"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-body">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3500);
}

// ── Navbar state ──────────────────────────────────────────────────────────────
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

function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Please wait…';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
  }
}

// ── Auth Init ─────────────────────────────────────────────────────────────────
function initAuth() {
  syncNavbar();

  // Sign Up Form Handler
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('signup-btn');
      const name     = document.getElementById('signup-name').value.trim();
      const email    = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;

      if (!name || !email || !password) {
        return showToast('Please fill in all fields.', 'error');
      }
      if (password.length < 6) {
        return showToast('Password must be at least 6 characters.', 'error');
      }

      setLoading(btn, true);
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          setLoading(btn, false);
          return showToast(data.error || 'Sign up failed.', 'error');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast('Account created! Redirecting…', 'success');
        setTimeout(() => { window.location.href = '/dashboard'; }, 800);
      } catch {
        setLoading(btn, false);
        showToast('Network error. Please try again.', 'error');
      }
    });
  }

  // Login Form Handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        return showToast('Please enter your email and password.', 'error');
      }

      setLoading(btn, true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          setLoading(btn, false);
          return showToast(data.error || 'Login failed.', 'error');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast('Welcome back! Redirecting…', 'success');
        setTimeout(() => { window.location.href = '/dashboard'; }, 800);
      } catch {
        setLoading(btn, false);
        showToast('Network error. Please try again.', 'error');
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}