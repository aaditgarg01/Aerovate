import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { EmptyState, Section } from '../../components/ui/Primitives';
import { Icon } from '../../components/ui/Icon';
import { SocialIcon } from '../../components/ui/SocialIcon';
import { launchRocket } from '../fx/rocketFlight';
import { pocs, pocYears, type Poc } from './data';
import './pocs.css';

// Oldest to newest, left to right on the timeline.
const years = [...new Set([...pocYears, ...pocs.map(person => person.year)])].sort((a, b) => a - b);
const STORY_PREVIEW = 280;
const SWIPE_DISTANCE = 50;

/** Member 6 owns this section, the year timeline, POC spotlight and historical data. */
export function PocsSection() {
  const [index, setIndex] = useState(years.length - 1);
  const [direction, setDirection] = useState(1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const flight = useRef<() => void>(() => {});
  const year = years[index];
  const person = pocs.find(entry => entry.year === year);

  useEffect(() => () => flight.current(), []);

  function select(next: number, focusTab = false) {
    const target = Math.max(0, Math.min(years.length - 1, next));
    if (focusTab) tabs.current[target]?.focus();
    if (target === index) return;
    setDirection(target > index ? 1 : -1);
    setIndex(target);
    flyBetween(index, target);
  }

  // A small rocket hops along the timeline from the previous year's marker to the new one.
  function flyBetween(fromIndex: number, toIndex: number) {
    const centre = (i: number) => {
      const rect = tabs.current[i]?.querySelector('.poc-tab-dot')?.getBoundingClientRect();
      return rect && { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const from = centre(fromIndex), to = centre(toIndex);
    if (!from || !to) return;
    flight.current();
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    flight.current = launchRocket({ from, to, curve: { x: 0, y: -Math.min(90, 30 + distance * .22) }, size: 30, duration: 520 + Math.min(700, distance * 1.1), profile: 'hop' });
  }

  function onTabKey(event: KeyboardEvent) {
    const targets: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: years.length - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    select(targets[event.key], true);
  }

  // Horizontal swipes on touch screens move between years; vertical scrolling is untouched.
  function onPointerUp(event: PointerEvent) {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) select(index + (dx < 0 ? 1 : -1));
  }

  return <Section id="pocs" number="06" eyebrow="The people behind the journey" title="Every launch has a team.">
    <p className="section-copy">Each edition of Aerovate had one point of contact who brought it together. Travel through the years to meet them and hear about their experience.</p>
    {years.length === 0 ? <EmptyState title="Our story, through its people.">The past-year POC directory is being put together. Confirmed names and details will be added here.</EmptyState> : <>
      <div className="poc-timeline" role="tablist" aria-label="Aerovate years" style={{ '--count': years.length, '--progress': years.length > 1 ? index / (years.length - 1) : 0 } as CSSProperties}>
        <span className="poc-timeline-progress" aria-hidden="true" />
        {years.map((y, i) => <button key={y} ref={node => { tabs.current[i] = node; }} type="button" role="tab" id={`poc-tab-${y}`} aria-selected={i === index} aria-controls="poc-panel" tabIndex={i === index ? 0 : -1}
          className={`poc-tab${i < index ? ' poc-tab--past' : ''}`} onClick={() => select(i)} onKeyDown={onTabKey}>
          <span className="poc-tab-dot" aria-hidden="true" />{y}
        </button>)}
      </div>

      <div id="poc-panel" role="tabpanel" aria-labelledby={`poc-tab-${year}`} tabIndex={0} className="poc-stage"
        onPointerDown={event => { if (event.pointerType !== 'mouse') swipe.current = { x: event.clientX, y: event.clientY }; }}
        onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null; }}>
        <div key={year} className="poc-slide" style={{ '--dir': direction } as CSSProperties}>
          {person ? <PocSpotlight person={person} /> :
            <div className="empty-state poc-empty">
              <Icon name="orbit" />
              <h3>No POC listed for {year} yet.</h3>
              <p>The point of contact for this year hasn’t been confirmed. Browse another year or check back soon.</p>
            </div>}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{`Aerovate ${year}: ${person ? `${person.name}, ${person.role}` : 'no POC listed yet'}`}</p>

      {years.length > 1 && <div className="poc-steps">
        <button type="button" className="poc-step poc-step--prev" onClick={() => select(index - 1)} disabled={index === 0} aria-label={index > 0 ? `Previous year, ${years[index - 1]}` : 'Previous year'}>
          <Icon name="arrow" /><span aria-hidden="true">{years[index - 1] ?? 'Start'}</span>
        </button>
        <span className="poc-step-count" aria-hidden="true">{String(index + 1).padStart(2, '0')} / {String(years.length).padStart(2, '0')}</span>
        <button type="button" className="poc-step" onClick={() => select(index + 1)} disabled={index === years.length - 1} aria-label={index < years.length - 1 ? `Next year, ${years[index + 1]}` : 'Next year'}>
          <span aria-hidden="true">{years[index + 1] ?? 'Latest'}</span><Icon name="arrow" />
        </button>
      </div>}
    </>}
  </Section>;
}

function PocSpotlight({ person }: { person: Poc }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const profile = person.profileUrl ? describeProfile(person.profileUrl) : null;
  const story = person.experience?.trim() || `Their Aerovate ${person.year} experience will be shared here soon.`;
  const longStory = story.length > STORY_PREVIEW;

  return <article className={`card poc-spotlight${person.placeholder ? ' poc-spotlight--pending' : ''}`} aria-labelledby={`poc-name-${person.id}`} data-fx-tilt>
    <div className="poc-photo">
      {person.photo && !photoFailed ?
        <img src={person.photo} alt="" width="480" height="480" loading="lazy" decoding="async" onError={() => setPhotoFailed(true)} /> :
        <span className="poc-photo-fallback" aria-hidden="true">
          {person.placeholder ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.5c.6-4 3.6-6.4 7.5-6.4s6.9 2.4 7.5 6.4" /></svg> : initials(person.name)}
        </span>}
    </div>
    <div className="poc-head">
      <span className="eyebrow">Aerovate {person.year}</span>
      <h3 id={`poc-name-${person.id}`}>{person.name}</h3>
      <p className="poc-role">{person.role}</p>
      {(person.placeholder || profile) && <div className="poc-meta">
        {person.placeholder && <span className="poc-pending">Details pending</span>}
        {profile && <a className="poc-link" href={profile.url} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on ${profile.label} (opens in a new tab)`}>
          {profile.icon ? <SocialIcon name={profile.icon} /> : <Icon name="diagonal" />}<span>{profile.label}</span>
        </a>}
      </div>}
    </div>
    <figure className={`poc-story${longStory && !storyOpen ? ' poc-story--clamped' : ''}`}>
      <figcaption className="eyebrow">Event experience</figcaption>
      <blockquote id={`poc-story-${person.id}`}><p>{story}</p></blockquote>
      {longStory && <button type="button" className="poc-story-toggle" aria-expanded={storyOpen} aria-controls={`poc-story-${person.id}`} onClick={() => setStoryOpen(!storyOpen)}>
        {storyOpen ? 'Show less' : 'Read full experience'}
      </button>}
    </figure>
  </article>;
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
