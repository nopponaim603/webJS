/**
 * @file game.js
 * @description WarFront.io Main Modular Engine Entry Point.
 * @module game
 */

import { TileMap, DEFAULT_TILE_TYPES } from "./core/TileMap.js";
import { ZoneBuilder } from "./core/ZoneBuilder.js";
import { GameStateManager, Player } from "./engine/GameState.js";
import { BotAI } from "./engine/BotAI.js";
import { GameRenderer } from "./renderers/GameRenderer.js";
import { InputManager } from "./ui/InputManager.js";
import { MainMenu } from "./ui/MainMenu.js";
import { UIManager } from "./ui/UIManager.js";

/**
 * Main WarFront Game Application Orchestrator
 */
class WarFrontApp {
  constructor() {
    this.width = 64;
    this.height = 64;
    this.tileMap = null;
    this.gameState = null;
    this.botAI = null;
    this.gameRenderer = null;
    this.inputManager = null;
    this.mainMenu = null;
    this.uiManager = null;

    this.gameLoopInterval = null;
  }

  /**
   * Initialize map generator, render engine, UI components, and menus.
   */
  init() {
    console.log("[WarFront.io] Initializing clean modular game engine...");

    // 1. Generate Procedural Map Grid (64x64)
    const totalTiles = this.width * this.height;
    const tilesData = new Uint8Array(totalTiles);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        // Border coast water
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          tilesData[index] = 0; // Deep Water
        } else if (x === 1 || x === this.width - 2 || y === 1 || y === this.height - 2) {
          tilesData[index] = 1; // Coastal Water
        } else {
          tilesData[index] = 2; // Plains / Land
        }
      }
    }

    this.tileMap = new TileMap(this.width, this.height, tilesData, DEFAULT_TILE_TYPES);

    // 2. Initialize Game State Manager
    this.gameState = new GameStateManager();

    // 3. Initialize Master Canvas Renderer
    this.gameRenderer = new GameRenderer(this.tileMap, this.gameState);
    this.gameRenderer.attachToDOM(document.body);

    // 4. Initialize Input Manager
    this.inputManager = new InputManager(this.gameRenderer.canvas, this.gameRenderer);
    this.inputManager.init();

    // 5. Initialize UI HUD & Main Menu
    this.uiManager = new UIManager(this.gameState, () => this.stopMatch());
    this.uiManager.init();

    this.mainMenu = new MainMenu((playerName) => this.startSingleplayerMatch(playerName));
    this.mainMenu.init();

    console.log("[WarFront.io] Engine initialization complete.");
  }

  /**
   * Start singleplayer match with user & AI bots.
   * @param {string} playerName
   */
  startSingleplayerMatch(playerName) {
    console.log(`[WarFront.io] Starting match for: ${playerName}`);

    // Create Players
    const humanPlayer = new Player(1, playerName, "#3b82f6"); // Blue
    const bot1 = new Player(2, "Vanguard Bot", "#ef4444");     // Red
    bot1.isBot = true;
    const bot2 = new Player(3, "Ironclad Bot", "#10b981");     // Green
    bot2.isBot = true;
    const bot3 = new Player(4, "Shadow Bot", "#f59e0b");       // Yellow
    bot3.isBot = true;

    const players = [humanPlayer, bot1, bot2, bot3];

    this.gameState.init(this.tileMap.totalTiles, players);

    // Assign initial spawn capital territories
    this.assignSpawnTerritory(humanPlayer, 10, 10);
    this.assignSpawnTerritory(bot1, 50, 10);
    this.assignSpawnTerritory(bot2, 10, 50);
    this.assignSpawnTerritory(bot3, 50, 50);

    // Bind tile click callback for human player expansion
    this.inputManager.onTileClickCallback = (tileX, tileY) => {
      this.handleTileClick(tileX, tileY, humanPlayer);
    };

    // Initialize Bot AI
    this.botAI = new BotAI(this.gameState);

    // UI & Renderer Start
    this.uiManager.showHUD();
    this.gameRenderer.start();

    // Start 100ms Game Loop (10 ticks per second)
    if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
    this.gameLoopInterval = setInterval(() => this.updateGameLoop(humanPlayer), 100);
  }

  /**
   * Handle tile click to conquer/expand territory into adjacent tiles.
   */
  handleTileClick(tileX, tileY, humanPlayer) {
    if (!this.tileMap || !this.gameState || !humanPlayer || !humanPlayer.isAlive()) return;
    if (!this.tileMap.inBounds(tileX, tileY)) return;

    const targetIndex = this.tileMap.xyToIndex(tileX, tileY);
    const tileType = this.tileMap.getTileType(targetIndex);

    // Cannot conquer non-conquerable terrain (deep water/mountains)
    if (!tileType || !tileType.conquerable) return;

    const currentOwner = this.gameState.getOwner(targetIndex);
    if (currentOwner === humanPlayer.id) return; // Already owned

    // Check if target tile is adjacent to human territory
    let isAdjacent = false;
    this.tileMap.onNeighbors(targetIndex, (nIndex) => {
      if (this.gameState.getOwner(nIndex) === humanPlayer.id) {
        isAdjacent = true;
      }
    });

    if (isAdjacent) {
      const availableTroops = humanPlayer.getTroops();
      if (availableTroops <= 5) return;

      const pct = (this.uiManager ? this.uiManager.attackPercentage : 50) / 100.0;
      const troopCost = Math.max(5, Math.floor(availableTroops * pct * 0.1));

      humanPlayer.removeTroops(troopCost);
      this.gameState.conquerTile(targetIndex, humanPlayer.id);

      // Auto-expand into adjacent neutral land tiles for smooth RTS expansion feedback
      this.tileMap.onNeighbors(targetIndex, (nIndex) => {
        if (
          this.gameState.getOwner(nIndex) === 0 &&
          this.tileMap.getTileType(nIndex)?.conquerable &&
          humanPlayer.getTroops() > 5
        ) {
          humanPlayer.removeTroops(2);
          this.gameState.conquerTile(nIndex, humanPlayer.id);
        }
      });
    }
  }

  /**
   * Assign starting land square around spawn point.
   */
  assignSpawnTerritory(player, centerX, centerY) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (this.tileMap.inBounds(x, y)) {
          const index = this.tileMap.xyToIndex(x, y);
          if (this.tileMap.getTileId(index) === 2) { // Land tile
            this.gameState.conquerTile(index, player.id);
          }
        }
      }
    }
  }

  /**
   * Main Game Loop Update.
   */
  updateGameLoop(humanPlayer) {
    this.gameState.tick();

    // Bot AI update loop
    if (this.botAI) {
      this.botAI.update((fromBotId) => {
        const botPlayer = this.gameState.getPlayer(fromBotId);
        if (botPlayer && botPlayer.getTroops() > 20) {
          // Find an unowned or enemy tile adjacent to bot territory
          for (let index = 0; index < this.tileMap.totalTiles; index++) {
            if (this.gameState.getOwner(index) === fromBotId) {
              const neighbors = this.tileMap.getNeighbors(index);
              for (const nIndex of neighbors) {
                const owner = this.gameState.getOwner(nIndex);
                if (owner !== fromBotId && this.tileMap.getTileType(nIndex)?.conquerable) {
                  botPlayer.removeTroops(5);
                  this.gameState.conquerTile(nIndex, fromBotId);
                  return;
                }
              }
            }
          }
        }
      });
    }

    this.uiManager.update(humanPlayer);

    const winner = this.gameState.checkWinner();
    if (winner) {
      alert(`Victory! ${winner.name} won the match!`);
      this.stopMatch();
    }
  }

  /**
   * Stop current match and return to Main Menu.
   */
  stopMatch() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    this.gameRenderer.stop();
    this.uiManager.hideHUD();
    this.mainMenu.show();
  }
}

// Bootstrap application on window load
window.addEventListener("DOMContentLoaded", () => {
  const app = new WarFrontApp();
  app.init();
});