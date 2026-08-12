/**
 * @file TileMap.js
 * @description Core Map Grid, Terrain Tile Types, and Coordinate Indexing Utilities.
 * @module core/TileMap
 */

/**
 * Standard Terrain Tile Definition
 */
export class TileType {
  /**
   * @param {number} id - Unique numeric identifier for the tile type
   * @param {string} name - Human-readable terrain name (e.g. "Grass", "Water", "Mountain")
   * @param {string} colorBase - Base CSS or HEX color string
   * @param {number} colorVariant - Color variation index
   * @param {boolean} conquerable - Whether territory can be captured
   * @param {boolean} navigable - Whether units can cross this tile
   * @param {number} expansionTime - Delay ticks to expand into this tile type
   * @param {number} expansionCost - Troop cost required to capture
   */
  constructor(id, name, colorBase, colorVariant, conquerable, navigable, expansionTime = 1, expansionCost = 1) {
    this.id = id;
    this.name = name;
    this.colorBase = colorBase;
    this.colorVariant = colorVariant;
    this.conquerable = conquerable;
    this.navigable = navigable;
    this.expansionTime = expansionTime;
    this.expansionCost = expansionCost;
  }
}

/**
 * Default Terrain Types Registry for WarFront maps
 */
export const DEFAULT_TILE_TYPES = [
  new TileType(0, "Deep Water", "#0f2b48", 0, false, false, 0, 0),
  new TileType(1, "Coastal Water", "#1e4d79", 0, false, true, 2, 2),
  new TileType(2, "Plains / Land", "#2d7d46", 0, true, true, 1, 1),
  new TileType(3, "Highlands", "#439655", 0, true, true, 1, 1),
  new TileType(4, "Mountain", "#4a5568", 0, false, false, 0, 0)
];

/**
 * Grid Map Data Container & Neighbor Search Utility
 */
export class TileMap {
  /**
   * @param {number} width - Map column count
   * @param {number} height - Map row count
   * @param {Uint8Array|number[]} tiles - One-dimensional tile index array
   * @param {TileType[]} [types] - Registered terrain types list
   */
  constructor(width, height, tiles, types = DEFAULT_TILE_TYPES) {
    this.width = width;
    this.height = height;
    this.tiles = tiles instanceof Uint8Array ? tiles : new Uint8Array(tiles);
    this.types = types;
    this.totalTiles = width * height;
  }

  /**
   * Convert 2D grid coordinates (x, y) into 1D array index.
   * @param {number} x
   * @param {number} y
   * @returns {number}
   */
  xyToIndex(x, y) {
    return y * this.width + x;
  }

  /**
   * Convert 1D array index into 2D grid coordinates {x, y}.
   * @param {number} index
   * @returns {{x: number, y: number}}
   */
  indexToXY(index) {
    return {
      x: index % this.width,
      y: Math.floor(index / this.width)
    };
  }

  /**
   * Check if 2D coordinates fall within valid map bounds.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Get the tile type ID at a 1D index.
   * @param {number} index
   * @returns {number}
   */
  getTileId(index) {
    return this.tiles[index];
  }

  /**
   * Get the TileType instance at a 1D index.
   * @param {number} index
   * @returns {TileType|undefined}
   */
  getTileType(index) {
    const typeId = this.tiles[index];
    return this.types[typeId];
  }

  /**
   * Execute callback for all valid 4-way orthogonal neighbors (up, down, left, right).
   * @param {number} index - Center tile index
   * @param {function(number): void} callback - Function called with neighbor index
   */
  onNeighbors(index, callback) {
    const x = index % this.width;
    const y = Math.floor(index / this.width);

    if (x > 0) callback(index - 1);
    if (x < this.width - 1) callback(index + 1);
    if (y > 0) callback(index - this.width);
    if (y < this.height - 1) callback(index + this.width);
  }

  /**
   * Get array of all valid orthogonal neighbor tile indices.
   * @param {number} index
   * @returns {number[]}
   */
  getNeighbors(index) {
    const neighbors = [];
    this.onNeighbors(index, (nIndex) => neighbors.push(nIndex));
    return neighbors;
  }

  /**
   * Check if a tile is water terrain.
   * @param {number} index
   * @returns {boolean}
   */
  isWater(index) {
    const tileType = this.getTileType(index);
    return tileType ? !tileType.conquerable && tileType.navigable : false;
  }
}