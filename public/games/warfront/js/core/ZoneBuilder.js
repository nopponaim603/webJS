/**
 * @file ZoneBuilder.js
 * @description Region Flood-Fill Zone Explorer, Contour Boundary Builder, & Map Serialization.
 * @module core/ZoneBuilder
 */

/**
 * Region Zone Data Representation
 */
export class Zone {
  /**
   * @param {number} id - Zone type / tile ID
   * @param {Uint16Array} tileMap - Map array storing assigned zone IDs per tile
   * @param {number[]} leftBorder - Array of tile indices forming the left border
   * @param {boolean[]} leftBorderMap - Lookup array for left border membership
   * @param {number[]} topBorder - Array of tile indices forming the top border
   * @param {boolean[]} topBorderMap - Lookup array for top border membership
   */
  constructor(id, tileMap, leftBorder, leftBorderMap, topBorder, topBorderMap) {
    this.id = id;
    this.tileMap = tileMap;
    this.leftBorder = leftBorder;
    this.leftBorderMap = leftBorderMap;
    this.topBorder = topBorder;
    this.topBorderMap = topBorderMap;
  }
}

/**
 * Zone Builder & Contour Line Calculator
 */
export class ZoneBuilder {
  /**
   * Scan map grid and group contiguous tiles into contiguous zones.
   * @param {{width: number, height: number, tiles: Uint8Array|number[]}} mapData
   * @returns {Zone[]} List of discovered zones
   */
  static buildZones(mapData) {
    const zones = [];
    const visitedZoneMap = new Uint16Array(mapData.width * mapData.height);

    for (let index = 0; index < mapData.tiles.length; index++) {
      if (!visitedZoneMap[index]) {
        const zone = this.exploreZone(
          index,
          mapData.tiles,
          mapData.width,
          visitedZoneMap,
          zones.length + 1
        );
        zones.push(zone);
      }
    }
    return zones;
  }

  /**
   * Explore a single contiguous zone using a non-recursive stack flood fill.
   * @param {number} startTileIndex
   * @param {Uint8Array|number[]} tiles
   * @param {number} width
   * @param {Uint16Array} visitedZoneMap
   * @param {number} nextZoneId
   * @returns {Zone}
   */
  static exploreZone(startTileIndex, tiles, width, visitedZoneMap, nextZoneId) {
    const stack = [startTileIndex];
    let stackPointer = 1;

    const leftBorder = [];
    const leftBorderMap = [];
    const topBorder = [];
    const topBorderMap = [];

    const targetTileType = tiles[startTileIndex];

    while (stackPointer > 0) {
      const current = stack[--stackPointer];

      if (!visitedZoneMap[current]) {
        visitedZoneMap[current] = nextZoneId;

        // Check Left Neighbor
        if (current % width !== 0 && tiles[current - 1] === targetTileType) {
          stack[stackPointer++] = current - 1;
        } else if (!leftBorderMap[current]) {
          leftBorder.push(current);
          leftBorderMap[current] = true;
        }

        // Check Right Neighbor
        if (current % width !== width - 1 && tiles[current + 1] === targetTileType) {
          stack[stackPointer++] = current + 1;
        }

        // Check Top Neighbor
        if (current >= width && tiles[current - width] === targetTileType) {
          stack[stackPointer++] = current - width;
        } else if (!topBorderMap[current]) {
          topBorder.push(current);
          topBorderMap[current] = true;
        }

        // Check Bottom Neighbor
        if (current < tiles.length - width && tiles[current + width] === targetTileType) {
          stack[stackPointer++] = current + width;
        }
      }
    }

    return new Zone(
      targetTileType,
      visitedZoneMap,
      leftBorder,
      leftBorderMap,
      topBorder,
      topBorderMap
    );
  }
}

/**
 * Compressed Map Writer Utility
 */
export class MapCompressor {
  constructor() {
    this.width = 0;
  }

  /**
   * Write compressed tile map format to a BitWriter stream.
   * @param {import('./BitReader.js').BitWriter} bitWriter
   * @param {import('./TileMap.js').TileMap} map
   */
  writeCompressed(bitWriter, map) {
    bitWriter.writeBits(8, 0);
    this.width = map.width;

    const zones = ZoneBuilder.buildZones(map);
    const validTypes = this.validateTileTypeUsage(map.types, zones);
    const bitsPerId = Math.ceil(Math.log2(validTypes.length));

    bitWriter.writeBits(1, 0);
    this.writeTypeMap(bitWriter, map.types);
  }

  writeTypeMap(bitWriter, types) {
    bitWriter.writeBits(16, types.length);
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      bitWriter.writeBits(3, 0);
      bitWriter.writeString(32, type.name || "");
      bitWriter.writeString(16, type.colorBase || "#000000");
      bitWriter.writeBits(4, type.colorVariant || 0);
      bitWriter.writeBoolean(type.conquerable || false);
      bitWriter.writeBoolean(type.navigable || false);
      bitWriter.writeBits(8, type.expansionTime || 1);
      bitWriter.writeBits(8, type.expansionCost || 1);
    }
  }

  validateTileTypeUsage(types, zones) {
    const usage = Array(types.length).fill(null).map(() => []);
    for (const zone of zones) {
      if (!types[zone.id]) {
        throw new Error(`Unknown tile type ID: ${zone.id}`);
      }
      usage[zone.id].push(zone);
    }
    return types.filter((_, idx) => usage[idx].length > 0);
  }
}