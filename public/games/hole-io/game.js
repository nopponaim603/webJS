/**
 * Hole.io 3D Game Engine Implementation
 * Powered by Babylon.js & Kenney 3D Assets
 */

// Sound Manager class using Web Audio API
class SoundFXManager {
    constructor() {
        this.sounds = {};
        this.soundList = [
            { id: 'coin', url: '/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/sounds/coin.ogg' },
            { id: 'break', url: '/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/sounds/break.ogg' },
            { id: 'land', url: '/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/sounds/land.ogg' },
            { id: 'fall', url: '/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/sounds/fall.ogg' }
        ];
        this.init();
    }

    init() {
        this.soundList.forEach(s => {
            const audio = new Audio(s.url);
            audio.preload = 'auto';
            this.sounds[s.id] = audio;
        });
    }

    play(id, volume = 0.6) {
        if (this.sounds[id]) {
            try {
                const soundClone = this.sounds[id].cloneNode();
                soundClone.volume = volume;
                soundClone.play().catch(() => {});
            } catch (e) {}
        }
    }
}

// Global Game Variables
let canvas, engine, scene, camera, shadowGenerator;
let holeRoot, holeDisc, holeRim, holeCavity;
let soundFX = new SoundFXManager();

// Hole Growth Config
const HOLE_LEVELS = [
    { level: 1, name: "Level 1 (เล็ก)", radius: 0.90, targetXP: 120, speed: 11.0 },
    { level: 2, name: "Level 2 (ปานกลาง)", radius: 1.65, targetXP: 450, speed: 10.0 },
    { level: 3, name: "Level 3 (ใหญ่)", radius: 2.70, targetXP: 1000, speed: 9.2 },
    { level: 4, name: "Level MAX (มหาหลุมดำ)", radius: 4.00, targetXP: 9999, speed: 8.5 }
];

// Game State
let gameState = {
    levelIndex: 0,
    score: 0,
    xp: 0,
    swallowedCount: 0,
    timeLeft: 60,
    isPlaying: false,
    startTime: 0,
    isFallbackMode: false
};

// Physics & Controls Settings
let keys = { W: false, A: false, S: false, D: false };
let joystickInput = { x: 0, y: 0 };
let activeWorldObjects = [];

// Asset Containers
const assets = {
    containers: {}
};

// Initialize Game Engine
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: false,
        stencil: true,
        powerPreference: "high-performance",
        doNotHandleTouchAction: true
    });

    const maxDPR = Math.min(window.devicePixelRatio || 1, 1.5);
    engine.setHardwareScalingLevel(1 / maxDPR);

    initScene();
    setupInputs();
    setupMobileJoystick();

    loadAllAssets().then(() => {
        document.getElementById('loader-overlay').classList.add('hidden');
        buildHoleArena();
        startGame();
    });

    engine.runRenderLoop(() => {
        if (scene) {
            const rawDt = engine.getDeltaTime() / 1000;
            const clampedDt = Math.min(0.033, rawDt);
            updateGameLoop(clampedDt);
            scene.render();
        }
    });

    window.addEventListener('resize', () => engine.resize());
});

// Scene Setup with PBR & Stencil Hole Cavity
function initScene() {
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.55, 0.65, 0.90, 1.0);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.003;
    scene.fogColor = new BABYLON.Color3(0.55, 0.65, 0.90);

    // Classic 3D Isometric Camera (-45° Yaw, 54.74° Pitch)
    const initialAlpha = -Math.PI / 4;            // -45° Diagonal view across arena corner
    const initialBeta = Math.atan(Math.SQRT2);     // ~54.74° Classic Isometric pitch angle
    const initialRadius = 46;

    camera = new BABYLON.ArcRotateCamera("HoleCam", initialAlpha, initialBeta, initialRadius, new BABYLON.Vector3(0, 0, 0), scene);
    camera.lowerAlphaLimit = initialAlpha;
    camera.upperAlphaLimit = initialAlpha;
    camera.lowerBetaLimit = initialBeta;
    camera.upperBetaLimit = initialBeta;
    camera.lowerRadiusLimit = 25;
    camera.upperRadiusLimit = 80;
    camera.fov = 0.78;

    camera.inputs.clear();
    camera.inputs.addMouseWheel();

    // Lighting
    const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.85;
    hemiLight.skyColor = new BABYLON.Color3(0.9, 0.95, 1.0);
    hemiLight.groundColor = new BABYLON.Color3(0.6, 0.55, 0.75);

    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.6, -1.2, 0.8).normalize(), scene);
    dirLight.position = new BABYLON.Vector3(30, 50, -25);
    dirLight.intensity = 1.2;

    shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;

    // Create Ground Arena
    createGroundArena();

    // Create Player Hole Root
    holeRoot = new BABYLON.TransformNode("holeRoot", scene);
    holeRoot.position = new BABYLON.Vector3(0, 0.02, 0);

    createHoleVisuals();
}

