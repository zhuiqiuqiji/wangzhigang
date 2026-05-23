const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.5;
const FRICTION = 0.99;
const BOUNCE = 0.6;
const GROUND_Y = 420;
const AIR_RESISTANCE = 0.995;

let gameState = {
    score: 0,
    chapter: 1,
    level: 1,
    totalLevels: 5,
    birdsLeft: {},
    currentBirdType: 'red',
    gameOver: false,
    levelComplete: false,
    waitingForNextBird: false,
    skillUsed: false,
    stars: 0,
    isCustomLevel: false
};

let slingshot = {
    x: 150,
    y: 350,
    width: 20,
    height: 100
};

let birds = [];
let eggs = [];
let blocks = [];
let pigs = [];
let balloons = [];
let explosions = [];
let particles = [];

const birdTypes = {
    red: {
        name: '红色普通鸟',
        color: '#FF5722',
        radius: 18,
        skill: 'none',
        description: '无特殊技能'
    },
    blue: {
        name: '蓝色分身鸟',
        color: '#2196F3',
        radius: 14,
        skill: 'split',
        description: '点击分裂成3只'
    },
    yellow: {
        name: '黄色加速鸟',
        color: '#FFC107',
        radius: 16,
        skill: 'boost',
        description: '点击加速冲刺'
    },
    black: {
        name: '黑色炸弹鸟',
        color: '#212121',
        radius: 22,
        skill: 'explode',
        description: '点击爆炸'
    },
    green: {
        name: '绿色回旋鸟',
        color: '#4CAF50',
        radius: 17,
        skill: 'boomerang',
        description: '点击回旋镖'
    },
    white: {
        name: '白色下蛋鸟',
        color: '#FAFAFA',
        radius: 20,
        skill: 'egg',
        description: '点击投掷炸弹蛋'
    }
};

const blockTypes = {
    wood: { color: '#8B4513', health: 3, points: 100, density: 1, name: '木头' },
    ice: { color: '#87CEEB', health: 1, points: 150, density: 0.6, name: '冰块' },
    stone: { color: '#808080', health: 6, points: 200, density: 2, name: '石块' },
    tnt: { color: '#FF4444', health: 1, points: 300, density: 1, explosive: true, name: 'TNT' }
};

const chapters = [
    {
        id: 1,
        name: '愤怒草原',
        theme: 'grassland',
        levels: 5,
        background: '#87CEEB',
        unlocked: true
    },
    {
        id: 2,
        name: '冰雪世界',
        theme: 'ice',
        levels: 5,
        background: '#E0F7FA',
        unlocked: false
    },
    {
        id: 3,
        name: '沙漠风暴',
        theme: 'desert',
        levels: 5,
        background: '#FFF8E1',
        unlocked: false
    },
    {
        id: 4,
        name: '丛林探险',
        theme: 'jungle',
        levels: 5,
        background: '#C8E6C9',
        unlocked: false
    },
    {
        id: 5,
        name: '最终BOSS',
        theme: 'boss',
        levels: 1,
        background: '#FFEBEE',
        isBoss: true,
        unlocked: false
    }
];

