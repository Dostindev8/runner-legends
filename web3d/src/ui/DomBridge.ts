import { DIFF, PHYSICS, type DiffId, type QualityId } from '../config';
import type { PowerDef } from '../systems/PowerSystem';

export class DomBridge {
  readonly els = {
    boot: $('boot'),
    bootFill: $('boot-fill'),
    bootPct: $('boot-pct'),
    root: $('game-root'),
    canvas: $('rl3d-canvas') as HTMLCanvasElement,
    lives: $('hud-lives'),
    coins: $('hud-coins'),
    dist: $('hud-dist'),
    world: $('hud-world'),
    diff: $('hud-diff'),
    ko: $('hud-ko'),
    superFill: $('super-fill'),
    superBtn: $('super-btn') as HTMLButtonElement,
    superAria: $('super-bar-aria'),
    powerMenu: $('power-menu'),
    powerList: $('power-list'),
    powerClose: $('power-close'),
    results: $('results'),
    resultsTitle: $('results-title'),
    resultsStatus: $('results-status'),
    resultsStats: $('results-stats'),
    resultsRetry: $('results-retry'),
    menu: $('menu'),
    play: $('play-btn'),
    touchLeft: $('btn-left'),
    touchJump: $('btn-jump'),
    touchRight: $('btn-right'),
  };

  setBoot(pct: number): void {
    const p = Math.round(Math.min(100, Math.max(0, pct)));
    if (this.els.bootFill) this.els.bootFill.style.width = `${p}%`;
    if (this.els.bootPct) this.els.bootPct.textContent = `${p}%`;
  }

  hideBoot(): void {
    this.els.boot?.classList.add('hidden');
    this.els.boot?.setAttribute('aria-hidden', 'true');
    this.els.root?.classList.remove('hidden');
    this.els.root?.setAttribute('aria-hidden', 'false');
  }

  /** Reveal game root (for canvas sizing) while boot overlay still covers. */
  hideBootPartial(): void {
    this.els.root?.classList.remove('hidden');
    this.els.root?.setAttribute('aria-hidden', 'false');
  }

  setHudVisible(show: boolean): void {
    const hud = document.getElementById('hud');
    const sw = document.getElementById('super-wrap');
    const touch = document.getElementById('touch');
    hud?.classList.toggle('hidden', !show);
    sw?.classList.toggle('hidden', !show);
    touch?.classList.toggle('hidden', !show);
  }

  setHud(s: {
    hp: number;
    coins: number;
    dist: number;
    world: string;
    diff: DiffId;
    ko: number;
    superCharge: number;
  }): void {
    if (this.els.lives) this.els.lives.textContent = '❤'.repeat(Math.max(0, s.hp)) + '♡'.repeat(Math.max(0, PHYSICS.maxHP - s.hp));
    if (this.els.coins) this.els.coins.textContent = `◎ ${s.coins}`;
    if (this.els.dist) this.els.dist.textContent = `${Math.floor(s.dist)} m`;
    if (this.els.world) this.els.world.textContent = s.world;
    if (this.els.diff) this.els.diff.textContent = DIFF[s.diff].chip;
    if (this.els.ko) this.els.ko.textContent = `KO ${s.ko}/${PHYSICS.stageKills}`;
    if (this.els.superFill) this.els.superFill.style.width = `${Math.floor(s.superCharge * 100)}%`;
    if (this.els.superAria) this.els.superAria.setAttribute('aria-valuenow', String(Math.floor(s.superCharge * 100)));
    if (this.els.superBtn) this.els.superBtn.disabled = s.superCharge < 1;
  }

  showMenu(show: boolean): void {
    this.els.menu?.classList.toggle('hidden', !show);
  }

  openPowerMenu(powers: PowerDef[], onPick: (id: string | null) => void): void {
    const list = this.els.powerList;
    const menu = this.els.powerMenu;
    if (!list || !menu) return;
    list.replaceChildren();
    for (const p of powers) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'power-item';
      btn.textContent = `${p.label} — ${p.desc}`;
      btn.addEventListener('click', () => onPick(p.id));
      list.appendChild(btn);
    }
    menu.classList.remove('hidden');
    this.els.powerClose?.addEventListener('click', () => onPick(null), { once: true });
  }

  closePowerMenu(): void {
    this.els.powerMenu?.classList.add('hidden');
  }

  showResults(cleared: boolean, stats: string[]): void {
    if (this.els.resultsTitle) this.els.resultsTitle.textContent = cleared ? 'DISTRITO SUPERADO' : 'CARRERA TERMINADA';
    if (this.els.resultsStatus) {
      this.els.resultsStatus.textContent = cleared
        ? 'Tramo cerrado · mundo siguiente disponible'
        : `Cae o llega a ${PHYSICS.stageDist} m / ${PHYSICS.stageKills} KO`;
    }
    if (this.els.resultsStats) {
      this.els.resultsStats.replaceChildren();
      for (const line of stats) {
        const li = document.createElement('li');
        li.textContent = line;
        this.els.resultsStats.appendChild(li);
      }
    }
    this.els.results?.classList.remove('hidden');
  }

  hideResults(): void {
    this.els.results?.classList.add('hidden');
  }

  bindDiffQuality(
    onDiff: (d: DiffId) => void,
    onQuality: (q: QualityId) => void,
  ): void {
    document.querySelectorAll<HTMLButtonElement>('.diff').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        document.querySelectorAll('.diff').forEach((b) => b.classList.remove('on'));
        btn.classList.add('on');
        const id = btn.dataset.diff as DiffId;
        onDiff(id);
      });
    });
    document.querySelectorAll<HTMLButtonElement>('.q').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.q').forEach((b) => b.classList.remove('on'));
        btn.classList.add('on');
        onQuality(btn.dataset.q as QualityId);
      });
    });
  }
}

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}
