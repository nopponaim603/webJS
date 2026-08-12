/**
 * @file InputManager.js
 * @description Pointer, Touch Drag/Pan, Mouse Wheel Zoom, & Tile Click Input Handler.
 * @module ui/InputManager
 */

import { TILE_SIZE } from "../renderers/MapRenderer.js";

/**
 * Camera Viewport & Mouse Pointer Input Manager
 */
export class InputManager {
  /**
   * @param {HTMLCanvasElement} canvas - Target interaction canvas
   * @param {import('../renderers/GameRenderer.js').GameRenderer} gameRenderer
   */
  constructor(canvas, gameRenderer) {
    this.canvas = canvas;
    this.gameRenderer = gameRenderer;

    // Viewport transform state
    this.cameraX = 0;
    this.cameraY = 0;
    this.zoom = 1;

    // Drag tracking state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.pointerDownX = 0;
    this.pointerDownY = 0;

    /** @type {function(number, number): void | null} Tile click listener */
    this.onTileClickCallback = null;
  }

  /**
   * Attach mouse and touch event listeners to the canvas/window.
   */
  init() {
    if (this.canvas) {
      this.canvas.style.pointerEvents = "auto";
    }

    window.addEventListener("mousedown", (e) => this.handlePointerDown(e));
    window.addEventListener("mousemove", (e) => this.handlePointerMove(e));
    window.addEventListener("mouseup", (e) => this.handlePointerUp(e));
    window.addEventListener("wheel", (e) => this.handleWheel(e), { passive: false });

    // Touch events for mobile support
    window.addEventListener("touchstart", (e) => this.handleTouchStart(e), { passive: true });
    window.addEventListener("touchmove", (e) => this.handleTouchMove(e), { passive: true });
    window.addEventListener("touchend", (e) => this.handleTouchEnd(e));
  }

  handlePointerDown(e) {
    if (
      e.target.closest("#MainMenu") ||
      e.target.closest("#openSettings") ||
      e.target.closest("#selectorContainer") ||
      e.target.closest("#GameHud") && !e.target.classList.contains("background-vignette")
    ) {
      return;
    }
    this.isDragging = true;
    this.pointerDownX = e.clientX;
    this.pointerDownY = e.clientY;
    this.dragStartX = e.clientX - this.cameraX;
    this.dragStartY = e.clientY - this.cameraY;
  }

  handlePointerMove(e) {
    if (!this.isDragging) return;
    this.cameraX = e.clientX - this.dragStartX;
    this.cameraY = e.clientY - this.dragStartY;
    this.updateCamera();
  }

  handlePointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (!e) return;
    const moveDist = Math.hypot(e.clientX - this.pointerDownX, e.clientY - this.pointerDownY);

    // If mouse moved less than 8 pixels, treat action as a Tile Click!
    if (moveDist < 8 && this.onTileClickCallback) {
      const worldX = (e.clientX - this.cameraX) / this.zoom;
      const worldY = (e.clientY - this.cameraY) / this.zoom;
      const tileSize = TILE_SIZE;
      const tileX = Math.floor(worldX / tileSize);
      const tileY = Math.floor(worldY / tileSize);
      this.onTileClickCallback(tileX, tileY);
    }
  }

  handleWheel(e) {
    if (e.target.closest("#MainMenu")) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.2, Math.min(5.0, this.zoom * zoomFactor));

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    this.cameraX = mouseX - (mouseX - this.cameraX) * (newZoom / this.zoom);
    this.cameraY = mouseY - (mouseY - this.cameraY) * (newZoom / this.zoom);
    this.zoom = newZoom;

    this.updateCamera();
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.isDragging = true;
      this.pointerDownX = touch.clientX;
      this.pointerDownY = touch.clientY;
      this.dragStartX = touch.clientX - this.cameraX;
      this.dragStartY = touch.clientY - this.cameraY;
    }
  }

  handleTouchMove(e) {
    if (!this.isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    this.cameraX = touch.clientX - this.dragStartX;
    this.cameraY = touch.clientY - this.dragStartY;
    this.updateCamera();
  }

  handleTouchEnd(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (e && e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const moveDist = Math.hypot(touch.clientX - this.pointerDownX, touch.clientY - this.pointerDownY);
      if (moveDist < 10 && this.onTileClickCallback) {
        const worldX = (touch.clientX - this.cameraX) / this.zoom;
        const worldY = (touch.clientY - this.cameraY) / this.zoom;
        const tileSize = TILE_SIZE;
        const tileX = Math.floor(worldX / tileSize);
        const tileY = Math.floor(worldY / tileSize);
        this.onTileClickCallback(tileX, tileY);
      }
    }
  }

  updateCamera() {
    if (this.gameRenderer) {
      this.gameRenderer.setViewport(this.cameraX, this.cameraY, this.zoom);
    }
  }
}