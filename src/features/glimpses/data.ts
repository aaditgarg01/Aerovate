export interface Glimpse {
  id: string;
  src: string;
  alt: string;
  caption: string;
  year: number;
  width: number;
  height: number;
}
// Member 7 adds approved photos here; don't represent stock imagery as past events.
export const glimpses: Glimpse[] = [];
