import { useEffect, useRef } from 'react';
import { motionAllowed } from './motion';

/*
 * Member 4 — the scroll-scrubbed launch sequence for the hero.
 *
 * The hero is pinned inside `.hero-track` (App.tsx) while the visitor scrolls ~2.3 screens.
 * Progress 0 → 1 drives, in order:
 *   headline letters peel away · camera pushes in on the rocket · countdown 3-2-1 ·
 *   ignition (flame, pad glow, smoke, shake) · liftoff up the rail · camera tilts to follow ·
 *   dusk turns to night and stars appear · the tagline lights up word by word.
 *
 * The rocket is a cut-out of the hero photograph (`aerovate-rocket.*`) over a clean plate with
 * the rocket removed (`aerovate-launch-plate.*`); the launch rail stays on the pad. Both use the
 * photo's own 1740 × 904 pixel space, so positions below are photo coordinates.
 * Everything is decorative (aria-hidden); the real headline and copy remain in LandingSection.
 */

const PHOTO = { w: 1740, h: 904 };
const ROCKET_BOX = { x: 1232, y: 264, w: 102, h: 402 }; // where the cut-out sits in the photo
const NOZZLE = { x: 1281, y: 657 };
const PAD_Y = 800; // ground level under the tripod
const FOCUS = { x: 1281, y: 470 }; // camera push-in target

const LINES = ['For minds that look up.', 'And hands that want to build.'].map(line => line.split(' '));

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

type Particle = { x: number; y: number; vx: number; vy: number; r: number; gr: number; a: number; da: number };

function smokeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,.55)');
  grad.addColorStop(.45, 'rgba(255,255,255,.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return c;
}

/** Deterministic star field (box-shadow keeps it to a single element per layer). */
function stars(count: number, seed: number, spread: number) {
  let value = seed;
  const random = () => (value = (value * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: count }, () => `${(random() * 100).toFixed(2)}vw ${(random() * spread).toFixed(2)}svh 0 rgba(222,240,255,${(.35 + random() * .65).toFixed(2)})`).join(',');
}
const smallStars = stars(170, 7, 92);
const brightStars = stars(42, 91, 80);

