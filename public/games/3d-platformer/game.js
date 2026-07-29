/**
 * Kenney 3D Platformer - Babylon.js 8 Game Engine Implementation
 */

// Sound Manager class using Web Audio API
class SoundFXManager {
    constructor() {
        this.sounds = {};
        this.loadedCount = 0;
        this.soundList = [
            { id: 'jump', url: '/assets/kenney-starter-kit-3d-platformer/sounds/jump.ogg' },
            { id: 'coin', url: '/assets/kenney-starter-kit-3d-platformer/sounds/coin.ogg' },
            { id: 'land', url: '/assets/kenney-starter-kit-3d-platformer/sounds/land.ogg' },
            { id: 'break', url: '/assets/kenney-starter-kit-3d-platformer/sounds/break.ogg' },
            { id: 'fall', url: '/assets/kenney-starter-kit-3d-platformer/sounds/fall.ogg' }
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
            } catch (e) {
                // Ignore audio autoplay restrictions
            }
        }
    }
}

// Global Game Variables
let canvas, engine, scene, camera, light, shadowGenerator;
let playerMesh, playerRoot, characterContainer;
let soundFX = new SoundFXManager();

let activeAnimations = {};
let currentAnimName = null;

// Game State
let gameState = {
    level: 1,
    coins: 0,
    score: 0,
    lives: 3,
    startTime: 0,
    elapsedTime: 0,
    isPlaying: false,
    isGrounded: false,
    isJumping: false,
    canJump: true,
    jumpCount: 0,
    maxJumps: 2,
    velocityY: 0,
    isFallbackMode: false,
    errorCode: null,
    lastErrorMsg: ""
};

// Physics & Controls Settings
const PHYSICS = {
    gravity: -28,
    jumpForce: 11.5,
    moveSpeed: 8.5,
    rotationSpeed: 12,
    coyoteTimeMax: 0.15,
    airControl: 0.7
};

let keys = { W: false, A: false, S: false, D: false, Space: false };
let joystickInput = { x: 0, y: 0 };
let coyoteTimer = 0;

// Asset Storage Containers
const assets = {
    containers: {},
    coins: [],
    questionBlocks: [],
    brickBlocks: [],
    movingPlatforms: [],
    fallingPlatforms: [],
    finishFlag: null,
    clouds: []
};

// Initialize Game Engine
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: false,
        stencil: false,
        powerPreference: "high-performance",
        doNotHandleTouchAction: true
    });

    // Optimize hardware scaling for high-DPI mobile screens (caps DPR to max 1.5)
    const maxDPR = Math.min(window.devicePixelRatio || 1, 1.5);
    engine.setHardwareScalingLevel(1 / maxDPR);
    engine.enableOfflineSupport = false;

    initScene();
    setupInputs();
    setupMobileJoystick();

    loadAllAssets().then(() => {
        document.getElementById('loader-overlay').classList.add('hidden');
        buildLevel(gameState.level);
        startGame();
    });

    engine.runRenderLoop(() => {
        if (scene) {
            // Cap delta time to max 0.033s (30fps equivalent step) to prevent physics tunneling during mobile frame drops
            const rawDt = engine.getDeltaTime() / 1000;
            const clampedDt = Math.min(0.033, rawDt);
            updateGameLoop(clampedDt);
            scene.render();
        }
    });

    window.addEventListener('resize', () => engine.resize());
});

// Scene Setup with PBR Lighting & Shadows
function initScene() {
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.08, 0.12, 0.22, 1.0);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.006;
    scene.fogColor = new BABYLON.Color3(0.08, 0.12, 0.22);

    // ArcRotateCamera (Third Person Camera)
    camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 3, 14, new BABYLON.Vector3(0, 2, 0), scene);
    camera.lowerBetaLimit = 0.2;
    camera.upperBetaLimit = Math.PI / 2.1;
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 22;
    camera.attachControl(canvas, true, false);
    camera.inputs.attached.pointers.buttons = [0, 1, 2]; // Allow drag rotation

    // Ambient Hemispheric Light
    const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.7;
    hemiLight.skyColor = new BABYLON.Color3(0.85, 0.92, 1.0);
    hemiLight.groundColor = new BABYLON.Color3(0.2, 0.25, 0.35);

    // Directional Light with Shadows
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, 1), scene);
    dirLight.position = new BABYLON.Vector3(20, 40, -20);
    dirLight.intensity = 1.1;

    shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 16;

    // Default Player Collider Root
    playerRoot = new BABYLON.TransformNode("playerRoot", scene);
    playerRoot.position = new BABYLON.Vector3(0, 3, 0);
}

// Dynamic GLTF / GLTF2 Loader Script Verification for Babylon.js 7.x
function ensureGLTFLoader() {
    if (typeof BABYLON !== 'undefined' && BABYLON.SceneLoader) {
        if (BABYLON.SceneLoader.IsPluginForExtensionAvailable && BABYLON.SceneLoader.IsPluginForExtensionAvailable(".glb")) {
            return true;
        }

        // Register BABYLON.GLTF2.GLTFFileLoader (Babylon 7.x Namespace)
        if (BABYLON.GLTF2 && BABYLON.GLTF2.GLTFFileLoader) {
            try {
                BABYLON.SceneLoader.RegisterPlugin(new BABYLON.GLTF2.GLTFFileLoader());
                console.log("[AssetLoader] Registered BABYLON.GLTF2.GLTFFileLoader plugin");
                return true;
            } catch (e) {}
        }

        // Register BABYLON.GLTFFileLoader (Fallback Namespace)
        if (BABYLON.GLTFFileLoader) {
            try {
                BABYLON.SceneLoader.RegisterPlugin(new BABYLON.GLTFFileLoader());
                console.log("[AssetLoader] Registered BABYLON.GLTFFileLoader plugin");
                return true;
            } catch (e) {}
        }
    }
    return true;
}

