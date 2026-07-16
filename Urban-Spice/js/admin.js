/* =========================================================================
   URBAN SPICE — admin.js
   Drives admin.html: login, dashboard stats, reservations & messages
   management. Talks to the backend via window.UrbanSpiceAPI (js/api.js).
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const api = window.UrbanSpiceAPI;
  const TOKEN_KEY = 'urban-spice-admin-token';

  /* ---------------------------------------------------------------------
     Dark mode toggle (shares the same preference key as the public site)
     --------------------------------------------------------------------- */
  const root = document.documentElement;
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const savedTheme = localStorage.getItem('urban-spice-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const applyTheme = (dark) => {
    root.classList.toggle('dark', dark);
    themeToggles.forEach(btn => btn.setAttribute('aria-pressed', dark));
  };
  applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);
  themeToggles.forEach(btn => btn.addEventListener('click', () => {
    const isDark = root.classList.contains('dark');
    applyTheme(!isDark);
    localStorage.setItem('urban-spice-theme', !isDark ? 'dark' : 'light');
  }));

  /* ---------------------------------------------------------------------
     Toast helper
     --------------------------------------------------------------------- */
  const toast = document.getElementById('toast');
  const showToast = (message) => {
    if (!toast) return;
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  };

  const escapeHTML = (str = '') => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (iso) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  /* ---------------------------------------------------------------------
     Auth: login / logout / session check
     --------------------------------------------------------------------- */
  const loginView = document.getElementById('admin-login-view');
  const appView = document.getElementById('admin-app');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const userEmailEl = document.getElementById('admin-user-email');

  const showApp = (user) => {
    loginView.style.display = 'none';
    appView.classList.add('active');
    if (user?.email) userEmailEl.textContent = user.email;
    loadDashboard();
  };

  const showLogin = (message = '') => {
    appView.classList.remove('active');
    loginView.style.display = 'flex';
    if (message) loginError.textContent = message;
  };

  const checkSession = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!api || !token) return showLogin();
    try {
      const res = await api.get('/auth/me', { auth: true });
      showApp(res?.data?.user);
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      showLogin();
    }
  };

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const submitBtn = loginForm.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    try {
      const res = await api.post('/auth/login', {
        email: loginForm.email.value.trim(),
        password: loginForm.password.value,
      });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      loginForm.reset();
      showApp(res.data.user);
    } catch (err) {
      loginError.textContent = err.message || 'Login failed — please check your credentials.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await api.post('/auth/logout', {}, { auth: true }); } catch (_) { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    showLogin();
  });

  /* ---------------------------------------------------------------------
     Sidebar navigation between views
     --------------------------------------------------------------------- */
  const navLinks = document.querySelectorAll('.admin-nav-link');
  const views = document.querySelectorAll('.admin-view');
  const viewTitle = document.getElementById('admin-view-title');
  const TITLES = { dashboard: 'Dashboard', reservations: 'Reservations', messages: 'Messages' };

  const switchView = (viewName) => {
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.view === viewName));
    views.forEach(v => v.classList.toggle('active', v.id === `view-${viewName}`));
    viewTitle.textContent = TITLES[viewName] || 'Dashboard';
    if (viewName === 'reservations') loadReservations();
    if (viewName === 'messages') loadMessages();
  };

  navLinks.forEach(link => link.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
  }));

  /* ---------------------------------------------------------------------
     Dashboard: stat cards + recent activity
     --------------------------------------------------------------------- */
  const loadDashboard = async () => {
    const cardsEl = document.getElementById('stat-cards');
    const activityBody = document.getElementById('activity-body');

    try {
      const res = await api.get('/admin/dashboard/stats', { auth: true });
      const d = res.data;
      cardsEl.innerHTML = [
        { label: 'Total Reservations', value: d.reservations.total },
        { label: "Today's Reservations", value: d.reservations.today },
        { label: 'Pending Reservations', value: d.reservations.pending },
        { label: 'Unread Messages', value: d.contacts.unread },
      ].map(c => `
        <div class="stat-card">
          <div class="stat-value">${c.value}</div>
          <div class="stat-label">${c.label}</div>
        </div>`).join('');
    } catch (err) {
      cardsEl.innerHTML = `<p class="admin-empty col-span-full">Couldn't load stats — ${escapeHTML(err.message)}</p>`;
    }

    try {
      const res = await api.get('/admin/dashboard/recent-activity', { auth: true });
      const activity = res.data.activity || [];
      activityBody.innerHTML = activity.length
        ? activity.map(a => `
            <tr>
              <td class="capitalize">${escapeHTML(a.type)}</td>
              <td>${escapeHTML(a.summary)}</td>
              <td><span class="status-pill status-${escapeHTML(a.status)}">${escapeHTML(a.status)}</span></td>
              <td style="color:var(--text-muted)">${formatDateTime(a.createdAt)}</td>
            </tr>`).join('')
        : `<tr><td colspan="4" class="admin-empty">Nothing yet — new bookings and messages will show up here.</td></tr>`;
    } catch (err) {
      activityBody.innerHTML = `<tr><td colspan="4" class="admin-empty">Couldn't load recent activity.</td></tr>`;
    }
  };

  /* ---------------------------------------------------------------------
     Reservations: filter, table, status update, delete, pagination
     --------------------------------------------------------------------- */
  const resState = { page: 1, search: '', status: '', date: '' };

  const buildQuery = (params) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return qs ? `?${qs}` : '';
  };

  const renderPagination = (container, pagination, onPageChange) => {
    if (!pagination || pagination.totalPages <= 1) { container.innerHTML = ''; return; }
    container.innerHTML = `
      <button class="icon-btn" id="${container.id}-prev" ${pagination.page <= 1 ? 'disabled style="opacity:.4"' : ''} aria-label="Previous page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <span class="text-xs font-mono" style="color:var(--text-muted)">Page ${pagination.page} of ${pagination.totalPages} &middot; ${pagination.total} total</span>
      <button class="icon-btn" id="${container.id}-next" ${pagination.page >= pagination.totalPages ? 'disabled style="opacity:.4"' : ''} aria-label="Next page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
      </button>`;
    document.getElementById(`${container.id}-prev`)?.addEventListener('click', () => onPageChange(pagination.page - 1));
    document.getElementById(`${container.id}-next`)?.addEventListener('click', () => onPageChange(pagination.page + 1));
  };

  const loadReservations = async () => {
    const body = document.getElementById('reservations-body');
    body.innerHTML = `<tr class="admin-loading-row"><td colspan="8">Loading…</td></tr>`;

    try {
      const query = buildQuery({ page: resState.page, limit: 10, search: resState.search, status: resState.status, date: resState.date });
      const res = await api.get(`/admin/reservations${query}`, { auth: true });
      const { reservations, pagination } = res.data;

      body.innerHTML = reservations.length ? reservations.map(r => `
        <tr data-id="${r._id}">
          <td><span class="font-medium">${escapeHTML(r.customerName)}</span></td>
          <td>
            <div>${escapeHTML(r.email)}</div>
            <div style="color:var(--text-muted)">${escapeHTML(r.phone)}</div>
          </td>
          <td>${formatDate(r.date)}<br><span style="color:var(--text-muted)">${escapeHTML(r.time)}</span></td>
          <td>${r.guests}</td>
          <td style="max-width:220px;color:var(--text-muted)">${escapeHTML(r.specialRequest || '—')}</td>
          <td>
            <select class="status-select res-status-select" data-id="${r._id}">
              ${['pending', 'confirmed', 'cancelled', 'completed'].map(s => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
          <td style="color:var(--text-muted)">${formatDate(r.createdAt)}</td>
          <td>
            <button class="icon-btn res-delete-btn" data-id="${r._id}" aria-label="Delete reservation">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
            </button>
          </td>
        </tr>`).join('') : `<tr><td colspan="8" class="admin-empty">No reservations match your filters.</td></tr>`;

      renderPagination(document.getElementById('reservations-pagination'), pagination, (p) => { resState.page = p; loadReservations(); });

      body.querySelectorAll('.res-status-select').forEach(select => {
        select.addEventListener('change', async () => {
          const id = select.dataset.id;
          const prevValue = select.dataset.prev || select.value;
          try {
            await api.patch(`/admin/reservations/${id}/status`, { status: select.value }, { auth: true });
            select.dataset.prev = select.value;
            showToast('Reservation status updated.');
            loadDashboard(); // keep stat cards in sync
          } catch (err) {
            select.value = prevValue;
            showToast(err.message || 'Could not update status.');
          }
        });
      });

      body.querySelectorAll('.res-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this reservation? This cannot be undone.')) return;
          try {
            await api.del(`/admin/reservations/${btn.dataset.id}`, { auth: true });
            showToast('Reservation deleted.');
            loadReservations();
            loadDashboard();
          } catch (err) {
            showToast(err.message || 'Could not delete reservation.');
          }
        });
      });
    } catch (err) {
      body.innerHTML = `<tr><td colspan="8" class="admin-empty">Couldn't load reservations — ${escapeHTML(err.message)}</td></tr>`;
    }
  };

  document.getElementById('res-filter-apply').addEventListener('click', () => {
    resState.page = 1;
    resState.search = document.getElementById('res-search').value.trim();
    resState.status = document.getElementById('res-status-filter').value;
    resState.date = document.getElementById('res-date-filter').value;
    loadReservations();
  });
  document.getElementById('res-filter-clear').addEventListener('click', () => {
    document.getElementById('res-search').value = '';
    document.getElementById('res-status-filter').value = '';
    document.getElementById('res-date-filter').value = '';
    resState.page = 1; resState.search = ''; resState.status = ''; resState.date = '';
    loadReservations();
  });
  document.getElementById('res-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('res-filter-apply').click();
  });

  /* ---------------------------------------------------------------------
     Messages: filter, table, mark read, delete, pagination
     --------------------------------------------------------------------- */
  const msgState = { page: 1, isRead: '' };

  const loadMessages = async () => {
    const body = document.getElementById('messages-body');
    body.innerHTML = `<tr class="admin-loading-row"><td colspan="6">Loading…</td></tr>`;

    try {
      const query = buildQuery({ page: msgState.page, limit: 10, isRead: msgState.isRead });
      const res = await api.get(`/admin/contacts${query}`, { auth: true });
      const { contacts, pagination } = res.data;

      body.innerHTML = contacts.length ? contacts.map(c => `
        <tr data-id="${c._id}">
          <td class="font-medium">${escapeHTML(c.name)}</td>
          <td>
            <div>${escapeHTML(c.email)}</div>
            <div style="color:var(--text-muted)">${escapeHTML(c.phone || '—')}</div>
          </td>
          <td style="max-width:280px;color:var(--text-muted)">${escapeHTML(c.message)}</td>
          <td style="color:var(--text-muted)">${formatDateTime(c.createdAt)}</td>
          <td><span class="status-pill ${c.isRead ? 'status-completed' : 'status-pending'}">${c.isRead ? 'Read' : 'Unread'}</span></td>
          <td class="flex gap-2">
            ${!c.isRead ? `<button class="icon-btn msg-read-btn" data-id="${c._id}" aria-label="Mark as read">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
            </button>` : ''}
            <button class="icon-btn msg-delete-btn" data-id="${c._id}" aria-label="Delete message">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
            </button>
          </td>
        </tr>`).join('') : `<tr><td colspan="6" class="admin-empty">No messages match your filters.</td></tr>`;

      renderPagination(document.getElementById('messages-pagination'), pagination, (p) => { msgState.page = p; loadMessages(); });

      body.querySelectorAll('.msg-read-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.patch(`/admin/contacts/${btn.dataset.id}/read`, {}, { auth: true });
            showToast('Marked as read.');
            loadMessages();
            loadDashboard();
          } catch (err) {
            showToast(err.message || 'Could not update message.');
          }
        });
      });

      body.querySelectorAll('.msg-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this message? This cannot be undone.')) return;
          try {
            await api.del(`/admin/contacts/${btn.dataset.id}`, { auth: true });
            showToast('Message deleted.');
            loadMessages();
            loadDashboard();
          } catch (err) {
            showToast(err.message || 'Could not delete message.');
          }
        });
      });
    } catch (err) {
      body.innerHTML = `<tr><td colspan="6" class="admin-empty">Couldn't load messages — ${escapeHTML(err.message)}</td></tr>`;
    }
  };

  document.getElementById('msg-filter-apply').addEventListener('click', () => {
    msgState.page = 1;
    msgState.isRead = document.getElementById('msg-status-filter').value;
    loadMessages();
  });

  /* ---------------------------------------------------------------------
     Kick things off
     --------------------------------------------------------------------- */
  checkSession();
});
