import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { Glimpse } from "./data";

const TILT = -10; // degrees: look at the globe from slightly above
const SPIN = 14; // degrees per second
const MIN_CARDS = 40; // repeat photos to fill the globe when there are few
const MAX_CARDS = 56;
const MERIDIANS = [0, 30, 60, 90, 120, 150]; // great circles through the poles
const PARALLELS = [-60, -30, 0, 30, 60]; // rings of latitude
const RING = 1.45; // orbit ring radius, relative to the globe
const DOTS = [0, 180]; // where the glowing dots sit on the ring (degrees)
const POP = 2.7; // size of the enlarged photo relative to its resting size
const ROCKET_SPEED = 0.3; // radians per second (one lap takes about 21 seconds)

interface Card {
  key: string;
  p: Glimpse;
  live: boolean;
  az: number;
  el: number;
}

interface GlobeProps {
  photos: Glimpse[];
  paused: boolean;
  onToggle: () => void;
  onOpen: (id: string, el: HTMLElement) => void;
  onError: (id: string) => void;
  /** No photos yet: show empty glass frames (never stand-in pictures) and a short note. */
  empty?: boolean;
}

// Empty glass frames shown while there are no approved photos (just shapes, no pictures).
const EMPTY_FRAMES: Glimpse[] = [3 / 2, 2 / 3, 3 / 2, 4 / 3, 3 / 2, 2 / 3, 4 / 3, 3 / 2].map((r, i) => ({
  id: `empty-${i}`,
  src: "",
  alt: "",
  caption: "",
  year: 0,
  width: Math.round(r * 1000),
  height: 1000,
}));

// Spread cards evenly over a sphere (Fibonacci spiral).
function layout(photos: Glimpse[]): Card[] {
  const n = Math.min(MAX_CARDS, Math.max(MIN_CARDS, photos.length));
  return Array.from({ length: n }, (_, i) => {
    const up = 0.94 * (1 - (2 * (i + 0.5)) / n); // keep clear of the very poles
    return {
      key: String(i),
      p: photos[i % photos.length],
      live: i < photos.length, // only the first copy of each photo is focusable/announced
      az: (i * 137.508) % 360,
      el: (Math.asin(up) * 180) / Math.PI,
    };
  });
}

// Turn a card to face the viewer, move it forward and enlarge it, keeping its centre where it was.
function popTransform(card: Card, ry: number, R: number): string {
  const rad = Math.PI / 180;
  const az = (card.az + ry) * rad;
  const el = card.el * rad;
  const t = TILT * rad;
  const x = R * Math.cos(el) * Math.sin(az);
  const y0 = -R * Math.sin(el);
  const z0 = R * Math.cos(el) * Math.cos(az);
  const y = y0 * Math.cos(t) - z0 * Math.sin(t);
  const z = y0 * Math.sin(t) + z0 * Math.cos(t);
  const persp = R * 3.4;
  const lift = R * 0.9;
  const m0 = persp / (persp - z);
  const m = persp / (persp - z - lift);
  const k = 1 - m0 / m;
  const s = POP / m;
  return (
    `rotateX(${-card.el}deg) rotateY(${-(card.az + ry)}deg) rotateX(${-TILT}deg) ` +
    `translate3d(${-x * k}px, ${-y * k}px, ${lift}px) scale(${s})`
  );
}

// The rocket cruises across the background in a wide figure-eight, always behind the globe.
// It passes behind the globe, swings nearer (bigger) and further (smaller), and points along its path.
function rocketTransform(t: number, R: number): string {
  const x = 2.2 * R * Math.sin(t);
  const y = 0.55 * R * Math.sin(2 * t) - 0.1 * R;
  const z = -1.8 * R + 0.5 * R * Math.cos(t);
  const vx = 2.2 * Math.cos(t);
  const vy = 1.1 * Math.cos(2 * t);
  const vz = -0.5 * Math.sin(t);
  const yaw = (Math.atan2(-vz, vx) * 180) / Math.PI;
  const pitch = (Math.atan2(vy, Math.hypot(vx, vz)) * 180) / Math.PI;
  return `translate3d(${x}px, ${y}px, ${z}px) rotateY(${yaw}deg) rotateZ(${pitch}deg)`;
}