// Bulletproof Native Asset Container Loader for Babylon.js 7.x
async function loadAssetContainerWithFallback(filename) {
    await ensureGLTFLoader();

    const origin = window.location.origin;
    const pageUrl = window.location.href;
    const currentDir = pageUrl.substring(0, pageUrl.lastIndexOf('/') + 1);

    const candidates = [];
    try { candidates.push(new URL('../../assets/kenney-starter-kit-3d-platformer/models/', currentDir).href); } catch (e) {}
    try { candidates.push(new URL('../../assets/kenney-starter-kit-3d-platformer/models/', window.location.href).href); } catch (e) {}
    if (origin && origin !== "null") {
        candidates.push(origin + '/assets/kenney-starter-kit-3d-platformer/models/');
    }
    candidates.push('../../assets/kenney-starter-kit-3d-platformer/models/');
    candidates.push('/assets/kenney-starter-kit-3d-platformer/models/');

    let detectedErrorCode = null;

    for (const rawRoot of candidates) {
        const rootUrl = rawRoot.endsWith('/') ? rawRoot : rawRoot + '/';
        const fullUrl = rootUrl + filename;

        try {
            const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(rootUrl, filename, scene);
            if (container && container.meshes && container.meshes.length > 0) {
                console.log(`[AssetLoader] Successfully loaded 3D GLB model: ${filename} from ${rootUrl}`);
                return container;
            }
        } catch (err) {
            const msg = String(err.message || err);
            console.warn(`[AssetLoader] LoadAssetContainerAsync failed for ${fullUrl}:`, err);

            if (msg.includes('404') || msg.includes('Not Found') || msg.includes('ENOENT')) {
                detectedErrorCode = "ERR-E02 (HTTP_404_PATH)";
            } else if (msg.includes('CORS') || msg.includes('Cross-Origin') || msg.includes('Security')) {
                detectedErrorCode = "ERR-E03 (CORS_BLOCK)";
            } else if (msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
                detectedErrorCode = "ERR-E04 (NETWORK_FAIL)";
            } else {
                detectedErrorCode = "ERR-E05 (DECODE_PARSE_FAIL)";
            }
        }
    }

    if (!gameState.errorCode) {
        gameState.errorCode = detectedErrorCode || "ERR-E02 (HTTP_404_PATH)";
    }
    console.error(`[AssetLoader] All candidates failed for ${filename}. Final Diagnostic Code: ${gameState.errorCode}`);
    return null;
}

// Asset Loading Pipeline
async function loadAllAssets() {
    const progressFill = document.getElementById('progress-fill');
    const loadingText = document.getElementById('loading-text');

    const modelFiles = [
        { id: 'character', file: 'character.glb' },
        { id: 'coin', file: 'coin.glb' },
        { id: 'blockCoin', file: 'block-coin.glb' },
        { id: 'brick', file: 'brick.glb' },
        { id: 'platform', file: 'platform.glb' },
        { id: 'platformLarge', file: 'platform-large.glb' },
        { id: 'platformMedium', file: 'platform-medium.glb' },
        { id: 'platformFalling', file: 'platform-falling.glb' },
        { id: 'flag', file: 'flag.glb' },
        { id: 'cloud', file: 'cloud.glb' },
        { id: 'grass', file: 'grass.glb' }
    ];

    let loaded = 0;
    let fallbackCount = 0;

    for (const item of modelFiles) {
        loadingText.innerText = `กำลังโหลดโมเดล 3D: ${item.file}`;
        const container = await loadAssetContainerWithFallback(item.file);

        if (container) {
            assets.containers[item.id] = container;
        } else {
            console.warn(`[AssetLoader] Fallback active for ${item.id} (${item.file})`);
            if (item.id === 'character' || item.id === 'platformLarge' || item.id === 'platformMedium') {
                fallbackCount++;
            }
        }

        loaded++;
        progressFill.style.width = `${Math.round((loaded / modelFiles.length) * 100)}%`;
    }

    gameState.isFallbackMode = fallbackCount > 0;
    loadingText.innerText = `จัดเตรียมตัวละครและฉาก 3D...`;
    setupPlayerFromContainer();
}

// Setup Player Mesh & Animation Groups
function setupPlayerFromContainer() {
    const charContainer = assets.containers['character'];
    if (charContainer) {
        const entries = charContainer.instantiateModelsToScene(name => `player_${name}`);
        characterContainer = entries.rootNodes[0];
        characterContainer.parent = playerRoot;
        characterContainer.position = new BABYLON.Vector3(0, -0.5, 0);
        characterContainer.rotation.y = 0;
        characterContainer.scaling = new BABYLON.Vector3(1.2, 1.2, 1.2);

        // Cast shadows for all player meshes
        entries.rootNodes.forEach(node => {
            node.getChildMeshes().forEach(m => {
                if (shadowGenerator) shadowGenerator.addShadowCaster(m);
            });
        });

        // Extract Animation Groups
        if (entries.animationGroups) {
            entries.animationGroups.forEach(ag => {
                ag.stop();
                const name = ag.name.toLowerCase();
                if (name.includes('idle')) activeAnimations['idle'] = ag;
                else if (name.includes('walk') || name.includes('run')) activeAnimations['walk'] = ag;
                else if (name.includes('jump')) activeAnimations['jump'] = ag;
                else if (name.includes('fall')) activeAnimations['fall'] = ag;
            });
        }

        playAnimation('idle');
        return;
    }

    // === PROCEDURAL PLAYER FALLBACK ===
    console.log("[Fallback] Creating procedural 3D Hero Mesh...");
    const playerCapsule = BABYLON.MeshBuilder.CreateCapsule("proceduralPlayer", { height: 1.4, radius: 0.4 }, scene);
    const mat = new BABYLON.StandardMaterial("procPlayerMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.23, 0.51, 0.96);
    mat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    playerCapsule.material = mat;
    playerCapsule.parent = playerRoot;
    playerCapsule.position = new BABYLON.Vector3(0, 0.2, 0);

    const eye1 = BABYLON.MeshBuilder.CreateSphere("eye1", { diameter: 0.15 }, scene);
    const eye2 = BABYLON.MeshBuilder.CreateSphere("eye2", { diameter: 0.15 }, scene);
    const eyeMat = new BABYLON.StandardMaterial("eyeMat", scene);
    eyeMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    eye1.material = eyeMat;
    eye2.material = eyeMat;
    eye1.parent = playerCapsule;
    eye2.parent = playerCapsule;
    eye1.position = new BABYLON.Vector3(-0.15, 0.4, -0.35);
    eye2.position = new BABYLON.Vector3(0.15, 0.4, -0.35);

    characterContainer = playerCapsule;
    if (shadowGenerator) shadowGenerator.addShadowCaster(playerCapsule);
}

// Animation State Switcher
function playAnimation(animName) {
    if (currentAnimName === animName) return;
    if (activeAnimations[currentAnimName]) {
        activeAnimations[currentAnimName].stop();
    }
    if (activeAnimations[animName]) {
        activeAnimations[animName].play(true);
        currentAnimName = animName;
    }
}

// Input Handlers
function setupInputs() {
    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.W = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.A = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.S = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.D = true;
        if (e.code === 'Space') {
            keys.Space = true;
            triggerJump();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.W = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.A = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.S = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.D = false;
        if (e.code === 'Space') keys.Space = false;
    });
}

