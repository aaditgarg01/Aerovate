import { ActionLink, Section } from '../../components/ui/Primitives';
import { Icon } from '../../components/ui/Icon';
import { SpaceExperience } from '../space/SpaceExperience';
import { Link } from 'react-router';
import './landing.css';

/** Member 2 owns this starting composition and the final approved event copy. */
export function LandingSection() {
  return <section id="home" className="hero" tabIndex={-1} aria-labelledby="hero-title">
    <div className="hero-stars" aria-hidden="true" />
    <div className="hero-inner"><div className="hero-copy"><span className="eyebrow"><span className="status-dot" />Curiosity is our launchpad</span>
      <h1 id="hero-title">Ideas<br />take <span className="hero-outline">flight.</span></h1>
      <p>AEROVATE / THE ROCKETRY EXPERIENCE</p><p className="hero-description">For minds that look up.<br />And hands that want to build.</p>
      <div className="hero-actions"><ActionLink to="/#event">Explore Aerovate</ActionLink><ActionLink to="/#thrust-tech" variant="outline">Meet Thrust Tech</ActionLink></div>
    </div><SpaceExperience /></div>
    <div className="hero-bottom"><span><Icon name="spark" width="14" height="14" />IMAGINE. BUILD. EXPLORE.</span><Link to="/#thrust-tech">Scroll to discover <span>↓</span></Link></div>
  </section>;
}

export function EventSection() {
  return <Section id="event" number="02" eyebrow="The experience" title="From a spark of curiosity to a new perspective.">
    <div className="event-grid"><p className="section-copy">Aerovate brings the excitement of rocketry closer. The full event programme, schedule and participation details will be announced here.</p><dl className="event-facts"><div><dt>Event</dt><dd>Aerovate</dd></div><div><dt>Date & venue</dt><dd>To be announced</dd></div><div><dt>Explore the legacy</dt><dd><Link to="/pocs">Meet past POCs <Icon name="diagonal" width="16" height="16" /></Link></dd></div></dl></div>
  </Section>;
}
