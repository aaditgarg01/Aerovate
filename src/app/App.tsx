import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ActionLink, LoadingState } from '../components/ui/Primitives';
import { LandingSection, EventSection } from '../features/landing/LandingSection';
import { ThrustTechSection } from '../features/thrust-tech/ThrustTechSection';
import { GlimpsesSection } from '../features/glimpses/GlimpsesSection';
import { ErrorBoundary } from './ErrorBoundary';
import { RouteEffects } from './RouteEffects';

const PocsPage = lazy(() => import('../features/pocs/PocsPage'));

export function App() {
  return <><a className="skip-link" href="#main-content">Skip to content</a><Header /><RouteEffects />
    <main id="main-content" tabIndex={-1}><ErrorBoundary><Suspense fallback={<LoadingState />}><Routes>
      <Route path="/" element={<><LandingSection /><div className="page-container"><ThrustTechSection /><EventSection /><GlimpsesSection /></div></>} />
      <Route path="/pocs" element={<PocsPage />} />
      <Route path="*" element={<div className="page-status"><span className="eyebrow">404 / Off course</span><h1>A little beyond our orbit.</h1><p>That page doesn’t exist. Let’s get you back to the launchpad.</p><ActionLink to="/">Return home</ActionLink></div>} />
    </Routes></Suspense></ErrorBoundary></main><Footer />
  </>;
}
