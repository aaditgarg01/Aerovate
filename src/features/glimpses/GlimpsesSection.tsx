import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { glimpses, type Glimpse } from "./data";
import Lightbox from "./Lightbox";
import Globe from "./Globe";
import "./Glimpses.css";

// Starts the grid's entrance animation the first time it scrolls into view.
function useReveal() {
  const [seen, setSeen] = useState(false);
  const ref = useCallback((node: HTMLElement | null) => {
    if (!node || typeof IntersectionObserver === "undefined") {
      if (node) setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

// 3D tilt that follows the mouse (mouse only; touch and keyboard are unaffected).
const tilt = (e: PointerEvent<HTMLLIElement>) => {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
  el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
  el.style.setProperty("--gx", `${x * 100}%`);
  el.style.setProperty("--gy", `${y * 100}%`);
};
const untilt = (e: PointerEvent<HTMLLIElement>) => {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
};

const TITLE = "Glimpses";

// Empty glass tiles shown in the browse area while there are no approved photos yet.
const EMPTY_TILES = [1.5, 0.667, 1.5, 1.333, 1.5, 0.667];


// Big heading whose letters ignite one after another when it scrolls into view,
// then stay white. Afterwards, moving the pointer over a letter makes it flare.
function GlowTitle({ id }: { id: string }) {
  const [ref, seen] = useReveal();
  const [done, setDone] = useState(false);
  const letters = [...TITLE];
  return (
    <h2
      id={id}
      ref={ref}
      aria-label={TITLE}
      className={`glimpses__title${seen ? " is-in" : ""}${done ? " is-done" : ""}`}
    >
      {letters.map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="glimpses__letter"
          style={{ "--n": i } as CSSProperties}
          onAnimationEnd={
            i === letters.length - 1
              ? (e) => e.animationName === "ignite" && setDone(true)
              : undefined
          }
        >
          {ch}
        </span>
      ))}
    </h2>
  );
}

export function GlimpsesSection() {
  const [year, setYear] = useState<"all" | number>("all");
  const [viewer, setViewer] = useState<{ photos: Glimpse[]; index: number } | null>(null);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [motionOff, setMotionOff] = useState(false);
  const [gridRef, revealed] = useReveal();

  const openerEl = useRef<HTMLElement | null>(null); // the button that opened the viewer
  const openedId = useRef<string | null>(null); // photo that was open when it started
  const lastId = useRef<string | null>(null); // photo showing now

  const years = useMemo(
    () => [...new Set(glimpses.map((p) => p.year))].sort((a, b) => b - a),
    []
  );
  const visible = useMemo(
    () => (year === "all" ? glimpses : glimpses.filter((p) => p.year === year)),
    [year]
  );

  // The globe uses every photo that hasn't failed to load.
  // If every image fails (e.g. files not added yet) keep it visible with empty frames.
  const reelPhotos = useMemo(() => {
    const ok = glimpses.filter((p) => !failed.has(p.id));
    return ok.length > 0 ? ok : glimpses;
  }, [failed]);
  const markFailed = useCallback(
    (id: string) => setFailed((prev) => new Set(prev).add(id)),
    []
  );

  const open = (photos: Glimpse[], index: number, el: HTMLElement) => {
    openerEl.current = el;
    openedId.current = photos[index].id;
    lastId.current = photos[index].id;
    setViewer({ photos, index });
  };

  const openFromGrid = (index: number, el: HTMLElement) => open(visible, index, el);
  const openFromReel = (id: string, el: HTMLElement) =>
    open(glimpses, glimpses.findIndex((p) => p.id === id), el);

  const changeIndex = useCallback((i: number) => {
    setViewer((v) => {
      if (!v) return v;
      lastId.current = v.photos[i].id;
      return { ...v, index: i };
    });
  }, []);

  const closeViewer = useCallback(() => {
    setViewer(null);
    requestAnimationFrame(() => {
      const same = lastId.current === openedId.current;
      const target =
        same && openerEl.current?.isConnected
          ? openerEl.current
          : document.getElementById(`glimpse-${lastId.current}`) ||
            document.getElementById(`globe-${lastId.current}`) ||
            openerEl.current;
      target?.focus();
    });
  }, []);

  // Measure the site's header so the heading never hides underneath it.
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("header");
    if (!header) return;
    const set = () =>
      rootRef.current?.style.setProperty("--site-header-h", `${header.getBoundingClientRect().height}px`);
    set();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(set);
    ro?.observe(header);
    window.addEventListener("resize", set);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);

  const showReel = reelPhotos.length > 0;
  const reelPaused = motionOff || viewer !== null;

  return (
    <section ref={rootRef} id="glimpses" tabIndex={-1} className="glimpses" aria-labelledby="glimpses-title">
      <div className="glimpses__hero">
      <header className="glimpses__head">
        <GlowTitle id="glimpses-title" />
        {showReel && (
          <>
            {/* Hidden until focused: keeps a keyboard-accessible way to stop the spin */}
            <button
              type="button"
              className="glimpses__chip glimpses__chip--small reel__toggle"
              aria-pressed={motionOff}
              onClick={() => setMotionOff((v) => !v)}
            >
              {motionOff ? "Start rotating photos" : "Stop rotating photos"}
            </button>
            <span className="reel__status" aria-live="polite">
              {motionOff ? "Rotating photos stopped" : "Rotating photos running"}
            </span>
          </>
        )}
      </header>

      <Globe
        photos={reelPhotos}
        empty={glimpses.length === 0}
        paused={reelPaused}
        onToggle={() => setMotionOff((v) => !v)}
        onOpen={openFromReel}
        onError={markFailed}
      />
      </div>

      <div className="glimpses__inner">
        <h3 className="glimpses__browse">Browse every photograph</h3>

        {years.length > 1 && (
          <div className="glimpses__filters" role="group" aria-label="Filter photographs by year">
            {(["all", ...years] as ("all" | number)[]).map((y) => (
              <button
                key={y}
                type="button"
                className="glimpses__chip"
                aria-pressed={year === y}
                onClick={() => setYear(y)}
              >
                {y === "all" ? "All years" : y}
              </button>
            ))}
          </div>
        )}

        <p className="glimpses__count" aria-live="polite" hidden={glimpses.length === 0}>
          {visible.length} {visible.length === 1 ? "photograph" : "photographs"}
          {year !== "all" ? ` from ${year}` : ""}
        </p>

        {glimpses.length === 0 ? (
          <ul ref={gridRef} className={`glimpses__grid${revealed ? " is-in" : ""}`} aria-hidden="true">
            {EMPTY_TILES.map((r, i) => (
              <li
                key={i}
                className="glimpses__item glimpses__item--empty"
                style={{ "--ratio": r, "--i": i } as CSSProperties}
              />
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <div className="glimpses__empty">
            <p>
              {glimpses.length === 0
                ? "Photographs will be added here soon."
                : `No photographs from ${year} yet.`}
            </p>
            {glimpses.length > 0 && (
              <button type="button" className="glimpses__chip" onClick={() => setYear("all")}>
                Show all years
              </button>
            )}
          </div>
        ) : (
          // key={year} remounts the grid so the entrance replays on every filter change
          <ul key={year} ref={gridRef} className={`glimpses__grid${revealed ? " is-in" : ""}`}>
            {visible.map((p, i) => (
              <li
                key={p.id}
                className="glimpses__item"
                style={{ "--ratio": p.width / p.height, "--i": Math.min(i, 12) } as CSSProperties}
                onPointerMove={tilt}
                onPointerLeave={untilt}
              >
                {failed.has(p.id) ? (
                  <div className="glimpses__missing" role="img" aria-label={`Photo unavailable: ${p.caption}`}>
                    <span>Photo unavailable</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    id={`glimpse-${p.id}`}
                    className="glimpses__open"
                    onClick={(e) => openFromGrid(i, e.currentTarget)}
                    aria-label={`Enlarge: ${p.caption}`}
                    aria-haspopup="dialog"
                  >
                    <img
                      ref={(el) => {
                        if (el?.complete && el.naturalWidth) el.classList.add("is-loaded");
                      }}
                      src={p.thumb ?? p.src}
                      alt={p.alt}
                      width={p.width}
                      height={p.height}
                      loading="lazy"
                      decoding="async"
                      onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                      onError={() => markFailed(p.id)}
                    />
                    <span className="glimpses__caption">{p.caption}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {viewer && (
        <Lightbox
          photos={viewer.photos}
          index={viewer.index}
          failed={failed}
          onError={markFailed}
          onChange={changeIndex}
          onClose={closeViewer}
        />
      )}
    </section>
  );
}

export default GlimpsesSection;
