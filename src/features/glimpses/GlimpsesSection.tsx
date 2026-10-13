import { EmptyState, Section } from '../../components/ui/Primitives';
import { glimpses } from './data';

/** Member 7 owns gallery filters, lightbox and final layout. */
export function GlimpsesSection() {
  return <Section id="glimpses" number="03" eyebrow="Moments in orbit" title="A glimpse beyond the launchpad.">
    {glimpses.length ? <div className="gallery-grid">{glimpses.map(photo => <figure key={photo.id}><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" /><figcaption>{photo.caption}</figcaption></figure>)}</div> : <EmptyState title="Memories worth looking back on.">Photographs from Aerovate will appear here. Check back for moments from the experience.</EmptyState>}
  </Section>;
}
