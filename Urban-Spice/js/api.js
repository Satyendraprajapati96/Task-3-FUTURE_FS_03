/* =========================================================================
   URBAN SPICE — api.js
   Thin fetch wrapper around the backend REST API. Loaded before script.js.

   Change API_BASE_URL to your deployed backend URL when you go live
   (e.g. 'https://urban-spice-api.onrender.com/api'). During local
   development it points at the backend running via `npm run dev`
   (see urban-spice-backend/README.md).
   ========================================================================= */

(function () {
  const API_BASE_URL = 'http://localhost:5000/api';
  const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

  /**
   * Core request helper. Always sends/expects JSON unless `raw` is passed
   * (used for multipart/form-data, which needs the browser to set its own
   * Content-Type boundary). Throws an Error with `.status` and `.errors`
   * (matching the backend's { success, message, errors } shape) on failure.
   */
  async function request(path, { method = 'GET', body, raw = false, auth = false } = {}) {
    const headers = {};
    if (!raw) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = localStorage.getItem('urban-spice-customer-token');
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let res;
    try {
      res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        credentials: 'include',
        body: raw ? body : body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      const err = new Error('Could not reach the server. Please check your connection and try again.');
      err.status = 0;
      err.errors = [];
      throw err;
    }

    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      /* non-JSON response (e.g. an HTML error page) — payload stays null */
    }

    if (!res.ok) {
      const err = new Error((payload && payload.message) || `Request failed with status ${res.status}`);
      err.status = res.status;
      err.errors = (payload && payload.errors) || [];
      throw err;
    }

    return payload;
  }

  /** Resolves a relative /uploads/... path returned by the API into a full URL. */
  const resolveImage = (relativePath) => {
    if (!relativePath) return '';
    if (/^https?:\/\//i.test(relativePath)) return relativePath;
    return `${API_ORIGIN}${relativePath}`;
  };

  window.UrbanSpiceAPI = {
    API_BASE_URL,
    API_ORIGIN,
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
    patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
    del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
    resolveImage,
  };
})();
