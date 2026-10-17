import { useEffect, useState } from 'react';
import { sections } from '../../config/site';

/** Track the section below the fixed header without changing browser history or focus. */
export function useActiveSection(pathname: string) {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (pathname !== '/') return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
      const readingLine = headerHeight + Math.min(120, window.innerHeight * .16);
      let current: string = sections.home;
      for (const id of Object.values(sections)) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= readingLine) current = id;
      }
      setActiveSection(current);
      setIsScrolled(window.scrollY > 32);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Content and header dimensions can change as images load or the layout reflows.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    for (const element of [document.querySelector('header'), document.getElementById('main-content'), document.getElementById(sections.contact)]) {
      if (element) observer?.observe(element);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [pathname]);

  return { activeSection: pathname === '/' ? activeSection : '', isScrolled };
}