// Mobile & Desktop Virtual Touch Joystick
function setupMobileJoystick() {
    const dpadArea = document.getElementById('dpad-area');
    const dpadStick = document.getElementById('dpad-stick');
    const jumpBtn = document.getElementById('mobile-jump-btn');

    if (!dpadArea || !jumpBtn) return;

    let activePointerId = null;
    const radius = 45;

    function handleStart(clientX, clientY, pointerId) {
        activePointerId = pointerId;
        updateJoystickPosition(clientX, clientY);
    }

    function handleMove(clientX, clientY, pointerId) {
        if (activePointerId === pointerId) {
            updateJoystickPosition(clientX, clientY);
        }
    }

    function handleEnd(pointerId) {
        if (activePointerId === pointerId) {
            activePointerId = null;
            joystickInput = { x: 0, y: 0 };
            dpadStick.style.transform = `translate(0px, 0px)`;
        }
    }

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

    // Pointer Events for Touch + Mouse support!
    dpadArea.addEventListener('pointerdown', (e) => {
        dpadArea.setPointerCapture(e.pointerId);
        handleStart(e.clientX, e.clientY, e.pointerId);
    });

    dpadArea.addEventListener('pointermove', (e) => {
        if (activePointerId === e.pointerId) {
            handleMove(e.clientX, e.clientY, e.pointerId);
        }
    });

    dpadArea.addEventListener('pointerup', (e) => {
        if (activePointerId === e.pointerId) {
            dpadArea.releasePointerCapture(e.pointerId);
            handleEnd(e.pointerId);
        }
    });

    dpadArea.addEventListener('pointercancel', (e) => handleEnd(e.pointerId));

    // Jump button (Pointer + Touch + Mouse support)
    jumpBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        triggerJump();
    });
}

// Player Jump Action (Double Jump Support)
function triggerJump() {
    if (!gameState.isPlaying) return;

    if (gameState.isGrounded || coyoteTimer > 0) {
        // First Jump from ground
        gameState.velocityY = PHYSICS.jumpForce;
        gameState.isGrounded = false;
        gameState.isJumping = true;
        gameState.jumpCount = 1;
        coyoteTimer = 0;
        soundFX.play('jump', 0.7);
        spawnJumpDust(playerRoot.position);
    } else if (gameState.jumpCount < gameState.maxJumps) {
        // Second Jump (Air / Double Jump)
        gameState.velocityY = PHYSICS.jumpForce * 0.95;
        gameState.jumpCount += 1;
        soundFX.play('jump', 0.85);
        spawnDoubleJumpEffect(playerRoot.position);
        playAnimation('jump');
    }
}

// Double Jump Particle Burst FX
function spawnDoubleJumpEffect(pos) {
    const particleSystem = new BABYLON.ParticleSystem("doubleJumpRing", 35, scene);
    particleSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
    particleSystem.emitter = pos.clone().add(new BABYLON.Vector3(0, -0.2, 0));
    particleSystem.color1 = new BABYLON.Color4(0.2, 0.8, 1.0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.9, 0.4, 1.0, 0.8);
    particleSystem.minSize = 0.25;
    particleSystem.maxSize = 0.6;
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.4;
    particleSystem.emitRate = 250;
    particleSystem.targetStopDuration = 0.12;
    particleSystem.direction1 = new BABYLON.Vector3(-2, 0.5, -2);
    particleSystem.direction2 = new BABYLON.Vector3(2, 1.0, 2);
    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 4;
    particleSystem.start();
}

// Jump Dust Particle FX
function spawnJumpDust(pos) {
    const particleSystem = new BABYLON.ParticleSystem("dust", 20, scene);
    particleSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
    particleSystem.emitter = pos.clone().add(new BABYLON.Vector3(0, -0.4, 0));
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.3, 0, -0.3);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.3, 0, 0.3);
    particleSystem.color1 = new BABYLON.Color4(0.9, 0.9, 0.9, 0.6);
    particleSystem.color2 = new BABYLON.Color4(0.8, 0.8, 0.8, 0.1);
    particleSystem.minSize = 0.2;
    particleSystem.maxSize = 0.5;
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.4;
    particleSystem.emitRate = 100;
    particleSystem.targetStopDuration = 0.1;
    particleSystem.direction1 = new BABYLON.Vector3(-1, 0.5, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 2;
    particleSystem.start();
}

