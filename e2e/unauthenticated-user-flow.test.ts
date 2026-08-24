import { expect, test } from "@playwright/test";

test("keeps the landing and sign-in pages public", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Gymmie");
  await expect(page.getByRole("heading", { name: "Gymmie" })).toBeVisible();
  expect(page.url()).not.toContain("(marketing)");
  expect(page.url()).not.toContain("(auth)");
  expect(page.url()).not.toContain("(dashboard)");

  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.locator('[data-slot="card-title"]', { hasText: "Welcome back" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Login with Google" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Login with Apple" }),
  ).toBeVisible();
  expect(page.url()).not.toContain("(auth)");
});
