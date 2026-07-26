/**
 * Base Game Engine Adapter
 * Unified interface for integrating multiple game engines (Phaser 2D, Babylon 3D, Vanilla Canvas)
 */
export class BaseEngineAdapter {
    constructor(engineName) {
        this.engineName = engineName;
        this.container = null;
        this.activeGame = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Engine Container
     * @param {HTMLElement|string} containerElement 
     * @param {Object} config 
     */
    async init(containerElement, config = {}) {
        this.container = typeof containerElement === 'string' 
            ? document.getElementById(containerElement) 
            : containerElement;
        
        if (!this.container) {
            throw new Error(`[${this.engineName}Adapter] Container element not found.`);
        }
        
        this.isInitialized = true;
        console.log(`[${this.engineName}Adapter] Initialized successfully.`);
    }

    /**
     * Load a specific game module
     * @param {Object} gameConfig 
     */
    async loadGame(gameConfig) {
        throw new Error(`[${this.engineName}Adapter] loadGame method must be implemented by subclass.`);
    }

    /**
     * Pause game execution
     */
    pause() {
        console.log(`[${this.engineName}Adapter] Game paused.`);
    }

    /**
     * Resume game execution
     */
    resume() {
        console.log(`[${this.engineName}Adapter] Game resumed.`);
    }

    /**
     * Destroy game instance and release WebGL/Canvas memory
     */
    destroy() {
        if (this.activeGame) {
            this.activeGame = null;
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
        console.log(`[${this.engineName}Adapter] Game instance destroyed.`);
    }

    /**
     * Handle viewport resize
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        console.log(`[${this.engineName}Adapter] Resized to ${width}x${height}`);
    }
}
