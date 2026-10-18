import { useEffect, useState } from 'react';
import { sections } from '../../config/site';

/** Track the reading position; replace the URL without adding history, scrolling or moving focus. */
export function useActiveSection(pathname: string) {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (pathname !== '/') return;
    let frame = 0;
    let hasScrolled = false;
    const update = () => {
      frame = 0;
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      const readingLine = headerHeight + Math.min(120, window.innerHeight * .16);
      let current: string = sections.home;
      for (const id of Object.values(sections)) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= readingLine) current = id;
      }
      setActiveSection(current);
      if (hasScrolled) {
        const hash = current === sections.home ? '' : `#${current}`;
        if (window.location.hash !== hash) {
          // Passive URL updates must not trigger RouteEffects and scroll back to an anchor.
          // Preserve React Router's history state and the current query string.
          window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${hash}`);
        }
      }
      // Keep the floating header fully visible while the pinned launch sequence is playing.
      const track = document.documentElement.classList.contains('motion-ready') ? document.querySelector('.hero-track') : null;
      const launching = !!track && track.getBoundingClientRect().bottom > headerHeight + 1;
      setIsScrolled(window.scrollY > 32 && !launching);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onScroll = () => { hasScrolled = true; schedule(); };
    schedule();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule);
    // Content and header dimensions can change as images load or the layout reflows.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    for (const element of [document.querySelector('header'), document.getElementById('main-content'), document.getElementById(sections.contact)]) {
      if (element) observer?.observe(element);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [pathname]);

  return { activeSection: pathname === '/' ? activeSection : '', isScrolled };
}
