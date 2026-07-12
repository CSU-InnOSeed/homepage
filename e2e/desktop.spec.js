import { test, expect } from '@playwright/test';
import {
  checkAllSections,
  checkNoConsoleErrors,
  checkHeroH1Visible,
  checkNavSmoothScroll,
} from './_shared.js';

// Pin the viewport to 1440x900 — this spec asserts desktop layout invariants.
test.use({ viewport: { width: 1440, height: 900 } });

test.describe('desktop @ 1440x900', () => {
  test('all 9 sections render', checkAllSections);
  test('no console errors', checkNoConsoleErrors);
  test('hero h1 is visible (regression guard)', checkHeroH1Visible);
  test('nav scrolls smoothly to each section', checkNavSmoothScroll);

  test('hamburger is hidden at desktop', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nav-toggle')).toBeHidden();
  });

  test('nav links are visible in a single row', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('.nav-links a');
    await expect(links).toHaveCount(6);
    const tops = await links.evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top))
    );
    const uniqueTops = [...new Set(tops)];
    expect(uniqueTops.length, `expected one row, got tops: ${tops.join(',')}`).toBe(1);
  });

  test('numbers count-up finishes at target value', async ({ page }) => {
    await page.goto('/');
    await page.locator('.numbers').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2800);
    const counters = page.locator('.num-counter');
    const count = await counters.count();
    expect(count).toBeGreaterThanOrEqual(4);
    const texts = await counters.allTextContents();
    for (const t of texts) {
      expect(t, `counter "${t}" should match digits + optional +`).toMatch(/^\d+\+?$/);
    }
  });

  test('pillars grid is 4 columns', async ({ page }) => {
    await page.goto('/');
    const cols = await page.locator('.pillars-grid').evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.split(' ').length
    );
    expect(cols).toBe(4);
  });

  test('FAQ accordion: opening/closing keeps every item visible (regression guard)', async ({ page }) => {
    // Recruit page renders the FAQ accordion. Earlier the .in class was
    // added to .rf-item via classList.add, but a state change (openIdx)
    // re-evaluated the className prop and React overwrote the `class`
    // attribute, silently stripping `.in` from the just-clicked item and
    // collapsing it to opacity:0. This test pins the fix: every item must
    // stay visible (opacity >= 0.95) after several open/close clicks.
    await page.goto('/recruit');
    const list = page.locator('.rf-list');
    await list.scrollIntoViewIfNeeded();
    // Wait for IntersectionObserver + 1.1s CSS transition to reveal all
    // items — without this the test races the in-view animation.
    await page.waitForFunction(() => {
      const items = document.querySelectorAll('.rf-item');
      return Array.from(items).every(
        (el) => el.classList.contains('in') && parseFloat(getComputedStyle(el).opacity) > 0.95
      );
    }, null, { timeout: 5000 });

    // Click each FAQ button in turn (all 5 start closed now — openIdx=-1
    // was previously 0, which auto-opened item 0 and felt like a leaky
    // default) and after every click assert all 5 items are still
    // visible. The bug manifested as the open+closed items losing `.in`
    // while the rest kept it — checking ALL items catches that.
    for (let i = 0; i < 5; i++) {
      await page.locator('.rf-item').nth(i).locator('.rf-q').click();
      await page.waitForFunction((idx) => {
        const items = document.querySelectorAll('.rf-item');
        return Array.from(items).every(
          (el, j) => el.classList.contains('in') && parseFloat(getComputedStyle(el).opacity) > 0.95
        );
      }, i, { timeout: 2000 });
    }
  });

  test('FAQ: all items start closed (no default-open regression)', async ({ page }) => {
    // Earlier openIdx defaulted to 0, which auto-expanded the first
    // question on every page load — felt like the answer was leaking out.
    // Pin openIdx=-1 by asserting no .rf-a is present on initial render.
    await page.goto('/recruit');
    const list = page.locator('.rf-list');
    await list.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const items = document.querySelectorAll('.rf-item');
      return Array.from(items).every(
        (el) => el.classList.contains('in') && parseFloat(getComputedStyle(el).opacity) > 0.95
      );
    }, null, { timeout: 5000 });
    const answers = await page.locator('.rf-a').count();
    expect(answers, 'no FAQ answer should be rendered on initial load').toBe(0);
  });

  test('FAQ: focus indicator is on the question text, not a row frame', async ({ page }) => {
    // The .rf-q button is `width: 100%` so the global :focus-visible
    // outline (3px solid var(--brand)) framed the entire FAQ row,
    // looking like a focus bug. We override .rf-q:focus-visible to drop
    // that outline and instead underline the question text + add a
    // tighter ring on the toggle.
    //
    // Headless Chromium's :focus-visible matching is unreliable (Tab
    // sometimes doesn't trigger it, programmatic .focus() never does),
    // so instead of testing the live focus state we verify the compiled
    // CSS contains the override — this pins the fix at the source level
    // without depending on browser focus heuristics.
    await page.goto('/');
    const css = await page.evaluate(async () => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const out = [];
      for (const l of links) {
        const r = await fetch(l.href);
        out.push(await r.text());
      }
      return out.join('\n');
    });
    expect(css, '.rf-q:focus-visible { outline: none } must be in the bundle').toMatch(
      /\.rf-q:focus-visible\s*\{\s*outline:\s*none/
    );
    expect(css, 'the toggle should get a 2px focus ring instead').toMatch(
      /\.rf-q:focus-visible\s+\.rf-toggle\s*\{\s*outline:\s*2px/
    );
  });
});
