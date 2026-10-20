import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { Glimpse } from "./data";
import RocketCanvas from "./RocketCanvas";
import { visibleAnimation } from "../space/visibleAnimation";

const TILT = -10; // degrees: look at the globe from slightly above
const SPIN = 14; // degrees per second
const MIN_CARDS = 40; // repeat photos to fill the globe when there are few
const MAX_CARDS = 56;
const MERIDIANS = [0, 30, 60, 90, 120, 150]; // great circles through the poles
const PARALLELS = [-60, -30, 0, 30, 60]; // rings of latitude
const RING = 1.45; // orbit ring radius, relative to the globe
const DOTS = [0, 180]; // where the glowing dots sit on the ring (degrees)
const POP = 2.7; // size of the enlarged photo relative to its resting size

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

export default function Globe({ photos, paused, onToggle, onOpen, onError, empty = false }: GlobeProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLUListElement>(null);
  const ry = useRef(0);
  const speed = useRef(SPIN);
  const stop = useRef(false);
  const animation = useRef<ReturnType<typeof visibleAnimation> | null>(null);

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

  // Size the globe from the space available.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const { width } = el.getBoundingClientRect();
      // How much height is left on one screen under the heading, then a little more (the globe may
      // run slightly past the fold). The globe's real outline is about 1.15 x its radius, so the
      // stage is made 2.35 x R tall plus some air, and it can never touch the heading.
      const hero = el.closest<HTMLElement>(".glimpses__hero");
      const head = hero?.querySelector<HTMLElement>(".glimpses__head");
      const padTop = hero ? parseFloat(getComputedStyle(hero).paddingTop) || 0 : 0;
      const headH = head ? head.getBoundingClientRect().height : 0;
      const fit = (window.innerHeight - padTop - headH - 24) / 2.35;
      setR(Math.round(Math.max(120, Math.min(width * 0.42, fit * 1.18, 560))));
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

  // Spin. Speed eases back up after a pause; stops instantly when a photo is enlarged.
  useEffect(() => {
    const apply = () => {
      const ball = ballRef.current;
      if (!ball) return;
      ball.style.transform = `rotateX(${TILT}deg) rotateY(${ry.current}deg)`;
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
    const stage = stageRef.current;
    if (!stage) return;
    const controller = visibleAnimation(stage, (_now, dt) => {
      speed.current += (SPIN - speed.current) * Math.min(1, dt * 4);
      ry.current = (ry.current + speed.current * dt) % 360;
      apply();
    }, { canRun: () => !stop.current });
    animation.current = controller;
    return () => { controller.dispose(); animation.current = null; };
  }, [reduce]);

  useEffect(() => { animation.current?.wake(); }, [paused, active]);

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
        style={
          {
            "--R": `${R}px`,
            "--card-h": `${cardH}px`,
            "--persp": `${R * 3.4}px`,
            flex: "none",
            height: `${Math.round(R * 2.35 + 24)}px`,
          } as CSSProperties
        }
        onClick={onStageClick}
      >
        {/* the 3D rocket that follows the cursor, drawn behind everything else */}
        <RocketCanvas paused={paused} />

        {/* soft glowing body so it reads as a sphere */}
        <div className="globe__orb" aria-hidden="true" />

        <div className="globe__world">
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
