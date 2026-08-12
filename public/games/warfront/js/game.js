/**
 * @file game.js
 * @description WarFront.io Main Modular Engine Entry Point.
 * @module game
 */

import { TileMap, DEFAULT_TILE_TYPES } from "./core/TileMap.js";
import { MapGenerator } from "./core/MapGenerator.js";
import { GameStateManager, Player } from "./engine/GameState.js";
import { AttackExecutionManager } from "./engine/AttackExecution.js";
import { BotAI } from "./engine/BotAI.js";
import { GameRenderer } from "./renderers/GameRenderer.js";
import { InputManager } from "./ui/InputManager.js";
import { MainMenu } from "./ui/MainMenu.js";
import { UIManager } from "./ui/UIManager.js";

/** Minimum troops a player must hold before an attack can be launched. */
const MIN_TROOPS_TO_ATTACK = 10;
/** Fraction of troops a bot commits per attack order. */
const BOT_ATTACK_COMMIT_RATIO = 0.35;

/**
 * Main WarFront Game Application Orchestrator
 */
class WarFrontApp {
  constructor() {
    this.width = 64;
    this.height = 64;
    this.tileMap = null;
    this.spawnPoints = [];
    this.gameState = null;
    this.attackManager = null;
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

    // 1. Generate a procedural island map with 4 symmetric spawn points.
    const generated = MapGenerator.generate(this.width, this.height);
    this.spawnPoints = generated.spawnPoints;
    this.tileMap = new TileMap(this.width, this.height, generated.tiles, DEFAULT_TILE_TYPES);
    console.log(`[WarFront.io] Map generated (seed=${generated.seed}).`);

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

    this.gameState.init(this.tileMap, players);
    this.attackManager = new AttackExecutionManager(this.gameState, this.tileMap);
    this.gameRenderer.setAttackManager(this.attackManager);

    // Assign starting territory at each generated spawn point.
    const [spawn0, spawn1, spawn2, spawn3] = this.spawnPoints;
    this.assignSpawnTerritory(humanPlayer, spawn0.x, spawn0.y);
    this.assignSpawnTerritory(bot1, spawn1.x, spawn1.y);
    this.assignSpawnTerritory(bot2, spawn2.x, spawn2.y);
    this.assignSpawnTerritory(bot3, spawn3.x, spawn3.y);

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
   * Handle a tile click by launching (or reinforcing) a gradual attack against
   * whichever owner currently holds that tile, provided the human player's
   * territory actually borders them. Capture plays out over several ticks
   * instead of instantly flipping tiles.
   */
  handleTileClick(tileX, tileY, humanPlayer) {
    if (!this.tileMap || !this.gameState || !this.attackManager || !humanPlayer || !humanPlayer.isAlive()) return;
    if (!this.tileMap.inBounds(tileX, tileY)) return;

    const targetIndex = this.tileMap.xyToIndex(tileX, tileY);
    const tileType = this.tileMap.getTileType(targetIndex);
    if (!tileType || !tileType.conquerable) return;

    const targetOwnerId = this.gameState.getOwner(targetIndex);
    if (targetOwnerId === humanPlayer.id) return; // already ours

    // Require actual territorial contact with the clicked tile's owner.
    const adjacentOwners = this.gameState.getAdjacentOwners(humanPlayer.id);
    if (!adjacentOwners.has(targetOwnerId)) return;

    const availableTroops = humanPlayer.getTroops();
    if (availableTroops <= MIN_TROOPS_TO_ATTACK) return;

    const pct = (this.uiManager ? this.uiManager.attackPercentage : 50) / 100.0;
    const troopsToCommit = Math.max(5, Math.floor(availableTroops * pct));

    humanPlayer.removeTroops(troopsToCommit);
    this.attackManager.launchAttack(humanPlayer.id, targetOwnerId, troopsToCommit);
  }

  /**
   * Assign starting land tiles around a spawn point and mark it as the player's capital.
   */
  assignSpawnTerritory(player, centerX, centerY) {
    player.capitalIndex = this.tileMap.xyToIndex(centerX, centerY);

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (this.tileMap.inBounds(x, y)) {
          const index = this.tileMap.xyToIndex(x, y);
          const tileType = this.tileMap.getTileType(index);
          if (tileType && tileType.conquerable) {
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

    // Bot AI decisions: launch gradual attacks against real adjacent targets.
    if (this.botAI) {
      this.botAI.update((fromBotId, toOwnerId) => {
        const botPlayer = this.gameState.getPlayer(fromBotId);
        if (!botPlayer || !botPlayer.isAlive()) return;

        const availableTroops = botPlayer.getTroops();
        if (availableTroops <= MIN_TROOPS_TO_ATTACK) return;

        const troopsToCommit = Math.max(10, Math.floor(availableTroops * BOT_ATTACK_COMMIT_RATIO));
        botPlayer.removeTroops(troopsToCommit);
        this.attackManager.launchAttack(fromBotId, toOwnerId, troopsToCommit);
      });
    }

    // Advance all in-flight attacks (human + bots) by one tick.
    if (this.attackManager) {
      this.attackManager.tick();
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