// Coin Pick Sparkle Particle FX
function spawnCoinSparkles(pos) {
    const particleSystem = new BABYLON.ParticleSystem("sparkles", 30, scene);
    particleSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
    particleSystem.emitter = pos;
    particleSystem.color1 = new BABYLON.Color4(1.0, 0.85, 0.2, 1.0);
    particleSystem.color2 = new BABYLON.Color4(1.0, 0.6, 0.1, 0.8);
    particleSystem.minSize = 0.15;
    particleSystem.maxSize = 0.4;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.6;
    particleSystem.emitRate = 150;
    particleSystem.targetStopDuration = 0.15;
    particleSystem.direction1 = new BABYLON.Vector3(-2, 2, -2);
    particleSystem.direction2 = new BABYLON.Vector3(2, 4, 2);
    particleSystem.start();
}

// Build Level Layouts
function buildLevel(levelNum) {
    clearLevel();

    if (levelNum === 1) {
        document.getElementById('level-title').innerText = "Level 1: Grassland Gateway";
        buildLevel1();
    } else {
        document.getElementById('level-title').innerText = "Level 2: Skyline Realm";
        buildLevel2();
    }

    playerRoot.position = new BABYLON.Vector3(0, 1.2, 0);
    gameState.velocityY = 0;
    gameState.isGrounded = true;
}

function clearLevel() {
    assets.coins.forEach(c => c.mesh.dispose());
    assets.coins = [];

    assets.questionBlocks.forEach(b => b.mesh.dispose());
    assets.questionBlocks = [];

    assets.brickBlocks.forEach(b => b.mesh.dispose());
    assets.brickBlocks = [];

    assets.movingPlatforms.forEach(p => p.mesh.dispose());
    assets.movingPlatforms = [];

    assets.fallingPlatforms.forEach(p => p.mesh.dispose());
    assets.fallingPlatforms = [];

    assets.clouds.forEach(c => c.dispose());
    assets.clouds = [];

    if (assets.finishFlag) {
        assets.finishFlag.dispose();
        assets.finishFlag = null;
    }

    // Clean up temporary level meshes
    scene.meshes.slice().forEach(m => {
        if (m.name.startsWith("lvl_")) m.dispose();
    });
}

// Level 1 Construction
function buildLevel1() {
    // Start Island
    createPlatform("platformLarge", new BABYLON.Vector3(0, 0, 0));
    createPlatform("platformMedium", new BABYLON.Vector3(0, 0, 8));

    // Coins on Start Island
    spawnCoin(new BABYLON.Vector3(-1.5, 1.5, 8));
    spawnCoin(new BABYLON.Vector3(0, 1.5, 8));
    spawnCoin(new BABYLON.Vector3(1.5, 1.5, 8));

    // Question & Brick Blocks
    spawnQuestionBlock(new BABYLON.Vector3(0, 3.5, 12));
    spawnBrickBlock(new BABYLON.Vector3(-2, 3.5, 12));
    spawnBrickBlock(new BABYLON.Vector3(2, 3.5, 12));

    // Moving Platform 1
    createMovingPlatform(new BABYLON.Vector3(0, 0.5, 18), new BABYLON.Vector3(0, 0, 6), 3.0);

    // Second Island
    createPlatform("platformLarge", new BABYLON.Vector3(0, 1.5, 30));
    spawnCoin(new BABYLON.Vector3(-2, 3.0, 30));
    spawnCoin(new BABYLON.Vector3(0, 3.0, 30));
    spawnCoin(new BABYLON.Vector3(2, 3.0, 30));

    // Stairway Platforms
    createPlatform("platformMedium", new BABYLON.Vector3(0, 3.5, 38));
    spawnCoin(new BABYLON.Vector3(0, 5.0, 38));

    createPlatform("platformMedium", new BABYLON.Vector3(0, 5.5, 46));
    spawnQuestionBlock(new BABYLON.Vector3(0, 8.8, 46));

    // Goal Island
    createPlatform("platformLarge", new BABYLON.Vector3(0, 7.5, 58));
    spawnFinishFlag(new BABYLON.Vector3(0, 9.0, 58));

    // Background Decorative Clouds
    spawnCloud(new BABYLON.Vector3(-15, 12, 10));
    spawnCloud(new BABYLON.Vector3(18, 15, 25));
    spawnCloud(new BABYLON.Vector3(-12, 18, 45));
}

// Level 2 Construction (Skyline Challenge)
function buildLevel2() {
    // Start Island
    createPlatform("platformMedium", new BABYLON.Vector3(0, 0, 0));

    // Falling Platforms
    createFallingPlatform(new BABYLON.Vector3(0, 0.5, 7));
    createFallingPlatform(new BABYLON.Vector3(0, 1.0, 14));
    spawnCoin(new BABYLON.Vector3(0, 2.5, 14));

    // Mid Island with Question Blocks
    createPlatform("platformLarge", new BABYLON.Vector3(0, 2.0, 24));
    spawnQuestionBlock(new BABYLON.Vector3(-1.5, 5.2, 24));
    spawnQuestionBlock(new BABYLON.Vector3(1.5, 5.2, 24));

    // Moving Platform (Side-to-Side)
    createMovingPlatform(new BABYLON.Vector3(0, 2.5, 33), new BABYLON.Vector3(6, 0, 0), 2.5);
    spawnCoin(new BABYLON.Vector3(-2, 4.0, 33));
    spawnCoin(new BABYLON.Vector3(2, 4.0, 33));

    // High Sky Platform
    createPlatform("platformMedium", new BABYLON.Vector3(0, 5.0, 44));
    createFallingPlatform(new BABYLON.Vector3(0, 6.0, 52));
    spawnCoin(new BABYLON.Vector3(0, 7.5, 52));

    // Final Flag Island
    createPlatform("platformLarge", new BABYLON.Vector3(0, 7.5, 64));
    spawnFinishFlag(new BABYLON.Vector3(0, 9.0, 64));

    // Clouds
    spawnCloud(new BABYLON.Vector3(-20, 10, 5));
    spawnCloud(new BABYLON.Vector3(22, 14, 30));
    spawnCloud(new BABYLON.Vector3(-16, 20, 50));
}

