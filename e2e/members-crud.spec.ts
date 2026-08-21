import { expect, test } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe.serial('authenticated member crud', () => {
  const memberName = 'Jane Doe';
  const memberEmail = 'jane.doe@example.com';
  const updatedName = 'Jane Smith';

  test('members page loads for authenticated user', async ({ page }) => {
    await page.goto('/members');

    await expect(page.getByRole('heading', { name: 'Member directory' })).toBeVisible();
    await expect(page.getByText('Signed in as')).toBeVisible();
    await expect(page.getByText('E2E Test User')).toBeVisible();
  });

  test('create a member', async ({ page }) => {
    await page.goto('/members');

    // click the "New member" tab
    await page.getByRole('tab', { name: 'New member' }).click();

    // fill in the form
    await page.getByLabel('Full name').fill(memberName);
    await page.getByLabel('Email address').fill(memberEmail);

    // submit
    await page.getByRole('button', { name: 'Add member' }).click();

    // switch back to the list tab and verify the member appears
    await page.getByRole('tab', { name: /All members/ }).click();
    await expect(page.getByText(memberName)).toBeVisible();
    await expect(page.getByText(memberEmail)).toBeVisible();
  });

  test('update a member', async ({ page }) => {
    await page.goto('/members');

    // wait for the member to appear
    await expect(page.getByText(memberName)).toBeVisible();

    // click edit on the member row
    const row = page.getByRole('row').filter({ hasText: memberName });
    await row.getByRole('button', { name: 'Edit' }).click();

    // change the name — use the aria-label which remains stable during editing
    const nameInput = page.getByLabel(`Edit ${memberName} name`);
    await nameInput.clear();
    await nameInput.fill(updatedName);

    // save — locate the row by its name input's aria-label (stable)
    const editingRow = page
      .getByRole('row')
      .filter({ has: page.getByLabel(`Edit ${memberName} name`) });
    await editingRow.getByRole('button', { name: 'Save' }).click();

    // verify the updated name appears
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('delete a member', async ({ page }) => {
    await page.goto('/members');

    // wait for the updated member to appear
    await expect(page.getByText(updatedName)).toBeVisible();

    // set up dialog handler before clicking delete
    page.on('dialog', (dialog) => dialog.accept());

    // click remove on the member row
    const row = page.getByRole('row').filter({ hasText: updatedName });
    await row.getByRole('button', { name: `Delete ${updatedName}` }).click();

    // verify the member is removed
    await expect(page.getByText(updatedName)).not.toBeVisible();
  });
});
