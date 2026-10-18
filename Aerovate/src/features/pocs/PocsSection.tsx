import { Card, EmptyState, Section } from '../../components/ui/Primitives';
import { pocs } from './data';
import './pocs.css';

/** Member 6 owns this section, the year selector, cards and historical data. */
export function PocsSection() {
  return <Section id="pocs" number="03" eyebrow="The people behind the journey" title="Every launch has a team.">
    <p className="section-copy">Meet the points of contact who helped bring Aerovate to life through the years.</p>
    {pocs.length ? <div className="poc-grid">{pocs.map(person => <Card key={person.id}><span className="eyebrow">{person.year}</span><h3>{person.name}</h3><p>{person.role}</p></Card>)}</div> : <EmptyState title="Our story, through its people.">The past-year POC directory is being put together. Confirmed names and details will be added here.</EmptyState>}
  </Section>;
}
