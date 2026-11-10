import api, { sessionStore } from './api';

/** Mock authentication facade: login(), logout(), currentUser(). Session is kept in localStorage. */
export async function login(email, password, remember = false) {
  const { data } = await api.post('/auth/login', { email, password, remember });
  sessionStore.set({ token: data.token, user: data.user });
  return data.user;
}

export async function logout() {
  try {
    if (sessionStore.get()) await api.post('/auth/logout');
  } finally {
    sessionStore.clear();
  }
}

/** Returns the freshly validated user from the API, or null when not signed in. */
export async function currentUser() {
  const session = sessionStore.get();
  if (!session?.token) return null;
  try {
    const { data } = await api.get('/auth/user');
    sessionStore.set({ ...session, user: data.user });
    return data.user;
  } catch {
    sessionStore.clear();
    return null;
  }
}

export const cachedUser = () => sessionStore.get()?.user || null;
