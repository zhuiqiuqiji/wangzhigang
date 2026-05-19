const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TARGET_FPS = 60;
const FIXED_DT = 1 / TARGET_FPS;

let gameState = 'menu';
let score = 0;
let combo = 0;
let maxCombo = 0;
let totalJumps = 0;
let bestScore = parseInt(localStorage.getItem('jumpJumpBestScore') || '0');
let coins = parseInt(localStorage.getItem('jumpJumpCoins') || '0');

let lastTime = 0;
let accumulator = 0;

const gameConfig = {
    platformMinWidth: 70,
    platformMaxWidth: 130,
    platformHeight: 35,
    platformMinSpacing: 110,
    platformMaxSpacing: 260,
    minChargeTime: 100,
    maxChargeTime: 1500,
    gravity: 1700,
    minJumpVelocityX: 230,
    maxJumpVelocityX: 500,
    jumpVelocityY: 620,
    centerThreshold: 12,
    cameraSmooth: 4
};

const characterSkins = [
    { id: 'default', name: '经典方块', emoji: '🟦', price: 0, colors: { body: '#667eea', dark: '#5568d3', light: '#8b9af0' } },
    { id: 'gold', name: '黄金战士', emoji: '🟨', price: 500, colors: { body: '#fbbf24', dark: '#d97706', light: '#fde68a' } },
    { id: 'ruby', name: '红宝石', emoji: '🔴', price: 800, colors: { body: '#ef4444', dark: '#b91c1c', light: '#fca5a5' } },
    { id: 'emerald', name: '翡翠', emoji: '🟢', price: 800, colors: { body: '#10b981', dark: '#047857', light: '#6ee7b7' } },
    { id: 'crystal', name: '水晶', emoji: '💎', price: 1500, colors: { body: '#06b6d4', dark: '#0891b2', light: '#67e8f9' } },
    { id: 'shadow', name: '暗影', emoji: '🖤', price: 2000, colors: { body: '#4b5563', dark: '#1f2937', light: '#9ca3af' } },
    { id: 'rainbow', name: '彩虹', emoji: '🌈', price: 3000, colors: { body: 'linear', dark: 'linear', light: 'linear' } },
    { id: 'fire', name: '火焰', emoji: '🔥', price: 5000, colors: { body: '#f97316', dark: '#c2410c', light: '#fdba74' } },
    { id: 'ice', name: '冰霜', emoji: '❄️', price: 5000, colors: { body: '#3b82f6', dark: '#1d4ed8', light: '#93c5fd' } }
];

const platformThemes = [
    { id: 'classic', name: '经典彩虹', price: 0 },
    { id: 'ocean', name: '海洋蓝', price: 300 },
    { id: 'forest', name: '森林绿', price: 300 },
    { id: 'sunset', name: '日落橙', price: 500 },
    { id: 'candy', name: '糖果粉', price: 500 },
    { id: 'neon', name: '霓虹紫', price: 800 },
    { id: 'mono', name: '黑白极简', price: 1000 },
    { id: 'military', name: '迷彩军绿', price: 1500 }
];

const platformColorSchemes = {
    classic: [
        { top: '#ff6b6b', right: '#ee5a5a', left: '#d64545' },
        { top: '#feca57', right: '#f9b32f', left: '#e09e1a' },
        { top: '#48dbfb', right: '#0abde3', left: '#0097c9' },
        { top: '#1dd1a1', right: '#10ac84', left: '#0b8968' },
        { top: '#5f27cd', right: '#501fb0', left: '#3e178a' },
        { top: '#ff9ff3', right: '#f368e0', left: '#c44dbb' },
        { top: '#54a0ff', right: '#2e86de', left: '#1e6bb3' },
        { top: '#00d2d3', right: '#01a3a4', left: '#018485' }
    ],
    ocean: [
        { top: '#0077b6', right: '#023e8a', left: '#03045e' },
        { top: '#0096c7', right: '#0077b6', left: '#023e8a' },
        { top: '#48cae4', right: '#00b4d8', left: '#0096c7' },
        { top: '#90e0ef', right: '#48cae4', left: '#00b4d8' },
        { top: '#caf0f8', right: '#90e0ef', left: '#48cae4' }
    ],
    forest: [
        { top: '#2d6a4f', right: '#1b4332', left: '#081c15' },
        { top: '#40916c', right: '#2d6a4f', left: '#1b4332' },
        { top: '#52b788', right: '#40916c', left: '#2d6a4f' },
        { top: '#74c69d', right: '#52b788', left: '#40916c' },
        { top: '#95d5b2', right: '#74c69d', left: '#52b788' }
    ],
    sunset: [
        { top: '#ff7b00', right: '#e85d04', left: '#dc2f02' },
        { top: '#ff8800', right: '#ff7b00', left: '#e85d04' },
        { top: '#ff9500', right: '#ff8800', left: '#ff7b00' },
        { top: '#ffa200', right: '#ff9500', left: '#ff8800' },
        { top: '#ffaa00', right: '#ffa200', left: '#ff9500' }
    ],
    candy: [
        { top: '#ff4d6d', right: '#c9184a', left: '#800f2f' },
        { top: '#ff758f', right: '#ff4d6d', left: '#c9184a' },
        { top: '#ff8fa3', right: '#ff758f', left: '#ff4d6d' },
        { top: '#ffb3c1', right: '#ff8fa3', left: '#ff758f' },
        { top: '#ffccd5', right: '#ffb3c1', left: '#ff8fa3' }
    ],
    neon: [
        { top: '#9d4edd', right: '#7b2cbf', left: '#5a189a' },
        { top: '#c77dff', right: '#9d4edd', left: '#7b2cbf' },
        { top: '#e0aaff', right: '#c77dff', left: '#9d4edd' },
        { top: '#7400b8', right: '#5a189a', left: '#3c096c' },
        { top: '#6930c3', right: '#5a189a', left: '#480ca8' }
    ],
    mono: [
        { top: '#343a40', right: '#212529', left: '#0d1117' },
        { top: '#495057', right: '#343a40', left: '#212529' },
        { top: '#6c757d', right: '#495057', left: '#343a40' },
        { top: '#adb5bd', right: '#6c757d', left: '#495057' },
        { top: '#ced4da', right: '#adb5bd', left: '#6c757d' }
    ],
    military: [
        { top: '#4a4e3d', right: '#3a3d2e', left: '#2d2f22' },
        { top: '#6b705c', right: '#4a4e3d', left: '#3a3d2e' },
        { top: '#8d99ae', right: '#6b705c', left: '#4a4e3d' },
        { top: '#a8dadc', right: '#8d99ae', left: '#6b705c' },
        { top: '#778da9', right: '#415a77', left: '#1b263b' }
    ]
};

