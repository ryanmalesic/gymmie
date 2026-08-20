import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

const { getServerSession, requireServerSession } = await import('@/lib/session');

describe('session helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers({ cookie: 'session=test' }));
  });

  test('returns the current session from Better Auth', async () => {
    const session = { user: { id: 'user_1' } };
    mocks.getSession.mockResolvedValue(session);

    await expect(getServerSession()).resolves.toBe(session);
    expect(mocks.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });

  test('redirects unauthenticated requests', async () => {
    mocks.getSession.mockResolvedValue(null);
    mocks.redirect.mockImplementation(() => {
      throw new Error('redirected');
    });

    await expect(requireServerSession()).rejects.toThrow('redirected');
    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in');
  });
});
