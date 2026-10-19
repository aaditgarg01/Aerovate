import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A real 3D rocket (a small mesh with lighting and perspective, drawn on a canvas).
 * It chases the mouse pointer around the background, behind the globe, turning,
 * banking and spinning as it flies, with a flame and a particle trail.
 * With no pointer movement for a few seconds it cruises around on its own.
 */

type V3 = [number, number, number];
type RGB = [number, number, number];
interface Face {
  pts: V3[];
  color: RGB;
  solid: boolean; // closed surface (hide when facing away) or a thin fin (visible from both sides)
  emissive?: boolean; // glows by itself, not lit (engine)
  edge?: boolean; // draw a darker outline (fins)
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

const SEGMENTS = 32;
const BODY_R = 0.085;
const CAM = 4; // camera distance, in rocket lengths
const WHITE: RGB = [238, 242, 247];
const NAVY: RGB = [20, 44, 70];
const BLUE: RGB = [70, 140, 205];
const SKY: RGB = [125, 188, 238];
const DARK: RGB = [58, 64, 76];
const DARK2: RGB = [34, 38, 48];
const CHROME: RGB = [176, 190, 204];
const GLASS: RGB = [16, 28, 42];
const FIRE: RGB = [255, 205, 150];

function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function lerpV(a: V3, b: V3, t: number): V3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const LIGHT = norm([-0.45, -0.65, 0.62]); // from the upper left, towards the viewer

function ringPt(x: number, r: number, k: number): V3 {
  const a = (k / SEGMENTS) * Math.PI * 2;
  return [x, r * Math.cos(a), r * Math.sin(a)];
}

// The rocket is built along the x axis: nose at +x, engine at -x.
function buildMesh(): Face[] {
  const faces: Face[] = [];
  const R = BODY_R;
  const bands: [number, number, number, number, RGB][] = [
    // body: white with a navy ring and a thin blue ring
    [-0.3, R, -0.17, R, WHITE],
    [-0.17, R, -0.135, R, NAVY],
    [-0.135, R, 0.02, R, WHITE],
    [0.02, R, 0.045, R, BLUE],
    [0.045, R, 0.12, R, WHITE],
    // engine bell
    [-0.37, 0.056, -0.3, R, DARK],
    [-0.4, 0.046, -0.37, 0.056, DARK2],
  ];
  // smooth pointed nose (an ogive), 9 steps
  const steps = 9;
  const shape = (t: number) => R * Math.sqrt(1 - Math.pow(t, 1.7));
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    bands.push([0.12 + t0 * 0.38, shape(t0), 0.12 + t1 * 0.38, shape(t1), i >= steps - 2 ? SKY : BLUE]);
  }
  for (const [x0, r0, x1, r1, color] of bands) {
    for (let k = 0; k < SEGMENTS; k++) {
      faces.push({
        pts: [ringPt(x0, r0, k), ringPt(x1, r1, k), ringPt(x1, r1, k + 1), ringPt(x0, r0, k + 1)],
        color,
        solid: true,
      });
    }
  }
  // glowing engine opening
  const cap: V3[] = [];
  for (let k = 0; k < SEGMENTS; k++) cap.push(ringPt(-0.402, 0.044, k));
  faces.push({ pts: cap, color: FIRE, solid: false, emissive: true });

  // four swept fins
  const finProfile: [number, number][] = [
    [-0.06, R * 0.98],
    [-0.25, 0.22],
    [-0.32, 0.22],
    [-0.32, R * 0.98],
  ];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    faces.push({ pts: finProfile.map(([x, r]): V3 => [x, r * c, r * s]), color: BLUE, solid: false, edge: true });
  }

  // two round windows (one each side) with a chrome ring
  const disc = (cx: number, rad: number, z: number): V3[] => {
    const pts: V3[] = [];
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      pts.push([cx + rad * Math.cos(a), rad * Math.sin(a), z]);
    }
    return pts;
  };
  for (const side of [1, -1]) {
    faces.push({ pts: disc(0.075, 0.042, side * (R + 0.002)), color: CHROME, solid: true });
    faces.push({ pts: disc(0.075, 0.03, side * (R + 0.0035)), color: GLASS, solid: true });
  }
  return faces;
}
const MESH = buildMesh();

type Basis = [V3, V3, V3];

// Turn "forward + roll" into three axes (forward, up, right) that the mesh is rotated by.
function makeBasis(f: V3, roll: number): Basis {
  let up0: V3 = [0, -1, 0];
  if (Math.abs(dot(f, up0)) > 0.97) up0 = [0, 0, 1];
  const r0 = norm(cross(f, up0));
  const u0 = cross(r0, f);
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const u: V3 = [u0[0] * c + r0[0] * s, u0[1] * c + r0[1] * s, u0[2] * c + r0[2] * s];
  const r: V3 = [-u0[0] * s + r0[0] * c, -u0[1] * s + r0[1] * c, -u0[2] * s + r0[2] * c];
  return [f, u, r];
}
function toWorld(p: V3, b: Basis): V3 {
  return [
    b[0][0] * p[0] + b[1][0] * p[1] + b[2][0] * p[2],
    b[0][1] * p[0] + b[1][1] * p[1] + b[2][1] * p[2],
    b[0][2] * p[0] + b[1][2] * p[1] + b[2][2] * p[2],
  ];
}