const levels = {
    '1-1': {
        birds: { red: 3, blue: 0, yellow: 0, black: 0, green: 0, white: 0 },
        blocks: [
            { x: 800, y: GROUND_Y - 60, width: 60, height: 60, type: 'wood' },
            { x: 860, y: GROUND_Y - 60, width: 60, height: 60, type: 'wood' },
            { x: 830, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' }
        ],
        pigs: [
            { x: 830, y: GROUND_Y - 30, radius: 20, health: 2, isBoss: false }
        ],
        stars: { one: 500, two: 1000, three: 1500 }
    },
    '1-2': {
        birds: { red: 2, blue: 2, yellow: 0, black: 0, green: 0, white: 0 },
        blocks: [
            { x: 750, y: GROUND_Y - 60, width: 60, height: 60, type: 'wood' },
            { x: 810, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 870, y: GROUND_Y - 60, width: 60, height: 60, type: 'wood' },
            { x: 780, y: GROUND_Y - 120, width: 60, height: 60, type: 'ice' },
            { x: 840, y: GROUND_Y - 120, width: 60, height: 60, type: 'ice' }
        ],
        pigs: [
            { x: 780, y: GROUND_Y - 30, radius: 20, health: 2 },
            { x: 840, y: GROUND_Y - 30, radius: 20, health: 2 }
        ],
        stars: { one: 800, two: 1500, three: 2200 }
    },
    '1-3': {
        birds: { red: 2, blue: 1, yellow: 2, black: 0, green: 0, white: 0 },
        blocks: [
            { x: 700, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 760, y: GROUND_Y - 60, width: 60, height: 60, type: 'wood' },
            { x: 820, y: GROUND_Y - 60, width: 60, height: 60, type: 'wood' },
            { x: 880, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 730, y: GROUND_Y - 120, width: 60, height: 60, type: 'ice' },
            { x: 790, y: GROUND_Y - 120, width: 60, height: 60, type: 'tnt' },
            { x: 850, y: GROUND_Y - 120, width: 60, height: 60, type: 'ice' },
            { x: 790, y: GROUND_Y - 180, width: 60, height: 60, type: 'wood' }
        ],
        pigs: [
            { x: 730, y: GROUND_Y - 30, radius: 20, health: 2 },
            { x: 850, y: GROUND_Y - 30, radius: 20, health: 2 },
            { x: 790, y: GROUND_Y - 160, radius: 18, health: 2 }
        ],
        balloons: [
            { x: 950, y: GROUND_Y - 150, radius: 25, lift: -0.3 }
        ],
        stars: { one: 1200, two: 2000, three: 3000 }
    },
    '1-4': {
        birds: { red: 2, blue: 1, yellow: 1, black: 1, green: 1, white: 0 },
        blocks: [
            { x: 650, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 710, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 770, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 830, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 890, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 680, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 740, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 800, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 860, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 710, y: GROUND_Y - 180, width: 60, height: 60, type: 'ice' },
            { x: 770, y: GROUND_Y - 180, width: 60, height: 60, type: 'ice' },
            { x: 830, y: GROUND_Y - 180, width: 60, height: 60, type: 'ice' },
            { x: 770, y: GROUND_Y - 240, width: 60, height: 60, type: 'tnt' }
        ],
        pigs: [
            { x: 710, y: GROUND_Y - 30, radius: 20, health: 2 },
            { x: 830, y: GROUND_Y - 30, radius: 20, health: 2 },
            { x: 770, y: GROUND_Y - 210, radius: 22, health: 3 }
        ],
        stars: { one: 1500, two: 2500, three: 3800 }
    },
    '1-5': {
        birds: { red: 3, blue: 2, yellow: 2, black: 1, green: 1, white: 1 },
        blocks: [
            { x: 600, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 660, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 720, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 780, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 840, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 900, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 630, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 690, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 750, y: GROUND_Y - 120, width: 60, height: 60, type: 'tnt' },
            { x: 810, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 870, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 660, y: GROUND_Y - 180, width: 60, height: 60, type: 'ice' },
            { x: 720, y: GROUND_Y - 180, width: 60, height: 60, type: 'ice' },
            { x: 780, y: GROUND_Y - 180, width: 60, height: 60, type: 'ice' },
            { x: 840, y: GROUND_Y - 180, width: 60, height: 60, type: 'ice' },
            { x: 720, y: GROUND_Y - 240, width: 60, height: 60, type: 'wood' },
            { x: 780, y: GROUND_Y - 240, width: 60, height: 60, type: 'wood' },
            { x: 750, y: GROUND_Y - 300, width: 60, height: 60, type: 'stone' }
        ],
        pigs: [
            { x: 660, y: GROUND_Y - 30, radius: 20, health: 2 },
            { x: 840, y: GROUND_Y - 30, radius: 20, health: 2 },
            { x: 750, y: GROUND_Y - 330, radius: 25, health: 5, isBoss: true }
        ],
        stars: { one: 2000, two: 3500, three: 5000 },
        isBoss: false
    },
    '2-1': {
        birds: { red: 2, blue: 2, yellow: 1, black: 0, green: 1, white: 0 },
        blocks: [
            { x: 750, y: GROUND_Y - 60, width: 60, height: 60, type: 'ice' },
            { x: 810, y: GROUND_Y - 60, width: 60, height: 60, type: 'ice' },
            { x: 870, y: GROUND_Y - 60, width: 60, height: 60, type: 'ice' },
            { x: 780, y: GROUND_Y - 120, width: 60, height: 60, type: 'ice' },
            { x: 840, y: GROUND_Y - 120, width: 60, height: 60, type: 'ice' },
            { x: 810, y: GROUND_Y - 180, width: 60, height: 60, type: 'ice' }
        ],
        pigs: [
            { x: 810, y: GROUND_Y - 30, radius: 20, health: 2 },
            { x: 810, y: GROUND_Y - 150, radius: 18, health: 2 }
        ],
        stars: { one: 1000, two: 1800, three: 2600 }
    },
    '5-1': {
        birds: { red: 5, blue: 3, yellow: 3, black: 2, green: 2, white: 2 },
        blocks: [
            { x: 550, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 610, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 670, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 730, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 790, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 850, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 910, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 970, y: GROUND_Y - 60, width: 60, height: 60, type: 'stone' },
            { x: 580, y: GROUND_Y - 120, width: 60, height: 60, type: 'tnt' },
            { x: 640, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 700, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 760, y: GROUND_Y - 120, width: 60, height: 60, type: 'tnt' },
            { x: 820, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 880, y: GROUND_Y - 120, width: 60, height: 60, type: 'wood' },
            { x: 940, y: GROUND_Y - 120, width: 60, height: 60, type: 'tnt' },
            { x: 670, y: GROUND_Y - 180, width: 60, height: 60, type: 'stone' },
            { x: 730, y: GROUND_Y - 180, width: 60, height: 60, type: 'stone' },
            { x: 790, y: GROUND_Y - 180, width: 60, height: 60, type: 'stone' },
            { x: 850, y: GROUND_Y - 180, width: 60, height: 60, type: 'stone' },
            { x: 700, y: GROUND_Y - 240, width: 60, height: 60, type: 'wood' },
            { x: 760, y: GROUND_Y - 240, width: 60, height: 60, type: 'wood' },
            { x: 820, y: GROUND_Y - 240, width: 60, height: 60, type: 'wood' },
            { x: 730, y: GROUND_Y - 300, width: 60, height: 60, type: 'stone' },
            { x: 790, y: GROUND_Y - 300, width: 60, height: 60, type: 'stone' },
            { x: 760, y: GROUND_Y - 360, width: 60, height: 60, type: 'tnt' }
        ],
        pigs: [
            { x: 670, y: GROUND_Y - 30, radius: 20, health: 3 },
            { x: 850, y: GROUND_Y - 30, radius: 20, health: 3 },
            { x: 760, y: GROUND_Y - 400, radius: 50, health: 20, isBoss: true }
        ],
        stars: { one: 5000, two: 8000, three: 12000 },
        isBoss: true
    }
};

let currentLevelData = null;
let editorState = {
    currentTool: 'block_wood',
    editorBlocks: [],
    editorPigs: [],
    editorBirds: { red: 3 }
};

function createBird(type, x, y, vx = 0, vy = 0) {
    const birdType = birdTypes[type];
    return {
        type: type,
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: birdType.radius,
        color: birdType.color,
        skill: birdType.skill,
        isLaunched: vx !== 0 || vy !== 0,
        isDragging: false,
        skillUsed: false,
        rotation: 0
    };
}

function initLevel(chapter, level) {
    const levelKey = `${chapter}-${level}`;
    currentLevelData = levels[levelKey] || levels['1-1'];
    
    gameState.chapter = chapter;
    gameState.level = level;
    gameState.score = 0;
    gameState.birdsLeft = { ...currentLevelData.birds };
    gameState.gameOver = false;
    gameState.levelComplete = false;
    gameState.waitingForNextBird = false;
    gameState.skillUsed = false;
    gameState.stars = 0;
    gameState.isCustomLevel = false;
    
    for (const type in gameState.birdsLeft) {
        if (gameState.birdsLeft[type] > 0) {
            gameState.currentBirdType = type;
            break;
        }
    }
    
    birds = [];
    eggs = [];
    blocks = currentLevelData.blocks.map(b => ({
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        type: b.type,
        health: blockTypes[b.type].health,
        maxHealth: blockTypes[b.type].health,
        vx: 0,
        vy: 0,
        angle: 0,
        destroyed: false,
        isStatic: true,
        density: blockTypes[b.type].density || 1
    }));
    
    pigs = currentLevelData.pigs.map(p => ({
        x: p.x,
        y: p.y,
        radius: p.radius,
        health: p.health,
        maxHealth: p.health,
        vx: 0,
        vy: 0,
        destroyed: false,
        isBoss: p.isBoss || false
    }));
    
    balloons = (currentLevelData.balloons || []).map(b => ({
        x: b.x,
        y: b.y,
        radius: b.radius,
        lift: b.lift,
        vx: 0,
        vy: 0,
        destroyed: false
    }));
    
    explosions = [];
    particles = [];
    
    spawnBird();
    updateUI();
    updateBirdSelector();
}

function initCustomLevel(customData) {
    currentLevelData = customData;
    
    gameState.chapter = 0;
    gameState.level = 0;
    gameState.score = 0;
    gameState.birdsLeft = { ...customData.birds };
    gameState.gameOver = false;
    gameState.levelComplete = false;
    gameState.waitingForNextBird = false;
    gameState.skillUsed = false;
    gameState.stars = 0;
    gameState.isCustomLevel = true;
    
    for (const type in gameState.birdsLeft) {
        if (gameState.birdsLeft[type] > 0) {
            gameState.currentBirdType = type;
            break;
        }
    }
    
    birds = [];
    eggs = [];
    blocks = customData.blocks.map(b => ({
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        type: b.type,
        health: blockTypes[b.type].health,
        maxHealth: blockTypes[b.type].health,
        vx: 0,
        vy: 0,
        angle: 0,
        destroyed: false,
        isStatic: true,
        density: blockTypes[b.type].density || 1
    }));
    
    pigs = customData.pigs.map(p => ({
        x: p.x,
        y: p.y,
        radius: p.radius || 20,
        health: p.health || 2,
        maxHealth: p.health || 2,
        vx: 0,
        vy: 0,
        destroyed: false,
        isBoss: p.isBoss || false
    }));
    
    balloons = [];
    explosions = [];
    particles = [];
    
    spawnBird();
    updateUI();
    updateBirdSelector();
}

function spawnBird() {
    const type = gameState.currentBirdType;
    if (gameState.birdsLeft[type] <= 0) {
        selectNextAvailableBird();
        return;
    }
    
    const newBird = createBird(type, slingshot.x, slingshot.y - 30);
    birds.push(newBird);
}

function selectNextAvailableBird() {
    const types = ['red', 'blue', 'yellow', 'black', 'green', 'white'];
    for (const type of types) {
        if (gameState.birdsLeft[type] > 0) {
            gameState.currentBirdType = type;
            spawnBird();
            updateBirdSelector();
            return true;
        }
    }
    return false;
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.isCustomLevel ? '自定义' : `${gameState.chapter}-${gameState.level}`;
    document.getElementById('chapter').textContent = gameState.isCustomLevel ? 'UGC' : gameState.chapter;
}

function updateBirdSelector() {
    const options = document.querySelectorAll('.bird-option');
    options.forEach(option => {
        const type = option.dataset.type;
        const count = gameState.birdsLeft[type] || 0;
        option.querySelector('.bird-count').textContent = count;
        option.classList.toggle('active', type === gameState.currentBirdType);
        option.classList.toggle('disabled', count <= 0);
    });
}

function updateStars(score) {
    if (!currentLevelData || !currentLevelData.stars) return;
    
    const stars = currentLevelData.stars;
    let earnedStars = 0;
    if (score >= stars.one) earnedStars = 1;
    if (score >= stars.two) earnedStars = 2;
    if (score >= stars.three) earnedStars = 3;
    
    gameState.stars = earnedStars;
    
    for (let i = 1; i <= 3; i++) {
        const starEl = document.getElementById(`star${i}`);
        starEl.classList.toggle('earned', i <= earnedStars);
    }
}

function drawSlingshot() {
    ctx.fillStyle = '#654321';
    ctx.fillRect(slingshot.x - 10, slingshot.y, 20, slingshot.height);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(slingshot.x - 50, slingshot.y + 80, 100, 20);
    
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(slingshot.x - 30, slingshot.y - 20);
    ctx.lineTo(slingshot.x, slingshot.y + 20);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(slingshot.x + 30, slingshot.y - 20);
    ctx.lineTo(slingshot.x, slingshot.y + 20);
    ctx.stroke();
    
    const readyBird = birds.find(b => !b.isLaunched && !b.isDragging);
    const draggingBird = birds.find(b => b.isDragging);
    const birdPos = draggingBird ? { x: draggingBird.x, y: draggingBird.y } : 
                    readyBird ? { x: readyBird.x, y: readyBird.y } : null;
    
    if (birdPos && (draggingBird || !gameState.waitingForNextBird)) {
        ctx.strokeStyle = '#4A2511';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(slingshot.x - 30, slingshot.y - 20);
        ctx.lineTo(birdPos.x, birdPos.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(slingshot.x + 30, slingshot.y - 20);
        ctx.lineTo(birdPos.x, birdPos.y);
        ctx.stroke();
    }
}

function drawBirds() {
    birds.forEach(bird => {
        drawBird(bird);
    });
}

function drawBird(bird) {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    
    const r = bird.radius;
    
    ctx.fillStyle = bird.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.2, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.2, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.moveTo(r * 0.5, 0);
    ctx.lineTo(r * 1.2, r * 0.2);
    ctx.lineTo(r * 0.5, r * 0.35);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawEggs() {
    eggs.forEach(egg => {
        ctx.save();
        ctx.translate(egg.x, egg.y);
        ctx.rotate(egg.rotation || 0);
        
        ctx.fillStyle = '#FFF8E1';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    });
}

function drawBlocks() {
    blocks.forEach(block => {
        if (block.destroyed) return;
        
        ctx.save();
        ctx.translate(block.x + block.width / 2, block.y + block.height / 2);
        ctx.rotate(block.angle);
        
        const type = blockTypes[block.type];
        const healthRatio = block.health / block.maxHealth;
        
        if (block.type === 'ice') {
            ctx.fillStyle = `rgba(135, 206, 235, ${0.7 + healthRatio * 0.3})`;
        } else if (block.type === 'tnt') {
            ctx.fillStyle = '#FF4444';
        } else {
            ctx.fillStyle = type.color;
        }
        
        ctx.fillRect(-block.width / 2, -block.height / 2, block.width, block.height);
        
        ctx.strokeStyle = block.type === 'tnt' ? '#AA0000' : '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-block.width / 2, -block.height / 2, block.width, block.height);
        
        if (block.type === 'tnt') {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TNT', 0, 5);
        }
        
        if (healthRatio < 1 && block.type !== 'tnt') {
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-block.width / 4, -block.height / 2);
            ctx.lineTo(0, 0);
            ctx.lineTo(block.width / 4, block.height / 2);
            ctx.stroke();
            
            if (healthRatio < 0.5) {
                ctx.beginPath();
                ctx.moveTo(block.width / 4, -block.height / 2);
                ctx.lineTo(0, block.height / 4);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    });
}

function drawPigs() {
    pigs.forEach(pig => {
        if (pig.destroyed) return;
        
        const r = pig.radius;
        
        ctx.fillStyle = pig.isBoss ? '#4CAF50' : '#8BC34A';
        ctx.beginPath();
        ctx.arc(pig.x, pig.y, r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = pig.isBoss ? '#2E7D32' : '#689F38';
        ctx.lineWidth = pig.isBoss ? 4 : 2;
        ctx.stroke();
        
        if (pig.isBoss) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(pig.x - r * 0.8, pig.y - r * 0.8);
            ctx.lineTo(pig.x - r * 0.6, pig.y - r * 1.3);
            ctx.lineTo(pig.x - r * 0.3, pig.y - r * 0.9);
            ctx.lineTo(pig.x, pig.y - r * 1.4);
            ctx.lineTo(pig.x + r * 0.3, pig.y - r * 0.9);
            ctx.lineTo(pig.x + r * 0.6, pig.y - r * 1.3);
            ctx.lineTo(pig.x + r * 0.8, pig.y - r * 0.8);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#FF5722';
            ctx.fillRect(pig.x - r * 0.5, pig.y - r * 1.3, r, r * 0.3);
        }
        
        ctx.fillStyle = pig.isBoss ? '#4CAF50' : '#8BC34A';
        ctx.beginPath();
        ctx.arc(pig.x - r * 0.7, pig.y - r * 0.6, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pig.x + r * 0.7, pig.y - r * 0.6, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pig.x - r * 0.3, pig.y - r * 0.15, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pig.x + r * 0.3, pig.y - r * 0.15, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(pig.x - r * 0.25, pig.y - r * 0.15, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pig.x + r * 0.35, pig.y - r * 0.15, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#F48FB1';
        ctx.beginPath();
        ctx.ellipse(pig.x, pig.y + r * 0.2, r * 0.35, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#D81B60';
        ctx.beginPath();
        ctx.arc(pig.x - r * 0.12, pig.y + r * 0.2, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pig.x + r * 0.12, pig.y + r * 0.2, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        if (pig.health < pig.maxHealth) {
            const barWidth = r * 1.5;
            const barHeight = 6;
            const barX = pig.x - barWidth / 2;
            const barY = pig.y - r - 15;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = pig.health > pig.maxHealth * 0.5 ? '#4CAF50' : '#f44336';
            ctx.fillRect(barX, barY, barWidth * (pig.health / pig.maxHealth), barHeight);
        }
    });
}

function drawBalloons() {
    balloons.forEach(balloon => {
        if (balloon.destroyed) return;
        
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(balloon.x - balloon.radius * 0.3, balloon.y - balloon.radius * 0.3, balloon.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#880E4F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(balloon.x, balloon.y + balloon.radius);
        ctx.lineTo(balloon.x, balloon.y + balloon.radius + 30);
        ctx.stroke();
    });
}

function drawExplosions() {
    explosions.forEach(exp => {
        const alpha = 1 - exp.frame / exp.maxFrames;
        const radius = exp.radius * (1 + exp.frame * 0.1);
        
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
    });
}

function drawGround() {
    const chapter = chapters[gameState.chapter - 1] || chapters[0];
    
    if (chapter.theme === 'ice') {
        ctx.fillStyle = '#E0F7FA';
        ctx.fillRect(0, 0, canvas.width, GROUND_Y);
        ctx.fillStyle = '#B2EBF2';
        ctx.fillRect(0, GROUND_Y - 50, canvas.width, 50);
    } else if (chapter.theme === 'desert') {
        ctx.fillStyle = '#FFF8E1';
        ctx.fillRect(0, 0, canvas.width, GROUND_Y);
    } else if (chapter.theme === 'jungle') {
        ctx.fillStyle = '#C8E6C9';
        ctx.fillRect(0, 0, canvas.width, GROUND_Y);
    } else if (chapter.theme === 'boss') {
        ctx.fillStyle = '#FFEBEE';
        ctx.fillRect(0, 0, canvas.width, GROUND_Y);
    } else {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, GROUND_Y);
        
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 5; i++) {
            const cloudX = (Date.now() / 50 + i * 200) % (canvas.width + 100) - 50;
            drawCloud(cloudX, 50 + i * 30);
        }
    }
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    
    ctx.fillStyle = chapter.theme === 'ice' ? '#E0F7FA' : '#4CAF50';
    ctx.fillRect(0, GROUND_Y, canvas.width, 10);
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 30, y - 10, 30, 0, Math.PI * 2);
    ctx.arc(x + 60, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 30, y + 10, 20, 0, Math.PI * 2);
    ctx.fill();
}

function drawTrajectory() {
    const draggingBird = birds.find(b => b.isDragging);
    if (!draggingBird) return;
    
    const dx = slingshot.x - draggingBird.x;
    const dy = slingshot.y - 30 - draggingBird.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
    const angle = Math.atan2(dy, dx);
    
    let tempX = draggingBird.x;
    let tempY = draggingBird.y;
    let tempVx = Math.cos(angle) * power * 0.15;
    let tempVy = Math.sin(angle) * power * 0.15;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(tempX, tempY);
    
    for (let i = 0; i < 60; i++) {
        tempVy += GRAVITY;
        tempVx *= FRICTION;
        tempX += tempVx;
        tempY += tempVy;
        
        if (tempY > GROUND_Y || tempX > canvas.width || tempX < 0) break;
        ctx.lineTo(tempX, tempY);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
}

function updatePhysics() {
    birds.forEach(bird => {
        if (!bird.isLaunched || bird.isDragging) return;
        
        bird.vy += GRAVITY;
        bird.vx *= AIR_RESISTANCE;
        bird.x += bird.vx;
        bird.y += bird.vy;
        bird.rotation += bird.vx * 0.05;
        
        if (bird.y + bird.radius > GROUND_Y) {
            bird.y = GROUND_Y - bird.radius;
            bird.vy *= -BOUNCE;
            bird.vx *= 0.8;
            
            if (Math.abs(bird.vy) < 1) {
                bird.vy = 0;
                bird.y = GROUND_Y - bird.radius;
            }
        }
        
        if (bird.x < -100 || bird.x > canvas.width + 100 || bird.y > canvas.height + 100) {
            bird.outOfBounds = true;
        }
    });
    
    eggs.forEach(egg => {
        egg.vy += GRAVITY * 1.5;
        egg.x += egg.vx;
        egg.y += egg.vy;
        egg.rotation = (egg.rotation || 0) + 0.2;
        
        if (egg.y + 18 > GROUND_Y) {
            createExplosion(egg.x, egg.y, 80);
            egg.destroyed = true;
        }
    });
    
    blocks.forEach(block => {
        if (block.destroyed || block.isStatic) return;
        
        block.vy += GRAVITY * (block.density || 1);
        block.vx *= FRICTION;
        block.x += block.vx;
        block.y += block.vy;
        block.angle += block.vx * 0.02;
        
        if (block.y + block.height > GROUND_Y) {
            block.y = GROUND_Y - block.height;
            block.vy *= -BOUNCE;
            block.vx *= 0.7;
            
            if (Math.abs(block.vy) < 1) {
                block.vy = 0;
                block.y = GROUND_Y - block.height;
            }
        }
        
        if (block.x < -100 || block.x > canvas.width + 100) {
            block.destroyed = true;
        }
    });
    
    pigs.forEach(pig => {
        if (pig.destroyed) return;
        
        pig.vy += GRAVITY * 0.8;
        pig.y += pig.vy;
        pig.x += pig.vx;
        pig.vx *= 0.95;
        
        if (pig.y + pig.radius > GROUND_Y) {
            pig.y = GROUND_Y - pig.radius;
            pig.vy = 0;
            pig.vx *= 0.8;
        }
    });
    
    balloons.forEach(balloon => {
        if (balloon.destroyed) return;
        
        balloon.vy += balloon.lift;
        balloon.vy *= 0.98;
        balloon.y += balloon.vy;
        
        if (balloon.y < -50) {
            balloon.destroyed = true;
        }
    });
    
    explosions.forEach(exp => {
        exp.frame++;
    });
    explosions = explosions.filter(exp => exp.frame < exp.maxFrames);
    
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY * 0.5;
        p.life -= 0.02;
    });
    particles = particles.filter(p => p.life > 0);
    
    checkCollisions();
    checkStructureCollapse();
    checkWinCondition();
    checkBirdsStopped();
}

function checkCollisions() {
    birds.forEach(bird => {
        if (!bird.isLaunched || bird.isDragging || bird.skillChecked) return;
        
        blocks.forEach(block => {
            if (block.destroyed) return;
            
            if (circleRectCollision(bird, block)) {
                handleBirdBlockCollision(bird, block);
            }
        });
        
        pigs.forEach(pig => {
            if (pig.destroyed) return;
            
            if (circleCollision(bird, pig)) {
                handleBirdPigCollision(bird, pig);
            }
        });
        
        balloons.forEach(balloon => {
            if (balloon.destroyed) return;
            
            if (circleCollision(bird, balloon)) {
                balloon.destroyed = true;
                createParticles(balloon.x, balloon.y, '#E91E63', 10);
                bird.vy *= 0.5;
            }
        });
    });
    
    eggs.forEach(egg => {
        if (egg.destroyed) return;
        
        blocks.forEach(block => {
            if (block.destroyed) return;
            
            if (circleRectCollision({ x: egg.x, y: egg.y, radius: 15 }, block)) {
                createExplosion(egg.x, egg.y, 80);
                egg.destroyed = true;
            }
        });
        
        pigs.forEach(pig => {
            if (pig.destroyed) return;
            
            if (circleCollision({ x: egg.x, y: egg.y, radius: 15 }, pig)) {
                createExplosion(egg.x, egg.y, 80);
                egg.destroyed = true;
            }
        });
    });
    
    checkBlockBlockCollisions();
}

function handleBirdBlockCollision(bird, block) {
    const impactForce = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
    
    if (impactForce > 3) {
        block.health--;
        block.isStatic = false;
        block.vx = bird.vx * 0.5 / (block.density || 1);
        block.vy = bird.vy * 0.3;
        
        bird.vx *= -0.3;
        bird.vy *= -0.3;
        
        createParticles(block.x + block.width / 2, block.y + block.height / 2, blockTypes[block.type].color, 5);
        
        if (block.health <= 0) {
            if (blockTypes[block.type].explosive) {
                createExplosion(block.x + block.width / 2, block.y + block.height / 2, 100);
            }
            block.destroyed = true;
            gameState.score += blockTypes[block.type].points;
            updateStars(gameState.score);
            updateUI();
        }
    }
}

function handleBirdPigCollision(bird, pig) {
    const impactForce = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
    
    if (impactForce > 2) {
        pig.health--;
        pig.vx = bird.vx * 0.5;
        pig.vy = bird.vy * 0.3;
        
        bird.vx *= -0.4;
        bird.vy *= -0.4;
        
        createParticles(pig.x, pig.y, '#8BC34A', 8);
        
        if (pig.health <= 0) {
            pig.destroyed = true;
            gameState.score += pig.isBoss ? 2000 : 500;
            createParticles(pig.x, pig.y, '#FFD700', 20);
            updateStars(gameState.score);
            updateUI();
        }
    }
}

function checkBlockBlockCollisions() {
    for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
            const b1 = blocks[i];
            const b2 = blocks[j];
            
            if (b1.destroyed || b2.destroyed) continue;
            if (b1.isStatic && b2.isStatic) continue;
            
            if (rectCollision(b1, b2)) {
                const impactForce = Math.sqrt(
                    Math.pow(b1.vx - b2.vx, 2) + Math.pow(b1.vy - b2.vy, 2)
                );
                
                const tempVx = b1.vx;
                const tempVy = b1.vy;
                b1.vx = b2.vx * 0.5;
                b1.vy = b2.vy * 0.5;
                b2.vx = tempVx * 0.5;
                b2.vy = tempVy * 0.5;
                
                b1.isStatic = false;
                b2.isStatic = false;
                
                if (impactForce > 5) {
                    b1.health -= 0.5;
                    b2.health -= 0.5;
                    
                    if (b1.health <= 0) {
                        if (blockTypes[b1.type].explosive) {
                            createExplosion(b1.x + b1.width / 2, b1.y + b1.height / 2, 100);
                        }
                        b1.destroyed = true;
                        gameState.score += blockTypes[b1.type].points;
                    }
                    if (b2.health <= 0) {
                        if (blockTypes[b2.type].explosive) {
                            createExplosion(b2.x + b2.width / 2, b2.y + b2.height / 2, 100);
                        }
                        b2.destroyed = true;
                        gameState.score += blockTypes[b2.type].points;
                    }
                    updateStars(gameState.score);
                    updateUI();
                }
                
                const overlapX = (b1.x + b1.width / 2) - (b2.x + b2.width / 2);
                const overlapY = (b1.y + b1.height / 2) - (b2.y + b2.height / 2);
                
                if (Math.abs(overlapX) > Math.abs(overlapY)) {
                    if (overlapX > 0) { b1.x += 3; b2.x -= 3; }
                    else { b1.x -= 3; b2.x += 3; }
                } else {
                    if (overlapY > 0) { b1.y += 3; b2.y -= 3; }
                    else { b1.y -= 3; b2.y += 3; }
                }
            }
        }
    }
    
    blocks.forEach(block => {
        if (block.destroyed || block.isStatic) return;
        
        pigs.forEach(pig => {
            if (pig.destroyed) return;
            
            if (circleRectCollision(pig, block)) {
                const impactForce = Math.sqrt(block.vx * block.vx + block.vy * block.vy);
                
                if (impactForce > 3) {
                    pig.health--;
                    pig.vx = block.vx * 0.5;
                    pig.vy = block.vy * 0.3;
                    
                    if (pig.health <= 0) {
                        pig.destroyed = true;
                        gameState.score += pig.isBoss ? 2000 : 500;
                        createParticles(pig.x, pig.y, '#FFD700', 20);
                        updateStars(gameState.score);
                        updateUI();
                    }
                }
            }
        });
    });
}

function checkStructureCollapse() {
    blocks.forEach(block => {
        if (block.destroyed || block.isStatic) return;
        
        let hasSupport = false;
        blocks.forEach(other => {
            if (other === block || other.destroyed) return;
            if (block.y + block.height >= other.y - 5 && 
                block.y + block.height <= other.y + 10 &&
                block.x + block.width > other.x &&
                block.x < other.x + other.width) {
                hasSupport = true;
            }
        });
        
        if (block.y + block.height >= GROUND_Y - 5) {
            hasSupport = true;
        }
        
        if (!hasSupport && Math.abs(block.vy) < 0.5) {
            block.isStatic = false;
        }
    });
}

function createExplosion(x, y, radius) {
    explosions.push({
        x: x,
        y: y,
        radius: radius,
        frame: 0,
        maxFrames: 20
    });
    
    createParticles(x, y, '#FF6600', 30);
    createParticles(x, y, '#FFCC00', 20);
    
    blocks.forEach(block => {
        if (block.destroyed) return;
        const blockCenterX = block.x + block.width / 2;
        const blockCenterY = block.y + block.height / 2;
        const dist = Math.sqrt(Math.pow(x - blockCenterX, 2) + Math.pow(y - blockCenterY, 2));
        
        if (dist < radius * 1.5) {
            const force = (radius * 1.5 - dist) / radius;
            const angle = Math.atan2(blockCenterY - y, blockCenterX - x);
            block.isStatic = false;
            block.vx += Math.cos(angle) * force * 15;
            block.vy += Math.sin(angle) * force * 15 - 5;
            block.health -= force * 3;
            
            if (block.health <= 0) {
                if (blockTypes[block.type].explosive) {
                    setTimeout(() => createExplosion(blockCenterX, blockCenterY, 80), 100);
                }
                block.destroyed = true;
                gameState.score += blockTypes[block.type].points;
            }
        }
    });
    
    pigs.forEach(pig => {
        if (pig.destroyed) return;
        const dist = Math.sqrt(Math.pow(x - pig.x, 2) + Math.pow(y - pig.y, 2));
        
        if (dist < radius * 1.5) {
            const force = (radius * 1.5 - dist) / radius;
            const angle = Math.atan2(pig.y - y, pig.x - x);
            pig.vx += Math.cos(angle) * force * 10;
            pig.vy += Math.sin(angle) * force * 10 - 3;
            pig.health -= force * 3;
            
            if (pig.health <= 0) {
                pig.destroyed = true;
                gameState.score += pig.isBoss ? 2000 : 500;
                createParticles(pig.x, pig.y, '#FFD700', 20);
            }
        }
    });
    
    birds.forEach(bird => {
        if (!bird.isLaunched) return;
        const dist = Math.sqrt(Math.pow(x - bird.x, 2) + Math.pow(y - bird.y, 2));
        
        if (dist < radius) {
            const angle = Math.atan2(bird.y - y, bird.x - x);
            const force = (radius - dist) / radius * 8;
            bird.vx += Math.cos(angle) * force;
            bird.vy += Math.sin(angle) * force;
        }
    });
    
    balloons.forEach(balloon => {
        if (balloon.destroyed) return;
        const dist = Math.sqrt(Math.pow(x - balloon.x, 2) + Math.pow(y - balloon.y, 2));
        
        if (dist < radius) {
            balloon.destroyed = true;
            createParticles(balloon.x, balloon.y, '#E91E63', 10);
        }
    });
    
    updateStars(gameState.score);
    updateUI();
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 3,
            size: Math.random() * 8 + 4,
            color: color,
            life: 1
        });
    }
}

