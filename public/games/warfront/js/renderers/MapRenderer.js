/**
 * @file MapRenderer.js
 * @description Terrain & Player Territory Boundary Canvas Renderer.
 * @module renderers/MapRenderer
 */

/** Pixels per tile at zoom = 1. */
const TILE_SIZE = 16;

/**
 * Canvas Map Background & Territory Color Overlay Renderer.
 *
 * Terrain is static once the map is generated, so it is rendered once onto an
 * offscreen bitmap and then just blitted every frame. Territory ownership changes
 * a handful of tiles at a time (attacks resolve gradually), so the ownership overlay
 * is only repainted for tiles GameStateManager reports as "dirty" since the last
 * frame, instead of redrawing every tile on the map every frame.
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

    this.terrainLayer = null;
    this.overlayLayer = null;
    this.overlayCtx = null;

    if (this.tileMap) {
      this.buildTerrainLayer();
      this.buildOverlayLayer();
    }
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
   * Render the full terrain grid once into an offscreen bitmap.
   */
  buildTerrainLayer() {
    const mapWidth = this.tileMap.width;
    const mapHeight = this.tileMap.height;

    const layer = document.createElement("canvas");
    layer.width = mapWidth * TILE_SIZE;
    layer.height = mapHeight * TILE_SIZE;
    const ctx = layer.getContext("2d");

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const index = y * mapWidth + x;
        const tileType = this.tileMap.getTileType(index);
        ctx.fillStyle = tileType ? tileType.colorBase : "#1e4d79";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    this.terrainLayer = layer;
  }

  /**
   * Create an empty (transparent) offscreen bitmap for the territory ownership overlay.
   */
  buildOverlayLayer() {
    const layer = document.createElement("canvas");
    layer.width = this.tileMap.width * TILE_SIZE;
    layer.height = this.tileMap.height * TILE_SIZE;
    this.overlayLayer = layer;
    this.overlayCtx = layer.getContext("2d");
  }

  /**
   * Repaint only the overlay cells whose ownership changed since the last frame.
   */
  updateOverlay() {
    if (!this.overlayCtx || !this.gameState || !this.gameState.consumeDirtyTiles) return;

    const dirtyTiles = this.gameState.consumeDirtyTiles();
    if (dirtyTiles.size === 0) return;

    const mapWidth = this.tileMap.width;
    const ctx = this.overlayCtx;

    dirtyTiles.forEach((index) => {
      const x = index % mapWidth;
      const y = Math.floor(index / mapWidth);
      const ownerId = this.gameState.getOwner(index);

      if (ownerId > 0) {
        const ownerPlayer = this.gameState.getPlayer(ownerId);
        ctx.fillStyle = ownerPlayer ? ownerPlayer.baseColor : "#ffffff";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.clearRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    });
  }

  /**
   * Draw the terrain + territory overlay bitmaps into the viewport.
   */
  render() {
    if (!this.ctx || !this.tileMap || !this.terrainLayer) return;

    this.updateOverlay();

    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply viewport transform (pan & zoom)
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoom, this.zoom);

    ctx.drawImage(this.terrainLayer, 0, 0);
    if (this.overlayLayer) {
      ctx.drawImage(this.overlayLayer, 0, 0);
    }

    ctx.restore();
  }
}

export { TILE_SIZE };
