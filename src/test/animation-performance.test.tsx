import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { visibleAnimation } from '../features/space/visibleAnimation';
import { ScrollMotion } from '../features/space/ScrollMotion';
import Globe from '../features/glimpses/Globe';
import { ThrustTechSection } from '../features/thrust-tech/ThrustTechSection';

afterEach(() => vi.unstubAllGlobals());

function frameHarness() {
  let time = 0, id = 0, hidden = false;
  const frames = new Map<number, FrameRequestCallback>();
  const observers = new Map<IntersectionObserverCallback, Set<Element>>();
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { frames.set(++id, fn); return id; });
  vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key));
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  vi.stubGlobal('IntersectionObserver', class {
    targets = new Set<Element>();
    constructor(private callback: IntersectionObserverCallback) { observers.set(callback, this.targets); }
    observe = (el: Element) => this.targets.add(el);
    unobserve = (el: Element) => this.targets.delete(el);
    disconnect = () => observers.delete(this.callback);
  });
  const enter = (element: Element, visible: boolean) => act(() => {
    for (const [callback, targets] of observers) if (targets.has(element)) {
      callback([{ target: element, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  });
  const step = (count = 1) => act(() => {
    for (let i = 0; i < count; i++) {
      time += 1000 / 60;
      const callbacks = [...frames.values()]; frames.clear();
      callbacks.forEach(fn => fn(time));
    }
  });
  const background = (value: boolean) => act(() => { hidden = value; document.dispatchEvent(new Event('visibilitychange')); });
  return { frames, enter, step, background };
}

describe('Animation work budget', () => {
  it('schedules zero frames offscreen or in a background tab, and resumes without a large time jump', () => {
    const rig = frameHarness();
    const element = document.createElement('div');
    const draw = vi.fn();
    const animation = visibleAnimation(element, draw);
    expect(rig.frames.size).toBe(0);
    rig.enter(element, true); rig.step(10);
    expect(draw).toHaveBeenCalled();
    rig.enter(element, false);
    expect(rig.frames.size).toBe(0);
    const count = draw.mock.calls.length;
    rig.step(120); expect(draw).toHaveBeenCalledTimes(count);
    rig.enter(element, true); rig.background(true);
    expect(rig.frames.size).toBe(0);
    rig.step(300); rig.background(false); rig.step();
    expect(draw.mock.calls.at(-1)![1]).toBeLessThanOrEqual(.05);
    animation.dispose(); expect(rig.frames.size).toBe(0);
  });

  it('limits slow decorative drawing to 30 updates per second and obeys pause controls', () => {
    const rig = frameHarness();
    const element = document.createElement('div');
    let enabled = true;
    const draw = vi.fn();
    const animation = visibleAnimation(element, draw, { fps: 30, canRun: () => enabled });
    rig.enter(element, true); rig.step(60);
    expect(draw.mock.calls.length).toBeGreaterThanOrEqual(29);
    expect(draw.mock.calls.length).toBeLessThanOrEqual(31);
    enabled = false; animation.wake();
    expect(rig.frames.size).toBe(0);
    enabled = true; animation.wake();
    expect(rig.frames.size).toBe(1);
    animation.dispose();
  });

  it('stops the actual gallery globe while offscreen or paused and restarts on return', () => {
    const rig = frameHarness();
    const photos: [] = [];
    const props = { photos, empty: true, onToggle: vi.fn(), onOpen: vi.fn(), onError: vi.fn() };
    const view = render(<Globe {...props} paused={false} />);
    const stage = view.container.querySelector('.globe')!;
    const ball = view.container.querySelector<HTMLElement>('.globe__ball')!;
    expect(rig.frames.size).toBe(0);
    rig.enter(stage, true); rig.step(5);
    const before = ball.style.transform;
    rig.enter(stage, false); rig.step(120);
    expect(rig.frames.size).toBe(0);
    expect(ball.style.transform).toBe(before);
    rig.enter(stage, true); rig.step(5);
    expect(ball.style.transform).not.toBe(before);
    view.rerender(<Globe {...props} paused />);
    expect(rig.frames.size).toBe(0);
    view.rerender(<Globe {...props} paused={false} />);
    expect(rig.frames.size).toBe(1);
    view.unmount(); expect(rig.frames.size).toBe(0);
  });

  it('lets the visible Thrust Tech trajectory sleep once settled and wakes it on scroll', () => {
    const rig = frameHarness();
    const lengthDescriptor = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getTotalLength');
    const pointDescriptor = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getPointAtLength');
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', { configurable: true, value: () => 1000 });
    Object.defineProperty(SVGElement.prototype, 'getPointAtLength', { configurable: true, value: (x: number) => ({ x, y: 0 }) });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    let top = 500;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return new DOMRect(0, this.id === 'tt-traj' ? top : 2000, 1000, 400);
    });
    const view = render(<ThrustTechSection />);
    try {
      const trajectory = view.container.querySelector('#tt-traj')!;
      const path = view.container.querySelector<SVGElement>('#tt-tp')!;
      rig.enter(trajectory, true); rig.step(120);
      expect(rig.frames.size).toBe(0);
      const before = path.style.strokeDashoffset;
      top = 250;
      fireEvent.scroll(window);
      expect(rig.frames.size).toBe(1);
      rig.step(120);
      expect(rig.frames.size).toBe(0);
      expect(path.style.strokeDashoffset).not.toBe(before);
    } finally {
      view.unmount();
      if (lengthDescriptor) Object.defineProperty(SVGElement.prototype, 'getTotalLength', lengthDescriptor);
      else Reflect.deleteProperty(SVGElement.prototype, 'getTotalLength');
      if (pointDescriptor) Object.defineProperty(SVGElement.prototype, 'getPointAtLength', pointDescriptor);
      else Reflect.deleteProperty(SVGElement.prototype, 'getPointAtLength');
    }
  });

  it('leaves wheel input native and sleeps when the marquee is offscreen', () => {
    const rig = frameHarness();
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: !query.includes('reduced-motion'), addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList);
    const view = render(<MemoryRouter><ScrollMotion /><div className="marquee"><div className="marquee-row">Aerovate</div></div></MemoryRouter>);
    rig.step();
    const wheel = new WheelEvent('wheel', { deltaY: 100, cancelable: true, bubbles: true });
    fireEvent(window, wheel);
    expect(wheel.defaultPrevented).toBe(false);
    expect(window.scrollTo).not.toHaveBeenCalled();
    const marquee = view.container.querySelector('.marquee')!;
    rig.enter(marquee, true); rig.step(3);
    expect(rig.frames.size).toBe(1);
    rig.enter(marquee, false); rig.step(3);
    expect(rig.frames.size).toBe(0);
    rig.background(true); expect(rig.frames.size).toBe(0);
    view.unmount();
  });
});
