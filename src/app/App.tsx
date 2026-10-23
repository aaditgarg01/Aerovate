import { Navigate, Route, Routes } from 'react-router';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ActionLink } from '../components/ui/Primitives';
import { LandingSection, EventSection } from '../features/landing/LandingSection';
import { AboutSection, HistorySection } from '../features/landing/AboutSections';
import { ThrustTechSection } from '../features/thrust-tech/ThrustTechSection';
import { PocsSection } from '../features/pocs/PocsSection';
import { GlimpsesSection } from '../features/glimpses/GlimpsesSection';
import { ScrollMarquee, ScrollMotion } from '../features/space/ScrollMotion';
import { CursorLayer } from '../features/space/Cursor';
import { TextFx } from '../features/fx/TextFx';
import { RocketModelSection } from '../features/rocket-model/RocketModelSection';
import { ErrorBoundary } from './ErrorBoundary';
import { RouteEffects } from './RouteEffects';

export function App() {
  return <><a className="skip-link" href="#main-content">Skip to content</a><Header /><RouteEffects /><ScrollMotion /><CursorLayer /><TextFx />
    <main id="main-content" tabIndex={-1}><ErrorBoundary><Routes>
      <Route path="/" element={
        <>
          <div className="hero-track"><LandingSection /></div>
          <div className="page-sheet">
            <ScrollMarquee />
            <ThrustTechSection />
            <div className="page-container">
              <EventSection />
              <AboutSection />
              <HistorySection />
              <RocketModelSection />
              <PocsSection />
              <GlimpsesSection />
            </div>
          </div>
        </>
      } />
      <Route path="/pocs" element={<Navigate to="/#pocs" replace />} />
      <Route path="*" element={<div className="page-status"><span className="eyebrow">404 / Off course</span><h1>A little beyond our orbit.</h1><p>That page doesn’t exist. Let’s get you back to the launchpad.</p><ActionLink to="/">Return home</ActionLink></div>} />
    </Routes></ErrorBoundary></main><Footer />
  </>;
}
