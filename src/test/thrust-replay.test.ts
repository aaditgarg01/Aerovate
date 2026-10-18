import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { replayHeroOnEntry } from '../features/thrust-tech/replayHeroOnEntry';

afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });

function setup(reduced = false) {
  const observe = vi.fn(), disconnect = vi.fn();
  let notify: IntersectionObserverCallback;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { notify = callback; }
    observe = observe;
    disconnect = disconnect;
  });
  document.body.innerHTML = '<section id="hero"><div id="logo"></div></section><a href="/#thrust-tech">Thrust Tech</a>';
  const hero = document.getElementById('hero')!;
  const logo = document.getElementById('logo')!;
  const restarts = vi.spyOn(hero.classList, 'remove');
  const cleanup = replayHeroOnEntry(hero, logo, 'thrust-tech', reduced);
  const enter = (ratio: number) => notify([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], {} as IntersectionObserver);
  return { hero, logo, observe, disconnect, restarts, enter, cleanup };
}

describe('Thrust Tech entrance replay', () => {
  it('replays after leaving and returning in either scroll direction, without restarting at the visibility boundary', () => {
    const { hero, logo, observe, disconnect, restarts, enter, cleanup } = setup();
    expect(observe).toHaveBeenCalledWith(logo);
    enter(.1); expect(restarts).not.toHaveBeenCalled();
    enter(.3); expect(hero).toHaveClass('tt-go'); expect(restarts).toHaveBeenCalledTimes(1);
    enter(.2); enter(.4); expect(restarts).toHaveBeenCalledTimes(1);
    enter(0); expect(hero).toHaveClass('tt-go');
    enter(.3); expect(restarts).toHaveBeenCalledTimes(2);
    enter(0); enter(.5); expect(restarts).toHaveBeenCalledTimes(3);
    fireEvent.click(document.querySelector('a')!); expect(restarts).toHaveBeenCalledTimes(4);
    cleanup(); expect(disconnect).toHaveBeenCalledOnce();
    fireEvent.click(document.querySelector('a')!); expect(restarts).toHaveBeenCalledTimes(4);
  });

  it('keeps the entrance static for visitors who request reduced motion', () => {
    const { hero, observe, restarts, cleanup } = setup(true);
    expect(hero).toHaveClass('tt-go');
    expect(observe).not.toHaveBeenCalled();
    expect(restarts).not.toHaveBeenCalled();
    cleanup();
  });
});
