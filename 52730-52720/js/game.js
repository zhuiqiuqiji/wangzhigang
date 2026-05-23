const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.querySelector('.game-container');

if (!ctx.roundRect) {
    ctx.roundRect = function(x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            const defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (const side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        this.beginPath();
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this;
    };
}

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const skinScreen = document.getElementById('skinScreen');
const settingScreen = document.getElementById('settingScreen');
const rankScreen = document.getElementById('rankScreen');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const homeBtn = document.getElementById('homeBtn');
const skinBtn = document.getElementById('skinBtn');
const skinBackBtn = document.getElementById('skinBackBtn');
const settingBtn = document.getElementById('settingBtn');
const settingBackBtn = document.getElementById('settingBackBtn');
const rankBtn = document.getElementById('rankBtn');
const rankBackBtn = document.getElementById('rankBackBtn');
const pauseBtn = document.getElementById('pauseBtn');

const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const finalHighScoreElement = document.getElementById('finalHighScore');
const comboElement = document.getElementById('combo');
const comboDisplay = document.querySelector('.combo-display');
const maxComboElement = document.getElementById('maxCombo');
const platformsHitElement = document.getElementById('platformsHit');
const newRecordText = document.querySelector('.new-record');

const powerupIndicator = document.getElementById('powerupIndicator');
const powerupIcon = document.getElementById('powerupIcon');
const powerupTimer = document.getElementById('powerupTimer');

const skinGrid = document.getElementById('skinGrid');
const rankList = document.getElementById('rankList');
const controlModeSelect = document.getElementById('controlMode');
const themeSelect = document.getElementById('themeSelect');
const soundEnabled = document.getElementById('soundEnabled');

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('doodleHighScore')) || 0;
let coins = parseInt(localStorage.getItem('doodleCoins')) || 0;
let combo = 0;
let maxCombo = 0;
let platformsHit = 0;
let lastPlatformTime = 0;

const GRAVITY = 0.5;
const JUMP_FORCE = -15;
const MOVE_SPEED = 6;
const PLATFORM_COUNT = 10;

let settings = JSON.parse(localStorage.getItem('doodleSettings')) || {
    controlMode: 'keyboard',
    theme: 'paper',
    sound: true
};

let selectedSkin = localStorage.getItem('doodleSkin') || 'default';
let unlockedSkins = JSON.parse(localStorage.getItem('doodleUnlockedSkins')) || ['default'];

let leaderboard = JSON.parse(localStorage.getItem('doodleLeaderboard')) || [];

const SKINS = [
    { id: 'default', name: '小紫怪', color: '#a78bfa', price: 0 },
    { id: 'ninja', name: '忍者', color: '#1f2937', price: 500 },
    { id: 'fire', name: '火焰侠', color: '#ef4444', price: 800 },
    { id: 'ice', name: '冰霜王', color: '#3b82f6', price: 800 },
    { id: 'gold', name: '黄金战士', color: '#fbbf24', price: 1500 },
    { id: 'rainbow', name: '彩虹精灵', color: 'rainbow', price: 2000 },
    { id: 'alien', name: '外星来客', color: '#22c55e', price: 1200 },
    { id: 'robot', name: '机器人', color: '#6b7280', price: 1000 },
    { id: 'ghost', name: '幽灵', color: '#e5e7eb', price: 1800 }
];

const THEMES = {
    paper: { bg: '#f9f3e3', platform: '#4ade80' },
    space: { bg: '#1a1a2e', platform: '#a855f7' },
    forest: { bg: '#90EE90', platform: '#228B22' },
    ocean: { bg: '#87CEEB', platform: '#20B2AA' }
};

const player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 150,
    width: 40,
    height: 50,
    velocityX: 0,
    velocityY: 0,
    facingRight: true,
    invincible: false,
    invincibleTimer: 0,
    powerup: null,
    powerupTimer: 0,
    doubleJump: false,
    canDoubleJump: false
};

