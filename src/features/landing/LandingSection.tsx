import { Section } from '../../components/ui/Primitives';
import { HeroLaunch } from '../space/HeroLaunch';
import { ExperienceDiagram } from './ExperienceDiagram';
import { Icon } from '../../components/ui/Icon';
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
  return <Section id="event" number="02" eyebrow="The experience" title="From an idea to ignition." className="experience-section">
    <div className="experience-mission">
      <div className="experience-intro">
        <span className="experience-partner"><span className="status-dot" />Aerovate 3.0 <span aria-hidden="true">×</span> Thrust Tech</span>
        <p className="experience-lead">Two days. One rocket.<br />A whole new perspective.</p>
        <p className="section-copy">Feel the countdown. Build for liftoff. Get inside the science of model rocketry, then turn your team’s imagination into something that leaves the ground.</p>
        <ol className="experience-stages" aria-label="Workshop stages">
          {['Design', 'Simulate', 'Build', 'Launch'].map((stage, i) => <li key={stage}><span>{stage}</span>{i < 3 && <Icon name="arrow" width="15" height="15" />}</li>)}
        </ol>
      </div>
      <ExperienceDiagram />
    </div>

    <div className="experience-days">
      <article className="experience-day">
        <span className="experience-day-number" aria-hidden="true">01</span>
        <div className="experience-day-content">
          <span className="eyebrow">11 September · Day 1</span>
          <h3>Think it. Test it.</h3>
          <p>Uncover the forces behind flight—aerodynamics, stability and propulsion. Design your rocket in <strong>OpenRocket</strong>, simulate its flight, and shape every detail before the build.</p>
          <span className="experience-day-note"><Icon name="orbit" width="16" height="16" />Flight fundamentals &amp; simulation</span>
        </div>
      </article>
      <article className="experience-day experience-day--launch">
        <span className="experience-day-number" aria-hidden="true">02</span>
        <div className="experience-day-content">
          <span className="eyebrow">12 September · Day 2</span>
          <h3>Make it. Launch it.</h3>
          <p>Roll up your sleeves and build your model rocket with the materials provided. Bring your team’s work to the launchpad and feel the thrill of a <strong>supervised launch.</strong></p>
          <span className="experience-day-note"><Icon name="diagonal" width="16" height="16" />Hands-on build &amp; supervised launch</span>
        </div>
      </article>
    </div>

    <dl className="experience-facts">
      <div><dt>Mission dates</dt><dd><time dateTime="2026-09-11">11</time>–<time dateTime="2026-09-12">12 Sept 2026</time></dd></div>
      <div><dt>Daily window</dt><dd><time dateTime="09:00">9 AM</time>–<time dateTime="17:00">5 PM</time></dd></div>
      <div><dt>Mission venues</dt><dd>VOC Gallery &amp; Men’s Outdoor Stadium</dd></div>
      <div><dt>Your crew</dt><dd>4–5 members</dd></div>
    </dl>
  </Section>;
}
