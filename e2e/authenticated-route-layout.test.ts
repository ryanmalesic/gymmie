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

test("keeps the landing and sign-in pages public", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Gymmie");
  await expect(page.getByRole("heading", { name: "Gymmie" })).toBeVisible();

  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.locator('[data-slot="card-title"]', { hasText: "Sign in" }),
  ).toBeVisible();
});

test("redirects unauthenticated users with the original safe callback", async ({
  page,
}) => {
  const response = await page.request.get(
    "/users?tab=members&filter=name%3Aalice",
    { maxRedirects: 0 },
  );

  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);

  const location = response.headers().location;
  expect(location).toBeTruthy();

  const redirectUrl = new URL(location!, "http://localhost:3000");
  expect(redirectUrl.pathname).toBe("/sign-in");
  expect(redirectUrl.searchParams.get("callbackUrl")).toBe(
    "/users?tab=members&filter=name%3Aalice",
  );
  expect(redirectUrl.searchParams.has("fresh")).toBe(false);
});

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
  const createdName = "Created Through Browser";

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
