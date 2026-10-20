import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PocsSection } from '../features/pocs/PocsSection';

const longStory = 'A long fixture story about running the event. '.repeat(10);

vi.mock('../features/pocs/data', () => ({
  pocYears: [2026, 2025, 2024, 2023],
  pocs: [
    { id: 'fixture-2026', name: 'Test Person Alpha', role: 'Fixture POC', year: 2026, photo: '/test/alpha.webp', profileUrl: 'https://www.linkedin.com/in/fixture-alpha/', experience: 'A short fixture story.' },
    { id: 'fixture-2025', name: 'To be announced', role: 'Fixture POC', year: 2025, placeholder: true },
    { id: 'fixture-2024', name: 'Test Person Gamma', role: 'Fixture POC', year: 2024, profileUrl: 'javascript:alert(1)', experience: 'A long fixture story about running the event. '.repeat(10) },
  ],
}));

const tab = (year: number) => within(screen.getByRole('tablist', { name: 'Aerovate years' })).getByRole('tab', { name: String(year) });
const panel = () => screen.getByRole('tabpanel');
const shownName = () => within(panel()).queryByRole('heading', { level: 3 })?.textContent;

describe('Past-year POC timeline', () => {
  it('opens on the newest year and switches years from the timeline', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    expect(tab(2026)).toHaveAttribute('aria-selected', 'true');
    expect(panel()).toHaveAttribute('aria-labelledby', 'poc-tab-2026');
    expect(shownName()).toBe('Test Person Alpha');
    expect(within(panel()).getByText('A short fixture story.')).toBeInTheDocument();

    await user.click(tab(2024));
    expect(tab(2024)).toHaveAttribute('aria-selected', 'true');
    expect(tab(2026)).toHaveAttribute('aria-selected', 'false');
    expect(shownName()).toBe('Test Person Gamma');
  });

  it('moves between years with arrow keys, Home and End using a roving tab stop', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    tab(2026).focus();
    await user.keyboard('{ArrowLeft}');
    expect(tab(2025)).toHaveFocus();
    expect(tab(2025)).toHaveAttribute('tabindex', '0');
    expect(tab(2026)).toHaveAttribute('tabindex', '-1');
    expect(shownName()).toBe('To be announced');
    await user.keyboard('{Home}');
    expect(tab(2023)).toHaveFocus();
    await user.keyboard('{End}');
    expect(tab(2026)).toHaveFocus();
    expect(shownName()).toBe('Test Person Alpha');
  });

  it('steps with previous and next buttons and announces the change', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    expect(screen.getByRole('button', { name: 'Next year' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Previous year, 2025' }));
    expect(shownName()).toBe('To be announced');
    expect(screen.getByText('Aerovate 2025: To be announced, Fixture POC')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next year, 2026' }));
    expect(shownName()).toBe('Test Person Alpha');
  });

  it('follows horizontal touch swipes but ignores mouse drags and vertical scrolls', () => {
    render(<PocsSection />);
    const swipe = (pointerType: string, dx: number, dy = 0) => {
      fireEvent.pointerDown(panel(), { pointerType, clientX: 200, clientY: 200 });
      fireEvent.pointerUp(panel(), { pointerType, clientX: 200 + dx, clientY: 200 + dy });
    };
    swipe('touch', 120);
    expect(tab(2025)).toHaveAttribute('aria-selected', 'true');
    swipe('touch', 20, 200);
    expect(tab(2025)).toHaveAttribute('aria-selected', 'true');
    swipe('mouse', 120);
    expect(tab(2025)).toHaveAttribute('aria-selected', 'true');
    swipe('touch', -120);
    expect(tab(2026)).toHaveAttribute('aria-selected', 'true');
  });

  it('shows a clear empty state for a year without a POC', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    await user.click(tab(2023));
    expect(within(panel()).getByRole('heading', { name: 'No POC listed for 2023 yet.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();
  });

  it('expands long experiences and keeps short ones fully visible', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    expect(within(panel()).queryByRole('button', { name: 'Read full experience' })).toBeNull();
    await user.click(tab(2024));
    const toggle = within(panel()).getByRole('button', { name: 'Read full experience' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(panel()).getByText(longStory.trim())).toBeInTheDocument();
    await user.click(toggle);
    expect(within(panel()).getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('falls back cleanly when a photograph is missing or fails to load', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    const photo = panel().querySelector('img')!;
    expect(photo).toHaveAttribute('src', '/test/alpha.webp');
    fireEvent.error(photo);
    expect(panel().querySelector('img')).toBeNull();
    expect(panel().querySelector('.poc-photo-fallback')).toHaveTextContent('TA');
    await user.click(tab(2025));
    expect(panel().querySelector('.poc-photo-fallback svg')).toBeInTheDocument();
    expect(within(panel()).getByText(/experience will be shared here soon/)).toBeInTheDocument();
  });

  it('labels placeholders and only publishes safe, approved profile links', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    const linkedIn = within(panel()).getByRole('link', { name: 'Test Person Alpha on LinkedIn (opens in a new tab)' });
    expect(linkedIn).toHaveAttribute('href', 'https://www.linkedin.com/in/fixture-alpha/');
    expect(linkedIn).toHaveAttribute('target', '_blank');
    expect(linkedIn).toHaveAttribute('rel', 'noopener noreferrer');
    await user.click(tab(2025));
    expect(within(panel()).getByText('Details pending')).toBeInTheDocument();
    expect(within(panel()).queryByRole('link')).toBeNull();
    await user.click(tab(2024));
    expect(within(panel()).queryByRole('link')).toBeNull();
  });
});
