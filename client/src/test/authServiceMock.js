// Shared mock for services/authService: reads the session seeded in localStorage by seedSession().
const read = () => {
  try {
    return JSON.parse(window.localStorage.getItem('ebs_session'))?.user ?? null;
  } catch {
    return null;
  }
};

module.exports = {
  cachedUser: () => read(),
  currentUser: () => Promise.resolve(read()),
  login: jest.fn(),
  logout: jest.fn(() => Promise.resolve()),
};