// Create Ground Plane & Underneath Abyss Cavity
function createGroundArena() {
    // 1. Arena Ground Surface (50x50)
    const ground = BABYLON.MeshBuilder.CreateGround("arenaGround", { width: 60, height: 60 }, scene);
    ground.position.y = 0;
    ground.receiveShadows = true;

    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.28, 0.68, 0.42); // Vibrant Grass Green
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMat;

    // Arena Outer Boundary Force-Field Barriers (Transparent & Glowing - Never Blocks View!)
    const wallHeight = 1.2;
    const wallThickness = 0.25;
    const size = 60;

    // Glowing Glass Force Field Material
    const forceFieldMat = new BABYLON.StandardMaterial("forceFieldMat", scene);
    forceFieldMat.diffuseColor = new BABYLON.Color3(0.3, 0.7, 1.0);
    forceFieldMat.emissiveColor = new BABYLON.Color3(0.2, 0.5, 0.9);
    forceFieldMat.alpha = 0.35;
    forceFieldMat.backFaceCulling = false;

    // Neon Edge Trim Material
    const neonTrimMat = new BABYLON.StandardMaterial("neonTrimMat", scene);
    neonTrimMat.emissiveColor = new BABYLON.Color3(0.4, 0.85, 1.0);
    neonTrimMat.disableLighting = true;

    const walls = [
        { pos: new BABYLON.Vector3(0, wallHeight/2, size/2), w: size, d: wallThickness },
        { pos: new BABYLON.Vector3(0, wallHeight/2, -size/2), w: size, d: wallThickness },
        { pos: new BABYLON.Vector3(size/2, wallHeight/2, 0), w: wallThickness, d: size },
        { pos: new BABYLON.Vector3(-size/2, wallHeight/2, 0), w: wallThickness, d: size }
    ];

    walls.forEach((w, i) => {
        // Semi-transparent Force Field Wall
        const wall = BABYLON.MeshBuilder.CreateBox(`forceFieldWall_${i}`, { width: w.w, height: wallHeight, depth: w.d }, scene);
        wall.position = w.pos;
        wall.material = forceFieldMat;

        // Glowing Top Neon Rail
        const topRail = BABYLON.MeshBuilder.CreateBox(`neonRail_${i}`, { width: w.w, height: 0.08, depth: w.d + 0.1 }, scene);
        topRail.position = w.pos.clone();
        topRail.position.y = wallHeight;
        topRail.material = neonTrimMat;
    });

    // 2. Black Hole Abyss Box underneath (So swallowed objects fall into darkness)
    holeCavity = BABYLON.MeshBuilder.CreateBox("holeCavityBox", { width: 65, height: 10, depth: 65 }, scene);
    holeCavity.position.y = -5.1;
    const cavityMat = new BABYLON.StandardMaterial("cavityMat", scene);
    cavityMat.diffuseColor = new BABYLON.Color3(0.02, 0.02, 0.05);
    cavityMat.specularColor = new BABYLON.Color3(0, 0, 0);
    cavityMat.emissiveColor = new BABYLON.Color3(0.01, 0.01, 0.03);
    cavityMat.backFaceCulling = false;
    holeCavity.material = cavityMat;
}

