const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.35;
const BASE_EXPLOSION_RADIUS = 50;
const ENEMY_RADIUS = 20;
const TERRAIN_SEGMENTS = 90;
const SEGMENT_WIDTH = CANVAS_WIDTH / TERRAIN_SEGMENTS;

const SHELL_TYPES = {
    normal: { name: '普通弹', icon: '💣', damage: 1, radius: 1, color: '#ffd700', unlimited: true, desc: '基础炮弹，可靠耐用' },
    split: { name: '分裂弹', icon: '💥', damage: 0.7, radius: 0.8, color: '#ab47bc', splitCount: 3, desc: '爆炸后分裂成3枚小弹' },
    incendiary: { name: '燃烧弹', icon: '🔥', damage: 0.8, radius: 1.2, color: '#ef5350', burnDamage: 0.5, burnDuration: 5, desc: '持续燃烧造成伤害' },
    freeze: { name: '冰冻弹', icon: '❄️', damage: 0.6, radius: 1, color: '#29b6f6', freezeDuration: 8, desc: '冻结敌人使其无法行动' },
    buster: { name: '钻地弹', icon: '⛏️', damage: 1.5, radius: 0.6, color: '#8d6e63', penetrateDepth: 60, desc: '穿透地形深层爆炸' }
};

const ENEMY_TYPES = {
    soldier: { name: '步兵', health: 1, defense: 0, radius: 15, score: 100, coins: 10, speed: 0 },
    tank: { name: '坦克', health: 3, defense: 1, radius: 25, score: 250, coins: 25, speed: 0.3 },
    helicopter: { name: '直升机', health: 2, defense: 0, radius: 20, score: 200, coins: 20, speed: 0.8, flying: true },
    bunker: { name: '碉堡', health: 5, defense: 2, radius: 30, score: 400, coins: 40, speed: 0 }
};

const CHAPTERS = [
    {
        id: 1,
        name: '丛林战',
        icon: '🌴',
        desc: '湿热丛林，地形复杂',
        skyGradient: ['#87ceeb', '#b8e6f9', '#98d8c8'],
        terrainColors: ['#7cb342', '#689f38', '#558b2f', '#33691e'],
        terrainRoughness: 1.2,
        weatherTypes: ['sunny', 'rainy'],
        unlocked: true,
        levels: 5
    },
    {
        id: 2,
        name: '城市战',
        icon: '🏙️',
        desc: '废墟城市，掩体众多',
        skyGradient: ['#90a4ae', '#b0bec5', '#cfd8dc'],
        terrainColors: ['#78909c', '#607d8b', '#546e7a', '#37474f'],
        terrainRoughness: 1.5,
        weatherTypes: ['sunny', 'cloudy', 'rainy'],
        unlocked: false,
        levels: 5
    },
    {
        id: 3,
        name: '沙漠战',
        icon: '🏜️',
        desc: '炎热沙漠，视线开阔',
        skyGradient: ['#ffcc80', '#ffe0b2', '#ffab91'],
        terrainColors: ['#ffb74d', '#ffa726', '#fb8c00', '#ef6c00'],
        terrainRoughness: 0.8,
        weatherTypes: ['sunny', 'windy', 'sandstorm'],
        unlocked: false,
        levels: 5
    },
    {
        id: 4,
        name: '太空战',
        icon: '🚀',
        desc: '失重太空，引力减半',
        skyGradient: ['#1a1a2e', '#16213e', '#0f3460'],
        terrainColors: ['#7e57c2', '#5e35b1', '#4527a0', '#311b92'],
        terrainRoughness: 1.0,
        weatherTypes: ['space', 'meteor'],
        gravity: 0.5,
        unlocked: false,
        levels: 5
    }
];

const WEATHER_TYPES = {
    sunny: { name: '晴', icon: '☀️', windModifier: 1, explosionModifier: 1, gravityModifier: 1 },
    cloudy: { name: '多云', icon: '⛅', windModifier: 1.2, explosionModifier: 1, gravityModifier: 1 },
    rainy: { name: '雨', icon: '🌧️', windModifier: 0.8, explosionModifier: 0.7, gravityModifier: 1.1 },
    windy: { name: '大风', icon: '💨', windModifier: 2, explosionModifier: 0.9, gravityModifier: 1 },
    sandstorm: { name: '沙尘暴', icon: '🌪️', windModifier: 2.5, explosionModifier: 0.6, gravityModifier: 1.2 },
    space: { name: '真空', icon: '🌌', windModifier: 0, explosionModifier: 1.2, gravityModifier: 0.5 },
    meteor: { name: '陨石雨', icon: '☄️', windModifier: 0.5, explosionModifier: 1.3, gravityModifier: 0.5 }
};

const UPGRADES = {
    range: { name: '射程', icon: '📏', desc: '增加炮弹初始速度', baseCost: 100, costMultiplier: 1.5, maxLevel: 5, effect: 0.1 },
    power: { name: '威力', icon: '💥', desc: '增加爆炸伤害和范围', baseCost: 150, costMultiplier: 1.6, maxLevel: 5, effect: 0.15 },
    capacity: { name: '弹药容量', icon: '🎒', desc: '增加特殊炮弹数量', baseCost: 120, costMultiplier: 1.4, maxLevel: 5, effect: 1 },
    accuracy: { name: '精准度', icon: '🎯', desc: '减少风力影响', baseCost: 200, costMultiplier: 1.8, maxLevel: 3, effect: 0.2 }
};

