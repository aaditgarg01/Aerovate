import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { clampProgress } from '../rocket/types';
import { footerRevealProgress, motionAllowed, smoothWheel } from './motion';
import './space.css';

/** Elements that animate in the first time they enter the viewport. */
const REVEAL_SELECTOR = 'main .section, .footer-top, .footer-wordmark, .footer-grid';

/**
 * Member 4: page-wide scroll motion. The hero launch lives in HeroLaunch.
 * - Inertia wheel scrolling on desktop.
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
    const stopWheel = smoothWheel();

    const rows = Array.from(document.querySelectorAll<HTMLElement>('.marquee-row'));
    const wordmark = document.querySelector<HTMLElement>('.footer-wordmark');
    const marquee = document.querySelector<HTMLElement>('.marquee');
    let frame = 0, lastY = window.scrollY, velocity = 0, offset = 0, last = 0, marqueeVisible = false, pace = 1;

    const update = (now: number) => {
      frame = 0;
      const dt = Math.min(3, last ? (now - last) / 16.67 : 1);
      last = now;
      const y = window.scrollY;
      const scrollable = root.scrollHeight - window.innerHeight;
      bar.current?.style.setProperty('--page-progress', String(scrollable > 0 ? clampProgress(y / scrollable) : 0));

      // marquee: drift + scroll velocity (direction-aware), skewed by speed
      const delta = y - lastY;
      lastY = y;
      velocity += (delta - velocity) * .18;
      // hovering the band slows it right down so the words can be read (and lit by the cursor)
      pace += ((marquee?.matches(':hover') ? .12 : 1) - pace) * Math.min(1, .06 * dt);
      offset += (.6 + Math.abs(velocity) * .55) * pace * dt * (velocity < -.5 ? -1 : 1);
      const skew = Math.max(-9, Math.min(9, velocity * -.35));
      rows.forEach((row, i) => {
        const width = row.scrollWidth / 2 || 1;
        const dir = i % 2 ? 1 : -1;
        const x = ((offset * dir) % width + width) % width;
        row.style.transform = `translate3d(${-x}px,0,0) skewX(${skew}deg)`;
      });

      // footer wordmark: letters rise from below as the footer comes up
      if (wordmark) {
        const r = wordmark.getBoundingClientRect();
        wordmark.style.setProperty('--fp', String(footerRevealProgress(r.top, r.height, window.innerHeight)));
      }
      if (Math.abs(velocity) > .05 || marqueeVisible) frame = requestAnimationFrame(update);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // Pause the always-on marquee loop while it is off-screen.
    const mio = marquee ? new IntersectionObserver(([e]) => { marqueeVisible = e.isIntersecting; schedule(); }) : null;
    if (marquee) mio?.observe(marquee);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      mio?.disconnect();
      stopWheel();
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
