import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './rocket-model.css';

const ASSET_BASE = '/assets/rocket-model/';
const CANVAS_LABEL = 'Interactive 3D model of the VIT Stellar rocket. Drag to rotate.';

type Status = 'loading' | 'ready' | 'error';

function disposeObject(root: THREE.Object3D): void {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    }
  });
}

export default function ModelViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setStatus('error');
      return;
    }

    let disposed = false;
    let raf = 0;
    let model: THREE.Object3D | null = null;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', CANVAS_LABEL);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    camera.position.set(0, 0.5, 3.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;

    const ambient = new THREE.AmbientLight(0xffffff, 1.1);
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(2, 3, 4);
    const fill = new THREE.DirectionalLight(0xbbd7ed, 1);
    fill.position.set(-3, -1, -2);
    scene.add(ambient, key, fill);

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    // ponytail: always-on rAF; switch to render-on-demand if battery/thermals ever matter
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    const fail = () => {
      if (!disposed) setStatus('error');
    };

    new MTLLoader().setPath(ASSET_BASE).load('rocket.mtl', (materials) => {
      if (disposed) return;
      materials.preload();
      new OBJLoader().setMaterials(materials).setPath(ASSET_BASE).load('rocket.obj', (object) => {
        if (disposed) {
          disposeObject(object);
          return;
        }
        model = object;
        // exporter wrote Kd=1/255 on the textured material and flipped face winding
        object.traverse((node) => {
          const mesh = node as THREE.Mesh;
          const materials = (Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []) as THREE.MeshPhongMaterial[];
          for (const material of materials) {
            if (material.map) material.color.set(0xffffff);
            material.side = THREE.DoubleSide;
          }
        });
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const radius = box.getSize(new THREE.Vector3()).length() / 2 || 1;
        // rocket model nose points toward +Z (apex at z=16); stand it upright
        const pivot = new THREE.Group();
        pivot.rotation.x = -Math.PI / 2;
        object.position.sub(center);
        pivot.scale.setScalar(1 / radius);
        pivot.add(object);
        scene.add(pivot);
        setStatus('ready');
        tick();
      }, undefined, fail);
    }, undefined, fail);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      if (model) disposeObject(model);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="model-frame">
    <div className="model-canvas" ref={hostRef} />
    {status === 'loading' && <div className="model-overlay" role="status"><span className="loading-dot" />Loading rocket…</div>}
    {status === 'error' && <div className="model-overlay" role="status">3D view isn’t available on this device — showing the model page instead.</div>}
  </div>;
}