function useSkill(bird) {
    if (bird.skillUsed || !bird.isLaunched || bird.skill === 'none') return;
    
    bird.skillUsed = true;
    gameState.skillUsed = true;
    
    switch (bird.skill) {
        case 'split':
            const angles = [-0.3, 0, 0.3];
            angles.forEach(angleOffset => {
                const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
                const currentAngle = Math.atan2(bird.vy, bird.vx);
                const newAngle = currentAngle + angleOffset;
                
                const newBird = createBird(
                    'blue',
                    bird.x,
                    bird.y,
                    Math.cos(newAngle) * speed,
                    Math.sin(newAngle) * speed
                );
                newBird.skillUsed = true;
                birds.push(newBird);
            });
            createParticles(bird.x, bird.y, '#2196F3', 15);
            break;
            
        case 'boost':
            const boostSpeed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
            const boostAngle = Math.atan2(bird.vy, bird.vx);
            bird.vx = Math.cos(boostAngle) * (boostSpeed + 15);
            bird.vy = Math.sin(boostAngle) * (boostSpeed + 15);
            createParticles(bird.x, bird.y, '#FFC107', 10);
            break;
            
        case 'explode':
            createExplosion(bird.x, bird.y, 120);
            bird.destroyed = true;
            break;
            
        case 'boomerang':
            bird.vx *= -0.8;
            bird.vy -= 5;
            createParticles(bird.x, bird.y, '#4CAF50', 10);
            break;
            
        case 'egg':
            eggs.push({
                x: bird.x,
                y: bird.y + 20,
                vx: bird.vx * 0.5,
                vy: 2,
                rotation: 0,
                destroyed: false
            });
            bird.vy -= 3;
            createParticles(bird.x, bird.y, '#FFF8E1', 8);
            break;
    }
}