const seasonThemes = {
    spring: { bg: ['#a8e6cf', '#dcedc1'], particles: 'flower' },
    summer: { bg: ['#87ceeb', '#e0f7fa'], particles: 'sun' },
    autumn: { bg: ['#ffecd2', '#fcb69f'], particles: 'leaf' },
    winter: { bg: ['#e0eafc', '#cfdef3'], particles: 'snow' },
    night: { bg: ['#0f0c29', '#302b63', '#24243e'], particles: 'star' }
};

const platformTypes = ['normal', 'circle', 'rotating', 'moving', 'shrinking'];

let selectedCharacter = localStorage.getItem('jumpJumpSelectedCharacter') || 'default';
let selectedPlatformTheme = localStorage.getItem('jumpJumpSelectedTheme') || 'classic';
let selectedSeason = localStorage.getItem('jumpJumpSelectedSeason') || 'auto';
let settings = JSON.parse(localStorage.getItem('jumpJumpSettings') || '{"music":true,"sound":true,"vibration":true,"particles":true}');

let unlockedCharacters = JSON.parse(localStorage.getItem('jumpJumpUnlockedCharacters') || '["default"]');
let unlockedThemes = JSON.parse(localStorage.getItem('jumpJumpUnlockedThemes') || '["classic"]');
let leaderboard = JSON.parse(localStorage.getItem('jumpJumpLeaderboard') || '[]');

const player = {
    x: 0,
    y: 0,
    width: 28,
    height: 45,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    isCharging: false,
    chargeStartTime: 0,
    chargePower: 0,
    squash: 1,
    stretch: 1,
    rotation: 0
};

let platforms = [];
let currentPlatformIndex = 0;
let cameraX = 0;
let cameraY = 0;
let targetCameraX = 0;
let targetCameraY = 0;
let cameraShake = 0;

let particles = [];
let scorePopups = [];
let seasonParticles = [];

