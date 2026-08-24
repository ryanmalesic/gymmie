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

test("opens the dashboard shell and users from the landing page", async ({
  context,
  page,
}) => {
  const email = `e2e-route-${crypto.randomUUID()}@example.com`;
  const testSession = await createTestSession(databaseUrl, {
    email,
    name: "Route Test User",
  });

  await addSessionCookie(context, testSession.cookie);

  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Open dashboard" })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(new URL(page.url()).pathname).toBe("/dashboard");
  expect(page.url()).not.toContain("(dashboard)");
  expect(page.url()).not.toContain("(marketing)");
  expect(page.url()).not.toContain("(auth)");
  await expect(
    page.getByRole("heading", { name: "Welcome back, Route Test User" }),
  ).toBeVisible();
  await expect(page.getByText("Gymmie").first()).toBeVisible();

  await page.getByRole("link", { exact: true, name: "Users" }).click();
  await expect(page).toHaveURL(/\/users$/);
  expect(new URL(page.url()).pathname).toBe("/users");
  expect(page.url()).not.toContain("(dashboard)");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.getByRole("cell", { name: email })).toBeVisible();
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

test("logs out from the dashboard user menu", async ({ context, page }) => {
  await addSessionCookie(
    context,
    (
      await createTestSession(databaseUrl, {
        email: `e2e-logout-${crypto.randomUUID()}@example.com`,
        name: "Logout Test User",
      })
    ).cookie,
  );

  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome back, Logout Test User" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /logout test user/i }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Gymmie" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign in" }).first(),
  ).toBeVisible();
});
