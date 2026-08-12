/**
 * @file GameState.js
 * @description Player Model, Territory Ownership, Income Generation, & Game State Management.
 * @module engine/GameState
 */

/**
 * Player Entity Model
 */
export class Player {
  /**
   * @param {number} id - Unique numeric player ID
   * @param {string} name - Player username or bot name
   * @param {string} baseColor - Player primary territory HEX/RGB color
   */
  constructor(id, name, baseColor) {
    this.id = id;
    this.name = name;
    this.baseColor = baseColor;
    this.troops = 1000;
    this.territorySize = 0;
    this.alive = true;
    this.isBot = false;
    /** @type {number} Tile index of this player's spawn/capital, or -1 if unset. */
    this.capitalIndex = -1;
  }

  /**
   * Add a tile to the player's territory count.
   * @param {number} tileIndex
   */
  addTile(tileIndex) {
    this.territorySize++;
  }

  /**
   * Remove a tile from the player's territory count.
   * @param {number} tileIndex
   */
  removeTile(tileIndex) {
    this.territorySize = Math.max(0, this.territorySize - 1);
    if (this.territorySize === 0) {
      this.alive = false;
    }
  }

  /**
   * Process passive troop income tick.
   */
  processIncome() {
    if (!this.alive) return;
    const baseIncome = Math.floor(this.territorySize / 10);
    const scalingFactor = Math.floor(Math.pow(0.6, 1 - Math.log(this.troops + 1) / Math.LN2));
    const income = Math.max(1, baseIncome + scalingFactor);
    this.addTroops(income);
  }

  getTroops() {
    return this.troops;
  }

  addTroops(amount) {
    const maxCapacity = 100 * Math.max(1, this.territorySize);
    this.troops = Math.min(maxCapacity, this.troops + amount);
  }

  removeTroops(amount) {
    this.troops = Math.max(0, this.troops - amount);
  }

  getTerritorySize() {
    return this.territorySize;
  }

  isAlive() {
    return this.alive && this.territorySize > 0;
  }
}

/**
 * Global Game State Manager
 */
export class GameStateManager {
  static OWNER_NONE = 0;
  static OWNER_WATER = -1;
  static EMPTY_SET = new Set();

  constructor() {
    /** @type {Map<number, Player>} */
    this.players = new Map();
    /** @type {Int16Array|null} Array of tile owner player IDs */
    this.tileOwners = null;
    /** @type {import('../core/TileMap.js').TileMap|null} */
    this.tileMap = null;
    /** @type {Map<number, Set<number>>} playerId -> tile indices bordering foreign territory */
    this.borderTiles = new Map();
    /** @type {Set<number>} Tile indices whose owner changed since the last render consumed them */
    this.dirtyTiles = new Set();
    /** @type {number} Game tick count */
    this.ticks = 0;
    /** @type {number} Total elapsed seconds */
    this.elapsedSeconds = 0;
    /** @type {boolean} */
    this.isRunning = false;
  }

  /**
   * Initialize game state with a map and players.
   * @param {import('../core/TileMap.js').TileMap} tileMap
   * @param {Player[]} playerList
   */
  init(tileMap, playerList) {
    this.tileMap = tileMap;
    this.tileOwners = new Int16Array(tileMap.totalTiles);
    this.tileOwners.fill(GameStateManager.OWNER_NONE);
    this.players.clear();
    this.borderTiles.clear();
    this.dirtyTiles.clear();

    playerList.forEach((player) => {
      this.players.set(player.id, player);
    });

    this.ticks = 0;
    this.elapsedSeconds = 0;
    this.isRunning = true;
  }

  /**
   * Add a player to the match.
   * @param {Player} player
   */
  addPlayer(player) {
    this.players.set(player.id, player);
  }

  /**
   * Get player by numeric ID.
   * @param {number} playerId
   * @returns {Player|undefined}
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Get all registered players list.
   * @returns {Player[]}
   */
  getPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Get owner ID of a tile.
   * @param {number} tileIndex
   * @returns {number}
   */
  getOwner(tileIndex) {
    return this.tileOwners ? this.tileOwners[tileIndex] : GameStateManager.OWNER_NONE;
  }

