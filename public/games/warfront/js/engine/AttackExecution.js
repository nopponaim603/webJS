/**
 * @file AttackExecution.js
 * @description Gradual troop-ratio territory conquest engine, modeled after OpenFrontIO's
 * AttackExecution: launching an attack commits a pool of troops that spends itself capturing
 * frontier tiles over several ticks, rather than instantly flipping a single tile.
 * @module engine/AttackExecution
 */

/** Attacks below this troop count are considered spent and are cleaned up. */
const MIN_TROOPS_TO_CONTINUE = 1;

/** Upper/lower bound on how many frontier tiles a single attack can resolve per tick. */
const MIN_TILES_PER_TICK = 1;
const MAX_TILES_PER_TICK = 20;

/**
 * A single in-flight attack: an attacker's committed army pushing into a target's territory.
 */
export class Attack {
  /**
   * @param {number} id
   * @param {number} attackerId
   * @param {number} targetOwnerId - Owner being attacked; 0 means unclaimed/neutral land.
   * @param {number} troops - Committed troop pool (already deducted from the attacker's army).
   */
  constructor(id, attackerId, targetOwnerId, troops) {
    this.id = id;
    this.attackerId = attackerId;
    this.targetOwnerId = targetOwnerId;
    this.troops = troops;
    /** @type {number[]} Candidate tile indices (owned by targetOwnerId, adjacent to attacker) */
    this.frontier = [];
  }
}

/**
 * Drives all active attacks forward each tick: consumes troops to capture bordering
 * enemy/neutral tiles, and refunds whatever is left once an attack runs out of targets.
 */
export class AttackExecutionManager {
  /**
   * @param {import('./GameState.js').GameStateManager} gameState
   * @param {import('../core/TileMap.js').TileMap} tileMap
   */
  constructor(gameState, tileMap) {
    this.gameState = gameState;
    this.tileMap = tileMap;
    /** @type {Map<string, Attack>} keyed by "attackerId:targetOwnerId" */
    this.attacks = new Map();
    this.nextId = 1;
  }

  /**
   * Launch a new attack, or reinforce an existing attack already pushing toward the same target.
   * The caller is responsible for deducting `troops` from the attacker's player pool first.
   * @param {number} attackerId
   * @param {number} targetOwnerId
   * @param {number} troops
   * @returns {Attack|null}
   */
  launchAttack(attackerId, targetOwnerId, troops) {
    if (troops <= 0 || attackerId === targetOwnerId) return null;

    const key = `${attackerId}:${targetOwnerId}`;
    let attack = this.attacks.get(key);
    if (attack) {
      attack.troops += troops;
    } else {
      attack = new Attack(this.nextId++, attackerId, targetOwnerId, troops);
      this.attacks.set(key, attack);
    }
    return attack;
  }

  /**
   * Rebuild an attack's frontier queue from the attacker's current border tiles.
   * @param {Attack} attack
   */
  rebuildFrontier(attack) {
    const frontier = [];
    const seen = new Set();
    this.gameState.getBorderTiles(attack.attackerId).forEach((tileIndex) => {
      this.tileMap.onNeighbors(tileIndex, (nIndex) => {
        if (seen.has(nIndex)) return;
        if (this.gameState.getOwner(nIndex) !== attack.targetOwnerId) return;
        const tileType = this.tileMap.getTileType(nIndex);
        if (!tileType || !tileType.conquerable) return;
        seen.add(nIndex);
        frontier.push(nIndex);
      });
    });
    attack.frontier = frontier;
  }

  /**
   * Advance every active attack by one tick.
   */
  tick() {
    if (this.attacks.size === 0) return;
    for (const [key, attack] of this.attacks) {
      if (!this.processAttackTick(attack)) {
        this.settleAttack(attack);
        this.attacks.delete(key);
      }
    }
  }

  /**
   * Process a single tick of one attack: spend troops capturing frontier tiles.
   * @param {Attack} attack
   * @returns {boolean} False when the attack should end (spent or out of contact).
   */
  processAttackTick(attack) {
    const attackerPlayer = this.gameState.getPlayer(attack.attackerId);
    if (!attackerPlayer || !attackerPlayer.isAlive() || attack.troops < MIN_TROOPS_TO_CONTINUE) {
      return false;
    }

    if (attack.frontier.length === 0) {
      this.rebuildFrontier(attack);
      if (attack.frontier.length === 0) return false; // no more contact with the target
    }

    const tilesThisTick = Math.max(
      MIN_TILES_PER_TICK,
      Math.min(MAX_TILES_PER_TICK, Math.round(Math.sqrt(attack.troops) / 2))
    );
    let processed = 0;

    while (processed < tilesThisTick && attack.frontier.length > 0 && attack.troops >= MIN_TROOPS_TO_CONTINUE) {
      const tileIndex = attack.frontier.pop();
      processed++;

      // Tile may have already flipped (captured from another frontier entry, or by someone else).
      if (this.gameState.getOwner(tileIndex) !== attack.targetOwnerId) continue;
      const tileType = this.tileMap.getTileType(tileIndex);
      if (!tileType || !tileType.conquerable) continue;

      const defenderPlayer = attack.targetOwnerId > 0 ? this.gameState.getPlayer(attack.targetOwnerId) : null;
      const defenderDensity = defenderPlayer
        ? defenderPlayer.getTroops() / Math.max(1, defenderPlayer.getTerritorySize())
        : 0;

      const cost = tileType.expansionCost * (1 + defenderDensity * 0.15);
      if (attack.troops < cost) break; // not enough force left to take this tile this tick

      attack.troops -= cost;
      if (defenderPlayer) {
        defenderPlayer.removeTroops(Math.max(1, Math.round(cost * 0.5)));
      }

      this.gameState.conquerTile(tileIndex, attack.attackerId);

      // Capturing this tile may expose new frontier tiles still owned by the target.
      this.tileMap.onNeighbors(tileIndex, (nIndex) => {
        if (this.gameState.getOwner(nIndex) !== attack.targetOwnerId) return;
        const tt = this.tileMap.getTileType(nIndex);
        if (tt && tt.conquerable) attack.frontier.push(nIndex);
      });
    }

    return attack.troops >= MIN_TROOPS_TO_CONTINUE;
  }

  /**
   * Refund whatever troops remain in a finished attack back to the attacker's army.
   * @param {Attack} attack
   */
  settleAttack(attack) {
    const attackerPlayer = this.gameState.getPlayer(attack.attackerId);
    if (attackerPlayer && attack.troops > 0) {
      attackerPlayer.addTroops(attack.troops);
    }
  }

  /**
   * Cancel and refund every attack a player currently has in flight (e.g. on death).
   * @param {number} playerId
   */
  cancelAttacksBy(playerId) {
    for (const [key, attack] of this.attacks) {
      if (attack.attackerId === playerId) {
        this.settleAttack(attack);
        this.attacks.delete(key);
      }
    }
  }

  /**
   * @param {number} attackerId
   * @param {number} targetOwnerId
   * @returns {boolean} True if this attacker already has an in-flight attack on that target.
   */
  hasActiveAttack(attackerId, targetOwnerId) {
    return this.attacks.has(`${attackerId}:${targetOwnerId}`);
  }

  /**
   * @returns {Attack[]} All currently active attacks (for HUD/visualization purposes).
   */
  getActiveAttacks() {
    return Array.from(this.attacks.values());
  }
}
