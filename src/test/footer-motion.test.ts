import { describe, expect, it } from 'vitest';
import { footerRevealProgress } from '../features/space/motion';

describe('Footer wordmark reveal', () => {
  it('starts on entry and finishes when the whole wordmark is visible', () => {
    expect(footerRevealProgress(900, 300, 800)).toBe(0);
    expect(footerRevealProgress(800, 300, 800)).toBe(0);
    expect(footerRevealProgress(650, 300, 800)).toBe(.5);
    expect(footerRevealProgress(500, 300, 800)).toBe(1);
  });

  it('reaches its final state at the page end on desktop, phones and short viewports', () => {
    for (const [viewport, wordmarkHeight, footerBottomHeight] of [[835, 282, 68], [844, 119, 82], [240, 282, 68]]) {
      const top = viewport - footerBottomHeight - wordmarkHeight;
      expect(footerRevealProgress(top, wordmarkHeight, viewport)).toBe(1);
    }
  });
});
