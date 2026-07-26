import { BaseEngineAdapter } from './base-adapter.js';

/**
 * Phaser 3 Engine Adapter (2D)
 * Manages loading Phaser CDN dynamic script, config setup, and Canvas scaling
 */
export class PhaserEngineAdapter extends BaseEngineAdapter {
    constructor() {
        super('Phaser3');
        this.phaserScriptUrl = 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js';
        this.isScriptLoaded = false;
    }

    /**
     * Load Phaser 3 SDK from CDN dynamically if not present
     */
    async loadSDK() {
        if (window.Phaser) {
            this.isScriptLoaded = true;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.phaserScriptUrl;
            script.onload = () => {
                this.isScriptLoaded = true;
                console.log('[PhaserAdapter] Phaser 3 SDK loaded successfully.');
                resolve();
            };
            script.onerror = () => reject(new Error('[PhaserAdapter] Failed to load Phaser 3 SDK script.'));
            document.head.appendChild(script);
        });
    }

    /**
     * Load and start a Phaser 3 Game
     * @param {Object} gameConfig Standard Phaser Config or Scenes
     */
    async loadGame(gameConfig) {
        await this.loadSDK();

        this.destroy(); // Clean previous instance

        const defaultConfig = {
            type: window.Phaser.AUTO,
            parent: this.container,
            width: gameConfig.width || 800,
            height: gameConfig.height || 600,
            scale: {
                mode: window.Phaser.Scale.FIT,
                autoCenter: window.Phaser.Scale.CENTER_BOTH
            },
            physics: gameConfig.physics || {
                default: 'arcade',
                arcade: { gravity: { y: 300 }, debug: false }
            },
            scene: gameConfig.scene || []
        };

        this.activeGame = new window.Phaser.Game(defaultConfig);
        return this.activeGame;
    }

    pause() {
        if (this.activeGame && this.activeGame.scene) {
            this.activeGame.scene.scenes.forEach(scene => scene.scene.pause());
            console.log('[PhaserAdapter] Paused all scenes.');
        }
    }

    resume() {
        if (this.activeGame && this.activeGame.scene) {
            this.activeGame.scene.scenes.forEach(scene => scene.scene.resume());
            console.log('[PhaserAdapter] Resumed all scenes.');
        }
    }

    destroy() {
        if (this.activeGame) {
            this.activeGame.destroy(true);
            this.activeGame = null;
        }
        super.destroy();
    }
}
