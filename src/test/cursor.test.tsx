import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CursorLayer } from '../features/space/Cursor';

afterEach(() => vi.unstubAllGlobals());

function setupCursor() {
  let now = 0, nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const listeners = new Set<() => void>();
  const reduce = { matches: false, addEventListener: (_: string, callback: () => void) => listeners.add(callback), removeEventListener: (_: string, callback: () => void) => listeners.delete(callback) };
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: query.includes('pointer: fine'), media: query,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    ...(query.includes('prefers-reduced-motion') ? reduce : {}),
  }) as unknown as MediaQueryList);
  vi.stubGlobal('IntersectionObserver', class {});
  vi.stubGlobal('PointerEvent', MouseEvent);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  const step = (count: number) => act(() => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      const pending = [...frames.values()]; frames.clear();
      pending.forEach(callback => callback(now));
    }
  });
  return { frames, step, reduce, listeners };
}

describe('Rocket cursor lifecycle', () => {
  it('keeps the nose at the pointer and stops requesting frames after a magnetic hover settles', () => {
    const { frames, step } = setupCursor();
    const view = render(<><CursorLayer /><button className="header-contact">Contact</button></>);
    const button = view.getByRole('button');
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 50, 50));
    fireEvent.pointerMove(button, { clientX: 125, clientY: 125 });
    step(1);
    expect(view.container.querySelector('.cursor-rocket')?.getAttribute('style')).toContain('translate3d(125px,125px,0)');
    step(240);
    expect(frames.size).toBe(0);
    expect(document.documentElement).toHaveClass('cursor-on');
    view.unmount();
    expect(document.documentElement).not.toHaveClass('cursor-on');
  });

  it('immediately returns to the system cursor when reduced motion is enabled', () => {
    const { reduce, listeners, step, frames } = setupCursor();
    const view = render(<CursorLayer />);
    fireEvent.pointerMove(document.body, { clientX: 200, clientY: 300 });
    step(1);
    expect(document.documentElement).toHaveClass('cursor-on');
    act(() => { reduce.matches = true; listeners.forEach(callback => callback()); });
    expect(document.documentElement).not.toHaveClass('cursor-on');
    expect(frames.size).toBe(0);
    expect(view.container.querySelector('.cursor')).not.toHaveClass('is-visible');
    view.unmount();
  });
});
