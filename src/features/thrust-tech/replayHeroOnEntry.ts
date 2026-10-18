/** Replay the entrance when the logo returns, without hiding content while leaving. */
export function replayHeroOnEntry(hero: HTMLElement, logo: HTMLElement, id: string, reducedMotion: boolean) {
  const play = () => {
    hero.classList.remove('tt-go');
    void hero.offsetWidth;
    hero.classList.add('tt-go');
  };
  if (reducedMotion) {
    hero.classList.add('tt-go');
    return () => {};
  }
  let visible = false;
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) visible = false;
    else if (entry.intersectionRatio >= .25 && !visible) {
      visible = true;
      play();
    }
  }, { threshold: [0, .25] });
  observer.observe(logo);
  const onClick = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest('a');
    if (link?.getAttribute('href')?.endsWith(`#${id}`) && visible) play();
    // An offscreen logo replays through the observer when navigation brings it back.
  };
  document.addEventListener('click', onClick);
  return () => {
    observer.disconnect();
    document.removeEventListener('click', onClick);
  };
}
