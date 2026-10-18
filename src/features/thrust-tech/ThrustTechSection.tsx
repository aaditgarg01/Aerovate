import { useEffect, useRef } from "react";
import "./thrust-tech.css";
import { replayHeroOnEntry } from "./replayHeroOnEntry";

type Props = {
  /** Anchor id used by the navbar link (#thrust-tech). Remove it here if a parent already sets it. */
  id?: string;
};

export function ThrustTechSection({ id = "thrust-tech" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const hero = root.querySelector<HTMLElement>("#tt-hero")!;
    const showStaticContent = () => {
      root.classList.remove("tt-js");
      hero.classList.add("tt-go");
      root.querySelectorAll(".tt-node").forEach(node => node.classList.add("tt-lit"));
    };
    // Keep the section readable in browsers and test environments without graphics APIs.
    const trail = root.querySelector<SVGPathElement>("#tt-tpath");
    if (typeof IntersectionObserver === "undefined" || typeof trail?.getTotalLength !== "function") {
      showStaticContent();
      return;
    }
    const c = root.querySelector<HTMLCanvasElement>("#tt-stars")!;
    const x = c.getContext("2d");
    if (!x) {
      showStaticContent();
      return;
    }
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    cleanups.push(replayHeroOnEntry(hero, root.querySelector<HTMLElement>("#tt-emblem")!, id, rm));

    /* stars: sparse, slow twinkle and drift, paused when off-screen */
    type Star = { x: number; y: number; r: number; a: number; p: number; s: number };
    let S: Star[] = [];
    let W = 0;
    let H = 0;
    let vis = true;
    let raf = 0;
    const size = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth;
      H = c.clientHeight;
      c.width = W * d;
      c.height = H * d;
      x.setTransform(d, 0, 0, d, 0, 0);
      S = [];
      const n = Math.min(220, Math.round((W * H) / 10000));
      for (let i = 0; i < n; i++) {
        S.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.1 + 0.25,
          a: Math.random() * 0.55 + 0.2,
          p: Math.random() * 6.28,
          s: Math.random() * 0.7 + 0.2,
        });
      }
    };
    const draw = (t: number) => {
      x.clearRect(0, 0, W, H);
      const d = rm ? 0 : t / 1000;
      x.fillStyle = "#cfe3ff";
      for (const s of S) {
        x.globalAlpha = s.a * (rm ? 1 : 0.65 + 0.35 * Math.sin(d * s.s + s.p));
        x.beginPath();
        x.arc((s.x + d * s.s * 1.2) % W, s.y, s.r, 0, 6.283);
        x.fill();
      }
    };
    const loop = (t: number) => {
      draw(t);
      if (vis && !rm) raf = requestAnimationFrame(loop);
    };
    size();
    draw(0);
    if (!rm) raf = requestAnimationFrame(loop);
    let rz = 0;
    const onResize = () => {
      window.clearTimeout(rz);
      rz = window.setTimeout(() => {
        size();
        draw(0);
      }, 150);
    };
    window.addEventListener("resize", onResize);
    const visObs = new IntersectionObserver((e) => {
      vis = e[0].isIntersecting;
      if (vis && !rm) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    });
    visObs.observe(hero);
    cleanups.push(() => {
      cancelAnimationFrame(raf);
      window.clearTimeout(rz);
      window.removeEventListener("resize", onResize);
      visObs.disconnect();
    });

    /* launch point travelling slowly up the trail */
    const tp0 = root.querySelector<SVGPathElement>("#tt-tpath")!;
    const td = root.querySelector<HTMLElement>("#tt-tdot")!;
    if (!rm) {
      const L0 = tp0.getTotalLength();
      let st: number | null = null;
      let tr = 0;
      let alive = true;
      const f = (t: number) => {
        if (!alive) return;
        if (st === null) st = t;
        if (vis) {
          const k = ((t - st) % 9000) / 9000;
          const p = tp0.getPointAtLength(k * L0);
          td.style.left = p.x + "%";
          td.style.top = p.y + "%";
          td.style.opacity = String(k < 0.08 ? k / 0.08 : k > 0.85 ? (1 - k) / 0.15 : 1);
        }
        tr = requestAnimationFrame(f);
      };
      const to = window.setTimeout(() => {
        tr = requestAnimationFrame(f);
      }, 3800);
      cleanups.push(() => {
        alive = false;
        window.clearTimeout(to);
        cancelAnimationFrame(tr);
      });
    }

    /* cursor light: follows the pointer anywhere over the hero, eases smoothly, fades with distance (desktop only) */
    const em = root.querySelector<HTMLElement>("#tt-emblem")!;
    const lt = em.querySelector<HTMLElement>(".tt-light")!;
    if (!rm && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
      let tx = 0;
      let ty = 0;
      let cx = 0;
      let cy = 0;
      let tgt = 0;
      let cur = 0;
      let run = false;
      let fr = 0;
      const frame = () => {
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        cur += (tgt - cur) * 0.1;
        const r = lt.getBoundingClientRect();
        const mx = Math.max(-15, Math.min(115, ((cx - r.left) / r.width) * 100));
        const my = Math.max(-15, Math.min(115, ((cy - r.top) / r.height) * 100));
        em.style.setProperty("--mx", mx.toFixed(1) + "%");
        em.style.setProperty("--my", my.toFixed(1) + "%");
        lt.style.opacity = cur.toFixed(3);
        if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3 || Math.abs(tgt - cur) > 0.005) {
          fr = requestAnimationFrame(frame);
        } else {
          run = false;
        }
      };
      const kick = () => {
        if (!run) {
          run = true;
          fr = requestAnimationFrame(frame);
        }
      };
      const onMove = (e: PointerEvent) => {
        const r = em.getBoundingClientRect();
        const ex = r.left + r.width / 2;
        const ey = r.top + r.height / 2;
        const d = Math.hypot(e.clientX - ex, e.clientY - ey) / (r.width * 0.9);
        tx = e.clientX;
        ty = e.clientY;
        tgt = Math.max(0, Math.min(1, 1.15 - d));
        if (cur < 0.01) {
          cx = tx;
          cy = ty;
        }
        kick();
      };
      const onLeave = () => {
        tgt = 0;
        kick();
      };
      hero.addEventListener("pointermove", onMove, { passive: true });
      hero.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        cancelAnimationFrame(fr);
        hero.removeEventListener("pointermove", onMove);
        hero.removeEventListener("pointerleave", onLeave);
      });
    }

    /* trajectory: line draws with the real page scroll, nodes light as it passes */
    const wrap = root.querySelector<HTMLElement>("#tt-traj")!;
    const path = root.querySelector<SVGPathElement>("#tt-tp")!;
    const head = root.querySelector<HTMLElement>("#tt-head")!;
    const nodes = Array.from(wrap.querySelectorAll<HTMLElement>(".tt-node"));
    const L = path.getTotalLength();
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i <= 300; i++) {
      const q = path.getPointAtLength((L * i) / 300);
      pts.push([q.x, q.y, i / 300]);
    }
    const at = (xv: number) => {
      let b = pts[0];
      for (const p of pts) if (Math.abs(p[0] - xv) < Math.abs(b[0] - xv)) b = p;
      return b;
    };
    const fracs = nodes.map((n) => at(Number(n.dataset.x) * 10)[2]);
    const mobile = window.matchMedia("(max-width:860px)");
    const layout = () => {
      nodes.forEach((n) => {
        if (mobile.matches) {
          n.style.left = "";
          n.style.top = "";
        } else {
          const q = at(Number(n.dataset.x) * 10);
          n.style.left = q[0] / 10 + "%";
          n.style.top = 30 + (q[1] / 220) * 230 + "px";
        }
      });
    };
    let curP = 0;
    let trajRaf = 0;
    let trajVis = false;
    const render = (pr: number) => {
      path.style.strokeDashoffset = String(1 - pr);
      const q = path.getPointAtLength(L * pr);
      head.style.left = q.x / 10 + "%";
      head.style.top = 30 + (q.y / 220) * 230 + "px";
      head.style.opacity = !rm && pr > 0.002 && pr < 0.998 ? "1" : "0";
      nodes.forEach((n, i) => n.classList.toggle("tt-lit", pr >= fracs[i] - 0.01));
    };
    // progress follows the scroll position in both directions (scroll down = draws, scroll up = undraws)
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      return Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.55)));
    };
    const tick = () => {
      const target = rm ? 1 : measure();
      curP += (target - curP) * (rm ? 1 : 0.14); // light easing so it feels smooth
      if (Math.abs(target - curP) < 0.001) curP = target;
      render(curP);
      // keep running while the section is near the screen or still easing; otherwise sleep
      trajRaf = trajVis || curP !== target ? requestAnimationFrame(tick) : 0;
    };
    const startLoop = () => {
      if (!trajRaf) trajRaf = requestAnimationFrame(tick);
    };
    // reads the position every frame, so it works with any scroll container or smooth-scroll library
    const tio = new IntersectionObserver(
      (e) => {
        trajVis = e[0].isIntersecting;
        if (trajVis) startLoop();
      },
      { rootMargin: "200px 0px" }
    );
    tio.observe(wrap);
    const onResizeTraj = () => {
      layout();
      startLoop();
    };
    layout();
    render(rm ? 1 : 0);
    window.addEventListener("resize", onResizeTraj);
    cleanups.push(() => {
      cancelAnimationFrame(trajRaf);
      tio.disconnect();
      window.removeEventListener("resize", onResizeTraj);
    });

    return () => cleanups.forEach((fn) => fn());
  }, [id]);

  return (
    <div className="tt tt-js" id={id} ref={rootRef} tabIndex={-1} role="region" aria-labelledby={`${id}-title`}>
      <section className="tt-hero" id="tt-hero">
        <div className="tt-haze"></div>
        <canvas id="tt-stars" aria-hidden="true"></canvas>
        <div className="tt-earth"><div className="tt-earth-in"><div className="tt-earth-photo"></div><div className="tt-arc"></div></div></div>
        <div className="tt-fadeout"></div>
        <div className="tt-trail" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs><linearGradient id="tt-tg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#83b5ff" stopOpacity="0"/><stop offset=".55" stopColor="#83b5ff" stopOpacity=".7"/><stop offset="1" stopColor="#cfe3ff" stopOpacity=".1"/></linearGradient></defs>
            <path id="tt-tpath" d="M18 100 C 26 78, 44 70, 54 54 S 66 36, 70 30" pathLength="1"/>
          </svg>
          <b id="tt-tdot"></b>
        </div>

        <div className="tt-grid">
          <p className="tt-eyebrow tt-rise tt-r0">BEHIND THE EXPERIENCE</p>
          <h2 id={`${id}-title`} className="tt-heading" aria-label="Meet Thrust Tech.">
            <span className="tt-ln tt-l1"><span>Meet</span></span>
            <span className="tt-ln tt-l2"><span>Thrust Tech.</span></span>
          </h2>

          <div className="tt-emblem" id="tt-emblem" aria-hidden="true">
            <div className="tt-glow"></div>
            <div className="tt-light"></div>
            <div className="tt-flash"></div>
            <svg className="tt-ring" viewBox="0 0 100 100">
              <circle className="tt-t" cx="50" cy="50" r="45" pathLength="360"/>
              <circle className="tt-r" cx="50" cy="50" r="49" pathLength="1"/>
            </svg>
            <div className="tt-spin"><i></i></div>
            <svg className="tt-mark" viewBox="84 70 278 306">
              <defs><linearGradient id="tt-w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#b9d3fb"/></linearGradient></defs>
              <path className="tt-half tt-hr" fill="url(#tt-w)" d="M322.8 143.5 L320.2 145.2 L195.8 262.5 L195.8 263.8 L338.5 363.5 L348.5 363.2 L349.0 362.0 L251.8 259.0 L254.8 253.8 L332.5 144.0 L331.8 143.0Z"/>
              <path className="tt-half tt-hl" fill="url(#tt-w)" d="M98.2 83.0 L97.0 84.5 L194.2 187.5 L192.0 191.8 L115.8 299.0 L113.8 303.5 L116.0 303.8 L123.8 302.8 L247.8 186.5 L250.2 183.0 L107.2 83.0Z"/>
            </svg>
          </div>

          <p className="tt-statement tt-rise tt-r1">Engineering curiosity.<br />Exploring beyond.</p>
          <figure className="tt-photo tt-rise tt-r3" role="img" aria-label="Members of Thrust Tech and VIT-STELLAR standing together"></figure>
          <div className="tt-support">
            <p className="tt-rise tt-r2">Thrust Tech is an aerospace and rocketry organisation that explores the science and engineering behind flight, propulsion, and space technology.</p>
            <p className="tt-rise tt-r2">Through its collaboration with VIT-STELLAR, it brings an aerospace perspective to Aerovate, connecting students&apos; curiosity about space with real engineering.</p>
            <a className="tt-cta tt-rise tt-r3" href="https://thrusttechindia.com">EXPLORE THRUST TECH
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 15L15 5M7 5h8v8"/></svg>
            </a>
          </div>
        </div>
        <div className="tt-strip tt-rise tt-r3"><span>AEROVATE / 01</span><span>THRUST TECH × VIT-STELLAR</span></div>
        <div className="tt-hero-end"></div>
      </section>

      <section className="tt-story">
        <div className="tt-story-in">
          <h2>THE COLLABORATION</h2>
          <div className="tt-traj" id="tt-traj">
            <svg className="tt-tsvg" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">
              <path className="tt-ghost" d="M0 205 C 260 205, 430 170, 1000 24"/>
              <path className="tt-live" id="tt-tp" pathLength="1" d="M0 205 C 260 205, 430 170, 1000 24"/>
            </svg>
            <i className="tt-head" id="tt-head"></i>
            <div className="tt-node" data-x="5"><i className="tt-dot"></i><div className="tt-txt"><small>STAGE 01</small><h3>Thrust Tech</h3><p>Aerospace and rocketry organisation</p></div></div>
            <div className="tt-node" data-x="42"><i className="tt-dot"></i><div className="tt-txt"><small>STAGE 02</small><h3>VIT-STELLAR</h3><p>Collaboration partner</p></div></div>
            <div className="tt-node" data-x="79"><i className="tt-dot"></i><div className="tt-txt"><small>STAGE 03</small><h3>Aerovate</h3><p>The platform for this collaboration</p></div></div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ThrustTechSection;
