import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from './Icon';

export function Button({ className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' }) {
  return <button className={`button button--${variant} ${className}`} {...props} />;
}

export function ActionLink({ to, children, variant = 'primary' }: { to: string; children: ReactNode; variant?: 'primary' | 'outline' }) {
  return <Link to={to} className={`button button--${variant}`}>{children}<Icon name="arrow" /></Link>;
}

export function Section({ id, number, eyebrow, title, children, className = '' }: { id: string; number: string; eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return <section id={id} tabIndex={-1} aria-labelledby={`${id}-title`} className={`section ${className}`}>
    <div className="section-label"><span>{number} / {eyebrow}</span><Icon name="spark" /></div>
    <div className="section-body"><h2 id={`${id}-title`}>{title}</h2>{children}</div>
  </section>;
}

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...props} />;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><Icon name="orbit" /><h3>{title}</h3><p>{children}</p></div>;
}

export function LoadingState() {
  return <div className="page-status" role="status"><span className="loading-dot" />Preparing your next destination…</div>;
}