// Build Hole Visual Disc & Glowing Rim
function createHoleVisuals() {
    // 1. Dark Hole Void Disc (Flat on ground)
    holeDisc = BABYLON.MeshBuilder.CreateDisc("holeDisc", { radius: 1.0, tessellation: 64 }, scene);
    holeDisc.rotation.x = Math.PI / 2;
    holeDisc.parent = holeRoot;
    holeDisc.position.y = 0.02;

    const holeMat = new BABYLON.StandardMaterial("holeDiscMat", scene);
    holeMat.diffuseColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    holeMat.emissiveColor = new BABYLON.Color3(0.02, 0.01, 0.04);
    holeMat.specularColor = new BABYLON.Color3(0, 0, 0);
    holeDisc.material = holeMat;

    // 2. Glowing Outer Energy Rim
    holeRim = BABYLON.MeshBuilder.CreateTorus("holeRim", { diameter: 2.05, thickness: 0.12, tessellation: 64 }, scene);
    holeRim.parent = holeRoot;
    holeRim.position.y = 0.04;

    const rimMat = new BABYLON.StandardMaterial("holeRimMat", scene);
    rimMat.diffuseColor = new BABYLON.Color3(0.65, 0.25, 0.95);
    rimMat.emissiveColor = new BABYLON.Color3(0.75, 0.35, 1.0);
    rimMat.specularColor = new BABYLON.Color3(1, 1, 1);
    holeRim.material = rimMat;

    updateHoleScale(HOLE_LEVELS[0].radius);
}

// Update Hole Radius & Visual Scaling
function updateHoleScale(radius) {
    const scaleFactor = radius;
    holeDisc.scaling = new BABYLON.Vector3(scaleFactor, scaleFactor, 1.0);
    holeRim.scaling = new BABYLON.Vector3(scaleFactor, 1.0, scaleFactor);
}

// Dynamic GLTF Loader Script Verification
function ensureGLTFLoader() {
    if (typeof BABYLON !== 'undefined' && BABYLON.SceneLoader) {
        if (BABYLON.SceneLoader.IsPluginForExtensionAvailable && BABYLON.SceneLoader.IsPluginForExtensionAvailable(".glb")) return true;
        if (BABYLON.GLTF2 && BABYLON.GLTF2.GLTFFileLoader) {
            try { BABYLON.SceneLoader.RegisterPlugin(new BABYLON.GLTF2.GLTFFileLoader()); return true; } catch (e) {}
        }
        if (BABYLON.GLTFFileLoader) {
            try { BABYLON.SceneLoader.RegisterPlugin(new BABYLON.GLTFFileLoader()); return true; } catch (e) {}
        }
    }
    return true;
}

// Multi-Path Asset Loader
async function loadAssetContainerWithFallback(filename) {
    ensureGLTFLoader();
    const origin = window.location.origin;
    const candidates = [
        '/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/',
        '../3d-platformer/assets/kenney-starter-kit-3d-platformer/models/',
        '/assets/kenney-starter-kit-3d-platformer/models/',
        origin ? origin + '/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/' : null
    ].filter(Boolean);

    for (const rawRoot of candidates) {
        const rootUrl = rawRoot.endsWith('/') ? rawRoot : rawRoot + '/';
        try {
            const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(rootUrl, filename, scene);
            if (container && container.meshes && container.meshes.length > 0) {
                return container;
            }
        } catch (err) {}
    }
    return null;
}

// Load 3D Models Pipeline
async function loadAllAssets() {
    const progressFill = document.getElementById('progress-fill');
    const loadingText = document.getElementById('loading-text');

    const modelFiles = [
        { id: 'coin', file: 'coin.glb' },
        { id: 'blockCoin', file: 'block-coin.glb' },
        { id: 'brick', file: 'brick.glb' },
        { id: 'platformLarge', file: 'platform-large.glb' },
        { id: 'platformMedium', file: 'platform-medium.glb' }
    ];

    let loaded = 0;
    for (const item of modelFiles) {
        loadingText.innerText = `กำลังโหลดโมเดล 3D: ${item.file}`;
        const container = await loadAssetContainerWithFallback(item.file);
        if (container) assets.containers[item.id] = container;
        loaded++;
        progressFill.style.width = `${Math.round((loaded / modelFiles.length) * 100)}%`;
    }
}

// Build Hole Arena with Scattered Objects
function buildHoleArena() {
    clearArenaObjects();

    // 1. Scatter Small Objects (Coins - Size 1)
    for (let i = 0; i < 45; i++) {
        const x = (Math.random() - 0.5) * 48;
        const z = (Math.random() - 0.5) * 48;
        if (Math.abs(x) < 3 && Math.abs(z) < 3) continue; // Keep spawn area clear
        spawnArenaItem('coin', 1, new BABYLON.Vector3(x, 0.5, z), 10, 15);
    }

    // 2. Scatter Medium Objects (Brick & Question Blocks - Size 2)
    for (let i = 0; i < 24; i++) {
        const x = (Math.random() - 0.5) * 44;
        const z = (Math.random() - 0.5) * 44;
        if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
        const type = Math.random() > 0.5 ? 'brick' : 'blockCoin';
        spawnArenaItem(type, 2, new BABYLON.Vector3(x, 0.6, z), 50, 45);
    }

    // 3. Scatter Large Objects (Platforms - Size 3)
    for (let i = 0; i < 12; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
        const type = Math.random() > 0.5 ? 'platformMedium' : 'platformLarge';
        spawnArenaItem(type, 3, new BABYLON.Vector3(x, 0.4, z), 200, 120);
    }
}

