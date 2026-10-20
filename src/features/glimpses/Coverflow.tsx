import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent, WheelEvent } from "react";
import type { Glimpse } from "./data";
import { visibleAnimation } from "../space/visibleAnimation";

interface CoverflowProps {
  photos: Glimpse[];
  /** No photos yet: show empty glass cards. */
  empty: boolean;
  failed: Set<string>;
  paused?: boolean;
  onError: (id: string) => void;
  onOpen: (index: number, el: HTMLElement) => void;
}

interface Frame {
  key: string;
  ratio: number;
  /** index into `photos` (what the lightbox opens) */
  index: number;
  photo?: Glimpse;
  /** only the first copy is focusable / announced to screen readers */
  live: boolean;
}

const MIN_FRAMES = 20; // the reel always has at least this many frames
const GAP = 18; // px between frames
const SPEED = 60; // px per second
const PLACEHOLDER_RATIOS = [1.5, 0.667, 1.5, 1.333, 1.5, 0.667, 1.333];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Browse reel: a single row of frames that drifts sideways and loops forever.
 *
 * Why it is smooth: the only thing that changes every frame is ONE `transform` on the track.
 * No React re-renders, no filters, no reflections, no per-card 3D. Hover or drag to hold it,
 * drag / swipe / scroll sideways to move it yourself, click a frame to open it full size.
 */