function checkBirdsStopped() {
    if (gameState.waitingForNextBird || gameState.gameOver || gameState.levelComplete) return;
    
    const launchedBirds = birds.filter(b => b.isLaunched && !b.destroyed && !b.outOfBounds);
    
    if (launchedBirds.length === 0 && birds.filter(b => !b.isLaunched).length === 0) {
        const allStopped = eggs.every(e => e.destroyed) && 
                          explosions.length === 0;
        
        if (allStopped) {
            nextBird();
        }
        return;
    }
    
    const allStopped = launchedBirds.every(b => {
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        return speed < 1 && b.y + b.radius >= GROUND_Y - 5;
    });
    
    const eggsStopped = eggs.every(e => e.destroyed);
    const explosionsStopped = explosions.length === 0;
    
    if (allStopped && eggsStopped && explosionsStopped && launchedBirds.length > 0) {
        setTimeout(() => {
            if (!gameState.waitingForNextBird && !gameState.gameOver && !gameState.levelComplete) {
                nextBird();
            }
        }, 800);
    }
}

function nextBird() {
    if (gameState.waitingForNextBird) return;
    gameState.waitingForNextBird = true;
    
    birds = birds.filter(b => !b.isLaunched);
    
    if (gameState.birdsLeft[gameState.currentBirdType] > 0) {
        gameState.birdsLeft[gameState.currentBirdType]--;
    }
    
    if (pigs.every(p => p.destroyed)) {
        return;
    }
    
    const hasMoreBirds = Object.values(gameState.birdsLeft).some(count => count > 0);
    
    if (!hasMoreBirds) {
        showMessage('游戏失败!', '小猪们还活着，再试一次吧!', false);
        gameState.gameOver = true;
    } else {
        setTimeout(() => {
            selectNextAvailableBird();
            gameState.waitingForNextBird = false;
        }, 600);
    }
}

