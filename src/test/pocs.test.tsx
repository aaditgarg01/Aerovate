import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PocsSection } from '../features/pocs/PocsSection';

vi.mock('../features/pocs/data', () => ({
  pocYears: [2025, 2024, 2023],
  pocs: [
    { id: 'fixture-a', name: 'Test Person Alpha', role: 'Fixture lead', year: 2025, photo: '/test/alpha.webp', profileUrl: 'https://www.linkedin.com/in/fixture-alpha/' },
    { id: 'fixture-b', name: 'To be announced', role: 'Fixture POC', year: 2025, placeholder: true },
    { id: 'fixture-c', name: 'Test Person Gamma', role: 'Fixture coordinator', year: 2024, profileUrl: 'https://github.com/fixture-gamma' },
    { id: 'fixture-d', name: 'Test Person Delta', role: 'Fixture volunteer', year: 2024, profileUrl: 'javascript:alert(1)' },
  ],
}));

const filters = () => screen.getByRole('group', { name: 'Show POCs by year' });
const cardNames = () => screen.queryAllByRole('heading', { level: 3 }).map(heading => heading.textContent);

describe('Past-year POC directory', () => {
  it('opens on the latest year and filters by year or all years', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    expect(within(filters()).getByRole('button', { name: '2025' })).toHaveAttribute('aria-pressed', 'true');
    expect(cardNames()).toEqual(['Test Person Alpha', 'To be announced']);
    expect(screen.getByText('2 POCs from 2025')).toBeInTheDocument();

    await user.click(within(filters()).getByRole('button', { name: '2024' }));
    expect(cardNames()).toEqual(['Test Person Gamma', 'Test Person Delta']);
    expect(within(filters()).getByRole('button', { name: '2025' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(within(filters()).getByRole('button', { name: 'All years' }));
    expect(cardNames()).toHaveLength(4);
    expect(screen.getByText('4 POCs across all years')).toBeInTheDocument();
  });

  it('works from the keyboard', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    within(filters()).getByRole('button', { name: '2025' }).focus();
    await user.tab();
    expect(within(filters()).getByRole('button', { name: '2024' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(cardNames()).toEqual(['Test Person Gamma', 'Test Person Delta']);
  });

  it('shows a clear empty state for a year without records and a way back', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    await user.click(within(filters()).getByRole('button', { name: '2023' }));
    expect(screen.getByRole('heading', { name: 'No POCs listed for 2023 yet.' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'See 2025 POCs' }));
    expect(cardNames()).toEqual(['Test Person Alpha', 'To be announced']);
  });

  it('falls back cleanly when a photograph is missing or fails to load', () => {
    render(<PocsSection />);
    const [alpha, pending] = screen.getAllByRole('listitem');
    const photo = alpha.querySelector('img')!;
    expect(photo).toHaveAttribute('src', '/test/alpha.webp');
    expect(pending.querySelector('img')).toBeNull();
    expect(pending.querySelector('.poc-photo-fallback')).toBeInTheDocument();

    fireEvent.error(photo);
    expect(alpha.querySelector('img')).toBeNull();
    expect(alpha.querySelector('.poc-photo-fallback')).toHaveTextContent('TA');
  });

  it('labels placeholders and only publishes safe, approved profile links', async () => {
    const user = userEvent.setup(); render(<PocsSection />);
    const [alpha, pending] = screen.getAllByRole('listitem');
    const linkedIn = within(alpha).getByRole('link', { name: 'Test Person Alpha on LinkedIn (opens in a new tab)' });
    expect(linkedIn).toHaveAttribute('href', 'https://www.linkedin.com/in/fixture-alpha/');
    expect(linkedIn).toHaveAttribute('target', '_blank');
    expect(linkedIn).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(pending).getByText('Details pending')).toBeInTheDocument();
    expect(within(pending).queryByRole('link')).toBeNull();

    await user.click(within(filters()).getByRole('button', { name: '2024' }));
    const [gamma, delta] = screen.getAllByRole('listitem');
    expect(within(gamma).getByRole('link', { name: /on GitHub/ })).toHaveAttribute('href', 'https://github.com/fixture-gamma');
    expect(within(delta).queryByRole('link')).toBeNull();
  });
});
