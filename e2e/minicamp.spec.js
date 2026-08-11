import { test, expect } from '@playwright/test';

/**
 * Mini Camp page (`/minicamp`) — `minicamp.innoseed.club` 子域名页。
 *
 * 路由表里 `/minicamp` 是新加的一条;SPA 里这条路由同时也是子域名根路径
 * 的着陆点(由 App.tsx 在 hostname 检测后同步 Navigate 过来)。
 *
 * 这些断言仅覆盖页面结构和内容渲染 — 域名跳转的 host-aware 逻辑在
 * 浏览器里靠 window.location.hostname 触发,无法在 e2e 里直接测。
 */

test.describe('minicamp @ /minicamp route', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('renders the activity header, tracks, and past camp', async ({ page }) => {
    await page.goto('/minicamp');
    await expect(page.locator('.minicamp-page')).toBeVisible();

    // Hero / page-header
    await expect(page.locator('.minicamp-page .page-header h1')).toBeVisible();
    // Eyebrow + breadcrumb carry the "Mini Camp" branding; the H1 holds the
    // Chinese headline.
    await expect(page.locator('.minicamp-page .eyebrow').first()).toContainText('Mini Camp');

    // 4 tracks render — one card per pillar accent
    const tracks = page.locator('.minicamp-track');
    await expect(tracks).toHaveCount(4);
    await expect(tracks.first()).toContainText('产品');
    await expect(tracks.nth(1)).toContainText('技术');
    await expect(tracks.nth(2)).toContainText('设计');
    await expect(tracks.nth(3)).toContainText('创业');

    // Past Mini Camp recap block
    await expect(page.locator('.minicamp-past')).toBeVisible();
    await expect(page.locator('.minicamp-past h2')).toContainText('2025 秋季 Mini Camp');

    // Mini Camp is an activity page, not a recruitment flow.
    await expect(page.locator('.minicamp-page')).toContainText('不是招新流程');
    await expect(page.locator('.minicamp-timeline')).toHaveCount(0);
    await expect(page.locator('.minicamp-cta')).toHaveCount(0);
  });

  test('on the main domain the page shows full Nav (not subdomain chrome)', async ({ page }) => {
    await page.goto('/minicamp');
    // The full Nav renders the link row
    await expect(page.locator('header nav a[href="#pillars"]')).toBeVisible();
    // Subdomain-only chrome should NOT be present
    await expect(page.locator('.minicamp-subdomain-head')).toHaveCount(0);
  });
});