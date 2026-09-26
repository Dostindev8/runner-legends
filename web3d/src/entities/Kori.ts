import * as THREE from 'three';

/**
 * Kori Voltz — low-poly stylized proxy (procedural "GLB-ready" silhouette).
 * Replace with public/models/kori.glb when asset pipeline ships; API stays the same.
 */
export function createKoriMesh(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'KoriVoltz';

  const skin = new THREE.MeshToonMaterial({ color: 0xffe0b0 });
  const suit = new THREE.MeshToonMaterial({ color: 0x1a2a4a });
  const neon = new THREE.MeshToonMaterial({
    color: 0x22e6ff,
    emissive: 0x22e6ff,
    emissiveIntensity: 0.55,
  });
  const mag = new THREE.MeshToonMaterial({
    color: 0xff2bd6,
    emissive: 0xff2bd6,
    emissiveIntensity: 0.4,
  });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.42, 4, 10), suit);
  torso.position.y = 0.72;
  torso.castShadow = true;

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.28), neon);
  chest.position.set(0, 0.82, 0.12);
  chest.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), skin);
  head.position.y = 1.22;
  head.castShadow = true;

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mag);
  hair.position.set(0, 1.32, -0.02);
  hair.scale.set(1, 0.7, 1.1);

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.28, 3, 6), suit);
  legL.position.set(-0.12, 0.28, 0);
  const legR = legL.clone();
  legR.position.x = 0.12;

  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 3, 6), neon);
  armL.position.set(-0.38, 0.78, 0);
  armL.rotation.z = 0.25;
  const armR = armL.clone();
  armR.position.x = 0.38;
  armR.rotation.z = -0.25;

  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 8), mag);
  trail.position.set(0, 0.55, -0.45);
  trail.rotation.x = Math.PI / 2;

  root.add(torso, chest, head, hair, legL, legR, armL, armR, trail);
  return root;
}

export function animateKoriRun(mesh: THREE.Group, phase: number): void {
  const legs = mesh.children.filter((c) => c instanceof THREE.Mesh && c.position.y < 0.4);
  if (legs[0]) legs[0].rotation.x = Math.sin(phase) * 0.55;
  if (legs[1]) legs[1].rotation.x = Math.sin(phase + Math.PI) * 0.55;
  mesh.rotation.y = Math.sin(phase * 0.5) * 0.04;
}
