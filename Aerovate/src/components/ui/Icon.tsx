import type { SVGProps } from 'react';

type IconName = 'arrow' | 'diagonal' | 'menu' | 'close' | 'spark' | 'mail' | 'orbit';
const paths: Record<IconName, string> = {
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  diagonal: 'M6 18 18 6M6 6h12v12',
  menu: 'M4 8h16M4 16h16',
  close: 'm6 6 12 12M6 18 18 6',
  spark: 'm12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z',
  mail: 'M3 5h18v14H3zM3 5l9 8 9-8',
  orbit: 'M20 12a8 8 0 1 1-8-8M12 12l8-8M15 4h5v5',
};
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
