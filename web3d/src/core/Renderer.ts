import * as THREE from 'three';
import type { QualityPreset } from '../config';

/**
 * WebGL primary + WebGPU attempt with automatic fallback (r186).
 * PCFShadowMap only — PCFSoftShadowMap removed in r186.
 */
export class RendererHost {
  readonly canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  private usingWebGPU = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.applyColorPipeline();
  }

  private applyColorPipeline(): void {
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
  }

  /** Attempt WebGPU; keep WebGL2 if unavailable. */
  async tryWebGPU(): Promise<boolean> {
    try {
      const mod = (await import('three/webgpu')) as unknown as {
        WebGPURenderer: new (p: { canvas: HTMLCanvasElement }) => {
          init?: () => Promise<void>;
          dispose: () => void;
          outputColorSpace: unknown;
          toneMapping: unknown;
          toneMappingExposure: number;
          shadowMap: { enabled: boolean; type: unknown };
          setPixelRatio: (n: number) => void;
          setSize: (w: number, h: number, u?: boolean) => void;
          render: (s: THREE.Scene, c: THREE.Camera) => void;
        };
      };
      const gpu = new mod.WebGPURenderer({ canvas: this.canvas });
      if (typeof gpu.init === 'function') await gpu.init();
      this.renderer.dispose();
      this.renderer = gpu as unknown as THREE.WebGLRenderer;
      this.applyColorPipeline();
      this.usingWebGPU = true;
      return true;
    } catch {
      this.usingWebGPU = false;
      return false;
    }
  }

  applyQuality(q: QualityPreset): void {
    const dpr = Math.min(window.devicePixelRatio || 1, q.dprMax);
    this.renderer.setPixelRatio(dpr);
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.toneMappingExposure = q.id === 'high' ? 1.1 : 1.05;
  }

  resize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  get isWebGPU(): boolean {
    return this.usingWebGPU;
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
