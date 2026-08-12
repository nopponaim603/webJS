/**
 * @file MapRenderer.js
 * @description Terrain & Player Territory Boundary Canvas Renderer.
 * @module renderers/MapRenderer
 */

/**
 * Canvas Map Background & Territory Color Overlay Renderer
 */
export class MapRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('../core/TileMap.js').TileMap} tileMap
   * @param {import('../engine/GameState.js').GameStateManager} gameState
   */
  constructor(canvas, tileMap, gameState) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
    this.tileMap = tileMap;
    this.gameState = gameState;

    // Viewport transform
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 1;
  }

  /**
   * Set canvas dimensions.
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Update camera viewport pan offset and zoom level.
   * @param {number} x
   * @param {number} y
   * @param {number} zoom
   */
  setViewport(x, y, zoom) {
    this.offsetX = x;
    this.offsetY = y;
    this.zoom = zoom;
  }

  /**
   * Draw the entire map background and player territories.
   */
  render() {
    if (!this.ctx || !this.tileMap) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply viewport transform (pan & zoom)
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoom, this.zoom);

    const mapWidth = this.tileMap.width;
    const mapHeight = this.tileMap.height;
    const tileSize = 16; // 16px per tile base grid size

    // Draw base terrain grid
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const index = y * mapWidth + x;
        const ownerId = this.gameState ? this.gameState.getOwner(index) : 0;
        const tileType = this.tileMap.getTileType(index);

        let fillColor = tileType ? tileType.colorBase : "#1e4d79";

        // Territory owner overlay color
        if (ownerId > 0 && this.gameState) {
          const ownerPlayer = this.gameState.getPlayer(ownerId);
          if (ownerPlayer) {
            fillColor = ownerPlayer.baseColor;
          }
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    ctx.restore();
  }
}