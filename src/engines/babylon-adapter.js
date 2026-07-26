import { BaseEngineAdapter } from './base-adapter.js';

/**
 * Babylon.js Engine Adapter (3D)
 * Manages loading Babylon.js CDN script, Engine rendering loop, WebGL Canvas setup, and Pointer Lock
 */
export class BabylonEngineAdapter extends BaseEngineAdapter {
    constructor() {
        super('BabylonJS');
        this.babylonScriptUrl = 'https://cdn.babylonjs.com/babylon.js';
        this.loadersScriptUrl = 'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js';
        this.isScriptLoaded = false;
        this.engine = null;
        this.scene = null;
        this.canvas = null;
    }

    /**
     * Load Babylon.js SDK dynamically from CDN if not present
     */
    async loadSDK() {
        if (window.BABYLON) {
            this.isScriptLoaded = true;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.babylonScriptUrl;
            script.onload = () => {
                // Load loaders script for glTF / OBJ support
                const loaderScript = document.createElement('script');
                loaderScript.src = this.loadersScriptUrl;
                loaderScript.onload = () => {
                    this.isScriptLoaded = true;
                    console.log('[BabylonAdapter] Babylon.js & Loaders SDK loaded.');
                    resolve();
                };
                loaderScript.onerror = () => resolve(); // Resolve anyway if loader fails
                document.head.appendChild(loaderScript);
            };
            script.onerror = () => reject(new Error('[BabylonAdapter] Failed to load Babylon.js SDK.'));
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize Babylon.js WebGL Engine and Canvas
     * @param {Object} gameConfig Object containing custom scene creation callback `createScene(engine, canvas)`
     */
    async loadGame(gameConfig) {
        await this.loadSDK();

        this.destroy(); // Clean up existing engine & scene

        // Create canvas inside container if not present
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'babylon-render-canvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.touchAction = 'none';
        this.container.appendChild(this.canvas);

        // Initialize Engine
        this.engine = new window.BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });

        // Call game scene setup function or build default scene
        if (typeof gameConfig.createScene === 'function') {
            this.scene = await gameConfig.createScene(this.engine, this.canvas);
        } else {
            this.scene = this.createDefaultScene();
        }

        // Run render loop
        this.engine.runRenderLoop(() => {
            if (this.scene && this.scene.activeCamera) {
                this.scene.render();
            }
        });

        // Window resize handler
        this.resizeHandler = () => {
            if (this.engine) {
                this.engine.resize();
            }
        };
        window.addEventListener('resize', this.resizeHandler);

        this.activeGame = { engine: this.engine, scene: this.scene };
        return this.activeGame;
    }

    /**
     * Create a fallback demo 3D scene (Spinning Metallic Cube & Light)
     */
    createDefaultScene() {
        const scene = new window.BABYLON.Scene(this.engine);
        scene.clearColor = new window.BABYLON.Color4(0.06, 0.09, 0.16, 1);

        // Camera
        const camera = new window.BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2.5, 5, window.BABYLON.Vector3.Zero(), scene);
        camera.attachControl(this.canvas, true);

        // Hemispheric Light
        const light = new window.BABYLON.HemisphericLight("light1", new window.BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        // Point Light
        const pointLight = new window.BABYLON.PointLight("pointLight", new window.BABYLON.Vector3(2, 3, -2), scene);
        pointLight.diffuse = new window.BABYLON.Color3(0, 0.95, 1);

        // 3D Box Mesh
        const box = window.BABYLON.MeshBuilder.CreateBox("box", { size: 1.5 }, scene);
        
        // PBR Material
        const mat = new window.BABYLON.StandardMaterial("boxMat", scene);
        mat.diffuseColor = new window.BABYLON.Color3(0, 0.8, 1);
        mat.specularColor = new window.BABYLON.Color3(1, 1, 1);
        box.material = mat;

        // Animation
        scene.onBeforeRenderObservable.add(() => {
            box.rotation.y += 0.01;
            box.rotation.x += 0.005;
        });

        return scene;
    }

    pause() {
        if (this.engine) {
            this.engine.stopRenderLoop();
            console.log('[BabylonAdapter] Render loop stopped.');
        }
    }

    resume() {
        if (this.engine && this.scene) {
            this.engine.runRenderLoop(() => {
                this.scene.render();
            });
            console.log('[BabylonAdapter] Render loop resumed.');
        }
    }

    destroy() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }
        if (this.engine) {
            this.engine.dispose();
            this.engine = null;
        }
        super.destroy();
    }
}
