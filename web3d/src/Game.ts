import {
  DIFF,
  PHYSICS,
  QUALITY,
  detectQuality,
  type DiffId,
  type QualityId,
} from './config';
import { RendererHost } from './core/Renderer';
import { Loop } from './core/Loop';
import { SceneManager } from './core/SceneManager';
import { InputSystem } from './systems/InputSystem';
import { CharacterController } from './systems/CharacterController';
import { FollowCamera } from './systems/FollowCamera';
import { PowerSystem } from './systems/PowerSystem';
import { PortalSystem, WORLDS } from './systems/PortalSystem';
import { WorldRulesSystem, buildRuntime } from './systems/WorldRulesSystem';
import { AudioSystem } from './systems/AudioSystem';
import { DomBridge } from './ui/DomBridge';
import type { WorldId } from './worlds/registry';

export class Game {
  private readonly ui = new DomBridge();
  private readonly input = new InputSystem();
  private readonly audio = new AudioSystem();
  private readonly portal = new PortalSystem();
  private qualityId: QualityId = detectQuality();
  private diffId: DiffId = 'normal';
  private renderer!: RendererHost;
  private scenes!: SceneManager;
  private loop!: Loop;
  private player!: CharacterController;
  private cam!: FollowCamera;
  private powers!: PowerSystem;
  private rules!: WorldRulesSystem;
  private playing = false;
  private hp = PHYSICS.maxHP;
  private coins = 0;
  private ko = 0;
  private iframes = 0;
  private unlocked = ['neon'];
  private worldId: WorldId = 'neon';
  private portalUsed = false;

  async boot(): Promise<void> {
    this.ui.setBoot(5);
    const canvas = this.ui.els.canvas;
    if (!canvas) throw new Error('Missing #rl3d-canvas');

    this.renderer = new RendererHost(canvas);
    this.ui.setBoot(20);
    // WebGPU optional — never block boot
    void this.renderer.tryWebGPU();
    this.renderer.applyQuality(QUALITY[this.qualityId]);

    this.scenes = new SceneManager(QUALITY[this.qualityId]);
    this.ui.setBoot(40);

    const rt = buildRuntime('neon', 'clear_night', 'extreme_speed', 1.08, 1);
    this.rules = new WorldRulesSystem(rt);
    this.player = new CharacterController(rt);
    this.player.setDifficulty(this.diffId);
    this.cam = new FollowCamera(this.scenes.camera);

    this.powers = new PowerSystem(
      (paused) => {
        if (paused) this.loop.pause();
        else this.loop.resume();
      },
      () => {
        this.ui.closePowerMenu();
        this.audio.uiBeep(700, 0.08);
      },
    );

    this.loop = new Loop((dt) => this.tick(dt));
    this.bindUi();
    this.ui.setBoot(70);

    await this.scenes.loadWorld('neon');
    const w = this.scenes.world;
    if (w) {
      this.scenes.scene.add(this.player.mesh);
      this.player.setGroundMesh(w.ground);
    }
    this.ui.setBoot(100);
    this.drawBootPreview();
    await sleep(280);
    this.ui.hideBoot();
    this.resize();
    window.addEventListener('resize', this.resize);
    this.loop.start();
    this.loop.pause(); // wait for play
  }

  private bindUi(): void {
    const { touchLeft, touchJump, touchRight, superBtn, play, resultsRetry } = this.ui.els;
    if (touchLeft && touchJump && touchRight) {
      this.input.bindTouch(touchLeft, touchJump, touchRight, superBtn ?? undefined);
    }
    this.ui.bindDiffQuality(
      (d) => { this.diffId = d; this.player.setDifficulty(d); },
      (q) => {
        this.qualityId = q;
        this.renderer.applyQuality(QUALITY[q]);
        this.scenes.setQuality(QUALITY[q]);
      },
    );
    play?.addEventListener('click', () => this.startRun());
    resultsRetry?.addEventListener('click', () => {
      this.ui.hideResults();
      this.startRun();
    });
    window.addEventListener('pointerdown', () => this.audio.warm(), { once: true });
  }

