import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import { renderWithProviders } from '../test/utils';
import api from '../services/api';

jest.mock('../services/api', () => {
  const real = jest.requireActual('../services/api');
  return { __esModule: true, ...real, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } };
});

const renderLogin = () =>
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>Home page</p>} />
    </Routes>,
    { route: '/login' }
  );

beforeEach(() => jest.clearAllMocks());

describe('LoginPage', () => {
  test('shows validation errors for empty and malformed input', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), '123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  test('logs in, stores the session, honours remember me and redirects', async () => {
    api.post.mockResolvedValue({ data: { token: 'jwt-token', user: { id: 2, name: 'Asha', role: 'customer', rewardPoints: 1 } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'user@bookstore.com');
    await userEvent.type(screen.getByLabelText('Password'), 'User@1234');
    await userEvent.click(screen.getByLabelText('Remember me'));
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'user@bookstore.com', password: 'User@1234', remember: true });
    expect(JSON.parse(window.localStorage.getItem('ebs_session')).token).toBe('jwt-token');
  });

  test('shows the server error and a loading state while submitting', async () => {
    let reject;
    api.post.mockReturnValue(new Promise((_, r) => { reject = r; }));
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'user@bookstore.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled();
    reject({ response: { status: 401, data: { error: 'Invalid email or password' } } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    await waitFor(() => expect(screen.getByRole('button', { name: /^sign in$/i })).toBeEnabled());
    expect(window.localStorage.getItem('ebs_session')).toBeNull();
  });
});
