import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function RouteEffects() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    document.title = pathname === '/pocs' ? 'Past POCs — Aerovate' : pathname === '/' ? 'Aerovate — Ideas take flight' : 'Page not found — Aerovate';
    const frame = requestAnimationFrame(() => {
      let id = '';
      try { id = decodeURIComponent(hash.slice(1)); } catch { /* Invalid hash falls back to the page start. */ }
      const target = id ? document.getElementById(id) : null;
      if (target) {
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.getElementById('main-content')?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash, key]);
  return null;
}
