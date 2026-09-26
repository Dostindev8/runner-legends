import * as THREE from 'three';
import type { QualityPreset } from '../config';

/**
 * Stable WebGL2 only. WebGPU deferred — MeshToon/shadows were blacking out
 * the canvas in some Chromium embeds when swapped mid-boot.
 */
export class RendererHost {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: false,
    });
    this.renderer.setClearColor(0x050218, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
  }

  applyQuality(q: QualityPreset): void {
    const dpr = Math.min(window.devicePixelRatio || 1, q.dprMax);
    this.renderer.setPixelRatio(dpr);
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.toneMappingExposure = q.id === 'high' ? 1.2 : 1.15;
  }

  resize(w: number, h: number): void {
    const ww = Math.max(1, Math.floor(w));
    const hh = Math.max(1, Math.floor(h));
    this.renderer.setSize(ww, hh, false);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
