import { Section } from '../../components/ui/Primitives';
import './landing.css';

/** About + history of Aerovate; placeholder copy in site voice until real material lands. */
export function AboutSection() {
  return <Section id="about" number="03" eyebrow="About the event" title="A rocketry experience for curious minds.">
    <p className="section-copy">Aerovate is the rocketry experience from VIT Stellar — for minds that look up and hands that want to build. What the day holds, how to take part and where it happens will be announced here as launch approaches.</p>
  </Section>;
}

export function HistorySection() {
  return <Section id="history" number="04" eyebrow="The history" title="The story so far.">
    <div className="event-grid">
      <p className="section-copy">Every edition of Aerovate has a new crew behind it, led by one point of contact. The trail so far:</p>
      <dl className="event-facts">
        <div><dt>2024</dt><dd>Recap coming soon</dd></div>
        <div><dt>2025</dt><dd>Recap coming soon</dd></div>
        <div><dt>2026</dt><dd>Next launch — date to be announced</dd></div>
      </dl>
    </div>
  </Section>;
}
