const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=<>/';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const running = new WeakSet<Element>();
const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

function glyph(ch: string) {
  if (/[A-Z]/.test(ch)) return pick(UPPER);
  if (/[a-z]/.test(ch)) return pick(LOWER);
  if (/[0-9]/.test(ch)) return pick(DIGITS);
  return ch; // spaces and punctuation keep their shape
}

/**
 * "Decode" the text of an element: characters flicker through random glyphs and lock in from
 * left to right, then the original text is restored exactly. Only text nodes change, so markup,
 * icons and React's own nodes stay in place; a node React updates mid-way is left alone.
 */
export function scrambleText(element: HTMLElement, duration?: number): Promise<void> {
  if (running.has(element)) return Promise.resolve();
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: node => (node.nodeValue?.trim() && !node.parentElement?.closest('svg') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  if (!nodes.length) return Promise.resolve();

  const originals = nodes.map(node => node.nodeValue!);
  const written = [...originals];
  const shown = originals.map(text => Array.from(text));
  const released = nodes.map(() => false);
  const total = originals.reduce((sum, text) => sum + text.length, 0);
  const time = duration ?? Math.min(900, 240 + total * 24);
  running.add(element);
  element.classList.add('fx-scrambling');

  return new Promise(resolve => {
    let start = 0, tick = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const u = Math.min(1, (now - start) / time);
      tick++;
      let index = 0;
      nodes.forEach((node, k) => {
        const chars = Array.from(originals[k]);
        if (released[k] || node.nodeValue !== written[k]) { released[k] = true; index += chars.length; return; }
        chars.forEach((ch, i) => {
          const lockAt = .12 + .88 * ((index + i) / Math.max(1, total));
          shown[k][i] = u >= lockAt ? ch : tick % 2 || shown[k][i] === ch ? glyph(ch) : shown[k][i];
        });
        index += chars.length;
        written[k] = node.nodeValue = u >= 1 ? originals[k] : shown[k].join('');
      });
      if (u < 1) { requestAnimationFrame(step); return; }
      running.delete(element);
      element.classList.remove('fx-scrambling');
      resolve();
    };
    requestAnimationFrame(step);
  });
}