// Level Helpers with Procedural Fallbacks
function createPlatform(type, position) {
    const container = assets.containers[type];
    if (container) {
        const entries = container.instantiateModelsToScene(name => `lvl_${type}_${name}`);
        const root = entries.rootNodes[0];
        root.position = position;
        root.getChildMeshes().forEach(m => {
            m.isPlatform = true;
            m.isPickable = true;
            if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(m);
        });
        return;
    }

    // === PROCEDURAL PLATFORM FALLBACK ===
    let w = 4, h = 0.8, d = 4;
    if (type === 'platformLarge') { w = 7; h = 1.0; d = 7; }
    if (type === 'platformMedium') { w = 4.5; h = 0.8; d = 4.5; }
    if (type === 'platform') { w = 3.0; h = 0.6; d = 3.0; }

    const box = BABYLON.MeshBuilder.CreateBox(`lvl_proc_${type}`, { width: w, height: h, depth: d }, scene);
    box.position = position.clone();
    
    const mat = new BABYLON.StandardMaterial(`mat_${type}`, scene);
    mat.diffuseColor = new BABYLON.Color3(0.2, 0.65, 0.32);
    mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    box.material = mat;
    
    box.isPlatform = true;
    box.isPickable = true;
    if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(box);
}

function createMovingPlatform(startPos, deltaPos, speed) {
    const container = assets.containers["platformMedium"] || assets.containers["platformLarge"];
    if (container) {
        const entries = container.instantiateModelsToScene(name => `lvl_mov_${name}`);
        const root = entries.rootNodes[0];
        root.position = startPos.clone();
        root.getChildMeshes().forEach(m => {
            m.isPlatform = true;
            m.isPickable = true;
            if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(m);
        });

        assets.movingPlatforms.push({
            mesh: root,
            startPos: startPos.clone(),
            deltaPos: deltaPos.clone(),
            speed: speed,
            time: 0,
            lastPos: startPos.clone()
        });
        return;
    }

    // === PROCEDURAL MOVING PLATFORM FALLBACK ===
    const box = BABYLON.MeshBuilder.CreateBox(`lvl_proc_mov`, { width: 4.5, height: 0.8, depth: 4.5 }, scene);
    box.position = startPos.clone();
    const mat = new BABYLON.StandardMaterial("procMovMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.25, 0.6, 0.9);
    box.material = mat;
    box.isPlatform = true;
    box.isPickable = true;
    if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(box);

    assets.movingPlatforms.push({
        mesh: box,
        startPos: startPos.clone(),
        deltaPos: deltaPos.clone(),
        speed: speed,
        time: 0,
        lastPos: startPos.clone()
    });
}

function createFallingPlatform(position) {
    const container = assets.containers["platformFalling"] || assets.containers["platformMedium"];
    if (container) {
        const entries = container.instantiateModelsToScene(name => `lvl_fall_${name}`);
        const root = entries.rootNodes[0];
        root.position = position.clone();
        root.getChildMeshes().forEach(m => {
            m.isPlatform = true;
            m.isPickable = true;
            if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(m);
        });

        assets.fallingPlatforms.push({
            mesh: root,
            initialPos: position.clone(),
            state: 'idle',
            timer: 0
        });
        return;
    }

    // === PROCEDURAL FALLING PLATFORM FALLBACK ===
    const box = BABYLON.MeshBuilder.CreateBox(`lvl_proc_fall`, { width: 3.5, height: 0.7, depth: 3.5 }, scene);
    box.position = position.clone();
    const mat = new BABYLON.StandardMaterial("procFallMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.9, 0.5, 0.2);
    box.material = mat;
    box.isPlatform = true;
    box.isPickable = true;
    if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(box);

    assets.fallingPlatforms.push({
        mesh: box,
        initialPos: position.clone(),
        state: 'idle',
        timer: 0
    });
}

function spawnCoin(position) {
    const container = assets.containers["coin"];
    if (container) {
        const entries = container.instantiateModelsToScene(name => `lvl_coin_${name}`);
        const root = entries.rootNodes[0];
        root.position = position;
        root.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3);

        assets.coins.push({
            mesh: root,
            pos: position,
            collected: false
        });
        return;
    }

    // === PROCEDURAL COIN FALLBACK ===
    const coinDisc = BABYLON.MeshBuilder.CreateCylinder("procCoin", { diameter: 0.8, height: 0.15 }, scene);
    coinDisc.position = position.clone();
    coinDisc.rotation.x = Math.PI / 2;
    const mat = new BABYLON.StandardMaterial("procCoinMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.98, 0.75, 0.15);
    coinDisc.material = mat;

    assets.coins.push({
        mesh: coinDisc,
        pos: position,
        collected: false
    });
}

function spawnQuestionBlock(position) {
    const container = assets.containers["blockCoin"];
    if (container) {
        const entries = container.instantiateModelsToScene(name => `lvl_qblock_${name}`);
        const root = entries.rootNodes[0];
        root.position = position;
        root.getChildMeshes().forEach(m => {
            m.isPlatform = true;
            m.isPickable = true;
            if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(m);
        });

        assets.questionBlocks.push({
            mesh: root,
            initialPos: position.clone(),
            hit: false,
            animTimer: 0
        });
        return;
    }

    // === PROCEDURAL QUESTION BLOCK FALLBACK ===
    const box = BABYLON.MeshBuilder.CreateBox("procQBlock", { size: 1.2 }, scene);
    box.position = position.clone();
    const mat = new BABYLON.StandardMaterial("procQMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.95, 0.65, 0.1);
    box.material = mat;
    box.isPlatform = true;
    box.isPickable = true;
    if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(box);

    assets.questionBlocks.push({
        mesh: box,
        initialPos: position.clone(),
        hit: false,
        animTimer: 0
    });
}

function spawnBrickBlock(position) {
    const container = assets.containers["brick"];
    if (container) {
        const entries = container.instantiateModelsToScene(name => `lvl_brick_${name}`);
        const root = entries.rootNodes[0];
        root.position = position;
        root.getChildMeshes().forEach(m => {
            m.isPlatform = true;
            m.isPickable = true;
            if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(m);
        });

        assets.brickBlocks.push({
            mesh: root,
            destroyed: false
        });
        return;
    }

    // === PROCEDURAL BRICK BLOCK FALLBACK ===
    const box = BABYLON.MeshBuilder.CreateBox("procBrick", { size: 1.2 }, scene);
    box.position = position.clone();
    const mat = new BABYLON.StandardMaterial("procBrickMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.7, 0.3, 0.2);
    box.material = mat;
    box.isPlatform = true;
    box.isPickable = true;
    if (shadowGenerator) shadowGenerator.getShadowMap().renderList.push(box);

    assets.brickBlocks.push({
        mesh: box,
        destroyed: false
    });
}

function spawnFinishFlag(position) {
    const container = assets.containers["flag"];
    if (container) {
        const entries = container.instantiateModelsToScene(name => `lvl_flag_${name}`);
        const root = entries.rootNodes[0];
        root.position = position;
        root.scaling = new BABYLON.Vector3(1.4, 1.4, 1.4);
        assets.finishFlag = root;
        return;
    }

    // === PROCEDURAL FINISH FLAG FALLBACK ===
    const pole = BABYLON.MeshBuilder.CreateCylinder("procFlagPole", { diameter: 0.15, height: 3.5 }, scene);
    pole.position = position.clone().add(new BABYLON.Vector3(0, 1.75, 0));
    const poleMat = new BABYLON.StandardMaterial("poleMat", scene);
    poleMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    pole.material = poleMat;

    const flagBanner = BABYLON.MeshBuilder.CreateBox("procFlagBanner", { width: 1.2, height: 0.8, depth: 0.05 }, scene);
    flagBanner.position = position.clone().add(new BABYLON.Vector3(0.6, 3.0, 0));
    const flagMat = new BABYLON.StandardMaterial("flagMat", scene);
    flagMat.diffuseColor = new BABYLON.Color3(0.9, 0.2, 0.2);
    flagBanner.material = flagMat;

    const flagRoot = new BABYLON.TransformNode("procFlagRoot", scene);
    pole.parent = flagRoot;
    flagBanner.parent = flagRoot;
    flagRoot.position = position;
    assets.finishFlag = flagRoot;
}

function spawnCloud(position) {
    const container = assets.containers["cloud"];
    if (container) {
        const entries = container.instantiateModelsToScene(name => `lvl_cloud_${name}`);
        const root = entries.rootNodes[0];
        root.position = position;
        root.scaling = new BABYLON.Vector3(2.5, 2.5, 2.5);
        assets.clouds.push(root);
        return;
    }

    // === PROCEDURAL CLOUD FALLBACK ===
    const cloudBox = BABYLON.MeshBuilder.CreateSphere("procCloud", { diameterX: 5, diameterY: 2, diameterZ: 3 }, scene);
    cloudBox.position = position;
    const mat = new BABYLON.StandardMaterial("procCloudMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.9, 0.95, 1.0);
    mat.alpha = 0.85;
    cloudBox.material = mat;
    assets.clouds.push(cloudBox);
}

// Game Loop & Update System
function updateGameLoop(dt) {
    if (!gameState.isPlaying) return;

    // Update Timer
    gameState.elapsedTime = (Date.now() - gameState.startTime) / 1000;
    const mins = Math.floor(gameState.elapsedTime / 60).toString().padStart(2, '0');
    const secs = Math.floor(gameState.elapsedTime % 60).toString().padStart(2, '0');
    document.getElementById('timer-val').innerText = `${mins}:${secs}`;

    updatePlayerMovement(dt);
    updateMovingPlatforms(dt);
    updateFallingPlatforms(dt);
    updateInteractiveObjects(dt);
    updateCameraFollow();
    checkOutOfBounds();
}

// Player Movement & Physics Update
function updatePlayerMovement(dt) {
    // 1. Calculate Input Directions
    let inputX = joystickInput.x;
    let inputZ = -joystickInput.y;

    if (keys.A) inputX -= 1;
    if (keys.D) inputX += 1;
    if (keys.W) inputZ += 1;
    if (keys.S) inputZ -= 1;

    // Normalize input vector
    const inputMag = Math.sqrt(inputX * inputX + inputZ * inputZ);
    let normX = inputMag > 0 ? inputX / Math.max(1, inputMag) : 0;
    let normZ = inputMag > 0 ? inputZ / Math.max(1, inputMag) : 0;

    // 2. Camera-relative movement
    let cameraForward = camera.getForwardRay().direction;
    cameraForward.y = 0;
    if (cameraForward.lengthSquared() > 0.001) {
        cameraForward.normalize();
    } else {
        cameraForward = new BABYLON.Vector3(0, 0, 1);
    }

    const cameraRight = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), cameraForward).normalize();
    const moveVector = cameraRight.scale(normX).add(cameraForward.scale(normZ));

    // 3. Horizontal Movement
    const speed = PHYSICS.moveSpeed * (gameState.isGrounded ? 1.0 : PHYSICS.airControl);
    if (moveVector.lengthSquared() > 0.01) {
        playerRoot.position.x += moveVector.x * speed * dt;
        playerRoot.position.z += moveVector.z * speed * dt;

        // Smooth Character Face Rotation (Facing Movement Direction)
        const targetAngle = Math.atan2(moveVector.x, moveVector.z) + Math.PI;
        let currentAngle = playerRoot.rotation.y;
        let diff = targetAngle - currentAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        playerRoot.rotation.y += diff * Math.min(1.0, PHYSICS.rotationSpeed * dt);
    }

    // 4. Ground Collision Check (Swept Multi-ray for high stability and anti-tunneling)
    const fallSpeed = Math.max(0, -gameState.velocityY);
    const rayLength = Math.max(1.6, 0.8 + fallSpeed * dt * 2.5);

    const rayOrigins = [
        playerRoot.position.add(new BABYLON.Vector3(0, 0.5, 0)),
        playerRoot.position.add(new BABYLON.Vector3(0.3, 0.5, 0)),
        playerRoot.position.add(new BABYLON.Vector3(-0.3, 0.5, 0)),
        playerRoot.position.add(new BABYLON.Vector3(0, 0.5, 0.3)),
        playerRoot.position.add(new BABYLON.Vector3(0, 0.5, -0.3)),
        playerRoot.position.add(new BABYLON.Vector3(0.2, 0.5, 0.2)),
        playerRoot.position.add(new BABYLON.Vector3(-0.2, 0.5, -0.2))
    ];

    const predicate = (mesh) => {
        return (mesh.isPlatform || mesh.name.startsWith("lvl_")) &&
               !mesh.name.includes("coin") &&
               !mesh.name.includes("flag") &&
               !mesh.name.includes("cloud");
    };

    let groundHit = null;
    let highestGroundY = -Infinity;

    // Downward Raycast
    for (const origin of rayOrigins) {
        const ray = new BABYLON.Ray(origin, new BABYLON.Vector3(0, -1, 0), rayLength);
        const hit = scene.pickWithRay(ray, predicate);
        if (hit.hit && hit.pickedPoint.y > highestGroundY) {
            groundHit = hit;
            highestGroundY = hit.pickedPoint.y;
        }
    }

    // Upward recovery raycast (In case character slightly penetrated platform during lag spike)
    if (!groundHit && gameState.velocityY <= 0) {
        for (const origin of rayOrigins) {
            const upRay = new BABYLON.Ray(origin.add(new BABYLON.Vector3(0, -0.6, 0)), new BABYLON.Vector3(0, 1, 0), 1.4);
            const hit = scene.pickWithRay(upRay, predicate);
            if (hit.hit && hit.pickedPoint.y > highestGroundY) {
                groundHit = hit;
                highestGroundY = hit.pickedPoint.y;
            }
        }
    }

    const prevGrounded = gameState.isGrounded;

    if (groundHit && gameState.velocityY <= 0) {
        playerRoot.position.y = highestGroundY + 0.5;
        gameState.velocityY = 0;
        gameState.isGrounded = true;
        gameState.isJumping = false;
        gameState.jumpCount = 0;
        coyoteTimer = PHYSICS.coyoteTimeMax;

        if (!prevGrounded) {
            soundFX.play('land', 0.4);
            spawnJumpDust(playerRoot.position);
        }
    } else {
        gameState.isGrounded = false;
        if (coyoteTimer > 0) coyoteTimer -= dt;

        // Apply Gravity only when airborne
        gameState.velocityY += PHYSICS.gravity * dt;
        playerRoot.position.y += gameState.velocityY * dt;
    }

    // 6. Character Animation State
    if (!gameState.isGrounded) {
        if (gameState.velocityY > 0) playAnimation('jump');
        else playAnimation('fall');
    } else {
        if (moveVector.lengthSquared() > 0.05) playAnimation('walk');
        else playAnimation('idle');
    }
}

// Moving Platforms Logic
function updateMovingPlatforms(dt) {
    assets.movingPlatforms.forEach(p => {
        p.time += dt * p.speed;
        const factor = (Math.sin(p.time) + 1) / 2;
        
        const newPos = p.startPos.add(p.deltaPos.scale(factor));
        const delta = newPos.subtract(p.mesh.position);
        
        p.mesh.position.copyFrom(newPos);

        // Carry player if standing on top
        if (gameState.isGrounded) {
            const playerFeet = playerRoot.position.y - 0.5;
            const platformTop = newPos.y + 0.3;
            const distXZ = BABYLON.Vector2.Distance(
                new BABYLON.Vector2(playerRoot.position.x, playerRoot.position.z),
                new BABYLON.Vector2(newPos.x, newPos.z)
            );
            if (Math.abs(playerFeet - platformTop) < 0.3 && distXZ < 2.5) {
                playerRoot.position.addInPlace(delta);
            }
        }
    });
}

// Falling Platforms Logic
function updateFallingPlatforms(dt) {
    assets.fallingPlatforms.forEach(p => {
        if (p.state === 'idle' && gameState.isGrounded) {
            const distXZ = BABYLON.Vector2.Distance(
                new BABYLON.Vector2(playerRoot.position.x, playerRoot.position.z),
                new BABYLON.Vector2(p.mesh.position.x, p.mesh.position.z)
            );
            if (distXZ < 1.8) {
                p.state = 'shaking';
                p.timer = 0.4;
            }
        } else if (p.state === 'shaking') {
            p.timer -= dt;
            p.mesh.position.x = p.initialPos.x + (Math.random() - 0.5) * 0.1;
            if (p.timer <= 0) {
                p.state = 'falling';
                p.timer = 3.0;
            }
        } else if (p.state === 'falling') {
            p.mesh.position.y -= 15 * dt;
            p.timer -= dt;
            if (p.timer <= 0) {
                p.state = 'respawning';
                p.mesh.position.copyFrom(p.initialPos);
                p.mesh.setEnabled(true);
                p.state = 'idle';
            }
        }
    });
}

// Interactive Objects (Coins, Question Blocks, Flag)
function updateInteractiveObjects(dt) {
    // 1. Coins Rotation & Pickup
    assets.coins.forEach(c => {
        if (c.collected) return;

        c.mesh.rotation.y += 3.0 * dt;

        const dist = BABYLON.Vector3.Distance(playerRoot.position, c.mesh.position);
        if (dist < 1.5) {
            c.collected = true;
            c.mesh.dispose();
            gameState.coins += 1;
            gameState.score += 100;
            soundFX.play('coin', 0.8);
            spawnCoinSparkles(c.mesh.position);
            updateHUD();
        }
    });

    // 2. Question Blocks Collision (Hit from below)
    assets.questionBlocks.forEach(b => {
        if (b.hit) return;
        const distXZ = BABYLON.Vector2.Distance(
            new BABYLON.Vector2(playerRoot.position.x, playerRoot.position.z),
            new BABYLON.Vector2(b.mesh.position.x, b.mesh.position.z)
        );
        const distY = playerRoot.position.y - b.mesh.position.y;

        if (distXZ < 1.4 && distY > -1.2 && distY < -0.2 && gameState.velocityY > 0) {
            b.hit = true;
            gameState.coins += 1;
            gameState.score += 500;
            soundFX.play('coin', 0.9);
            spawnCoinSparkles(b.mesh.position.add(new BABYLON.Vector3(0, 1.2, 0)));
            updateHUD();

            // Block Bump Animation
            b.mesh.position.y += 0.4;
            setTimeout(() => {
                if (b.mesh) b.mesh.position.y = b.initialPos.y;
            }, 120);
        }
    });

    // 3. Brick Blocks Collision
    assets.brickBlocks.forEach(b => {
        if (b.destroyed) return;
        const distXZ = BABYLON.Vector2.Distance(
            new BABYLON.Vector2(playerRoot.position.x, playerRoot.position.z),
            new BABYLON.Vector2(b.mesh.position.x, b.mesh.position.z)
        );
        const distY = playerRoot.position.y - b.mesh.position.y;

        if (distXZ < 1.4 && distY > -1.2 && distY < -0.2 && gameState.velocityY > 0) {
            b.destroyed = true;
            soundFX.play('break', 0.9);
            b.mesh.dispose();
            gameState.score += 200;
            updateHUD();
        }
    });

    // 4. Finish Flag Reach Check
    if (assets.finishFlag) {
        const dist = BABYLON.Vector3.Distance(playerRoot.position, assets.finishFlag.position);
        if (dist < 2.0) {
            triggerVictory();
        }
    }

    // 5. Cloud Slow Rotation
    assets.clouds.forEach(c => {
        c.rotation.y += 0.05 * dt;
    });
}

// Camera Tracking
function updateCameraFollow() {
    camera.target = BABYLON.Vector3.Lerp(camera.target, playerRoot.position.add(new BABYLON.Vector3(0, 1.5, 0)), 0.1);
}

// Fall Out of Bounds Check
function checkOutOfBounds() {
    if (playerRoot.position.y < -12) {
        soundFX.play('fall', 0.8);
        gameState.lives -= 1;
        updateHUD();

        if (gameState.lives > 0) {
            playerRoot.position = new BABYLON.Vector3(0, 1.2, 0);
            gameState.velocityY = 0;
            gameState.isGrounded = true;
        } else {
            triggerGameOver();
        }
    }
}

// Update UI HUD Text
function updateHUD() {
    document.getElementById('coins-val').innerText = gameState.coins;
    document.getElementById('score-val').innerText = gameState.score;
    document.getElementById('lives-val').innerText = gameState.lives;
}

// Game Controls Setup
function startGame() {
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    updateHUD();
    showAssetStatusPopup(gameState.isFallbackMode);
}

function showAssetStatusPopup(isFallback) {
    const hud = document.getElementById('hud');
    if (!hud) return;

    const oldPopup = document.getElementById('asset-status-popup');
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'asset-status-popup';
    popup.style.position = 'absolute';
    popup.style.top = '4.5rem';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.padding = '0.5rem 1.1rem';
    popup.style.borderRadius = '999px';
    popup.style.fontSize = '0.8rem';
    popup.style.fontWeight = '700';
    popup.style.zIndex = '100';
    popup.style.backdropFilter = 'blur(12px)';
    popup.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
    popup.style.pointerEvents = 'none';
    popup.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    popup.style.whiteSpace = 'nowrap';

    if (isFallback) {
        popup.style.background = 'rgba(239, 68, 68, 0.88)';
        popup.style.border = '1px solid rgba(248, 113, 113, 0.6)';
        popup.style.color = '#ffffff';
        popup.innerHTML = '⚙️ Output: Procedural 3D Geometry Fallback Mode';
    } else {
        popup.style.background = 'rgba(16, 185, 129, 0.88)';
        popup.style.border = '1px solid rgba(52, 211, 153, 0.6)';
        popup.style.color = '#ffffff';
        popup.innerHTML = '🎉 Output: Real Kenney 3D Models Loaded';
    }

    hud.appendChild(popup);

    setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => popup.remove(), 600);
    }, 4500);
}

function triggerVictory() {
    gameState.isPlaying = false;
    document.getElementById('victory-coins').innerText = gameState.coins;
    document.getElementById('victory-score').innerText = gameState.score;
    document.getElementById('victory-modal').classList.add('active');
}

function triggerGameOver() {
    gameState.isPlaying = false;
    document.getElementById('gameover-coins').innerText = gameState.coins;
    document.getElementById('gameover-score').innerText = gameState.score;
    document.getElementById('gameover-modal').classList.add('active');
}

function restartLevel() {
    document.getElementById('victory-modal').classList.remove('active');
    document.getElementById('gameover-modal').classList.remove('active');

    gameState.lives = 3;
    gameState.coins = 0;
    gameState.score = 0;
    buildLevel(gameState.level);
    startGame();
}

function nextLevel() {
    document.getElementById('victory-modal').classList.remove('active');
    gameState.level = gameState.level === 1 ? 2 : 1;
    gameState.lives = 3;
    buildLevel(gameState.level);
    startGame();
}
