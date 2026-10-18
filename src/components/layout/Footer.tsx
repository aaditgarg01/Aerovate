import './layout.css';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { site } from '../../config/site';
import { Icon } from '../ui/Icon';

export function Footer() {
  return <footer className="footer" id="contact" tabIndex={-1} aria-labelledby="contact-title">
    <div className="footer-top"><h2 id="contact-title">Stay in our orbit<span className="accent">.</span></h2><a className="contact-orbit" href={`mailto:${site.contact.email}`} aria-label={`Email ${site.contact.label}`}><Icon name="diagonal" width="24" height="24" /></a></div>
    <div className="footer-grid">
      <div><h3>Contact us</h3><a className="email-link" href={`mailto:${site.contact.email}`}>{site.contact.email}</a><p>{site.contact.label} · Event enquiries</p></div>
      <div><h3>Connect with Stellar</h3><ul>{site.socials.map(social => <li key={social.label}><a href={social.url} target="_blank" rel="noopener noreferrer">{social.label}<Icon name="diagonal" width="14" height="14" /><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></div>
      <div className="footer-credits"><h3>Built by the Aerovate Tech Team</h3><ul>{site.developers.map(person => <li key={person.name}><span className="credit-name">{person.name}</span><span className="credit-profiles">{person.profiles.map(profile => <a key={profile.label} href={profile.url} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on ${profile.label} (opens in a new tab)`}>{profile.label}<Icon name="diagonal" width="11" height="11" /></a>)}</span></li>)}</ul></div>
    </div>
    <div className="footer-wordmark" aria-hidden="true"><span className="footer-letters">{Array.from('AEROVATE', (letter, i) => <i key={i} style={{ '--li': i } as CSSProperties}>{letter}</i>)}</span><span>↗</span></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Aerovate</span><span>Made of curiosity. Built together.</span><Link to="/#home">Back to top ↑</Link></div>
  </footer>;
}