function checkWinCondition() {
    if (gameState.gameOver || gameState.levelComplete) return;
    
    const allPigsDestroyed = pigs.every(p => p.destroyed);
    
    if (allPigsDestroyed) {
        gameState.levelComplete = true;
        gameState.score += Object.values(gameState.birdsLeft).reduce((a, b) => a + b, 0) * 500;
        updateStars(gameState.score);
        updateUI();
        
        if (!gameState.isCustomLevel) {
            const nextLevel = getNextLevel();
            if (nextLevel) {
                showMessage('关卡完成!', `获得 ${Object.values(gameState.birdsLeft).reduce((a, b) => a + b, 0) * 500} 额外分数!`, true);
            } else {
                showMessage('恭喜通关!', `最终得分: ${gameState.score}`, false);
            }
        } else {
            showMessage('自定义关卡完成!', `最终得分: ${gameState.score}`, false);
        }
    }
}

function getNextLevel() {
    const maxChapter = chapters.length;
    if (gameState.chapter > maxChapter) return null;
    
    const chapter = chapters[gameState.chapter - 1];
    if (gameState.level < chapter.levels) {
        return { chapter: gameState.chapter, level: gameState.level + 1 };
    } else if (gameState.chapter < maxChapter) {
        return { chapter: gameState.chapter + 1, level: 1 };
    }
    return null;
}

function circleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (c1.radius || c1.r) + (c2.radius || c2.r);
}

function circleRectCollision(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
}

function rectCollision(r1, r2) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
}

function showMessage(title, text, showContinue) {
    document.getElementById('messageTitle').textContent = title;
    document.getElementById('messageText').textContent = text;
    
    const starsDisplay = document.getElementById('starsDisplay');
    starsDisplay.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
        const star = document.createElement('span');
        star.className = 'star' + (i <= gameState.stars ? ' earned' : '');
        star.textContent = '★';
        starsDisplay.appendChild(star);
    }
    
    document.getElementById('continueBtn').style.display = showContinue ? 'inline-block' : 'none';
    document.getElementById('gameMessage').style.display = 'block';
}

function hideMessage() {
    document.getElementById('gameMessage').style.display = 'none';
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

canvas.addEventListener('mousedown', (e) => {
    if (gameState.gameOver || gameState.levelComplete) return;
    
    const pos = getMousePos(e);
    
    const flyingBird = birds.find(b => b.isLaunched && !b.skillUsed && b.skill !== 'none');
    if (flyingBird) {
        useSkill(flyingBird);
        return;
    }
    
    const readyBird = birds.find(b => !b.isLaunched && !b.isDragging);
    if (readyBird && !gameState.waitingForNextBird) {
        const dx = pos.x - readyBird.x;
        const dy = pos.y - readyBird.y;
        
        if (Math.sqrt(dx * dx + dy * dy) < readyBird.radius + 20) {
            readyBird.isDragging = true;
            document.getElementById('skillHint').classList.add('show');
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const draggingBird = birds.find(b => b.isDragging);
    if (!draggingBird) return;
    
    const pos = getMousePos(e);
    const dx = pos.x - slingshot.x;
    const dy = pos.y - (slingshot.y - 30);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 150;
    
    if (distance > maxDistance) {
        const angle = Math.atan2(dy, dx);
        draggingBird.x = slingshot.x + Math.cos(angle) * maxDistance;
        draggingBird.y = slingshot.y - 30 + Math.sin(angle) * maxDistance;
    } else {
        draggingBird.x = pos.x;
        draggingBird.y = pos.y;
    }
});

canvas.addEventListener('mouseup', () => {
    const draggingBird = birds.find(b => b.isDragging);
    if (!draggingBird) return;
    
    draggingBird.isDragging = false;
    draggingBird.isLaunched = true;
    
    const dx = slingshot.x - draggingBird.x;
    const dy = slingshot.y - 30 - draggingBird.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
    const angle = Math.atan2(dy, dx);
    
    draggingBird.vx = Math.cos(angle) * power * 0.15;
    draggingBird.vy = Math.sin(angle) * power * 0.15;
    
    document.getElementById('skillHint').classList.remove('show');
});

canvas.addEventListener('mouseleave', () => {
    const draggingBird = birds.find(b => b.isDragging);
    if (draggingBird) {
        draggingBird.isDragging = false;
        draggingBird.x = slingshot.x;
        draggingBird.y = slingshot.y - 30;
    }
    document.getElementById('skillHint').classList.remove('show');
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});

document.querySelectorAll('.bird-option').forEach(option => {
    option.addEventListener('click', () => {
        const type = option.dataset.type;
        if (gameState.birdsLeft[type] > 0 && !gameState.waitingForNextBird) {
            const readyBird = birds.find(b => !b.isLaunched);
            if (readyBird) {
                birds = birds.filter(b => b !== readyBird);
            }
            gameState.currentBirdType = type;
            spawnBird();
            updateBirdSelector();
        }
    });
});

document.getElementById('restartBtn').addEventListener('click', () => {
    hideMessage();
    if (gameState.isCustomLevel) {
        initCustomLevel(currentLevelData);
    } else {
        initLevel(gameState.chapter, gameState.level);
    }
});

document.getElementById('nextLevelBtn').addEventListener('click', () => {
    hideMessage();
    const next = getNextLevel();
    if (next) {
        initLevel(next.chapter, next.level);
    }
});

document.getElementById('retryBtn').addEventListener('click', () => {
    hideMessage();
    if (gameState.isCustomLevel) {
        initCustomLevel(currentLevelData);
    } else {
        initLevel(gameState.chapter, gameState.level);
    }
});

document.getElementById('continueBtn').addEventListener('click', () => {
    hideMessage();
    const next = getNextLevel();
    if (next) {
        initLevel(next.chapter, next.level);
    }
});

document.getElementById('chapterSelectBtn').addEventListener('click', () => {
    renderChapterGrid();
    document.getElementById('chapterModal').style.display = 'block';
});

function renderChapterGrid() {
    const grid = document.getElementById('chapterGrid');
    grid.innerHTML = '';
    
    chapters.forEach(chapter => {
        const card = document.createElement('div');
        card.className = 'chapter-card' + (chapter.unlocked ? '' : ' locked');
        card.innerHTML = `
            <h3>${chapter.id}</h3>
            <div>${chapter.name}</div>
            <div class="levels">${chapter.levels} 关${chapter.isBoss ? ' (BOSS)' : ''}</div>
        `;
        
        if (chapter.unlocked) {
            card.addEventListener('click', () => {
                document.getElementById('chapterModal').style.display = 'none';
                initLevel(chapter.id, 1);
            });
        }
        
        grid.appendChild(card);
    });
}

document.getElementById('editorBtn').addEventListener('click', () => {
    document.getElementById('editorModal').style.display = 'block';
    initEditor();
});

function initEditor() {
    const editorCanvas = document.getElementById('editorCanvas');
    const eCtx = editorCanvas.getContext('2d');
    
    editorState.editorBlocks = [];
    editorState.editorPigs = [];
    editorState.editorBirds = { red: 3, blue: 0, yellow: 0, black: 0, green: 0, white: 0 };
    
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tool === editorState.currentTool) {
            btn.classList.add('active');
        }
    });
    
    function drawEditor() {
        eCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
        
        eCtx.fillStyle = '#87CEEB';
        eCtx.fillRect(0, 0, editorCanvas.width, 350);
        eCtx.fillStyle = '#8B4513';
        eCtx.fillRect(0, 350, editorCanvas.width, editorCanvas.height - 350);
        eCtx.fillStyle = '#4CAF50';
        eCtx.fillRect(0, 350, editorCanvas.width, 10);
        
        eCtx.fillStyle = '#654321';
        eCtx.fillRect(100, 280, 20, 80);
        eCtx.fillStyle = '#FF5722';
        eCtx.beginPath();
        eCtx.arc(110, 260, 15, 0, Math.PI * 2);
        eCtx.fill();
        
        editorState.editorBlocks.forEach(block => {
            eCtx.fillStyle = blockTypes[block.type].color;
            eCtx.fillRect(block.x, block.y, block.width, block.height);
            eCtx.strokeStyle = '#000';
            eCtx.lineWidth = 2;
            eCtx.strokeRect(block.x, block.y, block.width, block.height);
        });
        
        editorState.editorPigs.forEach(pig => {
            eCtx.fillStyle = '#8BC34A';
            eCtx.beginPath();
            eCtx.arc(pig.x, pig.y, pig.radius || 20, 0, Math.PI * 2);
            eCtx.fill();
        });
        
        requestAnimationFrame(drawEditor);
    }
    
    drawEditor();
}

