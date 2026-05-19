// ══════════════════════════════════════════════
//  GAME DATA
// ══════════════════════════════════════════════
 
const ENEMIES = [
  {
    name: 'Skeleton',
    emoji: '💀',
    hp: 55,
    atk: 8,
    def: 1,
    dodgeChance: 0.28,
    critChance: 0.12,
    abilities: ['slash', 'dodge'],
    aiStyle: 'aggressive',
    description: 'Rattling bones, impossible to kill.'
  },
  {
    name: 'Orc Brute',
    emoji: '👹',
    hp: 100,
    atk: 18,
    def: 4,
    dodgeChance: 0.06,
    critChance: 0.15,
    abilities: ['smash', 'roar'],
    aiStyle: 'powerhouse',
    description: 'Slow, but hits like a boulder.'
  },
  {
    name: 'Shadow Mage',
    emoji: '🧙‍♂️',
    hp: 65,
    atk: 14,
    def: 2,
    dodgeChance: 0.12,
    critChance: 0.18,
    abilities: ['magic', 'burn'],
    aiStyle: 'caster',
    description: 'Commands the dark arts from afar.'
  },
  {
    name: 'Assassin',
    emoji: '🗡️',
    hp: 70,
    atk: 13,
    def: 2,
    dodgeChance: 0.22,
    critChance: 0.35,
    abilities: ['stab', 'poison'],
    aiStyle: 'aggressive',
    description: 'Strikes from the shadows with deadly precision.'
  },
  {
    name: 'Dark Lord',
    emoji: '👑',
    hp: 160,
    atk: 20,
    def: 6,
    dodgeChance: 0.15,
    critChance: 0.25,
    abilities: ['crush', 'rage', 'freeze', 'drain'],
    aiStyle: 'boss',
    description: '⚠ The Final Boss. Beware his wrath.',
    isBoss: true
  }
];
 
const ITEMS = [
  { name: 'Iron Sword',    icon: '⚔️',  rarity: 'common',    effect: '+4 ATK',    mod: { atk: 4 } },
  { name: 'Leather Armor', icon: '🛡️',  rarity: 'common',    effect: '+3 DEF',    mod: { def: 3 } },
  { name: 'Health Potion', icon: '🧪',  rarity: 'common',    effect: '+1 Heal use', mod: { healUses: 1 } },
  { name: 'Lucky Charm',   icon: '🍀',  rarity: 'rare',      effect: '+3 Luck',   mod: { luck: 3 } },
  { name: 'Mithril Shield',icon: '🔰',  rarity: 'rare',      effect: '+6 DEF',    mod: { def: 6 } },
  { name: 'Fire Blade',    icon: '🔥',  rarity: 'rare',      effect: '+8 ATK',    mod: { atk: 8 } },
  { name: 'Storm Gauntlet',icon: '⚡',  rarity: 'epic',      effect: '+12 ATK',   mod: { atk: 12 } },
  { name: 'Dragon Scale',  icon: '🐉',  rarity: 'epic',      effect: '+10 DEF',   mod: { def: 10 } },
  { name: 'Soul Ring',     icon: '💍',  rarity: 'legendary', effect: '+5 ATK +5 DEF +5 Luck', mod: { atk: 5, def: 5, luck: 5 } },
  { name: 'Void Blade',    icon: '🌑',  rarity: 'legendary', effect: '+20 ATK',   mod: { atk: 20 } },
];
 
// ══════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════
 
let G = {};
 
function initState() {
  G = {
    player: {
      name: 'Warrior',
      hp: 100, maxHp: 100,
      atk: 12, def: 3, luck: 5,
      healUses: 3, specialUses: 2,
      isDefending: false,
      statuses: [],
      kills: 0,
      items: [],
      itemCount: 0,
    },
    enemy: null,
    enemyIndex: 0,
    stage: 1,
    enemyQueue: [...ENEMIES],
    actionLocked: false,
    log: [],
  };
}
 
// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
 
function rand()         { return Math.random(); }
function roll(chance)   { return rand() < chance; }
function randInt(a, b)  { return Math.floor(Math.random() * (b - a + 1)) + a; }
function clamp(v, mn, mx){ return Math.max(mn, Math.min(mx, v)); }
 
function luckBonus() {
  return G.player.luck / 100; // luck adds to crit/miss etc
}
 
