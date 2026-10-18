import { useEffect, useRef } from 'react';
import { motionAllowed } from './motion';
import './cursor.css';

/*
 * Member 4 — cursor interactivity (desktop mice and trackpads only; touch and reduced
 * motion keep the system cursor and get none of this).
 *
 * - A bright dot that tracks the pointer exactly, plus a ring that trails it with
 *   spring physics and stretches along the direction of travel.
 * - Context states: links and buttons swell the ring; photos say "View"; the hero sky says
 *   "Scroll"; anything can opt in with `data-cursor="Label"`.
 * - Round controls (header arrow, contact orbit, menu) capture the ring, which wraps them.
 * - Magnetic buttons lean toward the pointer and spring back when it leaves.
 * - Cards light up with a spotlight that follows the pointer.
 * - A faint trail of exhaust sparks follows fast movements.
 */

const INTERACTIVE = 'a, button, [role="button"], label, summary, select, input, textarea';
const MAGNETIC = '.button, .header-contact, .contact-orbit, .menu-toggle, .tt-cta, .glimpses__chip, .brand, .lightbox button';
const STICKY = '.header-contact, .contact-orbit, .menu-toggle';
const SPOTLIGHT = '.empty-state, .card, .event-facts';
const VIEW = '.glimpses__open, .globe__btn:not(.globe__btn--empty), [data-zoom]';

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number };

export function CursorLayer() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = root.current;
    if (!layer || !motionAllowed() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const html = document.documentElement;
    const dot = layer.querySelector<HTMLElement>('.cursor-dot')!;
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
    let pressed = false, shown = false, frame = 0, last = 0, lastX = x, lastY = y;
    const sparks: Spark[] = [];
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
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
      if (nextMagnet !== magnet) { release(magnet); magnet = nextMagnet; }
    };

    const release = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.transition = 'translate .6s cubic-bezier(.2,.9,.25,1.3)';
      el.style.translate = '';
      window.setTimeout(() => { if (el !== magnet) el.style.transition = ''; }, 650);
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(3, last ? (now - last) / 16.67 : 1);
      last = now;

      // ring target: the pointer, or the centre of a sticky control
      let tx = x, ty = y;
      if (stuck) {
        const r = stuck.getBoundingClientRect();
        tx = r.left + r.width / 2 + (x - (r.left + r.width / 2)) * .18;
        ty = r.top + r.height / 2 + (y - (r.top + r.height / 2)) * .18;
        targetSize = Math.max(r.width, r.height) + 14;
      }
      // critically-damped-ish spring
      vx += (tx - rx) * .22 * dt; vy += (ty - ry) * .22 * dt;
      vx *= .58 ** dt; vy *= .58 ** dt;
      rx += vx * dt; ry += vy * dt;
      size += (targetSize * (pressed ? .78 : 1) - size) * Math.min(1, .2 * dt);

      const speed = Math.hypot(vx, vy);
      const stretch = stuck || layer.dataset.state === 'label' ? 0 : Math.min(.45, speed / 60);
      const angle = Math.atan2(vy, vx);
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) rotate(${angle}rad) scale(${1 + stretch},${1 - stretch * .55}) rotate(${-angle}rad)`;
      ring.style.width = ring.style.height = `${size}px`;
      ring.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;

      // magnetic pull on the hovered control
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const mx = (x - (r.left + r.width / 2)) * .28, my = (y - (r.top + r.height / 2)) * .28;
        magnet.style.transition = 'none';
        magnet.style.translate = `${Math.max(-14, Math.min(14, mx))}px ${Math.max(-10, Math.min(10, my))}px`;
      }

      // exhaust sparks on fast movement
      const moved = Math.hypot(x - lastX, y - lastY);
      if (shown && moved > 6) {
        const n = Math.min(4, moved / 10);
        for (let i = 0; i < n; i++) {
          const t = Math.random();
          sparks.push({ x: lastX + (x - lastX) * t, y: lastY + (y - lastY) * t, vx: (Math.random() - .5) * .9 - (x - lastX) * .02, vy: (Math.random() - .5) * .9 - (y - lastY) * .02 + .15, life: 1, size: 1 + Math.random() * 2.2, hue: Math.random() });
        }
        if (sparks.length > 160) sparks.splice(0, sparks.length - 160);
      }
      lastX = x; lastY = y;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .96; s.vy *= .96; s.life -= .03 * dt;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = s.life * .8;
        ctx.fillStyle = s.hue > .7 ? '#ffd29a' : s.hue > .35 ? '#9fe8f7' : '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const settling = Math.abs(tx - rx) > .2 || Math.abs(ty - ry) > .2 || Math.abs(size - targetSize) > .3 || speed > .05;
      if (settling || sparks.length || magnet || stuck) schedule();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(tick); };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      x = event.clientX; y = event.clientY;
      if (!shown) { shown = true; rx = x; ry = y; lastX = x; lastY = y; layer.classList.add('is-visible'); }
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
    const onDown = () => { pressed = true; layer.classList.add('is-pressed'); schedule(); };
    const onUp = () => { pressed = false; layer.classList.remove('is-pressed'); schedule(); };
    const onLeave = (event: MouseEvent) => { if (!event.relatedTarget) { shown = false; layer.classList.remove('is-visible'); release(magnet); magnet = null; stuck = null; } };
    const onScroll = () => { if (shown) { classify(document.elementFromPoint(x, y)); schedule(); } };

    resize();
    html.classList.add('cursor-on');
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseout', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      release(magnet);
      html.classList.remove('cursor-on');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseout', onLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <div className="cursor" ref={root} aria-hidden="true" data-state="default">
    <canvas className="cursor-trail" />
    <div className="cursor-ring"><span className="cursor-label" /></div>
    <div className="cursor-dot" />
  </div>;
}
