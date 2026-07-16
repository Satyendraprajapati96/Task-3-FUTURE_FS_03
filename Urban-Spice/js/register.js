/* =========================================================================
   URBAN SPICE — register.js (main site)
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const api = window.UrbanSpiceAPI;
  const auth = window.UrbanSpiceAuth;
  const form = document.getElementById('register-form');
  const errorEl = document.getElementById('register-error');

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

  const validators = {
    fullName: (v) => v.trim().length >= 2 ? '' : 'Please enter your full name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    username: (v) => {
      if (!v.trim()) return ''; // optional
      if (v.trim().length < 3 || v.trim().length > 30) return 'Username must be 3-30 characters.';
      if (!/^[a-zA-Z0-9_.]+$/.test(v.trim())) return 'Letters, numbers, underscores and dots only.';
      return '';
    },
    phone: (v) => !v.trim() || /^[0-9+()\-\s]{7,16}$/.test(v.trim()) ? '' : 'Enter a valid phone number.',
    password: (v) => v.length >= 8 ? '' : 'Password must be at least 8 characters.',
    confirmPassword: (v) => v === form.password.value ? '' : 'Passwords do not match.',
  };

  form.querySelectorAll('.field').forEach((input) => {
    input.addEventListener('blur', () => {
      const rule = validators[input.name];
      if (rule) showFieldError(input.id, rule(input.value));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    let valid = true;
    form.querySelectorAll('.field').forEach((input) => {
      const rule = validators[input.name];
      if (rule) {
        const message = rule(input.value);
        showFieldError(input.id, message);
        if (message) valid = false;
      }
    });
    if (!valid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    try {
      const res = await api.post('/customers/register', {
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        username: form.username.value.trim() || undefined,
        phone: form.phone.value.trim() || undefined,
        password: form.password.value,
        confirmPassword: form.confirmPassword.value,
      });
      // Registration logs the user straight in — no separate login step needed.
      auth.setSession(res.data.token, res.data.user);
      window.location.href = 'index.html';
    } catch (err) {
      if (err.errors && err.errors.length) {
        err.errors.forEach(({ field, message }) => showFieldError(field, message));
      } else {
        errorEl.textContent = err.message || 'Could not create account — please try again.';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
