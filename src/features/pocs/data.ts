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
  /** Placeholder awaiting confirmed details; labelled "Details pending" on the card. Remove once approved. */
  placeholder?: boolean;
}

/**
 * Member 6 maintains the past-year POC directory.
 * - Add only confirmed people, in the order they should appear within their year.
 * - Never invent names or present test identities as real POCs.
 * - Personal contact details (phone, personal email) are not published here. Add a profile link only
 *   when the person has approved it for publication.
 * - Replace the placeholder entries below as confirmed records arrive; delete any that remain unused.
 */

/** Years shown in the year selector. A listed year without records shows the empty state. Placeholder years until confirmed. */
export const pocYears: number[] = [2025, 2024, 2023];

export const pocs: Poc[] = [
  { id: '2025-placeholder-1', name: 'To be announced', role: 'Event lead', year: 2025, placeholder: true },
  { id: '2025-placeholder-2', name: 'To be announced', role: 'Technical POC', year: 2025, placeholder: true },
  { id: '2025-placeholder-3', name: 'To be announced', role: 'Operations POC', year: 2025, placeholder: true },
  { id: '2025-placeholder-4', name: 'To be announced', role: 'Outreach POC', year: 2025, placeholder: true },
  { id: '2024-placeholder-1', name: 'To be announced', role: 'Event lead', year: 2024, placeholder: true },
  { id: '2024-placeholder-2', name: 'To be announced', role: 'Technical POC', year: 2024, placeholder: true },
  { id: '2024-placeholder-3', name: 'To be announced', role: 'Operations POC', year: 2024, placeholder: true },
];
