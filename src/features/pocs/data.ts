export interface Poc {
  /** Unique and stable, e.g. "2025-firstname-lastname". */
  id: string;
  name: string;
  role: string;
  year: number;
  /** Square image in `public/assets/pocs/<year>/`, e.g. "/assets/pocs/2025/firstname-lastname.webp" (about 480px). */
  photo?: string;
  /** One approved public profile (LinkedIn, GitHub, Instagram or a personal site). https only. */
  profileUrl?: string;
  /** The POC's event experience in their own words, approved for publication. Long stories get a "Read more" toggle. */
  experience?: string;
  /** Placeholder awaiting confirmed details; labelled "Details pending" on the card. Remove once approved. */
  placeholder?: boolean;
}

/**
 * Member 6 maintains the past-year POC directory. Aerovate has one point of contact per year.
 * - Add only confirmed people. Never invent names or present test identities as real POCs.
 * - Personal contact details (phone, personal email) are not published here. Add a profile link only
 *   when the person has approved it for publication.
 * - Replace each placeholder below as confirmed details arrive.
 */

/** Event years shown on the timeline. A listed year without a record shows the empty state. */
export const pocYears: number[] = [2026, 2025, 2024];

const pendingStory = (year: number) =>
  `The story of Aerovate ${year}, told by its point of contact, is coming soon: what it took to bring the event together, the moments that stood out, and what they would tell the next POC.`;

export const pocs: Poc[] = [
  { id: '2026-poc', name: 'To be announced', role: 'Point of contact', year: 2026, experience: pendingStory(2026), placeholder: true },
  { id: '2025-poc', name: 'To be announced', role: 'Point of contact', year: 2025, experience: pendingStory(2025), placeholder: true },
  { id: '2024-poc', name: 'To be announced', role: 'Point of contact', year: 2024, experience: pendingStory(2024), placeholder: true },
];
