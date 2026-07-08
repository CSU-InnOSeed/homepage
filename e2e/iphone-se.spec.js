import { test, expect } from '@playwright/test';
import {
  checkAllSections,
  checkNoConsoleErrors,
  checkHeroH1Visible,
} from './_shared.js';

/**
 * iPhone SE 1st gen viewport (320x568) — the smallest end we ship for.
 *
 * This spec is a regression guard for tiny Android phones and older iOS
 * devices. It does NOT duplicate the mobile.spec tests at 375x812; it
 * asserts the things that uniquely break at ≤360px:
 *   - no horizontal scroll (the design has -0.04em letter-spacing on
 *     the huge display headline, which used to overflow at 320px)
 *   - hamburger still visible and ≥44x44
 *   - pillars stay single column
 *   - the hero h1 fits inside the viewport
 */
test.use({ viewport: { width: 320, height: 568 } });

test.describe('small phone @ 320x568 (iPhone SE 1)', () => {
  test('all 9 sections render', checkAllSections);
  test('no console errors', checkNoConsoleErrors);
  test('hero h1 is visible (regression guard)', checkHeroH1Visible);

  test('no horizontal overflow on the document', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    // 1px tolerance for sub-pixel rounding in headless Chromium.
    expect(
      overflow.scrollW,
      `document overflows: scrollW=${overflow.scrollW} clientW=${overflow.clientW}`
    ).toBeLessThanOrEqual(overflow.clientW + 1);
  });

  test('no element wider than the viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Only check the top-level <main> children. The marquee section is
    // skipped because its inner track is *designed* to be wider than
    // the viewport (it animates left). Other sections (hero, manifesto,
    // pillars, numbers, members, inside, recruit) are all supposed to
    // be 100vw-wide, so any overflow is a real regression.
    const wide = await page.evaluate((vw) => {
      const out = [];
      const main = document.querySelector('main');
      if (!main) return out;
      for (const el of main.children) {
        if (el.classList?.contains('marquee')) continue;
        const r = el.getBoundingClientRect();
        if (r.width > vw + 1) {
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: el.className?.toString().slice(0, 60) || '',
            w: Math.round(r.width),
          });
        }
      }
      return out;
    }, 320);
    expect(wide, `oversized sections:\n${JSON.stringify(wide, null, 2)}`).toEqual([]);
  });

  test('pillars collapse to a single column', async ({ page }) => {
    await page.goto('/');
    const cols = await page.locator('.pillars-grid').evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.split(' ').length
    );
    expect(cols).toBe(1);
  });

  test('numbers grid is single column', async ({ page }) => {
    await page.goto('/');
    const cols = await page.locator('.numbers-grid').evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.split(' ').length
    );
    expect(cols).toBe(1);
  });

  test('hamburger toggle is visible and ≥44x44px', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('.nav-toggle');
    await expect(hamburger).toBeVisible();
    const box = await hamburger.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('hero h1 fits inside the viewport (no horizontal clipping)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const h1 = page.locator('.hero h1');
    const box = await h1.boundingBox();
    // The h1 box is allowed to extend to the right edge; what we forbid
    // is starting at a negative x (which would mean it overflows the
    // left gutter) or ending past the right edge by more than 1px.
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(321);
  });
});