export default function RocketCanvas({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  // The canvas is placed in the whole top area (heading + globe), so the rocket is never cut off.
  const markerRef = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(markerRef.current?.closest<HTMLElement>(".glimpses__hero") ?? null);
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let W = 0;
    let H = 0;
    let padTop = 0; // space taken by the site header at the top of the area
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      padTop = parseFloat(getComputedStyle(canvas.parentElement ?? canvas).paddingTop) || 0;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    ro?.observe(canvas);

    // state
    const pos = { x: W * 0.2, y: H * 0.7 };
    const vel = { x: 0, y: 0 };
    let fwd: V3 = norm([0.28, -1, 0.35]);
    let roll = 0;
    let spawnAcc = 0;
    let moving = 0;
    const particles: Particle[] = [];
    const pointer = { cx: 0, cy: 0, t: -1e9 };
    let visible = true;

    const onMove = (e: PointerEvent) => {
      pointer.cx = e.clientX;
      pointer.cy = e.clientY;
      pointer.t = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
          });
    io?.observe(canvas);

    const sizeOf = () => Math.max(110, Math.min(230, Math.min(W, H) * 0.28));

    const nozzleScreen = (b: Basis, S: number): { x: number; y: number; z: number } => {
      const w = toWorld([-0.36, 0, 0], b);
      const m = CAM / (CAM - w[2]);
      return { x: pos.x + w[0] * S * m, y: pos.y + w[1] * S * m, z: w[2] };
    };

    const step = (dt: number, now: number, time: number) => {
      const rect = canvas.getBoundingClientRect();
      const following = now - pointer.t < 3000;
      let tx: number;
      let ty: number;
      if (following) {
        tx = pointer.cx - rect.left;
        ty = pointer.cy - rect.top;
      } else {
        tx = W / 2 + Math.sin(time * 0.2) * W * 0.4;
        ty = H * 0.5 + Math.sin(time * 0.3 + 1.2) * H * 0.3;
      }
      // keep the whole rocket on screen: never closer to an edge than its own size
      const size0 = sizeOf();
      const mx = size0 * 0.5;
      tx = Math.min(Math.max(tx, mx), Math.max(mx, W - mx));
      ty = Math.min(Math.max(ty, padTop + size0 * 0.35), Math.max(padTop + size0 * 0.35, H - size0 * 0.45));

      // spring towards the target
      const k = 4.5;
      const c = 4.2;
      vel.x += ((tx - pos.x) * k - vel.x * c) * dt;
      vel.y += ((ty - pos.y) * k - vel.y * c) * dt;
      const sp = Math.hypot(vel.x, vel.y);
      const maxSp = 650;
      if (sp > maxSp) {
        vel.x = (vel.x / sp) * maxSp;
        vel.y = (vel.y / sp) * maxSp;
      }
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;

      // point along the direction of travel; hover nose-up when nearly still
      const speed = Math.hypot(vel.x, vel.y);
      moving = Math.min(1, speed / 170);
      const dirV = norm([vel.x / (speed || 1), vel.y / (speed || 1), 0.38 + 0.2 * Math.sin(time * 0.9)]);
      const idle: V3 = norm([0.28, -1, 0.35]);
      const desired = norm(lerpV(idle, dirV, moving));
      fwd = norm(lerpV(fwd, desired, 1 - Math.exp(-dt * 5)));
      roll += dt * (0.5 + moving * 1.1);

      // exhaust particles
      const S = sizeOf();
      const b = makeBasis(fwd, roll);
      const n = nozzleScreen(b, S);
      spawnAcc += dt * (40 + 100 * moving);
      while (spawnAcc >= 1 && particles.length < 90) {
        spawnAcc -= 1;
        const backLen = Math.hypot(fwd[0], fwd[1]) || 1;
        const back = 60 + 120 * moving;
        particles.push({
          x: n.x + (Math.random() - 0.5) * 6,
          y: n.y + (Math.random() - 0.5) * 6,
          vx: (-fwd[0] / backLen) * back + (Math.random() - 0.5) * 50 + vel.x * 0.15,
          vy: (-fwd[1] / backLen) * back + (Math.random() - 0.5) * 50 + vel.y * 0.15,
          life: 0.7,
          max: 0.7,
        });
      }
      spawnAcc = Math.min(spawnAcc, 3);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    };

    const glow = (x: number, y: number, r: number, rgb: RGB, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
      g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (time: number) => {
      ctx.clearRect(0, 0, W, H);
      const S = sizeOf();
      const b = makeBasis(fwd, roll);

      // trail particles
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        const a = p.life / p.max;
        glow(p.x, p.y, (6 + 14 * (1 - a)) * (S / 300), [255, 170 + 70 * (1 - a), 110 + 140 * (1 - a)], 0.35 * a);
      }

      // flame (behind the rocket body unless the engine points at the viewer)
      const flameLen = (0.5 + 0.15 * Math.sin(time * 37) + 0.05 * Math.sin(time * 71)) * (0.6 + 0.8 * moving);
      const drawFlame = () => {
        ctx.globalCompositeOperation = "lighter";
        const back: V3 = [-fwd[0], -fwd[1], -fwd[2]];
        const nozzle = toWorld([-0.36, 0, 0], b);
        for (let i = 0; i < 6; i++) {
          const t = i / 5;
          const wx = nozzle[0] + back[0] * (0.04 + t * flameLen);
          const wy = nozzle[1] + back[1] * (0.04 + t * flameLen);
          const wz = nozzle[2] + back[2] * (0.04 + t * flameLen);
          const m = CAM / (CAM - wz);
          const rad = BODY_R * 0.95 * (1 - t * 0.85) * S * m;
          glow(pos.x + wx * S * m, pos.y + wy * S * m, rad, [255 - 150 * t, 215 - 40 * t, 170 + 85 * t], 0.55 * (1 - t) + 0.12);
        }
        const nm = CAM / (CAM - nozzle[2]);
        glow(pos.x + nozzle[0] * S * nm, pos.y + nozzle[1] * S * nm, BODY_R * 2.4 * S * nm, [140, 190, 255], 0.28);
        ctx.globalCompositeOperation = "source-over";
      };
      ctx.globalCompositeOperation = "source-over";
      const flameBehind = -fwd[2] < 0;
      if (flameBehind) drawFlame();

      // project and light the mesh, far faces first
      interface Drawn {
        z: number;
        path: [number, number][];
        fill: string;
        stroke: string;
        width: number;
      }
      const drawn: Drawn[] = [];
      for (const face of MESH) {
        const w = face.pts.map((p) => toWorld(p, b));
        let n = norm(cross(sub(w[1], w[0]), sub(w[w.length - 1], w[0])));
        if (face.solid) {
          let cy = 0;
          let cz = 0;
          for (const p of face.pts) {
            cy += p[1];
            cz += p[2];
          }
          const radial = toWorld([0, cy / face.pts.length, cz / face.pts.length], b);
          if (dot(n, radial) < 0) n = [-n[0], -n[1], -n[2]];
          if (n[2] <= 0.02) continue; // facing away from the viewer
        } else if (n[2] < 0) {
          n = [-n[0], -n[1], -n[2]];
        }
        if (face.emissive) {
          let zE = 0;
          const pathE: [number, number][] = w.map((p) => {
            zE += p[2];
            const m = CAM / (CAM - p[2]);
            return [pos.x + p[0] * S * m, pos.y + p[1] * S * m];
          });
          const c = face.color;
          drawn.push({ z: zE / w.length, path: pathE, fill: `rgb(${c[0]},${c[1]},${c[2]})`, stroke: `rgb(${c[0]},${c[1]},${c[2]})`, width: 0.8 });
          continue;
        }
        const lam = Math.max(0, dot(n, LIGHT));
        const rz = -LIGHT[2] + 2 * dot(n, LIGHT) * n[2];
        const spec = Math.pow(Math.max(0, rz), 22) * 0.45;
        const rim = Math.pow(1 - Math.max(0, n[2]), 2) * 0.18;
        const shade = 0.3 + 0.8 * lam;
        const col = face.color.map((c, i) => {
          const rimC = i === 0 ? 70 : i === 1 ? 140 : 230;
          return Math.min(255, Math.round(c * shade + spec * 255 + rim * rimC));
        });
        let zSum = 0;
        const path: [number, number][] = w.map((p) => {
          zSum += p[2];
          const m = CAM / (CAM - p[2]);
          return [pos.x + p[0] * S * m, pos.y + p[1] * S * m];
        });
        const fill = `rgb(${col[0]},${col[1]},${col[2]})`;
        drawn.push({
          z: zSum / w.length,
          path,
          fill,
          stroke: face.edge ? `rgb(${Math.round(col[0] * 0.55)},${Math.round(col[1] * 0.6)},${Math.round(col[2] * 0.7)})` : fill,
          width: face.edge ? 1.2 : 0.8,
        });
      }
      drawn.sort((a, b2) => a.z - b2.z);
      ctx.lineJoin = "round";
      for (const d of drawn) {
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(d.path[0][0], d.path[0][1]);
        for (let i = 1; i < d.path.length; i++) ctx.lineTo(d.path[i][0], d.path[i][1]);
        ctx.closePath();
        ctx.fillStyle = d.fill;
        ctx.strokeStyle = d.stroke; // body faces use their own colour, which hides hairline gaps
        ctx.fill();
        ctx.stroke();
      }

      if (!flameBehind) drawFlame();
      ctx.globalCompositeOperation = "source-over";
    };

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || W === 0 || H === 0) return;
      const time = now / 1000;
      if (!pausedRef.current) step(dt, now, time);
      render(time);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro?.disconnect();
      io?.disconnect();
    };
  }, [host]);

  return (
    <>
      <span ref={markerRef} hidden />
      {host && createPortal(<canvas ref={canvasRef} className="globe__rocket-canvas" aria-hidden="true" />, host)}
    </>
  );
}