export default function Coverflow({ photos, empty, failed, paused = false, onError, onOpen }: CoverflowProps) {
  const [cardH, setCardH] = useState(260);
  const [playing, setPlaying] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  // animation state lives in refs so moving never re-renders React
  const offset = useRef(0);
  const extra = useRef(0); // pending nudge from buttons / arrow keys, eased in
  const dirty = useRef(false);
  const animation = useRef<ReturnType<typeof visibleAnimation> | null>(null);
  const blocked = useRef(paused);
  blocked.current = paused;
  const hovering = useRef(false);
  const dragging = useRef(false);
  const focused = useRef(false);
  const playingRef = useRef(true);
  const dragged = useRef(false);
  playingRef.current = playing;

  const reduce = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    []
  );

  // One copy of the reel: repeat the photos until there are at least MIN_FRAMES of them.
  const set = useMemo<Frame[]>(() => {
    const base = empty
      ? PLACEHOLDER_RATIOS.map((r, i) => ({ id: `empty-${i}`, ratio: r, index: i, photo: undefined as Glimpse | undefined }))
      : photos.map((p, i) => ({ id: p.id, ratio: p.width / p.height, index: i, photo: p as Glimpse | undefined }));
    const n = base.length;
    if (n === 0) return [];
    const total = n * Math.ceil(MIN_FRAMES / n);
    return Array.from({ length: total }, (_, i) => {
      const b = base[i % n];
      return { key: `${b.id}-${i}`, ratio: b.ratio, index: b.index, photo: b.photo, live: i < n };
    });
  }, [photos, empty]);

  // width of one copy; when the track has moved this far it jumps back, which is invisible
  const setW = useMemo(() => set.reduce((w, f) => w + f.ratio * cardH + GAP, 0), [set, cardH]);
  const avgW = set.length ? setW / set.length : 200;

  // card height follows the available width
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const { width } = el.getBoundingClientRect();
      setCardH(Math.round(clamp(width * 0.22, 170, 320)));
    };
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  // the loop: one transform write per frame
  useEffect(() => {
    const track = trackRef.current;
    if (!track || setW <= 0) return;
    const paint = () => {
      offset.current = ((offset.current % setW) + setW) % setW;
      track.style.transform = `translate3d(${-offset.current.toFixed(2)}px,0,0)`;
      dirty.current = false;
    };
    paint();

    const stage = stageRef.current;
    if (!stage) return;
    let speed = 0;
    const autoplay = () => !reduce && playingRef.current && !hovering.current && !dragging.current && !focused.current;
    const controller = visibleAnimation(stage, (_now, dt) => {
      const target = autoplay() ? SPEED : 0;
      speed += (target - speed) * Math.min(1, dt * 5);
      if (!target && Math.abs(speed) < 0.1) speed = 0;
      let move = speed * dt;
      if (Math.abs(extra.current) > 0.5) {
        const s = extra.current * (reduce ? 1 : Math.min(1, dt * 7));
        extra.current -= s;
        move += s;
      } else {
        extra.current = 0;
      }
      if (move !== 0 || dirty.current) {
        offset.current += move;
        paint();
      }
      if (!autoplay() && !speed && !extra.current) return false;
    }, { canRun: () => !blocked.current && (autoplay() || Math.abs(speed) >= 0.1 || Math.abs(extra.current) > 0.5 || dirty.current) });
    animation.current = controller;
    return () => { controller.dispose(); animation.current = null; };
  }, [setW, reduce]);

  useEffect(() => { animation.current?.wake(); }, [playing, paused]);

  // drag / swipe sideways
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button > 0) return;
    let lastX = e.clientX;
    const startX = e.clientX;
    dragged.current = false;
    dragging.current = true;
    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - startX) > 6) dragged.current = true;
      offset.current -= ev.clientX - lastX;
      lastX = ev.clientX;
      dirty.current = true;
      animation.current?.wake();
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      dragging.current = false;
      animation.current?.wake();
      // a drag should not also count as a click
      window.setTimeout(() => {
        dragged.current = false;
      }, 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // let vertical scrolling pass through
    offset.current += e.deltaX;
    dirty.current = true;
    animation.current?.wake();
  };

  const nudge = (dir: 1 | -1) => {
    extra.current += dir * avgW * 1.5;
    animation.current?.wake();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nudge(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nudge(-1);
    }
  };

  const renderFrame = (f: Frame, copy: 0 | 1) => {
    const main = copy === 0 && f.live; // the one copy that is focusable
    const p = f.photo;
    return (
      <li
        key={`${copy}-${f.key}`}
        className="cf__card"
        style={{ "--ratio": f.ratio } as CSSProperties}
        aria-hidden={main && !empty ? undefined : true}
      >
        {p ? (
          <button
            type="button"
            className="cf__btn"
            tabIndex={main ? 0 : -1}
            aria-label={main ? `Enlarge: ${p.caption}` : undefined}
            onFocus={() => {
              focused.current = true;
              animation.current?.wake();
            }}
            onBlur={() => {
              focused.current = false;
              animation.current?.wake();
            }}
            onClick={(e) => {
              if (dragged.current) return;
              onOpen(f.index, e.currentTarget);
            }}
          >
            {!failed.has(p.id) ? (
              <img
                className="cf__img"
                src={p.thumb ?? p.src}
                alt={main ? p.alt : ""}
                width={p.width}
                height={p.height}
                loading="lazy"
                decoding="async"
                draggable="false"
                onError={() => onError(p.id)}
              />
            ) : (
              <span className="cf__missing" role={main ? "img" : undefined} aria-label={main ? `Photo unavailable: ${p.caption}` : undefined}>
                Photograph unavailable
              </span>
            )}
            <span className="cf__cap">
              <strong>{p.caption}</strong>
              {p.event ? <em>{p.event}</em> : null}
            </span>
          </button>
        ) : (
          <div className="cf__btn cf__btn--empty" />
        )}
      </li>
    );
  };

  return (
    <div className="cf" style={{ "--cf-h": `${cardH}px`, "--cf-gap": `${GAP}px` } as CSSProperties}>
      <div
        ref={stageRef}
        className="cf__stage"
        role={empty ? undefined : "group"}
        aria-roledescription={empty ? undefined : "carousel"}
        aria-label={empty ? undefined : "Photographs"}
        aria-hidden={empty || undefined}
        tabIndex={empty ? -1 : 0}
        onPointerDown={onPointerDown}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") { hovering.current = true; animation.current?.wake(); }
        }}
        onPointerLeave={() => {
          hovering.current = false;
          animation.current?.wake();
        }}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        <ul ref={trackRef} className="cf__track">
          {set.map((f) => renderFrame(f, 0))}
          {set.map((f) => renderFrame(f, 1))}
        </ul>
      </div>

      {!empty && (
        <div className="cf__bar">
          <button type="button" className="lightbox__btn cf__nav" onClick={() => nudge(-1)} aria-label="Scroll back">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button
            type="button"
            className="lightbox__btn cf__nav"
            onClick={() => setPlaying((v) => !v)}
            aria-pressed={!playing}
            aria-label={playing ? "Pause scrolling" : "Resume scrolling"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg>
            )}
          </button>
          <button type="button" className="lightbox__btn cf__nav" onClick={() => nudge(1)} aria-label="Scroll forward">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
