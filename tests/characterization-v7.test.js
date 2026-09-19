'use strict';
const fs = require('fs');
const path = require('path');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };

const phys = JSON.parse(fs.readFileSync(path.join('shared', 'physics-config.json'), 'utf8'));
assert(phys.enemyLasers && phys.starPistol && phys.mount && phys.quality && phys.celebration, 'physics keys');
assert(phys.mount.allowFlightPistolCombo === false, 'combo flag false');
assert(phys.powerAliases.star_pistol === 'PISTOLA_ESTELAR', 'alias');
assert(phys.enemyLasers.telegraphMs.normal === 700, 'tele normal');

const src = fs.readFileSync(path.join('js', 'content-v6.js'), 'utf8');
assert(src.indexOf("id: 'star_pistol'") >= 0, 'star_pistol in content');
const ids = src.match(/id: '[a-z_]+'/g) || [];
const powerBlock = src.split('const POWERS')[1] || '';
const powerIds = (powerBlock.match(/id: '[a-z_]+'/g) || []).map((s) => s.slice(5, -1));
assert(powerIds.length === 15, '15 powers got ' + powerIds.length);
assert(new Set(powerIds).size === 15, 'unique powers');

const chor = JSON.parse(fs.readFileSync(path.join('data', 'choreographies.json'), 'utf8'));
['kori_voltz', 'shino_kage', 'mc_rumor', 'leo_dorado', 'don_cash', 'neon_groove'].forEach((id) => {
  assert(Array.isArray(chor.dances[id]) && chor.dances[id].length >= 3, 'chor ' + id);
});

const man = JSON.parse(fs.readFileSync(path.join('assets', 'manifest.json'), 'utf8'));
assert(Array.isArray(man.layers) && man.layers.length === 0, 'empty layers no 404');

const html = fs.readFileSync('index.html', 'utf8');
assert(html.indexOf('V7.0 ESTELAR') >= 0, 'version label');
assert(html.indexOf('hud-v7') >= 0, 'hud');
assert(html.indexOf('v7-estelar.js') >= 0, 'module');

console.log('OK characterization-v7');