const gameState = {
    mode: null,
    currentChapter: 1,
    currentLevel: 1,
    score: 0,
    coins: 0,
    angle: 45,
    power: 50,
    isPlaying: false,
    isFiring: false,
    hasFired: false,
    selectedShell: 'normal',
    shellInventory: { normal: Infinity, split: 3, incendiary: 3, freeze: 3, buster: 2 },
    upgrades: { range: 0, power: 0, capacity: 0, accuracy: 0 },
    cannon: { x: 80, y: 0, health: 5, maxHealth: 5 },
    cannon2: { x: 820, y: 0, health: 5, maxHealth: 5 },
    currentPlayer: 1,
    enemies: [],
    terrain: [],
    projectiles: [],
    explosions: [],
    particles: [],
    burnEffects: [],
    freezeEffects: [],
    wind: { speed: 0, direction: 1 },
    weather: 'sunny',
    showTrajectory: true,
    chapterProgress: { 1: 0, 2: 0, 3: 0, 4: 0 }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const angleSlider = document.getElementById('angleSlider');
const powerSlider = document.getElementById('powerSlider');
const angleValue = document.getElementById('angleValue');
const powerValue = document.getElementById('powerValue');
const fireBtn = document.getElementById('fireBtn');
const resetBtn = document.getElementById('resetBtn');
const upgradeBtn = document.getElementById('upgradeBtn');
const chapterBtn = document.getElementById('chapterBtn');
const levelDisplay = document.getElementById('level');
const scoreDisplay = document.getElementById('score');
const coinsDisplay = document.getElementById('coins');
const ammoDisplay = document.getElementById('ammo');
const windDisplay = document.getElementById('wind');
const weatherDisplay = document.getElementById('weather');
const chapterDisplay = document.getElementById('chapter');
const trajectoryHint = document.getElementById('trajectoryHint');
const pvpIndicator = document.getElementById('pvpIndicator');
const pvpP1 = document.getElementById('pvpP1');
const pvpP2 = document.getElementById('pvpP2');

const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const startModalOverlay = document.getElementById('startModalOverlay');
const chapterModalOverlay = document.getElementById('chapterModalOverlay');
const upgradeModalOverlay = document.getElementById('upgradeModalOverlay');
const chapterSelect = document.getElementById('chapterSelect');
const upgradeShop = document.getElementById('upgradeShop');
const upgradeCoins = document.getElementById('upgradeCoins');

function generateTerrain(chapterId, levelId) {
    const terrain = [];
    const chapter = CHAPTERS[chapterId - 1];
    const baseY = 420;
    const roughness = chapter.terrainRoughness;
    
    terrain.push({ x: 0, y: baseY });
    
    for (let i = 1; i <= TERRAIN_SEGMENTS; i++) {
        const x = i * SEGMENT_WIDTH;
        let y = baseY;
        
        if (x > 150 && x < CANVAS_WIDTH - 150) {
            const variation = (Math.sin(i * 0.3 * roughness + levelId) * 35 + 
                             Math.sin(i * 0.5 * roughness + levelId * 1.5) * 20 +
                             Math.sin(i * 0.7 * roughness + chapterId) * 15) * roughness;
            y = baseY - 20 - Math.abs(variation);
            
            if (chapterId === 2 && i % 8 === 0) {
                y -= 30;
            }
            if (chapterId === 4 && i % 10 === 0) {
                y += 15;
            }
        }
        
        terrain.push({ x, y: Math.max(180, Math.min(baseY, y)) });
    }
    
    return terrain;
}

function generateEnemies(chapterId, levelId) {
    const enemies = [];
    const baseX = 500 + Math.random() * 50;
    const spacing = 80 + Math.random() * 40;
    const enemyCount = Math.min(3 + levelId, 6);
    
    const availableTypes = chapterId === 1 
        ? ['soldier', 'soldier', 'tank']
        : chapterId === 2
        ? ['soldier', 'tank', 'bunker']
        : chapterId === 3
        ? ['soldier', 'tank', 'helicopter']
        : ['soldier', 'tank', 'helicopter', 'bunker'];
    
    for (let i = 0; i < enemyCount; i++) {
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const enemyDef = ENEMY_TYPES[type];
        const x = baseX + i * spacing + Math.random() * 20;
        const terrainY = getTerrainY(x);
        
        enemies.push({
            type,
            x,
            y: enemyDef.flying ? terrainY - 120 : terrainY - (type === 'tank' ? 25 : type === 'bunker' ? 35 : 30),
            health: enemyDef.health + Math.floor(levelId / 3),
            maxHealth: enemyDef.health + Math.floor(levelId / 3),
            defense: enemyDef.defense,
            radius: enemyDef.radius,
            alive: true,
            burning: 0,
            frozen: 0,
            moveDirection: Math.random() > 0.5 ? 1 : -1,
            baseY: enemyDef.flying ? terrainY - 120 : terrainY - (type === 'tank' ? 25 : type === 'bunker' ? 35 : 30)
        });
    }
    
    return enemies;
}

function getTerrainY(x) {
    const terrain = gameState.terrain;
    for (let i = 0; i < terrain.length - 1; i++) {
        if (x >= terrain[i].x && x <= terrain[i + 1].x) {
            const t = (x - terrain[i].x) / (terrain[i + 1].x - terrain[i].x);
            return terrain[i].y + t * (terrain[i + 1].y - terrain[i].y);
        }
    }
    return 420;
}

function getWindModifier() {
    const weather = WEATHER_TYPES[gameState.weather];
    const accuracyReduction = 1 - (gameState.upgrades.accuracy * UPGRADES.accuracy.effect);
    return gameState.wind.speed * gameState.wind.direction * weather.windModifier * 0.02 * accuracyReduction;
}

function getGravity() {
    const chapter = CHAPTERS[gameState.currentChapter - 1];
    const weather = WEATHER_TYPES[gameState.weather];
    return GRAVITY * (chapter.gravity || 1) * weather.gravityModifier;
}

function getExplosionRadius(baseType) {
    const shell = SHELL_TYPES[baseType];
    const weather = WEATHER_TYPES[gameState.weather];
    const powerBonus = 1 + (gameState.upgrades.power * UPGRADES.power.effect);
    return BASE_EXPLOSION_RADIUS * shell.radius * weather.explosionModifier * powerBonus;
}

function getShellDamage(baseType) {
    const shell = SHELL_TYPES[baseType];
    const powerBonus = 1 + (gameState.upgrades.power * UPGRADES.power.effect);
    return shell.damage * powerBonus;
}

function getInitialPower() {
    const rangeBonus = 1 + (gameState.upgrades.range * UPGRADES.range.effect);
    return gameState.power * 0.15 * rangeBonus;
}

function generateWind() {
    const weather = WEATHER_TYPES[gameState.weather];
    const maxWind = 8 * weather.windModifier;
    gameState.wind.speed = Math.random() * maxWind;
    gameState.wind.direction = Math.random() > 0.5 ? 1 : -1;
}

function generateWeather(chapterId) {
    const chapter = CHAPTERS[chapterId - 1];
    const weatherIndex = Math.floor(Math.random() * chapter.weatherTypes.length);
    gameState.weather = chapter.weatherTypes[weatherIndex];
}

function initGame(mode) {
    gameState.mode = mode;
    gameState.currentChapter = 1;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.upgrades = { range: 0, power: 0, capacity: 0, accuracy: 0 };
    gameState.chapterProgress = { 1: 0, 2: 0, 3: 0, 4: 0 };
    resetShellInventory();
    
    if (mode === 'campaign') {
        startModalOverlay.style.display = 'none';
        pvpIndicator.style.display = 'none';
        initLevel();
        showTrajectoryHint();
    } else if (mode === 'pvp') {
        startModalOverlay.style.display = 'none';
        pvpIndicator.style.display = 'flex';
        initPVP();
    }
    
    gameLoop();
}

function resetShellInventory() {
    const capacityBonus = gameState.upgrades.capacity * UPGRADES.capacity.effect;
    gameState.shellInventory = {
        normal: Infinity,
        split: 3 + capacityBonus,
        incendiary: 3 + capacityBonus,
        freeze: 3 + capacityBonus,
        buster: 2 + capacityBonus
    };
}

function initLevel() {
    generateWeather(gameState.currentChapter);
    generateWind();
    
    gameState.angle = 45;
    gameState.power = 50;
    gameState.isPlaying = true;
    gameState.isFiring = false;
    gameState.hasFired = false;
    gameState.selectedShell = 'normal';
    gameState.terrain = generateTerrain(gameState.currentChapter, gameState.currentLevel);
    gameState.enemies = generateEnemies(gameState.currentChapter, gameState.currentLevel);
    gameState.projectiles = [];
    gameState.explosions = [];
    gameState.particles = [];
    gameState.burnEffects = [];
    gameState.freezeEffects = [];
    
    const cannonBaseY = getTerrainY(gameState.cannon.x);
    gameState.cannon.y = cannonBaseY;
    gameState.cannon.health = 5;
    gameState.cannon.maxHealth = 5;
    
    angleSlider.value = 45;
    powerSlider.value = 50;
    updateUI();
    updateShellButtons();
}

function initPVP() {
    gameState.currentChapter = 1;
    gameState.weather = 'sunny';
    gameState.wind = { speed: 2 + Math.random() * 3, direction: Math.random() > 0.5 ? 1 : -1 };
    
    gameState.angle = 45;
    gameState.power = 50;
    gameState.isPlaying = true;
    gameState.isFiring = false;
    gameState.hasFired = false;
    gameState.selectedShell = 'normal';
    gameState.currentPlayer = 1;
    gameState.terrain = generateTerrain(1, 1);
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.explosions = [];
    gameState.particles = [];
    gameState.burnEffects = [];
    gameState.freezeEffects = [];
    
    const cannon1Y = getTerrainY(gameState.cannon.x);
    const cannon2Y = getTerrainY(gameState.cannon2.x);
    gameState.cannon.y = cannon1Y;
    gameState.cannon.health = 5;
    gameState.cannon.maxHealth = 5;
    gameState.cannon2.y = cannon2Y;
    gameState.cannon2.health = 5;
    gameState.cannon2.maxHealth = 5;
    
    angleSlider.value = 45;
    powerSlider.value = 50;
    updatePVPUI();
    updateShellButtons();
}

function updateUI() {
    angleValue.textContent = `${gameState.angle}°`;
    powerValue.textContent = `${gameState.power}%`;
    levelDisplay.textContent = `${gameState.currentLevel}`;
    scoreDisplay.textContent = gameState.score;
    coinsDisplay.textContent = `💰 ${gameState.coins}`;
    chapterDisplay.textContent = CHAPTERS[gameState.currentChapter - 1].name;
    
    const weather = WEATHER_TYPES[gameState.weather];
    weatherDisplay.textContent = `${weather.icon} ${weather.name}`;
    
    const windArrow = gameState.wind.direction > 0 ? '→' : '←';
    windDisplay.textContent = `${windArrow} ${Math.round(gameState.wind.speed)}`;
    windDisplay.className = 'info-value wind-value';
    if (gameState.wind.direction > 0) {
        windDisplay.classList.add('tailwind');
    } else if (gameState.wind.direction < 0) {
        windDisplay.classList.add('headwind');
    }
    
    let ammoHTML = '';
    const totalShells = Object.values(gameState.shellInventory).reduce((sum, count) => sum + (count === Infinity ? 0 : count), 0);
    const displayCount = Math.min(totalShells, 10);
    for (let i = 0; i < displayCount; i++) {
        ammoHTML += `<span>💣</span>`;
    }
    if (totalShells > 10) {
        ammoHTML += `<span style="font-size:12px;">+${totalShells - 10}</span>`;
    }
    ammoDisplay.innerHTML = ammoHTML;
    
    fireBtn.disabled = gameState.isFiring || !gameState.isPlaying || 
                      (gameState.shellInventory[gameState.selectedShell] <= 0 && 
                       gameState.shellInventory[gameState.selectedShell] !== Infinity);
    
    updatePVPUI();
}

function updatePVPUI() {
    if (gameState.mode === 'pvp') {
        pvpP1.classList.toggle('active', gameState.currentPlayer === 1);
        pvpP2.classList.toggle('active', gameState.currentPlayer === 2);
        
        if (gameState.currentPlayer === 2) {
            angleSlider.style.direction = 'rtl';
        } else {
            angleSlider.style.direction = 'ltr';
        }
    }
}

function updateShellButtons() {
    document.querySelectorAll('.shell-btn').forEach(btn => {
        const shellType = btn.dataset.shell;
        const count = gameState.shellInventory[shellType];
        const countEl = document.getElementById(`count-${shellType}`);
        
        if (countEl) {
            countEl.textContent = count === Infinity ? '∞' : count;
        }
        
        btn.classList.toggle('selected', shellType === gameState.selectedShell);
        btn.disabled = count <= 0 && count !== Infinity;
    });
}

function showTrajectoryHint() {
    trajectoryHint.style.display = 'flex';
    setTimeout(() => {
        trajectoryHint.style.display = 'none';
    }, 4000);
}

function drawSky() {
    const chapter = CHAPTERS[gameState.currentChapter - 1];
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    const colors = chapter.skyGradient;
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.6, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (gameState.weather === 'sunny' || gameState.weather === 'cloudy') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        drawCloud(150, 60, 50);
        drawCloud(400, 40, 40);
        drawCloud(650, 80, 55);
    }
    
    if (gameState.weather === 'sunny') {
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(820, 70, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(820, 70, 28, 0, Math.PI * 2);
        ctx.fill();
    } else if (gameState.weather === 'space' || gameState.weather === 'meteor') {
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % CANVAS_WIDTH;
            const y = (i * 47) % (CANVAS_HEIGHT - 100);
            const size = (i % 3) + 1;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (i % 5) * 0.15})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    if (gameState.weather === 'rainy') {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 30; i++) {
            const x = (Date.now() / 10 + i * 37) % CANVAS_WIDTH;
            const y = (Date.now() / 5 + i * 53) % CANVAS_HEIGHT;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 3, y + 15);
            ctx.stroke();
        }
    }
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
}

