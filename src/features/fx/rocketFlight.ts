import { motionAllowed } from '../space/motion';

/*
 * A small rocket that flies over the page on a temporary full-screen canvas.
 * Drawn with gradients for a lit, cylindrical body; the exhaust is a layered flame with
 * shock diamonds, a heat glow, sparks and smoke that billows, rises, spreads and fades.
 * Purely decorative: the canvas is aria-hidden, ignores the pointer and removes itself.
 */

type Point = { x: number; y: number };
type Puff = { x: number; y: number; vx: number; vy: number; r: number; gr: number; a: number; da: number; heat: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number };

export interface FlightOptions {
  from: Point;
  to: Point;
  /** Offset of the path's control point from the midpoint, e.g. { x: 0, y: -80 } arcs upwards. */
  curve?: Point;
  /** Rocket length in CSS pixels. */
  size?: number;
  /** Time with the engine lit on the pad before moving, in ms. */
  ignition?: number;
  /** Travel time in ms. */
  duration?: number;
  /** 'launch' keeps accelerating off the end of the path; 'hop' eases in and out and fades on arrival. */
  profile?: 'launch' | 'hop';
  onArrive?: () => void;
}

const noop = () => {};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const sprites: Partial<Record<'smoke' | 'ember', HTMLCanvasElement>> = {};

function sprite(kind: 'smoke' | 'ember') {
  if (sprites[kind]) return sprites[kind]!;
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  const [r, gr, b] = kind === 'smoke' ? [214, 222, 234] : [255, 150, 70];
  grad.addColorStop(0, `rgba(${r},${gr},${b},.6)`);
  grad.addColorStop(.5, `rgba(${r},${gr},${b},.22)`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 96, 96);
  return (sprites[kind] = c);
}

/** Rocket drawn pointing up, centred on the origin, 100 units long (nose at -50, nozzle exit at +44). */
function drawRocket(ctx: CanvasRenderingContext2D) {
  const shade = (stops: Array<[number, string]>, x0 = -9, x1 = 9) => {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    stops.forEach(([at, colour]) => g.addColorStop(at, colour));
    return g;
  };
  // fins (behind the body)
  ctx.fillStyle = shade([[0, '#14304d'], [.5, '#2f5f8c'], [1, '#14304d']], -22, 22);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(9 * side, 12); ctx.lineTo(22 * side, 33); ctx.lineTo(22 * side, 42); ctx.lineTo(8 * side, 35);
    ctx.closePath(); ctx.fill();
  }
  // nozzle bell
  ctx.fillStyle = shade([[0, '#1d2129'], [.45, '#8a93a1'], [.6, '#c3cad4'], [1, '#1d2129']]);
  ctx.beginPath(); ctx.moveTo(-6, 33); ctx.lineTo(6, 33); ctx.lineTo(8.5, 44); ctx.lineTo(-8.5, 44); ctx.closePath(); ctx.fill();
  // body: lit from the upper left
  ctx.fillStyle = shade([[0, '#5d6b7d'], [.28, '#f2f6fb'], [.42, '#ffffff'], [.75, '#c4ceda'], [1, '#4f5b6b']]);
  ctx.fillRect(-9, -18, 18, 52);
  // nose cone
  ctx.fillStyle = shade([[0, '#0c2238'], [.35, '#2c6696'], [.5, '#4d8fc2'], [1, '#0a1c30']]);
  ctx.beginPath(); ctx.moveTo(-9, -18); ctx.quadraticCurveTo(-9, -40, 0, -50); ctx.quadraticCurveTo(9, -40, 9, -18); ctx.closePath(); ctx.fill();
  // cyan band and panel lines
  ctx.fillStyle = shade([[0, '#1f7c93'], [.35, '#9ff0ff'], [.5, '#c9f8ff'], [1, '#17606f']]);
  ctx.fillRect(-9, -16, 18, 3);
  ctx.strokeStyle = 'rgba(20,30,45,.22)'; ctx.lineWidth = .8;
  for (const y of [10, 24]) { ctx.beginPath(); ctx.moveTo(-9, y); ctx.lineTo(9, y); ctx.stroke(); }
  // centre fin, seen edge-on
  ctx.fillStyle = '#183652';
  ctx.fillRect(-1.4, 16, 2.8, 26);
  // window
  ctx.fillStyle = '#9aa8b8';
  ctx.beginPath(); ctx.arc(0, -4, 4.6, 0, Math.PI * 2); ctx.fill();
  const glass = ctx.createRadialGradient(-1.4, -5.6, .4, 0, -4, 3.7);
  glass.addColorStop(0, '#b9ecff'); glass.addColorStop(.35, '#3f86b8'); glass.addColorStop(1, '#0b1d30');
  ctx.fillStyle = glass;
  ctx.beginPath(); ctx.arc(0, -4, 3.7, 0, Math.PI * 2); ctx.fill();
}

