import * as THREE from 'three';
import { FLAGS } from '../config';

/** Spring-lag follow camera behind Kori (Summer Afternoon-inspired, endless-runner axis). */
export class FollowCamera {
  private readonly ideal = new THREE.Vector3();
  private readonly vel = new THREE.Vector3();
  private shake = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly offset = new THREE.Vector3(0, 2.8, -7.5),
  ) {}

  update(dt: number, target: THREE.Vector3, reducedMotion = FLAGS.reducedMotion): void {
    this.ideal.copy(target).add(this.offset);
    // critically-damped-ish spring
    const stiffness = reducedMotion ? 18 : 10;
    const damping = reducedMotion ? 12 : 8;
    this.vel.x += (this.ideal.x - this.camera.position.x) * stiffness * dt;
    this.vel.y += (this.ideal.y - this.camera.position.y) * stiffness * dt;
    this.vel.z += (this.ideal.z - this.camera.position.z) * stiffness * dt;
    this.vel.multiplyScalar(Math.max(0, 1 - damping * dt));
    this.camera.position.addScaledVector(this.vel, dt);

    const look = target.clone();
    look.y += 1.1;
    look.z += 4;
    this.camera.lookAt(look);

    if (this.shake > 0 && !reducedMotion) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.5;
      this.shake = Math.max(0, this.shake - dt * 2);
    }
  }

  bump(amount = 0.15): void {
    this.shake = Math.min(0.35, this.shake + amount);
  }

  /** Dolly toward character during SÚPER menu. */
  setPowerFocus(target: THREE.Vector3, t: number): void {
    const close = target.clone().add(new THREE.Vector3(1.2, 1.6, -3.2));
    this.camera.position.lerp(close, t);
    this.camera.lookAt(target.x, target.y + 1, target.z);
  }
}