document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        editorState.currentTool = btn.dataset.tool;
    });
});

document.getElementById('editorCanvas').addEventListener('click', (e) => {
    const editorCanvas = document.getElementById('editorCanvas');
    const rect = editorCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const tool = editorState.currentTool;
    
    if (tool === 'eraser') {
        editorState.editorBlocks = editorState.editorBlocks.filter(b => 
            !(x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height)
        );
        editorState.editorPigs = editorState.editorPigs.filter(p => {
            const dx = x - p.x;
            const dy = y - p.y;
            return Math.sqrt(dx * dx + dy * dy) > (p.radius || 20);
        });
    } else if (tool.startsWith('block_')) {
        const blockType = tool.replace('block_', '');
        editorState.editorBlocks.push({
            x: x - 30,
            y: y - 30,
            width: 60,
            height: 60,
            type: blockType
        });
    } else if (tool === 'pig') {
        editorState.editorPigs.push({ x, y, radius: 20, health: 2 });
    } else if (tool === 'boss_pig') {
        editorState.editorPigs.push({ x, y, radius: 40, health: 10, isBoss: true });
    } else if (tool === 'tnt') {
        editorState.editorBlocks.push({
            x: x - 30,
            y: y - 30,
            width: 60,
            height: 60,
            type: 'tnt'
        });
    } else if (tool === 'balloon') {
        editorState.editorBlocks.push({
            x: x - 20,
            y: y - 20,
            width: 40,
            height: 40,
            type: 'ice'
        });
    } else if (tool.startsWith('bird_')) {
        const birdType = tool.replace('bird_', '');
        editorState.editorBirds[birdType] = (editorState.editorBirds[birdType] || 0) + 1;
    }
});

