import { test, expect } from '@playwright/test';
import {
  checkAllSections,
  checkNoConsoleErrors,
  checkHeroH1Visible,
  checkNavSmoothScroll,
} from './_shared.js';

// Pin the viewport to 375x812 (iPhone 14) — this spec asserts mobile
// layout invariants + hamburger menu behavior.
test.use({ viewport: { width: 375, height: 812 } });

test.describe('mobile @ 375x812', () => {
  test('all 9 sections render', checkAllSections);
  test('no console errors', checkNoConsoleErrors);
  test('hero h1 is visible (regression guard)', checkHeroH1Visible);
  test('nav scrolls smoothly to each section', checkNavSmoothScroll);

  test('hamburger is visible and starts closed', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('.nav-toggle');
    await expect(hamburger).toBeVisible();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  test('hamburger opens panel with all 6 links', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-toggle').click();
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.nav-links')).toBeVisible();
    await expect(page.locator('.nav-links a')).toHaveCount(6);
  });

  test('Esc closes the menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-toggle').click();
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking a nav link closes the menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-toggle').click();
    await page.locator('.nav-links a[href="#pillars"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  test('hero CTAs stack vertically on mobile', async ({ page }) => {
    await page.goto('/');
    const dir = await page.locator('.hero-cta').evaluate((el) =>
      getComputedStyle(el).flexDirection
    );
    expect(dir).toBe('column');
  });

  test('pillars grid collapses to 1 column', async ({ page }) => {
    await page.goto('/');
    const cols = await page.locator('.pillars-grid').evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.split(' ').length
    );
    expect(cols).toBe(1);
  });

  test('hero h1 + CTAs fit above the fold (no scroll needed)', async ({ page }) => {
    await page.goto('/');
    const box = await page.locator('.hero-cta').boundingBox();
    expect(box, 'hero-cta should be visible').not.toBeNull();
    expect(box.y + box.height, 'CTA bottom should be within viewport').toBeLessThan(812);
  });

  test('hamburger toggle is at least 44x44px (touch target)', async ({ page }) => {
    await page.goto('/');
    const box = await page.locator('.nav-toggle').boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