function clearArenaObjects() {
    activeWorldObjects.forEach(obj => {
        if (obj.mesh) obj.mesh.dispose();
    });
    activeWorldObjects = [];
}

// Spawn Object Helper with Procedural Fallbacks
function spawnArenaItem(type, itemSize, position, scoreValue, xpValue) {
    const container = assets.containers[type];
    let rootMesh;

    if (container) {
        const entries = container.instantiateModelsToScene(name => `arena_${type}_${name}`);
        rootMesh = entries.rootNodes[0];
        rootMesh.position = position.clone();
        
        if (type === 'coin') rootMesh.scaling = new BABYLON.Vector3(1.2, 1.2, 1.2);
        
        rootMesh.getChildMeshes().forEach(m => {
            m.receiveShadows = true;
            if (shadowGenerator) shadowGenerator.addShadowCaster(m);
        });
    } else {
        // Procedural Fallback Meshes
        if (itemSize === 1) {
            rootMesh = BABYLON.MeshBuilder.CreateCylinder(`proc_coin`, { diameter: 0.8, height: 0.15 }, scene);
            rootMesh.rotation.x = Math.PI / 2;
            const mat = new BABYLON.StandardMaterial("procCoinMat", scene);
            mat.diffuseColor = new BABYLON.Color3(0.98, 0.75, 0.15);
            rootMesh.material = mat;
        } else if (itemSize === 2) {
            rootMesh = BABYLON.MeshBuilder.CreateBox(`proc_block`, { size: 1.2 }, scene);
            const mat = new BABYLON.StandardMaterial("procBlockMat", scene);
            mat.diffuseColor = new BABYLON.Color3(0.85, 0.45, 0.15);
            rootMesh.material = mat;
        } else {
            rootMesh = BABYLON.MeshBuilder.CreateBox(`proc_platform`, { width: 3.5, height: 0.6, depth: 3.5 }, scene);
            const mat = new BABYLON.StandardMaterial("procPlatMat", scene);
            mat.diffuseColor = new BABYLON.Color3(0.2, 0.65, 0.35);
            rootMesh.material = mat;
        }
        rootMesh.position = position.clone();
        rootMesh.receiveShadows = true;
        if (shadowGenerator) shadowGenerator.addShadowCaster(rootMesh);
    }

    activeWorldObjects.push({
        mesh: rootMesh,
        initialPos: position.clone(),
        size: itemSize,
        scoreValue: scoreValue,
        xpValue: xpValue,
        isSwallowing: false,
        swallowed: false
    });
}

// Input Control Event Handlers
function setupInputs() {
    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.W = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.A = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.S = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.D = true;
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.W = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.A = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.S = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.D = false;
    });
}

// Mobile Virtual Touch Joystick
function setupMobileJoystick() {
    const dpadArea = document.getElementById('dpad-area');
    const dpadStick = document.getElementById('dpad-stick');
    if (!dpadArea) return;

    let activePointerId = null;
    const radius = 45;

    function updateJoystickPosition(clientX, clientY) {
        const rect = dpadArea.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > radius) {
            dx = (dx / dist) * radius;
            dy = (dy / dist) * radius;
        }

        dpadStick.style.transform = `translate(${dx}px, ${dy}px)`;
        joystickInput.x = dx / radius;
        joystickInput.y = dy / radius;
    }

    dpadArea.addEventListener('pointerdown', (e) => {
        dpadArea.setPointerCapture(e.pointerId);
        activePointerId = e.pointerId;
        updateJoystickPosition(e.clientX, e.clientY);
    });

    dpadArea.addEventListener('pointermove', (e) => {
        if (activePointerId === e.pointerId) updateJoystickPosition(e.clientX, e.clientY);
    });

    dpadArea.addEventListener('pointerup', (e) => {
        if (activePointerId === e.pointerId) {
            dpadArea.releasePointerCapture(e.pointerId);
            activePointerId = null;
            joystickInput = { x: 0, y: 0 };
            dpadStick.style.transform = `translate(0px, 0px)`;
        }
    });

    dpadArea.addEventListener('pointercancel', (e) => {
        activePointerId = null;
        joystickInput = { x: 0, y: 0 };
        dpadStick.style.transform = `translate(0px, 0px)`;
    });
}

