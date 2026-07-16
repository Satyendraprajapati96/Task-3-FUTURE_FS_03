/* =========================================================================
   URBAN SPICE — auth.js
   Shared customer-auth helpers used across index.html, login.html and
   register.html. Loaded after api.js, before script.js.

   Public pages (Home/About/Menu/Gallery/Testimonials/Contact) never require
   login — this file only toggles the navbar between "Login/Register" and
   "Hi, Name / Logout", and exposes a small guard other scripts can call
   before any future customer-only feature (e.g. "My Reservations").
   ========================================================================= */

(function () {
  const TOKEN_KEY = 'urban-spice-customer-token';
  const USER_KEY = 'urban-spice-customer-user';

  /* One-time cleanup: wipes any stale/demo session data left over from
     earlier development so the auth system starts from a clean state.
     Guarded by a flag so it only ever runs once per browser and never
     signs out a real, later session. */
  if (!localStorage.getItem('urban-spice-auth-cleaned-v1')) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('urban-spice-user-token'); // old/demo key naming, if it ever existed
    localStorage.removeItem('urban-spice-user'); // ditto
    localStorage.setItem('urban-spice-auth-cleaned-v1', 'true');
  }

  const isLoggedIn = () => !!localStorage.getItem(TOKEN_KEY);

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (_) {
      return null;
    }
  };

  const setSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  /** Clears the session and returns to the public Home/Dashboard page — never to Login. */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'index.html';
  };

  /**
   * Call this before any customer-only action (e.g. a future "My
   * Reservations" feature). Sends guests to the login page if needed and
   * returns false so the caller can stop; returns true if already signed in.
   */
  const requireAuth = () => {
    if (isLoggedIn()) return true;
    window.location.href = 'login.html';
    return false;
  };

  const updateNavAuthUI = () => {
    const loggedIn = isLoggedIn();
    document.querySelectorAll('.auth-nav-loggedout').forEach((el) => el.classList.toggle('hidden', loggedIn));
    document.querySelectorAll('.auth-nav-loggedin').forEach((el) => el.classList.toggle('hidden', !loggedIn));

    if (loggedIn) {
      const user = getUser();
      const nameEl = document.getElementById('nav-customer-name');
      if (nameEl && user) {
        const firstName = (user.fullName || user.username || user.email || '').split(' ')[0];
        nameEl.textContent = `Hi, ${firstName}`;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateNavAuthUI();
    document.querySelectorAll('.js-logout-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    });
  });

  window.UrbanSpiceAuth = { isLoggedIn, getUser, setSession, logout, requireAuth, updateNavAuthUI };
})();
