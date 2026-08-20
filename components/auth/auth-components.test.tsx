import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AccountPanel } from '@/components/auth/account-panel';
import { SocialSignIn } from '@/components/auth/social-sign-in';

const mocks = vi.hoisted(() => ({
  authClient: {
    listAccounts: vi.fn(),
    signIn: { social: vi.fn() },
    signOut: vi.fn(),
  },
  router: { push: vi.fn() },
}));

vi.mock('@/lib/auth-client', () => ({ authClient: mocks.authClient }));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));

describe('AccountPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authClient.listAccounts.mockResolvedValue({
      data: [{ id: 'account_1', providerId: 'google' }],
      error: null,
    });
    mocks.authClient.signOut.mockResolvedValue({ error: null });
  });

  test('loads and displays linked accounts', async () => {
    render(<AccountPanel />);

    expect(await screen.findByText('google')).toBeDefined();
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  test('shows a recoverable error when account loading rejects', async () => {
    mocks.authClient.listAccounts.mockRejectedValue(new Error('network failure'));

    render(<AccountPanel />);

    const error = await screen.findByRole('alert');
    expect(error.textContent).toBe('Unable to load linked accounts.');
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  test('signs out and redirects home', async () => {
    render(<AccountPanel />);
    await screen.findByText('google');

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith('/'));
  });
});

describe('SocialSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authClient.signIn.social.mockResolvedValue({ error: null });
  });

  test('shows the provider error and clears pending state when sign-in rejects', async () => {
    mocks.authClient.signIn.social.mockRejectedValue(new Error('network failure'));

    render(<SocialSignIn />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    const error = await screen.findByRole('alert');
    expect(error.textContent).toBe('Unable to sign in with google.');
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toHaveProperty(
      'disabled',
      false
    );
  });
});
