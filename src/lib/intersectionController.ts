/**
 * intersectionController — module-level singleton IntersectionObservers.
 *
 * The landing page registers 20+ reveal targets and 4 count-up targets
 * with `useReveal` / `useCountUp`. Each call previously spun up its own
 * IO, which meant N observers + N closures for what's effectively two
 * config variants (reveal: threshold 0.15 / rootMargin 0 0 -60px 0;
 * count-up: threshold 0.4).
 *
 * Sharing one IO per config variant:
 *   - Drops observer count from ~25 to 2.
 *   - Cuts the IO callback fan-out from N to 1 per variant.
 *   - Each observer instance runs its own layout-thrash loop; fewer
 *     observers measurably reduces main-thread cost on scroll.
 *
 * The contract with the hooks is unchanged: an Element is observed,
 * when it intersects the registered callback fires once, and the
 * controller stops observing it. Hooks still own the cleanup path
 * (on unmount the hook calls `unobserve`, which here means: remove
 * the entry from the controller's map; the IO then no longer reports
 * for that element).
 */

type Callback = (entry: IntersectionObserverEntry) => void;

interface ControllerEntry {
  callback: Callback;
}

interface Controller {
  observer: IntersectionObserver | null;
  entries: WeakMap<Element, ControllerEntry>;
  fallbackClass: string | null;
  options: IntersectionObserverInit;
}

function createController(options: IntersectionObserverInit, fallbackClass: string | null): Controller {
  return {
    observer: null,
    entries: new WeakMap(),
    fallbackClass,
    options,
  };
}

function ensureObserver(controller: Controller): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  if (controller.observer) return controller.observer;
  controller.observer = new IntersectionObserver((list) => {
    // The DOM spec types the IntersectionObserver callback's list as
    // an array-like of IntersectionObserverEntry, but TS DOM lib
    // versions have variously typed it as an array, an entries() method,
    // or a PerformanceObserver-style iterable. We narrow at runtime
    // via a duck-type check rather than casting blindly, so this file
    // keeps working if the DOM lib types shift again.
    const raw = list as unknown;
    let entries: IntersectionObserverEntry[];
    if (Array.isArray(raw)) {
      entries = raw as IntersectionObserverEntry[];
    } else if (
      raw &&
      typeof (raw as { entries?: unknown }).entries === 'function'
    ) {
      entries = (raw as { entries: () => IntersectionObserverEntry[] }).entries();
    } else if (
      raw &&
      typeof (raw as { getEntries?: unknown }).getEntries === 'function'
    ) {
      entries = (raw as { getEntries: () => IntersectionObserverEntry[] }).getEntries();
    } else {
      // Last-ditch: bail out cleanly. We don't want to throw inside an
      // IO callback — a stale observer would keep firing forever.
      return;
    }
    for (const entry of entries) {
      const rec = controller.entries.get(entry.target);
      if (!rec) continue;
      if (entry.isIntersecting) {
        rec.callback(entry);
        // Stop reporting for this target — the callback is one-shot.
        controller.entries.delete(entry.target);
        controller.observer?.unobserve(entry.target);
      }
    }
  }, controller.options);
  return controller.observer;
}

/** reveal: add .in once visible. */
const reveal = createController(
  { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
  'in'
);

/** countUp: fire animation once visible. */
const countUp = createController(
  { threshold: 0.4 },
  null
);

/**
 * observe — register a one-shot callback for `el` against the named
 * controller. The callback fires the first time `el` intersects; the
 * controller then unobserves it.
 *
 * Returns a teardown function that removes the registration. If the
 * element has already intersected (callback fired and was deleted),
 * teardown is a no-op.
 */
export function observe(
  kind: 'reveal' | 'countUp',
  el: Element,
  callback: Callback
): () => void {
  const controller = kind === 'reveal' ? reveal : countUp;
  const observer = ensureObserver(controller);
  if (!observer) {
    // No IO support — fall back to firing immediately if we have a
    // class to apply, otherwise call the callback right away.
    if (controller.fallbackClass) {
      (el as HTMLElement).classList.add(controller.fallbackClass);
    } else {
      callback({
        isIntersecting: true,
        target: el,
      } as unknown as IntersectionObserverEntry);
    }
    return () => undefined;
  }
  controller.entries.set(el, { callback });
  observer.observe(el);
  return () => {
    if (!controller.entries.has(el)) return;
    controller.entries.delete(el);
    controller.observer?.unobserve(el);
  };
}