  /**
   * Conquer/capture a tile for a target player.
   * @param {number} tileIndex
   * @param {number} newOwnerId
   */
  conquerTile(tileIndex, newOwnerId) {
    if (!this.tileOwners) return;

    const previousOwnerId = this.tileOwners[tileIndex];
    if (previousOwnerId === newOwnerId) return;

    if (previousOwnerId > GameStateManager.OWNER_NONE) {
      const prevPlayer = this.getPlayer(previousOwnerId);
      if (prevPlayer) prevPlayer.removeTile(tileIndex);
    }

    this.tileOwners[tileIndex] = newOwnerId;
    const newPlayer = this.getPlayer(newOwnerId);
    if (newPlayer) newPlayer.addTile(tileIndex);

    this.dirtyTiles.add(tileIndex);

    // Border status of this tile and every neighbor may have just changed.
    this.refreshBorderStatus(tileIndex);
    if (this.tileMap) {
      this.tileMap.onNeighbors(tileIndex, (nIndex) => this.refreshBorderStatus(nIndex));
    }
  }

  /**
   * Recompute whether a tile is a "border" tile (owned tile touching foreign
   * territory) and keep the owner's border set up to date. Border sets are
   * what let attacks and bot AI find contested frontiers without scanning
   * the whole map every tick.
   * @param {number} tileIndex
   */
  refreshBorderStatus(tileIndex) {
    if (!this.tileMap) return;
    const owner = this.tileOwners[tileIndex];
    if (owner <= GameStateManager.OWNER_NONE) return;

    let isBorder = false;
    this.tileMap.onNeighbors(tileIndex, (nIndex) => {
      if (this.tileOwners[nIndex] !== owner) isBorder = true;
    });

    let set = this.borderTiles.get(owner);
    if (!set) {
      set = new Set();
      this.borderTiles.set(owner, set);
    }
    if (isBorder) {
      set.add(tileIndex);
    } else {
      set.delete(tileIndex);
    }
  }

  /**
   * Get a player's current frontier tile set (owned tiles touching foreign territory).
   * @param {number} playerId
   * @returns {Set<number>}
   */
  getBorderTiles(playerId) {
    return this.borderTiles.get(playerId) || GameStateManager.EMPTY_SET;
  }

  /**
   * Collect the set of owner IDs (other players, or 0 for unclaimed land)
   * whose conquerable territory currently touches this player's border.
   * @param {number} playerId
   * @returns {Set<number>}
   */
  getAdjacentOwners(playerId) {
    const owners = new Set();
    if (!this.tileMap) return owners;
    this.getBorderTiles(playerId).forEach((tileIndex) => {
      this.tileMap.onNeighbors(tileIndex, (nIndex) => {
        const owner = this.tileOwners[nIndex];
        if (owner === playerId) return;
        const tileType = this.tileMap.getTileType(nIndex);
        if (tileType && tileType.conquerable) owners.add(owner);
      });
    });
    return owners;
  }

  /**
   * Drain and return the set of tile indices whose owner changed since the
   * last call. Intended for renderers to redraw only what actually moved.
   * @returns {Set<number>}
   */
  consumeDirtyTiles() {
    const dirty = this.dirtyTiles;
    this.dirtyTiles = new Set();
    return dirty;
  }

  /**
   * Advance game tick (income, bot updates, game time).
   */
  tick() {
    if (!this.isRunning) return;
    this.ticks++;

    // Income tick every 10 ticks (approx 1 second)
    if (this.ticks % 10 === 0) {
      this.elapsedSeconds++;
      this.players.forEach((player) => player.processIncome());
    }
  }

  /**
   * Get formatted game clock string (HH:MM:SS)
   * @returns {string}
   */
  getFormattedClock() {
    const hrs = Math.floor(this.elapsedSeconds / 3600);
    const mins = Math.floor((this.elapsedSeconds % 3600) / 60);
    const secs = this.elapsedSeconds % 60;
    return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
  }

  /**
   * Check for winner (Player holding > 90% of total land territory).
   * @returns {Player|null}
   */
  checkWinner() {
    const activePlayers = this.getPlayers().filter((p) => p.isAlive());
    if (activePlayers.length === 1) {
      return activePlayers[0];
    }
    const totalLand = this.getPlayers().reduce((acc, p) => acc + p.getTerritorySize(), 0);
    if (totalLand === 0) return null;

    for (const player of activePlayers) {
      if (player.getTerritorySize() / totalLand > 0.9) {
        return player;
      }
    }
    return null;
  }
}