import { useEffect, useRef } from "react";
import type { CSSProperties, TouchEvent as ReactTouchEvent } from "react";
import type { Glimpse } from "./data";
import { createPortal } from "react-dom";

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

interface LightboxProps {
  photos: Glimpse[];
  index: number;
  failed: Set<string>;
  onError: (id: string) => void;
  onChange: (index: number) => void;
  onClose: () => void;
}

export default function Lightbox({ photos, index, failed, onError, onChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const dir = useRef(1); // slide direction for the photo-change animation

  const total = photos.length;
  const photo = photos[index];
  const prev = () => {
    dir.current = -1;
    onChange((index - 1 + total) % total);
  };
  const next = () => {
    dir.current = 1;
    onChange((index + 1) % total);
  };

  // Lock page scroll and focus the close button on open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Keyboard: Escape, arrows, and a focus trap on Tab.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && total > 1) {
        prev();
      } else if (e.key === "ArrowRight" && total > 1) {
        next();
      } else if (e.key === "Tab") {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // Preload neighbours so next/previous feel instant.
  useEffect(() => {
    [photos[(index + 1) % total], photos[(index - 1 + total) % total]].forEach((p) => {
      if (p) new Image().src = p.src;
    });
  }, [index, photos, total]);

  const onTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    touchStart.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStart.current === null || total < 2) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
  };

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${total}`}
      ref={dialogRef}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button ref={closeRef} type="button" className="lightbox__btn lightbox__close" onClick={onClose} aria-label="Close viewer">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      {total > 1 && (
        <button type="button" className="lightbox__btn lightbox__prev" onClick={prev} aria-label="Previous photograph">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
      )}

      <figure className="lightbox__figure" style={{ "--dir": dir.current } as CSSProperties}>
        {failed.has(photo.id) ? (
          <div className="lightbox__missing">This photograph could not be loaded.</div>
        ) : (
          <img
            key={photo.id}
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            onError={() => onError(photo.id)}
          />
        )}
        <figcaption key={photo.id}>
          <strong>{photo.caption}</strong>
          <span>
            {photo.event ? `${photo.event} · ` : ""}{index + 1} of {total}
          </span>
        </figcaption>
      </figure>

      {total > 1 && (
        <button type="button" className="lightbox__btn lightbox__next" onClick={next} aria-label="Next photograph">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
    </div>,
    document.body
  );
}
