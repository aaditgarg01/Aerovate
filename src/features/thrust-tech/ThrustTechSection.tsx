import { Section } from '../../components/ui/Primitives';
import { Icon } from '../../components/ui/Icon';

/** Member 5: replace the intro placeholder with approved Thrust Tech information. */
export function ThrustTechSection() {
  return <Section id="thrust-tech" number="01" eyebrow="Behind the experience" title="Meet Thrust Tech.">
    <div className="intro-grid"><p className="section-copy">Discover the people and ideas behind Thrust Tech. An introduction to their work, approach and role in the Aerovate experience is coming soon.</p><div className="partner-wordmark"><Icon name="orbit" width="42" height="42" /><span>THRUST<br /><strong>TECH</strong></span><span className="partner-caption">ENGINEERING CURIOSITY</span></div></div>
  </Section>;
}
