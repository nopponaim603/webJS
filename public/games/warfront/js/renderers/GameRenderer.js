/**
 * @file GameRenderer.js
 * @description Master Rendering Orchestration Pipeline & Canvas Animation Loop.
 * @module renderers/GameRenderer
 */

import { MapRenderer } from "./MapRenderer.js";
import { UnitRenderer } from "./UnitRenderer.js";

/**
 * Master Game Renderer class managing canvas creation, layer composition, and animation loop.
 */
export class GameRenderer {
  /**
   * @param {import('../core/TileMap.js').TileMap} tileMap
   * @param {import('../engine/GameState.js').GameStateManager} gameState
   */
  constructor(tileMap, gameState) {
    /** @type {HTMLCanvasElement} */
    this.canvas = document.createElement("canvas");
    this.canvas.id = "gameCanvas";
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "0";
    this.canvas.style.top = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.zIndex = "0";
    this.canvas.style.pointerEvents = "auto";

    this.tileMap = tileMap;
    this.gameState = gameState;

    this.mapRenderer = new MapRenderer(this.canvas, tileMap, gameState);
    this.unitRenderer = new UnitRenderer(this.canvas, gameState);

    this.isRendering = false;
    this.animationFrameId = null;

    this.setupResizeListener();
  }

  /**
   * Attach master canvas element to DOM.
   * @param {HTMLElement} containerElement
   */
  attachToDOM(containerElement = document.body) {
    if (!document.getElementById("gameCanvas")) {
      containerElement.appendChild(this.canvas);
    }
    this.resize();
  }

  /**
   * Update viewport pan offsets and zoom level across all render layers.
   * @param {number} x
   * @param {number} y
   * @param {number} zoom
   */
  setViewport(x, y, zoom) {
    this.mapRenderer.setViewport(x, y, zoom);
    this.unitRenderer.setViewport(x, y, zoom);
  }

  /**
   * Handle window resize event.
   */
  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = width;
    this.canvas.height = height;
    this.mapRenderer.setSize(width, height);
  }

  setupResizeListener() {
    window.addEventListener("resize", () => this.resize());
  }

  /**
   * Start rendering animation loop.
   */
  start() {
    if (this.isRendering) return;
    this.isRendering = true;

    const renderLoop = () => {
      if (!this.isRendering) return;
      this.renderFrame();
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  /**
   * Stop rendering loop.
   */
  stop() {
    this.isRendering = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Render single animation frame.
   */
  renderFrame() {
    this.mapRenderer.render();
    this.unitRenderer.render();
  }
}