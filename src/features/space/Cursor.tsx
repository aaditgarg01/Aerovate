import { useEffect, useRef, useState } from 'react';
import { motionAllowed } from './motion';
import { damp, spring, turnToward } from './cursorMotion';
import './cursor.css';

/*
 * Member 4 — cursor interactivity (desktop mice and trackpads only; touch and reduced
 * motion keep the system cursor and get none of this).
 *
 * - A rocket cursor: its nose tip is the exact click point; it steers to face the direction
 *   of travel, its flame grows with speed, and it boosts on click. At rest it tilts like an
 *   arrow pointer. A ring trails it on a spring for the context states below.
 * - Context states: links and buttons swell the ring; photos say "View"; the hero sky says
 *   "Scroll"; anything can opt in with `data-cursor="Label"`.
 * - Round controls (header arrow, contact orbit, menu) capture the ring, which wraps them.
 * - Magnetic buttons lean toward the pointer and spring back when it leaves.
 * - Cards light up with a spotlight that follows the pointer.
 * - A faint trail of exhaust sparks follows fast movements.
 */

const INTERACTIVE = 'a, button, [role="button"], label, summary, select, input, textarea';
const MAGNETIC = '.button, .header-contact, .contact-orbit, .menu-toggle, .tt-cta, .glimpses__chip, .brand, .stellar-brand, .lightbox button';
const STICKY = '.header-contact, .contact-orbit, .menu-toggle';
const SPOTLIGHT = '.empty-state, .card, .event-facts';
const VIEW = '.glimpses__open, .globe__btn:not(.globe__btn--empty), [data-zoom]';

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number };