function addLog(msg, type = 'log-hit') {
  const el = document.getElementById('battle-log');
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = msg;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
  G.log.push({ msg, type });
  // Keep max 30 entries
  while (el.children.length > 30) el.removeChild(el.firstChild);
}
 
function floatDamage(text, color, side) {
  const arena = document.getElementById('arena-display');
  const el = document.createElement('div');
  el.className = 'float-num';
  el.textContent = text;
  el.style.color = color;
  el.style.left = side === 'player' ? '20%' : '65%';
  el.style.top = '30%';
  arena.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}
 
function flashScreen(color) {
  const overlay = document.getElementById('flash-overlay');
  overlay.style.background = color;
  overlay.style.opacity = '0.18';
  overlay.style.transition = 'none';
  setTimeout(() => {
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity = '0';
  }, 60);
}
 
function shakeEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('shaking');
  void el.offsetWidth;
  el.classList.add('shaking');
  setTimeout(() => el.classList.remove('shaking'), 400);
}
 
// ══════════════════════════════════════════════
//  UI UPDATE
// ══════════════════════════════════════════════
 
function updateUI() {
  const p = G.player;
  const e = G.enemy;
 
  // Player
  document.getElementById('player-hp-label').textContent = `${Math.max(0,p.hp)} / ${p.maxHp}`;
  const pPct = clamp(p.hp / p.maxHp * 100, 0, 100);
  const pBar = document.getElementById('player-hp-bar');
  pBar.style.width = pPct + '%';
  pBar.style.background = pPct > 60 ? 'var(--hp-green)' : pPct > 30 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  document.getElementById('player-atk').textContent = `⚔ ATK ${p.atk}`;
  document.getElementById('player-def').textContent = `🛡 DEF ${p.def}`;
  document.getElementById('player-luck').textContent = `🍀 LCK ${p.luck}`;
 
  // Player statuses
  const pStatEl = document.getElementById('player-statuses');
  pStatEl.innerHTML = p.statuses.map(s => `<span class="status-tag status-${s.type}">${s.icon} ${s.type.toUpperCase()} (${s.turns})</span>`).join('');
 
  // Enemy
  if (e) {
    const ePct = clamp(e.hp / e.maxHp * 100, 0, 100);
    document.getElementById('enemy-hp-label').textContent = `${Math.max(0,e.hp)} / ${e.maxHp}`;
    const eBar = document.getElementById('enemy-hp-bar');
    eBar.style.width = ePct + '%';
    eBar.style.background = ePct > 60 ? 'var(--accent)' : ePct > 30 ? 'var(--hp-yellow)' : '#7b0d1e';
    document.getElementById('enemy-name').textContent = e.name;
    document.getElementById('enemy-emoji').textContent = e.emoji;
    document.getElementById('enemy-atk').textContent = `⚔ ATK ${e.atk}`;
    document.getElementById('enemy-def').textContent = `🛡 DEF ${e.def}`;
 
    const eStatEl = document.getElementById('enemy-statuses');
    eStatEl.innerHTML = (e.statuses || []).map(s => `<span class="status-tag status-${s.type}">${s.icon} ${s.type.toUpperCase()} (${s.turns})</span>`).join('');
  }
 
  // Heal & special button labels
  document.getElementById('heal-chance').textContent = `Uses: ${p.healUses}`;
  document.getElementById('special-chance').textContent = `Uses: ${p.specialUses}`;
  document.getElementById('btn-heal').disabled   = p.healUses   <= 0 || G.actionLocked;
  document.getElementById('btn-special').disabled= p.specialUses<= 0 || G.actionLocked;
  document.getElementById('btn-attack').disabled = G.actionLocked;
  document.getElementById('btn-defend').disabled = G.actionLocked;
 
  // Stats bar
  document.getElementById('stat-stage').textContent = G.stage;
  document.getElementById('stat-kills').textContent  = p.kills;
  document.getElementById('stat-items').textContent  = p.itemCount;
 
  // Luck dots
  const track = document.getElementById('luck-track');
  track.innerHTML = '';
  const maxDots = 10;
  const activeDots = Math.min(p.luck, maxDots);
  for (let i = 0; i < maxDots; i++) {
    const d = document.createElement('div');
    d.className = 'luck-dot' + (i < activeDots ? ' active' : '');
    track.appendChild(d);
  }
 
  // Stage icons
  const stageEl = document.getElementById('stage-icons');
  stageEl.innerHTML = G.enemyQueue.map((en, idx) => {
    let cls = 'stage-enemy-icon';
    if (idx < G.enemyIndex) cls += ' defeated';
    else if (idx === G.enemyIndex) cls += ' current';
    return `<span class="${cls}">${en.emoji}</span>`;
  }).join('');
 
  document.getElementById('stage-label').textContent = `ARENA · STAGE ${G.stage}`;
  document.getElementById('stat-stage').textContent  = G.stage;
}
 
