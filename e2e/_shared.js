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

/**
 * Heuristics for telling apart "code has a bug" from "the network blipped".
 *
 * Browsers auto-emit a console.error("Failed to load resource: ...")
 * for any sub-resource (font, image, fetch, etc.) that the page tried to
 * load but couldn't. These are not application errors — they're network
 * errors. In CI we hit `ERR_CONNECTION_CLOSED` against
 * `fonts.googleapis.com` from headless Chromium because the network path
 * out to Google's CDN is flaky. That is not a regression and shouldn't
 * fail the suite.
 *
 * What we DO want to catch:
 *   - Any `console.error(...)` emitted from our own code (analytics
 *     hooks intentionally emit these; allow-list them if needed).
 *   - Any `pageerror` — i.e. an uncaught exception in JS land.
 */
const RESOURCE_ERROR_PREFIXES = [
  'Failed to load resource',
  'net::ERR_',           // ERR_CONNECTION_CLOSED / ERR_FAILED / ERR_NAME_NOT_RESOLVED …
];

function isResourceError(text) {
  return RESOURCE_ERROR_PREFIXES.some((p) => text.startsWith(p) || text.includes(p));
}

export async function checkNoConsoleErrors({ page }) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (isResourceError(text)) return;
    errors.push(text);
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
  // useReveal fires via IntersectionObserver + 1.1s CSS transition. We
  // wait for the .in class to be applied AND for opacity to climb above
  // 0.95 — the original 0.99 threshold was tight enough to flake on
  // mid-transition frames in headless Chromium.
  await page.waitForFunction(
    () => {
      const el = document.querySelector('.hero h1');
      if (!el || !el.classList.contains('in')) return false;
      return parseFloat(getComputedStyle(el).opacity) > 0.95;
    },
    null,
    { timeout: 4000 }
  );
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
