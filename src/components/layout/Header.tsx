import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { navigation } from '../../config/site';
import { Icon } from '../ui/Icon';
import { useActiveSection } from './useActiveSection';
import './header.css';

export function Header() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const location = useLocation();
  const { activeSection, isScrolled } = useActiveSection(location.pathname);

  useEffect(() => {
    if (!open) return;
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    }
    function outside(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', keydown);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);

  return <header className={`header ${isScrolled ? 'header--scrolled' : ''} ${open ? 'header--open' : ''}`} ref={header}>
    <a className="stellar-brand" href="https://vitstellar.vercel.app/" target="_blank" rel="noopener noreferrer" aria-label="VIT Stellar website (opens in a new tab)">
      <img src="/assets/branding/vit-stellar.webp" alt="" width="40" height="40" /><span>VIT STELLAR</span>
    </a>
    <Link className="brand" to="/" onClick={() => setOpen(false)} aria-label="Aerovate home" title="Aerovate logo placeholder">
      <span className="aerovate-logo-placeholder"><img src="/favicon.svg" alt="" width="26" height="28" /></span><span>AEROVATE</span>
    </Link>
    <button ref={trigger} className="menu-toggle" aria-expanded={open} aria-controls="site-navigation" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} width="24" height="24" /></button>
    <nav id="site-navigation" className="header-menu" aria-label="Main navigation" hidden={!open}>
      <span className="eyebrow">Explore Aerovate</span>
      {navigation.map(({ label, to }, i) => <Link key={to} to={to} onClick={() => setOpen(false)} aria-current={activeSection === (to === '/' ? 'home' : to.split('#')[1]) ? 'location' : undefined}><span className="nav-number" aria-hidden="true">0{i + 1}</span>{label}<Icon name="diagonal" /></Link>)}
      <Link to="/#contact" onClick={() => setOpen(false)} aria-current={activeSection === 'contact' ? 'location' : undefined}><span className="nav-number" aria-hidden="true">06</span>Contact us<Icon name="diagonal" /></Link>
    </nav>
  </header>;
}