// ══════════════════════════════════════════════
//  STATUS EFFECTS
// ══════════════════════════════════════════════
 
function applyStatus(target, type, turns) {
  const ICONS = { poison:'☠', burn:'🔥', freeze:'❄', rage:'💢' };
  const existing = target.statuses.find(s => s.type === type);
  if (existing) { existing.turns = Math.max(existing.turns, turns); return; }
  target.statuses.push({ type, turns, icon: ICONS[type] || '?' });
}
 
function tickStatuses(target, targetName) {
  const toRemove = [];
  for (const s of target.statuses) {
    if (s.type === 'poison') {
      const dmg = 6;
      target.hp -= dmg;
      addLog(`☠ ${targetName} takes ${dmg} poison damage.`, 'log-status');
      floatDamage(`-${dmg}`, '#bb8fce', targetName === 'You' ? 'player' : 'enemy');
    }
    if (s.type === 'burn') {
      const dmg = 8;
      target.hp -= dmg;
      addLog(`🔥 ${targetName} burns for ${dmg} damage.`, 'log-status');
      floatDamage(`-${dmg}`, '#f0a868', targetName === 'You' ? 'player' : 'enemy');
    }
    s.turns--;
    if (s.turns <= 0) toRemove.push(s);
  }
  target.statuses = target.statuses.filter(s => !toRemove.includes(s));
}
 
// ══════════════════════════════════════════════
//  DAMAGE CALC
// ══════════════════════════════════════════════
 
function calcDamage(atk, def, isDefending) {
  const base = Math.max(1, atk - def + randInt(-2, 3));
  return isDefending ? Math.floor(base * 0.35) : base;
}
 
function playerHit(dmg) {
  G.player.hp -= dmg;
  shakeEl('game-root');
  flashScreen('rgba(192,57,43,0.4)');
}
 
function enemyHit(dmg) {
  G.enemy.hp -= dmg;
  flashScreen('rgba(212,160,23,0.2)');
}
 
// ══════════════════════════════════════════════
//  ENEMY AI TURN
// ══════════════════════════════════════════════
 