const ui = {
    scoreValue: document.getElementById('scoreValue'),
    comboValue: document.getElementById('comboValue'),
    comboPopup: document.getElementById('comboPopup'),
    powerBar: document.getElementById('powerBar'),
    powerBarContainer: document.querySelector('.power-bar-container'),
    startOverlay: document.getElementById('startOverlay'),
    pauseOverlay: document.getElementById('pauseOverlay'),
    gameOverOverlay: document.getElementById('gameOverOverlay'),
    skinsOverlay: document.getElementById('skinsOverlay'),
    leaderboardOverlay: document.getElementById('leaderboardOverlay'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    finalScoreValue: document.getElementById('finalScoreValue'),
    bestScoreValue: document.getElementById('bestScoreValue'),
    totalJumpsValue: document.getElementById('totalJumpsValue'),
    maxComboValue: document.getElementById('maxComboValue'),
    coinsValue: document.getElementById('coinsValue'),
    playerRankValue: document.getElementById('playerRankValue'),
    notification: document.getElementById('notification')
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function showNotification(message, duration = 2000) {
    ui.notification.textContent = message;
    ui.notification.classList.add('show');
    setTimeout(() => {
        ui.notification.classList.remove('show');
    }, duration);
}

function getCurrentSeason() {
    if (selectedSeason !== 'auto') return selectedSeason;
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
}

function getSeasonColors() {
    const season = getCurrentSeason();
    return seasonThemes[season].bg;
}

function createPlatform(x, y, width, colorIndex, type = 'normal') {
    const colors = platformColorSchemes[selectedPlatformTheme] || platformColorSchemes.classic;
    const color = colors[colorIndex % colors.length];
    
    const platform = {
        x: x,
        y: y,
        width: width,
        height: gameConfig.platformHeight,
        color: color,
        scale: 0,
        targetScale: 1,
        type: type,
        rotation: 0,
        rotationSpeed: type === 'rotating' ? (Math.random() > 0.5 ? 1 : -1) * 0.5 : 0,
        moveDirection: type === 'moving' ? 1 : 0,
        moveSpeed: type === 'moving' ? randomRange(30, 60) : 0,
        moveRange: type === 'moving' ? randomRange(30, 60) : 0,
        originalX: x,
        shrinkTimer: 0,
        touched: false
    };
    
    return platform;
}

function generatePlatformType() {
    const rand = Math.random();
    if (rand < 0.5) return 'normal';
    if (rand < 0.7) return 'circle';
    if (rand < 0.85) return 'moving';
    if (rand < 0.95) return 'rotating';
    return 'shrinking';
}

function initGame() {
    platforms = [];
    particles = [];
    scorePopups = [];
    seasonParticles = [];
    score = 0;
    combo = 0;
    maxCombo = 0;
    totalJumps = 0;
    currentPlatformIndex = 0;
    accumulator = 0;
    cameraShake = 0;
    lastTime = performance.now();
    
    const startX = canvas.width * 0.3;
    const startY = canvas.height * 0.55;
    
    platforms.push(createPlatform(startX, startY, 110, 0, 'normal'));
    platforms[0].scale = 1;
    
    for (let i = 1; i < 6; i++) {
        const prevPlatform = platforms[i - 1];
        const spacing = randomRange(gameConfig.platformMinSpacing, gameConfig.platformMaxSpacing);
        const width = randomRange(gameConfig.platformMinWidth, gameConfig.platformMaxWidth);
        const yOffset = randomRange(-40, 40);
        const type = i > 2 ? generatePlatformType() : 'normal';
        platforms.push(createPlatform(
            prevPlatform.x + prevPlatform.width / 2 + spacing,
            prevPlatform.y + yOffset,
            width,
            i,
            type
        ));
    }
    
    player.x = platforms[0].x;
    player.y = platforms[0].y - platforms[0].height / 2 - player.height / 2;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.isCharging = false;
    player.chargePower = 0;
    player.squash = 1;
    player.stretch = 1;
    player.rotation = 0;
    
    cameraX = player.x - canvas.width * 0.35;
    cameraY = player.y - canvas.height * 0.5;
    targetCameraX = cameraX;
    targetCameraY = cameraY;
    
    updateScoreDisplay();
    updateCoinsDisplay();
}

function drawBackground() {
    const colors = getSeasonColors();
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, colors[0]);
    if (colors[1]) gradient.addColorStop(1, colors[1]);
    if (colors[2]) gradient.addColorStop(0.5, colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (settings.particles) {
        drawSeasonParticles();
    }
}

function drawSeasonParticles() {
    const season = getCurrentSeason();
    
    if (season === 'winter') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        seasonParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (season === 'spring') {
        seasonParticles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            for (let i = 0; i < 5; i++) {
                ctx.rotate(Math.PI * 2 / 5);
                ctx.beginPath();
                ctx.ellipse(0, -p.size * 0.8, p.size * 0.4, p.size, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    } else if (season === 'autumn') {
        seasonParticles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    } else if (season === 'night') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        seasonParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.5 + Math.sin(p.twinkle) * 0.5), 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (season === 'summer') {
        seasonParticles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = i % 2 === 0 ? p.size : p.size * 0.5;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();
        });
    }
}

function updateSeasonParticles(dt) {
    const season = getCurrentSeason();
    const particleCount = season === 'night' ? 80 : 50;
    
    while (seasonParticles.length < particleCount) {
        if (season === 'winter') {
            seasonParticles.push({
                x: Math.random() * canvas.width,
                y: -10,
                vx: randomRange(-20, 20),
                vy: randomRange(30, 80),
                size: randomRange(2, 6),
                rotation: 0
            });
        } else if (season === 'spring') {
            seasonParticles.push({
                x: Math.random() * canvas.width,
                y: -10,
                vx: randomRange(-15, 15),
                vy: randomRange(20, 50),
                size: randomRange(4, 8),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: randomRange(-2, 2),
                color: ['#ffb6c1', '#ff69b4', '#ffc0cb'][Math.floor(Math.random() * 3)]
            });
        } else if (season === 'autumn') {
            seasonParticles.push({
                x: Math.random() * canvas.width,
                y: -10,
                vx: randomRange(-25, 25),
                vy: randomRange(25, 60),
                size: randomRange(5, 10),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: randomRange(-3, 3),
                color: ['#d2691e', '#ff8c00', '#daa520'][Math.floor(Math.random() * 3)]
            });
        } else if (season === 'night') {
            seasonParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: 0,
                vy: 0,
                size: randomRange(1, 3),
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: randomRange(1, 3)
            });
        } else if (season === 'summer') {
            seasonParticles.push({
                x: Math.random() * canvas.width,
                y: -10,
                vx: randomRange(-10, 10),
                vy: randomRange(15, 40),
                size: randomRange(3, 6),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: randomRange(-1, 1),
                color: ['#ffd700', '#ffeb3b', '#fff176'][Math.floor(Math.random() * 3)]
            });
        } else {
            seasonParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: 0,
                vy: 0,
                size: randomRange(2, 5),
                color: 'rgba(255, 255, 255, 0.5)'
            });
        }
    }
    
    for (let i = seasonParticles.length - 1; i >= 0; i--) {
        const p = seasonParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.rotationSpeed) p.rotation += p.rotationSpeed * dt;
        if (p.twinkleSpeed) p.twinkle += p.twinkleSpeed * dt;
        
        if (p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
            seasonParticles.splice(i, 1);
        }
    }
}

function drawPlatform(platform) {
    const x = platform.x - cameraX;
    const y = platform.y - cameraY;
    const w = platform.width * platform.scale;
    const h = platform.height * platform.scale;
    const perspective = 0.35;
    
    ctx.save();
    ctx.translate(x, y);
    
    if (platform.type === 'rotating') {
        ctx.rotate(platform.rotation);
    }
    
    if (platform.type === 'circle') {
        drawCirclePlatform(platform, w, h);
    } else {
        drawRectPlatform(platform, w, h, perspective);
    }
    
    ctx.restore();
}

