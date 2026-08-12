/**
 * @file InputManager.js
 * @description Pointer, Touch Drag/Pan, Mouse Wheel Zoom, & Keyboard Input Handler.
 * @module ui/InputManager
 */

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

    this.onSelectTileCallback = null;
    this.onAttackDragCallback = null;
  }

  /**
   * Attach mouse and touch event listeners to the canvas/window.
   */
  init() {
    window.addEventListener("mousedown", (e) => this.handlePointerDown(e));
    window.addEventListener("mousemove", (e) => this.handlePointerMove(e));
    window.addEventListener("mouseup", (e) => this.handlePointerUp(e));
    window.addEventListener("wheel", (e) => this.handleWheel(e), { passive: false });

    // Touch events for mobile support
    window.addEventListener("touchstart", (e) => this.handleTouchStart(e), { passive: true });
    window.addEventListener("touchmove", (e) => this.handleTouchMove(e), { passive: true });
    window.addEventListener("touchend", () => this.handlePointerUp());
  }

  handlePointerDown(e) {
    if (e.target.closest("#MainMenu") || e.target.closest("#openSettings")) return;
    this.isDragging = true;
    this.dragStartX = e.clientX - this.cameraX;
    this.dragStartY = e.clientY - this.cameraY;
  }

  handlePointerMove(e) {
    if (!this.isDragging) return;
    this.cameraX = e.clientX - this.dragStartX;
    this.cameraY = e.clientY - this.dragStartY;
    this.updateCamera();
  }

  handlePointerUp() {
    this.isDragging = false;
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.2, Math.min(5.0, this.zoom * zoomFactor));

    // Adjust camera to zoom towards mouse position
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

  updateCamera() {
    if (this.gameRenderer) {
      this.gameRenderer.setViewport(this.cameraX, this.cameraY, this.zoom);
    }
  }
}