function enemyTurn() {
  const e = G.enemy;
  const p = G.player;
 
  // Tick enemy statuses
  tickStatuses(e, e.name);
  if (e.hp <= 0) { endBattle(true); return; }
 
  const isBoss = e.isBoss;
  const hpPct  = e.hp / e.maxHp;
 
  // Boss phase shift
  if (isBoss && hpPct < 0.4) {
    if (!e.enraged) {
      e.enraged = true;
      e.atk = Math.floor(e.atk * 1.3);
      addLog(`👑 ${e.name} enters a RAGE! His power surges!`, 'log-crit');
      applyStatus(e, 'rage', 99);
    }
  }
 
  // Decide action
  let action = 'attack';
  if (e.aiStyle === 'caster' && rand() < 0.4)   action = 'magic';
  if (e.aiStyle === 'powerhouse' && rand() < 0.25) action = 'smash';
  if (e.aiStyle === 'boss' && hpPct < 0.5 && rand() < 0.3) action = 'ability';
 
  if (action === 'magic') {
    // Magic attack - ignores defense partially
    if (roll(0.85)) {
      const dmg = randInt(e.atk - 2, e.atk + 5);
      playerHit(p.isDefending ? Math.floor(dmg * 0.5) : dmg);
      addLog(`🔮 ${e.name} launches a dark bolt — ${dmg} magic damage!`, 'log-damage');
      floatDamage(`-${dmg}`, '#bb8fce', 'player');
      if (roll(0.3)) { applyStatus(p, 'burn', 2); addLog(`🔥 You are set ablaze!`, 'log-status'); }
    } else {
      addLog(`🔮 ${e.name}'s spell fizzles out — MISS!`, 'log-miss');
    }
  } else if (action === 'smash') {
    const dmg = randInt(e.atk + 3, e.atk + 10);
    const reduced = p.isDefending ? Math.floor(dmg * 0.4) : dmg;
    playerHit(reduced);
    addLog(`💥 ${e.name} SMASHES — ${reduced} damage!${p.isDefending?' (blocked)':''}`, 'log-damage');
    floatDamage(`-${reduced}`, '#e74c3c', 'player');
  } else if (action === 'ability' && isBoss) {
    // Boss uses random ability
    const abilities = ['freeze', 'drain', 'crush'];
    const pick = abilities[randInt(0, abilities.length - 1)];
    if (pick === 'freeze' && !p.statuses.find(s => s.type === 'freeze')) {
      applyStatus(p, 'freeze', 1);
      addLog(`❄ ${e.name} FREEZES you! You lose your next turn!`, 'log-status');
    } else if (pick === 'drain') {
      const dmg = randInt(12, 22);
      playerHit(dmg);
      e.hp = Math.min(e.maxHp, e.hp + Math.floor(dmg / 2));
      addLog(`🩸 ${e.name} drains your life force — ${dmg} damage and heals!`, 'log-damage');
      floatDamage(`-${dmg}`, '#8e44ad', 'player');
    } else {
      const dmg = randInt(e.atk + 5, e.atk + 15);
      const reduced = p.isDefending ? Math.floor(dmg * 0.35) : dmg;
      playerHit(reduced);
      addLog(`👑 ${e.name} CRUSHES you — ${reduced} damage!`, 'log-damage');
      floatDamage(`-${reduced}`, '#e74c3c', 'player');
    }
  } else {
    // Regular attack
    const dodge = roll(e.aiStyle === 'aggressive' ? 0.05 : 0.08) || (p.isDefending && roll(0.2));
    if (dodge) {
      addLog(`🛡 You deflect ${e.name}'s attack!`, 'log-miss');
    } else if (roll(e.dodgeChance + (e.aiStyle === 'aggressive' ? 0.1 : 0))) {
      addLog(`💨 ${e.name} swings — and misses you!`, 'log-miss');
    } else {
      const isCrit = roll(e.critChance);
      let dmg = calcDamage(e.atk, p.isDefending ? p.def + 5 : p.def, false);
      if (isCrit) dmg = Math.floor(dmg * 1.8);
      playerHit(dmg);
      if (isCrit) {
        addLog(`💥 CRITICAL! ${e.name} hits for ${dmg} damage!`, 'log-crit');
        floatDamage(`CRIT! -${dmg}`, '#e74c3c', 'player');
      } else {
        addLog(`⚔ ${e.name} hits you for ${dmg} damage.`, 'log-damage');
        floatDamage(`-${dmg}`, '#e74c3c', 'player');
      }
      // Assassin poisons
      if (e.name === 'Assassin' && roll(0.25)) {
        applyStatus(p, 'poison', 3);
        addLog(`☠ The Assassin's blade was poisoned!`, 'log-status');
      }
    }
  }
 
  p.isDefending = false;
  updateUI();
 
  if (p.hp <= 0) { endBattle(false); }
}
 
// ══════════════════════════════════════════════
//  PLAYER ACTIONS
// ══════════════════════════════════════════════
 
