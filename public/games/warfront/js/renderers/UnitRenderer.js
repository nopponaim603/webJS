/**
 * @file UnitRenderer.js
 * @description Naval Vessel Boats, Territory Troop Count Badges, & Active Attack Line Renderer.
 * @module renderers/UnitRenderer
 */

import { TILE_SIZE } from "./MapRenderer.js";

/**
 * Naval Boat Vessel Entity Data
 */
export class BoatEntity {
  /**
   * @param {number} id
   * @param {import('../engine/GameState.js').Player} player
   * @param {number[]} path - Waypoint tile index array
   * @param {number} troopAmount
   */
  constructor(id, player, path, troopAmount) {
    this.id = id;
    this.player = player;
    this.path = path;
    this.troopAmount = troopAmount;
    this.progress = 0; // 0.0 to 1.0 along route
    this.x = 0;
    this.y = 0;
  }
}

/**
 * Troop Badges, Boat Animation, & Attack Line Canvas Renderer
 */
export class UnitRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('../engine/GameState.js').GameStateManager} gameState
   * @param {import('../core/TileMap.js').TileMap} [tileMap]
   */
  constructor(canvas, gameState, tileMap = null) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
    this.gameState = gameState;
    this.tileMap = tileMap;
    /** @type {import('../engine/AttackExecution.js').AttackExecutionManager|null} */
    this.attackManager = null;
    /** @type {BoatEntity[]} */
    this.activeBoats = [];

    // Viewport transform
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 1;
  }

  setViewport(x, y, zoom) {
    this.offsetX = x;
    this.offsetY = y;
    this.zoom = zoom;
  }

  /**
   * Wire in the attack manager so in-flight attacks can be drawn as front lines.
   * @param {import('../engine/AttackExecution.js').AttackExecutionManager} attackManager
   */
  setAttackManager(attackManager) {
    this.attackManager = attackManager;
  }

  /**
   * Convert a tile index into world pixel coordinates at the tile's center.
   * @param {number} tileIndex
   * @returns {{x: number, y: number}}
   */
  tileToWorldPoint(tileIndex) {
    const width = this.tileMap ? this.tileMap.width : 1;
    const x = tileIndex % width;
    const y = Math.floor(tileIndex / width);
    return { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 };
  }

  /**
   * Pick a stable anchor point for a player's troop label: their capital tile if
   * still owned, otherwise any tile currently on their border, otherwise none.
   * @param {import('../engine/GameState.js').Player} player
   * @returns {{x: number, y: number}|null}
   */
  getPlayerAnchor(player) {
    if (!this.tileMap || !this.gameState) return null;

    if (player.capitalIndex >= 0 && this.gameState.getOwner(player.capitalIndex) === player.id) {
      return this.tileToWorldPoint(player.capitalIndex);
    }

    const border = this.gameState.getBorderTiles(player.id);
    for (const tileIndex of border) {
      return this.tileToWorldPoint(tileIndex);
    }
    return null;
  }

  /**
   * Format large troop numbers for clean HUD overlay (e.g., 1.5K, 2.3M)
   * @param {number} num
   * @returns {string}
   */
  static formatTroopCount(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return String(Math.floor(num));
  }

  /**
   * Render troop count labels, naval boats, and active attack front lines.
   */
  render() {
    if (!this.ctx || !this.gameState) return;

    const ctx = this.ctx;
    ctx.save();

    // Apply camera transformation
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoom, this.zoom);

    this.renderActiveAttacks(ctx);

    // Draw active naval boats
    for (const boat of this.activeBoats) {
      ctx.fillStyle = boat.player ? boat.player.baseColor : "#ffffff";
      ctx.beginPath();
      ctx.arc(boat.x, boat.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    this.renderTroopLabels(ctx);

    ctx.restore();
  }

  /**
   * Draw a dashed front-line from each attacker's capital toward the tiles they're
   * currently capturing, so a gradual attack is visible while it plays out.
   * @param {CanvasRenderingContext2D} ctx
   */
  renderActiveAttacks(ctx) {
    if (!this.attackManager || !this.tileMap) return;

    for (const attack of this.attackManager.getActiveAttacks()) {
      const attacker = this.gameState.getPlayer(attack.attackerId);
      if (!attacker) continue;

      const from = this.getPlayerAnchor(attacker);
      if (!from || attack.frontier.length === 0) continue;

      // Average a handful of frontier tiles for a stable-ish front-line point.
      const sampleCount = Math.min(5, attack.frontier.length);
      let sumX = 0, sumY = 0;
      for (let i = 0; i < sampleCount; i++) {
        const point = this.tileToWorldPoint(attack.frontier[attack.frontier.length - 1 - i]);
        sumX += point.x;
        sumY += point.y;
      }
      const to = { x: sumX / sampleCount, y: sumY / sampleCount };

      ctx.save();
      ctx.strokeStyle = attacker.baseColor || "#ffffff";
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = attacker.baseColor || "#ffffff";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(UnitRenderer.formatTroopCount(attack.troops), to.x, to.y - 10);
    }
  }

  /**
   * Draw the name/troop-count badge for each alive player above their capital
   * (or their current frontier if the capital has been lost).
   * @param {CanvasRenderingContext2D} ctx
   */
  renderTroopLabels(ctx) {
    const players = this.gameState.getPlayers().filter((p) => p.isAlive() && p.getTerritorySize() > 0);
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const player of players) {
      const anchor = this.getPlayerAnchor(player);
      if (!anchor) continue;
      const posX = anchor.x;
      const posY = anchor.y - 20; // hover the badge just above the capital tile

      // Draw shadow badge background
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.beginPath();
      ctx.roundRect(posX - 55, posY - 14, 110, 28, 6);
      ctx.fill();

      // Draw Player Name & Troop Count text
      ctx.fillStyle = player.baseColor || "#ffffff";
      ctx.fillText(`${player.name}: ${UnitRenderer.formatTroopCount(player.getTroops())}`, posX, posY);
    }
  }
}