let platforms = [];
let powerups = [];
let enemies = [];
let particles = [];
let floatingTexts = [];

let cameraY = 0;
let maxHeight = 0;
let keys = { left: false, right: false };
let tiltX = 0;

class Platform {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 70;
        this.height = 15;
        this.scored = false;
        this.type = type;
        this.initType();
    }

    initType() {
        switch (this.type) {
            case 'moving':
                this.moveDirection = Math.random() > 0.5 ? 1 : -1;
                this.moveSpeed = 2 + Math.random() * 2;
                break;
            case 'fragile':
                this.broken = false;
                this.breakTimer = 0;
                break;
            case 'bouncy':
                this.bounceForce = JUMP_FORCE * 1.5;
                break;
            case 'disappearing':
                this.visible = true;
                this.disappearTimer = 0;
                this.touched = false;
                break;
        }
    }

    update() {
        switch (this.type) {
            case 'moving':
                this.x += this.moveSpeed * this.moveDirection;
                if (this.x <= 0 || this.x >= CANVAS_WIDTH - this.width) {
                    this.moveDirection *= -1;
                }
                break;
            case 'fragile':
                if (this.broken) {
                    this.breakTimer++;
                    if (this.breakTimer > 30) {
                        this.remove = true;
                    }
                }
                break;
            case 'disappearing':
                if (this.touched) {
                    this.disappearTimer++;
                    if (this.disappearTimer > 20) {
                        this.visible = false;
                    }
                    if (this.disappearTimer > 100) {
                        this.visible = true;
                        this.touched = false;
                        this.disappearTimer = 0;
                    }
                }
                break;
        }
    }

    draw() {
        if (this.type === 'disappearing' && !this.visible) return;
        
        const screenY = this.y - cameraY;
        ctx.save();

        if (this.type === 'fragile' && this.broken) {
            ctx.globalAlpha = 1 - this.breakTimer / 30;
        }

        let color = '#4ade80';
        switch (this.type) {
            case 'moving':
                color = '#60a5fa';
                break;
            case 'fragile':
                color = '#f87171';
                break;
            case 'bouncy':
                color = '#fbbf24';
                break;
            case 'disappearing':
                color = this.visible ? '#a78bfa' : 'transparent';
                if (this.touched) ctx.globalAlpha = 0.5;
                break;
        }

        ctx.fillStyle = color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.roundRect(this.x, screenY, this.width, this.height, 5);
        ctx.fill();
        ctx.stroke();
        
        if (this.type === 'bouncy') {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + 10 + i * 20, screenY + 5);
                ctx.quadraticCurveTo(this.x + 20 + i * 20, screenY - 10, this.x + 30 + i * 20, screenY + 5);
                ctx.stroke();
            }
        } else if (this.type === 'fragile') {
            ctx.strokeStyle = '#991b1b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x + 20, screenY);
            ctx.lineTo(this.x + 35, screenY + this.height);
            ctx.moveTo(this.x + 50, screenY);
            ctx.lineTo(this.x + 45, screenY + this.height);
            ctx.stroke();
        } else if (this.type === 'normal' || this.type === 'moving') {
            ctx.strokeStyle = this.type === 'normal' ? '#22c55e' : '#3b82f6';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const grassX = this.x + 15 + i * 20;
                ctx.beginPath();
                ctx.moveTo(grassX, screenY);
                ctx.lineTo(grassX - 3, screenY - 8);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(grassX + 5, screenY);
                ctx.lineTo(grassX + 8, screenY - 6);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }

    onCollision(player) {
        switch (this.type) {
            case 'fragile':
                this.broken = true;
                return JUMP_FORCE;
            case 'bouncy':
                return this.bounceForce;
            case 'disappearing':
                this.touched = true;
                return JUMP_FORCE;
            default:
                return JUMP_FORCE;
        }
    }
}