function doAction(type) {
  if (G.actionLocked) return;
  const p = G.player;
  const e = G.enemy;
 
  // Check frozen
  const frozen = p.statuses.find(s => s.type === 'freeze');
  if (frozen) {
    frozen.turns = 0;
    p.statuses = p.statuses.filter(s => s.turns > 0);
    addLog(`❄ You are FROZEN and cannot act this turn!`, 'log-status');
    updateUI();
    setTimeout(() => enemyTurn(), 800);
    return;
  }
 
  // Tick player statuses first
  tickStatuses(p, 'You');
  updateUI();
  if (p.hp <= 0) { endBattle(false); return; }
 
  if (type === 'attack') {
    const missChance  = Math.max(0.05, 0.18 - luckBonus() * 0.5);
    const critChance  = Math.min(0.55, 0.20 + luckBonus() * 0.8);
    const dodged      = roll(e.dodgeChance);
 
    if (dodged) {
      addLog(`💨 ${e.name} DODGES your strike!`, 'log-miss');
      floatDamage('MISS', '#8a7060', 'enemy');
    } else if (roll(missChance)) {
      addLog(`💨 Your attack MISSES!`, 'log-miss');
      floatDamage('MISS', '#8a7060', 'enemy');
    } else {
      const isCrit = roll(critChance);
      let dmg = calcDamage(p.atk, e.def, false);
      if (isCrit) dmg = Math.floor(dmg * 2.2);
      const rage = p.statuses.find(s => s.type === 'rage');
      if (rage) dmg = Math.floor(dmg * 1.35);
      enemyHit(dmg);
      if (isCrit) {
        addLog(`✨ CRITICAL STRIKE! You deal ${dmg} damage to ${e.name}!`, 'log-crit');
        floatDamage(`CRIT! -${dmg}`, '#f0c040', 'enemy');
        flashScreen('rgba(212,160,23,0.3)');
      } else {
        addLog(`⚔ You strike ${e.name} for ${dmg} damage.`, 'log-hit');
        floatDamage(`-${dmg}`, '#e8d5c0', 'enemy');
      }
    }
 
  } else if (type === 'defend') {
    p.isDefending = true;
    addLog(`🛡 You brace for the next attack. DEF greatly increased.`, 'log-hit');
 
  } else if (type === 'heal') {
    if (p.healUses <= 0) return;
    p.healUses--;
    const healAmt = randInt(20, 35);
    const old = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + healAmt);
    const actual = p.hp - old;
    addLog(`💚 You use a healing potion and recover ${actual} HP!`, 'log-heal');
    floatDamage(`+${actual}`, '#58d68d', 'player');
    flashScreen('rgba(39,174,96,0.2)');
 
  } else if (type === 'special') {
    if (p.specialUses <= 0) return;
    p.specialUses--;
    // Thunder strike — large damage + chance to stun/burn
    if (roll(0.88 + luckBonus() * 0.1)) {
      const dmg = calcDamage(p.atk * 1.6, e.def, false) + randInt(5, 12);
      enemyHit(dmg);
      addLog(`⚡ THUNDERSTRIKE! You unleash lightning — ${dmg} damage!`, 'log-crit');
      floatDamage(`⚡ -${dmg}`, '#f0c040', 'enemy');
      flashScreen('rgba(212,160,23,0.4)');
      if (roll(0.45)) {
        applyStatus(e, 'burn', 2);
        addLog(`🔥 ${e.name} is set on fire!`, 'log-status');
      }
    } else {
      addLog(`⚡ Thunderstrike FIZZLES — the lightning escapes your grasp!`, 'log-miss');
    }
  }
 
  updateUI();
 
  if (e.hp <= 0) { endBattle(true); return; }
 
  // Lock actions during enemy turn
  G.actionLocked = true;
  updateUI();
  setTimeout(() => {
    G.actionLocked = false;
    enemyTurn();
    updateUI();
  }, 900);
}
 
// ══════════════════════════════════════════════
//  BATTLE START / END
// ══════════════════════════════════════════════
 
function spawnEnemy(data) {
  G.enemy = {
    ...data,
    hp: data.hp,
    maxHp: data.hp,
    statuses: [],
  };
}
 
function startBattle() {
  const enemyData = G.enemyQueue[G.enemyIndex];
  spawnEnemy(enemyData);
  G.player.isDefending = false;
  G.actionLocked = false;
 
  document.getElementById('battle-log').innerHTML = '';
 
  addLog(`─────────────────────────────`, 'log-system');
  if (enemyData.isBoss) {
    addLog(`💀 The floor trembles... ${enemyData.emoji} <strong>${enemyData.name}</strong> descends from the shadows!`, 'log-defeat');
  } else {
    addLog(`⚔ A ${enemyData.emoji} <strong>${enemyData.name}</strong> approaches. ${enemyData.description}`, 'log-system');
  }
 
  show('battle-screen');
  updateUI();
}
 
function endBattle(playerWon) {
  G.actionLocked = true;
 
  if (playerWon) {
    G.player.kills++;
    const isBoss = G.enemy.isBoss;
    addLog(``, 'log-system');
    addLog(`🏆 ${G.enemy.emoji} ${G.enemy.name} has been defeated!`, 'log-victory');
 
    if (isBoss) {
      setTimeout(() => showGameOver(true), 1200);
    } else {
      setTimeout(() => showLoot(), 1000);
    }
  } else {
    addLog(``, 'log-system');
    addLog(`💀 You have been slain by ${G.enemy.name}...`, 'log-defeat');
    setTimeout(() => showGameOver(false), 1500);
  }
}
 
