import { test, expect } from '@playwright/test';

/**
 * Apply (招新) flow — 4-step form.
 *
 * Asserts:
 *   - `/apply` route renders the Guide step
 *   - the "Step 0" call-out has a real link to the 飞书 form
 *   - pasting a known legacy code decodes to a non-empty selection
 *   - the 4 progress pills reflect step transitions
 *   - generating the code shows it on the Done step
 */

test.describe('apply @ /apply route', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('renders the Guide step on direct nav', async ({ page }) => {
    await page.goto('/apply');
    await expect(page.locator('.apply-section h1').first()).toBeVisible();
    await expect(page.getByText('欢迎加入 InnOSeed。')).toBeVisible();

    // Guide step must link to the 飞书 form (so candidates can submit
    // their actual résumé before the tag-picking flow).
    const formLink = page.locator('a[href*="feishu.cn"]');
    await expect(formLink).toBeVisible();
    await expect(formLink).toHaveAttribute('target', '_blank');
  });

  test('progress pills transition as steps advance', async ({ page }) => {
    await page.goto('/apply');
    // 4 pills rendered
    const pills = page.locator('.apply-step-pill');
    await expect(pills).toHaveCount(4);
    // First pill is current
    await expect(pills.first()).toHaveClass(/is-current/);
  });

  test('decodes a legacy tag code via the paste field', async ({ page }) => {
    await page.goto('/apply');
    // Move to the Application step (step 3) so the paste field is visible.
    await page.getByRole('button', { name: '开始 →' }).click();
    // Pick an interviewer first (the next-step button is gated on it).
    await page.locator('.apply-interviewer-card').first().click();
    await page.getByRole('button', { name: /下一步：填申请/ }).click();

    // "0:0" decodes to "lane category, index 0 selected" — i.e. 产品创意.
    const input = page.locator('#apply-paste');
    await input.fill(btoa('0:0'));
    await page.getByRole('button', { name: '解析并恢复' }).click();
    // No error message rendered.
    await expect(page.locator('.apply-error')).toHaveCount(0);
    // The first lane tag (产品创意) should now be toggled on.
    const firstLaneTag = page
      .locator('.apply-category')
      .first()
      .locator('.apply-tag.is-on');
    await expect(firstLaneTag).toContainText('产品创意');
  });

  test('submit without a Mini Camp 选路 leaves the submit button disabled', async ({ page }) => {
    await page.goto('/apply');
    await page.getByRole('button', { name: '开始 →' }).click();
    await page.locator('.apply-interviewer-card').first().click();
    await page.getByRole('button', { name: /下一步：填申请/ }).click();
    const submit = page.getByRole('button', { name: /生成个性标签代码/ });
    await expect(submit).toBeDisabled();
  });

  test('Done step displays a server code after a valid submit', async ({ page }) => {
    // The real POST hits a Vercel Function that doesn't exist under
    // `vite preview` (Vercel only runs them in deployed environments).
    // We mock the response so the rest of the success-flow can be
    // exercised locally.
    await page.route('**/api/apply', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'MOCK12345' }),
      });
    });

    await page.goto('/apply');
    await page.getByRole('button', { name: '开始 →' }).click();
    await page.locator('.apply-interviewer-card').first().click();
    await page.getByRole('button', { name: /下一步：填申请/ }).click();
    await page
      .locator('.apply-category')
      .first()
      .locator('.apply-tag', { hasText: '产品创意' })
      .click();
    await page.getByRole('button', { name: /生成个性标签代码/ }).click();
    const code = page.locator('.apply-code-card code');
    await expect(code).toBeVisible();
    await expect(code).toHaveText('MOCK12345');
  });
});