function drawTerrain() {
    const chapter = CHAPTERS[gameState.currentChapter - 1];
    const terrain = gameState.terrain;
    const colors = chapter.terrainColors;
    
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    ctx.lineTo(terrain[0].x, terrain[0].y);
    
    for (let i = 1; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 300, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.3, colors[1]);
    gradient.addColorStop(0.7, colors[2]);
    gradient.addColorStop(1, colors[3]);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = colors[3];
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    for (let i = 1; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    ctx.stroke();
}

function drawCannon(cannon, isPlayer2 = false) {
    const { x, y } = cannon;
    const angle = isPlayer2 ? 180 - gameState.angle : gameState.angle;
    const angleRad = (angle * Math.PI) / 180;
    
    ctx.save();
    ctx.translate(x, y - 25);
    
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.ellipse(0, 20, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#6d4c41';
    ctx.beginPath();
    ctx.ellipse(0, 15, 35, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const bodyColor = isPlayer2 ? '#c62828' : '#424242';
    const bodyHighlight = isPlayer2 ? '#e53935' : '#616161';
    
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = bodyHighlight;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.save();
    ctx.rotate(-angleRad);
    
    const barrelGradient = ctx.createLinearGradient(0, -12, 0, 12);
    barrelGradient.addColorStop(0, '#757575');
    barrelGradient.addColorStop(0.5, bodyColor);
    barrelGradient.addColorStop(1, '#212121');
    
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(0, -12, 70, 24);
    
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(70, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.arc(70, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    if (gameState.mode === 'pvp') {
        const healthPercent = cannon.health / cannon.maxHealth;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-30, -45, 60, 8);
        ctx.fillStyle = healthPercent > 0.5 ? '#4caf50' : healthPercent > 0.25 ? '#ff9800' : '#f44336';
        ctx.fillRect(-30, -45, 60 * healthPercent, 8);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-30, -45, 60, 8);
    }
    
    ctx.restore();
}

function drawEnemies() {
    gameState.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        ctx.save();
        
        if (enemy.frozen > 0) {
            ctx.globalAlpha = 0.8;
            ctx.filter = 'hue-rotate(180deg) brightness(1.2)';
        } else if (enemy.burning > 0) {
            ctx.globalAlpha = 0.9;
        }
        
        if (enemy.type === 'tank') {
            drawTank(enemy);
        } else if (enemy.type === 'helicopter') {
            drawHelicopter(enemy);
        } else if (enemy.type === 'bunker') {
            drawBunker(enemy);
        } else {
            drawSoldier(enemy);
        }
        
        ctx.restore();
        
        if (enemy.burning > 0) {
            drawBurnEffect(enemy);
        }
        if (enemy.frozen > 0) {
            drawFreezeEffect(enemy);
        }
        
        drawHealthBar(enemy);
    });
}

function drawSoldier(enemy) {
    const { x, y } = enemy;
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = '#4a5d23';
    ctx.beginPath();
    ctx.ellipse(0, 10, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, -10, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#4a5d23';
    ctx.beginPath();
    ctx.arc(0, -14, 8, Math.PI, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-8, -18, 16, 4);
    
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(-4, -10, 2, 0, Math.PI * 2);
    ctx.arc(4, -10, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(10, -5, 20, 4);
    
    ctx.fillStyle = '#4a5d23';
    ctx.fillRect(-10, 20, 6, 15);
    ctx.fillRect(4, 20, 6, 15);
    
    ctx.restore();
}

function drawTank(enemy) {
    const { x, y } = enemy;
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.ellipse(0, 20, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#212121';
    for (let i = -25; i <= 25; i += 10) {
        ctx.beginPath();
        ctx.arc(i, 20, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const gradient = ctx.createLinearGradient(-25, -10, -25, 20);
    gradient.addColorStop(0, '#689f38');
    gradient.addColorStop(1, '#33691e');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-25, -10, 50, 30);
    
    ctx.fillStyle = '#558b2f';
    ctx.beginPath();
    ctx.arc(0, -10, 15, 0, Math.PI * 2);
    ctx.fill();
    
    const turretAngle = Math.atan2(gameState.cannon.y - 25 - y, gameState.cannon.x - x);
    ctx.save();
    ctx.rotate(turretAngle);
    ctx.fillStyle = '#33691e';
    ctx.fillRect(0, -4, 35, 8);
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(35, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
}

function drawHelicopter(enemy) {
    const { x, y } = enemy;
    ctx.save();
    ctx.translate(x, y);
    
    const hoverOffset = Math.sin(Date.now() / 200) * 3;
    ctx.translate(0, hoverOffset);
    
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#37474f';
    ctx.fillRect(-30, -2, 15, 4);
    
    ctx.fillStyle = '#607d8b';
    ctx.beginPath();
    ctx.arc(20, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#81d4fa';
    ctx.beginPath();
    ctx.arc(20, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    
    const rotorAngle = Date.now() / 30;
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(rotorAngle);
    ctx.fillStyle = 'rgba(33, 33, 33, 0.6)';
    ctx.fillRect(-30, -1, 60, 2);
    ctx.restore();
    
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    ctx.moveTo(-20, 10);
    ctx.lineTo(-15, 15);
    ctx.lineTo(15, 15);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawBunker(enemy) {
    const { x, y } = enemy;
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(-30, 0, 60, 35);
    
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.lineTo(0, -20);
    ctx.lineTo(35, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-10, 5, 20, 15);
    
    ctx.fillStyle = '#212121';
    ctx.fillRect(8, 12, 25, 6);
    
    ctx.fillStyle = '#5d4037';
    for (let i = -25; i <= 25; i += 12) {
        ctx.fillRect(i - 3, -5, 6, 8);
    }
    
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(-32, 30, 64, 8);
    
    ctx.restore();
}

function drawHealthBar(enemy) {
    if (enemy.health >= enemy.maxHealth) return;
    
    const { x, y, radius } = enemy;
    const barWidth = radius * 2;
    const barHeight = 4;
    const barY = y - radius - 10;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);
    
    const healthPercent = enemy.health / enemy.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#4caf50' : healthPercent > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barWidth / 2, barY, barWidth, barHeight);
}

function drawBurnEffect(enemy) {
    const { x, y, radius } = enemy;
    
    for (let i = 0; i < 3; i++) {
        const flameX = x + (Math.random() - 0.5) * radius;
        const flameY = y - radius + Math.sin(Date.now() / 100 + i) * 5;
        const size = 8 + Math.random() * 6;
        
        const gradient = ctx.createRadialGradient(flameX, flameY, 0, flameX, flameY, size);
        gradient.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 152, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(244, 67, 54, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(flameX, flameY, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawFreezeEffect(enemy) {
    const { x, y, radius } = enemy;
    
    ctx.strokeStyle = 'rgba(41, 182, 246, 0.8)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Date.now() / 1000;
        const iceX = x + Math.cos(angle) * (radius + 5);
        const iceY = y + Math.sin(angle) * (radius + 5);
        
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
            const a = (j / 6) * Math.PI * 2;
            const r = j % 2 === 0 ? 6 : 3;
            const px = iceX + Math.cos(a) * r;
            const py = iceY + Math.sin(a) * r;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

function drawProjectiles() {
    gameState.projectiles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        
        const shellDef = SHELL_TYPES[p.type];
        
        const tailLength = 5;
        for (let i = 0; i < tailLength; i++) {
            const alpha = 1 - i / tailLength;
            const size = (p.type === 'buster' ? 10 : 8) - i * 1.2;
            ctx.fillStyle = `rgba(255, 152, 0, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(-p.vx * i * 0.5, -p.vy * i * 0.5, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.type === 'buster' ? 12 : 10);
        gradient.addColorStop(0, '#ffeb3b');
        gradient.addColorStop(0.5, shellDef.color);
        gradient.addColorStop(1, '#f44336');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, p.type === 'buster' ? 10 : 8, 0, Math.PI * 2);
        ctx.fill();
        
        if (p.type === 'freeze') {
            ctx.strokeStyle = 'rgba(41, 182, 246, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.type === 'incendiary') {
            ctx.shadowColor = '#ef5350';
            ctx.shadowBlur = 10;
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

function drawExplosions() {
    gameState.explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const currentRadius = exp.radius * Math.sin(progress * Math.PI);
        const alpha = 1 - progress;
        
        const shellDef = SHELL_TYPES[exp.type];
        
        const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, currentRadius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.2, `rgba(255, 235, 59, ${alpha})`);
        gradient.addColorStop(0.4, `${shellDef.color}${Math.floor(alpha * 230).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.7, `rgba(244, 67, 54, ${alpha * 0.7})`);
        gradient.addColorStop(1, `rgba(183, 28, 28, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 87, 34, ${alpha * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, currentRadius * 0.9, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function drawParticles() {
    gameState.particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = `rgba(${particle.color}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawTrajectory() {
    if (!gameState.showTrajectory || gameState.isFiring) return;
    
    const angle = gameState.mode === 'pvp' && gameState.currentPlayer === 2 
        ? 180 - gameState.angle 
        : gameState.angle;
    const angleRad = (angle * Math.PI) / 180;
    const power = getInitialPower();
    let vx = Math.cos(angleRad) * power;
    let vy = -Math.sin(angleRad) * power;
    
    const cannon = gameState.mode === 'pvp' && gameState.currentPlayer === 2 
        ? gameState.cannon2 
        : gameState.cannon;
    
    let x = cannon.x + Math.cos(angleRad) * 70;
    let y = cannon.y - 25 - Math.sin(angleRad) * 70;
    let simVy = vy;
    let simVx = vx;
    
    ctx.save();
    ctx.setLineDash([5, 8]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    for (let i = 0; i < 150; i++) {
        simVx += getWindModifier();
        x += simVx;
        y += simVy;
        simVy += getGravity();
        
        ctx.lineTo(x, y);
        
        if (y >= getTerrainY(x) || x > CANVAS_WIDTH || x < 0 || y > CANVAS_HEIGHT) {
            break;
        }
    }
    
    ctx.stroke();
    ctx.restore();
}

function createExplosion(x, y, type, isSplit = false) {
    const radius = isSplit ? getExplosionRadius(type) * 0.5 : getExplosionRadius(type);
    
    gameState.explosions.push({
        x, y, type,
        radius,
        frame: 0,
        maxFrames: 30
    });
    
    const particleCount = isSplit ? 15 : 25;
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        const shellDef = SHELL_TYPES[type];
        gameState.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: Math.random() * 6 + 2,
            life: 40,
            maxLife: 40,
            color: type === 'freeze' ? '41, 182, 246' : 
                   type === 'incendiary' ? '239, 83, 80' :
                   Math.random() > 0.5 ? '255, 152, 0' : '244, 67, 54'
        });
    }
    
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        gameState.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            size: Math.random() * 4 + 2,
            life: 50,
            maxLife: 50,
            color: '158, 158, 158'
        });
    }
    
    if (!isSplit) {
        deformTerrain(x, y, radius * 0.6);
    }
    
    return radius;
}

function deformTerrain(x, y, radius) {
    for (let i = 0; i < gameState.terrain.length; i++) {
        const point = gameState.terrain[i];
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
            const deformAmount = (1 - distance / radius) * radius * 0.5;
            point.y = Math.min(point.y + deformAmount, 420);
        }
    }
}

function checkEnemiesInExplosion(x, y, radius, type) {
    let killed = 0;
    const shellDef = SHELL_TYPES[type];
    const damage = isNaN(getShellDamage(type)) ? 1 : getShellDamage(type);
    
    gameState.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius + enemy.radius) {
            const damageMultiplier = 1 - (distance / (radius + enemy.radius)) * 0.5;
            const actualDamage = Math.max(1, Math.floor(damage * damageMultiplier - enemy.defense));
            
            enemy.health -= actualDamage;
            
            if (type === 'incendiary' && shellDef.burnDamage) {
                enemy.burning = shellDef.burnDuration * 60;
            }
            if (type === 'freeze' && shellDef.freezeDuration) {
                enemy.frozen = shellDef.freezeDuration * 60;
            }
            
            if (enemy.health <= 0) {
                enemy.alive = false;
                killed++;
                const enemyDef = ENEMY_TYPES[enemy.type];
                gameState.score += enemyDef.score;
                gameState.coins += enemyDef.coins;
                
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 4 + 1;
                    gameState.particles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 2,
                        size: Math.random() * 5 + 2,
                        life: 35,
                        maxLife: 35,
                        color: type === 'freeze' ? '41, 182, 246' :
                               type === 'incendiary' ? '239, 83, 80' : '76, 175, 80'
                    });
                }
            }
        }
    });
    
    return killed;
}

function checkCannonInExplosion(x, y, radius, type) {
    if (gameState.mode !== 'pvp') return null;
    
    const targetCannon = gameState.currentPlayer === 1 ? gameState.cannon2 : gameState.cannon;
    const dx = targetCannon.x - x;
    const dy = targetCannon.y - 25 - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < radius + 25) {
        const damage = Math.max(1, Math.floor(getShellDamage(type) * 2));
        targetCannon.health -= damage;
        return targetCannon;
    }
    return null;
}

function fire() {
    if (gameState.isFiring || !gameState.isPlaying) return;
    
    const shellType = gameState.selectedShell;
    if (gameState.shellInventory[shellType] <= 0 && gameState.shellInventory[shellType] !== Infinity) return;
    
    gameState.isFiring = true;
    gameState.hasFired = true;
    
    if (gameState.shellInventory[shellType] !== Infinity) {
        gameState.shellInventory[shellType]--;
    }
    
    const angle = gameState.mode === 'pvp' && gameState.currentPlayer === 2 
        ? 180 - gameState.angle 
        : gameState.angle;
    const angleRad = (angle * Math.PI) / 180;
    const power = getInitialPower();
    
    const cannon = gameState.mode === 'pvp' && gameState.currentPlayer === 2 
        ? gameState.cannon2 
        : gameState.cannon;
    
    const projectile = {
        x: cannon.x + Math.cos(angleRad) * 70,
        y: cannon.y - 25 - Math.sin(angleRad) * 70,
        vx: Math.cos(angleRad) * power,
        vy: -Math.sin(angleRad) * power,
        type: shellType,
        penetrating: shellType === 'buster',
        penetrateDepth: shellType === 'buster' ? SHELL_TYPES.buster.penetrateDepth : 0,
        penetratedDistance: 0
    };
    
    gameState.projectiles.push(projectile);
    
    for (let i = 0; i < 10; i++) {
        gameState.particles.push({
            x: projectile.x,
            y: projectile.y,
            vx: -Math.cos(angleRad) * (Math.random() * 3 + 1),
            vy: Math.sin(angleRad) * (Math.random() * 3 + 1),
            size: Math.random() * 4 + 2,
            life: 20,
            maxLife: 20,
            color: '255, 235, 59'
        });
    }
    
    updateUI();
    updateShellButtons();
}

function updateProjectiles() {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const p = gameState.projectiles[i];
        
        p.vx += getWindModifier();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += getGravity();
        
        const terrainY = getTerrainY(p.x);
        
        if (p.penetrating && p.penetratedDistance < p.penetrateDepth && p.y >= terrainY) {
            p.penetratedDistance += Math.abs(p.vy);
            p.vy *= 0.7;
            if (p.penetratedDistance >= p.penetrateDepth) {
                p.penetrating = false;
                const expRadius = createExplosion(p.x, p.y, p.type);
                checkEnemiesInExplosion(p.x, p.y, expRadius, p.type);
                gameState.projectiles.splice(i, 1);
                handleProjectileEnd();
                continue;
            }
        } else if (p.y >= terrainY || p.x > CANVAS_WIDTH || p.x < 0 || p.y > CANVAS_HEIGHT) {
            const explosionY = Math.min(p.y, terrainY);
            const expRadius = createExplosion(explosionY > 0 ? p.x : p.x, explosionY > 0 ? explosionY : 50, p.type);
            
            if (p.type === 'split' && !p.isSplit) {
                createSplitProjectiles(p.x, explosionY);
            }
            
            checkEnemiesInExplosion(p.x, explosionY, expRadius, p.type);
            
            if (gameState.mode === 'pvp') {
                const hitCannon = checkCannonInExplosion(p.x, explosionY, expRadius, p.type);
                if (hitCannon && hitCannon.health <= 0) {
                    gameState.isPlaying = false;
                    showPVPWin(gameState.currentPlayer);
                    gameState.projectiles.splice(i, 1);
                    return;
                }
            }
            
            gameState.projectiles.splice(i, 1);
            handleProjectileEnd();
        }
    }
}

function createSplitProjectiles(x, y) {
    const splitCount = SHELL_TYPES.split.splitCount;
    const baseAngle = Math.PI / 6;
    
    for (let i = 0; i < splitCount; i++) {
        const angle = -Math.PI / 2 + (i - (splitCount - 1) / 2) * baseAngle;
        const speed = 4 + Math.random() * 2;
        
        gameState.projectiles.push({
            x,
            y: y - 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            type: 'normal',
            isSplit: true,
            penetrating: false
        });
    }
}

function handleProjectileEnd() {
    if (gameState.projectiles.length === 0) {
        gameState.isFiring = false;
        
        if (gameState.mode === 'pvp') {
            setTimeout(() => {
                if (gameState.isPlaying) {
                    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
                    gameState.angle = 45;
                    gameState.power = 50;
                    angleSlider.value = 45;
                    powerSlider.value = 50;
                    generateWind();
                    updateUI();
                }
            }, 800);
        } else {
            updateUI();
            setTimeout(() => {
                checkWinLose();
            }, 500);
        }
    }
}

function updateExplosions() {
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        gameState.explosions[i].frame++;
        if (gameState.explosions[i].frame >= gameState.explosions[i].maxFrames) {
            gameState.explosions.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.15;
        particle.life--;
        
        if (particle.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

function updateEnemies() {
    gameState.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        if (enemy.burning > 0) {
            enemy.burning--;
            if (enemy.burning % 60 === 0) {
                const burnDmg = Math.max(1, Math.floor(SHELL_TYPES.incendiary.burnDamage - enemy.defense));
                enemy.health -= burnDmg;
                if (enemy.health <= 0) {
                    enemy.alive = false;
                    const enemyDef = ENEMY_TYPES[enemy.type];
                    gameState.score += enemyDef.score;
                    gameState.coins += enemyDef.coins;
                }
            }
        }
        
        if (enemy.frozen > 0) {
            enemy.frozen--;
            return;
        }
        
        if (enemy.speed > 0 && gameState.isPlaying && !gameState.isFiring) {
            const targetX = gameState.cannon.x;
            const dx = targetX - enemy.x;
            
            if (Math.abs(dx) > 200) {
                const moveSpeed = enemy.speed * enemy.moveDirection;
                enemy.x += moveSpeed;
                
                if (enemy.flying) {
                    enemy.y = enemy.baseY + Math.sin(Date.now() / 500) * 10;
                } else {
                    enemy.y = getTerrainY(enemy.x) - (enemy.type === 'tank' ? 25 : 30);
                }
                
                if (Math.random() < 0.01) {
                    enemy.moveDirection *= -1;
                }
            }
        }
    });
}

function checkWinLose() {
    if (!gameState.isPlaying || gameState.mode === 'pvp') return;
    
    const allDead = gameState.enemies.every(e => !e.alive);
    
    if (allDead) {
        gameState.isPlaying = false;
        
        const ammoBonus = gameState.coins + 20;
        gameState.coins += 20;
        gameState.score += gameState.ammo * 50;
        
        gameState.chapterProgress[gameState.currentChapter] = 
            Math.max(gameState.chapterProgress[gameState.currentChapter], gameState.currentLevel);
        
        if (gameState.currentLevel >= CHAPTERS[gameState.currentChapter - 1].levels) {
            if (gameState.currentChapter < CHAPTERS.length) {
                CHAPTERS[gameState.currentChapter].unlocked = true;
                showChapterComplete();
            } else {
                showGameComplete();
            }
        } else {
            showLevelComplete();
        }
    } else if (getTotalShells() <= 0 && gameState.projectiles.length === 0) {
        gameState.isPlaying = false;
        showGameOver();
    }
    
    updateUI();
}

function getTotalShells() {
    return Object.values(gameState.shellInventory).reduce((sum, count) => 
        sum + (count === Infinity ? 999 : count), 0);
}

function showLevelComplete() {
    modalContent.innerHTML = `
        <h2 class="modal-title">🎉 关卡通过！</h2>
        <p class="modal-message">恭喜你消灭了所有敌人！<br>获得金币奖励: +20 💰</p>
        <p class="modal-score">当前得分: ${gameState.score}<br>💰 金币: ${gameState.coins}</p>
        <div class="modal-buttons">
            <button class="btn btn-upgrade" id="modalUpgradeBtn">
                <span class="btn-icon">⬆️</span>
                <span class="btn-text">升级火炮</span>
            </button>
            <button class="btn btn-primary" id="modalNextBtn">
                <span class="btn-icon">➡️</span>
                <span class="btn-text">下一关</span>
            </button>
        </div>
    `;
    modalOverlay.classList.add('active');
    
    document.getElementById('modalUpgradeBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        showUpgradeShop();
    };
    document.getElementById('modalNextBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        gameState.currentLevel++;
        resetShellInventory();
        initLevel();
    };
}

function showChapterComplete() {
    modalContent.innerHTML = `
        <h2 class="modal-title">🏆 章节完成！</h2>
        <p class="modal-message">恭喜你完成了 ${CHAPTERS[gameState.currentChapter - 1].name}！<br>下一章节已解锁！</p>
        <p class="modal-score">当前得分: ${gameState.score}<br>💰 金币: ${gameState.coins}</p>
        <div class="modal-buttons">
            <button class="btn btn-upgrade" id="modalUpgradeBtn">
                <span class="btn-icon">⬆️</span>
                <span class="btn-text">升级火炮</span>
            </button>
            <button class="btn btn-primary" id="modalNextChapterBtn">
                <span class="btn-icon">📖</span>
                <span class="btn-text">下一章节</span>
            </button>
        </div>
    `;
    modalOverlay.classList.add('active');
    
    document.getElementById('modalUpgradeBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        showUpgradeShop();
    };
    document.getElementById('modalNextChapterBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        gameState.currentChapter++;
        gameState.currentLevel = 1;
        resetShellInventory();
        initLevel();
    };
}

function showGameComplete() {
    modalContent.innerHTML = `
        <h2 class="modal-title">🎖️ 全部通关！</h2>
        <p class="modal-message">太棒了！你成功通过了所有章节！<br>你是真正的火炮大师！</p>
        <p class="modal-score">最终得分: ${gameState.score}<br>💰 金币: ${gameState.coins}</p>
        <div class="modal-buttons">
            <button class="btn btn-primary" id="modalRestartBtn">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">重新开始</span>
            </button>
            <button class="btn btn-secondary" id="modalPVPBtn">
                <span class="btn-icon">🎮</span>
                <span class="btn-text">双人对战</span>
            </button>
        </div>
    `;
    modalOverlay.classList.add('active');
    
    document.getElementById('modalRestartBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        initGame('campaign');
    };
    document.getElementById('modalPVPBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        initGame('pvp');
    };
}

function showGameOver() {
    modalContent.innerHTML = `
        <h2 class="modal-title">💥 游戏失败</h2>
        <p class="modal-message">炮弹用完了，但还有敌人存活...<br>再试一次吧！</p>
        <p class="modal-score">当前得分: ${gameState.score}<br>💰 金币: ${gameState.coins}</p>
        <div class="modal-buttons">
            <button class="btn btn-upgrade" id="modalUpgradeBtn">
                <span class="btn-icon">⬆️</span>
                <span class="btn-text">升级火炮</span>
            </button>
            <button class="btn btn-primary" id="modalRestartBtn">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">重新开始</span>
            </button>
        </div>
    `;
    modalOverlay.classList.add('active');
    
    document.getElementById('modalUpgradeBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        showUpgradeShop();
    };
    document.getElementById('modalRestartBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        gameState.currentLevel = 1;
        resetShellInventory();
        initLevel();
    };
}

function showPVPWin(winner) {
    modalContent.innerHTML = `
        <h2 class="modal-title">🏆 玩家${winner}获胜！</h2>
        <p class="modal-message">恭喜玩家${winner}摧毁了对方火炮！<br>精彩的对决！</p>
        <div class="modal-buttons">
            <button class="btn btn-primary" id="modalRematchBtn">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">再来一局</span>
            </button>
            <button class="btn btn-secondary" id="modalMenuBtn">
                <span class="btn-icon">🏠</span>
                <span class="btn-text">返回主菜单</span>
            </button>
        </div>
    `;
    modalOverlay.classList.add('active');
    
    document.getElementById('modalRematchBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        initPVP();
    };
    document.getElementById('modalMenuBtn').onclick = () => {
        modalOverlay.classList.remove('active');
        showStartMenu();
    };
}

function showStartMenu() {
    gameState.mode = null;
    gameState.isPlaying = false;
    pvpIndicator.style.display = 'none';
    startModalOverlay.style.display = 'flex';
    startModalOverlay.classList.add('active');
}

function showUpgradeShop() {
    upgradeCoins.textContent = gameState.coins;
    
    let shopHTML = '';
    for (const [key, upgrade] of Object.entries(UPGRADES)) {
        const currentLevel = gameState.upgrades[key];
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
        const maxed = currentLevel >= upgrade.maxLevel;
        const canAfford = gameState.coins >= cost;
        
        let levelDots = '';
        for (let i = 0; i < upgrade.maxLevel; i++) {
            levelDots += `<span class="level-dot ${i < currentLevel ? 'filled' : ''}"></span>`;
        }
        
        shopHTML += `
            <div class="upgrade-item">
                <span class="upgrade-icon">${upgrade.icon}</span>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-desc">${upgrade.desc}</div>
                    <div class="upgrade-level">${levelDots}</div>
                </div>
                <button class="upgrade-buy-btn" data-upgrade="${key}" 
                    ${maxed || !canAfford ? 'disabled' : ''}>
                    ${maxed ? '已满级' : `<span class="cost-icon">💰</span>${cost}`}
                </button>
            </div>
        `;
    }
    
    upgradeShop.innerHTML = shopHTML;
    upgradeModalOverlay.style.display = 'flex';
    upgradeModalOverlay.classList.add('active');
    
    document.querySelectorAll('.upgrade-buy-btn').forEach(btn => {
        btn.onclick = () => {
            const upgradeKey = btn.dataset.upgrade;
            buyUpgrade(upgradeKey);
        };
    });
}

function buyUpgrade(key) {
    const upgrade = UPGRADES[key];
    const currentLevel = gameState.upgrades[key];
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    
    if (currentLevel >= upgrade.maxLevel || gameState.coins < cost) return;
    
    gameState.coins -= cost;
    gameState.upgrades[key]++;
    
    if (key === 'capacity') {
        resetShellInventory();
    }
    
    showUpgradeShop();
    updateUI();
    updateShellButtons();
}

function showChapterSelect() {
    let chapterHTML = '';
    for (const chapter of CHAPTERS) {
        const progress = gameState.chapterProgress[chapter.id] || 0;
        const unlocked = chapter.unlocked;
        
        chapterHTML += `
            <button class="chapter-btn" data-chapter="${chapter.id}" 
                ${!unlocked ? 'disabled' : ''}>
                <span class="chapter-icon">${unlocked ? chapter.icon : '🔒'}</span>
                <span class="chapter-name">${chapter.name}</span>
                <span class="chapter-desc">${chapter.desc}</span>
                <span class="chapter-progress">${unlocked ? `进度: ${progress}/${chapter.levels}关` : '未解锁'}</span>
            </button>
        `;
    }
    
    chapterSelect.innerHTML = chapterHTML;
    chapterModalOverlay.style.display = 'flex';
    chapterModalOverlay.classList.add('active');
    
    document.querySelectorAll('.chapter-btn').forEach(btn => {
        btn.onclick = () => {
            const chapterId = parseInt(btn.dataset.chapter);
            selectChapter(chapterId);
        };
    });
}

function selectChapter(chapterId) {
    const chapter = CHAPTERS[chapterId - 1];
    if (!chapter.unlocked) return;
    
    gameState.currentChapter = chapterId;
    gameState.currentLevel = 1;
    resetShellInventory();
    
    chapterModalOverlay.style.display = 'none';
    chapterModalOverlay.classList.remove('active');
    
    initLevel();
}

function resetLevel() {
    if (gameState.mode === 'pvp') {
        initPVP();
    } else {
        if (gameState.hasFired) {
            gameState.score = Math.max(0, gameState.score - 50);
        }
        initLevel();
    }
}

function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawSky();
    drawTerrain();
    drawTrajectory();
    
    if (gameState.mode === 'pvp') {
        drawCannon(gameState.cannon, false);
        drawCannon(gameState.cannon2, true);
    } else {
        drawCannon(gameState.cannon, false);
        drawEnemies();
    }
    
    drawProjectiles();
    drawExplosions();
    drawParticles();
}

function update() {
    if (!gameState.isPlaying) return;
    
    updateProjectiles();
    updateExplosions();
    updateParticles();
    updateEnemies();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

angleSlider.addEventListener('input', (e) => {
    gameState.angle = parseInt(e.target.value);
    angleValue.textContent = `${gameState.angle}°`;
});

powerSlider.addEventListener('input', (e) => {
    gameState.power = parseInt(e.target.value);
    powerValue.textContent = `${gameState.power}%`;
});

fireBtn.addEventListener('click', fire);
resetBtn.addEventListener('click', resetLevel);

upgradeBtn.addEventListener('click', () => {
    if (gameState.mode !== 'pvp') {
        showUpgradeShop();
    }
});

chapterBtn.addEventListener('click', () => {
    if (gameState.mode !== 'pvp') {
        showChapterSelect();
    }
});

document.getElementById('closeUpgradeBtn').addEventListener('click', () => {
    upgradeModalOverlay.style.display = 'none';
    upgradeModalOverlay.classList.remove('active');
});

document.getElementById('closeChapterBtn').addEventListener('click', () => {
    chapterModalOverlay.style.display = 'none';
    chapterModalOverlay.classList.remove('active');
});

document.querySelectorAll('.shell-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const shellType = btn.dataset.shell;
        if (gameState.shellInventory[shellType] > 0 || gameState.shellInventory[shellType] === Infinity) {
            gameState.selectedShell = shellType;
            updateShellButtons();
        }
    });
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        initGame(mode);
    });
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const cannon = gameState.mode === 'pvp' && gameState.currentPlayer === 2 
        ? gameState.cannon2 
        : gameState.cannon;
    
    if (gameState.mode === 'pvp' && gameState.currentPlayer === 2) {
        if (x < cannon.x) {
            const dx = x - cannon.x;
            const dy = cannon.y - 25 - y;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            angle = 180 - Math.max(0, Math.min(90, 180 + angle));
            gameState.angle = Math.round(Math.max(0, Math.min(90, angle)));
            angleSlider.value = gameState.angle;
            angleValue.textContent = `${gameState.angle}°`;
        }
    } else {
        if (x > cannon.x) {
            const dx = x - cannon.x;
            const dy = cannon.y - 25 - y;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            angle = Math.max(0, Math.min(90, angle));
            gameState.angle = Math.round(angle);
            angleSlider.value = gameState.angle;
            angleValue.textContent = `${gameState.angle}°`;
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        fire();
    } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        gameState.angle = Math.min(90, gameState.angle + 5);
        angleSlider.value = gameState.angle;
        angleValue.textContent = `${gameState.angle}°`;
    } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        gameState.angle = Math.max(0, gameState.angle - 5);
        angleSlider.value = gameState.angle;
        angleValue.textContent = `${gameState.angle}°`;
    } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        gameState.power = Math.min(100, gameState.power + 5);
        powerSlider.value = gameState.power;
        powerValue.textContent = `${gameState.power}%`;
    } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        gameState.power = Math.max(10, gameState.power - 5);
        powerSlider.value = gameState.power;
        powerValue.textContent = `${gameState.power}%`;
    } else if (e.code === 'KeyR') {
        resetLevel();
    } else if (e.code === 'Digit1') {
        gameState.selectedShell = 'normal';
        updateShellButtons();
    } else if (e.code === 'Digit2') {
        if (gameState.shellInventory.split > 0) {
            gameState.selectedShell = 'split';
            updateShellButtons();
        }
    } else if (e.code === 'Digit3') {
        if (gameState.shellInventory.incendiary > 0) {
            gameState.selectedShell = 'incendiary';
            updateShellButtons();
        }
    } else if (e.code === 'Digit4') {
        if (gameState.shellInventory.freeze > 0) {
            gameState.selectedShell = 'freeze';
            updateShellButtons();
        }
    } else if (e.code === 'Digit5') {
        if (gameState.shellInventory.buster > 0) {
            gameState.selectedShell = 'buster';
            updateShellButtons();
        }
    }
});

startModalOverlay.style.display = 'flex';
startModalOverlay.classList.add('active');