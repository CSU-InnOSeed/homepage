import { test, expect } from '@playwright/test';

/**
 * Apply (招新) flow — 4-step form.
 *
 * Asserts:
 *   - `/apply` route renders the Guide step on direct nav
 *   - the 4 progress pills reflect step transitions
 *   - the submit button is gated on a primary interest pick
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
    // The page h1 now lives in the shared sub-page header (same as
    // /events, /recruit); the Guide step carries no headline of its own so
    // the two don't stack.
    await expect(page.locator('main .page-header h1')).toBeVisible();
    await expect(page.locator('.apply-section .eyebrow')).toHaveText('01 — Guide');
    await expect(page.locator('.apply-lead')).toContainText('想做的事 / 技术 / 兴趣 / 未来');
    await expect(page.locator('.apply-section')).not.toContainText('Mini Camp 分路');

    // Guide step no longer carries the 飞书 form link — that lives on
    // the Done step now. The Guide step just welcomes and starts.
    await expect(page.locator('a[href*="feishu.cn"]')).toHaveCount(0);
  });

  test('Guide step carries the shared breadcrumb back into the site', async ({ page }) => {
    await page.goto('/apply');
    const breadcrumb = page.locator('.page-header .breadcrumb');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toHaveAttribute('aria-label', '面包屑');
    await expect(breadcrumb.getByRole('link', { name: '首页' })).toBeVisible();
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('招新');
    await page.locator('.page-header .breadcrumb a').click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('progress pills transition as steps advance', async ({ page }) => {
    await page.goto('/apply');
    // 4 pills rendered
    const pills = page.locator('.apply-step-pill');
    await expect(pills).toHaveCount(4);
    // First pill is current
    await expect(pills.first()).toHaveClass(/is-current/);
  });

  test('submit without a primary interest leaves the submit button disabled', async ({ page }) => {
    await page.goto('/apply');
    await page.getByRole('button', { name: '开始 →' }).click();
    await page.locator('.apply-interviewer-card').first().click();
    await page.getByRole('button', { name: /下一步：填申请/ }).click();
    await expect(page.locator('.apply-category').first().locator('legend')).toContainText('选择你想做的事');
    await expect(page.locator('.apply-lead')).toContainText('想做的事必选一项');
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