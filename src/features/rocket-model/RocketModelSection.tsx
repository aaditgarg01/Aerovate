import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Section } from '../../components/ui/Primitives';
import './rocket-model.css';

const ModelViewer = lazy(() => import('./ModelViewer'));

/** VIT Stellar rocket model showcase; drag to rotate. */
export function RocketModelSection() {
  const stage = useRef<HTMLDivElement>(null);
  const [approaching, setApproaching] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setApproaching(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setApproaching(true); observer.disconnect(); }
    }, { rootMargin: '300px' });
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  return <Section id="rocket-model" number="03" eyebrow="In your hands" title="Explore the VIT Stellar rocket.">
    <p className="section-copy">A closer look at the VIT Stellar rocket — drag the model to inspect it from every angle.</p>
    <div className="model-stage" ref={stage}>
      {approaching ? <Suspense fallback={<ModelPlaceholder />}><ModelViewer /></Suspense> : <ModelPlaceholder />}
    </div>
  </Section>;
}

function ModelPlaceholder() {
  return <div className="model-frame"><div className="model-overlay" role="status">Preparing 3D view…</div></div>;
}
