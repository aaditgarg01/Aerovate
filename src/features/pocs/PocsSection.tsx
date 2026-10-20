import { useState } from 'react';
import { Button, Card, EmptyState, Section } from '../../components/ui/Primitives';
import { Icon } from '../../components/ui/Icon';
import { SocialIcon } from '../../components/ui/SocialIcon';
import { pocs, pocYears, type Poc } from './data';
import './pocs.css';

type YearFilter = number | 'all';

// Newest year first; records keep their data-file order within a year.
const years = [...new Set([...pocYears, ...pocs.map(person => person.year)])].sort((a, b) => b - a);
const sorted = [...pocs].sort((a, b) => b.year - a.year);
const latestYear = years.find(year => pocs.some(person => person.year === year));

/** Member 6 owns this section, the year selector, cards and historical data. */
export function PocsSection() {
  const [year, setYear] = useState<YearFilter>(latestYear ?? 'all');
  const visible = year === 'all' ? sorted : sorted.filter(person => person.year === year);

  return <Section id="pocs" number="03" eyebrow="The people behind the journey" title="Every launch has a team.">
    <p className="section-copy">Meet the points of contact who helped bring Aerovate to life through the years.</p>
    {pocs.length === 0 ? <EmptyState title="Our story, through its people.">The past-year POC directory is being put together. Confirmed names and details will be added here.</EmptyState> : <>
      <div className="poc-toolbar">
        <div className="poc-years" role="group" aria-label="Show POCs by year">
          {years.map(y => <button key={y} type="button" className="poc-year" aria-pressed={year === y} onClick={() => setYear(y)}>{y}</button>)}
          {years.length > 1 && <button type="button" className="poc-year" aria-pressed={year === 'all'} onClick={() => setYear('all')}>All years</button>}
        </div>
        <p className="poc-count" aria-live="polite">{countLabel(visible.length, year)}</p>
      </div>
      {visible.length ? <ul className="poc-grid">{visible.map(person => <li key={person.id}><PocCard person={person} /></li>)}</ul> :
        <div className="empty-state poc-empty">
          <Icon name="orbit" />
          <h3>No POCs listed for {year} yet.</h3>
          <p>Confirmed names for this year haven’t been added. Browse another year or check back soon.</p>
          {latestYear !== undefined && <Button variant="outline" onClick={() => setYear(latestYear)}>See {latestYear} POCs</Button>}
        </div>}
    </>}
  </Section>;
}

function countLabel(count: number, year: YearFilter) {
  if (year === 'all') return `${count} ${count === 1 ? 'POC' : 'POCs'} across all years`;
  return count ? `${count} ${count === 1 ? 'POC' : 'POCs'} from ${year}` : `No POCs listed for ${year}`;
}

function PocCard({ person }: { person: Poc }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const profile = person.profileUrl ? describeProfile(person.profileUrl) : null;

  return <Card className={`poc-card${person.placeholder ? ' poc-card--pending' : ''}`}>
    <div className="poc-photo">
      {person.photo && !photoFailed ?
        <img src={person.photo} alt="" width="480" height="480" loading="lazy" decoding="async" onError={() => setPhotoFailed(true)} /> :
        <span className="poc-photo-fallback" aria-hidden="true">
          {person.placeholder ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.5c.6-4 3.6-6.4 7.5-6.4s6.9 2.4 7.5 6.4" /></svg> : initials(person.name)}
        </span>}
    </div>
    <div className="poc-body">
      <span className="eyebrow">Aerovate {person.year}</span>
      <h3>{person.name}</h3>
      <p>{person.role}</p>
      {(person.placeholder || profile) && <div className="poc-meta">
        {person.placeholder && <span className="poc-pending">Details pending</span>}
        {profile && <a className="poc-link" href={profile.url} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on ${profile.label} (opens in a new tab)`}>
          {profile.icon ? <SocialIcon name={profile.icon} /> : <Icon name="diagonal" />}<span>{profile.label}</span>
        </a>}
      </div>}
    </div>
  </Card>;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts).map(part => part[0].toUpperCase()).join('');
}

/** Only https profile links are published; anything else is ignored. */
function describeProfile(url: string) {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:') return null;
  const host = parsed.hostname.replace(/^www\./, '');
  const icon = host.endsWith('linkedin.com') ? 'LinkedIn' : host === 'github.com' ? 'GitHub' : host === 'instagram.com' ? 'Instagram' : null;
  return { url: parsed.href, icon, label: icon ?? 'Profile' } as const;
}
