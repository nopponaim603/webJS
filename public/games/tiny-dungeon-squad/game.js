/**
 * Tiny Dungeon Squad — SNKRX Edition (v2.0.0)
 * Top-Down 2D Snake Squad Auto-Battler Roguelite (G021)
 * Powered by Phaser 3 (v3.80.1) & Kenney Tiny Dungeon Assets
 */

// --------------------------------------------------
// GLOBAL GAME CONFIGURATION & DATA STRUCTURES
// --------------------------------------------------

const HERO_ROSTER = {
  knight: {
    id: 'knight',
    name: 'Knight',
    tileIndex: 96,
    cost: 1,
    primaryClass: 'warrior',
    secondaryClass: 'tank',
    baseHp: 180,
    baseDmg: 35,
    attackCd: 900,
    attackType: 'cleave',
    desc: 'Cleave slash in a 130° arc at nearby foes.'
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard',
    tileIndex: 84,
    cost: 2,
    primaryClass: 'mage',
    secondaryClass: 'sorcerer',
    baseHp: 80,
    baseDmg: 65,
    attackCd: 1400,
    attackType: 'fireball',
    desc: 'Fires explosive fireballs causing AoE splash.'
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    tileIndex: 86,
    cost: 1,
    primaryClass: 'rogue',
    secondaryClass: 'assassin',
    baseHp: 110,
    baseDmg: 25,
    attackCd: 600,
    attackType: 'dagger',
    desc: 'Throws fast critting daggers at closest enemy.'
  },
  priest: {
    id: 'priest',
    name: 'Priest',
    tileIndex: 87,
    cost: 2,
    primaryClass: 'healer',
    secondaryClass: 'buffer',
    baseHp: 100,
    baseDmg: 15,
    attackCd: 2000,
    attackType: 'heal',
    desc: 'Radiates healing light restoring lowest HP squad member.'
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    tileIndex: 85,
    cost: 1,
    primaryClass: 'ranger',
    secondaryClass: 'ranged',
    baseHp: 100,
    baseDmg: 30,
    attackCd: 800,
    attackType: 'arrow',
    desc: 'Fires piercing arrows that pass through enemies.'
  },
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    tileIndex: 97,
    cost: 3,
    primaryClass: 'tank',
    secondaryClass: 'warrior',
    baseHp: 220,
    baseDmg: 20,
    attackCd: 400,
    attackType: 'holy_shield',
    desc: 'Shield ring orbits around squad damaging enemies.'
  },
  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    tileIndex: 111,
    cost: 2,
    primaryClass: 'sorcerer',
    secondaryClass: 'curser',
    baseHp: 90,
    baseDmg: 40,
    attackCd: 1200,
    attackType: 'venom',
    desc: 'Launches venom bolts leaving poisonous floor puddles.'
  },
  bard: {
    id: 'bard',
    name: 'Bard',
    tileIndex: 88,
    cost: 3,
    primaryClass: 'buffer',
    secondaryClass: 'enchanter',
    baseHp: 95,
    baseDmg: 15,
    attackCd: 2500,
    attackType: 'haste',
    desc: 'Pulses haste aura boosting squad movement & attack speed.'
  }
};

const SYNERGY_INFO = {
  warrior: { name: 'Warrior', icon: '⚔️', thresholds: [2, 4], desc: ['+25% Armor', '+60% Armor'] },
  mage: { name: 'Mage', icon: '🔥', thresholds: [2, 4], desc: ['+30% Dmg & +1 Proj', '+70% Dmg & +1 Proj'] },
  rogue: { name: 'Rogue', icon: '🔪', thresholds: [2, 4], desc: ['+25% Crit & Speed', '+50% Crit & Speed'] },
  ranger: { name: 'Ranger', icon: '🎯', thresholds: [2, 4], desc: ['+30% AtkSpd & +1 Pierce', '+65% AtkSpd & +2 Pierce'] },
  healer: { name: 'Healer', icon: '💚', thresholds: [2, 4], desc: ['Heal 8% HP / 3s', 'Heal 20% HP / 3s'] },
  sorcerer: { name: 'Sorcerer', icon: '🔮', thresholds: [2, 4], desc: ['+40% AoE & Slow', '+90% AoE & Slow'] },
  tank: { name: 'Tank', icon: '🛡️', thresholds: [2, 4], desc: ['+35% HP & 20% Reflect', '+80% HP & 40% Reflect'] },
  buffer: { name: 'Buffer', icon: '✨', thresholds: [2, 4], desc: ['+25% Synergy Boost', '+50% Synergy Boost'] }
};

