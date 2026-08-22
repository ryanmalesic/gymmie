import { beforeEach, expect, test, vi } from "vitest";

import { auth } from "@/lib/auth";
import { createTestSession } from "@/test/auth-helper";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("resolves a session inserted directly into the database", async () => {
  const testSession = await createTestSession(process.env.DATABASE_URL!, {
    email: "authenticated@example.com",
    name: "Authenticated User",
  });

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: testSession.cookie }),
  });

  expect(session).toMatchObject({
    session: {
      token: testSession.sessionToken,
      userId: testSession.userId,
    },
    user: {
      email: "authenticated@example.com",
      id: testSession.userId,
      name: "Authenticated User",
    },
  });
});