  private startRun(): void {
    this.audio.warm();
    this.audio.startAmbient(220);
    this.playing = true;
    this.hp = PHYSICS.maxHP;
    this.coins = 0;
    this.ko = 0;
    this.iframes = 0;
    this.player.reset();
    this.portalUsed = false;
    this.ui.showMenu(false);
    this.ui.hideResults();
    this.loop.resume();
    this.audio.uiBeep(520, 0.05);
  }

  private tick(dt: number): void {
    this.input.pollGamepad();
    if (!this.playing) {
      this.renderer.render(this.scenes.scene, this.scenes.camera);
      return;
    }

    if (this.input.consumeSuper() && this.powers.tryOpenMenu()) {
      this.ui.openPowerMenu(this.powers.list(), (id) => this.powers.select(id));
      return;
    }

    this.player.update(dt, this.input);
    this.scenes.update(dt, this.player.position.z);
    this.cam.update(dt, this.player.position);

    // Passive coin drip for SÚPER feel (placeholder until coin entities)
    if (Math.random() < 0.02 * DIFF[this.diffId].density) {
      this.coins += 1;
      this.powers.addCharge(0.012);
      this.audio.coin();
    }
    this.powers.tick(dt, 0);
    this.iframes = Math.max(0, this.iframes - dt);

    // Portal at distance (once per run segment)
    if (!this.portalUsed && this.player.distance >= PHYSICS.portalAt) {
      this.portalUsed = true;
      const next = this.portal.resolve({
        originId: this.worldId,
        difficultyId: this.diffId,
        unlockedIds: this.unlocked,
      });
      void this.transitionWorld(next.worldId as WorldId, next);
    }

    // Stage clear
    const cleared =
      this.ko >= PHYSICS.stageKills || this.player.distance >= PHYSICS.stageDist;
    if (cleared || this.hp <= 0) {
      this.endRun(cleared && this.hp > 0);
    }

    this.ui.setHud({
      hp: this.hp,
      coins: this.coins,
      dist: this.player.distance,
      world: this.scenes.world?.name ?? '—',
      diff: this.diffId,
      ko: this.ko,
      superCharge: this.powers.charge,
    });

    this.renderer.render(this.scenes.scene, this.scenes.camera);
  }

  private async transitionWorld(id: WorldId, rt: ReturnType<typeof buildRuntime>): Promise<void> {
    this.rules.apply(rt);
    this.player.setRuntime(rt);
    this.worldId = id;
    if (!this.unlocked.includes(id)) this.unlocked.push(id);
    this.scenes.scene.remove(this.player.mesh);
    await this.scenes.loadWorld(id);
    const w = this.scenes.world;
    if (w) {
      this.scenes.scene.add(this.player.mesh);
      this.player.setGroundMesh(w.ground);
    }
    this.audio.startAmbient(WORLDS.find((x) => x.id === id)?.difficulty === 1 ? 220 : 160);
  }

  private endRun(cleared: boolean): void {
    this.playing = false;
    this.loop.pause();
    this.audio.stopAmbient();
    this.ui.showResults(cleared, [
      `Distancia ${Math.floor(this.player.distance)} m`,
      `Monedas ${this.coins} · ×${DIFF[this.diffId].reward.toFixed(2)}`,
      `KO ${this.ko}/${PHYSICS.stageKills}`,
      `Mundo ${this.scenes.world?.name ?? this.worldId}`,
      'Logic Code Spot · Dostin Santana',
    ]);
  }

  private resize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.scenes.camera.aspect = w / Math.max(1, h);
    this.scenes.camera.updateProjectionMatrix();
    this.renderer.resize(w, h);
  };

  private drawBootPreview(): void {
    const c = document.getElementById('boot-preview') as HTMLCanvasElement | null;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 320, 180);
    g.addColorStop(0, '#050218');
    g.addColorStop(1, '#1a0750');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 320, 180);
    ctx.fillStyle = 'rgba(34,230,255,0.35)';
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(20 + i * 24, 80 - (i % 4) * 18, 14, 40 + (i % 3) * 20);
    }
    ctx.fillStyle = '#ff2bd6';
    ctx.beginPath();
    ctx.arc(160, 130, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  dispose(): void {
    this.loop.dispose();
    this.input.dispose();
    this.audio.dispose();
    this.player.dispose();
    this.scenes.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.resize);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