const MONSTER_SPECS = {
  skeleton: { name: 'Skeleton Warrior', frame: 108, hp: 25, speed: 75, xp: 2, gold: 1 },
  zombie: { name: 'Zombie Crawler', frame: 109, hp: 35, speed: 65, xp: 3, gold: 1 },
  goblin: { name: 'Goblin Raider', frame: 110, hp: 30, speed: 85, xp: 3, gold: 1 },
  enemy_mage: { name: 'Enemy Mage', frame: 111, hp: 45, speed: 80, xp: 4, gold: 2 },
  enemy_swordsman: { name: 'Enemy Swordsman', frame: 112, hp: 55, speed: 90, xp: 5, gold: 2 },
  ogre: { name: 'Ogre Heavy', frame: 120, hp: 80, speed: 60, xp: 6, gold: 3 },
  red_demon: { name: 'Red Demon', frame: 121, hp: 95, speed: 85, xp: 7, gold: 3 },
  blue_demon: { name: 'Blue Demon', frame: 122, hp: 110, speed: 90, xp: 8, gold: 4 },
  minotaur_boss: { name: 'Minotaur Boss', frame: 123, hp: 350, speed: 65, xp: 20, gold: 10, isBoss: true },
  reaper_boss: { name: 'Reaper Boss', frame: 124, hp: 600, speed: 55, xp: 35, gold: 20, isBoss: true }
};

// Global State Persistent Across Scenes
let gameState = {
  currentWave: 1,
  gold: 12,
  squadCapacity: 3,
  shopLocked: false,
  lockedShopItems: null,
  squad: [
    { heroId: 'knight', tier: 1, hp: 180, maxHp: 180 },
    { heroId: 'rogue', tier: 1, hp: 110, maxHp: 110 }
  ],
  totalKills: 0,
  totalGoldEarned: 12
};

