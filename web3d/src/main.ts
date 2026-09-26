import './styles.css';
import { Game } from './Game';

const game = new Game();
void game.boot().catch((err: unknown) => {
  console.error('[RL3D] boot failed', err);
  const boot = document.getElementById('boot-pct');
  if (boot) boot.textContent = 'Error de carga — recarga la página';
});

// HMR-safe dispose
if (import.meta.hot) {
  import.meta.hot.dispose(() => game.dispose());
}
