/**
 * BOBA PEARL DROP: 100% SUGAR
 * BabylonJS 3D Super Monkey Ball Style Boba Marble Runner
 */

// --- Global Game State & Configurations ---
const LEVEL_CONFIGS = [
    {
        id: 0,
        name: "🥛 Level 1: Milk Tea Meadow",
        theme: "milktea",
        skyColor: new BABYLON.Color3(0.97, 0.92, 0.87),
        trackColor: new BABYLON.Color3(0.78, 0.55, 0.35),
        accentColor: new BABYLON.Color3(0.96, 0.75, 0.15),
        totalSugarCubes: 10,
        targetTime: 45
    },
    {
        id: 1,
        name: "🍠 Level 2: Taro Heights",
        theme: "taro",
        skyColor: new BABYLON.Color3(0.91, 0.86, 0.98),
        trackColor: new BABYLON.Color3(0.66, 0.33, 0.97),
        accentColor: new BABYLON.Color3(0.91, 0.63, 0.75),
        totalSugarCubes: 10,
        targetTime: 50
    },
    {
        id: 2,
        name: "🍵 Level 3: Matcha Gardens",
        theme: "matcha",
        skyColor: new BABYLON.Color3(0.85, 0.95, 0.88),
        trackColor: new BABYLON.Color3(0.1, 0.6, 0.4),
        accentColor: new BABYLON.Color3(0.76, 0.93, 0.75),
        totalSugarCubes: 10,
        targetTime: 55
    }
];

class AudioSynthesizer {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.init();
    }

    init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playCollectSound() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        
        // High crystal chime arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.05);
            gain.gain.setValueAtTime(0.2, now + index * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + index * 0.05);
            osc.stop(now + index * 0.05 + 0.25);
        });
    }

    playJumpSound() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.18); // D5 pitch sweep boing
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playDashSound() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(3, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        whiteNoise.start(now);
    }

    playVictorySound() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.25, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.6);
        });
    }

    playSplashSound() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// --- Main Boba Pearl Game Engine Class ---
class BobaDropGame {
    constructor() {
        this.canvas = document.getElementById("renderCanvas");
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.scene = null;
        this.camera = null;
        this.shadowGenerator = null;
        this.glowLayer = null;

        // Audio System
        this.audio = new AudioSynthesizer();

        // State variables
        this.currentLevelIndex = 0;
        this.isGameRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.sugarCount = 0;
        this.timer = 0;
        this.timerInterval = null;

        // Player Data
        this.bobaPearl = null;
        this.bobaMaterial = null;
        this.playerVelocity = new BABYLON.Vector3(0, 0, 0);
        this.checkpointPosition = new BABYLON.Vector3(0, 2, 0);
        this.isGrounded = false;
        this.jumpCooldown = 0;
        this.isDashing = false;
        this.dashTimer = 0;

        // Particle System
        this.dashTrailParticles = null;
        this.splashParticles = null;

        // Interactive Objects array
        this.collectibles = [];
        this.movingPlatforms = [];
        this.spinners = [];
        this.finishCupMesh = null;

        // Controls state
        this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
        this.joystickVector = { x: 0, y: 0 };

        this.initDOMListeners();
        this.initInputListeners();
        this.initTouchJoystick();
    }

    initDOMListeners() {
        window.addEventListener("resize", () => this.engine.resize());
        
        document.getElementById("btnSound").addEventListener("click", () => {
            this.audio.isMuted = !this.audio.isMuted;
            document.getElementById("btnSound").innerText = this.audio.isMuted ? "🔇" : "🔊";
        });

        document.getElementById("btnPause").addEventListener("click", () => {
            if (this.isGameRunning) this.pauseGame();
        });
    }

