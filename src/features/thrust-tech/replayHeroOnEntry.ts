const AWAY_TIME = 2000;
const REPLAY_GAP = 10000;
const ENTRANCE_TIME = 4000;

/** Replay on a genuine return to the section, not every time the logo crosses the viewport. */
export function replayHeroOnEntry(hero: HTMLElement, logo: HTMLElement, id: string, reducedMotion: boolean) {
  if (reducedMotion) {
    hero.classList.add('tt-go');
    return () => {};
  }
  const section = document.getElementById(id) ?? hero;
  let visible = false, played = false, pending = false;
  let awaySince: number | null = null;
  let lastPlay = -Infinity;
  const eligibleReturn = () => awaySince !== null && performance.now() - awaySince >= AWAY_TIME && performance.now() - lastPlay >= REPLAY_GAP;
  const maybePlay = () => {
    if (!visible || document.hidden || (played && !pending && !eligibleReturn())) return;
    hero.classList.remove('tt-go');
    void hero.offsetWidth;
    hero.classList.add('tt-go');
    played = true;
    pending = false;
    awaySince = null;
    lastPlay = performance.now();
  };
  const logoObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) visible = false;
    else if (entry.intersectionRatio >= .25) visible = true;
    maybePlay();
  }, { threshold: [0, .25] });
  const sectionObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (eligibleReturn()) pending = true;
      awaySince = null;
      maybePlay();
    } else if (awaySince === null) awaySince = performance.now();
  });
  logoObserver.observe(logo);
  sectionObserver.observe(section);
  const onClick = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest('a');
    if (!link?.getAttribute('href')?.endsWith(`#${id}`) || performance.now() - lastPlay < ENTRANCE_TIME) return;
    pending = true;
    maybePlay();
  };
  document.addEventListener('click', onClick);
  document.addEventListener('visibilitychange', maybePlay);
  return () => {
    logoObserver.disconnect();
    sectionObserver.disconnect();
    document.removeEventListener('click', onClick);
    document.removeEventListener('visibilitychange', maybePlay);
  };
}