// Game Loop & Update Logic
function updateGameLoop(dt) {
    if (!gameState.isPlaying) return;

    // 1. Update Timer
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    gameState.timeLeft = Math.max(0, 60 - Math.floor(elapsed));
    const mins = Math.floor(gameState.timeLeft / 60).toString().padStart(2, '0');
    const secs = (gameState.timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-val').innerText = `${mins}:${secs}`;

    if (gameState.timeLeft <= 0) {
        triggerGameOver();
        return;
    }

    // 2. Hole Movement
    updateHoleMovement(dt);

    // 3. Suction Physics & Swallowing Check
    updateSwallowingPhysics(dt);

    // 4. Camera Follow
    updateCameraFollow();

    // 5. Hole Rim Pulse Animation
    if (holeRim) holeRim.rotation.y += 1.5 * dt;
}

// Player Hole Movement (Aligned with Isometric Camera Perspective)
function updateHoleMovement(dt) {
    let inputX = joystickInput.x;
    let inputZ = -joystickInput.y;

    if (keys.A) inputX -= 1;
    if (keys.D) inputX += 1;
    if (keys.W) inputZ += 1;
    if (keys.S) inputZ -= 1;

    const inputMag = Math.sqrt(inputX * inputX + inputZ * inputZ);
    let normX = inputMag > 0 ? inputX / Math.max(1, inputMag) : 0;
    let normZ = inputMag > 0 ? inputZ / Math.max(1, inputMag) : 0;

    // Camera-relative direction calculation
    let cameraForward = camera.getForwardRay().direction;
    cameraForward.y = 0;
    if (cameraForward.lengthSquared() > 0.001) cameraForward.normalize();
    else cameraForward = new BABYLON.Vector3(0, 0, 1);

    const cameraRight = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), cameraForward).normalize();
    const moveVector = cameraRight.scale(normX).add(cameraForward.scale(normZ));

    const currentConfig = HOLE_LEVELS[gameState.levelIndex];
    const speed = currentConfig.speed;

    holeRoot.position.x += moveVector.x * speed * dt;
    holeRoot.position.z += moveVector.z * speed * dt;

    // Clamp inside arena boundaries (60x60 boundary)
    holeRoot.position.x = Math.max(-27, Math.min(27, holeRoot.position.x));
    holeRoot.position.z = Math.max(-27, Math.min(27, holeRoot.position.z));
}

// Swallowing Physics Engine (Suction & Drop Into Cavity)
function updateSwallowingPhysics(dt) {
    const currentConfig = HOLE_LEVELS[gameState.levelIndex];
    const currentRadius = currentConfig.radius;
    const currentLevel = currentConfig.level;

    activeWorldObjects.forEach(obj => {
        if (obj.swallowed) return;
        // Ignore objects larger than current hole level (No movement, push, or interaction)
        if (obj.size > currentLevel) return;

        const objPosXZ = new BABYLON.Vector2(obj.mesh.position.x, obj.mesh.position.z);
        const holePosXZ = new BABYLON.Vector2(holeRoot.position.x, holeRoot.position.z);
        const distXZ = BABYLON.Vector2.Distance(objPosXZ, holePosXZ);

        // Suction Zone check
        if (distXZ < currentRadius * 0.95) {
            // Suction Active: Pull center towards hole & drop into cavity
            obj.isSwallowing = true;

            // Pull XZ towards hole center
            obj.mesh.position.x = BABYLON.Scalar.Lerp(obj.mesh.position.x, holeRoot.position.x, 12 * dt);
            obj.mesh.position.z = BABYLON.Scalar.Lerp(obj.mesh.position.z, holeRoot.position.z, 12 * dt);

            // Fall down into abyss
            obj.mesh.position.y -= 7.5 * dt;
            obj.mesh.rotation.x += 4.0 * dt;
            obj.mesh.rotation.y += 5.0 * dt;
            obj.mesh.scaling.scaleInPlace(0.95);

            // Completely Swallowed Check
            if (obj.mesh.position.y < -1.8) {
                obj.swallowed = true;
                obj.mesh.dispose();

                gameState.score += obj.scoreValue;
                gameState.xp += obj.xpValue;
                gameState.swallowedCount += 1;

                soundFX.play(obj.size === 1 ? 'coin' : 'break', 0.8);
                spawnSwallowBurst(holeRoot.position);
                updateHUD();
                checkHoleLevelUp();
            }
        }
    });
}

