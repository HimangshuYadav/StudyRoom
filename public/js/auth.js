/**
 * Handles user signup.
 */
async function handleSignup(event) {
  event.preventDefault();

  const form = event.target;

  const name = form.querySelector('[name="name"]').value.trim();
  const email = form.querySelector('[name="email"]').value.trim();
  const password = form.querySelector('[name="password"]').value;

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Signup failed.');
    }

    const data = await response.json();

    const token = data.token;

    if (!token) {
      throw new Error('Authentication token not received.');
    }

    localStorage.setItem('token', token);

    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Signup Error:', error);
    alert(error.message || 'Unable to create account.');
  }
}

/**
 * Handles user login.
 */
async function handleLogin(event) {
  event.preventDefault();

  const form = event.target;

  const email = form.querySelector('[name="email"]').value.trim();
  const password = form.querySelector('[name="password"]').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid email or password.');
    }

    const data = await response.json();

    const token = data.token;

    if (!token) {
      throw new Error('Authentication token not received.');
    }

    localStorage.setItem('token', token);

    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Login Error:', error);
    alert(error.message || 'Login failed.');
  }
}

// Bind DOM event listeners on load
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
});