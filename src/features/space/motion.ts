import { clampProgress } from '../rocket/types';

/** Motion needs a real browser (IntersectionObserver) and a visitor who allows it. */
export function motionAllowed() {
  if (typeof IntersectionObserver === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Complete the wordmark reveal as soon as its full box fits inside the viewport. */
export function footerRevealProgress(top: number, height: number, viewportHeight: number) {
  return clampProgress((viewportHeight - top) / Math.max(1, height));
}
