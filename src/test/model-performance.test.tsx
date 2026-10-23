import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { frameHarness } from './animationHarness';
import ModelViewer from '../features/rocket-model/ModelViewer';
import { RocketModelSection } from '../features/rocket-model/RocketModelSection';

const gpu = vi.hoisted(() => ({ render: vi.fn(), dispose: vi.fn(), create: vi.fn(), controls: [] as Array<{ change: () => void; dispose: () => void }> }));
vi.mock('three', async original => {
  const actual = await original<typeof import('three')>();
  return { ...actual, WebGLRenderer: class {
    domElement = document.createElement('canvas');
    constructor() { gpu.create(); }
    setPixelRatio() {} setSize() {}
    render = gpu.render; dispose = gpu.dispose;
  } };
});
vi.mock('three/addons/loaders/MTLLoader.js', () => ({ MTLLoader: class {
  setPath() { return this; }
  load(_name: string, done: (m: { preload: () => void }) => void) { done({ preload() {} }); }
} }));
vi.mock('three/addons/loaders/OBJLoader.js', async () => {
  const { Group } = await import('three');
  return { OBJLoader: class {
    setPath() { return this; } setMaterials() { return this; }
    load(_name: string, done: (o: InstanceType<typeof Group>) => void) { done(new Group()); }
  } };
});
vi.mock('three/addons/controls/OrbitControls.js', () => ({ OrbitControls: class {
  autoRotate = false;
  listeners = new Set<() => void>();
  constructor() { gpu.controls.push(this); }
  change = () => this.listeners.forEach(fn => fn());
  // Actual controls emit change during update: this must not create duplicate RAF chains.
  update() { if (this.autoRotate) this.change(); return this.autoRotate; }
  addEventListener(_name: string, fn: () => void) { this.listeners.add(fn); }
  removeEventListener(_name: string, fn: () => void) { this.listeners.delete(fn); }
  dispose = vi.fn();
} }));
let reduced = false;
beforeEach(() => {
  gpu.render.mockClear(); gpu.dispose.mockClear(); gpu.create.mockClear(); gpu.controls.length = 0;
  reduced = false;
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { get matches() { return reduced; } }));
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(480);
});
afterEach(() => vi.unstubAllGlobals());

it('runs one visible render loop and performs zero GPU work offscreen or in a background tab', () => {
  const rig = frameHarness();
  const view = render(<ModelViewer />);
  const canvas = view.container.querySelector('.model-canvas')!;
  expect(rig.frames.size).toBe(0);
  rig.enter(canvas, true); rig.step(5);
  expect(gpu.render).toHaveBeenCalledTimes(5);
  expect(rig.frames.size).toBe(1);
  rig.enter(canvas, false); rig.step(120);
  expect(gpu.render).toHaveBeenCalledTimes(5);
  expect(rig.frames.size).toBe(0);
  rig.enter(canvas, true); rig.background(true); rig.step(120);
  expect(gpu.render).toHaveBeenCalledTimes(5);
  rig.background(false); rig.step();
  expect(gpu.render).toHaveBeenCalledTimes(6);
  view.unmount();
  expect(rig.frames.size).toBe(0);
  expect(gpu.dispose).toHaveBeenCalledOnce();
  expect(gpu.controls[0].dispose).toHaveBeenCalledOnce();
});
it('renders reduced-motion views only on demand, including manual rotation', () => {
  reduced = true;
  const rig = frameHarness();
  const view = render(<ModelViewer />);
  rig.enter(view.container.querySelector('.model-canvas')!, true); rig.step(60);
  expect(gpu.render).toHaveBeenCalledOnce();
  expect(rig.frames.size).toBe(0);
  act(() => gpu.controls[0].change()); rig.step(60);
  expect(gpu.render).toHaveBeenCalledTimes(2);
  expect(rig.frames.size).toBe(0);
  view.unmount();
});
it('does not initialize WebGL until the rocket section approaches the viewport', async () => {
  const rig = frameHarness();
  const view = render(<RocketModelSection />);
  expect(gpu.create).not.toHaveBeenCalled();
  expect(view.container.querySelector('.model-canvas')).toBeNull();
  rig.enter(view.container.querySelector('.model-stage')!, true);
  await waitFor(() => expect(view.container.querySelector('.model-canvas')).not.toBeNull());
  expect(gpu.create).toHaveBeenCalledOnce();
  expect(rig.frames.size).toBe(0);
  view.unmount();
});
