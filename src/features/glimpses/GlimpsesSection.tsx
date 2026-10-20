import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { glimpses, type Glimpse } from "./data";
import Lightbox from "./Lightbox";
import Globe from "./Globe";
import Coverflow from "./Coverflow";
import "./Glimpses.css";

// Starts the heading's animation the first time it scrolls into view.
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

const TITLE = "Glimpses";

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

  const openerEl = useRef<HTMLElement | null>(null); // the button that opened the viewer
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
    lastId.current = photos[index].id;
    setViewer({ photos, index });
  };

  const openFromBrowse = (index: number, el: HTMLElement) => open(visible, index, el);
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
      // give focus back to the photo that opened the viewer
      const target = openerEl.current?.isConnected
        ? openerEl.current
        : document.getElementById(`globe-${lastId.current}`);
      target?.focus();
    });
  }, []);

  // Measure the site's header so the heading never hides underneath it.
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("header:not(.glimpses__head)");
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
  const noPhotos = glimpses.length === 0;

  return (
    <section ref={rootRef} id="glimpses" tabIndex={-1} className="glimpses" aria-labelledby="glimpses-title">
      <div className="glimpses__hero">
        <header className="glimpses__head">
          <GlowTitle id="glimpses-title" />
        </header>

        {/* Always rendered so keyboard users can stop the spin, even though it is invisible until focused */}
        <button
          type="button"
          className="glimpses__chip glimpses__chip--small reel__toggle"
          aria-pressed={motionOff}
          onClick={() => setMotionOff((v) => !v)}
          hidden={!showReel}
        >
          {motionOff ? "Start rotating photos" : "Stop rotating photos"}
        </button>
        <span className="reel__status" aria-live="polite">
          {showReel ? (motionOff ? "Rotating photos stopped" : "Rotating photos running") : ""}
        </span>

        <Globe
          photos={reelPhotos}
          empty={noPhotos}
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

        <p className="glimpses__count" aria-live="polite">
          {`${visible.length} photograph${visible.length === 1 ? "" : "s"}${year === "all" ? " from all years" : ` from ${year}`}`}
        </p>

        {!noPhotos && visible.length === 0 ? (
          <div className="glimpses__empty">
            <p>{`No photographs from ${year} yet.`}</p>
            <button type="button" className="glimpses__chip" onClick={() => setYear("all")}>
              Show all years
            </button>
          </div>
        ) : (
          // key={year} restarts the coverflow at the middle photo whenever the filter changes
          <Coverflow
            key={year}
            photos={visible}
            empty={noPhotos}
            failed={failed}
            paused={viewer !== null}
            onError={markFailed}
            onOpen={openFromBrowse}
          />
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
