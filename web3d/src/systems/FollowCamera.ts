import * as THREE from 'three';
import { FLAGS } from '../config';

/** Spring-lag follow camera — snaps on first frame so menu never shows empty void. */
export class FollowCamera {
  private readonly ideal = new THREE.Vector3();
  private readonly vel = new THREE.Vector3();
  private shake = 0;
  private booted = false;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly offset = new THREE.Vector3(0, 3.2, -8.5),
  ) {}

  snap(target: THREE.Vector3): void {
    this.ideal.copy(target).add(this.offset);
    this.camera.position.copy(this.ideal);
    this.vel.set(0, 0, 0);
    this.look(target);
    this.booted = true;
  }

  update(dt: number, target: THREE.Vector3, reducedMotion = FLAGS.reducedMotion): void {
    if (!this.booted) {
      this.snap(target);
      return;
    }
    this.ideal.copy(target).add(this.offset);
    const stiffness = reducedMotion ? 18 : 12;
    const damping = reducedMotion ? 12 : 9;
    this.vel.x += (this.ideal.x - this.camera.position.x) * stiffness * dt;
    this.vel.y += (this.ideal.y - this.camera.position.y) * stiffness * dt;
    this.vel.z += (this.ideal.z - this.camera.position.z) * stiffness * dt;
    this.vel.multiplyScalar(Math.max(0, 1 - damping * dt));
    this.camera.position.addScaledVector(this.vel, dt);
    this.look(target);

    if (this.shake > 0 && !reducedMotion) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.5;
      this.shake = Math.max(0, this.shake - dt * 2);
    }
  }

  private look(target: THREE.Vector3): void {
    this.camera.lookAt(target.x, target.y + 1.2, target.z + 5);
  }

  bump(amount = 0.15): void {
    this.shake = Math.min(0.35, this.shake + amount);
  }
}
