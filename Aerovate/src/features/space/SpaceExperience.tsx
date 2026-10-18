import { useEffect, useState } from 'react';
import { RocketScene } from '../rocket/RocketScene';

/** Member 4 owns the scroll producer/background. Initial handoff intentionally stays static. */
export function SpaceExperience() {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  return <RocketScene progress={0} reducedMotion={reducedMotion} />;
}
