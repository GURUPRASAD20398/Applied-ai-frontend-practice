import axios from 'axios';

const SESSION_KEY = 'ebs_session';

export const sessionStore = {
  get() {
    try {
      return JSON.parse(window.localStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  },
  set(session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  clear() {
    window.localStorage.removeItem(SESSION_KEY);
  },
};

const api = axios.create({
  baseURL: '/api', // same-origin: Vite dev proxy / reverse proxy in production
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const session = sessionStore.get();
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Expired / revoked token: drop the session and tell the app.
    if (error.response?.status === 401 && sessionStore.get()) {
      sessionStore.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

/** Extracts a user-safe message and optional field errors from an Axios error. */
export function parseError(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.error) {
    return { message: error.response.data.error, fields: error.response.data.details || {} };
  }
  if (error?.code === 'ECONNABORTED' || error?.message === 'Network Error') {
    return { message: 'Unable to reach the server. Check your connection.', fields: {} };
  }
  return { message: fallback, fields: {} };
}

export default api;
