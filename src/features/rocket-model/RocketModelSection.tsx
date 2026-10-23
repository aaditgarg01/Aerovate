import { lazy, Suspense } from 'react';
import { Section } from '../../components/ui/Primitives';
import './rocket-model.css';

const ModelViewer = lazy(() => import('./ModelViewer'));

/** VIT Stellar rocket model showcase; drag to rotate. */
export function RocketModelSection() {
  return <Section id="rocket-model" number="03" eyebrow="In your hands" title="Explore the VIT Stellar rocket.">
    <p className="section-copy">A closer look at the VIT Stellar rocket — drag the model to inspect it from every angle.</p>
    <Suspense fallback={<div className="model-frame"><div className="model-overlay" role="status"><span className="loading-dot" />Preparing 3D view…</div></div>}>
      <ModelViewer />
    </Suspense>
  </Section>;
}
