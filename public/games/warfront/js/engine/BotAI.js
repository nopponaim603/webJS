/**
 * @file BotAI.js
 * @description Singleplayer AI Bot Decision Engine, Attack Strategies, & Naval Assault Logic.
 * @module engine/BotAI
 */

/**
 * Simple Ground Expansion & Target Selection Strategy
 */
export class SimpleAttackStrategy {
  /**
   * @param {number} dropAttackChance - Chance (0-100) to pass turn without attacking
   * @param {number} targetSmallChance - Chance (0-100) to prioritize small targets (<10% bot size)
   * @param {number} targetNonPlayerChance - Chance (0-100) to prioritize AI targets over human player
   * @param {number} densityChoiceChance - Chance (0-100) to target lowest troop density player
   */
  constructor(
    dropAttackChance = 10,
    targetSmallChance = 50,
    targetNonPlayerChance = 30,
    densityChoiceChance = 20
  ) {
    this.dropAttackChance = dropAttackChance;
    this.targetSmallChance = targetSmallChance;
    this.targetNonPlayerChance = targetNonPlayerChance;
    this.densityChoiceChance = densityChoiceChance;
  }

  /**
   * Select best attack target for the bot player.
   * @param {import('./GameState.js').Player} botPlayer
   * @param {import('./GameState.js').GameStateManager} gameState
   * @param {number[]} adjacentOwnerIds - List of adjacent tile owner IDs
   * @returns {number|null} Target player/owner ID to attack
   */
  selectTarget(botPlayer, gameState, adjacentOwnerIds) {
    if (adjacentOwnerIds.length === 0) return null;

    // 1. If unowned neutral land exists, capture it first
    if (adjacentOwnerIds.includes(0)) return 0;

    // 2. Random chance to withhold attack
    if (Math.random() * 100 < this.dropAttackChance) return null;

    let targetCandidates = [...adjacentOwnerIds];

    // 3. Prioritize small opponents
    if (Math.random() * 100 < this.targetSmallChance) {
      const smallTargets = targetCandidates.filter((ownerId) => {
        const targetPlayer = gameState.getPlayer(ownerId);
        return targetPlayer && targetPlayer.getTerritorySize() < 0.1 * botPlayer.getTerritorySize();
      });
      if (smallTargets.length > 0) targetCandidates = smallTargets;
    }

    // 4. Density choice (weakest defended target)
    if (Math.random() * 100 < this.densityChoiceChance) {
      let lowestDensity = Infinity;
      let selectedTarget = null;
      for (const ownerId of targetCandidates) {
        const player = gameState.getPlayer(ownerId);
        if (player) {
          const density = player.getTroops() / Math.max(1, player.getTerritorySize());
          if (density < lowestDensity) {
            lowestDensity = density;
            selectedTarget = ownerId;
          }
        }
      }
      if (selectedTarget !== null) return selectedTarget;
    }

    // Random choice from available candidates
    return targetCandidates[Math.floor(Math.random() * targetCandidates.length)];
  }
}

/**
 * Naval Boat Attack Strategy across water bodies
 */
export class BoatAttackStrategy {
  /**
   * Evaluate whether bot should launch naval boat attack.
   * @param {import('./GameState.js').Player} botPlayer
   * @returns {boolean} True if boat attack triggered
   */
  shouldLaunchBoatAttack(botPlayer) {
    if (!botPlayer.isAlive() || botPlayer.troops < 50) return false;
    return Math.random() * 100 < 25; // 25% chance per attempt
  }
}

/**
 * Cooldown Constraint for Bot Actions
 */
export class CooldownBotConstraints {
  /**
   * @param {number} cooldownTicks - Minimum ticks between attacks
   */
  constructor(cooldownTicks = 15) {
    this.cooldownTicks = cooldownTicks;
    this.lastAttackTick = -cooldownTicks;
  }

  /**
   * Check if cooldown has elapsed.
   * @param {number} currentTick
   * @returns {boolean}
   */
  canAttack(currentTick) {
    if (currentTick - this.lastAttackTick >= this.cooldownTicks) {
      this.lastAttackTick = currentTick;
      return true;
    }
    return false;
  }
}

/**
 * High Level Bot AI Orchestrator Controller
 */
export class BotAI {
  /**
   * @param {import('./GameState.js').GameStateManager} gameState
   */
  constructor(gameState) {
    this.gameState = gameState;
    this.attackStrategy = new SimpleAttackStrategy();
    this.boatStrategy = new BoatAttackStrategy();
    this.cooldowns = new Map();
  }

  /**
   * Update AI decisions for all active bots.
   * @param {function(number, number): void} onLaunchAttack Callback to send troop attack (fromPlayerId, toOwnerId)
   */
  update(onLaunchAttack) {
    const currentTick = this.gameState.ticks;
    const botPlayers = this.gameState.getPlayers().filter((p) => p.isBot && p.isAlive());

    for (const bot of botPlayers) {
      if (!this.cooldowns.has(bot.id)) {
        this.cooldowns.set(bot.id, new CooldownBotConstraints(10 + Math.floor(Math.random() * 15)));
      }
      const cooldown = this.cooldowns.get(bot.id);

      if (cooldown.canAttack(currentTick)) {
        const allOtherOwnerIds = Array.from(this.gameState.players.keys()).filter((id) => id !== bot.id);
        const targetId = this.attackStrategy.selectTarget(bot, this.gameState, allOtherOwnerIds);
        if (targetId !== null && onLaunchAttack) {
          onLaunchAttack(bot.id, targetId);
        }
      }
    }
  }
}