// ══════════════════════════════════════════════
//  LOOT
// ══════════════════════════════════════════════
 
function getRarityWeight() {
  const luckMod = G.player.luck / 10; // 0–1 range roughly
  return {
    common:    Math.max(0.3, 0.60 - luckMod * 0.2),
    rare:      0.25 + luckMod * 0.05,
    epic:      0.10 + luckMod * 0.05,
    legendary: Math.min(0.12, 0.02 + luckMod * 0.03),
  };
}
 
function rollRarity() {
  const w = getRarityWeight();
  const r = rand();
  if (r < w.legendary) return 'legendary';
  if (r < w.legendary + w.epic) return 'epic';
  if (r < w.legendary + w.epic + w.rare) return 'rare';
  return 'common';
}
 
function getItemByRarity(rarity) {
  const pool = ITEMS.filter(i => i.rarity === rarity);
  if (!pool.length) return ITEMS[randInt(0, ITEMS.length - 1)];
  return pool[randInt(0, pool.length - 1)];
}
 
function showLoot() {
  const lootCount = 3;
  const lootOptions = [];
  for (let i = 0; i < lootCount; i++) {
    const rarity = rollRarity();
    lootOptions.push({ ...getItemByRarity(rarity), rarity });
  }
 
  const grid = document.getElementById('loot-grid');
  grid.innerHTML = '';
 
  lootOptions.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = `loot-item rarity-${item.rarity}`;
    div.innerHTML = `
      <div class="rarity-label">${item.rarity.toUpperCase()}</div>
      <div class="item-icon">${item.icon}</div>
      <div class="item-name">${item.name}</div>
      <div class="item-desc">${item.effect}</div>
    `;
    div.onclick = () => pickLoot(item, div);
    grid.appendChild(div);
  });
 
  show('loot-screen');
}
 
function pickLoot(item, el) {
  // Highlight selection
  document.querySelectorAll('.loot-item').forEach(d => d.style.opacity = '0.4');
  el.style.opacity = '1';
  el.style.transform = 'scale(1.04)';
 
  // Apply mod
  const p = G.player;
  const m = item.mod;
  if (m.atk)      p.atk += m.atk;
  if (m.def)      p.def += m.def;
  if (m.luck)     p.luck = Math.min(10, p.luck + m.luck);
  if (m.healUses) p.healUses += m.healUses;
  p.itemCount++;
  p.items.push(item);
 
  // Disable further picks
  document.querySelectorAll('.loot-item').forEach(d => d.onclick = null);
}
 
function nextEnemy() {
  G.enemyIndex++;
  G.stage++;
  if (G.enemyIndex >= G.enemyQueue.length) {
    showGameOver(true);
    return;
  }
  show('battle-screen');
  startBattle();
}
 
// ══════════════════════════════════════════════
//  GAME OVER
// ══════════════════════════════════════════════
 
function showGameOver(won) {
  const titleEl = document.getElementById('go-title');
  const msgEl   = document.getElementById('go-message');
  const statsEl = document.getElementById('go-stats');
 
  if (won) {
    titleEl.textContent = '⚔ VICTORIOUS ⚔';
    titleEl.className = 'go-title victory';
    msgEl.textContent = 'You have conquered the Shadow Arena. The darkness bows before you.';
  } else {
    titleEl.textContent = '💀 DEFEATED 💀';
    titleEl.className = 'go-title defeat';
    msgEl.textContent = 'The shadow claims another soul. But legends are written by those who rise again.';
  }
 
  const p = G.player;
  statsEl.innerHTML = `
    <div class="go-stat"><strong>${G.stage}</strong>Stages Reached</div>
    <div class="go-stat"><strong>${p.kills}</strong>Enemies Slain</div>
    <div class="go-stat"><strong>${p.itemCount}</strong>Items Found</div>
    <div class="go-stat"><strong>${Math.max(0, p.hp)}</strong>HP Remaining</div>
  `;
 
  show('gameover-screen');
}
 
// ══════════════════════════════════════════════
//  SCREENS
// ══════════════════════════════════════════════
 
function show(screenId) {
  ['title-screen','battle-screen','loot-screen','gameover-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === screenId) {
      el.style.display = 'flex';
      el.style.animation = 'fadeIn 0.4s ease';
    } else {
      el.style.display = 'none';
    }
  });
}
 
function startGame() {
  initState();
  show('battle-screen');
  startBattle();
}