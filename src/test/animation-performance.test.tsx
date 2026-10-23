import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { frameHarness } from './animationHarness';
import { MemoryRouter } from 'react-router';
import { visibleAnimation } from '../features/space/visibleAnimation';
import { ScrollMotion } from '../features/space/ScrollMotion';
import Globe from '../features/glimpses/Globe';
import Coverflow from '../features/glimpses/Coverflow';
import RocketCanvas from '../features/glimpses/RocketCanvas';
import { ThrustTechSection } from '../features/thrust-tech/ThrustTechSection';

afterEach(() => vi.unstubAllGlobals());

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

  it('suspends the new photo reel offscreen, behind the viewer and after pausing, while manual nudges still work', () => {
    const rig = frameHarness();
    const props = { photos: [{ id: 'one', src: '/one.webp', alt: 'One', caption: 'One', year: 2026, width: 800, height: 600 }], empty: false, failed: new Set<string>(), onOpen: vi.fn(), onError: vi.fn() };
    const view = render(<Coverflow {...props} />);
    const stage = view.container.querySelector('.cf__stage')!;
    const track = view.container.querySelector<HTMLElement>('.cf__track')!;
    expect(rig.frames.size).toBe(0);
    rig.enter(stage, true); rig.step(5);
    const before = track.style.transform;
    rig.enter(stage, false); rig.step(120);
    expect(rig.frames.size).toBe(0);
    expect(track.style.transform).toBe(before);
    rig.enter(stage, true); rig.background(true);
    expect(rig.frames.size).toBe(0);
    rig.step(120); rig.background(false); rig.step(5);
    expect(track.style.transform).not.toBe(before);
    view.rerender(<Coverflow {...props} paused />);
    expect(rig.frames.size).toBe(0);
    view.rerender(<Coverflow {...props} />);
    expect(rig.frames.size).toBe(1);
    fireEvent.click(view.getByRole('button', { name: 'Pause scrolling' }));
    rig.step(120);
    expect(rig.frames.size).toBe(0);
    const held = track.style.transform;
    fireEvent.click(view.getByRole('button', { name: 'Scroll forward' }));
    rig.step(120);
    expect(track.style.transform).not.toBe(held);
    expect(rig.frames.size).toBe(0);
    fireEvent.click(view.getByRole('button', { name: 'Resume scrolling' }));
    expect(rig.frames.size).toBe(1);
    view.unmount(); expect(rig.frames.size).toBe(0);
  });

  it('keeps reduced-motion browsing manual without a continuous animation loop', () => {
    const rig = frameHarness();
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduced-motion') }) as MediaQueryList);
    const view = render(<Coverflow photos={[]} empty failed={new Set()} onOpen={vi.fn()} onError={vi.fn()} />);
    const stage = view.container.querySelector('.cf__stage')!;
    const track = view.container.querySelector<HTMLElement>('.cf__track')!;
    rig.enter(stage, true); rig.step(120);
    expect(rig.frames.size).toBe(0);
    const before = track.style.transform;
    fireEvent.keyDown(stage, { key: 'ArrowRight' }); rig.step();
    expect(track.style.transform).not.toBe(before);
    expect(rig.frames.size).toBe(0);
    view.unmount();
  });

  it('stops the actual 3D rocket renderer offscreen, paused and backgrounded and cleans up its frames', () => {
    const rig = frameHarness();
    const ctx = {
      setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
      closePath: vi.fn(), lineTo: vi.fn(), moveTo: vi.fn(), stroke: vi.fn(),
      createRadialGradient: () => ({ addColorStop: vi.fn() }),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 800, 600));
    const view = render(<div className="glimpses__hero"><RocketCanvas paused={false} /></div>);
    const canvas = view.container.querySelector('canvas')!;
    expect(canvas).toBeInTheDocument();
    expect(rig.frames.size).toBe(0);
    rig.enter(canvas, true); rig.step(5);
    expect(ctx.fill).toHaveBeenCalled();
    const draws = ctx.clearRect.mock.calls.length;
    rig.enter(canvas, false); rig.step(120);
    expect(ctx.clearRect).toHaveBeenCalledTimes(draws);
    expect(rig.frames.size).toBe(0);
    rig.enter(canvas, true); rig.background(true);
    expect(rig.frames.size).toBe(0);
    rig.step(120); rig.background(false); rig.step(5);
    expect(ctx.clearRect.mock.calls.length).toBeGreaterThan(draws);
    view.rerender(<div className="glimpses__hero"><RocketCanvas paused /></div>);
    expect(rig.frames.size).toBe(0);
    view.rerender(<div className="glimpses__hero"><RocketCanvas paused={false} /></div>);
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