// Particle Burst Effect on Item Swallowed
function spawnSwallowBurst(pos) {
    const ps = new BABYLON.ParticleSystem("swallowBurst", 25, scene);
    ps.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
    ps.emitter = pos.clone().add(new BABYLON.Vector3(0, 0.2, 0));
    ps.color1 = new BABYLON.Color4(0.7, 0.3, 1.0, 1.0);
    ps.color2 = new BABYLON.Color4(0.3, 0.8, 1.0, 0.8);
    ps.minSize = 0.2;
    ps.maxSize = 0.5;
    ps.minLifeTime = 0.2;
    ps.maxLifeTime = 0.45;
    ps.emitRate = 180;
    ps.targetStopDuration = 0.1;
    ps.direction1 = new BABYLON.Vector3(-2, 2, -2);
    ps.direction2 = new BABYLON.Vector3(2, 4, 2);
    ps.start();
}

// Check XP Threshold for Hole Level Up
function checkHoleLevelUp() {
    const currentConfig = HOLE_LEVELS[gameState.levelIndex];
    if (gameState.xp >= currentConfig.targetXP && gameState.levelIndex < HOLE_LEVELS.length - 1) {
        gameState.levelIndex += 1;
        const newConfig = HOLE_LEVELS[gameState.levelIndex];

        updateHoleScale(newConfig.radius);
        soundFX.play('land', 0.9);
        spawnLevelUpParticles(holeRoot.position);
        updateHUD();
    }
}

function spawnLevelUpParticles(pos) {
    const ps = new BABYLON.ParticleSystem("levelUpRing", 50, scene);
    ps.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
    ps.emitter = pos.clone().add(new BABYLON.Vector3(0, 0.1, 0));
    ps.color1 = new BABYLON.Color4(1.0, 0.8, 0.2, 1.0);
    ps.color2 = new BABYLON.Color4(0.9, 0.2, 1.0, 0.9);
    ps.minSize = 0.3;
    ps.maxSize = 0.8;
    ps.minLifeTime = 0.4;
    ps.maxLifeTime = 0.8;
    ps.emitRate = 300;
    ps.targetStopDuration = 0.25;
    ps.direction1 = new BABYLON.Vector3(-3, 3, -3);
    ps.direction2 = new BABYLON.Vector3(3, 6, 3);
    ps.start();
}

// Camera Follow System
function updateCameraFollow() {
    const currentConfig = HOLE_LEVELS[gameState.levelIndex];
    const targetRadius = 42 + (currentConfig.radius * 3.5);
    camera.radius = BABYLON.Scalar.Lerp(camera.radius, targetRadius, 0.05);
    camera.target = BABYLON.Vector3.Lerp(camera.target, holeRoot.position, 0.08);
}

// HUD Update
function updateHUD() {
    const currentConfig = HOLE_LEVELS[gameState.levelIndex];
    document.getElementById('level-val').innerText = `LVL ${currentConfig.level}`;
    document.getElementById('score-val').innerText = gameState.score;
    document.getElementById('growth-label').innerText = currentConfig.name;

    const prevTarget = gameState.levelIndex > 0 ? HOLE_LEVELS[gameState.levelIndex - 1].targetXP : 0;
    const currentTarget = currentConfig.targetXP;
    const progress = Math.min(100, Math.max(0, ((gameState.xp - prevTarget) / (currentTarget - prevTarget)) * 100));
    document.getElementById('growth-fill').style.width = `${Math.round(progress)}%`;
}

// Start & Restart Control Functions
function startGame() {
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    gameState.score = 0;
    gameState.xp = 0;
    gameState.levelIndex = 0;
    gameState.swallowedCount = 0;
    updateHoleScale(HOLE_LEVELS[0].radius);
    updateHUD();
}

function triggerGameOver() {
    gameState.isPlaying = false;
    document.getElementById('swallowed-val').innerText = gameState.swallowedCount;
    document.getElementById('final-score-val').innerText = gameState.score;
    document.getElementById('gameover-modal').classList.add('active');
}

function restartGame() {
    document.getElementById('gameover-modal').classList.remove('active');
    holeRoot.position = new BABYLON.Vector3(0, 0.02, 0);
    buildHoleArena();
    startGame();
}
