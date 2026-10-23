/** One scheduled update per pointer frame; no work while idle, scrolling or backgrounded. */
export function blueprintMotion(element: HTMLElement) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, x = 0, y = 0;
  let bounds: DOMRect | null = null, svgBounds: DOMRect | null = null;
  const allowed = () => fine.matches && !reduce.matches && !document.hidden;
  const properties = ['--bp-x', '--bp-y', '--bp-roll', '--bp-tilt-x', '--bp-tilt-y', '--bp-glow-x', '--bp-glow-y', '--bp-probe-x', '--bp-probe-y'];
  const reset = () => {
    cancelAnimationFrame(frame); frame = 0; bounds = svgBounds = null;
    delete element.dataset.blueprintActive;
    properties.forEach(name => element.style.removeProperty(name));
  };
  const paint = () => {
    frame = 0;
    if (!allowed() || !bounds?.width || !bounds.height) { reset(); return; }
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const nx = clamp((x - bounds.left) / bounds.width), ny = clamp((y - bounds.top) / bounds.height);
    element.dataset.blueprintActive = 'true';
    const values = [
      `${(nx - .5) * 18}px`, `${(ny - .5) * 14}px`, `${(nx - .5) * 8}deg`,
      `${(.5 - ny) * 5}deg`, `${(nx - .5) * 6}deg`, `${nx * 100}%`, `${ny * 100}%`,
      `${clamp((x - (svgBounds?.left ?? bounds.left)) / (svgBounds?.width || bounds.width)) * 480}px`,
      `${clamp((y - (svgBounds?.top ?? bounds.top)) / (svgBounds?.height || bounds.height)) * 340}px`,
    ];
    properties.forEach((name, i) => element.style.setProperty(name, values[i]));
  };
  const move = (event: PointerEvent) => {
    if (!allowed() || event.pointerType !== 'mouse') return;
    if (!bounds) { bounds = element.getBoundingClientRect(); svgBounds = element.querySelector('svg')?.getBoundingClientRect() ?? null; }
    x = event.clientX; y = event.clientY;
    if (!frame) frame = requestAnimationFrame(paint);
  };
  element.addEventListener('pointermove', move, { passive: true });
  element.addEventListener('pointerleave', reset);
  window.addEventListener('scroll', reset, { passive: true });
  window.addEventListener('resize', reset);
  document.addEventListener('visibilitychange', reset);
  fine.addEventListener('change', reset);
  reduce.addEventListener('change', reset);
  return () => {
    reset();
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerleave', reset);
    window.removeEventListener('scroll', reset);
    window.removeEventListener('resize', reset);
    document.removeEventListener('visibilitychange', reset);
    fine.removeEventListener('change', reset);
    reduce.removeEventListener('change', reset);
  };
}
