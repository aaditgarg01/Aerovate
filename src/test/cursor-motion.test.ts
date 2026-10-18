import { describe, expect, it } from 'vitest';
import { damp, spring, turnToward } from '../features/space/cursorMotion';

describe('Rocket cursor motion', () => {
  it('follows the short turn across the angle seam and after repeated rotations', () => {
    for (const rotations of [-20, 0, 20]) {
      const heading = rotations * Math.PI * 2 + Math.PI - .05;
      const next = turnToward(heading, -Math.PI + .05, 15, 1 / 60);
      expect(next - heading).toBeGreaterThan(0);
      expect(next - heading).toBeLessThan(.1);
    }
  });

  it('gives the same spring endpoint at 30, 60 and 144 Hz without overshoot', () => {
    const endpoints = [30, 60, 144].map(fps => {
      let position = 0, velocity = 0;
      for (let i = 0; i < fps; i++) {
        const next = spring(position, velocity, 300, 22, 1 / fps);
        expect(next.position).toBeGreaterThanOrEqual(position);
        expect(next.position).toBeLessThanOrEqual(300);
        ({ position, velocity } = next);
      }
      return position;
    });
    expect(endpoints[0]).toBeCloseTo(endpoints[1], 8);
    expect(endpoints[1]).toBeCloseTo(endpoints[2], 8);
  });

  it('settles steering and thrust consistently across refresh rates', () => {
    const run = (fps: number) => {
      let heading = 0, thrust = 0;
      for (let i = 0; i < fps; i++) {
        heading = turnToward(heading, Math.PI / 2, 15, 1 / fps);
        thrust = damp(thrust, 1, 18, 1 / fps);
      }
      return { heading, thrust };
    };
    expect(run(30).heading).toBeCloseTo(run(144).heading, 8);
    expect(run(30).thrust).toBeCloseTo(run(144).thrust, 8);
  });
});
