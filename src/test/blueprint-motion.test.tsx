import { fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ExperienceDiagram } from '../features/landing/ExperienceDiagram';
import { frameHarness } from './animationHarness';

afterEach(() => vi.unstubAllGlobals());
function setup(reduced = false) {
  const rig = frameHarness();
  vi.stubGlobal('matchMedia', (query: string) => Object.assign(new EventTarget(), { matches: query.includes('reduced') ? reduced : true }));
  const view = render(<ExperienceDiagram />);
  const figure = view.container.querySelector('figure')!;
  const rect = { left: 0, top: 0, width: 480, height: 340 } as DOMRect;
  vi.spyOn(figure, 'getBoundingClientRect').mockReturnValue(rect);
  vi.spyOn(figure.querySelector('svg')!, 'getBoundingClientRect').mockReturnValue(rect);
  const move = (x: number, type = 'mouse') => {
    const event = new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: 100 });
    Object.defineProperty(event, 'pointerType', { value: type });
    fireEvent(figure, event);
  };
  return { ...rig, view, figure, move };
}
it('coalesces pointer movement, responds visually and stops completely when idle or scrolling', () => {
  const rig = setup();
  rig.move(100); rig.move(200); rig.move(400);
  expect(rig.frames.size).toBe(1);
  rig.step();
  expect(rig.figure.dataset.blueprintActive).toBe('true');
  expect(rig.figure.style.getPropertyValue('--bp-x')).not.toBe('');
  expect(rig.frames.size).toBe(0);
  rig.move(300); fireEvent.scroll(window);
  expect(rig.frames.size).toBe(0);
  expect(rig.figure.dataset.blueprintActive).toBeUndefined();
  expect(rig.figure.style.getPropertyValue('--bp-x')).toBe('');
  rig.move(300); rig.background(true);
  expect(rig.frames.size).toBe(0);
  rig.background(false); rig.move(300); rig.view.unmount();
  expect(rig.frames.size).toBe(0);
});
it('keeps the blueprint static for touch and reduced motion', () => {
  const touch = setup(); touch.move(300, 'touch');
  expect(touch.frames.size).toBe(0); touch.view.unmount();
  const reduced = setup(true); reduced.move(300);
  expect(reduced.frames.size).toBe(0);
  expect(reduced.figure.dataset.blueprintActive).toBeUndefined();
  reduced.view.unmount();
});
