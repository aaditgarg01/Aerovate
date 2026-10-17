import { Section } from '../../components/ui/Primitives';
import { Icon } from '../../components/ui/Icon';
import { Link } from 'react-router';
import './landing.css';

/** Member 2 owns this starting composition and the final approved event copy. */
export function LandingSection() {
  return <section id="home" className="hero" tabIndex={-1} aria-labelledby="hero-title">
    <picture className="hero-backdrop" aria-hidden="true">
      <source srcSet="/assets/hero/aerovate-launch-sunset.webp" type="image/webp" />
      <img src="/assets/hero/aerovate-launch-sunset.jpg" alt="" width="1740" height="904" fetchPriority="high" decoding="async" />
    </picture>
    <div className="hero-inner">
      <div className="hero-copy">
        <span className="eyebrow hero-eyebrow"><span className="status-dot" />Curiosity is our launchpad</span>
        <h1 id="hero-title">Ideas{' '}<br />take <span className="hero-highlight">flight.</span></h1>
        <p className="hero-kicker">AEROVATE / THE ROCKETRY EXPERIENCE</p>
        <p className="hero-description">For minds that look up.<br />And hands that want to build.</p>
      </div>
      {/* Reserved for the future model renderer; the photo supplies the current rocket. */}
      <div className="hero-rocket-stage" aria-hidden="true" />
    </div>
  </section>;
}

export function EventSection() {
  return <Section id="event" number="02" eyebrow="The experience" title="From a spark of curiosity to a new perspective.">
    <div className="event-grid"><p className="section-copy">Aerovate brings the excitement of rocketry closer. The full event programme, schedule and participation details will be announced here.</p><dl className="event-facts"><div><dt>Event</dt><dd>Aerovate</dd></div><div><dt>Date & venue</dt><dd>To be announced</dd></div><div><dt>Explore the legacy</dt><dd><Link to="/#pocs">Meet past POCs <Icon name="diagonal" width="16" height="16" /></Link></dd></div></dl></div>
  </Section>;
}