class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.bobOffset += 0.1;
    }

    draw() {
        if (this.collected) return;
        
        const screenY = this.y - cameraY + Math.sin(this.bobOffset) * 5;
        
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let emoji = '🎁';
        switch (this.type) {
            case 'spring': emoji = '🥾'; break;
            case 'rocket': emoji = '🚀'; break;
            case 'shield': emoji = '🛡️'; break;
        }
        
        ctx.fillText(emoji, this.x + this.width / 2, screenY + this.height / 2);
        ctx.restore();
    }

    onCollect(player) {
        this.collected = true;
        player.powerup = this.type;
        player.powerupTimer = 300;
        
        switch (this.type) {
            case 'spring':
                player.doubleJump = true;
                player.canDoubleJump = true;
                break;
            case 'rocket':
                player.velocityY = JUMP_FORCE * 2;
                break;
            case 'shield':
                player.invincible = true;
                break;
        }
        
        addScore(50, this.x, this.y - cameraY, '+50 🎁');
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 40;
        this.height = 40;
        this.active = true;
        this.initType();
    }

    initType() {
        switch (this.type) {
            case 'blackhole':
                this.width = 60;
                this.height = 60;
                this.rotation = 0;
                break;
            case 'missile':
                this.width = 50;
                this.height = 20;
                this.speed = 3;
                this.direction = Math.random() > 0.5 ? 1 : -1;
                break;
            case 'spike':
                this.width = 30;
                this.height = 35;
                break;
            case 'monster':
                this.width = 45;
                this.height = 40;
                this.speed = 1.5;
                this.direction = Math.random() > 0.5 ? 1 : -1;
                this.animFrame = 0;
                break;
        }
    }

    update() {
        switch (this.type) {
            case 'blackhole':
                this.rotation += 0.05;
                break;
            case 'missile':
            case 'monster':
                this.x += this.speed * this.direction;
                if (this.x <= 0 || this.x >= CANVAS_WIDTH - this.width) {
                    this.direction *= -1;
                }
                this.animFrame = (this.animFrame + 0.1) % 2;
                break;
        }
    }

    draw() {
        if (!this.active) return;
        
        const screenY = this.y - cameraY;
        ctx.save();
        
        switch (this.type) {
            case 'blackhole':
                ctx.translate(this.x + this.width / 2, screenY + this.height / 2);
                ctx.rotate(this.rotation);
                
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
                gradient.addColorStop(0, '#000');
                gradient.addColorStop(0.5, '#4c1d95');
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(0, 0, 20 + i * 3, i * 0.5, i * 0.5 + Math.PI);
                    ctx.stroke();
                }
                break;
                
            case 'missile':
                ctx.fillStyle = '#ef4444';
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                if (this.direction > 0) {
                    ctx.moveTo(this.x, screenY + 10);
                    ctx.lineTo(this.x + 40, screenY + 10);
                    ctx.lineTo(this.x + 50, screenY + 10);
                    ctx.lineTo(this.x + 40, screenY);
                    ctx.lineTo(this.x + 40, screenY + 20);
                    ctx.lineTo(this.x + 50, screenY + 10);
                } else {
                    ctx.moveTo(this.x + 50, screenY + 10);
                    ctx.lineTo(this.x + 10, screenY + 10);
                    ctx.lineTo(this.x, screenY + 10);
                    ctx.lineTo(this.x + 10, screenY);
                    ctx.lineTo(this.x + 10, screenY + 20);
                    ctx.lineTo(this.x, screenY + 10);
                }
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                const flameX = this.direction > 0 ? this.x - 10 : this.x + 50;
                ctx.moveTo(flameX, screenY + 10);
                ctx.lineTo(flameX - 10 + Math.random() * 5, screenY + 5);
                ctx.lineTo(flameX - 10 + Math.random() * 5, screenY + 15);
                ctx.fill();
                break;
                
            case 'spike':
                ctx.fillStyle = '#6b7280';
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.moveTo(this.x + 15, screenY + 35);
                ctx.lineTo(this.x + 5, screenY + 35);
                ctx.lineTo(this.x + 15, screenY);
                ctx.fill();
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(this.x + 25, screenY + 35);
                ctx.lineTo(this.x + 15, screenY + 35);
                ctx.lineTo(this.x + 25, screenY + 5);
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'monster':
                ctx.fillStyle = '#22c55e';
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 3;
                
                ctx.beginPath();
                ctx.ellipse(this.x + 22, screenY + 20, 20, 18, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x + 15, screenY + 15, 6, 0, Math.PI * 2);
                ctx.arc(this.x + 30, screenY + 15, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(this.x + 16 + this.direction * 2, screenY + 15, 3, 0, Math.PI * 2);
                ctx.arc(this.x + 31 + this.direction * 2, screenY + 15, 3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x + 10, screenY + 3);
                ctx.lineTo(this.x + 15, screenY - 8);
                ctx.moveTo(this.x + 35, screenY + 3);
                ctx.lineTo(this.x + 30, screenY - 8);
                ctx.stroke();
                
                const legOffset = Math.sin(this.animFrame * Math.PI) * 3;
                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.ellipse(this.x + 12, screenY + 38 + legOffset, 5, 4, 0, 0, Math.PI * 2);
                ctx.ellipse(this.x + 32, screenY + 38 - legOffset, 5, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }

    checkCollision(player) {
        if (!this.active) return false;
        
        return (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 30;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.2;
        this.life--;
    }

    draw() {
        if (this.life <= 0) return;
        const screenY = this.y - cameraY;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 30;
        ctx.beginPath();
        ctx.arc(this.x, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function initPlatforms() {
    platforms = [];
    platforms.push(new Platform(CANVAS_WIDTH / 2 - 35, CANVAS_HEIGHT - 100, 'normal'));
    
    for (let i = 1; i < PLATFORM_COUNT; i++) {
        const x = Math.random() * (CANVAS_WIDTH - 70);
        const y = CANVAS_HEIGHT - 100 - i * 80;
        platforms.push(createPlatform(x, y, i));
    }
}

function createPlatform(x, y, heightIndex) {
    const difficulty = Math.min(heightIndex / 20, 1);
    const rand = Math.random();
    
    let type = 'normal';
    if (rand < 0.15 + difficulty * 0.1) {
        type = 'moving';
    } else if (rand < 0.25 + difficulty * 0.1) {
        type = 'fragile';
    } else if (rand < 0.35) {
        type = 'bouncy';
    } else if (rand < 0.45 + difficulty * 0.15) {
        type = 'disappearing';
    }
    
    return new Platform(x, y, type);
}

function generatePlatform() {
    const highestPlatform = platforms.reduce((min, p) => p.y < min.y ? p : min, platforms[0]);
    const x = Math.random() * (CANVAS_WIDTH - 70);
    const y = highestPlatform.y - 60 - Math.random() * 40;
    const heightIndex = Math.abs(y) / 80;
    platforms.push(createPlatform(x, y, heightIndex));
    
    if (Math.random() < 0.08 && powerups.length < 3) {
        const powerupTypes = ['spring', 'rocket', 'shield'];
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        powerups.push(new Powerup(x + 20, y - 40, type));
    }
    
    if (Math.random() < 0.05 + heightIndex / 100 && enemies.length < 5) {
        const enemyTypes = ['spike', 'monster', 'missile', 'blackhole'];
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemyX = Math.random() * (CANVAS_WIDTH - 60);
        enemies.push(new Enemy(enemyX, y - 100, type));
    }
}

function drawPlayer() {
    const screenY = player.y - cameraY;
    
    ctx.save();
    
    if (!player.facingRight) {
        ctx.translate(player.x + player.width, screenY);
        ctx.scale(-1, 1);
        ctx.translate(-player.x, -screenY);
    }
    
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    const skin = SKINS.find(s => s.id === selectedSkin) || SKINS[0];
    let bodyColor = skin.color;
    
    if (bodyColor === 'rainbow') {
        const hue = (Date.now() / 10) % 360;
        bodyColor = `hsl(${hue}, 70%, 60%)`;
    }
    
    if (player.powerup === 'rocket' && player.velocityY < 0) {
        ctx.fillStyle = '#fbbf24';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
                player.x + 20 + (Math.random() - 0.5) * 20,
                screenY + 55 + i * 10 + Math.random() * 10,
                8 - i,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.ellipse(player.x + 20, screenY + 25, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    if (player.powerup === 'shield' || player.invincible) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
        ctx.beginPath();
        ctx.arc(player.x + 20, screenY + 25, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(player.x + 14, screenY + 18, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(player.x + 28, screenY + 18, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(player.x + 16, screenY + 19, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 30, screenY + 19, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.ellipse(player.x + 8, screenY + 28, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(player.x + 32, screenY + 28, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 22, screenY + 32, 5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    
    if (player.powerup === 'spring') {
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(player.x + 10, screenY + 48, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(player.x + 30, screenY + 48, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + 10, screenY + 5);
    ctx.quadraticCurveTo(player.x + 8, screenY - 10, player.x + 15, screenY - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(player.x + 30, screenY + 5);
    ctx.quadraticCurveTo(player.x + 32, screenY - 10, player.x + 25, screenY - 8);
    ctx.stroke();
    
    ctx.restore();
}

function updatePlayer() {
    if (settings.controlMode === 'keyboard') {
        if (keys.left) {
            player.velocityX = -MOVE_SPEED;
            player.facingRight = false;
        } else if (keys.right) {
            player.velocityX = MOVE_SPEED;
            player.facingRight = true;
        } else {
            player.velocityX *= 0.9;
        }
    } else if (settings.controlMode === 'tilt') {
        if (tiltX !== 0) {
            player.velocityX = tiltX * MOVE_SPEED;
            player.facingRight = tiltX > 0;
        } else {
            player.velocityX *= 0.9;
        }
    } else if (settings.controlMode === 'touch') {
        if (keys.left) {
            player.velocityX = -MOVE_SPEED;
            player.facingRight = false;
        } else if (keys.right) {
            player.velocityX = MOVE_SPEED;
            player.facingRight = true;
        } else {
            player.velocityX *= 0.9;
        }
    }
    
    player.velocityY += GRAVITY;
    
    if (player.powerup === 'rocket' && player.velocityY < 0) {
        player.velocityY = Math.max(player.velocityY, JUMP_FORCE * 1.5);
    }
    
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    if (player.x + player.width <= 0) {
        player.x = CANVAS_WIDTH - player.width / 2;
    } else if (player.x >= CANVAS_WIDTH) {
        player.x = -player.width / 2;
    }
    
    if (player.powerup) {
        player.powerupTimer--;
        if (player.powerupTimer <= 0) {
            if (player.powerup === 'shield') {
                player.invincible = false;
            }
            player.powerup = null;
            player.doubleJump = false;
            player.canDoubleJump = false;
        }
    }
    
    if (player.invincible && !player.powerup) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }
    
    if (player.powerup) {
        updatePowerupIndicator();
    } else {
        powerupIndicator.classList.add('hidden');
    }
}

function updatePowerupIndicator() {
    powerupIndicator.classList.remove('hidden');
    const seconds = Math.ceil(player.powerupTimer / 60);
    
    switch (player.powerup) {
        case 'spring':
            powerupIcon.textContent = '🥾';
            break;
        case 'rocket':
            powerupIcon.textContent = '🚀';
            break;
        case 'shield':
            powerupIcon.textContent = '🛡️';
            break;
    }
    powerupTimer.textContent = `${seconds}s`;
}

function checkCollisions() {
    if (player.velocityY > 0 || player.powerup === 'rocket') {
        for (const platform of platforms) {
            if (platform.type === 'disappearing' && !platform.visible) continue;
            if (platform.remove) continue;
            
            const playerBottom = player.y + player.height;
            const playerLeft = player.x + 5;
            const playerRight = player.x + player.width - 5;
            
            if (
                playerBottom >= platform.y &&
                playerBottom <= platform.y + platform.height + player.velocityY + 10 &&
                playerRight > platform.x &&
                playerLeft < platform.x + platform.width
            ) {
                const jumpForce = platform.onCollision(player);
                player.y = platform.y - player.height;
                player.velocityY = jumpForce;
                
                if (player.powerup === 'spring' && player.canDoubleJump) {
                    player.velocityY = jumpForce * 1.3;
                    player.canDoubleJump = false;
                    setTimeout(() => player.canDoubleJump = true, 500);
                }
                
                if (!platform.scored && platform.type !== 'disappearing') {
                    platform.scored = true;
                    platformsHit++;
                    
                    const now = Date.now();
                    if (now - lastPlatformTime < 1000) {
                        combo++;
                        if (combo > maxCombo) maxCombo = combo;
                    } else {
                        combo = 1;
                    }
                    lastPlatformTime = now;
                    
                    const comboBonus = Math.floor(combo * 5);
                    const baseScore = 10;
                    addScore(baseScore + comboBonus, player.x, player.y - cameraY);
                    
                    if (combo >= 3) {
                        showCombo();
                    }
                }
                
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(player.x + 20, player.y + player.height, '#fbbf24'));
                }
                
                break;
            }
        }
    }
    
    for (const powerup of powerups) {
        if (!powerup.collected && 
            player.x < powerup.x + powerup.width &&
            player.x + player.width > powerup.x &&
            player.y < powerup.y + powerup.height &&
            player.y + player.height > powerup.y) {
            powerup.onCollect(player);
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(powerup.x + 15, powerup.y + 15, '#ffd700'));
            }
        }
    }
    
    if (!player.invincible) {
        for (const enemy of enemies) {
            if (enemy.checkCollision(player)) {
                if (enemy.type === 'blackhole') {
                    endGame();
                    return;
                }
                
                if (player.velocityY > 0 && player.y + player.height < enemy.y + enemy.height / 2) {
                    enemy.active = false;
                    player.velocityY = JUMP_FORCE;
                    addScore(100, enemy.x, enemy.y - cameraY, '+100 💀');
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(enemy.x + 20, enemy.y + 20, '#ef4444'));
                    }
                } else {
                    endGame();
                    return;
                }
            }
        }
    }
}

function addScore(points, x, y, text = null) {
    score += points;
    scoreElement.textContent = score;
    
    floatingTexts.push({
        x: x,
        y: y,
        text: text || `+${points}`,
        life: 60,
        color: '#4ade80'
    });
}

function showCombo() {
    comboElement.textContent = combo;
    comboDisplay.classList.remove('hidden');
    comboDisplay.style.animation = 'none';
    comboDisplay.offsetHeight;
    comboDisplay.style.animation = 'comboPop 0.3s ease-out';
}

function updateCamera() {
    const targetCameraY = player.y - CANVAS_HEIGHT / 3;
    
    if (targetCameraY < cameraY) {
        cameraY = targetCameraY;
    }
    
    if (player.y < maxHeight) {
        const heightGain = Math.floor((maxHeight - player.y) / 10);
        if (heightGain > 0) {
            score += heightGain;
            scoreElement.textContent = score;
        }
        maxHeight = player.y;
    }
}

function removeOffscreenObjects() {
    platforms = platforms.filter(p => !p.remove && p.y - cameraY < CANVAS_HEIGHT + 100);
    powerups = powerups.filter(p => !p.collected && p.y - cameraY < CANVAS_HEIGHT + 100);
    enemies = enemies.filter(e => e.active && e.y - cameraY < CANVAS_HEIGHT + 100);
    particles = particles.filter(p => p.life > 0);
    floatingTexts = floatingTexts.filter(t => t.life > 0);
    
    while (platforms.length < PLATFORM_COUNT) {
        generatePlatform();
    }
}

function updateFloatingTexts() {
    for (const text of floatingTexts) {
        text.y -= 1;
        text.life--;
    }
}

function drawFloatingTexts() {
    for (const text of floatingTexts) {
        ctx.save();
        ctx.globalAlpha = text.life / 60;
        ctx.fillStyle = text.color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.font = 'bold 18px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.strokeText(text.text, text.x, text.y);
        ctx.fillText(text.text, text.x, text.y);
        ctx.restore();
    }
}

function checkGameOver() {
    const playerScreenY = player.y - cameraY;
    if (playerScreenY > CANVAS_HEIGHT + 50) {
        endGame();
    }
}

function gameLoop() {
    if (!gameRunning) return;
    if (gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    platforms.forEach(p => p.update());
    powerups.forEach(p => p.update());
    enemies.forEach(e => e.update());
    particles.forEach(p => p.update());
    updateFloatingTexts();
    
    updatePlayer();
    checkCollisions();
    updateCamera();
    removeOffscreenObjects();
    
    platforms.forEach(p => p.draw());
    powerups.forEach(p => p.draw());
    enemies.forEach(e => e.draw());
    particles.forEach(p => p.draw());
    
    drawPlayer();
    drawFloatingTexts();
    
    checkGameOver();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    combo = 0;
    maxCombo = 0;
    platformsHit = 0;
    cameraY = 0;
    maxHeight = 0;
    keys.left = false;
    keys.right = false;
    tiltX = 0;
    lastPlatformTime = 0;
    
    player.x = CANVAS_WIDTH / 2 - 20;
    player.y = CANVAS_HEIGHT - 150;
    player.velocityX = 0;
    player.velocityY = JUMP_FORCE;
    player.facingRight = true;
    player.invincible = false;
    player.powerup = null;
    player.doubleJump = false;
    player.canDoubleJump = false;
    
    platforms = [];
    powerups = [];
    enemies = [];
    particles = [];
    floatingTexts = [];
    
    initPlatforms();
    
    scoreElement.textContent = score;
    comboDisplay.classList.add('hidden');
    powerupIndicator.classList.add('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    
    gameLoop();
}

function endGame() {
    gameRunning = false;
    
    let isNewRecord = false;
    if (score > highScore) {
        highScore = score;
        isNewRecord = true;
        localStorage.setItem('doodleHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    coins += Math.floor(score / 10);
    localStorage.setItem('doodleCoins', coins);
    
    addToLeaderboard(score);
    
    finalScoreElement.textContent = score;
    finalHighScoreElement.textContent = highScore;
    maxComboElement.textContent = maxCombo;
    platformsHitElement.textContent = platformsHit;
    
    if (isNewRecord) {
        newRecordText.classList.remove('hidden');
    } else {
        newRecordText.classList.add('hidden');
    }
    
    pauseBtn.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

function addToLeaderboard(score) {
    const entry = {
        name: '玩家',
        score: score,
        date: new Date().toLocaleDateString()
    };
    
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    localStorage.setItem('doodleLeaderboard', JSON.stringify(leaderboard));
}

function initSkinShop() {
    skinGrid.innerHTML = '';
    
    SKINS.forEach(skin => {
        const isUnlocked = unlockedSkins.includes(skin.id);
        const isSelected = selectedSkin === skin.id;
        
        const item = document.createElement('div');
        item.className = `skin-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        
        let colorStyle = skin.color;
        if (skin.color === 'rainbow') {
            colorStyle = 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)';
        }
        
        item.innerHTML = `
            <div class="skin-preview">
                <div style="width: 36px; height: 44px; background: ${colorStyle}; border-radius: 50%; border: 2px solid #333;"></div>
            </div>
            <div class="skin-name">${skin.name}</div>
            <div class="skin-price">${isUnlocked ? (isSelected ? '✓ 使用中' : '点击使用') : `💰 ${skin.price}`}</div>
        `;
        
        item.addEventListener('click', () => {
            if (isUnlocked) {
                selectedSkin = skin.id;
                localStorage.setItem('doodleSkin', selectedSkin);
                initSkinShop();
            } else if (coins >= skin.price) {
                coins -= skin.price;
                unlockedSkins.push(skin.id);
                localStorage.setItem('doodleCoins', coins);
                localStorage.setItem('doodleUnlockedSkins', JSON.stringify(unlockedSkins));
                selectedSkin = skin.id;
                localStorage.setItem('doodleSkin', selectedSkin);
                initSkinShop();
            } else {
                alert(`金币不足！需要 ${skin.price} 金币，当前 ${coins} 金币`);
            }
        });
        
        skinGrid.appendChild(item);
    });
}

function initLeaderboard() {
    rankList.innerHTML = '';
    
    if (leaderboard.length === 0) {
        rankList.innerHTML = '<p style="text-align: center; color: #888;">暂无记录，快去挑战吧！</p>';
        return;
    }
    
    leaderboard.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = `rank-item ${index === 0 ? 'top1' : ''} ${index === 1 ? 'top2' : ''} ${index === 2 ? 'top3' : ''}`;
        
        item.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${entry.name}</div>
                <div class="rank-score">${entry.score} 分 · ${entry.date}</div>
            </div>
        `;
        
        rankList.appendChild(item);
    });
}

function applySettings() {
    controlModeSelect.value = settings.controlMode;
    themeSelect.value = settings.theme;
    soundEnabled.checked = settings.sound;
    
    gameContainer.className = 'game-container';
    if (settings.theme !== 'paper') {
        gameContainer.classList.add(`theme-${settings.theme}`);
    }
}

function showScreen(screen) {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    skinScreen.classList.add('hidden');
    settingScreen.classList.add('hidden');
    rankScreen.classList.add('hidden');
    screen.classList.remove('hidden');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === 'Escape' && gameRunning) {
        gamePaused = !gamePaused;
        if (gamePaused) {
            showScreen(startScreen);
        } else {
            startScreen.classList.add('hidden');
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

window.addEventListener('deviceorientation', (e) => {
    if (e.gamma !== null) {
        tiltX = Math.max(-1, Math.min(1, e.gamma / 30));
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    if (touch.clientX - rect.left < CANVAS_WIDTH / 2) {
        keys.left = true;
    } else {
        keys.right = true;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.left = false;
    keys.right = false;
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
homeBtn.addEventListener('click', () => showScreen(startScreen));

skinBtn.addEventListener('click', () => {
    initSkinShop();
    showScreen(skinScreen);
});
skinBackBtn.addEventListener('click', () => showScreen(startScreen));

settingBtn.addEventListener('click', () => {
    applySettings();
    showScreen(settingScreen);
});
settingBackBtn.addEventListener('click', () => {
    settings.controlMode = controlModeSelect.value;
    settings.theme = themeSelect.value;
    settings.sound = soundEnabled.checked;
    localStorage.setItem('doodleSettings', JSON.stringify(settings));
    applySettings();
    showScreen(startScreen);
});

rankBtn.addEventListener('click', () => {
    initLeaderboard();
    showScreen(rankScreen);
});
rankBackBtn.addEventListener('click', () => showScreen(startScreen));

pauseBtn.addEventListener('click', () => {
    gamePaused = !gamePaused;
    if (gamePaused) {
        showScreen(startScreen);
    } else {
        startScreen.classList.add('hidden');
    }
});

themeSelect.addEventListener('change', () => {
    settings.theme = themeSelect.value;
    applySettings();
});

highScoreElement.textContent = highScore;
applySettings();
