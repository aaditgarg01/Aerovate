import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from '../app/App';
import { clampProgress } from '../features/rocket/types';

function renderAt(path = '/') { return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>); }

describe('Shared foundation', () => {
  it('opens the navigation menu and returns focus on Escape', async () => {
    const user = userEvent.setup(); renderAt();
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const mobile = screen.getByRole('navigation', { name: 'Main navigation' });
    within(mobile).getByRole('link', { name: 'Past POCs' }).focus();
    await user.keyboard('{Escape}');
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });

  it('closes the menu and focuses Past POCs without leaving the home page', async () => {
    const user = userEvent.setup(); renderAt();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Past POCs' }));
    expect(await screen.findByRole('heading', { name: 'Every launch has a team.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(document.getElementById('pocs')).toHaveFocus());
    expect(screen.getByRole('heading', { level: 1, name: 'Ideas take flight.' })).toBeInTheDocument();
    expect(document.title).toBe('Aerovate — Ideas take flight');
  });

  it('navigates from the POC anchor to another section and moves focus', async () => {
    const user = userEvent.setup(); renderAt('/#pocs');
    await screen.findByRole('heading', { name: 'Every launch has a team.' });
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Thrust Tech' }));
    await waitFor(() => expect(document.getElementById('thrust-tech')).toHaveFocus());
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('redirects legacy /pocs visits to the home section and preserves contact links', async () => {
    renderAt('/pocs');
    await waitFor(() => expect(document.getElementById('pocs')).toHaveFocus());
    expect(screen.getByRole('heading', { level: 1, name: 'Ideas take flight.' })).toBeInTheDocument();
    expect(within(document.getElementById('pocs')!).getByRole('heading', { name: 'Every launch has a team.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'astronomy@vit.ac.in' })).toHaveAttribute('href', 'mailto:astronomy@vit.ac.in');
    expect(screen.getByRole('link', { name: /Instagram/ })).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders every event section in one continuous home-page flow', () => {
    renderAt();
    expect(Array.from(document.querySelectorAll('main #home, main #thrust-tech, main #event, main #pocs, main #glimpses')).map(section => section.id)).toEqual(['home', 'thrust-tech', 'event', 'pocs', 'glimpses']);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.getElementById('thrust-tech')?.closest('.page-container')).toBeNull();
    expect(document.getElementById('thrust-tech')?.closest('.page-sheet')).not.toBeNull();
    expect(document.getElementById('thrust-tech')).not.toHaveClass('tt-js');
    expect(screen.getByRole('heading', { level: 2, name: 'Meet Thrust Tech.' })).toBeInTheDocument();
    expect(within(document.getElementById('site-navigation')!).getByRole('link', { name: 'Past POCs', hidden: true })).toHaveAttribute('href', '/#pocs');
  });

  it('scrolls the event legacy link to the POC section', async () => {
    const user = userEvent.setup(); renderAt();
    await user.click(screen.getByRole('link', { name: 'Meet past POCs' }));
    await waitFor(() => expect(document.getElementById('pocs')).toHaveFocus());
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('focuses the gallery anchor while keeping all sections available', async () => {
    const user = userEvent.setup(); renderAt();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Glimpses' }));
    await waitFor(() => expect(document.getElementById('glimpses')).toHaveFocus());
    expect(screen.getByRole('heading', { level: 2, name: 'Glimpses' })).toBeInTheDocument();
  });

  it('offers a working route home for unknown URLs', async () => {
    const user = userEvent.setup(); renderAt('/lost-in-space');
    expect(screen.getByRole('heading', { name: 'A little beyond our orbit.' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Return home' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Ideas take flight.' })).toBeInTheDocument();
  });

  it('honours reduced motion when navigating to sections', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: query.includes('prefers-reduced-motion'), media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    renderAt('/#contact');
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'instant', block: 'start' }));
  });
});

describe('Rocket / scroll handoff', () => {
  it('keeps out-of-range and invalid progress safe for the renderer', () => {
    expect([-2, 0, .4, 1, 3, NaN, Infinity].map(clampProgress)).toEqual([0, 0, .4, 1, 1, 0, 0]);
  });
});


describe('Scroll-aware navigation', () => {
  it('follows sections down and back up, even when the URL hash points elsewhere', async () => {
    let scroll = 0;
    const offsets: Record<string, number> = { home: 0, 'thrust-tech': 900, event: 1350, pocs: 1800, glimpses: 2250, contact: 2750 };
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.tagName === 'HEADER') return new DOMRect(0, 0, 1200, 112);
      return new DOMRect(0, (offsets[this.id] ?? 10000) - scroll, 1200, 450);
    });
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scroll);
    renderAt('/#pocs');
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const steps = [['home', 'Home'], ['thrust-tech', 'Thrust Tech'], ['event', 'The event'], ['pocs', 'Past POCs'], ['glimpses', 'Glimpses']] as const;
    for (const [id, label] of [...steps, ...steps.slice().reverse()]) {
      scroll = Math.max(0, offsets[id] - 120);
      fireEvent.scroll(window);
      await waitFor(() => expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'location'));
      expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
    }
    scroll = offsets.contact - 120;
    fireEvent.resize(window);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute('aria-current', 'location'));
    expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
    expect(document.querySelector('header')).toHaveClass('header--scrolled');
    // Scroll tracking never moves keyboard focus away from the deep-linked section.
    expect(document.getElementById('pocs')).toHaveFocus();
    expect(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Contact us' })).toHaveAttribute('aria-current', 'location');
  });

  it('does not highlight a home-page destination on the 404 screen', async () => {
    renderAt('/lost-in-space');
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('navigation', { name: 'Main navigation' }).querySelector('[aria-current]')).toBeNull();
    expect(screen.getByRole('link', { name: 'Contact us' })).not.toHaveAttribute('aria-current');
  });
});


describe('Compact team footer and shared menu', () => {
  it('closes the menu when clicking outside the header', async () => {
    const user = userEvent.setup(); renderAt();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });

  it('shows names and supplied profile links without contribution descriptions', () => {
    renderAt();
    const footer = document.querySelector('footer')!;
    expect(within(footer).getAllByRole('link', { name: /on GitHub/ })).toHaveLength(7);
    expect(within(footer).getAllByRole('link', { name: /on LinkedIn/ })).toHaveLength(7);
    expect(within(footer).getByRole('link', { name: /Aadit Garg on LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/aadit-garg22/');
    expect(within(footer).getByRole('link', { name: /Rishit Aggarwal on LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/rishit-aggarwal-88504b419/');
    for (const link of footer.querySelectorAll('.credit-profiles a')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(footer).not.toHaveTextContent('Foundation, UI, integration');
    expect(footer).not.toHaveTextContent('Background artwork');
    expect(footer.querySelectorAll('.footer-letters i')).toHaveLength(8);
  });
});
