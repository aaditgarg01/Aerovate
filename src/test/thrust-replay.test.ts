import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { replayHeroOnEntry } from '../features/thrust-tech/replayHeroOnEntry';

afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });

function setup(reduced = false) {
  let now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  const observers = new Map<Element, IntersectionObserverCallback>();
  const disconnect = vi.fn();
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe = (element: Element) => observers.set(element, this.callback);
    disconnect = disconnect;
  });
  document.body.innerHTML = '<section id="thrust-tech"><div id="hero"><div id="logo"></div></div></section><a href="/#thrust-tech">Thrust Tech</a>';
  const hero = document.getElementById('hero')!;
  const logo = document.getElementById('logo')!;
  const section = document.getElementById('thrust-tech')!;
  const restarts = vi.spyOn(hero.classList, 'remove');
  const cleanup = replayHeroOnEntry(hero, logo, 'thrust-tech', reduced);
  const notify = (element: Element, ratio: number) => observers.get(element)?.([{ target: element, isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], {} as IntersectionObserver);
  return { hero, observers, disconnect, restarts, cleanup,
    enter: (ratio: number) => notify(logo, ratio),
    section: (ratio: number) => notify(section, ratio),
    advance: (ms: number) => { now += ms; },
    click: () => fireEvent.click(document.querySelector('a')!),
  };
}

describe('Thrust Tech entrance replay', () => {
  it('plays initially, but does not reset when only the logo leaves view', () => {
    const rig = setup();
    rig.section(1); rig.enter(.1);
    expect(rig.restarts).not.toHaveBeenCalled();
    rig.enter(.3);
    expect(rig.hero).toHaveClass('tt-go');
    expect(rig.restarts).toHaveBeenCalledTimes(1);
    rig.advance(12000); rig.enter(0); rig.enter(.4); rig.enter(.2); rig.enter(.4);
    expect(rig.restarts).toHaveBeenCalledTimes(1);
    rig.cleanup();
  });

  it('ignores brief exits, then replays after leaving the entire section for two seconds', () => {
    const rig = setup();
    rig.section(1); rig.enter(.4); rig.advance(12000);
    rig.enter(0); rig.section(0); rig.advance(1000); rig.section(1); rig.enter(.4);
    expect(rig.restarts).toHaveBeenCalledTimes(1);
    rig.enter(0); rig.section(0); rig.advance(2000); rig.section(1); rig.enter(.4);
    expect(rig.restarts).toHaveBeenCalledTimes(2);
    rig.enter(0); rig.enter(.4);
    expect(rig.restarts).toHaveBeenCalledTimes(2);
    rig.cleanup();
  });

  it('keeps a ten-second gap between automatic replays and handles observer callback order', () => {
    const rig = setup();
    rig.section(1); rig.enter(.4);
    rig.enter(0); rig.section(0); rig.advance(3000); rig.section(1); rig.enter(.4);
    expect(rig.restarts).toHaveBeenCalledTimes(1);
    rig.enter(0); rig.section(0); rig.advance(8000);
    rig.enter(.4); rig.section(1);
    expect(rig.restarts).toHaveBeenCalledTimes(2);
    rig.cleanup();
  });

  it('allows deliberate navbar replay without interrupting the current entrance', () => {
    const rig = setup();
    rig.section(1); rig.enter(.4); rig.click();
    expect(rig.restarts).toHaveBeenCalledTimes(1);
    rig.advance(4000); rig.click();
    expect(rig.restarts).toHaveBeenCalledTimes(2);
    rig.enter(0); rig.advance(4000); rig.click();
    expect(rig.restarts).toHaveBeenCalledTimes(2);
    rig.enter(.4); expect(rig.restarts).toHaveBeenCalledTimes(3);
    rig.cleanup(); expect(rig.disconnect).toHaveBeenCalledTimes(2);
    rig.click(); expect(rig.restarts).toHaveBeenCalledTimes(3);
  });

  it('keeps the entrance static for visitors who request reduced motion', () => {
    const rig = setup(true);
    expect(rig.hero).toHaveClass('tt-go');
    expect(rig.observers.size).toBe(0);
    expect(rig.restarts).not.toHaveBeenCalled();
    rig.cleanup();
  });
});
