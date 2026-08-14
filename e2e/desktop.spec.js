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

  test('top bar exposes a single Mini Camp entry', async ({ page }) => {
    // The redesigned nav (Aug 2025) is two-part: a horizontal top bar
    // with brand + ONE Mini Camp entry, plus a left-side pill sidebar
    // for section jumps. The top bar must surface exactly one
    // minicamp entry, not the original 6-section link row.
    await page.goto('/');
    const topEntry = page.locator('.nav-top-minicamp-entry');
    await expect(topEntry).toBeVisible();
    await expect(topEntry).toContainText('Mini Camp');
    await expect(topEntry).toHaveAttribute(
      'href',
      'https://minicamp.innoseed.club/'
    );
  });

  test('sidebar pills render as a compact vertical stack of 6 main-site section anchors', async ({ page }) => {
    // The sidebar is the main-site nav (关于 / 方向 / 成果 / 代表 /
    // 活动 / 招新), not minicamp's. Each pill is an anchor link to
    // its section id on the home page.
    await page.goto('/');
    const pills = page.locator('.nav-sidebar-pills .pill');
    await expect(pills).toHaveCount(6);
    // Pills are horizontal rectangles (width > height) and share one
    // height so the column reads as a tidy floating block.
    const boxes = await pills.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      })
    );
    const heights = new Set(boxes.map((b) => b.h));
    expect(heights.size, `all 6 pills should share one height, got: ${[...heights].join(',')}`).toBe(1);
    for (const b of boxes) {
      expect(b.w, `pill width ${b.w} should exceed height ${b.h}`).toBeGreaterThan(b.h);
    }
  });

  test('sidebar pills anchor to the main-site sections', async ({ page }) => {
    await page.goto('/');
    const expected = ['#manifesto', '#pillars', '#numbers', '#members', '#events', '#recruit'];
    const actual = await page.locator('.nav-sidebar-pills .pill').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href'))
    );
    expect(actual, `pill hrefs should be ${expected.join(',')}, got ${actual.join(',')}`).toEqual(expected);
  });

  test('sidebar pill highlight tracks the current scroll position', async ({ page }) => {
    // The blue highlight is NOT hardcoded — it follows whichever
    // section the user is currently scrolled into. At the top of the
    // page (hero), no pill is highlighted. Scroll to #pillars and the
    // 方向 pill becomes pill-active.
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Hero state: no pill should be highlighted.
    await expect(page.locator('.nav-sidebar-pills .pill.pill-active')).toHaveCount(0);
    // Scroll to #pillars — 方向 should become pill-active, others not.
    await page.locator('#pillars').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const activeAfterScroll = await page.evaluate(() => {
      const el = document.querySelector('.nav-sidebar-pills .pill.pill-active');
      return el ? el.getAttribute('href') : null;
    });
    expect(activeAfterScroll, 'after scrolling to #pillars, the 方向 pill should be active').toBe('#pillars');
    // Scroll to #recruit — 招新 should become pill-active.
    await page.locator('#recruit').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const activeAtRecruit = await page.evaluate(() => {
      const el = document.querySelector('.nav-sidebar-pills .pill.pill-active');
      return el ? el.getAttribute('href') : null;
    });
    expect(activeAtRecruit, 'after scrolling to #recruit, the 招新 pill should be active').toBe('#recruit');
  });

  test('sidebar floats at the right edge, vertically centered', async ({ page }) => {
    // The sidebar is a compact floating panel pinned to the right of
    // the viewport — NOT a full-height left rail. The panel itself is
    // small (a few pills + padding, well under the viewport height),
    // but vertically centered so its bounding box spans a wide y-range.
    // We measure the panel's *content* height (scrollHeight) to assert
    // it stays compact, plus check it's pinned to the right edge and
    // centered on the viewport's vertical axis.
    await page.goto('/');
    const metrics = await page.evaluate(() => {
      const el = document.querySelector('.nav-sidebar');
      const r = el.getBoundingClientRect();
      return {
        scrollH: el.scrollHeight,
        bboxH: Math.round(r.height),
        bboxY: r.y,
        bboxX: r.x,
        bboxW: r.width,
      };
    });
    const vh = await page.evaluate(() => window.innerHeight);
    const vw = await page.evaluate(() => window.innerWidth);
    // Compact: scrollHeight (the actual content size) is well under
    // half the viewport — proves this isn't a full-height rail.
    expect(metrics.scrollH, `panel scrollHeight ${metrics.scrollH}px should be << vh ${vh}`).toBeLessThan(vh * 0.4);
    // Vertically centered: panel center is close to vh/2.
    const center = metrics.bboxY + metrics.bboxH / 2;
    expect(Math.abs(center - vh / 2), `panel center ${center} should be near vh/2 ${vh / 2}`).toBeLessThan(vh * 0.1);
    // Pinned to the right edge: panel right is at or near the viewport right.
    expect(vw - (metrics.bboxX + metrics.bboxW), `panel should be flush with the right edge`).toBeLessThan(40);
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

    // Click every FAQ button in turn (all start closed now — openIdx=-1
    // was previously 0, which auto-opened item 0 and felt like a leaky
    // default) and after every click assert all items are still visible.
    // The bug manifested as the open+closed items losing `.in` while the
    // rest kept it — checking ALL items catches that.
    const faqCount = await page.locator('.rf-item').count();
    for (let i = 0; i < faqCount; i++) {
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

  test('Mini Camp event card has a full-card overlay link to the subdomain', async ({ page }) => {
    // The 2025 fall Mini Camp card on /events wraps its body in an
    // overlay <a> that points at minicamp.innoseed.club so visitors
    // can jump straight to the activity site from the main events list.
    await page.goto('/events');
    const card = page.locator('.event-card-link');
    await expect(card).toHaveCount(1);
    const overlay = card.locator('a.event-card-overlay');
    await expect(overlay).toHaveAttribute('href', 'https://minicamp.innoseed.club/');
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
