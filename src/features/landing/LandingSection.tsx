import { Section } from '../../components/ui/Primitives';
import { HeroLaunch } from '../space/HeroLaunch';
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
        <h1 id="hero-title" aria-label="Ideas take flight."><Chars text="Ideas" /><br /><Chars text="take" />{' '}<span className="hero-highlight"><Chars text="flight." /></span></h1>
        <p className="hero-kicker">AEROVATE / THE ROCKETRY EXPERIENCE</p>
        <p className="hero-description">For minds that look up.<br />And hands that want to build.</p>
      </div>
      {/* Reserved for the future model renderer; the photo supplies the current rocket. */}
      <div className="hero-rocket-stage" aria-hidden="true" />
    </div>
    <HeroLaunch />
  </section>;
}

/** Splits a word into letters for the launch sequence; screen readers use the heading's label. */
function Chars({ text }: { text: string }) {
  return <span className="hero-word" aria-hidden="true">{Array.from(text, (char, i) => <span key={i} className="hero-char">{char}</span>)}</span>;
}

export function EventSection() {
  return <Section id="event" number="02" eyebrow="The experience" title="Design. Simulate. Build. Launch.">
    <div className="event-grid">
      <div className="event-overview">
        <h3 className="eyebrow">Overview</h3>
        <p className="section-copy">Feel the countdown. Build for liftoff. Aerovate 3.0 brings you two immersive days of model rocketry with Thrust Tech—where an idea on your screen becomes a rocket on the launchpad.</p>
        <p className="section-copy">Start with the science that makes flight possible: aerodynamics, stability and propulsion. Design your rocket in OpenRocket, put it through simulation, and discover how every design choice shapes its journey skyward.</p>
        <p className="section-copy">Then roll up your sleeves. On Day 2, turn your design into a model rocket using the materials provided, bring your team’s work to the launchpad, and experience the thrill of a <strong>supervised launch</strong>.</p>
        <p className="event-closing">From your first sketch to the final countdown—<strong>build something that takes flight.</strong></p>
      </div>
      <dl className="event-facts">
        <div><dt>Event</dt><dd>Aerovate 3.0</dd></div>
        <div><dt>Date</dt><dd><time dateTime="2026-09-11">11</time>–<time dateTime="2026-09-12">12 September 2026</time></dd></div>
        <div><dt>Time</dt><dd><time dateTime="09:00">9 AM</time>–<time dateTime="17:00">5 PM</time></dd></div>
        <div><dt>Venue</dt><dd>VOC Gallery &amp; Men’s Outdoor Stadium</dd></div>
        <div><dt>Team size</dt><dd>4–5 members</dd></div>
      </dl>
    </div>
  </Section>;
}