/** Flame below the nozzle exit (+44), in rocket units. Uses additive blending. */
function drawFlame(ctx: CanvasRenderingContext2D, length: number, throttle: number) {
  const layers: Array<[number, number, string]> = [[1, 11, '255,105,40'], [.72, 7.5, '255,190,95'], [.42, 4.2, '255,250,230']];
  for (const [k, width, rgb] of layers) {
    const L = length * k;
    const g = ctx.createLinearGradient(0, 44, 0, 44 + L);
    g.addColorStop(0, `rgba(${rgb},${.95 * throttle})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-width * .55, 44);
    ctx.quadraticCurveTo(-width * .85, 44 + L * .35, 0, 44 + L);
    ctx.quadraticCurveTo(width * .85, 44 + L * .35, width * .55, 44);
    ctx.closePath(); ctx.fill();
  }
  // hot blue root and shock diamonds along the core
  ctx.fillStyle = `rgba(150,205,255,${.55 * throttle})`;
  ctx.beginPath(); ctx.ellipse(0, 45.5, 6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  for (const [at, r] of [[.16, 2.6], [.3, 2.1], [.43, 1.6]] as const) {
    ctx.fillStyle = `rgba(225,242,255,${.75 * throttle})`;
    ctx.beginPath(); ctx.ellipse(0, 44 + length * at, r, r * 1.5, 0, 0, Math.PI * 2); ctx.fill();
  }
}

/** Fly a rocket from `from` to `to` (viewport coordinates). Returns a function that cancels it. */
export function launchRocket(options: FlightOptions): () => void {
  if (typeof document === 'undefined' || !motionAllowed()) return noop;
  const canvas = document.createElement('canvas');
  let ctx: CanvasRenderingContext2D | null = null;
  try { ctx = canvas.getContext('2d'); } catch { ctx = null; }
  if (!ctx) return noop;
  const c = ctx;

  const { from, to, curve = { x: 0, y: 0 }, size = 60, ignition = 0, duration = 1200, profile = 'launch', onArrive } = options;
  canvas.className = 'fx-rocket-layer';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  const control = { x: (from.x + to.x) / 2 + curve.x, y: (from.y + to.y) / 2 + curve.y };
  const at = (t: number): Point => ({
    x: (1 - t) ** 2 * from.x + 2 * (1 - t) * t * control.x + t * t * to.x,
    y: (1 - t) ** 2 * from.y + 2 * (1 - t) * t * control.y + t * t * to.y,
  });
  const tangent = (t: number): Point => {
    const x = 2 * (1 - t) * (control.x - from.x) + 2 * t * (to.x - control.x);
    const y = 2 * (1 - t) * (control.y - from.y) + 2 * t * (to.y - control.y);
    const l = Math.hypot(x, y) || 1;
    return { x: x / l, y: y / l };
  };
  // 'launch' accelerates like a real lift-off and carries on past the end of the path
  const progress = (u: number) => (profile === 'hop' ? easeInOut(clamp(u)) : u * u * (1.15 - .15 * u));

  const scale = size / 100;
  const puffs: Puff[] = [];
  const sparks: Spark[] = [];
  const smoke = sprite('smoke'), ember = sprite('ember');
  let start = 0, last = 0, frame = 0, arrived = false, done = false;
  let prev = from;

  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };

  const render = (now: number) => {
    frame = 0;
    if (!start) start = last = now;
    const dt = Math.min(3, (now - last) / 16.67 || 1);
    last = now;
    const elapsed = now - start;
    const moving = elapsed > ignition;
    const u = moving ? (elapsed - ignition) / duration : 0;
    const t = progress(u);
    if (!arrived && u >= 1) { arrived = true; onArrive?.(); }

    // rocket state: hops fade out on arrival; launches leave the screen
    const fade = profile === 'hop' ? 1 - clamp((u - .92) / .18) : 1;
    const visible = fade > 0 && (profile === 'hop' || u < 1.6);
    const pos = profile === 'hop' ? at(Math.min(1, t)) : at(t);
    const dir = tangent(clamp(t, .001, 1));
    const speed = Math.hypot(pos.x - prev.x, pos.y - prev.y) / dt;
    prev = pos;
    const spool = clamp(elapsed / Math.max(1, ignition * .7));
    const throttle = visible ? (ignition ? spool : 1) * (profile === 'hop' ? .55 + .45 * Math.sin(Math.PI * clamp(u)) : 1) * fade : 0;
    const shake = moving ? 0 : spool * 1.2;
    const jx = (Math.random() - .5) * shake, jy = (Math.random() - .5) * shake;
    const nozzle = { x: pos.x - dir.x * 44 * scale + jx, y: pos.y - dir.y * 44 * scale + jy };

    // emit exhaust
    if (throttle > .02) {
      const rate = (profile === 'hop' ? 1.4 : 3.2) * throttle * dt;
      for (let i = 0; i < rate; i++) {
        const spread = (Math.random() - .5) * 1.6;
        const v = (1.4 + Math.random() * 2.4) * scale * 2;
        puffs.push({ x: nozzle.x - dir.x * 12 * scale, y: nozzle.y - dir.y * 12 * scale, vx: -dir.x * v + dir.y * spread, vy: -dir.y * v - dir.x * spread, r: (5 + Math.random() * 6) * scale * 1.6, gr: (.35 + Math.random() * .55) * scale * 1.6, a: .45, da: .008 + Math.random() * .008, heat: 1 });
      }
      // on the pad the exhaust has nowhere to go but sideways: ground billow
      if (!moving && profile === 'launch') {
        for (let i = 0; i < 2.4 * throttle * dt; i++) {
          const side = Math.random() < .5 ? -1 : 1;
          puffs.push({ x: nozzle.x + side * Math.random() * 10 * scale, y: nozzle.y + 22 * scale, vx: side * (1.5 + Math.random() * 3.5) * scale * 1.8, vy: -(Math.random() * .6) * scale, r: (10 + Math.random() * 10) * scale * 1.6, gr: (.6 + Math.random() * .8) * scale * 1.6, a: .3, da: .006 + Math.random() * .005, heat: .8 });
        }
      }
      for (let i = 0; i < (profile === 'hop' ? .6 : 1.4) * throttle * dt; i++) {
        const spread = (Math.random() - .5) * 3;
        const v = (5 + Math.random() * 7) * scale * 2;
        sparks.push({ x: nozzle.x, y: nozzle.y, vx: -dir.x * v + dir.y * spread, vy: -dir.y * v - dir.x * spread, life: 0, max: 14 + Math.random() * 16 });
      }
    }
    if (puffs.length > 260) puffs.splice(0, puffs.length - 260);

    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    // smoke: rises a little, spreads, slows and fades; still warm (lit by the flame) when fresh
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= .955 ** dt; p.vy = p.vy * .955 ** dt - .018 * dt;
      p.r += p.gr * dt; p.a -= p.da * dt; p.heat = Math.max(0, p.heat - .09 * dt);
      if (p.a <= 0) { puffs.splice(i, 1); continue; }
      c.globalAlpha = Math.min(.7, p.a);
      c.drawImage(smoke, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    c.globalCompositeOperation = 'lighter';
    for (const p of puffs) {
      if (p.heat <= 0) continue;
      c.globalAlpha = p.heat * .55 * Math.min(1, p.a * 2);
      c.drawImage(ember, p.x - p.r * .8, p.y - p.r * .8, p.r * 1.6, p.r * 1.6);
    }

    if (visible) {
      // heat glow around the nozzle
      if (throttle > 0) {
        const R = (60 + 50 * throttle) * scale * 2;
        const g = c.createRadialGradient(nozzle.x, nozzle.y, 0, nozzle.x, nozzle.y, R);
        g.addColorStop(0, `rgba(255,180,100,${.42 * throttle})`);
        g.addColorStop(.45, `rgba(255,110,50,${.14 * throttle})`);
        g.addColorStop(1, 'rgba(255,90,30,0)');
        c.globalAlpha = 1;
        c.fillStyle = g;
        c.fillRect(nozzle.x - R, nozzle.y - R, R * 2, R * 2);
      }
      c.save();
      c.translate(pos.x + jx, pos.y + jy);
      c.rotate(Math.atan2(dir.y, dir.x) + Math.PI / 2 + Math.sin(now * .018) * .012 * throttle);
      c.scale(scale, scale);
      c.globalAlpha = 1;
      if (throttle > 0) {
        const flicker = .85 + Math.random() * .25;
        drawFlame(c, (34 + 46 * throttle + Math.min(70, speed * 3)) * flicker, throttle);
      }
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = fade;
      drawRocket(c);
      c.restore();
    }

    // sparks: short-lived, bright, pulled down by gravity
    c.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life >= s.max) { sparks.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .94 ** dt; s.vy = s.vy * .94 ** dt + .12 * dt;
      c.globalAlpha = 1 - s.life / s.max;
      c.fillStyle = s.life < s.max * .4 ? '#fff4d6' : '#ffad5c';
      c.fillRect(s.x - .9, s.y - .9, 1.8, 1.8);
    }
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;

    if (!visible && !puffs.length && !sparks.length) { finish(); return; }
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);
  return finish;
}
