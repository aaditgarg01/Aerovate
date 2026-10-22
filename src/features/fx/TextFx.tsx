import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { motionAllowed } from '../space/motion';
import { launchRocket } from './rocketFlight';
import { scrambleText } from './scramble';
import './fx.css';

/** Small uppercase/HUD-style text that decodes on hover. */
export const DECODE_SELECTOR = [
  '.eyebrow', '.section-label > span', '.hero-kicker', '.header-menu a', '.stellar-brand > span', '.brand > span:last-child',
  '.event-facts dt', '.tt-eyebrow', '.tt-story h2', '.tt-node small', '.tt-node h3', '.tt-strip span', '.tt-cta',
  '.poc-tab', '.poc-step', '.footer h3', '.credit-name', '.footer-signoff', '.glimpses__browse',
].join(', ');
/** Headings whose words roll to a glowing copy (they already sit inside overflow masks). */
const ROLL_SELECTOR = '.section h2 .word > span, .tt-heading .tt-ln > span';
/** Body copy lit by a torch that follows the pointer. */
const GLOW_SELECTOR = '.section-copy, .tt-support p, .tt-statement, .footer-intro p, .poc-story p, .event-facts dd';
const BACK_TO_TOP = '.footer-bottom a[href="/#home"]';
const TILT_SELECTOR = '[data-fx-tilt]';

/**
 * Site-wide interactive layer: decoding labels, rolling headings, torch-lit copy, tilting cards and
 * a rocket launch from the footer's back-to-top button. Hover effects need a fine pointer; nothing
 * runs when the visitor prefers reduced motion. Text is only animated visually, never replaced.
 */
export function TextFx() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!motionAllowed()) return;
    const root = document.documentElement;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    document.querySelectorAll<HTMLElement>(ROLL_SELECTOR).forEach(element => { element.dataset.fxText = element.textContent ?? ''; });
    if (finePointer) root.classList.add('fx-hover');

    let lit: HTMLElement | null = null, tilted: HTMLElement | null = null, frame = 0, pointer = { x: 0, y: 0, target: null as Element | null };
    const unlight = () => { lit?.classList.remove('fx-lit'); lit?.style.removeProperty('--fx-base'); lit = null; };
    const untilt = () => { tilted?.classList.remove('fx-tilting'); tilted?.style.removeProperty('--fx-rx'); tilted?.style.removeProperty('--fx-ry'); tilted = null; };
    const update = () => {
      frame = 0;
      const glow = pointer.target?.closest<HTMLElement>(GLOW_SELECTOR) ?? null;
      if (glow !== lit) {
        unlight();
        if (glow) { glow.style.setProperty('--fx-base', getComputedStyle(glow).color); glow.classList.add('fx-lit'); lit = glow; }
      }
      if (lit) {
        const r = lit.getBoundingClientRect();
        lit.style.setProperty('--fx-x', `${pointer.x - r.left}px`);
        lit.style.setProperty('--fx-y', `${pointer.y - r.top}px`);
      }
      const tilt = pointer.target?.closest<HTMLElement>(TILT_SELECTOR) ?? null;
      if (tilt !== tilted) { untilt(); if (tilt) { tilt.classList.add('fx-tilting'); tilted = tilt; } }
      if (tilted) {
        const r = tilted.getBoundingClientRect();
        tilted.style.setProperty('--fx-rx', `${((pointer.y - r.top) / r.height - .5) * -5}deg`);
        tilted.style.setProperty('--fx-ry', `${((pointer.x - r.left) / r.width - .5) * 7}deg`);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY, target: event.target as Element };
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const label = (event.target as Element).closest?.<HTMLElement>(DECODE_SELECTOR);
      if (label && !label.contains(event.relatedTarget as Node | null) && !label.closest('[aria-live]')) void scrambleText(label);
    };
    const onLeave = () => { unlight(); untilt(); };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.(BACK_TO_TOP);
      if (!link) return;
      const r = link.getBoundingClientRect();
      const x = r.left + r.width / 2;
      launchRocket({ from: { x, y: r.top - 18 }, to: { x: x - Math.min(220, window.innerWidth * .18), y: -window.innerHeight * .25 }, curve: { x: 30, y: 0 }, size: 64, ignition: 420, duration: 1500, profile: 'launch' });
    };

    if (finePointer) {
      document.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerover', onOver, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
    }
    document.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(frame);
      onLeave();
      root.classList.remove('fx-hover');
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('click', onClick);
    };
  }, [pathname]);

  return null;
}
