import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { clampProgress } from '../rocket/types';
import { footerRevealProgress, motionAllowed } from './motion';
import './space.css';

/** Elements that animate in the first time they enter the viewport. */
const REVEAL_SELECTOR = 'main .section, .footer-top, .footer-wordmark, .footer-grid';

/**
 * Member 4: page-wide scroll motion. The hero launch lives in HeroLaunch.
 * - Native wheel/trackpad scrolling without JavaScript interception.
 * - Trajectory bar (`--page-progress`) along the top edge.
 * - Velocity marquee: speed and skew follow how fast the visitor scrolls.
 * - Sections: masked word-by-word headings and staggered content, once, on entry.
 * - Footer: the wordmark letters rise with the scroll.
 * Values are written straight to styles/custom properties, so React never re-renders on scroll.
 */
export function ScrollMotion() {
  const bar = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!motionAllowed()) return;
    const root = document.documentElement;
    root.classList.add('motion-ready');

    const rows = Array.from(document.querySelectorAll<HTMLElement>('.marquee-row'));
    const wordmark = document.querySelector<HTMLElement>('.footer-wordmark');
    const marquee = document.querySelector<HTMLElement>('.marquee');
    let frame = 0, lastY = window.scrollY, velocity = 0, offset = 0, last = 0, marqueeVisible = false, pace = 1;
    let dirty = true;
    let rowWidths: number[] = [];
    const measureRows = () => { rowWidths = rows.map(row => row.scrollWidth / 2 || 1); };

    const update = (now: number) => {
      frame = 0;
      if (document.hidden) { last = 0; return; }
      const dt = Math.min(3, last ? (now - last) / 16.67 : 1);
      last = now;
      // Read layout before writing styles, and only when scrolling/layout changed.
      if (dirty) {
        const y = window.scrollY;
        const scrollable = root.scrollHeight - window.innerHeight;
        const rect = wordmark?.getBoundingClientRect();
        velocity += (y - lastY - velocity) * .18;
        lastY = y;
        dirty = false;
        bar.current?.style.setProperty('--page-progress', String(scrollable > 0 ? clampProgress(y / scrollable) : 0));
        if (wordmark && rect) wordmark.style.setProperty('--fp', String(footerRevealProgress(rect.top, rect.height, window.innerHeight)));
      } else velocity *= .82;

      if (marqueeVisible) {
        pace += ((marquee?.matches(':hover') ? .12 : 1) - pace) * Math.min(1, .06 * dt);
        offset += (.6 + Math.abs(velocity) * .55) * pace * dt * (velocity < -.5 ? -1 : 1);
        const skew = Math.max(-9, Math.min(9, velocity * -.35));
        rows.forEach((row, i) => {
          const width = rowWidths[i] || 1;
          const x = ((offset * (i % 2 ? 1 : -1)) % width + width) % width;
          row.style.transform = `translate3d(${-x}px,0,0) skewX(${skew}deg)`;
        });
        schedule();
      } else last = 0;
    };
    const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(update); };
    const onScroll = () => { dirty = true; schedule(); };
    const onResize = () => { measureRows(); onScroll(); };
    const onVisibility = () => {
      cancelAnimationFrame(frame); frame = last = 0;
      if (!document.hidden) onScroll();
    };
    measureRows();
    schedule();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    if (marquee) resizeObserver?.observe(marquee);
    const mio = marquee ? new IntersectionObserver(([entry]) => {
      marqueeVisible = entry.isIntersecting;
      marquee.dataset.animating = String(marqueeVisible && !document.hidden);
      if (!marqueeVisible) { cancelAnimationFrame(frame); frame = last = 0; }
      onScroll();
    }) : null;
    if (marquee) mio?.observe(marquee);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      resizeObserver?.disconnect();
      mio?.disconnect();
      root.classList.remove('motion-ready');
    };
  }, [pathname]);

  useEffect(() => {
    if (!motionAllowed()) return;
    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    const reveal = (element: Element) => element.classList.add('is-revealed');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -14% 0px', threshold: .08 });
    targets.forEach(target => observer.observe(target));
    // Keyboard and deep-link users must never land on hidden content.
    const focusIn = (event: FocusEvent) => {
      const target = (event.target as Element | null)?.closest?.(REVEAL_SELECTOR);
      if (target) reveal(target);
    };
    document.addEventListener('focusin', focusIn);
    root.classList.add('reveal-ready');
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', focusIn);
      root.classList.remove('reveal-ready');
    };
  }, [pathname]);

  return <div className="scroll-trajectory" ref={bar} aria-hidden="true"><span /></div>;
}

const MARQUEE = ['Aerovate', 'Ideas take flight', 'The rocketry experience', 'For minds that look up'];

/** Two giant type bands that run in opposite directions, driven by ScrollMotion. */
export function ScrollMarquee() {
  const items = (outline: boolean) => [...MARQUEE, ...MARQUEE].map((text, i) => <span key={i} className={outline === (i % 2 === 0) ? 'is-outline' : ''}>{text}<i>✦</i></span>);
  return <div className="marquee" aria-hidden="true">
    <div className="marquee-row">{items(false)}</div>
    <div className="marquee-row">{items(true)}</div>
  </div>;
}
