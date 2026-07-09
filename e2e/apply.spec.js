import { test, expect } from '@playwright/test';

/**
 * Apply (招新) flow — 4-step form.
 *
 * Asserts:
 *   - `/apply` route renders the Guide step on direct nav
 *   - the 4 progress pills reflect step transitions
 *   - the submit button is gated on a Mini Camp 选路 pick
 *   - a valid submit transitions to Done and shows the server-assigned code
 *   - the Done step surfaces the Step 0 (投递简历) callout with a real
 *     link to the 飞书 form — the link now lives here instead of the
 *     Guide step, so the candidate sees it right after generating the
 *     code (the natural next action).
 */

test.describe('apply @ /apply route', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('renders the Guide step on direct nav', async ({ page }) => {
    await page.goto('/apply');
    await expect(page.locator('.apply-section h1').first()).toBeVisible();
    await expect(page.getByText('欢迎加入 InnOSeed。')).toBeVisible();

    // Guide step no longer carries the 飞书 form link — that lives on
    // the Done step now. The Guide step just welcomes and starts.
    await expect(page.locator('a[href*="feishu.cn"]')).toHaveCount(0);
  });

  test('progress pills transition as steps advance', async ({ page }) => {
    await page.goto('/apply');
    // 4 pills rendered
    const pills = page.locator('.apply-step-pill');
    await expect(pills).toHaveCount(4);
    // First pill is current
    await expect(pills.first()).toHaveClass(/is-current/);
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

  test('Done step surfaces the post-submit résumé callout with the Feishu link', async ({ page }) => {
    // Mock /api/apply so we can run end-to-end under `vite preview`.
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

    // The Done step now carries the résumé-drop callout.
    const callout = page.locator('.apply-callout');
    await expect(callout).toBeVisible();
    await expect(callout).toContainText('投递简历');

    const formLink = callout.locator('a[href*="feishu.cn"]');
    await expect(formLink).toBeVisible();
    await expect(formLink).toHaveAttribute('target', '_blank');
  });
});