import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from '../app/App';
import { clampProgress } from '../features/rocket/types';

function renderAt(path = '/') { return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>); }

describe('Shared foundation', () => {
  it('opens the mobile navigation and returns focus on Escape', async () => {
    const user = userEvent.setup(); renderAt();
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const mobile = screen.getByRole('navigation', { name: 'Mobile navigation' });
    within(mobile).getByRole('link', { name: 'Past POCs' }).focus();
    await user.keyboard('{Escape}');
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });

  it('closes the menu and focuses Past POCs without leaving the home page', async () => {
    const user = userEvent.setup(); renderAt();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Mobile navigation' })).getByRole('link', { name: 'Past POCs' }));
    expect(await screen.findByRole('heading', { name: 'Every launch has a team.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(document.getElementById('pocs')).toHaveFocus());
    expect(screen.getByRole('heading', { level: 1, name: 'Ideas take flight.' })).toBeInTheDocument();
    expect(document.title).toBe('Aerovate — Ideas take flight');
  });

  it('navigates from the POC anchor to another section and moves focus', async () => {
    const user = userEvent.setup(); renderAt('/#pocs');
    await screen.findByRole('heading', { name: 'Every launch has a team.' });
    await user.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Thrust Tech' }));
    await waitFor(() => expect(document.getElementById('thrust-tech')).toHaveFocus());
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('redirects legacy /pocs visits to the home section and preserves contact links', async () => {
    renderAt('/pocs');
    await waitFor(() => expect(document.getElementById('pocs')).toHaveFocus());
    expect(screen.getByRole('heading', { level: 1, name: 'Ideas take flight.' })).toBeInTheDocument();
    expect(screen.getByText('Our story, through its people.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'astronomy@vit.ac.in' })).toHaveAttribute('href', 'mailto:astronomy@vit.ac.in');
    expect(screen.getByRole('link', { name: /Instagram/ })).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders every event section in one continuous home-page flow', () => {
    renderAt();
    expect(Array.from(document.querySelectorAll('main section')).map(section => section.id)).toEqual(['home', 'thrust-tech', 'event', 'pocs', 'glimpses']);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Past POCs' })).toHaveAttribute('href', '/#pocs');
  });

  it('scrolls the event legacy link to the POC section', async () => {
    const user = userEvent.setup(); renderAt();
    await user.click(screen.getByRole('link', { name: 'Meet past POCs' }));
    await waitFor(() => expect(document.getElementById('pocs')).toHaveFocus());
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('offers a working route home for unknown URLs', async () => {
    const user = userEvent.setup(); renderAt('/lost-in-space');
    expect(screen.getByRole('heading', { name: 'A little beyond our orbit.' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Return home' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Ideas take flight.' })).toBeInTheDocument();
  });

  it('honours reduced motion when navigating to sections', async () => {
    vi.mocked(window.matchMedia).mockImplementationOnce(query => ({ matches: query.includes('prefers-reduced-motion'), media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    renderAt('/#contact');
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'instant', block: 'start' }));
  });
});

describe('Rocket / scroll handoff', () => {
  it('keeps out-of-range and invalid progress safe for the renderer', () => {
    expect([-2, 0, .4, 1, 3, NaN, Infinity].map(clampProgress)).toEqual([0, 0, .4, 1, 1, 0, 0]);
  });
});