function drawRectPlatform(platform, w, h, perspective) {
    const depth = 20;
    
    ctx.fillStyle = platform.color.right;
    ctx.beginPath();
    ctx.moveTo(w / 2, -h / 2);
    ctx.lineTo(w / 2 + w * perspective, h / 2);
    ctx.lineTo(w / 2 + w * perspective, h / 2 + depth);
    ctx.lineTo(w / 2, -h / 2 + depth);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = platform.color.left;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(-w / 2 + w * perspective, h / 2);
    ctx.lineTo(-w / 2 + w * perspective, h / 2 + depth);
    ctx.lineTo(-w / 2, -h / 2 + depth);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = platform.color.top;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.lineTo(w / 2 + w * perspective, h / 2);
    ctx.lineTo(-w / 2 + w * perspective, h / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.moveTo(-w / 2 + w * perspective, h / 2);
    ctx.lineTo(w / 2 + w * perspective, h / 2);
    ctx.lineTo(w / 2 + w * perspective, h / 2 + depth);
    ctx.lineTo(-w / 2 + w * perspective, h / 2 + depth);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 5, -h / 2 + 5);
    ctx.lineTo(w / 2 - 5, -h / 2 + 5);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(0, -h / 4, 4, 0, Math.PI * 2);
    ctx.fill();
    
    if (platform.type === 'moving') {
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(-platform.moveRange, -h / 2 - 10);
        ctx.lineTo(platform.moveRange, -h / 2 - 10);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    if (platform.type === 'shrinking' && platform.touched) {
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-w / 2 - 5, -h / 2 - 10, w + 10, h + depth + 15);
        ctx.setLineDash([]);
    }
}

