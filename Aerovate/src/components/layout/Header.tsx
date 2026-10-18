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
    const desktop = window.matchMedia('(min-width: 960px)');
    const resize = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener('keydown', keydown);
    document.addEventListener('pointerdown', outside);
    desktop.addEventListener('change', resize);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('pointerdown', outside);
      desktop.removeEventListener('change', resize);
    };
  }, [open]);

  const navLinks = navigation.map(({ label, to }) => {
    const active = activeSection === (to === '/' ? 'home' : to.split('#')[1]);
    return <Link key={to} to={to} onClick={() => setOpen(false)} aria-current={active ? 'location' : undefined}>{label}</Link>;
  });

  return <header className={`header ${location.pathname === '/' && !isScrolled ? 'header--hero' : ''}`} ref={header}>
    <Link className="brand" to="/" onClick={() => setOpen(false)} aria-label="Aerovate home">
      <img src="/favicon.svg" alt="" width="36" height="36" /><span>AEROVATE<span className="brand-subtitle">A journey beyond</span></span>
    </Link>
    <nav className="desktop-nav" aria-label="Main navigation">{navLinks}</nav>
    <Link to="/#contact" className="header-contact" onClick={() => setOpen(false)} aria-label="Contact us" aria-current={activeSection === 'contact' ? 'location' : undefined}><Icon name="diagonal" /></Link>
    <button ref={trigger} className="menu-toggle" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button>
    <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" hidden={!open}>
      <span className="eyebrow">Choose your destination</span>{navLinks}<Link to="/#contact" onClick={() => setOpen(false)} aria-current={activeSection === 'contact' ? 'location' : undefined}>Contact us<Icon name="diagonal" /></Link>
    </nav>
  </header>;
}