export function HeroLaunch() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = root.current;
    const hero = layer?.closest<HTMLElement>('.hero');
    const track = hero?.parentElement?.classList.contains('hero-track') ? hero.parentElement : null;
    if (!layer || !hero || !track || !motionAllowed()) return;

    const $ = <T extends Element>(s: string) => layer.querySelector<T>(s)!;
    const stage = $<HTMLElement>('.launch-stage');
    const plate = $<HTMLImageElement>('.launch-plate img');
    const rocket = $<HTMLImageElement>('.launch-rocket');
    const canvas = $<HTMLCanvasElement>('.launch-fx');
    const ctx = canvas.getContext('2d');
    const night = $<HTMLElement>('.launch-night');
    const starLayer = $<HTMLElement>('.launch-stars');
    const counts = Array.from(layer.querySelectorAll<HTMLElement>('.launch-count > *'));
    const words = Array.from(layer.querySelectorAll<HTMLElement>('.launch-line > span'));
    const wordsBox = $<HTMLElement>('.launch-words');
    const hud = $<HTMLElement>('.launch-hud');
    const hudTime = $<HTMLElement>('.launch-hud [data-time]');
    const hudPhase = $<HTMLElement>('.launch-hud [data-phase]');
    const hudBar = $<HTMLElement>('.launch-hud i');
    const cue = $<HTMLElement>('.hero-scroll-cue');
    const chars = Array.from(hero.querySelectorAll<HTMLElement>('.hero-char'));
    const copy = Array.from(hero.querySelectorAll<HTMLElement>('.hero-eyebrow, .hero-kicker, .hero-description'));
    const inner = hero.querySelector<HTMLElement>('.hero-inner');
    if (!ctx) return;

    hero.classList.add('launch-motion');
    const sprite = smokeSprite();
    let ready = false;
    Promise.all([plate, rocket].map(img => img.decode?.().catch(() => undefined) ?? Promise.resolve()))
      .then(() => { if (plate.naturalWidth && rocket.naturalWidth) { ready = true; hero.classList.add('launch-ready'); } });

    // Layout (recomputed on resize)
    let W = 0, H = 0, s0 = 1, dx = 0, dy = 0, dpr = 1, trackLen = 1;
    const map = (x: number, y: number) => [dx + x * s0, dy + y * s0] as const;
    const measure = () => {
      W = stage.offsetWidth; H = stage.offsetHeight;
      const [px, py] = getComputedStyle(plate).objectPosition.split(' ').map(v => parseFloat(v) / 100);
      s0 = Math.max(W / PHOTO.w, H / PHOTO.h);
      dx = (W - PHOTO.w * s0) * (Number.isFinite(px) ? px : .72);
      dy = (H - PHOTO.h * s0) * (Number.isFinite(py) ? py : 1);
      const [rx, ry] = map(ROCKET_BOX.x, ROCKET_BOX.y);
      Object.assign(rocket.style, { left: `${rx}px`, top: `${ry}px`, width: `${ROCKET_BOX.w * s0}px`, height: `${ROCKET_BOX.h * s0}px` });
      const [fx, fy] = map(FOCUS.x, FOCUS.y);
      stage.style.transformOrigin = `${fx}px ${fy}px`;
      dpr = Math.min(window.devicePixelRatio || 1, W < 600 ? 1.25 : 1.5);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      hero.style.setProperty('--hero-stick', `${Math.min(0, window.innerHeight - hero.offsetHeight)}px`);
      trackLen = Math.max(1, track.offsetHeight - window.innerHeight);
      if (window.scrollY < 2) cacheChars();
    };

    const particles: Particle[] = [];
    let p = 0, smooth = 0, last = 0, frame = 0, visible = true, lift = 0, lastFxLift = 0, lastFx = 0, fxElapsed = 0;
    // Pointer parallax (fine pointers only): -1..1 across the hero, eased.
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let mx = 0, my = 0, smx = 0, smy = 0, px = -9999, py = -9999;
    let charCentres: Array<[number, number]> = [];
    const cacheChars = () => { charCentres = chars.map(el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2 + window.scrollY]; }); };

    const render = (now: number) => {
      frame = 0;
      const dt = Math.min(3, last ? (now - last) / 16.67 : 1);
      last = now;
      const top = track.getBoundingClientRect().top;
      p = clamp(-top / trackLen);
      smooth += (p - smooth) * Math.min(1, .22 * dt);
      if (Math.abs(p - smooth) < .0004) smooth = p;
      const q = smooth;
      const seg = (a: number, b: number) => clamp((q - a) / (b - a));
      smx += (mx - smx) * Math.min(1, .07 * dt); smy += (my - smy) * Math.min(1, .07 * dt);
      if (inner) inner.style.transform = smx || smy ? `translate3d(${smx * 12}px,${smy * 8}px,0)` : '';

      // 0 · Headline letters lean away from a nearby pointer (fades out once the launch starts)
      const magnet = finePointer ? 1 - seg(0, .015) : 0;
      chars.forEach((el, i) => {
        const c = charCentres[i];
        const k = c && magnet ? Math.max(0, 1 - Math.hypot(px - c[0], py - (c[1] - window.scrollY)) / 150) * magnet : 0;
        const ease = k * k * (3 - 2 * k);
        el.style.translate = ease > .001 ? `${Math.sign(c[0] - px) * ease * 6}px ${-ease * 22}%` : '';
        el.classList.toggle('is-near', ease > .35);
      });

      // 1 · Headline peels away letter by letter, supporting copy lifts off
      chars.forEach((el, i) => {
        const t = easeInOut(seg(.01 + i * .004, .08 + i * .004));
        el.style.transform = t ? `translate3d(0,${-t * 115}%,0) rotate(${-t * 14}deg)` : '';
        el.style.opacity = String(1 - t);
      });
      copy.forEach((el, i) => {
        const t = easeInOut(seg(i * .01, .07 + i * .01));
        el.style.transform = t ? `translate3d(0,${-t * 60}px,0)` : '';
        el.style.opacity = String(1 - t);
      });
      cue.style.opacity = String(1 - seg(0, .025));

      // 2 · Camera: push in on the rocket, then tilt up to follow it
      const [, oy] = map(FOCUS.x, FOCUS.y);
      const scale = 1 + .34 * easeInOut(seg(.02, .36)) + .14 * easeInOut(seg(.4, .92));
      const tilt = Math.min(H * .1 * easeInOut(seg(.34, .8)), oy * (scale - 1));
      const shakeAmp = 3.2 * seg(.2, .3) * (1 - seg(.42, .56));
      const sx = Math.sin(now * .09) * shakeAmp, sy = Math.cos(now * .113) * shakeAmp * .6;
      stage.style.transform = `translate3d(${sx - smx * 16}px,${tilt + sy - smy * 10}px,0) scale(${scale})`;

      // 3 · Countdown 3 · 2 · 1 · Liftoff
      counts.forEach((el, i) => {
        const a = .12 + i * .065, b = a + (i === 3 ? .12 : .065);
        const u = seg(a, b);
        const shown = u > 0 && u < 1;
        el.style.opacity = shown ? String(Math.min(1, u * 5) * (1 - clamp((u - .62) / .38))) : '0';
        el.style.transform = `translate3d(0,-50%,0) scale(${1.35 - .35 * easeOut(u)})`;
      });

      // 4 · Ignition and liftoff
      const thrust = seg(.2, .32);
      const liftT = seg(.32, .74);
      // rocket must leave the top of the screen by the end, whatever the camera is doing
      const [, rTop] = map(ROCKET_BOX.x, ROCKET_BOX.y);
      const exitY = (oy - (oy + tilt) / scale) - rTop - ROCKET_BOX.h * s0 * 1.4;
      lift = exitY * liftT ** 1.7;
      const rumble = thrust > 0 && liftT === 0 ? Math.sin(now * .21) * .8 : 0;
      const sway = Math.sin(liftT * 5.5) * 6 * s0 * liftT;
      rocket.style.transform = `translate3d(${sway + rumble}px,${lift}px,0)`;

      // 5 · Dusk → night, stars
      night.style.opacity = String(easeInOut(seg(.3, .78)) * .94);
      starLayer.style.opacity = String(seg(.46, .86));
      starLayer.style.transform = `translate3d(${-smx * 26}px,calc(${(1 - seg(.4, 1)) * 4}svh + ${-smy * 18}px),0)`;

      // 6 · Tagline lights up word by word
      wordsBox.style.opacity = String(seg(.6, .65) * (1 - seg(.94, .995)));
      wordsBox.style.transform = `translate3d(0,${(1 - easeOut(seg(.6, .7))) * 40 - seg(.9, 1) * 40}px,0)`;
      const span = .25 / words.length;
      words.forEach((el, k) => {
        const h = seg(.63 + k * span, .63 + (k + 1.6) * span);
        el.style.opacity = String(.13 + .87 * h);
        el.style.transform = `translate3d(0,${(1 - easeOut(h)) * 10}px,0)`;
      });

      // 7 · Mission clock
      hud.style.opacity = String(seg(.03, .08) * (1 - seg(.93, .99)));
      const tMinus = 3 - seg(.12, .32) * 3;
      hudTime.textContent = q < .32 ? `T−${tMinus.toFixed(2).padStart(5, '0')}` : `T+${(seg(.32, 1) * 42).toFixed(2).padStart(5, '0')}`;
      hudPhase.textContent = q < .14 ? 'Systems check' : q < .2 ? 'Countdown' : q < .32 ? 'Ignition' : q < .45 ? 'Liftoff' : q < .75 ? 'Ascent' : 'Into the night';
      hudBar.style.transform = `scaleX(${q})`;

      // Keep camera/text motion fluid; smoke/flame rasterization needs only 30 Hz.
      fxElapsed += dt;
      if (!lastFx || now - lastFx >= 1000 / 30 - .1) {
        const dt = fxElapsed;
        fxElapsed = 0;
        lastFx = now;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        if (ready || particles.length) {
          const [nx, ny0] = map(NOZZLE.x, NOZZLE.y);
          const ny = ny0 + lift;
          const [, pad] = map(0, PAD_Y);
          const speed = Math.abs(lift - lastFxLift) / Math.max(dt, .5);
          const nearPad = clamp(1 - (ny0 - ny) / (H * .35));
          const fire = thrust * (ready ? 1 : 0);

          // smoke: billows along the ground at ignition, then a trail behind the rocket
          if (fire > 0 && dt > 0 && q < .74) {
            const groundRate = fire * nearPad * 3.2 * dt;
            for (let i = 0; i < groundRate; i++) {
              const dir = Math.random() < .5 ? -1 : 1;
              particles.push({ x: nx + dir * Math.random() * 14 * s0, y: pad - Math.random() * 46 * s0, vx: dir * (1 + Math.random() * 3.6) * s0 * 1.4, vy: -(.15 + Math.random() * .55) * s0, r: (14 + Math.random() * 18) * s0, gr: (.9 + Math.random() * 1.1) * s0, a: .5 + Math.random() * .3, da: .0045 + Math.random() * .004 });
            }
            const trailRate = fire * (1 - nearPad * .7) * 2.2 * dt * (liftT > 0 ? 1 : 0);
            for (let i = 0; i < trailRate; i++) {
              particles.push({ x: nx + (Math.random() - .5) * 8 * s0, y: ny + 30 * s0 + Math.random() * speed, vx: (Math.random() - .5) * .8 * s0, vy: (.2 + Math.random() * .6) * s0, r: (6 + Math.random() * 8) * s0, gr: (.35 + Math.random() * .5) * s0, a: .42, da: .006 + Math.random() * .005 });
            }
          }
          const particleLimit = W < 600 ? 120 : 220;
          if (particles.length > particleLimit) particles.splice(0, particles.length - particleLimit);
          for (let i = particles.length - 1; i >= 0; i--) {
            const m = particles[i];
            m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= .985 ** dt; m.vy *= .99 ** dt; m.r += m.gr * dt; m.a -= m.da * dt;
            if (m.a <= 0) particles.splice(i, 1);
          }
          // draw smoke: cool grey-blue, warmed by the flame when fresh
          for (const m of particles) {
            ctx.globalAlpha = Math.min(.85, m.a) * (1 - seg(.9, 1) * .6);
            ctx.drawImage(sprite, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
          }
          ctx.globalCompositeOperation = 'source-atop';
          ctx.globalAlpha = .5;
          ctx.fillStyle = '#7d8aa0';
          ctx.fillRect(0, 0, W, H);
          ctx.globalCompositeOperation = 'source-over';

          if (fire > 0) {
            ctx.globalCompositeOperation = 'lighter';
            // pad glow lights the smoke and ground while the rocket is close
            const glowR = (120 + 160 * fire) * s0 * (0.5 + nearPad * .5);
            const g = ctx.createRadialGradient(nx, Math.min(ny + 40 * s0, pad), 0, nx, Math.min(ny + 40 * s0, pad), glowR);
            g.addColorStop(0, `rgba(255,190,110,${.55 * fire * (0.35 + nearPad * .65)})`);
            g.addColorStop(.4, `rgba(255,120,50,${.22 * fire * (0.3 + nearPad * .7)})`);
            g.addColorStop(1, 'rgba(255,90,30,0)');
            ctx.globalAlpha = 1;
            ctx.fillStyle = g;
            ctx.fillRect(nx - glowR, ny - glowR, glowR * 2, glowR * 2 + 80 * s0);
            // flame: layered flickering plume
            const flicker = .86 + Math.random() * .22;
            const len = (26 + 70 * fire + Math.min(160, speed * 2.2)) * s0 * flicker;
            const wid = 7.5 * s0 * (0.7 + fire * .3);
            for (const [k, col] of [[1.9, 'rgba(255,110,40,'], [1.3, 'rgba(255,190,90,'], [.7, 'rgba(255,248,225,']] as const) {
              const L = len * (k > 1.5 ? 1.1 : k > 1 ? .85 : .55);
              const fg = ctx.createLinearGradient(nx, ny, nx, ny + L);
              fg.addColorStop(0, `${col}${.95 * fire})`);
              fg.addColorStop(1, `${col}0)`);
              ctx.fillStyle = fg;
              ctx.beginPath();
              ctx.moveTo(nx - wid * k * .5, ny);
              ctx.quadraticCurveTo(nx - wid * k * .75, ny + L * .35, nx, ny + L);
              ctx.quadraticCurveTo(nx + wid * k * .75, ny + L * .35, nx + wid * k * .5, ny);
              ctx.closePath();
              ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
          }
          ctx.globalAlpha = 1;
        }
        lastFxLift = lift;
      }

      hero.toggleAttribute('data-covered', p >= 1 && track.getBoundingClientRect().bottom <= 0);
      // Keep animating while visible and something is moving (flame flicker, smoke, easing)
      if (visible && (burning() || particles.length || smooth !== p || Math.abs(mx - smx) > .002 || Math.abs(my - smy) > .002)) schedule();
    };
    const burning = () => smooth > .2 && smooth < .74;
    const schedule = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render); };
    const onResize = () => { measure(); schedule(); };
    const onPointer = (event: PointerEvent) => {
      if (!visible || document.hidden || !finePointer || event.pointerType === 'touch') return;
      const r = hero.getBoundingClientRect();
      if (event.clientY > r.bottom) return;
      mx = (event.clientX / window.innerWidth - .5) * 2;
      my = (event.clientY / window.innerHeight - .5) * 2;
      px = event.clientX; py = event.clientY;
      if (!charCentres.length && window.scrollY < 2) cacheChars();
      schedule();
    };
    const onPointerLeave = () => { mx = my = 0; px = py = -9999; schedule(); };

    measure();
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerLeave);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    ro?.observe(hero);
    const syncVisibility = () => {
      cancelAnimationFrame(frame); frame = last = lastFx = fxElapsed = 0;
      if (visible && !document.hidden) schedule();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      hero.toggleAttribute('data-covered', !visible && entry.boundingClientRect.bottom <= 0);
      syncVisibility();
    });
    document.addEventListener('visibilitychange', syncVisibility);
    io.observe(track);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('mouseleave', onPointerLeave);
      if (inner) inner.style.transform = '';
      ro?.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
      hero.classList.remove('launch-motion', 'launch-ready');
      hero.removeAttribute('data-covered');
      hero.style.removeProperty('--hero-stick');
      [...chars, ...copy].forEach(el => { el.style.transform = ''; el.style.opacity = ''; el.style.translate = ''; });
    };
  }, []);

  return <div className="launch" ref={root} aria-hidden="true">
    <div className="launch-stage">
      <picture className="launch-plate">
        <source srcSet="/assets/hero/aerovate-launch-plate.webp" type="image/webp" />
        <img src="/assets/hero/aerovate-launch-plate.jpg" alt="" width="1740" height="904" decoding="async" />
      </picture>
      <picture>
        <source srcSet="/assets/hero/aerovate-rocket.webp" type="image/webp" />
        <img className="launch-rocket" src="/assets/hero/aerovate-rocket.png" alt="" width="102" height="402" decoding="async" />
      </picture>
      <canvas className="launch-fx" />
    </div>
    <div className="launch-night" />
    <div className="launch-stars"><span style={{ boxShadow: smallStars }} /><span style={{ boxShadow: brightStars }} /></div>
    <div className="launch-count"><span>3</span><span>2</span><span>1</span><b>Liftoff</b></div>
    <p className="launch-words">{LINES.map((line, l) => <span key={l} className="launch-line">{line.map((word, i) => <span key={i}>{word}</span>)}</span>)}</p>
    <div className="launch-hud">
      <span data-phase>Systems check</span>
      <strong data-time>T−03.00</strong>
      <span className="launch-hud__bar"><i /></span>
    </div>
    <div className="hero-scroll-cue"><span className="hero-scroll-cue__track"><i /></span>Scroll to launch</div>
  </div>;
}
