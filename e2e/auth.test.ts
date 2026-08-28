import { expect, test } from "@playwright/test";

import { createTestSession, sessionCookieName } from "@/test/auth";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

test("uses a database-inserted session through the browser cookie", async ({
  context,
  page,
}) => {
  const email = `e2e-${crypto.randomUUID()}@example.com`;
  const testSession = await createTestSession(databaseUrl, {
    email,
    name: "E2E Authenticated User",
  });

  await context.addCookies([
    {
      name: sessionCookieName,
      url: "http://localhost:3000",
      value: testSession.cookie.split("=", 2)[1],
    },
  ]);

  const response = await page.request.get("/api/auth/get-session");

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({
    user: {
      email,
      name: "E2E Authenticated User",
    },
  });
});
