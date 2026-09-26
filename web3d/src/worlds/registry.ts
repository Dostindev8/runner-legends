import * as THREE from 'three';
import type { QualityPreset } from '../config';
import {
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';

export type WorldId =
  | 'neon'
  | 'golden'
  | 'ice'
  | 'coliseum'
  | 'abyssal'
  | 'celestial'
  | 'quantum'
  | 'igneous'
  | 'fractal'
  | 'final';

export interface WorldHandle {
  id: WorldId;
  name: string;
  fog: THREE.FogExp2;
  background: THREE.Color;
  ground: THREE.Mesh;
  root: THREE.Group;
  mount(scene: THREE.Scene): void;
  update(dt: number, playerZ: number): void;
  applyQuality(q: QualityPreset): void;
  dispose(scene: THREE.Scene): void;
}

type Geo = THREE.BufferGeometry & {
  computeBoundsTree?: typeof computeBoundsTree;
  disposeBoundsTree?: typeof disposeBoundsTree;
  boundsTree?: unknown;
};

interface Palette {
  sky: string;
  fog: number;
  accent: number;
  ground: number;
  sun: number;
}

const PALETTES: Record<WorldId, Palette> = {
  neon: { sky: '#050218', fog: 0.022, accent: 0xff3cb4, ground: 0x0a1830, sun: 0xff66cc },
  golden: { sky: '#120804', fog: 0.028, accent: 0xffd24a, ground: 0x1a1208, sun: 0xffaa44 },
  ice: { sky: '#040c18', fog: 0.02, accent: 0x9ff0ff, ground: 0x0a2038, sun: 0xaaddff },
  coliseum: { sky: '#100808', fog: 0.018, accent: 0xffb060, ground: 0x1a1010, sun: 0xffcc88 },
  abyssal: { sky: '#020818', fog: 0.03, accent: 0x2ee8c0, ground: 0x021418, sun: 0x44ffcc },
  celestial: { sky: '#0c1430', fog: 0.016, accent: 0xa8c8ff, ground: 0x101830, sun: 0xcce0ff },
  quantum: { sky: '#040c08', fog: 0.024, accent: 0x4aff8a, ground: 0x081810, sun: 0x66ff99 },
  igneous: { sky: '#180404', fog: 0.026, accent: 0xff6030, ground: 0x1a0804, sun: 0xff4422 },
  fractal: { sky: '#080810', fog: 0.02, accent: 0xc850ff, ground: 0x0c0c18, sun: 0xaa66ff },
  final: { sky: '#050018', fog: 0.025, accent: 0xffd24a, ground: 0x0a0018, sun: 0xffee88 },
};

const NAMES: Record<WorldId, string> = {
  neon: 'Distrito Neón',
  golden: 'Valle Dorado',
  ice: 'Cumbres de Hielo',
  coliseum: 'Coliseo',
  abyssal: 'Planeta Abisal',
  celestial: 'Ciudad Celestial',
  quantum: 'Bosque Cuántico',
  igneous: 'Planeta Ígneo',
  fractal: 'Dimensión Fractal',
  final: 'Distrito Final',
};

export async function createWorld(id: WorldId, quality: QualityPreset): Promise<WorldHandle> {
  const pal = PALETTES[id];
  const root = new THREE.Group();
  root.name = `world_${id}`;

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  const sun = new THREE.DirectionalLight(pal.sun, 1.35);
  sun.position.set(6, 14, 4);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(quality.shadowMap, quality.shadowMap);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  root.add(ambient, sun);

  const hemi = new THREE.HemisphereLight(pal.accent, pal.ground, 0.45);
  root.add(hemi);

  // Endless strip ground
  const groundGeo = new THREE.PlaneGeometry(18, 400, 1, 40);
  groundGeo.rotateX(-Math.PI / 2);
  (groundGeo as Geo).computeBoundsTree?.();
  const groundMat = new THREE.MeshToonMaterial({ color: pal.ground });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  ground.position.z = 100;
  root.add(ground);

  // Neon buildings / props — InstancedMesh for draw-call budget
  const box = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshToonMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 0.25 });
  const count = quality.id === 'low' ? 24 : quality.id === 'mid' ? 40 : 64;
  const inst = new THREE.InstancedMesh(box, mat, count);
  inst.castShadow = quality.shadows;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = i * (380 / count);
    const h = 2 + (i % 5) * 1.4;
    dummy.position.set(side * (4.5 + (i % 3) * 0.4), h / 2, z);
    dummy.scale.set(1.2 + (i % 3) * 0.3, h, 1.4);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  root.add(inst);

  // Road markers
  const markGeo = new THREE.BoxGeometry(0.15, 0.04, 1.2);
  const markMat = new THREE.MeshBasicMaterial({ color: 0x22e6ff });
  const marks = new THREE.InstancedMesh(markGeo, markMat, 40);
  for (let i = 0; i < 40; i++) {
    dummy.position.set(0, 0.03, i * 8);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    marks.setMatrixAt(i, dummy.matrix);
  }
  marks.instanceMatrix.needsUpdate = true;
  root.add(marks);

  // Ambient particles (points)
  let points: THREE.Points | null = null;
  const pCount = Math.floor(120 * quality.particles);
  if (pCount > 0) {
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = Math.random() * 200;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    points = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: pal.accent, size: 0.08, transparent: true, opacity: 0.7, sizeAttenuation: true }),
    );
    root.add(points);
  }

  const fog = new THREE.FogExp2(pal.sky, pal.fog * (quality.fogDensity / 0.018));
  const background = new THREE.Color(pal.sky);

  const handle: WorldHandle = {
    id,
    name: NAMES[id],
    fog,
    background,
    ground,
    root,
    mount(scene) {
      scene.add(root);
    },
    update(_dt, playerZ) {
      // Recycle strip: keep ground centered ahead of player
      const gz = Math.floor(playerZ / 50) * 50 + 100;
      ground.position.z = gz;
      if (points) {
        const arr = points.geometry.attributes.position;
        if (arr) {
          for (let i = 0; i < arr.count; i++) {
            let z = arr.getZ(i);
            if (z < playerZ - 10) z += 200;
            arr.setZ(i, z);
          }
          arr.needsUpdate = true;
        }
      }
    },
    applyQuality(q) {
      sun.castShadow = q.shadows;
      sun.shadow.mapSize.set(q.shadowMap, q.shadowMap);
      fog.density = pal.fog * (q.fogDensity / 0.018);
    },
    dispose(scene) {
      scene.remove(root);
      root.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh || o instanceof THREE.Points) {
          const geo = o.geometry as Geo;
          geo.disposeBoundsTree?.();
          geo.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else (m as THREE.Material).dispose();
        }
      });
    },
  };

  return handle;
}