    initInputListeners() {
        window.addEventListener("keydown", (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w' || k === 'arrowup') this.keys.w = true;
            if (k === 'a' || k === 'arrowleft') this.keys.a = true;
            if (k === 's' || k === 'arrowdown') this.keys.s = true;
            if (k === 'd' || k === 'arrowright') this.keys.d = true;
            if (e.code === 'Space') {
                this.keys.space = true;
                this.triggerJump();
            }
            if (e.key === 'Shift') {
                this.keys.shift = true;
            }
        });

        window.addEventListener("keyup", (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w' || k === 'arrowup') this.keys.w = false;
            if (k === 'a' || k === 'arrowleft') this.keys.a = false;
            if (k === 's' || k === 'arrowdown') this.keys.s = false;
            if (k === 'd' || k === 'arrowright') this.keys.d = false;
            if (e.code === 'Space') this.keys.space = false;
            if (e.key === 'Shift') this.keys.shift = false;
        });

        // Mobile Buttons
        const jumpBtn = document.getElementById("btnTouchJump");
        if (jumpBtn) {
            jumpBtn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                this.triggerJump();
            });
            jumpBtn.addEventListener("mousedown", () => this.triggerJump());
        }

        const dashBtn = document.getElementById("btnTouchDash");
        if (dashBtn) {
            dashBtn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                this.keys.shift = true;
            });
            dashBtn.addEventListener("touchend", (e) => {
                e.preventDefault();
                this.keys.shift = false;
            });
            dashBtn.addEventListener("mousedown", () => this.keys.shift = true);
            dashBtn.addEventListener("mouseup", () => this.keys.shift = false);
        }
    }

    initTouchJoystick() {
        const zone = document.getElementById("joystickZone");
        const knob = document.getElementById("joystickKnob");
        if (!zone || !knob) return;

        let active = false;
        let startX = 0, startY = 0;
        const maxRadius = 40;

        const handleStart = (clientX, clientY) => {
            active = true;
            const rect = zone.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        };

        const handleMove = (clientX, clientY) => {
            if (!active) return;
            let dx = clientX - startX;
            let dy = clientY - startY;
            let dist = Math.hypot(dx, dy);

            if (dist > maxRadius) {
                dx = (dx / dist) * maxRadius;
                dy = (dy / dist) * maxRadius;
            }

            knob.style.transform = `translate(${dx}px, ${dy}px)`;
            this.joystickVector.x = dx / maxRadius;
            this.joystickVector.y = -dy / maxRadius; // invert Y for screen coords
        };

        const handleEnd = () => {
            active = false;
            knob.style.transform = `translate(0px, 0px)`;
            this.joystickVector.x = 0;
            this.joystickVector.y = 0;
        };

        zone.addEventListener("touchstart", (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY);
        });

        window.addEventListener("touchmove", (e) => {
            if (!active) return;
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        });

        window.addEventListener("touchend", handleEnd);

        zone.addEventListener("mousedown", (e) => handleStart(e.clientX, e.clientY));
        window.addEventListener("mousemove", (e) => handleMove(e.clientX, e.clientY));
        window.addEventListener("mouseup", handleEnd);
    }

    // --- Scene Setup ---
    createScene(levelIndex) {
        if (this.scene) this.scene.dispose();

        const config = LEVEL_CONFIGS[levelIndex];
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(config.skyColor.r, config.skyColor.g, config.skyColor.b, 1.0);
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogColor = config.skyColor;
        this.scene.fogDensity = 0.008;

        // Camera Setup
        this.camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 10, BABYLON.Vector3.Zero(), this.scene);
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 18;
        this.camera.lowerBetaLimit = 0.2;
        this.camera.upperBetaLimit = Math.PI / 2 - 0.05;
        this.camera.attachControl(this.canvas, true);

        // Lights & Soft Shadows
        const light = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -3, -2), this.scene);
        light.position = new BABYLON.Vector3(20, 40, 20);
        light.intensity = 1.6;

        const ambientLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.7;
        ambientLight.groundColor = new BABYLON.Color3(0.2, 0.15, 0.1);

        this.shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.blurKernel = 16;

        // Glow Layer for vibrant aesthetics
        this.glowLayer = new BABYLON.GlowLayer("glow", this.scene);
        this.glowLayer.intensity = 0.6;

        // Player Boba Pearl Setup
        this.setupBobaPearl();

        // Level Environment Construction
        this.buildLevel(levelIndex);

        // Particle System Setup
        this.setupParticles();

        // Render Loop
        this.scene.onBeforeRenderObservable.add(() => this.updateGameLogic());

        return this.scene;
    }

    setupBobaPearl() {
        this.bobaPearl = BABYLON.MeshBuilder.CreateSphere("bobaPearl", { diameter: 1.0, segments: 32 }, this.scene);
        this.bobaPearl.position = new BABYLON.Vector3(0, 2, 0);
        this.checkpointPosition = this.bobaPearl.position.clone();
        this.shadowGenerator.addShadowCaster(this.bobaPearl);

        // PBR Material for Boba Pearl (Glossy dark tapioca brown)
        this.bobaMaterial = new BABYLON.PBRMaterial("bobaMat", this.scene);
        this.bobaMaterial.albedoColor = new BABYLON.Color3(0.11, 0.05, 0.1); // #1c0d18
        this.bobaMaterial.metallic = 0.1;
        this.bobaMaterial.roughness = 0.12;
        this.bobaMaterial.clearCoat.isEnabled = true;
        this.bobaMaterial.clearCoat.intensity = 1.0;
        this.bobaMaterial.clearCoat.roughness = 0.05;
        this.bobaPearl.material = this.bobaMaterial;
    }

    setupParticles() {
        // Dash Particle System
        this.dashTrailParticles = new BABYLON.ParticleSystem("dashParticles", 200, this.scene);
        this.dashTrailParticles.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", this.scene);
        this.dashTrailParticles.emitter = this.bobaPearl;
        this.dashTrailParticles.minEmitBox = new BABYLON.Vector3(-0.2, -0.4, -0.2);
        this.dashTrailParticles.maxEmitBox = new BABYLON.Vector3(0.2, -0.2, 0.2);
        this.dashTrailParticles.color1 = new BABYLON.Color4(1, 0.8, 0.2, 1.0);
        this.dashTrailParticles.color2 = new BABYLON.Color4(1, 0.95, 0.6, 1.0);
        this.dashTrailParticles.colorDead = new BABYLON.Color4(1, 0.8, 0.2, 0.0);
        this.dashTrailParticles.minSize = 0.1;
        this.dashTrailParticles.maxSize = 0.35;
        this.dashTrailParticles.minLifeTime = 0.1;
        this.dashTrailParticles.maxLifeTime = 0.3;
        this.dashTrailParticles.emitRate = 120;
        this.dashTrailParticles.gravity = new BABYLON.Vector3(0, -2, 0);

        // Victory Splash Particles
        this.splashParticles = new BABYLON.ParticleSystem("splashParticles", 500, this.scene);
        this.splashParticles.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", this.scene);
        this.splashParticles.color1 = new BABYLON.Color4(0.9, 0.7, 0.4, 1.0);
        this.splashParticles.color2 = new BABYLON.Color4(1, 0.9, 0.5, 1.0);
        this.splashParticles.minSize = 0.2;
        this.splashParticles.maxSize = 0.6;
        this.splashParticles.minLifeTime = 0.5;
        this.splashParticles.maxLifeTime = 1.2;
        this.splashParticles.emitRate = 0; // Trigger burst manually
        this.splashParticles.direction1 = new BABYLON.Vector3(-5, 8, -5);
        this.splashParticles.direction2 = new BABYLON.Vector3(5, 14, 5);
        this.splashParticles.gravity = new BABYLON.Vector3(0, -15, 0);
    }

    // --- Level Builder Methods ---
    buildLevel(levelIndex) {
        this.collectibles = [];
        this.movingPlatforms = [];
        this.spinners = [];

        const config = LEVEL_CONFIGS[levelIndex];

        // Track Material
        const trackMat = new BABYLON.PBRMaterial("trackMat", this.scene);
        trackMat.albedoColor = config.trackColor;
        trackMat.roughness = 0.3;
        trackMat.metallic = 0.05;

        // Border / Accent Material
        const accentMat = new BABYLON.PBRMaterial("accentMat", this.scene);
        accentMat.albedoColor = config.accentColor;
        accentMat.roughness = 0.2;

        if (levelIndex === 0) {
            this.buildMilkTeaMeadow(trackMat, accentMat);
        } else if (levelIndex === 1) {
            this.buildTaroHeights(trackMat, accentMat);
        } else if (levelIndex === 2) {
            this.buildMatchaGardens(trackMat, accentMat);
        }
    }

    createPlatform(name, width, height, depth, pos, rot, mat, isCheckPoint = false) {
        const box = BABYLON.MeshBuilder.CreateBox(name, { width, height, depth }, this.scene);
        box.position = pos.clone();
        if (rot) box.rotation = rot.clone();
        box.material = mat;
        box.receiveShadows = true;

        if (isCheckPoint) {
            // Visual Indicator for Checkpoint
            const ring = BABYLON.MeshBuilder.CreateTorus(name + "Ring", { diameter: width * 0.7, thickness: 0.1 }, this.scene);
            ring.position = pos.add(new BABYLON.Vector3(0, height / 2 + 0.1, 0));
            const ringMat = new BABYLON.StandardMaterial("ringMat", this.scene);
            ringMat.emissiveColor = new BABYLON.Color3(0.9, 0.8, 0.2);
            ring.material = ringMat;
        }

        return box;
    }

    spawnSugarCube(pos) {
        const cube = BABYLON.MeshBuilder.CreateBox("sugarCube", { size: 0.6 }, this.scene);
        cube.position = pos.clone();

        const sugarMat = new BABYLON.PBRMaterial("sugarMat", this.scene);
        sugarMat.albedoColor = new BABYLON.Color3(1.0, 0.98, 0.9);
        sugarMat.emissiveColor = new BABYLON.Color3(0.4, 0.35, 0.1);
        sugarMat.roughness = 0.1;
        sugarMat.alpha = 0.9;
        cube.material = sugarMat;

        this.glowLayer.addIncludedOnlyMesh(cube);
        this.collectibles.push({ mesh: cube, collected: false });
    }

    spawnFinishCup(pos) {
        // Cup Body
        const cup = BABYLON.MeshBuilder.CreateCylinder("finishCup", { height: 3.5, diameterTop: 3.0, diameterBottom: 2.2 }, this.scene);
        cup.position = pos.clone();
        
        const cupMat = new BABYLON.PBRMaterial("cupMat", this.scene);
        cupMat.albedoColor = new BABYLON.Color3(1, 1, 1);
        cupMat.alpha = 0.6;
        cupMat.roughness = 0.1;
        cup.material = cupMat;

        // Tea Liquid inside cup
        const liquid = BABYLON.MeshBuilder.CreateCylinder("teaLiquid", { height: 2.5, diameterTop: 2.8, diameterBottom: 2.1 }, this.scene);
        liquid.position = pos.add(new BABYLON.Vector3(0, -0.4, 0));
        const liquidMat = new BABYLON.StandardMaterial("liquidMat", this.scene);
        liquidMat.diffuseColor = new BABYLON.Color3(0.75, 0.45, 0.25);
        liquid.material = liquidMat;

        // Straw
        const straw = BABYLON.MeshBuilder.CreateCylinder("straw", { height: 6.0, diameter: 0.35 }, this.scene);
        straw.position = pos.add(new BABYLON.Vector3(0.8, 1.5, 0.2));
        straw.rotation = new BABYLON.Vector3(0.1, 0, -0.2);
        const strawMat = new BABYLON.StandardMaterial("strawMat", this.scene);
        strawMat.diffuseColor = new BABYLON.Color3(0.95, 0.3, 0.4);
        straw.material = strawMat;

        this.finishCupMesh = cup;
    }

    // --- Level 1 Construction ---
    buildMilkTeaMeadow(mat, accentMat) {
        // 1. Starting Platform
        this.createPlatform("start", 8, 1, 8, new BABYLON.Vector3(0, 0, 0), null, mat, true);

        // Sugar Cubes on start
        this.spawnSugarCube(new BABYLON.Vector3(0, 1.2, 2));
        this.spawnSugarCube(new BABYLON.Vector3(0, 1.2, -2));

        // 2. Caramel Slope Track
        this.createPlatform("slope1", 5, 1, 16, new BABYLON.Vector3(0, -1, 12), new BABYLON.Vector3(-0.1, 0, 0), mat);
        this.spawnSugarCube(new BABYLON.Vector3(0, 0.5, 10));
        this.spawnSugarCube(new BABYLON.Vector3(0, -0.2, 16));

        // 3. Straw Tunnel Launcher Shortcut
        const strawTunnel = BABYLON.MeshBuilder.CreateCylinder("strawTunnel", { height: 8, diameter: 3 }, this.scene);
        strawTunnel.position = new BABYLON.Vector3(0, -1.5, 24);
        strawTunnel.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
        strawTunnel.material = accentMat;

        this.spawnSugarCube(new BABYLON.Vector3(0, -1.2, 22));
        this.spawnSugarCube(new BABYLON.Vector3(0, -1.2, 26));

        // 4. Wide Turn Track
        this.createPlatform("turnPlatform", 10, 1, 10, new BABYLON.Vector3(0, -2, 35), null, mat, true);
        this.spawnSugarCube(new BABYLON.Vector3(-2, -1, 35));
        this.spawnSugarCube(new BABYLON.Vector3(2, -1, 35));

        // 5. Final Ramp to Cup
        this.createPlatform("finalRamp", 6, 1, 18, new BABYLON.Vector3(0, -3.5, 49), new BABYLON.Vector3(0.08, 0, 0), mat);
        this.spawnSugarCube(new BABYLON.Vector3(0, -3, 46));
        this.spawnSugarCube(new BABYLON.Vector3(0, -3.8, 54));

        // 6. Finish Cup
        this.spawnFinishCup(new BABYLON.Vector3(0, -6.5, 62));
    }

    // --- Level 2 Construction ---
    buildTaroHeights(mat, accentMat) {
        // 1. Start Platform
        this.createPlatform("start", 7, 1, 7, new BABYLON.Vector3(0, 0, 0), null, mat, true);
        this.spawnSugarCube(new BABYLON.Vector3(0, 1.2, 2));

        // 2. Narrow Floating Bridges
        this.createPlatform("narrow1", 2.2, 1, 14, new BABYLON.Vector3(0, -0.5, 10), null, mat);
        this.spawnSugarCube(new BABYLON.Vector3(0, 0.8, 8));
        this.spawnSugarCube(new BABYLON.Vector3(0, 0.8, 12));

        // 3. Moving Milk Platform
        const movingP1 = this.createPlatform("moving1", 5, 0.8, 5, new BABYLON.Vector3(0, -0.5, 20), null, accentMat);
        this.movingPlatforms.push({ mesh: movingP1, startPos: movingP1.position.clone(), dir: new BABYLON.Vector3(4, 0, 0), speed: 2.0 });
        this.spawnSugarCube(new BABYLON.Vector3(0, 0.8, 20));

        // 4. Middle Platform & Bounce Pad Zone
        this.createPlatform("midPlatform", 7, 1, 7, new BABYLON.Vector3(0, -0.5, 28), null, mat, true);
        this.spawnSugarCube(new BABYLON.Vector3(-2, 0.8, 28));
        this.spawnSugarCube(new BABYLON.Vector3(2, 0.8, 28));

        // Bounce Pad
        const bouncePad = BABYLON.MeshBuilder.CreateBox("bouncePad", { width: 3, height: 0.4, depth: 3 }, this.scene);
        bouncePad.position = new BABYLON.Vector3(0, 0.2, 30);
        const bounceMat = new BABYLON.StandardMaterial("bounceMat", this.scene);
        bounceMat.emissiveColor = new BABYLON.Color3(0.9, 0.2, 0.8);
        bouncePad.material = bounceMat;

        // 5. Higher Elevated Track
        this.createPlatform("highTrack", 4, 1, 16, new BABYLON.Vector3(0, 3.5, 42), null, mat);
        this.spawnSugarCube(new BABYLON.Vector3(0, 4.8, 38));
        this.spawnSugarCube(new BABYLON.Vector3(0, 4.8, 44));
        this.spawnSugarCube(new BABYLON.Vector3(0, 4.8, 48));

        // 6. Finish Cup
        this.spawnFinishCup(new BABYLON.Vector3(0, 1.0, 56));
    }

    // --- Level 3 Construction ---
    buildMatchaGardens(mat, accentMat) {
        // 1. Start Platform
        this.createPlatform("start", 7, 1, 7, new BABYLON.Vector3(0, 0, 0), null, mat, true);
        this.spawnSugarCube(new BABYLON.Vector3(0, 1.2, 2));

        // 2. S-Curve Matcha Track
        this.createPlatform("scurve1", 5, 1, 12, new BABYLON.Vector3(0, -0.5, 9), new BABYLON.Vector3(0, 0.2, 0), mat);
        this.createPlatform("scurve2", 5, 1, 12, new BABYLON.Vector3(3, -1.0, 19), new BABYLON.Vector3(0, -0.2, 0), mat);
        this.spawnSugarCube(new BABYLON.Vector3(1, 0.8, 8));
        this.spawnSugarCube(new BABYLON.Vector3(3, 0.2, 18));

        // 3. Spinning Tea Stirrer Zone
        const spinPlatform = this.createPlatform("spinPlatform", 10, 1, 10, new BABYLON.Vector3(0, -1.5, 30), null, mat, true);
        this.spawnSugarCube(new BABYLON.Vector3(-3, -0.2, 30));
        this.spawnSugarCube(new BABYLON.Vector3(3, -0.2, 30));

        // Spinner Hazard
        const stirrer = BABYLON.MeshBuilder.CreateBox("teaStirrer", { width: 9, height: 0.8, depth: 0.8 }, this.scene);
        stirrer.position = new BABYLON.Vector3(0, -0.6, 30);
        stirrer.material = accentMat;
        this.spinners.push({ mesh: stirrer, speed: 2.5 });

        // 4. Steep Drop Ramp
        this.createPlatform("steepRamp", 6, 1, 18, new BABYLON.Vector3(0, -3.5, 44), new BABYLON.Vector3(0.25, 0, 0), mat);
        this.spawnSugarCube(new BABYLON.Vector3(0, -2.0, 40));
        this.spawnSugarCube(new BABYLON.Vector3(0, -4.0, 48));
        this.spawnSugarCube(new BABYLON.Vector3(0, -5.5, 52));

        // 5. Finish Cup
        this.spawnFinishCup(new BABYLON.Vector3(0, -9.0, 60));
    }

    // --- Game Logic Update Loop ---
    updateGameLogic() {
        if (!this.isGameRunning || this.isPaused || !this.bobaPearl) return;

        const dt = this.engine.getDeltaTime() / 1000.0;

        // 1. Movement Physics calculation
        this.handlePlayerMovement(dt);

        // 2. Camera smooth tracking
        const targetCamPos = this.bobaPearl.position.add(new BABYLON.Vector3(0, 1.2, 0));
        this.camera.target = BABYLON.Vector3.Lerp(this.camera.target, targetCamPos, 0.1);

        // 3. Moving Platforms & Spinners Update
        this.updateEnvironmentObstacles(dt);

        // 4. Collectibles Distance Detection
        this.checkCollectibles();

        // 5. Checkpoint & Fall-out Detection
        if (this.bobaPearl.position.y < -12) {
            this.respawnAtCheckpoint();
        }

        // 6. Finish Cup Victory Detection
        if (this.finishCupMesh) {
            const distToCup = BABYLON.Vector3.Distance(this.bobaPearl.position, this.finishCupMesh.position);
            if (distToCup < 2.0) {
                this.triggerVictory();
            }
        }
    }

    handlePlayerMovement(dt) {
        let moveX = 0;
        let moveZ = 0;

        if (this.keys.w) moveZ += 1;
        if (this.keys.s) moveZ -= 1;
        if (this.keys.a) moveX -= 1;
        if (this.keys.d) moveX += 1;

        if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
            moveX = this.joystickVector.x;
            moveZ = this.joystickVector.y;
        }

        // Camera Relative Vector Calculation
        const forward = this.camera.getForwardRay().direction;
        forward.y = 0;
        forward.normalize();

        const right = BABYLON.Vector3.Cross(forward, BABYLON.Vector3.Up()).negate();
        right.normalize();

        const moveDir = forward.scale(moveZ).add(right.scale(moveX));
        if (moveDir.length() > 0.01) {
            moveDir.normalize();
        }

        // Base Speed & Dash Boost
        let baseSpeed = 14.0;
        if (this.keys.shift) {
            baseSpeed *= 1.6;
            this.dashTrailParticles.start();
        } else {
            this.dashTrailParticles.stop();
        }

        // Overload Sugar Boost
        if (this.sugarCount >= 10) {
            baseSpeed *= 1.25;
        }

        // Apply Impulse Velocity
        this.playerVelocity.x = BABYLON.Scalar.Lerp(this.playerVelocity.x, moveDir.x * baseSpeed, 0.12);
        this.playerVelocity.z = BABYLON.Scalar.Lerp(this.playerVelocity.z, moveDir.z * baseSpeed, 0.12);
        this.playerVelocity.y -= 18.0 * dt; // Gravity

        // Move mesh
        this.bobaPearl.position.addInPlace(this.playerVelocity.scale(dt));

        // Sphere Rolling Rotation Animation
        const horizSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
        if (horizSpeed > 0.1) {
            const rotAxis = new BABYLON.Vector3(-this.playerVelocity.z, 0, this.playerVelocity.x).normalize();
            this.bobaPearl.rotate(rotAxis, horizSpeed * dt * 2.0, BABYLON.Space.WORLD);
        }

        // Raycast Ground Check
        const ray = new BABYLON.Ray(this.bobaPearl.position, new BABYLON.Vector3(0, -1, 0), 0.6);
        const hit = this.scene.pickWithRay(ray, (m) => m !== this.bobaPearl);
        if (hit && hit.hit) {
            this.isGrounded = true;
            if (this.playerVelocity.y < 0) this.playerVelocity.y = 0;

            // Bounce Pad Interaction
            if (hit.pickedMesh && hit.pickedMesh.name === "bouncePad") {
                this.playerVelocity.y = 16.0;
                this.audio.playJumpSound();
            }
        } else {
            this.isGrounded = false;
        }
    }

    triggerJump() {
        if (this.isGrounded) {
            this.playerVelocity.y = 9.5;
            this.audio.playJumpSound();
            this.isGrounded = false;
        }
    }

    updateEnvironmentObstacles(dt) {
        // Moving Platforms
        this.movingPlatforms.forEach((p) => {
            p.mesh.position.addInPlace(p.dir.scale(dt * p.speed));
            if (BABYLON.Vector3.Distance(p.mesh.position, p.startPos) > 6.0) {
                p.dir.negateInPlace();
            }
        });

        // Spinners
        this.spinners.forEach((s) => {
            s.mesh.rotation.y += s.speed * dt;

            // Spinner Collision Hit Push
            if (this.bobaPearl) {
                const dist = BABYLON.Vector3.Distance(this.bobaPearl.position, s.mesh.position);
                if (dist < 4.5 && Math.abs(this.bobaPearl.position.y - s.mesh.position.y) < 1.0) {
                    const pushDir = this.bobaPearl.position.subtract(s.mesh.position).normalize();
                    this.playerVelocity.addInPlace(pushDir.scale(15.0));
                    this.audio.playSplashSound();
                }
            }
        });
    }

    checkCollectibles() {
        this.collectibles.forEach((c) => {
            if (c.collected) return;

            // Idle rotation animation
            c.mesh.rotation.y += 0.03;

            const dist = BABYLON.Vector3.Distance(this.bobaPearl.position, c.mesh.position);
            if (dist < 1.1) {
                c.collected = true;
                c.mesh.isVisible = false;
                this.sugarCount++;
                this.score += 100;
                this.audio.playCollectSound();
                this.updateHUD();

                if (this.sugarCount === 10) {
                    this.showNotice("100% SUGAR OVERLOAD! SPEED BOOST! ⚡");
                }
            }
        });
    }

    respawnAtCheckpoint() {
        this.audio.playSplashSound();
        this.bobaPearl.position = this.checkpointPosition.clone().add(new BABYLON.Vector3(0, 1.5, 0));
        this.playerVelocity = new BABYLON.Vector3(0, 0, 0);
        this.showNotice("DROPPED OFF TRACK! RESPAWNED AT CHECKPOINT");
    }

    // --- State & UI Updates ---
    updateHUD() {
        document.getElementById("scoreText").innerText = this.score;

        const sugarPercent = Math.min(100, Math.floor((this.sugarCount / 10) * 100));
        document.getElementById("sugarPercentText").innerText = `${sugarPercent}%`;
        
        const fill = document.getElementById("sugarBarFill");
        fill.style.width = `${sugarPercent}%`;
        if (sugarPercent >= 100) {
            fill.classList.add("overload");
        } else {
            fill.classList.remove("overload");
        }
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timer = 0;
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && this.isGameRunning) {
                this.timer++;
                const mins = Math.floor(this.timer / 60).toString().padStart(2, '0');
                const secs = (this.timer % 60).toString().padStart(2, '0');
                document.getElementById("timerText").innerText = `${mins}:${secs}`;
            }
        }, 1000);
    }

    showNotice(msg) {
        const banner = document.getElementById("noticeBanner");
        banner.innerText = msg;
        banner.classList.add("active");
        setTimeout(() => banner.classList.remove("active"), 2200);
    }

    // --- Game Navigation Controls ---
    startLevel(levelIndex) {
        this.currentLevelIndex = levelIndex;
        this.score = 0;
        this.sugarCount = 0;
        this.isGameRunning = true;
        this.isPaused = false;

        this.createScene(levelIndex);
        this.updateHUD();
        this.startTimer();

        document.getElementById("modalStart").classList.remove("active");
        document.getElementById("modalPause").classList.remove("active");
        document.getElementById("modalVictory").classList.remove("active");
    }

    pauseGame() {
        this.isPaused = true;
        document.getElementById("modalPause").classList.add("active");
    }

    resumeGame() {
        this.isPaused = false;
        document.getElementById("modalPause").classList.remove("active");
    }

    openMenu() {
        this.isGameRunning = false;
        document.getElementById("modalPause").classList.remove("active");
        document.getElementById("modalVictory").classList.remove("active");
        document.getElementById("modalStart").classList.add("active");
    }

    triggerVictory() {
        this.isGameRunning = false;
        clearInterval(this.timerInterval);
        this.audio.playVictorySound();

        // Trigger Splash Particles at cup position
        if (this.splashParticles && this.finishCupMesh) {
            this.splashParticles.emitter = this.finishCupMesh.position.clone();
            this.splashParticles.start();
            setTimeout(() => this.splashParticles.stop(), 1500);
        }

        const config = LEVEL_CONFIGS[this.currentLevelIndex];
        const sugarPercent = Math.min(100, Math.floor((this.sugarCount / 10) * 100));
        
        // Stars calculation
        let stars = "⭐";
        if (sugarPercent >= 70) stars = "⭐⭐";
        if (sugarPercent >= 100 && this.timer <= config.targetTime) stars = "⭐⭐⭐";

        document.getElementById("victoryLevelName").innerText = `${config.name} Complete!`;
        document.getElementById("victorySugar").innerText = `${sugarPercent}%`;
        document.getElementById("victoryTime").innerText = document.getElementById("timerText").innerText;
        document.getElementById("victoryScore").innerText = this.score;
        document.getElementById("victoryStars").innerText = stars;

        const nextBtn = document.getElementById("btnNextLevel");
        if (this.currentLevelIndex >= LEVEL_CONFIGS.length - 1) {
            nextBtn.style.display = "none";
        } else {
            nextBtn.style.display = "block";
        }

        document.getElementById("modalVictory").classList.add("active");
    }
}

// --- Global Instance & Initialization ---
let gameInstance = null;
let selectedLevel = 0;

window.addEventListener("DOMContentLoaded", () => {
    gameInstance = new BobaDropGame();
    
    // Start Babylon Engine Loop
    gameInstance.engine.runRenderLoop(() => {
        if (gameInstance.scene && gameInstance.scene.activeCamera) {
            gameInstance.scene.render();
        }
    });
});

function selectLevel(idx) {
    selectedLevel = idx;
    gameInstance.startLevel(idx);
}

function startGame() {
    gameInstance.startLevel(selectedLevel);
}

function resumeGame() {
    gameInstance.resumeGame();
}

function openMenu() {
    gameInstance.openMenu();
}

function replayLevel() {
    gameInstance.startLevel(gameInstance.currentLevelIndex);
}

function nextLevel() {
    const next = gameInstance.currentLevelIndex + 1;
    if (next < LEVEL_CONFIGS.length) {
        gameInstance.startLevel(next);
    }
}
