/** Frame-rate-independent motion primitives. Velocities use pixels per second. */
export function damp(current: number, target: number, rate: number, seconds: number) {
  return target + (current - target) * Math.exp(-rate * seconds);
}

export function turnToward(current: number, target: number, rate: number, seconds: number) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * (1 - Math.exp(-rate * seconds));
}

/** Exact critically damped spring: stable even when a frame arrives late. */
export function spring(position: number, velocity: number, target: number, rate: number, seconds: number) {
  const offset = position - target;
  const impulse = velocity + rate * offset;
  const decay = Math.exp(-rate * seconds);
  return {
    position: target + (offset + impulse * seconds) * decay,
    velocity: (velocity - rate * impulse * seconds) * decay,
  };
}
