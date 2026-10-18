/** Motion needs a real browser (IntersectionObserver) and a visitor who allows it. */
export function motionAllowed() {
  if (typeof IntersectionObserver === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Inertia scrolling for mouse wheels and trackpads (desktop only), similar to Lenis.
 * The page still scrolls natively — this only eases wheel input — so keyboard, touch,
 * scrollbars, anchors and `scrollIntoView` keep working, and `position: sticky` is untouched.
 */
export function smoothWheel() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  let target = window.scrollY;
  let current = window.scrollY;
  let expected = -1;
  let frame = 0;

  const max = () => document.documentElement.scrollHeight - window.innerHeight;
  const scrollableParent = (node: EventTarget | null) => {
    for (let el = node instanceof Element ? node : null; el && el !== document.body; el = el.parentElement) {
      const { overflowY } = getComputedStyle(el);
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return true;
    }
    return false;
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; expected = -1; };
  const step = () => {
    // Something else moved the page (scrollbar drag, keyboard, anchor link): hand back control.
    if (expected >= 0 && Math.abs(window.scrollY - expected) > 1.5) { stop(); return; }
    current += (target - current) * .1;
    if (Math.abs(target - current) < 1) current = target;
    expected = current;
    window.scrollTo({ top: current, behavior: 'instant' });
    frame = current === target ? 0 : requestAnimationFrame(step);
    if (!frame) expected = -1;
  };
  const onWheel = (event: WheelEvent) => {
    if (event.defaultPrevented || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || scrollableParent(event.target)) return;
    event.preventDefault();
    if (!frame) target = current = window.scrollY;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    target = Math.min(max(), Math.max(0, target + event.deltaY * unit));
    if (!frame) frame = requestAnimationFrame(step);
  };
  // Clicks (nav links, scrollbar) and keys take over immediately.
  const release = () => { if (frame) stop(); };
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('pointerdown', release, true);
  window.addEventListener('keydown', release, true);
  return () => {
    stop();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('pointerdown', release, true);
    window.removeEventListener('keydown', release, true);
  };
}
