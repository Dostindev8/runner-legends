import * as THREE from 'three';
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from 'three-mesh-bvh';
import { createKoriMesh, animateKoriRun } from '../entities/Kori';
import { DIFF, PHYSICS, type DiffId } from '../config';
import type { InputSystem } from './InputSystem';
import type { RuntimeMods } from './WorldRulesSystem';

type GeoProto = THREE.BufferGeometry & {
  computeBoundsTree?: typeof computeBoundsTree;
  disposeBoundsTree?: typeof disposeBoundsTree;
  boundsTree?: unknown;
};
(THREE.BufferGeometry.prototype as GeoProto).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as GeoProto).disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const JUMP_UP = Math.abs(PHYSICS.jumpVel) * PHYSICS.scale;
const DJUMP_UP = Math.abs(PHYSICS.doubleJumpVel) * PHYSICS.scale;

export class CharacterController {
  readonly mesh: THREE.Group;
  readonly position = new THREE.Vector3(0, 1, 0);
  vy = 0;
  onGround = true;
  coyoteT = 0;
  bufferT = 0;
  jumpsUsed = 0;
  distance = 0;
  runSpeed = PHYSICS.runStart * PHYSICS.scale;
  private diff: DiffId = 'normal';
  private runtime: RuntimeMods;
  private groundMesh: THREE.Mesh | null = null;
  private readonly raycaster = new THREE.Raycaster();
  private readonly down = new THREE.Vector3(0, -1, 0);
  private readonly origin = new THREE.Vector3();
  private runPhase = 0;

  constructor(runtime: RuntimeMods) {
    this.runtime = runtime;
    this.mesh = createKoriMesh();
    this.mesh.position.copy(this.position);
  }

  setDifficulty(id: DiffId): void { this.diff = id; }
  setRuntime(rt: RuntimeMods): void { this.runtime = rt; }

  setGroundMesh(mesh: THREE.Mesh): void {
    const geo = mesh.geometry as GeoProto;
    if (!geo.boundsTree) geo.computeBoundsTree?.();
    this.groundMesh = mesh;
  }

  reset(): void {
    this.position.set(0, 1.2, 0);
    this.vy = 0;
    this.onGround = true;
    this.coyoteT = 0;
    this.bufferT = 0;
    this.jumpsUsed = 0;
    this.distance = 0;
    this.runPhase = 0;
    this.runSpeed = PHYSICS.runStart * PHYSICS.scale * this.runtime.speedMul;
    this.mesh.position.copy(this.position);
  }

  update(dt: number, input: InputSystem): void {
    const d = DIFF[this.diff];
    const coyoteMax = Math.max(0.05, d.coyote * (this.runtime.reactionWindow || 1));
    const g = PHYSICS.gravity * PHYSICS.scale * this.runtime.gravityMul;
    const maxJumps = 2 + (this.runtime.extraJump ? 1 : 0);

    const target = PHYSICS.runMax * PHYSICS.scale * this.runtime.speedMul * d.scroll;
    this.runSpeed += (target - this.runSpeed) * Math.min(1, dt * 2.5);
    this.position.z += this.runSpeed * dt;
    this.distance = this.position.z / PHYSICS.scale / 100;

    const lat = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.position.x += lat * 4.2 * dt * this.runtime.friction;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -3.2, 3.2);
    if (this.runtime.lateralPush) {
      this.position.x += this.runtime.lateralPush * PHYSICS.scale * dt * 0.015;
    }

    if (input.consumeJump()) this.bufferT = d.buffer;

    const groundY = this.probeGround();
    if (this.position.y <= groundY + 0.05 && this.vy <= 0) {
      this.position.y = groundY;
      this.vy = 0;
      this.onGround = true;
      this.coyoteT = coyoteMax;
      this.jumpsUsed = 0;
      if (this.runtime.slideOnLand) this.position.x += 0.4 * dt;
    } else {
      this.onGround = false;
      this.coyoteT = Math.max(0, this.coyoteT - dt);
    }

    const canGround = (this.onGround || this.coyoteT > 0) && this.jumpsUsed === 0;
    const canAir = !canGround && this.jumpsUsed > 0 && this.jumpsUsed < maxJumps && this.bufferT > 0;
    if (this.bufferT > 0 && (canGround || canAir)) {
      this.vy = (canAir ? DJUMP_UP : JUMP_UP) * this.runtime.jumpMul;
      this.bufferT = 0;
      this.coyoteT = 0;
      this.jumpsUsed = Math.max(1, this.jumpsUsed + 1);
      this.onGround = false;
    }
    this.bufferT = Math.max(0, this.bufferT - dt);

    if (input.consumeRelease() && this.vy > 0) this.vy *= PHYSICS.jumpCut;

    let grav = g;
    if (Math.abs(this.vy) < PHYSICS.apexThreshold * PHYSICS.scale) grav *= PHYSICS.apexScale;
    this.vy -= grav * dt;
    this.vy = Math.max(-PHYSICS.maxFall * PHYSICS.scale, this.vy);
    this.position.y += this.vy * dt;

    if (this.position.y < groundY) {
      this.position.y = groundY;
      this.vy = 0;
      this.onGround = true;
    }

    this.mesh.position.copy(this.position);
    if (this.onGround) {
      this.runPhase += dt * 10 * (this.runSpeed / (PHYSICS.runStart * PHYSICS.scale));
      animateKoriRun(this.mesh, this.runPhase);
    }
  }

  private probeGround(): number {
    if (!this.groundMesh) return 0;
    this.origin.set(this.position.x, this.position.y + 2, this.position.z);
    this.raycaster.set(this.origin, this.down);
    this.raycaster.far = 8;
    const hits = this.raycaster.intersectObject(this.groundMesh, false);
    return hits[0]?.point.y ?? 0;
  }

  dispose(): void {
    this.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const geo = o.geometry as GeoProto;
        geo.disposeBoundsTree?.();
        geo.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
  }
}
