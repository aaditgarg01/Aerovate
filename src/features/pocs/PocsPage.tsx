import { ActionLink, Card, EmptyState } from '../../components/ui/Primitives';
import { pocs } from './data';

/** Member 6 owns this route, the year selector, cards and historical data. */
export default function PocsPage() {
  return <div className="page-container standalone-page"><span className="eyebrow">The people behind the journey</span><h1>Every launch{' '}<br />has a <span className="accent">team.</span></h1><p className="section-copy">Meet the points of contact who helped bring Aerovate to life through the years.</p>
    {pocs.length ? <div className="poc-grid">{pocs.map(person => <Card key={person.id}><span className="eyebrow">{person.year}</span><h2>{person.name}</h2><p>{person.role}</p></Card>)}</div> : <EmptyState title="Our story, through its people.">The past-year POC directory is being put together. Confirmed names and details will be added here.</EmptyState>}
    <ActionLink to="/" variant="outline">Back to Aerovate</ActionLink>
  </div>;
}
