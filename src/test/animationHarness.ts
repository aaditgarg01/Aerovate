import { act } from '@testing-library/react';
import { vi } from 'vitest';

export function frameHarness() {
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

