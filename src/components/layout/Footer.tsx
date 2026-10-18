import './layout.css';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { site } from '../../config/site';
import { Icon } from '../ui/Icon';
import { SocialIcon } from '../ui/SocialIcon';

export function Footer() {
  return <footer className="footer" id="contact" tabIndex={-1} aria-labelledby="contact-title">
    <div className="footer-grid">
      <div className="footer-intro">
        <div className="footer-wordmark" aria-hidden="true"><span className="footer-letters">{Array.from('AEROVATE', (letter, i) => <i key={i} style={{ '--li': i } as CSSProperties}>{letter}</i>)}</span><span className="footer-edition">3.0</span></div>
        <h2 id="contact-title">Let’s build<br /><span>what’s next.</span></h2>
        <p>Questions, ideas, or just want to say hi?<br />We’d love to hear from you.</p>
        <span className="footer-intro-rule" aria-hidden="true" />
      </div>
      <div className="footer-contact">
        <h3>Get in touch</h3>
        <a className="email-link" href={`mailto:${site.contact.email}`}><Icon name="mail" width="22" height="22" />{site.contact.email}</a>
        <p className="footer-enquiries"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>{site.contact.label} · Event enquiries</p>
        <div className="footer-socials"><h3>Connect with us</h3><ul>{site.socials.map(social => <li key={social.label}><a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`${social.label} (opens in a new tab)`}><span className="footer-social-icon"><SocialIcon name={social.label} /></span><span>{social.label}</span></a></li>)}</ul></div>
      </div>
      <div className="footer-credits"><h3>Built by the Aerovate Tech Team</h3><ul>{site.developers.map(person => <li key={person.name}><span className="credit-name">{person.name}</span><span className="credit-profiles">{[...person.profiles].sort((a, b) => a.label === b.label ? 0 : a.label === 'LinkedIn' ? -1 : 1).map(profile => <a key={profile.label} href={profile.url} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on ${profile.label} (opens in a new tab)`} title={`${person.name} on ${profile.label}`}><SocialIcon name={profile.label} /></a>)}</span></li>)}</ul></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Aerovate</span><span className="footer-signoff">Made of curiosity. Built together.</span><Link to="/#home" aria-label="Back to top" title="Back to top"><Icon name="arrow" style={{ rotate: '-90deg' }} /></Link></div>
  </footer>;
}
