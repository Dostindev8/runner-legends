import * as THREE from 'three';
import type { QualityPreset } from '../config';
import { createWorld, type WorldId, type WorldHandle } from '../worlds/registry';

export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private current: WorldHandle | null = null;
  private quality: QualityPreset;

  constructor(quality: QualityPreset) {
    this.quality = quality;
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
    this.camera.position.set(-4.5, 3.2, 8);
    this.scene.background = new THREE.Color('#050218');
  }

  setQuality(q: QualityPreset): void {
    this.quality = q;
    if (this.current) this.current.applyQuality(q);
  }

  async loadWorld(id: WorldId): Promise<WorldHandle> {
    if (this.current) {
      this.current.dispose(this.scene);
      this.current = null;
    }
    const handle = await createWorld(id, this.quality);
    handle.mount(this.scene);
    this.current = handle;
    this.scene.fog = handle.fog;
    this.scene.background = handle.background;
    return handle;
  }

  get world(): WorldHandle | null {
    return this.current;
  }

  update(dt: number, playerZ: number): void {
    this.current?.update(dt, playerZ);
  }

  dispose(): void {
    if (this.current) {
      this.current.dispose(this.scene);
      this.current = null;
    }
  }
}
