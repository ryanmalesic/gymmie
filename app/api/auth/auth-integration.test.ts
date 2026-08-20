import { toNextJsHandler } from 'better-auth/next-js';
import { getTestInstance } from 'better-auth/test';
import { expect, test } from 'vitest';

test('auth handler persists a session and serves its lifecycle', async () => {
  const instance = await getTestInstance({}, { testWith: 'sqlite' });
  const { headers } = await instance.signInWithTestUser();
  const { GET, POST } = toNextJsHandler(instance.auth);

  const sessionResponse = await GET(
    new Request('http://localhost:3000/api/auth/get-session', { headers })
  );
  const sessionBody = await sessionResponse.json();

  expect(sessionResponse.ok).toBe(true);
  expect(sessionBody.session.id).toEqual(expect.any(String));
  expect(sessionBody.user.id).toEqual(expect.any(String));

  const signOutResponse = await POST(
    new Request('http://localhost:3000/api/auth/sign-out', {
      headers,
      method: 'POST',
    })
  );

  expect(signOutResponse.ok).toBe(true);

  const expiredSessionResponse = await GET(
    new Request('http://localhost:3000/api/auth/get-session', { headers })
  );

  expect(await expiredSessionResponse.json()).toBeNull();
});
