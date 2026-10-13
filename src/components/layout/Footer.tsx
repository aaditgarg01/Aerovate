import { Link } from 'react-router';
import { site } from '../../config/site';
import { Icon } from '../ui/Icon';

export function Footer() {
  return <footer className="footer" id="contact" tabIndex={-1} aria-labelledby="contact-title">
    <div className="footer-top"><div><span className="eyebrow">Stay in our orbit</span><h2 id="contact-title">Great things start<br />with a conversation<span className="accent">.</span></h2></div><a className="contact-orbit" href={`mailto:${site.contact.email}`} aria-label={`Email ${site.contact.label}`}><Icon name="diagonal" width="40" height="40" /></a></div>
    <div className="footer-grid">
      <div><h3>Contact us</h3><a className="email-link" href={`mailto:${site.contact.email}`}>{site.contact.email}</a><p>{site.contact.label} · Event enquiries</p></div>
      <div><h3>Connect with Stellar</h3><ul>{site.socials.map(social => <li key={social.label}><a href={social.url} target="_blank" rel="noopener noreferrer">{social.label}<Icon name="diagonal" width="14" height="14" /><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></div>
      <div><h3>Developed by</h3><p className="footer-team">Aerovate Tech Team</p><ul>{site.developers.map(person => <li key={person.name}><a href={person.url} target="_blank" rel="noopener noreferrer">{person.name}<Icon name="diagonal" width="14" height="14" /><span className="sr-only"> (opens in a new tab)</span></a><span className="credit-role">{person.role}</span></li>)}</ul></div>
    </div>
    <div className="footer-wordmark" aria-hidden="true">AEROVATE<span>↗</span></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Aerovate</span><span>Made of curiosity. Built together.</span><Link to="/#home">Back to top ↑</Link></div>
  </footer>;
}