document.getElementById('clearEditorBtn').addEventListener('click', () => {
    editorState.editorBlocks = [];
    editorState.editorPigs = [];
    editorState.editorBirds = { red: 3, blue: 0, yellow: 0, black: 0, green: 0, white: 0 };
});

document.getElementById('saveLevelBtn').addEventListener('click', () => {
    const levelData = {
        birds: editorState.editorBirds,
        blocks: editorState.editorBlocks,
        pigs: editorState.editorPigs,
        stars: { one: 500, two: 1000, three: 1500 }
    };
    
    const code = btoa(JSON.stringify(levelData));
    document.getElementById('levelCode').textContent = '关卡代码: ' + code;
    document.getElementById('levelCode').style.display = 'block';
});

document.getElementById('loadLevelBtn').addEventListener('click', () => {
    const code = prompt('请输入关卡代码:');
    if (code) {
        try {
            const levelData = JSON.parse(atob(code));
            editorState.editorBlocks = levelData.blocks || [];
            editorState.editorPigs = levelData.pigs || [];
            editorState.editorBirds = levelData.birds || { red: 3 };
        } catch (e) {
            alert('无效的关卡代码!');
        }
    }
});

document.getElementById('testLevelBtn').addEventListener('click', () => {
    if (editorState.editorPigs.length === 0) {
        alert('请至少添加一只小猪!');
        return;
    }
    
    const levelData = {
        birds: editorState.editorBirds,
        blocks: editorState.editorBlocks.map(b => ({ ...b, y: b.y + 70 })),
        pigs: editorState.editorPigs.map(p => ({ ...p, y: p.y + 70 })),
        stars: { one: 500, two: 1000, three: 1500 }
    };
    
    document.getElementById('editorModal').style.display = 'none';
    initCustomLevel(levelData);
});

document.getElementById('shareLevelBtn').addEventListener('click', () => {
    const levelData = {
        birds: editorState.editorBirds,
        blocks: editorState.editorBlocks,
        pigs: editorState.editorPigs,
        stars: { one: 500, two: 1000, three: 1500 }
    };
    
    const code = btoa(JSON.stringify(levelData));
    prompt('复制以下关卡代码分享给好友:', code);
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGround();
    drawSlingshot();
    drawTrajectory();
    drawBalloons();
    drawBlocks();
    drawPigs();
    drawBirds();
    drawEggs();
    drawExplosions();
    drawParticles();
    
    updatePhysics();
    
    requestAnimationFrame(gameLoop);
}

initLevel(1, 1);
gameLoop();
