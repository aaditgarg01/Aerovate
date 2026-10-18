import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlimpsesSection } from '../features/glimpses/GlimpsesSection';

vi.mock('../features/glimpses/data', () => ({
  glimpses: [
    { id: 'fixture-one', src: '/test/one.webp', alt: 'Test photograph one', caption: 'Test moment one', year: 2025, width: 1200, height: 800 },
    { id: 'fixture-two', src: '/test/two.webp', alt: 'Test photograph two', caption: 'Test moment two', year: 2024, width: 800, height: 1200 },
  ],
}));

function gridButton(caption: string) {
  return within(screen.getByRole('region', { name: 'Glimpses' })).getAllByRole('button', { name: `Enlarge: ${caption}` }).find(button => button.id.startsWith('glimpse-'))!;
}

describe('Gallery integration', () => {
  it('filters approved photographs by year and restores all years', async () => {
    const user = userEvent.setup(); render(<GlimpsesSection />);
    const filters = screen.getByRole('group', { name: 'Filter photographs by year' });
    await user.click(within(filters).getByRole('button', { name: '2024' }));
    expect(document.getElementById('glimpse-fixture-one')).toBeNull();
    expect(document.getElementById('glimpse-fixture-two')).toBeInTheDocument();
    expect(screen.getByText('1 photograph from 2024')).toBeInTheDocument();
    await user.click(within(filters).getByRole('button', { name: 'All years' }));
    expect(document.getElementById('glimpse-fixture-one')).toBeInTheDocument();
  });

  it('opens the viewer, moves by keyboard, traps focus and restores focus on close', async () => {
    const user = userEvent.setup(); render(<GlimpsesSection />);
    await user.click(gridButton('Test moment one'));
    const dialog = screen.getByRole('dialog', { name: 'Photograph 1 of 2' });
    const close = within(dialog).getByRole('button', { name: 'Close viewer' });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(within(dialog).getByRole('button', { name: 'Next photograph' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('dialog', { name: 'Photograph 2 of 2' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.getElementById('glimpse-fixture-two')).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps the gallery usable when a photo fails to load', () => {
    render(<GlimpsesSection />);
    fireEvent.error(gridButton('Test moment one').querySelector('img')!);
    expect(screen.getByRole('img', { name: 'Photo unavailable: Test moment one' })).toBeInTheDocument();
    expect(document.getElementById('glimpse-fixture-two')).toBeInTheDocument();
  });
});
