import { expect, test } from "@playwright/test";

test("adding users shows each of them on the page", async ({ page }) => {
  const adaEmail = `ada-${crypto.randomUUID()}@example.com`;
  const alEmail = `al-${crypto.randomUUID()}@example.com`;

  await page.goto("/");

  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(adaEmail);
  await page.getByRole("button", { name: "Add user" }).click();

  await expect(page.getByText(`Ada Lovelace (${adaEmail})`)).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("");
  await expect(page.getByLabel("Email")).toHaveValue("");

  await page.getByLabel("Name").fill("Al");
  await page.getByLabel("Email").fill(alEmail);
  await page.getByRole("button", { name: "Add user" }).click();

  await expect(page.getByText(`Al (${alEmail})`)).toBeVisible();
  await expect(page.getByText(`Ada Lovelace (${adaEmail})`)).toBeVisible();
});
