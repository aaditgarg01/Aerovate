type Options = { fps?: number; canRun?: () => boolean };

/** Run decorative frames only while their element and tab are visible. */
export function visibleAnimation(element: HTMLElement, draw: (now: number, seconds: number) => void | boolean, { fps = 60, canRun = () => true }: Options = {}) {
  let visible = typeof IntersectionObserver === 'undefined';
  let frame = 0, last = 0, lastDraw = 0, elapsed = 0;
  let disposed = false;
  const interval = 1000 / fps;
  const allowed = () => !disposed && visible && !document.hidden && canRun();
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = last = lastDraw = elapsed = 0;
    element.dataset.animating = 'false';
  };
  const tick = (now: number) => {
    frame = 0;
    if (!allowed()) { stop(); return; }
    elapsed += last ? now - last : interval;
    last = now;
    if (elapsed + .01 >= interval) {
      const seconds = Math.min(.05, lastDraw ? (now - lastDraw) / 1000 : interval / 1000);
      lastDraw = now;
      elapsed = Math.max(0, elapsed - interval);
      if (draw(now, seconds) === false) { stop(); return; }
    }
    frame = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (!allowed()) { stop(); return; }
    element.dataset.animating = 'true';
    if (!frame) { last = lastDraw = elapsed = 0; frame = requestAnimationFrame(tick); }
  };
  const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  });
  element.dataset.animating = 'false';
  observer?.observe(element);
  document.addEventListener('visibilitychange', wake);
  if (!observer) wake();
  return { wake, dispose: () => {
    disposed = true;
    stop();
    observer?.disconnect();
    document.removeEventListener('visibilitychange', wake);
    delete element.dataset.animating;
  } };
}
