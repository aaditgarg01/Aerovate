import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { scrambleText } from '../features/fx/scramble';
import { launchRocket } from '../features/fx/rocketFlight';
import { TextFx } from '../features/fx/TextFx';

// Manual animation clock: frames run only when the test flushes them.
function frameClock() {
  let queue: FrameRequestCallback[] = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { queue.push(callback); return queue.length; });
  return (time: number) => { const run = queue; queue = []; run.forEach(callback => callback(time)); };
}

function allowMotion(finePointer = true) {
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: query.includes('hover') ? finePointer : false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
}

afterEach(() => { vi.unstubAllGlobals(); document.documentElement.className = ''; });

describe('Decoding text', () => {
  it('flickers through glyphs, keeps markup and spacing, then restores the exact text', async () => {
    const flush = frameClock();
    const { container } = render(<span className="eyebrow">Aerovate <b>LIFT</b> 2026<svg><text>keep</text></svg></span>);
    const label = container.querySelector('span')!;
    const done = scrambleText(label, 400);
    flush(1000); flush(1050);
    expect(label).toHaveClass('fx-scrambling');
    expect(label.textContent).not.toBe('Aerovate LIFT 2026keep');
    expect(label.textContent).toHaveLength('Aerovate LIFT 2026keep'.length);
    expect(label.textContent!.slice(8, 9)).toBe(' ');
    expect(label.querySelector('svg text')).toHaveTextContent('keep');
    expect(label.querySelector('b')).toBeInTheDocument();
    flush(1500);
    await done;
    expect(label).toHaveTextContent('Aerovate LIFT 2026');
    expect(label).not.toHaveClass('fx-scrambling');
  });

  it('leaves text alone when the page updates it mid-animation', async () => {
    const flush = frameClock();
    const { container } = render(<p>Countdown</p>);
    const node = container.querySelector('p')!.firstChild as Text;
    const done = scrambleText(container.querySelector('p')!, 300);
    flush(0); flush(50);
    node.nodeValue = 'Liftoff';
    flush(100); flush(400);
    await done;
    expect(container.querySelector('p')).toHaveTextContent('Liftoff');
  });
});

describe('Effects layer', () => {
  it('stays off when the visitor prefers reduced motion', () => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: true, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    render(<MemoryRouter><TextFx /><section className="section"><h2><span className="word"><span>Hello</span></span></h2></section></MemoryRouter>);
    expect(document.documentElement).not.toHaveClass('fx-hover');
    expect(document.querySelector('.word > span')).not.toHaveAttribute('data-fx-text');
    expect(launchRocket({ from: { x: 0, y: 0 }, to: { x: 10, y: 10 } })).toBeTypeOf('function');
    expect(document.querySelector('.fx-rocket-layer')).toBeNull();
  });

  it('prepares rolling headings and decodes labels on mouse hover only', () => {
    allowMotion();
    frameClock();
    const view = render(<MemoryRouter><TextFx /><section className="section"><span className="eyebrow">Behind the experience</span><h2><span className="word"><span>Hello</span></span></h2></section></MemoryRouter>);
    expect(document.documentElement).toHaveClass('fx-hover');
    expect(document.querySelector('.word > span')).toHaveAttribute('data-fx-text', 'Hello');
    const eyebrow = document.querySelector('.eyebrow')!;
    fireEvent.pointerOver(eyebrow, { pointerType: 'touch' });
    expect(eyebrow).not.toHaveClass('fx-scrambling');
    fireEvent.pointerOver(eyebrow, { pointerType: 'mouse' });
    expect(eyebrow).toHaveClass('fx-scrambling');
    view.unmount();
    expect(document.documentElement).not.toHaveClass('fx-hover');
  });

  it('keeps hover effects off for touch screens but still launches safely without canvas support', () => {
    allowMotion(false);
    render(<MemoryRouter><TextFx /><footer><div className="footer-bottom"><a href="/#home" aria-label="Back to top">Top</a></div></footer></MemoryRouter>);
    expect(document.documentElement).not.toHaveClass('fx-hover');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(() => fireEvent.click(document.querySelector('.footer-bottom a')!)).not.toThrow();
    expect(document.querySelector('.fx-rocket-layer')).toBeNull();
  });
});