// One flat picture of the rocket, pointing right. Two of them cross at right angles
// so the rocket still looks solid when it turns.
function RocketPlane({ cross = false }: { cross?: boolean }) {
  const uid = useId().replace(/:/g, "");
  return (
    <span className={`globe__rocket-plane${cross ? " is-cross" : ""}`}>
      <svg viewBox="0 0 220 66" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${uid}t`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#bfe3ff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#4a90d9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#aebccb" />
          </linearGradient>
        </defs>
        <g className="rocket__trail">
          <path d="M92 33 C70 20 30 24 0 30 C30 33 30 33 0 36 C30 42 70 46 92 33Z" fill={`url(#${uid}t)`} />
          <path d="M94 33 C84 25 68 27 54 33 C68 39 84 41 94 33Z" fill="#ffd27a" />
          <path d="M94 33 C88 29 78 30 70 33 C78 36 88 37 94 33Z" fill="#fff6dc" />
        </g>
        <path d="M100 20 L82 2 L120 20Z" fill="#5fa0d6" />
        <path d="M100 46 L82 64 L120 46Z" fill="#5fa0d6" />
        <path d="M96 21 H160 Q208 21 218 33 Q208 45 160 45 H96 Q88 33 96 21Z" fill={`url(#${uid}b)`} />
        <path d="M172 21.5 Q208 21.5 218 33 Q208 44.5 172 44.5Z" fill="#4f93cf" />
        <rect x="118" y="21" width="9" height="24" fill="#4f93cf" />
        <path d="M100 25 H165 Q195 25 208 30 Q190 27.5 165 27.5 H100Z" fill="#ffffff" opacity="0.75" />
        <circle cx="146" cy="33" r="8" fill="#14202e" stroke="#4f93cf" strokeWidth="2.5" />
      </svg>
    </span>
  );
}

export default function Globe({ photos, paused, onToggle, onOpen, onError, empty = false }: GlobeProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLUListElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const ry = useRef(0);
  const rt = useRef(0.6); // where the rocket is on its loop
  const speed = useRef(SPIN);
  const stop = useRef(false);
  const pausedRef = useRef(false);
  const visible = useRef(true);

  const [R, setR] = useState(240);
  const [active, setActive] = useState<string | null>(null);
  const [hi, setHi] = useState<Set<string>>(() => new Set()); // photos whose full-size version has been requested

  const reduce = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    []
  );
  const canHover = useMemo(
    () => window.matchMedia?.("(hover: hover)").matches ?? true,
    []
  );
  const cards = useMemo(() => layout(empty ? EMPTY_FRAMES : photos), [photos, empty]);
  // card size follows the count so roughly half the surface is covered at any number of photos
  const cardH = R * Math.min(0.42, Math.sqrt((0.5 * 12.57) / (cards.length * 1.35)));
  const activeCard = cards.find((c) => c.key === active);

  const cardsRef = useRef(cards);
  const Rref = useRef(R);
  cardsRef.current = cards;
  Rref.current = R;

  stop.current = paused || active !== null;
  pausedRef.current = paused;

  // Size the globe from the space available.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setR(Math.round(Math.max(120, Math.min(width * 0.42, height * 0.46, 400))));
      // Page width without the scrollbar: lets the section be full width without sideways scrolling.
      el.closest<HTMLElement>(".glimpses")?.style.setProperty(
        "--glimpses-vw",
        `${document.documentElement.clientWidth}px`
      );
    };
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Only animate while on screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Spin. Speed eases back up after a pause; stops instantly when a photo is enlarged.
  useEffect(() => {
    const apply = () => {
      const ball = ballRef.current;
      if (!ball) return;
      ball.style.transform = `rotateX(${TILT}deg) rotateY(${ry.current}deg)`;
      if (rocketRef.current) {
        rocketRef.current.style.transform = rocketTransform(rt.current, Rref.current);
      }
      // Depth shading: photos turning away from the viewer get darker (--f: 1 = facing us).
      const rad = Math.PI / 180;
      const t = TILT * rad;
      ball.querySelectorAll<HTMLElement>(".globe__ring-dot").forEach((d) => {
        const a = Number(d.dataset.az);
        d.style.transform =
          `rotateY(${a}deg) translateZ(${Rref.current * RING}px) ` +
          `rotateY(${-(a + ry.current)}deg) rotateX(${-TILT}deg)`;
      });
      ball.querySelectorAll<HTMLElement>(".globe__card").forEach((el, i) => {
        const c = cardsRef.current[i];
        if (!c) return;
        const az = (c.az + ry.current) * rad;
        const e = c.el * rad;
        const z = -Math.sin(e) * Math.sin(t) + Math.cos(e) * Math.cos(az) * Math.cos(t);
        el.style.setProperty("--f", Math.max(0, z).toFixed(3));
      });
    };
    apply();
    if (reduce) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible.current) {
        const target = stop.current ? 0 : SPIN;
        speed.current += (target - speed.current) * Math.min(1, dt * 4);
        ry.current = (ry.current + speed.current * dt) % 360;
        if (!pausedRef.current) rt.current += dt * ROCKET_SPEED; // the rocket keeps flying while you hover a photo
        apply();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  // Opening the viewer (or pausing) puts any enlarged photo back.
  useEffect(() => {
    if (paused) setActive(null);
  }, [paused]);

  const pop = (key: string, id: string) => {
    stop.current = true;
    speed.current = 0;
    setActive(key);
    setHi((s) => (s.has(id) ? s : new Set(s).add(id)));
  };
  const unpop = (key: string) => setActive((a) => (a === key ? null : a));

  const handleClick = (e: MouseEvent<HTMLButtonElement>, card: Card) => {
    // Mouse: hover already enlarges, a click opens the viewer.
    // Touch: first tap enlarges, second tap opens the viewer.
    if (canHover || active === card.key) onOpen(card.p.id, e.currentTarget);
    else pop(card.key, card.p.id);
  };

  // Tap on empty space: put an enlarged photo back, otherwise stop/start the spin.
  const onStageClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".globe__btn")) return;
    if (active !== null) setActive(null);
    else onToggle();
  };

  return (
    <div className="globe-wrap">
      <div
        ref={stageRef}
        className="globe"
        style={{ "--R": `${R}px`, "--card-h": `${cardH}px`, "--persp": `${R * 3.4}px` } as CSSProperties}
        onClick={onStageClick}
      >
        {/* soft glowing body so it reads as a sphere */}
        <div className="globe__orb" aria-hidden="true" />

        {/* the rocket and the globe share one 3D space, so the rocket really goes behind it */}
        <div className="globe__world">
          <div
            ref={rocketRef}
            className="globe__rocket"
            aria-hidden="true"
            style={{ "--rl": `${R * 1.25}px` } as CSSProperties}
          >
            <RocketPlane />
            <RocketPlane cross />
          </div>

          <ul ref={ballRef} className="globe__ball" aria-label="Photographs from Aerovate">
            {/* wireframe: latitude and longitude lines, drawn just inside the photos */}
            <li className="globe__lines" aria-hidden="true">
              {MERIDIANS.map((a) => (
                <span
                  key={`m${a}`}
                  className="globe__line"
                  style={{
                    width: R * 1.97,
                    height: R * 1.97,
                    margin: `${-R * 0.985}px 0 0 ${-R * 0.985}px`,
                    transform: `rotateY(${a}deg)`,
                  }}
                />
              ))}
              {PARALLELS.map((lat) => {
                const rr = R * 0.985 * Math.cos((lat * Math.PI) / 180);
                const y = -R * 0.985 * Math.sin((lat * Math.PI) / 180);
                return (
                  <span
                    key={`p${lat}`}
                    className={`globe__line${lat === 0 ? " globe__line--equator" : ""}`}
                    style={{
                      width: rr * 2,
                      height: rr * 2,
                      margin: `${-rr}px 0 0 ${-rr}px`,
                      transform: `translateY(${y}px) rotateX(90deg)`,
                    }}
                  />
                );
              })}
            </li>

            {/* orbit ring with two glowing dots that travel round as the globe turns */}
            <li className="globe__ring" aria-hidden="true">
              <span
                className="globe__ring-line"
                style={{
                  width: R * RING * 2,
                  height: R * RING * 2,
                  margin: `${-R * RING}px 0 0 ${-R * RING}px`,
                  transform: "rotateX(90deg)",
                }}
              />
              {DOTS.map((a) => (
                <span key={a} className="globe__ring-dot" data-az={a} />
              ))}
            </li>

            {cards.map((card) => {
              const { p } = card;
              const isActive = active === card.key;
              return (
                <li
                  key={card.key}
                  className={`globe__card${isActive ? " is-active" : ""}`}
                  aria-hidden={card.live && !empty ? undefined : true}
                  style={{
                    "--ratio": p.width / p.height,
                    transform: `rotateY(${card.az}deg) rotateX(${card.el}deg) translateZ(${R}px)`,
                  } as CSSProperties}
                  onPointerEnter={(e) => e.pointerType !== "touch" && pop(card.key, p.id)}
                  onPointerLeave={(e) => e.pointerType !== "touch" && unpop(card.key)}
                >
                  <div
                    className="globe__face"
                    style={{ transform: isActive ? popTransform(card, ry.current, R) : undefined }}
                  >
                    {empty ? (
                      <div className="globe__btn globe__btn--empty" />
                    ) : (
                      <button
                        type="button"
                        id={card.live ? `globe-${p.id}` : undefined}
                        className="globe__btn"
                        tabIndex={card.live ? 0 : -1}
                        aria-label={card.live ? `Enlarge: ${p.caption}` : undefined}
                        aria-haspopup={card.live ? "dialog" : undefined}
                        onClick={(e) => handleClick(e, card)}
                        onFocus={(e) =>
                          e.currentTarget.matches(":focus-visible") && pop(card.key, p.id)
                        }
                        onBlur={() => unpop(card.key)}
                      >
                        <img
                          className="globe__img"
                          src={p.thumb ?? p.src}
                          alt={card.live ? p.alt : ""}
                          width={p.width}
                          height={p.height}
                          loading="lazy"
                          decoding="async"
                          draggable="false"
                          onError={() => onError(p.id)}
                        />
                        {hi.has(p.id) && p.thumb && (
                          <img
                            className="globe__hi"
                            src={p.src}
                            alt=""
                            aria-hidden="true"
                            draggable="false"
                            onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                          />
                        )}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="globe__caption" aria-live="polite">
        {empty
          ? "\u00a0"
          : activeCard
          ? `${activeCard.p.caption}${activeCard.p.event ? ` · ${activeCard.p.event}` : ""}`
          : "\u00a0"}
      </p>
    </div>
  );
}
