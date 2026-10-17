import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { clampProgress } from '../rocket/types';
import './space.css';

/** Elements that fade/slide in the first time they enter the viewport. */
const REVEAL_SELECTOR = 'main .section, .footer-top, .footer-wordmark';

/** Motion needs a real browser (IntersectionObserver) and a visitor who allows it. */
function motionAllowed() {
  if (typeof IntersectionObserver === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Member 4: owns scroll measurement for the whole page.
 * - Hero: writes `--hero-progress` (0 → 1 while the hero is covered) for the CSS launch sequence.
 * - Page: writes `--page-progress` for the trajectory bar.
 * - Sections: reveals content once it scrolls into view.
 * All values are written as CSS custom properties, so React never re-renders on scroll.
 */
export function ScrollMotion() {
  const bar = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (!motionAllowed()) return;
    root.classList.add('motion-ready');

    const hero = document.getElementById('home');
    let frame = 0;
    let heroHeight = 0;

    const measure = () => {
      if (!hero) return;
      heroHeight = hero.offsetHeight || window.innerHeight;
      // Pin the hero once its bottom edge reaches the viewport (matters on tall mobile heroes).
      hero.style.setProperty('--hero-stick', `${Math.min(0, window.innerHeight - heroHeight)}px`);
    };

    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      const scrollable = root.scrollHeight - window.innerHeight;
      bar.current?.style.setProperty('--page-progress', String(scrollable > 0 ? clampProgress(scrollY / scrollable) : 0));
      if (hero && heroHeight) {
        const progress = clampProgress(scrollY / heroHeight);
        hero.style.setProperty('--hero-progress', progress.toFixed(4));
        hero.toggleAttribute('data-covered', progress >= 1);
      }
    };

    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = () => { measure(); schedule(); };

    measure();
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    if (hero) resizeObserver?.observe(hero);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
      resizeObserver?.disconnect();
      hero?.style.removeProperty('--hero-progress');
      hero?.style.removeProperty('--hero-stick');
      hero?.removeAttribute('data-covered');
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
    }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });
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

/** Deterministic star field for the hero night sky (box-shadow keeps it to a single element). */
function stars(count: number, seed: number, spread: number) {
  let value = seed;
  const random = () => (value = (value * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: count }, () => {
    const x = (random() * 100).toFixed(2);
    const y = (random() * spread).toFixed(2);
    const alpha = (.35 + random() * .65).toFixed(2);
    return `${x}vw ${y}svh 0 rgba(222, 240, 255, ${alpha})`;
  }).join(',');
}

const smallStars = stars(140, 7, 70);
const brightStars = stars(34, 91, 60);

/** Layers added to the hero for the scroll launch sequence. Purely decorative. */
export function HeroScrollLayers() {
  return <>
    <div className="hero-night" aria-hidden="true" />
    <div className="hero-stars" aria-hidden="true">
      <span className="hero-stars__small" style={{ boxShadow: smallStars }} />
      <span className="hero-stars__bright" style={{ boxShadow: brightStars }} />
    </div>
  </>;
}

export function HeroScrollCue() {
  return <div className="hero-scroll-cue" aria-hidden="true"><span className="hero-scroll-cue__track"><i /></span>Scroll to launch</div>;
}
