/**
 * Runner Legends — skins cosméticas (cero pay-to-win).
 * PaymentProvider mock desacoplado para Stripe/pasarela RD futura.
 */
(function (global) {
  'use strict';

  /** @typedef {{ id:string, name:string, rarity:'common'|'rare'|'epic'|'legend'|'premium', col:string, trail?:string, glow?:string, unlock:'owned'|'coins'|'mission'|'premium', price?:number, mission?:string, preview?:string }} SkinDef */

  /** @type {SkinDef[]} */
  const SKINS = [
    { id: 'neon', name: 'Estela Neón', rarity: 'common', col: '#22e6ff', unlock: 'owned', price: 0, preview: 'Cian clásico' },
    { id: 'gold', name: 'Estela Dorada', rarity: 'rare', col: '#ffd24a', unlock: 'coins', price: 80, preview: 'Oro de Distrito' },
    { id: 'magenta', name: 'Plasma Magenta', rarity: 'rare', col: '#ff2bd6', unlock: 'coins', price: 140, preview: 'Rosa neón' },
    { id: 'void', name: 'Estela Vacío', rarity: 'epic', col: '#a78bfa', unlock: 'coins', price: 220, preview: 'Violeta fractal' },
    { id: 'abyssal', name: 'Bruma Abisal', rarity: 'epic', col: '#2ee8c0', unlock: 'mission', mission: 'worlds_3', price: 0, preview: 'Verde submarino' },
    { id: 'igneous', name: 'Núcleo Ígneo', rarity: 'epic', col: '#ff6030', unlock: 'mission', mission: 'boss_1', price: 0, preview: 'Lava controlada' },
    { id: 'stellar', name: 'Explosión Estelar+', rarity: 'legend', col: '#ffe56a', glow: '#ff2bd6', unlock: 'mission', mission: 'super_1', price: 0, preview: 'Trail de SÚPER' },
    { id: 'lcs_pro', name: 'Logic Code Spot Pro', rarity: 'premium', col: '#22c55e', glow: '#22e6ff', unlock: 'premium', price: 499, preview: 'Skin premium · cosmético' }
  ];

  function MockPaymentProvider() {
    this.id = 'mock';
  }
  MockPaymentProvider.prototype.purchase = function (sku) {
    return Promise.resolve({ ok: false, sku: String(sku || ''), reason: 'payment_not_configured', message: 'Pasarela pendiente · cosmético bloqueado sin ventaja de juego' });
  };

  function getSkin(id) {
    return SKINS.find(function (s) { return s.id === id; }) || SKINS[0];
  }

  function sanitizeSkinId(id, owned) {
    const s = getSkin(id);
    if (!s) return 'neon';
    if (s.unlock === 'owned') return s.id;
    if (Array.isArray(owned) && owned.indexOf(s.id) >= 0) return s.id;
    return 'neon';
  }

  global.RLSkins = {
    SKINS: SKINS,
    getSkin: getSkin,
    sanitizeSkinId: sanitizeSkinId,
    PaymentProvider: MockPaymentProvider,
    createPayment: function () { return new MockPaymentProvider(); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
