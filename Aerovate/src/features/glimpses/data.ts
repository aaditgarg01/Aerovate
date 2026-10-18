export interface Glimpse {
  id: string;
  /** Large version used in the viewer (about 1600px wide, WebP). */
  src: string;
  /** Optional small version for the grid and globe (about 600px wide). Falls back to `src`. */
  thumb?: string;
  alt: string;
  caption: string;
  /** Optional, e.g. "Aerovate 2025". Shown next to the caption when present. */
  event?: string;
  year: number;
  width: number;
  height: number;
}

// Member 7 adds approved photos here; don't represent stock imagery as past events.
export const glimpses: Glimpse[] = [];

