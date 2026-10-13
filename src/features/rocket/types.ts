/** Member 3 renders the rocket; Member 4 supplies these values. No DOM access in the renderer. */
export interface RocketSceneProps {
  /** Normalized 0..1 across the hero scroll area, clamped by the producer. */
  progress: number;
  /** Disable animation and use a stable, lightweight view when true. */
  reducedMotion: boolean;
  className?: string;
}
export function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