// --------------------------------------------------
// 1. BOOT SCENE
// --------------------------------------------------
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Loading Tiny Dungeon Assets...', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '20px',
      color: '#00f2fe'
    }).setOrigin(0.5);

    this.load.spritesheet('tiny_dungeon', '/assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png', {
      frameWidth: 16,
      frameHeight: 16,
      margin: 0,
      spacing: 0
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}

// --------------------------------------------------
// 2. MENU SCENE
// --------------------------------------------------
class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x020617, 0x020617, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height * 0.22, 'TINY DUNGEON SQUAD', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '24px',
      color: '#00f2fe',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.30, 'SNKRX Edition — Wave Squad Roguelite (G021)', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#94a3b8',
      align: 'center'
    }).setOrigin(0.5);

    const heroKeys = Object.keys(HERO_ROSTER);
    const startX = width / 2 - ((heroKeys.length - 1) * 36) / 2;
    heroKeys.forEach((key, idx) => {
      const hero = HERO_ROSTER[key];
      const spr = this.add.sprite(startX + idx * 36, height * 0.44, 'tiny_dungeon', hero.tileIndex).setScale(2.0);
      this.tweens.add({
        targets: spr,
        y: spr.y - 6,
        duration: 800 + idx * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    const box = this.add.graphics();
    box.fillStyle(0x1e293b, 0.8);
    box.fillRoundedRect(width / 2 - 220, height * 0.54, 440, 110, 12);
    box.lineStyle(2, 0x38bdf8, 0.5);
    box.strokeRoundedRect(width / 2 - 220, height * 0.54, 440, 110, 12);

    this.add.text(width / 2, height * 0.57, '🎮 CONTROLS & RULES', {
      fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 'bold', color: '#38bdf8'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.65, '• WASD / Arrows / Touch Joystick to steer Snake Squad\n• Heroes auto-attack enemies in combat waves\n• Buy & merge 3-of-a-kind heroes in the shop between waves!', {
      fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#e2e8f0', align: 'center'
    }).setOrigin(0.5);

    const btn = this.add.rectangle(width / 2, height * 0.78, 220, 50, 0x00f2fe).setInteractive({ useHandCursor: true });
    const btnText = this.add.text(width / 2, height * 0.78, 'PLAY GAME', {
      fontFamily: "'Press Start 2P', monospace", fontSize: '14px', color: '#090d16'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(0x38bdf8);
      this.tweens.add({ targets: [btn, btnText], scale: 1.05, duration: 150 });
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(0x00f2fe);
      this.tweens.add({ targets: [btn, btnText], scale: 1.0, duration: 150 });
    });
    btn.on('pointerdown', () => {
      gameState = {
        currentWave: 1,
        gold: 12,
        squadCapacity: 3,
        shopLocked: false,
        lockedShopItems: null,
        squad: [
          { heroId: 'knight', tier: 1, hp: 180, maxHp: 180 },
          { heroId: 'rogue', tier: 1, hp: 110, maxHp: 110 }
        ],
        totalKills: 0,
        totalGoldEarned: 12
      };
      this.scene.start('ShopScene');
    });
  }
}

// --------------------------------------------------
// 3. SHOP SCENE
// --------------------------------------------------
class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b0f19, 0x0b0f19, 0x030712, 0x030712, 1);
    bg.fillRect(0, 0, width, height);

    // Heal all squad members to max HP for new wave
    gameState.squad.forEach(m => {
      m.hp = m.maxHp;
    });

    this.checkAndPerformMerges();

    const interest = Math.min(5, Math.floor(gameState.gold / 5));
    this.add.text(24, 20, `WAVE ${gameState.currentWave} SHOP`, {
      fontFamily: "'Press Start 2P', monospace", fontSize: '18px', color: '#00f2fe'
    });

    this.goldText = this.add.text(width - 24, 20, `💰 Gold: ${gameState.gold}  (+$${interest} interest next wave)`, {
      fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 'bold', color: '#fbbf24'
    }).setOrigin(1.0, 0);

    if (!gameState.shopLocked || !gameState.lockedShopItems) {
      gameState.lockedShopItems = this.generateShopDraft();
    }

    this.renderShopCards();
    this.renderSquadList();
    this.renderSynergyPanel();
    this.renderActionButtons();
  }

  generateShopDraft() {
    const keys = Object.keys(HERO_ROSTER);
    const draft = [];
    for (let i = 0; i < 4; i++) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      draft.push({ ...HERO_ROSTER[randomKey], bought: false });
    }
    return draft;
  }

  checkAndPerformMerges() {
    let merged = false;
    do {
      merged = false;
      const countMap = {};
      gameState.squad.forEach(member => {
        const key = `${member.heroId}_t${member.tier}`;
        countMap[key] = (countMap[key] || 0) + 1;
      });

      for (const key in countMap) {
        if (countMap[key] >= 3) {
          const [heroId, tierStr] = key.split('_t');
          const currentTier = parseInt(tierStr, 10);
          if (currentTier < 3) {
            let removed = 0;
            gameState.squad = gameState.squad.filter(member => {
              if (member.heroId === heroId && member.tier === currentTier && removed < 3) {
                removed++;
                return false;
              }
              return true;
            });

            const baseInfo = HERO_ROSTER[heroId];
            const nextTier = currentTier + 1;
            const hpMult = nextTier === 2 ? 2.0 : 3.5;
            const newMaxHp = Math.floor(baseInfo.baseHp * hpMult);
            gameState.squad.push({
              heroId: heroId,
              tier: nextTier,
              hp: newMaxHp,
              maxHp: newMaxHp
            });

            merged = true;
            this.showToast(`⭐ MERGED! ${baseInfo.name} upgraded to Tier ${nextTier}!`);
            break;
          }
        }
      }
    } while (merged);
  }

  showToast(msg) {
    const width = this.cameras.main.width;
    const toast = this.add.text(width / 2, 70, msg, {
      fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 'bold', color: '#facc15',
      backgroundColor: '#1e1b4b', padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setDepth(99);

    this.tweens.add({
      targets: toast, y: 55, alpha: 0, delay: 1800, duration: 400, onComplete: () => toast.destroy()
    });
  }

  renderShopCards() {
    if (this.shopContainer) this.shopContainer.destroy();
    this.shopContainer = this.add.container(0, 0);

    const startX = 40;
    const cardWidth = 140;
    const gap = 16;

    gameState.lockedShopItems.forEach((item, idx) => {
      const x = startX + idx * (cardWidth + gap);
      const y = 80;
      const h = 180;

      const cardBg = this.add.graphics();
      cardBg.fillStyle(item.bought ? 0x1e293b : 0x0f172a, 0.9);
      cardBg.fillRoundedRect(x, y, cardWidth, h, 10);
      cardBg.lineStyle(2, item.bought ? 0x334155 : 0x38bdf8, 0.8);
      cardBg.strokeRoundedRect(x, y, cardWidth, h, 10);

      this.shopContainer.add(cardBg);

      if (!item.bought) {
        const spr = this.add.sprite(x + cardWidth / 2, y + 36, 'tiny_dungeon', item.tileIndex).setScale(2.2);
        this.shopContainer.add(spr);

        const title = this.add.text(x + cardWidth / 2, y + 70, item.name, {
          fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 'bold', color: '#f8fafc'
        }).setOrigin(0.5);
        this.shopContainer.add(title);

        const tag1 = this.add.text(x + cardWidth / 2, y + 92, item.primaryClass.toUpperCase(), {
          fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#38bdf8', backgroundColor: '#0284c7', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        const tag2 = this.add.text(x + cardWidth / 2, y + 112, item.secondaryClass.toUpperCase(), {
          fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: '#c084fc', backgroundColor: '#7e22ce', padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        this.shopContainer.add([tag1, tag2]);

        const canAfford = gameState.gold >= item.cost;
        const fullCapacity = gameState.squad.length >= gameState.squadCapacity;
        const btnColor = !canAfford || fullCapacity ? 0x475569 : 0x10b981;

        const buyBtn = this.add.rectangle(x + cardWidth / 2, y + 150, cardWidth - 20, 28, btnColor).setInteractive({ useHandCursor: canAfford && !fullCapacity });
        const buyTxt = this.add.text(x + cardWidth / 2, y + 150, fullCapacity ? 'FULL' : `BUY (${item.cost}g)`, {
          fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        this.shopContainer.add([buyBtn, buyTxt]);

        if (canAfford && !fullCapacity) {
          buyBtn.on('pointerdown', () => {
            gameState.gold -= item.cost;
            item.bought = true;
            gameState.squad.push({
              heroId: item.id,
              tier: 1,
              hp: item.baseHp,
              maxHp: item.baseHp
            });
            this.checkAndPerformMerges();
            this.scene.restart();
          });
        }
      } else {
        const soldTxt = this.add.text(x + cardWidth / 2, y + h / 2, 'PURCHASED', {
          fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#64748b'
        }).setOrigin(0.5);
        this.shopContainer.add(soldTxt);
      }
    });
  }

  renderSquadList() {
    if (this.squadContainer) this.squadContainer.destroy();
    this.squadContainer = this.add.container(0, 0);

    const startY = 280;
    const title = this.add.text(40, startY, `MY SQUAD (${gameState.squad.length}/${gameState.squadCapacity})`, {
      fontFamily: "'Press Start 2P', monospace", fontSize: '14px', color: '#38bdf8'
    });
    this.squadContainer.add(title);

    if (gameState.squadCapacity < 7) {
      const upgradeCost = (gameState.squadCapacity - 2) * 4;
      const canUpgrade = gameState.gold >= upgradeCost;

      const upBtn = this.add.rectangle(300, startY + 6, 170, 26, canUpgrade ? 0x8b5cf6 : 0x475569).setInteractive({ useHandCursor: canUpgrade });
      const upTxt = this.add.text(300, startY + 6, `+1 SLOT (${upgradeCost}g)`, {
        fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 'bold', color: '#ffffff'
      }).setOrigin(0.5);

      if (canUpgrade) {
        upBtn.on('pointerdown', () => {
          gameState.gold -= upgradeCost;
          gameState.squadCapacity++;
          this.scene.restart();
        });
      }
      this.squadContainer.add([upBtn, upTxt]);
    }

    const cardW = 100;
    const gap = 12;
    gameState.squad.forEach((member, idx) => {
      const x = 40 + idx * (cardW + gap);
      const y = startY + 35;
      const hero = HERO_ROSTER[member.heroId];

      const card = this.add.graphics();
      card.fillStyle(0x1e293b, 0.9);
      card.fillRoundedRect(x, y, cardW, 110, 8);
      card.lineStyle(2, member.tier === 3 ? 0xa855f7 : member.tier === 2 ? 0xeab308 : 0x475569, 1);
      card.strokeRoundedRect(x, y, cardW, 110, 8);
      this.squadContainer.add(card);

      const spr = this.add.sprite(x + cardW / 2, y + 30, 'tiny_dungeon', hero.tileIndex).setScale(1.8);
      if (member.tier > 1) spr.setTint(member.tier === 3 ? 0xc084fc : 0xfacc15);
      this.squadContainer.add(spr);

      const stars = '★'.repeat(member.tier);
      const starsTxt = this.add.text(x + cardW / 2, y + 55, stars, {
        fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: member.tier === 3 ? '#c084fc' : '#facc15'
      }).setOrigin(0.5);

      const nameTxt = this.add.text(x + cardW / 2, y + 70, hero.name, {
        fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 'bold', color: '#ffffff'
      }).setOrigin(0.5);

      const refund = Math.floor(hero.cost * (member.tier === 3 ? 9 : member.tier === 2 ? 3 : 1));
      const sellBtn = this.add.rectangle(x + cardW / 2, y + 94, cardW - 12, 20, 0xef4444).setInteractive({ useHandCursor: true });
      const sellTxt = this.add.text(x + cardW / 2, y + 94, `SELL ($${refund})`, {
        fontFamily: 'Outfit, sans-serif', fontSize: '10px', fontWeight: 'bold', color: '#ffffff'
      }).setOrigin(0.5);

      sellBtn.on('pointerdown', () => {
        gameState.gold += refund;
        gameState.squad.splice(idx, 1);
        this.scene.restart();
      });

      this.squadContainer.add([starsTxt, nameTxt, sellBtn, sellTxt]);
    });
  }

  renderSynergyPanel() {
    if (this.synergyContainer) this.synergyContainer.destroy();
    this.synergyContainer = this.add.container(0, 0);

    const width = this.cameras.main.width;
    const startX = width - 260;
    const startY = 80;

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.85);
    bg.fillRoundedRect(startX, startY, 235, 310, 10);
    bg.lineStyle(1, 0x334155, 1);
    bg.strokeRoundedRect(startX, startY, 235, 310, 10);
    this.synergyContainer.add(bg);

    const title = this.add.text(startX + 12, startY + 12, 'CLASS SYNERGIES', {
      fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#38bdf8'
    });
    this.synergyContainer.add(title);

    const classCounts = {};
    gameState.squad.forEach(member => {
      const hero = HERO_ROSTER[member.heroId];
      classCounts[hero.primaryClass] = (classCounts[hero.primaryClass] || 0) + 1;
      classCounts[hero.secondaryClass] = (classCounts[hero.secondaryClass] || 0) + 1;
    });

    let lineY = startY + 40;
    Object.keys(SYNERGY_INFO).forEach(key => {
      const syn = SYNERGY_INFO[key];
      const count = classCounts[key] || 0;
      const activeTier = count >= syn.thresholds[1] ? 2 : count >= syn.thresholds[0] ? 1 : 0;
      const color = activeTier === 2 ? '#a855f7' : activeTier === 1 ? '#38bdf8' : '#64748b';

      const line = this.add.text(startX + 12, lineY, `${syn.icon} ${syn.name} (${count}/${syn.thresholds[0]})`, {
        fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: activeTier > 0 ? 'bold' : 'normal', color: color
      });

      this.synergyContainer.add(line);
      lineY += 28;
    });
  }

  renderActionButtons() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const y = height - 50;

    const canReroll = gameState.gold >= 1;
    const rerollBtn = this.add.rectangle(120, y, 160, 44, canReroll ? 0x0284c7 : 0x475569).setInteractive({ useHandCursor: canReroll });
    const rerollTxt = this.add.text(120, y, '🎲 REROLL (1g)', {
      fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    if (canReroll) {
      rerollBtn.on('pointerdown', () => {
        gameState.gold -= 1;
        gameState.lockedShopItems = this.generateShopDraft();
        this.scene.restart();
      });
    }

    const lockBtn = this.add.rectangle(300, y, 140, 44, gameState.shopLocked ? 0xd97706 : 0x334155).setInteractive({ useHandCursor: true });
    const lockTxt = this.add.text(300, y, gameState.shopLocked ? '🔒 LOCKED' : '🔓 LOCK SHOP', {
      fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    lockBtn.on('pointerdown', () => {
      gameState.shopLocked = !gameState.shopLocked;
      this.scene.restart();
    });

    const canStart = gameState.squad.length > 0;
    const startBtn = this.add.rectangle(width - 150, y, 220, 48, canStart ? 0x10b981 : 0x475569).setInteractive({ useHandCursor: canStart });
    const startTxt = this.add.text(width - 150, y, `START WAVE ${gameState.currentWave} ⚔️`, {
      fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#ffffff'
    }).setOrigin(0.5);

    if (canStart) {
      startBtn.on('pointerdown', () => {
        this.scene.start('MainGameScene');
      });
    }
  }
}

// --------------------------------------------------
// 4. MAIN GAME SCENE (SNAKE SQUAD WAVE COMBAT)
// --------------------------------------------------
class MainGameScene extends Phaser.Scene {
  constructor() {
    super('MainGameScene');
  }

  create() {
    // Reset flags & state for the new wave
    this.waveEnded = false;
    this.lastDamageTime = 0;

    this.worldWidth = 960;
    this.worldHeight = 720;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.buildDungeonArena();
    this.calculateActiveSynergies();
    this.createSnakeSquad();

    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.goldGems = this.physics.add.group();

    this.waveTimer = 30;
    this.waveTimerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.waveEnded) return;
        this.waveTimer--;
        if (this.waveTimer <= 0) {
          this.onWaveVictory();
        }
      },
      loop: true
    });

    this.spawnTimerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.spawnWaveEnemies,
      callbackScope: this,
      loop: true
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.setupVirtualJoystick();

    this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileHit, null, this);
    this.physics.add.overlap(this.squadHead, this.enemies, this.handleSquadEnemyCollision, null, this);
    this.physics.add.overlap(this.squadHead, this.goldGems, this.handleGemPickup, null, this);

    this.scene.launch('UIScene', { mainScene: this });
  }

  buildDungeonArena() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x111827, 1);
    graphics.fillRect(0, 0, this.worldWidth, this.worldHeight);

    graphics.lineStyle(1, 0x1e293b, 0.4);
    for (let x = 0; x < this.worldWidth; x += 32) {
      graphics.lineBetween(x, 0, x, this.worldHeight);
    }
    for (let y = 0; y < this.worldHeight; y += 32) {
      graphics.lineBetween(0, y, this.worldWidth, y);
    }

    graphics.lineStyle(8, 0x38bdf8, 0.8);
    graphics.strokeRect(4, 4, this.worldWidth - 8, this.worldHeight - 8);
  }

  calculateActiveSynergies() {
    const classCounts = {};
    gameState.squad.forEach(m => {
      const hero = HERO_ROSTER[m.heroId];
      classCounts[hero.primaryClass] = (classCounts[hero.primaryClass] || 0) + 1;
      classCounts[hero.secondaryClass] = (classCounts[hero.secondaryClass] || 0) + 1;
    });

    this.activeSynergies = {};
    Object.keys(SYNERGY_INFO).forEach(key => {
      const count = classCounts[key] || 0;
      const syn = SYNERGY_INFO[key];
      if (count >= syn.thresholds[1]) this.activeSynergies[key] = 2;
      else if (count >= syn.thresholds[0]) this.activeSynergies[key] = 1;
      else this.activeSynergies[key] = 0;
    });
  }

  createSnakeSquad() {
    this.squadMembers = [];
    this.positionHistory = [];
    this.historySpacing = 10;

    const startX = this.worldWidth / 2;
    const startY = this.worldHeight / 2;

    for (let i = 0; i < 300; i++) {
      this.positionHistory.push({ x: startX, y: startY });
    }

    gameState.squad.forEach((m, idx) => {
      const hero = HERO_ROSTER[m.heroId];
      const spr = this.physics.add.sprite(startX - idx * 20, startY, 'tiny_dungeon', hero.tileIndex);
      spr.setCollideWorldBounds(true);

      const scale = m.tier === 3 ? 2.2 : m.tier === 2 ? 1.8 : 1.4;
      spr.setScale(scale);
      if (m.tier > 1) spr.setTint(m.tier === 3 ? 0xc084fc : 0xfacc15);

      spr.heroData = hero;
      spr.squadMeta = m;
      spr.lastAttackTime = 0;

      if (idx === 0) {
        this.squadHead = spr;
      } else {
        spr.body.enable = false;
      }
      this.squadMembers.push(spr);
    });
  }

  setupVirtualJoystick() {
    this.joyVector = { x: 0, y: 0 };
    const joystick = document.getElementById('virtual-joystick');
    const knob = document.getElementById('virtual-joystick-knob');
    if (!joystick || !knob) return;

    let touchId = null;
    let startX = 0, startY = 0;

    const onTouchStart = (e) => {
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = joystick.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    };

    const onTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const dist = Math.hypot(dx, dy);
          const maxR = 40;
          const angle = Math.atan2(dy, dx);
          const r = Math.min(dist, maxR);

          knob.style.transform = `translate(${Math.cos(angle) * r}px, ${Math.sin(angle) * r}px)`;
          this.joyVector.x = (Math.cos(angle) * r) / maxR;
          this.joyVector.y = (Math.sin(angle) * r) / maxR;
        }
      }
    };

    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          knob.style.transform = 'translate(0px, 0px)';
          this.joyVector.x = 0;
          this.joyVector.y = 0;
        }
      }
    };

    joystick.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }

  update(time, delta) {
    if (this.waveEnded || !this.squadHead || !this.squadHead.active) return;
    this.updateSnakeMovement();
    this.updateSquadAttacks(time);
    this.updateEnemyAI();
  }

  updateSnakeMovement() {
    if (!this.squadHead || !this.squadHead.active || !this.squadHead.body) return;

    let vx = 0;
    let vy = 0;

    if (this.wasd.A.isDown || this.cursors.left.isDown) vx -= 1;
    if (this.wasd.D.isDown || this.cursors.right.isDown) vx += 1;
    if (this.wasd.W.isDown || this.cursors.up.isDown) vy -= 1;
    if (this.wasd.S.isDown || this.cursors.down.isDown) vy += 1;

    if (this.joyVector && (this.joyVector.x !== 0 || this.joyVector.y !== 0)) {
      vx = this.joyVector.x;
      vy = this.joyVector.y;
    }

    let speedMult = 1.0;
    if (this.activeSynergies.rogue === 2) speedMult = 1.5;
    else if (this.activeSynergies.rogue === 1) speedMult = 1.25;

    const baseSpeed = 160 * speedMult;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      this.squadHead.body.setVelocity((vx / len) * baseSpeed, (vy / len) * baseSpeed);
    } else {
      this.squadHead.body.setVelocity(0, 0);
    }

    this.positionHistory.unshift({ x: this.squadHead.x, y: this.squadHead.y });
    if (this.positionHistory.length > 300) this.positionHistory.pop();

    for (let i = 1; i < this.squadMembers.length; i++) {
      const targetIdx = i * this.historySpacing;
      if (targetIdx < this.positionHistory.length) {
        const pos = this.positionHistory[targetIdx];
        this.squadMembers[i].setPosition(pos.x, pos.y);
      }
    }
  }

  updateSquadAttacks(time) {
    this.squadMembers.forEach(member => {
      if (!member.active) return;
      const hero = member.heroData;

      let cdMult = 1.0;
      if (this.activeSynergies.ranger === 2) cdMult = 0.4;
      else if (this.activeSynergies.ranger === 1) cdMult = 0.7;

      const effectiveCd = hero.attackCd * cdMult;

      if (time - member.lastAttackTime >= effectiveCd) {
        member.lastAttackTime = time;
        this.executeAttack(member);
      }
    });
  }

  executeAttack(member) {
    const hero = member.heroData;
    const nearestEnemy = this.getNearestEnemy(member.x, member.y);

    let tierMult = member.squadMeta.tier === 3 ? 2.5 : member.squadMeta.tier === 2 ? 1.75 : 1.0;
    let mageMult = this.activeSynergies.mage === 2 ? 1.7 : this.activeSynergies.mage === 1 ? 1.3 : 1.0;
    const finalDmg = Math.floor(hero.baseDmg * tierMult * mageMult);

    switch (hero.attackType) {
      case 'cleave': {
        if (!nearestEnemy) return;
        const arcRadius = 80;
        this.enemies.getChildren().forEach(e => {
          if (Phaser.Math.Distance.Between(member.x, member.y, e.x, e.y) <= arcRadius) {
            this.damageEnemy(e, finalDmg);
          }
        });
        const slash = this.add.sprite(member.x, member.y, 'tiny_dungeon', 106).setScale(2.0);
        this.tweens.add({ targets: slash, alpha: 0, scale: 2.8, duration: 200, onComplete: () => slash.destroy() });
        break;
      }
      case 'fireball': {
        if (!nearestEnemy) return;
        const fireball = this.physics.add.sprite(member.x, member.y, 'tiny_dungeon', 117).setScale(1.6);
        this.projectiles.add(fireball);
        fireball.projMeta = { damage: finalDmg, isSplash: true };
        this.physics.moveToObject(fireball, nearestEnemy, 240);
        break;
      }
      case 'dagger': {
        if (!nearestEnemy) return;
        const dagger = this.physics.add.sprite(member.x, member.y, 'tiny_dungeon', 104).setScale(1.4);
        this.projectiles.add(dagger);
        const critBonus = this.activeSynergies.rogue === 2 ? 0.5 : this.activeSynergies.rogue === 1 ? 0.25 : 0.0;
        const isCrit = Math.random() < (0.3 + critBonus);
        dagger.projMeta = { damage: isCrit ? finalDmg * 2 : finalDmg, isCrit };
        this.physics.moveToObject(dagger, nearestEnemy, 320);
        break;
      }
      case 'heal': {
        let lowest = member.squadMeta;
        gameState.squad.forEach(m => {
          if (m.hp / m.maxHp < lowest.hp / lowest.maxHp) lowest = m;
        });
        lowest.hp = Math.min(lowest.maxHp, lowest.hp + 25);
        this.showFloatingText(member.x, member.y - 15, '+25 HP', '#10b981');
        break;
      }
      case 'arrow': {
        if (!nearestEnemy) return;
        const arrow = this.physics.add.sprite(member.x, member.y, 'tiny_dungeon', 104).setScale(1.4).setTint(0x38bdf8);
        this.projectiles.add(arrow);
        const pierceCount = this.activeSynergies.ranger === 2 ? 3 : this.activeSynergies.ranger === 1 ? 2 : 1;
        arrow.projMeta = { damage: finalDmg, pierce: pierceCount };
        this.physics.moveToObject(arrow, nearestEnemy, 300);
        break;
      }
      case 'holy_shield': {
        this.enemies.getChildren().forEach(e => {
          if (Phaser.Math.Distance.Between(member.x, member.y, e.x, e.y) <= 65) {
            this.damageEnemy(e, finalDmg);
          }
        });
        break;
      }
    }
  }

  getNearestEnemy(x, y) {
    let nearest = null;
    let minDist = Infinity;
    this.enemies.getChildren().forEach(e => {
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    });
    return nearest;
  }

  damageEnemy(enemy, damage) {
    enemy.hp -= damage;
    this.showFloatingText(enemy.x, enemy.y, `-${damage}`, '#f8fafc');

    if (enemy.hp <= 0) {
      const gem = this.physics.add.sprite(enemy.x, enemy.y, 'tiny_dungeon', 115).setScale(1.4);
      this.goldGems.add(gem);
      gameState.totalKills++;
      enemy.destroy();
    }
  }

  handleProjectileHit(proj, enemy) {
    if (!proj.active || !enemy.active) return;
    const meta = proj.projMeta || { damage: 20 };
    this.damageEnemy(enemy, meta.damage);

    if (meta.isSplash) {
      const radius = this.activeSynergies.sorcerer === 2 ? 110 : this.activeSynergies.sorcerer === 1 ? 75 : 50;
      this.enemies.getChildren().forEach(e => {
        if (e !== enemy && Phaser.Math.Distance.Between(proj.x, proj.y, e.x, e.y) <= radius) {
          this.damageEnemy(e, Math.floor(meta.damage * 0.6));
        }
      });
    }

    if (meta.pierce && meta.pierce > 1) {
      meta.pierce--;
    } else {
      proj.destroy();
    }
  }

  handleSquadEnemyCollision(head, enemy) {
    if (this.waveEnded) return;
    if (this.lastDamageTime && this.time.now - this.lastDamageTime < 400) return;
    this.lastDamageTime = this.time.now;

    const lead = gameState.squad[0];
    if (lead) {
      let armorMult = 1.0;
      if (this.activeSynergies.warrior === 2) armorMult = 0.4;
      else if (this.activeSynergies.warrior === 1) armorMult = 0.75;

      const rawDmg = Math.floor(15 * armorMult);
      lead.hp -= rawDmg;
      this.cameras.main.shake(150, 0.01);
      this.showFloatingText(head.x, head.y - 20, `-${rawDmg} HP`, '#ef4444');

      if (lead.hp <= 0) {
        gameState.squad.shift();
        if (gameState.squad.length === 0) {
          this.onGameOver();
        } else {
          this.scene.restart();
        }
      }
    }
  }

  handleGemPickup(head, gem) {
    gem.destroy();
    gameState.gold += 1;
    gameState.totalGoldEarned += 1;
    this.showFloatingText(head.x, head.y - 15, '+$1 Gold', '#fbbf24');
  }

  spawnWaveEnemies() {
    if (this.waveEnded) return;
    const wave = gameState.currentWave;
    const maxEnemies = Math.min(12 + wave * 3, 50);

    if (this.enemies.getLength() < maxEnemies) {
      const keys = ['skeleton', 'zombie', 'goblin'];
      if (wave >= 5) keys.push('enemy_mage', 'enemy_swordsman');
      if (wave >= 10) keys.push('ogre', 'red_demon', 'blue_demon');

      if (wave % 5 === 0 && Math.random() < 0.15) {
        keys.push(wave >= 15 ? 'reaper_boss' : 'minotaur_boss');
      }

      const key = keys[Math.floor(Math.random() * keys.length)];
      const spec = MONSTER_SPECS[key];

      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) { x = Math.random() * this.worldWidth; y = -20; }
      else if (side === 1) { x = this.worldWidth + 20; y = Math.random() * this.worldHeight; }
      else if (side === 2) { x = Math.random() * this.worldWidth; y = this.worldHeight + 20; }
      else { x = -20; y = Math.random() * this.worldHeight; }

      const monster = this.physics.add.sprite(x, y, 'tiny_dungeon', spec.frame).setScale(spec.isBoss ? 2.5 : 1.5);
      const hpMult = 1.0 + (wave - 1) * 0.22;
      monster.hp = Math.floor(spec.hp * hpMult);
      monster.maxHp = monster.hp;
      monster.moveSpeed = spec.speed;

      this.enemies.add(monster);
    }
  }

  updateEnemyAI() {
    if (!this.squadHead || !this.squadHead.active) return;
    this.enemies.getChildren().forEach(e => {
      this.physics.moveToObject(e, this.squadHead, e.moveSpeed);
    });
  }

  showFloatingText(x, y, text, color) {
    const txt = this.add.text(x, y, text, {
      fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 'bold', color: color
    }).setOrigin(0.5);

    this.tweens.add({
      targets: txt, y: y - 24, alpha: 0, duration: 600, onComplete: () => txt.destroy()
    });
  }

  onWaveVictory() {
    if (this.waveEnded) return;
    this.waveEnded = true;

    if (this.waveTimerEvent) this.waveTimerEvent.destroy();
    if (this.spawnTimerEvent) this.spawnTimerEvent.destroy();

    this.scene.stop('UIScene');

    const baseReward = 5 + gameState.currentWave * 2;
    const interest = Math.min(5, Math.floor(gameState.gold / 5));
    gameState.gold += (baseReward + interest);
    gameState.totalGoldEarned += (baseReward + interest);
    gameState.currentWave++;

    if (!gameState.shopLocked) {
      gameState.lockedShopItems = null;
    }

    this.scene.start('ShopScene');
  }

  onGameOver() {
    if (this.waveEnded) return;
    this.waveEnded = true;

    if (this.waveTimerEvent) this.waveTimerEvent.destroy();
    if (this.spawnTimerEvent) this.spawnTimerEvent.destroy();

    this.scene.stop('UIScene');
    this.scene.start('GameOverScene');
  }
}

