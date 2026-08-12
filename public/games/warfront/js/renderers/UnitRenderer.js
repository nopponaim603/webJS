/**
 * @file UnitRenderer.js
 * @description Naval Vessel Boats & Territory Troop Count Badge Renderer.
 * @module renderers/UnitRenderer
 */

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
 * Troop Badges & Boat Animation Canvas Renderer
 */
export class UnitRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('../engine/GameState.js').GameStateManager} gameState
   */
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
    this.gameState = gameState;
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
   * Render troop count labels and naval boats.
   */
  render() {
    if (!this.ctx || !this.gameState) return;

    const ctx = this.ctx;
    ctx.save();

    // Apply camera transformation
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoom, this.zoom);

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

    // Draw Troop Labels for active players
    const players = this.gameState.getPlayers().filter((p) => p.isAlive() && p.getTerritorySize() > 0);
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dynamic position per player ID based on spawn quadrants
    const spawnCoords = {
      1: { x: 168, y: 140 }, // Player (Top Left)
      2: { x: 808, y: 140 }, // Bot 1 (Top Right)
      3: { x: 168, y: 780 }, // Bot 2 (Bottom Left)
      4: { x: 808, y: 780 }  // Bot 3 (Bottom Right)
    };

    for (const player of players) {
      const pos = spawnCoords[player.id] || { x: 100 + player.id * 100, y: 100 };
      const posX = pos.x;
      const posY = pos.y;

      // Draw shadow badge background
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.beginPath();
      ctx.roundRect(posX - 55, posY - 14, 110, 28, 6);
      ctx.fill();

      // Draw Player Name & Troop Count text
      ctx.fillStyle = player.baseColor || "#ffffff";
      ctx.fillText(`${player.name}: ${UnitRenderer.formatTroopCount(player.getTroops())}`, posX, posY);
    }

    ctx.restore();
  }
}