import { expect } from '@playwright/test';

/**
 * Shared assertions used by both desktop.spec and mobile.spec.
 *
 * Playwright requires test functions to use the destructuring pattern
 * `async ({ page }) => ...`, so each helper takes the fixture object
 * (or { page } specifically) rather than a bare page argument.
 */

export const ALL_SECTIONS = [
  { selector: '.hero', id: 'top' },
  { selector: '.marquee' },
  { selector: '.manifesto', id: 'manifesto' },
  { selector: '.pillars', id: 'pillars' },
  { selector: '.numbers', id: 'numbers' },
  { selector: '.members', id: 'members' },
  { selector: '.inside' },
  { selector: '.recruit', id: 'recruit' },
  { selector: '.footer', id: 'footer' },
];

export async function checkAllSections({ page }) {
  await page.goto('/');
  for (const sec of ALL_SECTIONS) {
    await expect(page.locator(sec.selector), `section ${sec.selector} missing`).toBeAttached();
  }
}

export async function checkNoConsoleErrors({ page }) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
}

export async function checkHeroH1Visible({ page }) {
  // v4 React refactor originally missed useReveal on hero h1, leaving it
  // opacity:0 forever. This guard ensures it never regresses.
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const h1 = page.locator('.hero h1');
  await expect(h1).toBeVisible();
  const opacity = await h1.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(opacity).toBeGreaterThan(0.99);
}

export async function checkNavSmoothScroll({ page }) {
  await page.goto('/');
  // Footer is always visible; the nav links live behind the hamburger on
  // mobile so we can't rely on them for a cross-viewport test.
  await page.locator('.footer a[href="#pillars"]').click();
  // Wait for the native smooth scroll to settle. We poll scrollY and break
  // once it stops changing for 200ms — robust against varying scroll
  // distances (short scroll finishes in <300ms, top-to-bottom in ~1500ms).
  await page.waitForFunction(() => {
    const w = window;
    if (w.__lastY === undefined) { w.__lastY = -1; w.__stableSince = 0; }
    if (w.scrollY === w.__lastY) {
      if (w.__stableSince === 0) w.__stableSince = Date.now();
      if (Date.now() - w.__stableSince > 200) return true;
    } else {
      w.__lastY = w.scrollY;
      w.__stableSince = 0;
    }
    return false;
  }, null, { timeout: 5000 });
  const top = await page.locator('#pillars').evaluate((el) => el.getBoundingClientRect().top);
  // useSmoothAnchorScroll offsets by 60px so the section clears the fixed nav.
  expect(top, `pillars top ${top}, expected ~60`).toBeGreaterThanOrEqual(-2);
  expect(top).toBeLessThan(120);
}