// --------------------------------------------------
// 5. UI SCENE (COMBAT HUD)
// --------------------------------------------------
class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init(data) {
    this.mainScene = data.mainScene;
  }

  create() {
    const width = this.cameras.main.width;

    this.add.rectangle(width / 2, 24, width, 48, 0x0f172a, 0.85);

    this.waveText = this.add.text(24, 15, `WAVE ${gameState.currentWave}`, {
      fontFamily: "'Press Start 2P', monospace", fontSize: '14px', color: '#00f2fe'
    });

    this.timerText = this.add.text(width / 2, 15, '⏱️ 30s', {
      fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 'bold', color: '#f8fafc'
    }).setOrigin(0.5, 0);

    this.goldText = this.add.text(width - 24, 15, `💰 Gold: ${gameState.gold}`, {
      fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 'bold', color: '#fbbf24'
    }).setOrigin(1.0, 0);
  }

  update() {
    if (this.mainScene && this.mainScene.waveTimer !== undefined) {
      this.timerText.setText(`⏱️ ${Math.max(0, this.mainScene.waveTimer)}s`);
      this.goldText.setText(`💰 Gold: ${gameState.gold}`);
    }
  }
}

// --------------------------------------------------
// 6. GAME OVER SCENE
// --------------------------------------------------
class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x180505, 0x180505, 0x030712, 0x030712, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height * 0.25, 'SQUAD DEFEATED', {
      fontFamily: "'Press Start 2P', monospace", fontSize: '26px', color: '#ef4444'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.40, `Reached Wave ${gameState.currentWave}\nEnemies Defeated: ${gameState.totalKills}\nTotal Gold Earned: ${gameState.totalGoldEarned}`, {
      fontFamily: 'Outfit, sans-serif', fontSize: '18px', color: '#cbd5e1', align: 'center', lineSpacing: 10
    }).setOrigin(0.5);

    const btn = this.add.rectangle(width / 2, height * 0.65, 240, 50, 0x00f2fe).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(width / 2, height * 0.65, 'TRY AGAIN', {
      fontFamily: "'Press Start 2P', monospace", fontSize: '14px', color: '#090d16'
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}

// --------------------------------------------------
// PHASER ENGINE INITIALIZATION
// --------------------------------------------------
const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, ShopScene, MainGameScene, UIScene, GameOverScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
