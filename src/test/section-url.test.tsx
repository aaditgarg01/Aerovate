import { act, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useActiveSection } from '../components/layout/useActiveSection';

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('Section URL tracking', () => {
  it('replaces the hash while scrolling down and up without adding history, focus or scroll effects', () => {
    let scroll = 0;
    const offsets: Record<string, number> = { home: 0, 'thrust-tech': 900, event: 1500, pocs: 2100, glimpses: 2700, contact: 3300 };
    const view = document.createElement('div');
    view.innerHTML = '<header></header>' + Object.keys(offsets).map(id => `<section id="${id}" tabindex="-1"></section>`).join('');
    document.body.append(view);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return new DOMRect(0, this.tagName === 'HEADER' ? 0 : offsets[this.id] - scroll, 1200, this.tagName === 'HEADER' ? 100 : 600);
    });
    let callback: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { callback = fn; return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const flush = () => act(() => { const fn = callback; callback = undefined; fn?.(0); });
    window.history.replaceState({ idx: 3, key: 'existing', usr: { retained: true } }, '', '/?source=invite#thrust-tech');
    const state = window.history.state;
    const length = window.history.length;
    const focus = document.getElementById('pocs')!;
    focus.focus();
    const hook = renderHook(() => useActiveSection('/'));
    flush();
    // Do not overwrite an incoming deep link before its initial navigation scroll.
    expect(window.location.hash).toBe('#thrust-tech');
    for (const id of ['event', 'pocs', 'glimpses', 'contact', 'thrust-tech', 'home']) {
      scroll = Math.max(0, offsets[id] - 120);
      fireEvent.scroll(window); flush();
      expect(hook.result.current.activeSection).toBe(id);
      expect(window.location.hash).toBe(id === 'home' ? '' : `#${id}`);
      expect(window.location.search).toBe('?source=invite');
      expect(window.history.length).toBe(length);
      expect(window.history.state).toEqual(state);
      expect(focus).toHaveFocus();
    }
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    hook.unmount(); view.remove();
  });
});
