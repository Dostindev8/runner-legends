import * as THREE from 'three';
import { DIFF, PHYSICS, type DiffId } from '../config';

export type ObstacleKind = 'hazard' | 'coin' | 'enemy';

export interface Obstacle {
  kind: ObstacleKind;
  mesh: THREE.Object3D;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  alive: boolean;
}

/**
 * Endless obstacle / coin / enemy spawner with density from DIFF table.
 * Stomp (player falling onto enemy) → KO. Hazard → damage. Coin → collect.
 */
export class ObstacleSystem {
  readonly root = new THREE.Group();
  private items: Obstacle[] = [];
  private nextZ = 18;
  private density = 1;
  private readonly poolHazard: THREE.Mesh;
  private readonly poolCoin: THREE.Mesh;
  private readonly poolEnemy: THREE.Group;

  constructor() {
    this.root.name = 'obstacles';
    this.poolHazard = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshToonMaterial({ color: 0xff3355, emissive: 0x661122, emissiveIntensity: 0.3 }),
    );
    this.poolCoin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16),
      new THREE.MeshToonMaterial({ color: 0xffd24a, emissive: 0xaa8800, emissiveIntensity: 0.45 }),
    );
    this.poolCoin.rotation.z = Math.PI / 2;
    this.poolEnemy = buildEnemyProxy();
  }

  setDifficulty(id: DiffId): void {
    this.density = DIFF[id].density;
  }

  reset(startZ = 12): void {
    for (const o of this.items) this.root.remove(o.mesh);
    this.items = [];
    this.nextZ = startZ;
  }

  update(dt: number, playerZ: number, scroll: number): void {
    const ahead = playerZ + 55;
    while (this.nextZ < ahead) {
      this.spawnAt(this.nextZ);
      const gap = (5.2 + Math.random() * 3.5) / this.density;
      this.nextZ += Math.max(3.8, gap);
    }
    for (const o of this.items) {
      if (!o.alive) continue;
      if (o.kind === 'coin') o.mesh.rotation.y += dt * 3;
      if (o.kind === 'enemy') o.mesh.position.y = o.y + Math.sin(playerZ * 2 + o.z) * 0.08;
      // Despawn behind
      if (o.z < playerZ - 12) {
        o.alive = false;
        this.root.remove(o.mesh);
      }
    }
    this.items = this.items.filter((o) => o.alive);
    void scroll;
  }

  /** Returns events from AABB vs player capsule approx. */
  collidePlayer(px: number, py: number, pz: number, vy: number): { coins: number; kos: number; hits: number } {
    let coins = 0;
    let kos = 0;
    let hits = 0;
    const pw = 0.45;
    const ph = 1.1;
    for (const o of this.items) {
      if (!o.alive) continue;
      const overlapX = Math.abs(px - o.x) < (pw + o.w) * 0.5;
      const overlapZ = Math.abs(pz - o.z) < (0.4 + o.d) * 0.5;
      const feet = py;
      const head = py + ph;
      const oTop = o.y + o.h;
      const oBot = o.y;
      const overlapY = head > oBot && feet < oTop;
      if (!(overlapX && overlapZ && overlapY)) continue;

      if (o.kind === 'coin') {
        o.alive = false;
        this.root.remove(o.mesh);
        coins++;
      } else if (o.kind === 'enemy') {
        // Stomp if falling and feet near top
        if (vy < 0 && feet > oTop - 0.45) {
          o.alive = false;
          this.root.remove(o.mesh);
          kos++;
        } else {
          hits++;
          o.alive = false;
          this.root.remove(o.mesh);
        }
      } else {
        hits++;
      }
    }
    this.items = this.items.filter((o) => o.alive);
    return { coins, kos, hits };
  }

  private spawnAt(z: number): void {
    const lane = (Math.floor(Math.random() * 3) - 1) * 1.35;
    const r = Math.random();
    let kind: ObstacleKind = 'hazard';
    if (r < 0.42) kind = 'coin';
    else if (r < 0.72) kind = 'enemy';

    if (kind === 'coin') {
      const mesh = this.poolCoin.clone();
      const y = 0.9 + Math.random() * 1.2;
      mesh.position.set(lane, y, z);
      mesh.castShadow = true;
      this.root.add(mesh);
      this.items.push({ kind, mesh, x: lane, y: y - 0.2, z, w: 0.5, h: 0.5, d: 0.5, alive: true });
    } else if (kind === 'enemy') {
      const mesh = this.poolEnemy.clone(true);
      const y = 0;
      mesh.position.set(lane, y, z);
      this.root.add(mesh);
      this.items.push({ kind, mesh, x: lane, y: 0, z, w: 0.7, h: 0.95, d: 0.7, alive: true });
    } else {
      const mesh = this.poolHazard.clone();
      const h = 0.7 + Math.random() * 0.8;
      mesh.scale.set(1, h, 1);
      mesh.position.set(lane, h / 2, z);
      mesh.castShadow = true;
      this.root.add(mesh);
      this.items.push({ kind, mesh, x: lane, y: 0, z, w: 0.9, h, d: 0.9, alive: true });
    }
  }

  dispose(): void {
    this.reset();
    this.poolHazard.geometry.dispose();
    (this.poolHazard.material as THREE.Material).dispose();
    this.poolCoin.geometry.dispose();
    (this.poolCoin.material as THREE.Material).dispose();
  }
}

function buildEnemyProxy(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 10, 8),
    new THREE.MeshToonMaterial({ color: 0xaa44ff }),
  );
  body.position.y = 0.45;
  body.castShadow = true;
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  eye.position.set(0.12, 0.55, 0.3);
  g.add(body, eye);
  return g;
}

/** Minimum gap sanity vs jump airtime (paridad Ω.3). */
export function minGapForSpeed(speed: number): number {
  const air = (2 * Math.abs(PHYSICS.jumpVel)) / PHYSICS.gravity;
  return Math.max(3.5, speed * air * 0.55);
}
