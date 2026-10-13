import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Aerovate could not render this page.', error, info.componentStack); }
  render() {
    return this.state.failed ? <div className="page-status" role="alert"><h1>A small detour.</h1><p>This page could not load. Please try again.</p><a className="button button--primary" href="/">Return home</a></div> : this.props.children;
  }
}
