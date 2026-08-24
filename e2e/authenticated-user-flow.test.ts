import { type BrowserContext, expect, test } from "@playwright/test";

import { createTestSession, sessionCookieName } from "@/test/auth-helper";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

async function addSessionCookie(
  context: BrowserContext,
  sessionCookie: string,
) {
  await context.addCookies([
    {
      name: sessionCookieName,
      url: "http://localhost:3000",
      value: sessionCookie.split("=", 2)[1],
    },
  ]);
}

test("protects users on direct and client-side navigation", async ({
  context,
  page,
}) => {
  const email = `e2e-route-${crypto.randomUUID()}@example.com`;
  const testSession = await createTestSession(databaseUrl, {
    email,
    name: "Route Test User",
  });

  await addSessionCookie(context, testSession.cookie);

  await page.goto("/users");
  await expect(page).toHaveURL(/\/users$/);
  expect(new URL(page.url()).pathname).toBe("/users");
  expect(page.url()).not.toContain("(authenticated)");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.getByRole("cell", { name: email })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/users$/);
  expect(new URL(page.url()).pathname).toBe("/users");
  expect(page.url()).not.toContain("(authenticated)");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
});

test("keeps the users query and form usable under the root provider", async ({
  context,
  page,
}) => {
  const session = await createTestSession(databaseUrl, {
    email: `e2e-form-session-${crypto.randomUUID()}@example.com`,
    name: "Form Session User",
  });
  const createdEmail = `e2e-created-${crypto.randomUUID()}@example.com`;
  const createdName = `Created Through Browser ${crypto.randomUUID()}`;

  await addSessionCookie(context, session.cookie);
  await page.goto("/users");

  await expect(
    page.locator('[data-slot="card-title"]', { hasText: "People" }),
  ).toBeVisible();
  await page.getByLabel("Name").fill(createdName);
  await page.getByLabel("Email").fill(createdEmail);
  const addUserButton = page.getByRole("button", { name: "Add user" });
  await expect(addUserButton).toBeEnabled();
  await addUserButton.click();

  await expect(page.getByRole("cell", { name: createdName })).toBeVisible();
  await expect(page.getByRole("cell", { name: createdEmail })).toBeVisible();
});

test("redirects an expired session to sign in with the users callback", async ({
  context,
  page,
}) => {
  const session = await createTestSession(databaseUrl, {
    email: `e2e-expired-session-${crypto.randomUUID()}@example.com`,
    name: "Expired Session User",
  });
  const createdEmail = `e2e-expired-create-${crypto.randomUUID()}@example.com`;

  await addSessionCookie(context, session.cookie);
  await page.goto("/users");
  await context.clearCookies();

  await page.getByLabel("Name").fill("Expired Session User");
  await page.getByLabel("Email").fill(createdEmail);
  await page.getByRole("button", { name: "Add user" }).click();

  await expect(page).toHaveURL(/\/sign-in\?/);
  const redirectUrl = new URL(page.url());
  expect(redirectUrl.pathname).toBe("/sign-in");
  expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/users");
  await expect(
    page.locator('[data-slot="card-title"]', { hasText: "Sign in" }),
  ).toBeVisible();
});
