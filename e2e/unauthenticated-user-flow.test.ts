import { expect, test } from "@playwright/test";

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

test("redirects unauthenticated users with the requested callback", async ({
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
});
