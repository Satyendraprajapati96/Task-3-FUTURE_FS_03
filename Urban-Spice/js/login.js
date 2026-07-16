/* =========================================================================
   URBAN SPICE — login.js (main site)
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const api = window.UrbanSpiceAPI;
  const auth = window.UrbanSpiceAuth;
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');

  // Already signed in? Skip straight back to the site.
  if (auth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const showFieldError = (id, message) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-error');
    input?.classList.toggle('field-error', !!message);
    if (err) err.textContent = message || '';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    showFieldError('identifier', '');
    showFieldError('password', '');

    const identifier = form.identifier.value.trim();
    const password = form.password.value;

    let valid = true;
    if (!identifier) { showFieldError('identifier', 'Please enter your email or username.'); valid = false; }
    if (!password) { showFieldError('password', 'Please enter your password.'); valid = false; }
    if (!valid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    try {
      const res = await api.post('/customers/login', { identifier, password });
      auth.setSession(res.data.token, res.data.user);
      window.location.href = 'index.html';
    } catch (err) {
      if (err.errors && err.errors.length) {
        err.errors.forEach(({ field, message }) => showFieldError(field, message));
      } else {
        errorEl.textContent = err.message || 'Could not sign in — please try again.';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