export function CursorLayer() {
  const root = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(finePointer.matches && !reducedMotion.matches && motionAllowed());
    update();
    finePointer.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      finePointer.removeEventListener('change', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    const layer = root.current;
    if (!layer || !enabled) return;
    const html = document.documentElement;
    const rocket = layer.querySelector<HTMLElement>('.cursor-rocket')!;
    const ring = layer.querySelector<HTMLElement>('.cursor-ring')!;
    const label = layer.querySelector<HTMLElement>('.cursor-label')!;
    const canvas = layer.querySelector<HTMLCanvasElement>('.cursor-trail')!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x = -100, y = -100;          // pointer
    let rx = x, ry = y, vx = 0, vy = 0; // ring (spring)
    let size = 34, targetSize = 34;
    let stuck: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;
    let pressed = false, shown = false, frame = 0, last = 0, lastX = x, lastY = y, lastMove = 0;
    // rocket heading (radians, clockwise from straight up), pointer velocity, thrust 0..1
    const REST = -.45;
    let heading = REST, pvx = 0, pvy = 0, thrust = 0, boost = 0, travelHeading = REST, emission = 0;
    let magnetX = 0, magnetY = 0;
    let magnetBounds: DOMRect | null = null, stickyBounds: DOMRect | null = null;
    const releaseTimers = new Map<HTMLElement, number>();
    const sparks: Spark[] = [];
    let dpr = 1, trailDirty = false;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      trailDirty = false;
    };

    // What is under the pointer decides the ring's shape and label.
    const classify = (target: Element | null) => {
      const custom = target?.closest<HTMLElement>('[data-cursor]');
      const view = target?.closest(VIEW);
      const interactive = target?.closest<HTMLElement>(INTERACTIVE);
      const sticky = target?.closest<HTMLElement>(STICKY) ?? null;
      const inHero = !!target?.closest('#home') && window.scrollY < 40;
      let text = '';
      if (custom) text = custom.dataset.cursor ?? '';
      else if (view) text = 'View';
      else if (inHero && !interactive && !target?.closest('.hero-copy')) text = 'Scroll';
      stuck = sticky;
      layer.dataset.state = text ? 'label' : interactive ? 'link' : 'default';
      if (label.textContent !== text) label.textContent = text;
      targetSize = text ? 92 : interactive ? 58 : 34;
      const nextMagnet = target?.closest<HTMLElement>(MAGNETIC) ?? null;
      if (nextMagnet !== magnet) {
        release(magnet);
        magnet = nextMagnet;
        magnetX = magnetY = 0;
        if (magnet) {
          window.clearTimeout(releaseTimers.get(magnet));
          releaseTimers.delete(magnet);
        }
      }
      const bounds = (el: HTMLElement | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const [dx = '0', dy = '0'] = el.style.translate.split(' ');
        // Read the unshifted centre, not the centre displaced by our own magnet effect.
        return new DOMRect(r.x - (parseFloat(dx) || 0), r.y - (parseFloat(dy) || 0), r.width, r.height);
      };
      magnetBounds = bounds(magnet);
      stickyBounds = stuck === magnet ? magnetBounds : bounds(stuck);
    };

    const release = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.transition = 'translate .6s cubic-bezier(.2,.9,.25,1.3)';
      el.style.translate = '';
      window.clearTimeout(releaseTimers.get(el));
      releaseTimers.set(el, window.setTimeout(() => {
        if (el !== magnet) el.style.transition = '';
        releaseTimers.delete(el);
      }, 650));
    };

    const tick = (now: number) => {
      frame = 0;
      const seconds = Math.min(.05, last ? Math.max(0, now - last) / 1000 : 1 / 60);
      const dt = seconds * 60;
      last = now;

      // ring target: the pointer, or the centre of a sticky control
      let tx = x, ty = y;
      if (stuck && stickyBounds) {
        const r = stickyBounds;
        tx = r.left + r.width / 2 + (x - (r.left + r.width / 2)) * .18;
        ty = r.top + r.height / 2 + (y - (r.top + r.height / 2)) * .18;
        targetSize = Math.max(r.width, r.height) + 14;
      }
      // labelled disc sits up and to the right of the rocket so it never hides the nose
      if (layer.dataset.state === 'label') { tx = x + 54; ty = y - 30; }
      // Exact critical damping keeps the halo stable at 30, 60 and high-refresh frame rates.
      const horizontal = spring(rx, vx, tx, 22, seconds);
      const vertical = spring(ry, vy, ty, 22, seconds);
      rx = horizontal.position; vx = horizontal.velocity;
      ry = vertical.position; vy = vertical.velocity;
      const desiredSize = targetSize * (pressed ? .78 : 1);
      size = damp(size, desiredSize, 18, seconds);

      const speed = Math.hypot(vx, vy) / 60;
      const stretch = stuck || layer.dataset.state === 'label' ? 0 : Math.min(.45, speed / 60);
      const angle = Math.atan2(vy, vx);
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) rotate(${angle}rad) scale(${1 + stretch},${1 - stretch * .55}) rotate(${-angle}rad)`;
      ring.style.width = ring.style.height = `${size}px`;
      ring.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
      // rocket: steer toward the direction of travel, settle back to an arrow tilt at rest
      pvx = damp(pvx, (x - lastX) / Math.max(seconds, .001), 20, seconds);
      pvy = damp(pvy, (y - lastY) / Math.max(seconds, .001), 20, seconds);
      const pspeed = Math.hypot(pvx, pvy);
      if (pspeed > 60) travelHeading = Math.atan2(pvx, -pvy);
      // Hold the last travel direction briefly instead of flipping at a speed threshold.
      const moving = now - lastMove < 180;
      const aim = moving ? travelHeading : REST;
      heading = turnToward(heading, aim, moving ? 15 : 5, seconds);
      const turn = Math.atan2(Math.sin(aim - heading), Math.cos(aim - heading));
      boost = damp(boost, 0, 8, seconds);
      thrust = damp(thrust, Math.min(1, pspeed / 540 + boost), 18, seconds);
      rocket.style.transform = `translate3d(${x}px,${y}px,0) rotate(${heading}rad) scale(${pressed ? .88 : 1})`;
      rocket.style.setProperty('--thrust', thrust.toFixed(3));
      rocket.classList.toggle('is-thrusting', thrust > .15);
      const tailX = x - Math.sin(heading) * 34, tailY = y + Math.cos(heading) * 34;

      // magnetic pull on the hovered control
      let magnetSettling = false;
      if (magnet && magnetBounds) {
        const r = magnetBounds;
        const mx = (x - (r.left + r.width / 2)) * .28, my = (y - (r.top + r.height / 2)) * .28;
        const targetX = Math.max(-14, Math.min(14, mx));
        const targetY = Math.max(-10, Math.min(10, my));
        magnetX = damp(magnetX, targetX, 18, seconds);
        magnetY = damp(magnetY, targetY, 18, seconds);
        magnetSettling = Math.abs(targetX - magnetX) > .05 || Math.abs(targetY - magnetY) > .05;
        magnet.style.transition = 'none';
        magnet.style.translate = `${magnetX}px ${magnetY}px`;
      }

      // exhaust sparks stream from the nozzle while the rocket is under thrust
      if (shown && thrust > .22) {
        emission += thrust * 156 * seconds;
        const n = Math.floor(emission);
        emission -= n;
        const bx = -Math.sin(heading), by = Math.cos(heading); // exhaust direction
        for (let i = 0; i < n; i++) {
          const spread = (Math.random() - .5) * .9;
          const v = 1.2 + Math.random() * 2.4 * thrust;
          sparks.push({ x: tailX + (Math.random() - .5) * 3, y: tailY + (Math.random() - .5) * 3, vx: (bx + spread * by) * v, vy: (by - spread * bx) * v + .05, life: 1, size: .9 + Math.random() * 1.9, hue: Math.random() });
        }
        if (sparks.length > 220) sparks.splice(0, sparks.length - 220);
      }
      lastX = x; lastY = y;
      // The rocket/halo need no full-screen canvas repaint when there is no exhaust.
      if (sparks.length || trailDirty) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .96 ** dt; s.vy *= .96 ** dt; s.life -= .03 * dt;
          if (s.life <= 0) { sparks.splice(i, 1); continue; }
          ctx.globalAlpha = s.life * .8;
          ctx.fillStyle = s.hue > .7 ? '#ffd29a' : s.hue > .35 ? '#9fe8f7' : '#ffffff';
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        trailDirty = sparks.length > 0;
      }

      const settling = Math.abs(tx - rx) > .2 || Math.abs(ty - ry) > .2 || Math.abs(size - desiredSize) > .3 || speed > .05 || thrust > .01 || Math.abs(turn) > .002;
      if (shown && (settling || sparks.length || magnetSettling || moving)) schedule();
      else last = 0;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(tick); };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      x = event.clientX; y = event.clientY;
      lastMove = performance.now();
      if (!shown) { shown = true; rx = x; ry = y; vx = vy = pvx = pvy = 0; heading = travelHeading = REST; last = 0; lastX = x; lastY = y; layer.classList.add('is-visible'); }
      classify(event.target as Element);
      // spotlight cards: expose pointer position inside the hovered card
      const card = (event.target as Element).closest<HTMLElement>(SPOTLIGHT);
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${x - r.left}px`);
        card.style.setProperty('--spot-y', `${y - r.top}px`);
      }
      schedule();
    };
    const onDown = () => { pressed = true; boost = 1.2; layer.classList.add('is-pressed'); schedule(); };
    const onUp = () => { pressed = false; layer.classList.remove('is-pressed'); schedule(); };
    const hide = () => {
      shown = pressed = false;
      layer.classList.remove('is-visible', 'is-pressed');
      release(magnet); magnet = null; stuck = null;
      cancelAnimationFrame(frame); frame = last = 0;
      sparks.length = 0; emission = 0; thrust = boost = 0; trailDirty = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    const onLeave = (event: MouseEvent) => { if (!event.relatedTarget) hide(); };
    const onVisibility = () => { if (document.hidden) hide(); };
    const onScroll = () => { if (shown) { classify(document.elementFromPoint(x, y)); schedule(); } };

    resize();
    html.classList.add('cursor-on');
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseout', onLeave);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('scroll', onScroll, { passive: true });
    const onResize = () => { resize(); onScroll(); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      if (magnet) { magnet.style.translate = ''; magnet.style.transition = ''; }
      for (const [element, timer] of releaseTimers) { window.clearTimeout(timer); element.style.transition = ''; element.style.translate = ''; }
      releaseTimers.clear();
      html.classList.remove('cursor-on');
      layer.classList.remove('is-visible', 'is-pressed');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseout', onLeave);
      window.removeEventListener('blur', hide);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [enabled]);

  return <div className="cursor" ref={root} aria-hidden="true" data-state="default">
    <canvas className="cursor-trail" />
    <div className="cursor-ring"><span className="cursor-label" /></div>
    <div className="cursor-rocket">
      <svg viewBox="0 0 24 64" width="24" height="64">
        <defs>
          <linearGradient id="cursor-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff8e6" /><stop offset=".35" stopColor="#ffc46b" /><stop offset=".75" stopColor="#ff6a2b" stopOpacity=".7" /><stop offset="1" stopColor="#ff4d1f" stopOpacity="0" /></linearGradient>
          <linearGradient id="cursor-hull" x1="0" x2="1"><stop offset="0" stopColor="#c9d7e3" /><stop offset=".4" stopColor="#fff" /><stop offset="1" stopColor="#b7c7d6" /></linearGradient>
        </defs>
        <g className="cursor-rocket__flame"><path d="M8.4 35 C9 46 11 56 12 64 C13 56 15 46 15.6 35 Z" fill="url(#cursor-flame)" /><path d="M10.2 35 C10.6 40 11.5 45 12 49 C12.5 45 13.4 40 13.8 35 Z" fill="#fff" opacity=".9" /></g>
        <path d="M7.2 24.5 1.6 35.5 7.2 33.2Z M16.8 24.5 22.4 35.5 16.8 33.2Z" fill="#e0342b" stroke="#0b1521" strokeWidth=".8" strokeLinejoin="round" />
        <path d="M12 .6C16.6 5.6 17.4 13 17.1 23.5V33.6H6.9V23.5C6.6 13 7.4 5.6 12 .6Z" fill="url(#cursor-hull)" stroke="#0b1521" strokeWidth=".9" />
        <path d="M12 .6C15 3.8 16.2 7.2 16.7 10.6H7.3C7.8 7.2 9 3.8 12 .6Z" fill="#141a22" />
        <circle cx="12" cy="17.6" r="2.5" fill="#63d5ef" stroke="#0b1521" strokeWidth=".9" />
        <path d="M11.4 33.6V25" stroke="#e0342b" strokeWidth="1.2" />
        <rect x="9" y="33.4" width="6" height="2.4" rx=".6" fill="#34506d" stroke="#0b1521" strokeWidth=".6" />
      </svg>
    </div>
  </div>;
}