function drawCirclePlatform(platform, w, h) {
    const radius = w / 2;
    const depth = 20;
    
    ctx.fillStyle = platform.color.right;
    ctx.beginPath();
    ctx.ellipse(0, h / 2 + depth / 2, radius, radius * 0.4, 0, 0, Math.PI);
    ctx.lineTo(radius, h / 2);
    ctx.ellipse(0, h / 2, radius, radius * 0.4, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = platform.color.left;
    ctx.beginPath();
    ctx.ellipse(0, h / 2 + depth / 2, radius, radius * 0.4, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(-radius, h / 2);
    ctx.ellipse(0, h / 2, radius, radius * 0.4, 0, Math.PI * 2, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = platform.color.top;
    ctx.beginPath();
    ctx.ellipse(0, h / 2, radius, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, h / 2, radius * 0.6, radius * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(0, h / 2 - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.ellipse(0, h / 2 + depth / 2, radius, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
}

function getCharacterSkin() {
    return characterSkins.find(s => s.id === selectedCharacter) || characterSkins[0];
}

function drawPlayer() {
    const skin = getCharacterSkin();
    const x = player.x - cameraX + (Math.random() - 0.5) * cameraShake;
    const y = player.y - cameraY + (Math.random() - 0.5) * cameraShake;
    const w = player.width * player.squash;
    const h = player.height * player.stretch;
    
    ctx.save();
    ctx.translate(x, y - h / 2);
    ctx.rotate(player.rotation);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, h / 2 + 5, w / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const bodyColor = skin.colors.body;
    const darkColor = skin.colors.dark;
    const lightColor = skin.colors.light;
    
    if (bodyColor === 'linear') {
        const gradient = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.2, '#ff7f00');
        gradient.addColorStop(0.4, '#ffff00');
        gradient.addColorStop(0.6, '#00ff00');
        gradient.addColorStop(0.8, '#0000ff');
        gradient.addColorStop(1, '#8b00ff');
        ctx.fillStyle = gradient;
    } else {
        const gradient = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        gradient.addColorStop(0, darkColor);
        gradient.addColorStop(0.5, bodyColor);
        gradient.addColorStop(1, darkColor);
        ctx.fillStyle = gradient;
    }
    
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + radius, 0);
    ctx.lineTo(w / 2 - radius, 0);
    ctx.quadraticCurveTo(w / 2, 0, w / 2, radius);
    ctx.lineTo(w / 2, h - radius);
    ctx.quadraticCurveTo(w / 2, h, w / 2 - radius, h);
    ctx.lineTo(-w / 2 + radius, h);
    ctx.quadraticCurveTo(-w / 2, h, -w / 2, h - radius);
    ctx.lineTo(-w / 2, radius);
    ctx.quadraticCurveTo(-w / 2, 0, -w / 2 + radius, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = bodyColor === 'linear' ? '#ffffff' : lightColor;
    ctx.fillRect(-w / 2 + 4, 4, 8, h - 8);
    
    const eyeY = h * 0.28;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5, eyeY, 5, 0, Math.PI * 2);
    ctx.arc(5, eyeY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(-5, eyeY, 2.5, 0, Math.PI * 2);
    ctx.arc(5, eyeY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6, eyeY - 1, 1, 0, Math.PI * 2);
    ctx.arc(4, eyeY - 1, 1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawParticles() {
    particles.forEach((particle, index) => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x - cameraX, particle.y - cameraY, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawScorePopups() {
    scorePopups.forEach((popup, index) => {
        ctx.save();
        ctx.globalAlpha = popup.alpha;
        ctx.fillStyle = popup.color;
        ctx.font = `bold ${popup.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(popup.text, popup.x - cameraX, popup.y - cameraY);
        ctx.restore();
    });
}

function createParticles(x, y, color, count) {
    if (!settings.particles) return;
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: randomRange(-150, 150),
            vy: randomRange(-300, -50),
            size: randomRange(3, 8),
            color: color,
            alpha: 1,
            decay: randomRange(1.5, 3)
        });
    }
}

function createScorePopup(x, y, text, color, size = 24) {
    scorePopups.push({
        x: x,
        y: y,
        text: text,
        color: color,
        size: size,
        alpha: 1,
        vy: -80,
        decay: 1.2
    });
}

function showComboPopup(text, color) {
    ui.comboPopup.textContent = text;
    ui.comboPopup.style.color = color;
    ui.comboPopup.classList.remove('show');
    void ui.comboPopup.offsetWidth;
    ui.comboPopup.classList.add('show');
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 500 * dt;
        p.alpha -= p.decay * dt;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateScorePopups(dt) {
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const popup = scorePopups[i];
        popup.y += popup.vy * dt;
        popup.alpha -= popup.decay * dt;
        if (popup.alpha <= 0) {
            scorePopups.splice(i, 1);
        }
    }
}

function updatePlatforms(dt) {
    platforms.forEach((platform, index) => {
        if (platform.scale < platform.targetScale) {
            platform.scale += 5 * dt;
            if (platform.scale > platform.targetScale) {
                platform.scale = platform.targetScale;
            }
        }
        
        if (platform.rotationSpeed) {
            platform.rotation += platform.rotationSpeed * dt;
        }
        
        if (platform.type === 'moving') {
            platform.x += platform.moveDirection * platform.moveSpeed * dt;
            if (Math.abs(platform.x - platform.originalX) > platform.moveRange) {
                platform.moveDirection *= -1;
            }
        }
        
        if (platform.type === 'shrinking' && platform.touched) {
            platform.shrinkTimer += dt;
            platform.scale = Math.max(0.3, 1 - platform.shrinkTimer * 0.5);
        }
    });
    
    const lastPlatform = platforms[platforms.length - 1];
    if (lastPlatform.x - cameraX < canvas.width + 300) {
        const spacing = randomRange(gameConfig.platformMinSpacing, gameConfig.platformMaxSpacing);
        const width = randomRange(gameConfig.platformMinWidth, gameConfig.platformMaxWidth);
        const yOffset = randomRange(-40, 40);
        const newY = Math.max(canvas.height * 0.35, Math.min(canvas.height * 0.75, lastPlatform.y + yOffset));
        const type = generatePlatformType();
        platforms.push(createPlatform(
            lastPlatform.x + lastPlatform.width / 2 + spacing,
            newY,
            width,
            platforms.length,
            type
        ));
    }
    
    if (platforms.length > 12 && platforms[0].x - cameraX < -300) {
        platforms.shift();
        currentPlatformIndex--;
    }
}

function updatePlayer(dt) {
    if (player.isJumping) {
        player.velocityY += gameConfig.gravity * dt;
        player.x += player.velocityX * dt;
        player.y += player.velocityY * dt;
        player.rotation += player.velocityX * 0.002 * dt;
        
        const targetStretch = Math.min(1.15, 1 + Math.abs(player.velocityY) * 0.0003);
        player.stretch += (targetStretch - player.stretch) * 10 * dt;
        player.squash = 1 - (player.stretch - 1) * 0.5;
        
        cameraShake = Math.max(0, cameraShake - 5 * dt);
        
        if (player.velocityY > 0) {
            checkLanding();
        }
    } else {
        if (!player.isCharging) {
            const currentPlatform = platforms[currentPlatformIndex];
            if (currentPlatform) {
                if (currentPlatform.type === 'moving') {
                    player.x += currentPlatform.moveDirection * currentPlatform.moveSpeed * dt;
                }
                
                if (currentPlatform.type === 'shrinking' && currentPlatform.touched) {
                    const halfWidth = currentPlatform.width / 2 * currentPlatform.scale;
                    const distFromCenter = Math.abs(player.x - currentPlatform.x);
                    if (distFromCenter > halfWidth) {
                        player.isJumping = true;
                        player.velocityX = 0;
                        player.velocityY = 0;
                    }
                }
            }
        }
        
        if (player.isCharging) {
            const chargeTime = Date.now() - player.chargeStartTime;
            player.chargePower = Math.min(chargeTime / gameConfig.maxChargeTime, 1);
            ui.powerBar.style.width = (player.chargePower * 100) + '%';
            
            const targetSquash = 0.7 + 0.3 * (1 - player.chargePower);
            player.squash += (targetSquash - player.squash) * 8 * dt;
            player.stretch = 1 + (1 - player.squash) * 0.5;
        } else {
            player.squash += (1 - player.squash) * 8 * dt;
            player.stretch += (1 - player.stretch) * 8 * dt;
            player.rotation += (0 - player.rotation) * 5 * dt;
        }
    }
}

function checkLanding() {
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        const platformTop = platform.y - platform.height / 2;
        const playerBottom = player.y + player.height / 2;
        
        if (playerBottom >= platformTop - 15 && playerBottom <= platformTop + 25) {
            const playerX = player.x;
            const halfWidth = platform.width / 2 * platform.scale;
            
            let landed = false;
            if (platform.type === 'circle') {
                const distFromCenter = Math.abs(playerX - platform.x);
                landed = distFromCenter <= halfWidth;
            } else if (platform.type === 'rotating') {
                const cos = Math.cos(-platform.rotation);
                const sin = Math.sin(-platform.rotation);
                const relX = playerX - platform.x;
                const relY = player.y - platform.y;
                const rotatedX = relX * cos + relY * sin;
                landed = Math.abs(rotatedX) <= halfWidth;
            } else {
                const platformLeft = platform.x - halfWidth;
                const platformRight = platform.x + halfWidth;
                landed = playerX >= platformLeft && playerX <= platformRight;
            }
            
            if (landed) {
                landOnPlatform(platform, i);
                return;
            }
        }
    }
    
    if (player.y - cameraY > canvas.height + 200) {
        gameOver();
    }
}

function landOnPlatform(platform, platformIndex) {
    player.isJumping = false;
    player.velocityX = 0;
    player.velocityY = 0;
    player.y = platform.y - platform.height / 2 - player.height / 2;
    player.rotation = 0;
    
    player.stretch = 0.85;
    player.squash = 1.15;
    cameraShake = 3;
    
    if (platform.type === 'shrinking') {
        platform.touched = true;
    }
    
    if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(10);
    }
    
    const distFromCenter = Math.abs(player.x - platform.x);
    let points = 1;
    let rating = 'good';
    
    if (distFromCenter <= gameConfig.centerThreshold) {
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        points = 2 * combo;
        rating = combo >= 5 ? 'perfect' : 'great';
        
        createParticles(platform.x, platform.y - platform.height / 2, '#ffd700', 25);
        createScorePopup(platform.x, platform.y - 70, `+${points}`, '#ffd700', 32);
        
        if (combo >= 5) {
            showComboPopup('PERFECT!', '#ffd700');
        } else if (combo >= 3) {
            showComboPopup('GREAT!', '#a855f7');
        }
        
        ui.comboValue.textContent = `连击 x${combo}`;
        ui.comboValue.classList.add('show');
        setTimeout(() => ui.comboValue.classList.remove('show'), 500);
    } else {
        combo = 0;
        createParticles(player.x, player.y + player.height / 2, '#ffffff', 12);
        createScorePopup(platform.x, platform.y - 60, `+${points}`, '#ffffff');
        ui.comboValue.textContent = '';
    }
    
    score += points;
    totalJumps++;
    updateScoreDisplay();
    
    if (platformIndex > currentPlatformIndex) {
        currentPlatformIndex = platformIndex;
    }
    
    targetCameraX = player.x - canvas.width * 0.35;
    targetCameraY = player.y - canvas.height * 0.5;
}

function jump() {
    if (player.isJumping || player.isCharging) return;
    
    const chargeTime = Date.now() - player.chargeStartTime;
    const normalizedPower = Math.max(chargeTime, gameConfig.minChargeTime) / gameConfig.maxChargeTime;
    const clampedPower = Math.min(normalizedPower, 1);
    
    const velocityX = gameConfig.minJumpVelocityX + (gameConfig.maxJumpVelocityX - gameConfig.minJumpVelocityX) * clampedPower;
    
    player.velocityX = velocityX;
    player.velocityY = -gameConfig.jumpVelocityY;
    player.isJumping = true;
    player.isCharging = false;
    player.chargePower = 0;
    
    ui.powerBarContainer.classList.remove('active');
    ui.powerBar.style.width = '0%';
    
    player.stretch = 1.2;
    player.squash = 0.85;
    
    createParticles(player.x, player.y + player.height / 2, '#888888', 10);
}

function startCharging() {
    if (player.isJumping || gameState !== 'playing') return;
    
    player.isCharging = true;
    player.chargeStartTime = Date.now();
    ui.powerBarContainer.classList.add('active');
}

function stopCharging() {
    if (player.isCharging && !player.isJumping) {
        jump();
    }
}

function updateCamera(dt) {
    cameraX += (targetCameraX - cameraX) * gameConfig.cameraSmooth * dt;
    cameraY += (targetCameraY - cameraY) * gameConfig.cameraSmooth * dt;
}

function updateScoreDisplay() {
    ui.scoreValue.textContent = score;
}

function updateCoinsDisplay() {
    ui.coinsValue.textContent = coins;
}

function gameOver() {
    gameState = 'gameover';
    
    const earnedCoins = Math.floor(score / 2);
    coins += earnedCoins;
    localStorage.setItem('jumpJumpCoins', coins);
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('jumpJumpBestScore', bestScore);
        showNotification('🎉 新纪录！');
    }
    
    addToLeaderboard(score);
    
    ui.finalScoreValue.textContent = score;
    ui.bestScoreValue.textContent = bestScore;
    ui.totalJumpsValue.textContent = totalJumps;
    ui.maxComboValue.textContent = maxCombo;
    
    checkUnlocks();
    
    setTimeout(() => {
        ui.gameOverOverlay.classList.remove('hidden');
    }, 600);
}

function addToLeaderboard(newScore) {
    const entry = {
        score: newScore,
        date: new Date().toISOString(),
        character: selectedCharacter
    };
    
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 100);
    localStorage.setItem('jumpJumpLeaderboard', JSON.stringify(leaderboard));
}

function checkUnlocks() {
    if (score >= 50 && !unlockedCharacters.includes('gold')) {
        unlockCharacter('gold');
    }
    if (score >= 100 && !unlockedCharacters.includes('ruby')) {
        unlockCharacter('ruby');
    }
    if (maxCombo >= 10 && !unlockedCharacters.includes('emerald')) {
        unlockCharacter('emerald');
    }
    if (totalJumps >= 500 && !unlockedCharacters.includes('crystal')) {
        unlockCharacter('crystal');
    }
    if (bestScore >= 200 && !unlockedCharacters.includes('shadow')) {
        unlockCharacter('shadow');
    }
    if (bestScore >= 500 && !unlockedCharacters.includes('rainbow')) {
        unlockCharacter('rainbow');
    }
    if (score >= 150 && !unlockedThemes.includes('ocean')) {
        unlockTheme('ocean');
    }
    if (combo >= 5 && !unlockedThemes.includes('forest')) {
        unlockTheme('forest');
    }
    if (score >= 300 && !unlockedThemes.includes('sunset')) {
        unlockTheme('sunset');
    }
    if (coins >= 1000 && !unlockedCharacters.includes('fire')) {
        unlockCharacter('fire');
    }
    if (coins >= 1000 && !unlockedCharacters.includes('ice')) {
        unlockCharacter('ice');
    }
}

function unlockCharacter(id) {
    if (!unlockedCharacters.includes(id)) {
        unlockedCharacters.push(id);
        localStorage.setItem('jumpJumpUnlockedCharacters', JSON.stringify(unlockedCharacters));
        const skin = characterSkins.find(s => s.id === id);
        if (skin) showNotification(`🎉 解锁新角色：${skin.name}`);
    }
}

function unlockTheme(id) {
    if (!unlockedThemes.includes(id)) {
        unlockedThemes.push(id);
        localStorage.setItem('jumpJumpUnlockedThemes', JSON.stringify(unlockedThemes));
        const theme = platformThemes.find(t => t.id === id);
        if (theme) showNotification(`🎉 解锁新主题：${theme.name}`);
    }
}

function startGame() {
    gameState = 'playing';
    ui.startOverlay.classList.add('hidden');
    ui.gameOverOverlay.classList.add('hidden');
    ui.pauseOverlay.classList.add('hidden');
    initGame();
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        ui.pauseOverlay.classList.remove('hidden');
    }
}

function resumeGame() {
    if (gameState === 'paused') {
        gameState = 'playing';
        ui.pauseOverlay.classList.add('hidden');
        lastTime = performance.now();
    }
}

function goToMenu() {
    gameState = 'menu';
    ui.startOverlay.classList.remove('hidden');
    ui.gameOverOverlay.classList.add('hidden');
    ui.pauseOverlay.classList.add('hidden');
}

function renderSkinsUI() {
    const charactersGrid = document.getElementById('charactersGrid');
    const platformsGrid = document.getElementById('platformsGrid');
    
    charactersGrid.innerHTML = '';
    platformsGrid.innerHTML = '';
    
    characterSkins.forEach(skin => {
        const isUnlocked = unlockedCharacters.includes(skin.id);
        const isSelected = selectedCharacter === skin.id;
        const card = document.createElement('div');
        card.className = `skin-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        card.innerHTML = `
            <div class="skin-preview" style="background: linear-gradient(135deg, ${skin.colors.dark || '#667eea'}, ${skin.colors.body || '#764ba2'})">${skin.emoji}</div>
            <div class="skin-name">${skin.name}</div>
            <div class="skin-price ${isUnlocked ? 'owned' : ''}">${isUnlocked ? '已拥有' : `${skin.price} 🪙`}</div>
        `;
        
        card.addEventListener('click', () => {
            if (isUnlocked) {
                selectedCharacter = skin.id;
                localStorage.setItem('jumpJumpSelectedCharacter', selectedCharacter);
                renderSkinsUI();
                showNotification(`已选择：${skin.name}`);
            } else if (coins >= skin.price) {
                if (confirm(`确定花费 ${skin.price} 🪙 解锁 ${skin.name}？`)) {
                    coins -= skin.price;
                    localStorage.setItem('jumpJumpCoins', coins);
                    unlockCharacter(skin.id);
                    selectedCharacter = skin.id;
                    localStorage.setItem('jumpJumpSelectedCharacter', selectedCharacter);
                    updateCoinsDisplay();
                    renderSkinsUI();
                }
            } else {
                showNotification('金币不足！');
            }
        });
        
        charactersGrid.appendChild(card);
    });
    
    platformThemes.forEach(theme => {
        const isUnlocked = unlockedThemes.includes(theme.id);
        const isSelected = selectedPlatformTheme === theme.id;
        const card = document.createElement('div');
        card.className = `skin-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        
        const colors = platformColorSchemes[theme.id] || platformColorSchemes.classic;
        const gradientColors = colors[0];
        
        card.innerHTML = `
            <div class="skin-preview" style="background: linear-gradient(135deg, ${gradientColors.top}, ${gradientColors.right})">🎨</div>
            <div class="skin-name">${theme.name}</div>
            <div class="skin-price ${isUnlocked ? 'owned' : ''}">${isUnlocked ? '已拥有' : `${theme.price} 🪙`}</div>
        `;
        
        card.addEventListener('click', () => {
            if (isUnlocked) {
                selectedPlatformTheme = theme.id;
                localStorage.setItem('jumpJumpSelectedTheme', selectedPlatformTheme);
                renderSkinsUI();
                showNotification(`已选择：${theme.name}`);
            } else if (coins >= theme.price) {
                if (confirm(`确定花费 ${theme.price} 🪙 解锁 ${theme.name}？`)) {
                    coins -= theme.price;
                    localStorage.setItem('jumpJumpCoins', coins);
                    unlockTheme(theme.id);
                    selectedPlatformTheme = theme.id;
                    localStorage.setItem('jumpJumpSelectedTheme', selectedPlatformTheme);
                    updateCoinsDisplay();
                    renderSkinsUI();
                }
            } else {
                showNotification('金币不足！');
            }
        });
        
        platformsGrid.appendChild(card);
    });
    
    updateCoinsDisplay();
}

function renderLeaderboardUI(type = 'local') {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    
    const displayList = type === 'local' ? leaderboard : generateMockGlobalLeaderboard();
    
    displayList.slice(0, 20).forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        const rankClass = index === 0 ? 'top1' : index === 1 ? 'top2' : index === 2 ? 'top3' : '';
        const isCurrentPlayer = type === 'local';
        
        if (isCurrentPlayer) item.classList.add('current');
        
        item.innerHTML = `
            <span class="rank-number ${rankClass}">${index + 1}</span>
            <div class="rank-avatar">${entry.name ? entry.name.charAt(0) : '我'}</div>
            <div class="rank-info">
                <span class="rank-name">${entry.name || '玩家'}</span>
            </div>
            <span class="rank-score">${entry.score}</span>
        `;
        list.appendChild(item);
    });
    
    const playerRank = leaderboard.findIndex(e => e.score === bestScore) + 1 || leaderboard.length + 1;
    ui.playerRankValue.textContent = playerRank > 100 ? '未上榜' : `第 ${playerRank} 名`;
}

function generateMockGlobalLeaderboard() {
    const names = ['小明', '小红', '大力', '阿杰', '小美', '大强', '阿花', '小龙', '小凤', '阿飞'];
    return Array.from({ length: 50 }, (_, i) => ({
        name: names[i % names.length],
        score: Math.floor(Math.random() * 500 + 50)
    })).sort((a, b) => b.score - a.score);
}

function gameLoop(currentTime) {
    const frameTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    
    if (gameState === 'playing') {
        accumulator += frameTime;
        
        while (accumulator >= FIXED_DT) {
            updatePlatforms(FIXED_DT);
            updatePlayer(FIXED_DT);
            updateCamera(FIXED_DT);
            updateParticles(FIXED_DT);
            updateScorePopups(FIXED_DT);
            updateSeasonParticles(FIXED_DT);
            accumulator -= FIXED_DT;
        }
    } else if (gameState === 'menu' || gameState === 'gameover') {
        accumulator += frameTime;
        while (accumulator >= FIXED_DT) {
            updateSeasonParticles(FIXED_DT);
            accumulator -= FIXED_DT;
        }
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    
    platforms.forEach(platform => drawPlatform(platform));
    drawParticles();
    drawScorePopups();
    
    if (gameState !== 'menu') drawPlayer();
    
    requestAnimationFrame(gameLoop);
}

function setupEventListeners() {
    window.addEventListener('resize', resizeCanvas);
    
    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (gameState === 'playing') startCharging();
    });
    
    canvas.addEventListener('mouseup', (e) => {
        e.preventDefault();
        stopCharging();
    });
    
    canvas.addEventListener('mouseleave', () => stopCharging());
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState === 'playing') startCharging();
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopCharging();
    });
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('skinsBtn').addEventListener('click', () => {
        renderSkinsUI();
        ui.skinsOverlay.classList.remove('hidden');
    });
    document.getElementById('leaderboardBtn').addEventListener('click', () => {
        renderLeaderboardUI('local');
        ui.leaderboardOverlay.classList.remove('hidden');
    });
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('seasonSelect').value = selectedSeason;
        document.getElementById('musicToggle').checked = settings.music;
        document.getElementById('soundToggle').checked = settings.sound;
        document.getElementById('vibrationToggle').checked = settings.vibration;
        document.getElementById('particlesToggle').checked = settings.particles;
        ui.settingsOverlay.classList.remove('hidden');
    });
    
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('pauseSkinsBtn').addEventListener('click', () => {
        renderSkinsUI();
        ui.skinsOverlay.classList.remove('hidden');
    });
    document.getElementById('pauseSettingsBtn').addEventListener('click', () => {
        document.getElementById('seasonSelect').value = selectedSeason;
        document.getElementById('musicToggle').checked = settings.music;
        document.getElementById('soundToggle').checked = settings.sound;
        document.getElementById('vibrationToggle').checked = settings.vibration;
        document.getElementById('particlesToggle').checked = settings.particles;
        ui.settingsOverlay.classList.remove('hidden');
    });
    document.getElementById('quitBtn').addEventListener('click', goToMenu);
    
    document.getElementById('restartBtn').addEventListener('click', startGame);
    document.getElementById('homeBtn').addEventListener('click', goToMenu);
    
    document.getElementById('closeSkinsBtn').addEventListener('click', () => {
        ui.skinsOverlay.classList.add('hidden');
    });
    
    document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
        ui.leaderboardOverlay.classList.add('hidden');
    });
    
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
        ui.settingsOverlay.classList.add('hidden');
    });
    
    document.querySelectorAll('.tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tabs .tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.getElementById(tab + 'Tab').classList.add('active');
        });
    });
    
    document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderLeaderboardUI(e.target.dataset.leaderboard);
        });
    });
    
    document.getElementById('seasonSelect').addEventListener('change', (e) => {
        selectedSeason = e.target.value;
        localStorage.setItem('jumpJumpSelectedSeason', selectedSeason);
        showNotification('季节主题已更新');
    });
    
    document.getElementById('musicToggle').addEventListener('change', (e) => {
        settings.music = e.target.checked;
        localStorage.setItem('jumpJumpSettings', JSON.stringify(settings));
    });
    
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        settings.sound = e.target.checked;
        localStorage.setItem('jumpJumpSettings', JSON.stringify(settings));
    });
    
    document.getElementById('vibrationToggle').addEventListener('change', (e) => {
        settings.vibration = e.target.checked;
        localStorage.setItem('jumpJumpSettings', JSON.stringify(settings));
    });
    
    document.getElementById('particlesToggle').addEventListener('change', (e) => {
        settings.particles = e.target.checked;
        localStorage.setItem('jumpJumpSettings', JSON.stringify(settings));
    });
    
    document.getElementById('resetDataBtn').addEventListener('click', () => {
        if (confirm('确定要重置所有游戏数据吗？此操作不可恢复！')) {
            localStorage.removeItem('jumpJumpBestScore');
            localStorage.removeItem('jumpJumpCoins');
            localStorage.removeItem('jumpJumpSelectedCharacter');
            localStorage.removeItem('jumpJumpSelectedTheme');
            localStorage.removeItem('jumpJumpSelectedSeason');
            localStorage.removeItem('jumpJumpSettings');
            localStorage.removeItem('jumpJumpUnlockedCharacters');
            localStorage.removeItem('jumpJumpUnlockedThemes');
            localStorage.removeItem('jumpJumpLeaderboard');
            location.reload();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (gameState === 'playing') {
                pauseGame();
            } else if (gameState === 'paused') {
                resumeGame();
            }
        }
    });
}

resizeCanvas();
setupEventListeners();
lastTime = performance.now();
requestAnimationFrame(gameLoop);
