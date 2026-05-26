const PHYSICS_MATERIALS = {
    ice: { friction: 0.001, bounce: 1.02, label: '冰面' },
    wood: { friction: 0.01, bounce: 0.95, label: '木板' },
    sand: { friction: 0.03, bounce: 0.85, label: '沙地' }
};

const FIELD_THEMES = {
    ice: {
        background: ['#e0f2fe', '#bae6fd', '#7dd3fc'],
        border: '#1e40af',
        accent: '245, 158, 11',
        goal1: '#3b82f6',
        goal2: '#ef4444',
        particleColor: '#60a5fa',
        label: '冰球场'
    },
    pingpong: {
        background: ['#1e3a5f', '#1e40af', '#1e3a5f'],
        border: '#f59e0b',
        accent: '245, 158, 11',
        goal1: '#f59e0b',
        goal2: '#ef4444',
        particleColor: '#fbbf24',
        label: '乒乓球桌'
    },
    beach: {
        background: ['#fef3c7', '#fde68a', '#fcd34d'],
        border: '#0891b2',
        accent: '245, 158, 11',
        goal1: '#06b6d4',
        goal2: '#f97316',
        particleColor: '#fbbf24',
        label: '沙滩球场'
    }
};

const AI_DIFFICULTIES = {
    easy: { reactionTime: 0.3, predictionAccuracy: 0.6, errorMargin: 30, speedMultiplier: 0.7 },
    medium: { reactionTime: 0.15, predictionAccuracy: 0.85, errorMargin: 15, speedMultiplier: 0.9 },
    hard: { reactionTime: 0.05, predictionAccuracy: 0.98, errorMargin: 5, speedMultiplier: 1.1 }
};

const SEASONS = {
    spring: { name: '春季赛', bonus: 1.0 },
    summer: { name: '夏季赛', bonus: 1.2 },
    autumn: { name: '秋季赛', bonus: 1.5 },
    winter: { name: '冬季赛', bonus: 2.0 }
};

class Paddle {
    constructor(x, y, width, height, color, isLeft, isAI = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isLeft = isLeft;
        this.isAI = isAI;
        this.baseSpeed = 8;
        this.speed = 8;
        this.velocityY = 0;
        this.baseHeight = height;
        this.isFrozen = false;
        this.freezeTime = 0;
        this.isExtended = false;
        this.extendTime = 0;
        this.aiTargetY = y;
        this.aiReactionDelay = 0;
    }

    moveUp() {
        if (!this.isFrozen) {
            this.velocityY = -this.speed;
        }
    }

    moveDown() {
        if (!this.isFrozen) {
            this.velocityY = this.speed;
        }
    }

    stop() {
        this.velocityY = 0;
    }

    extend(duration = 5000) {
        if (!this.isExtended) {
            this.isExtended = true;
            this.height = this.baseHeight * 1.5;
            this.extendTime = duration;
        }
    }

    freeze(duration = 2000) {
        this.isFrozen = true;
        this.freezeTime = duration;
        this.velocityY = 0;
    }

    update(canvasHeight, deltaTime = 16) {
        if (this.isFrozen) {
            this.freezeTime -= deltaTime;
            if (this.freezeTime <= 0) {
                this.isFrozen = false;
            }
        }

        if (this.isExtended) {
            this.extendTime -= deltaTime;
            if (this.extendTime <= 0) {
                this.isExtended = false;
                this.height = this.baseHeight;
            }
        }

        if (this.isAI && !this.isFrozen) {
            this.updateAI(canvasHeight);
        }

        this.y += this.velocityY;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvasHeight) {
            this.y = canvasHeight - this.height;
        }
    }

    updateAI(canvasHeight) {
        const centerY = this.y + this.height / 2;
        const diff = this.aiTargetY - centerY;
        const threshold = 5;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.velocityY = this.speed;
            } else {
                this.velocityY = -this.speed;
            }
        } else {
            this.velocityY = 0;
        }
    }

    updateAITarget(ball, canvasWidth, canvasHeight, difficulty) {
        if (this.aiReactionDelay > 0) {
            this.aiReactionDelay -= 16;
            return;
        }

        const aiDifficulty = AI_DIFFICULTIES[difficulty];
        this.speed = this.baseSpeed * aiDifficulty.speedMultiplier;

        const isMovingTowardAI = this.isLeft ? ball.speedX < 0 : ball.speedX > 0;
        
        if (isMovingTowardAI) {
            const predictedY = this.predictBallPosition(ball, canvasWidth, canvasHeight, aiDifficulty);
            this.aiTargetY = predictedY + (Math.random() - 0.5) * aiDifficulty.errorMargin * 2;
            this.aiReactionDelay = aiDifficulty.reactionTime * 1000;
        } else {
            this.aiTargetY = canvasHeight / 2 + (Math.random() - 0.5) * 50;
        }
    }

    predictBallPosition(ball, canvasWidth, canvasHeight, difficulty) {
        let predictedX = ball.x;
        let predictedY = ball.y;
        let speedX = ball.speedX;
        let speedY = ball.speedY;

        const maxIterations = 200;
        const targetX = this.isLeft ? this.x + this.width : this.x;

        for (let i = 0; i < maxIterations; i++) {
            predictedX += speedX;
            predictedY += speedY;

            if (predictedY - ball.radius < 0 || predictedY + ball.radius > canvasHeight) {
                speedY = -speedY;
                predictedY = Math.max(ball.radius, Math.min(canvasHeight - ball.radius, predictedY));
            }

            const reachedTarget = this.isLeft 
                ? predictedX <= targetX 
                : predictedX >= targetX;

            if (reachedTarget) {
                if (Math.random() > difficulty.predictionAccuracy) {
                    predictedY += (Math.random() - 0.5) * 100;
                }
                return predictedY;
            }
        }

        return canvasHeight / 2;
    }

    draw(ctx) {
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x + this.width, this.y + this.height
        );

        if (this.isLeft) {
            gradient.addColorStop(0, '#60a5fa');
            gradient.addColorStop(0.5, '#2563eb');
            gradient.addColorStop(1, '#1d4ed8');
        } else {
            gradient.addColorStop(0, '#f87171');
            gradient.addColorStop(0.5, '#dc2626');
            gradient.addColorStop(1, '#b91c1c');
        }

        if (this.isFrozen) {
            ctx.save();
            ctx.filter = 'hue-rotate(180deg) brightness(1.3)';
        }

        if (this.isExtended) {
            ctx.shadowColor = 'rgba(16, 185, 129, 1)';
            ctx.shadowBlur = 25;
        } else {
            ctx.shadowColor = this.isLeft ? 'rgba(37, 99, 235, 1)' : 'rgba(220, 38, 38, 1)';
            ctx.shadowBlur = 15;
        }
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 8);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = this.isFrozen ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(this.x + 3, this.y + 5, 3, this.height - 10);

        if (this.isFrozen) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.beginPath();
            ctx.roundRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6, 10);
            ctx.fill();

            for (let i = 0; i < 5; i++) {
                const ix = this.x + Math.random() * this.width;
                const iy = this.y + Math.random() * this.height;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(ix, iy, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (this.isFrozen) {
            ctx.restore();
        }
    }
}

class Ball {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.baseSpeed = 5;
        this.speedX = 0;
        this.speedY = 0;
        this.bounceCount = 0;
        this.speedMultiplier = 1;
        this.maxSpeedMultiplier = 2;
        this.trail = [];
        this.maxTrailLength = 15;
        this.glowIntensity = 0;
        this.spin = 0;
        this.curve = 0;
        this.isSpeedBoosted = false;
        this.speedBoostTime = 0;
    }

    reset(canvasWidth, canvasHeight, direction = 0) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.bounceCount = 0;
        this.speedMultiplier = 1;
        this.trail = [];
        this.spin = 0;
        this.curve = 0;
        this.isSpeedBoosted = false;
        this.speedBoostTime = 0;

        const angle = (Math.random() * 60 - 30) * Math.PI / 180;
        const dir = direction !== 0 ? direction : (Math.random() > 0.5 ? 1 : -1);

        this.speedX = this.baseSpeed * Math.cos(angle) * dir;
        this.speedY = this.baseSpeed * Math.sin(angle);
    }

    increaseSpeed() {
        if (this.speedMultiplier < this.maxSpeedMultiplier) {
            this.speedMultiplier *= 1.02;
            const currentSpeed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2);
            const newSpeed = this.baseSpeed * this.speedMultiplier;
            const ratio = newSpeed / currentSpeed;
            this.speedX *= ratio;
            this.speedY *= ratio;
        }
        this.bounceCount++;
        this.glowIntensity = 1;
    }

    applySpeedBoost(duration = 3000) {
        this.isSpeedBoosted = true;
        this.speedBoostTime = duration;
        this.speedX *= 1.5;
        this.speedY *= 1.5;
    }

    update(canvasWidth, canvasHeight, physicsMaterial, deltaTime = 16) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        if (this.isSpeedBoosted) {
            this.speedBoostTime -= deltaTime;
            if (this.speedBoostTime <= 0) {
                this.isSpeedBoosted = false;
                this.speedX /= 1.5;
                this.speedY /= 1.5;
            }
        }

        const material = PHYSICS_MATERIALS[physicsMaterial];
        this.speedX *= (1 - material.friction);
        this.speedY *= (1 - material.friction);

        if (Math.abs(this.spin) > 0.01) {
            this.speedY += this.spin * 0.1;
            this.spin *= 0.98;
        }

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.glowIntensity > 0) {
            this.glowIntensity -= 0.05;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.speedY = Math.abs(this.speedY) * material.bounce;
            this.increaseSpeed();
        }
        if (this.y + this.radius > canvasHeight) {
            this.y = canvasHeight - this.radius;
            this.speedY = -Math.abs(this.speedY) * material.bounce;
            this.increaseSpeed();
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = (i / this.trail.length) * 0.4;
            const size = (i / this.trail.length);
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * size, 0, Math.PI * 2);
            ctx.fillStyle = this.isSpeedBoosted 
                ? `rgba(239, 68, 68, ${alpha})` 
                : `rgba(30, 30, 30, ${alpha})`;
            ctx.fill();
        }

        const glowSize = 20 + this.glowIntensity * 15 + (this.isSpeedBoosted ? 15 : 0);
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowSize
        );
        gradient.addColorStop(0, this.isSpeedBoosted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, this.isSpeedBoosted ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.4)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;

        const ballGradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius
        );
        
        if (this.isSpeedBoosted) {
            ballGradient.addColorStop(0, '#fca5a5');
            ballGradient.addColorStop(0.5, '#ef4444');
            ballGradient.addColorStop(1, '#991b1b');
        } else {
            ballGradient.addColorStop(0, '#4a4a4a');
            ballGradient.addColorStop(0.5, '#1a1a1a');
            ballGradient.addColorStop(1, '#0a0a0a');
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = ballGradient;
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            this.radius * 0.3,
            0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        if (Math.abs(this.spin) > 0.5) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(Math.abs(this.spin) / 5, 0.8)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class Particle {
    constructor(x, y, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = 3 + Math.random() * 4;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.98;
        this.speedY *= 0.98;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        if (this.type === 'star') {
            this.drawStar(ctx, this.size * this.life);
        } else {
            ctx.arc(0, 0, this.size * this.life, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    }

    drawStar(ctx, size) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 18;
        this.life = 1;
        this.decay = 0.002;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.rotation = 0;
    }

    update(deltaTime) {
        this.life -= this.decay;
        this.rotation += 0.05;
        this.bobOffset += 0.05;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobOffset) * 5;
        const drawY = this.y + bobY;

        ctx.save();
        ctx.globalAlpha = Math.min(this.life, 1);
        ctx.translate(this.x, drawY);
        ctx.rotate(this.rotation);

        const colors = {
            grow: '#10b981',
            speed: '#f59e0b',
            freeze: '#3b82f6'
        };

        const icons = {
            grow: '📏',
            speed: '⚡',
            freeze: '❄️'
        };

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius + 10);
        gradient.addColorStop(0, colors[this.type]);
        gradient.addColorStop(0.5, colors[this.type] + '80');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors[this.type];
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.rotate(-this.rotation);
        ctx.fillText(icons[this.type], 0, 0);

        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.config = {
            width: 900,
            height: 500,
            paddleWidth: 15,
            paddleHeight: 100,
            paddleOffset: 30,
            ballRadius: 12,
            goalHeight: 180,
            winningScore: 7,
            paddleSpeed: 8
        };

        this.keys = {};
        this.score1 = 0;
        this.score2 = 0;
        this.gameTime = 0;
        this.startTime = 0;
        this.lastTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.isGoalScored = false;
        this.particles = [];
        this.powerUps = [];
        this.animationId = null;

        this.gameMode = 'pvp';
        this.aiDifficulty = 'easy';
        this.fieldTheme = 'ice';
        this.physicsMaterial = 'ice';
        this.isSpectatorMode = false;

        this.powers = {
            player1: { grow: 1, speed: 1, freeze: 1 },
            player2: { grow: 1, speed: 1, freeze: 1 }
        };

        this.tournament = null;
        this.seasonData = this.loadSeasonData();

        this.initCanvas();
        this.initObjects();
        this.initEventListeners();
        this.resizeCanvas();
        this.updatePowerDisplay();
        this.updateSeasonStats();
        this.draw();
    }

    initCanvas() {
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
    }

    initObjects() {
        const cfg = this.config;
        const isAI = this.gameMode === 'ai';
        const isSpectator = this.gameMode === 'spectator';

        this.paddle1 = new Paddle(
            cfg.paddleOffset,
            (cfg.height - cfg.paddleHeight) / 2,
            cfg.paddleWidth,
            cfg.paddleHeight,
            '#2563eb',
            true,
            isAI || isSpectator
        );

        this.paddle2 = new Paddle(
            cfg.width - cfg.paddleOffset - cfg.paddleWidth,
            (cfg.height - cfg.paddleHeight) / 2,
            cfg.paddleWidth,
            cfg.paddleHeight,
            '#dc2626',
            false,
            isSpectator || this.gameMode === 'ai' ? true : false
        );

        this.ball = new Ball(
            cfg.width / 2,
            cfg.height / 2,
            cfg.ballRadius
        );

        this.powerUps = [];
        this.particles = [];
    }

    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (this.isRunning && !this.isGameOver) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.togglePause();
                }
                if (this.gameMode !== 'spectator') {
                    if (e.code === 'KeyQ') this.usePower('player1', 'grow');
                    if (e.code === 'KeyE') this.usePower('player1', 'speed');
                    if (e.code === 'KeyR') this.usePower('player1', 'freeze');
                }
                if (this.gameMode === 'pvp') {
                    if (e.code === 'KeyO') this.usePower('player2', 'grow');
                    if (e.code === 'KeyP') this.usePower('player2', 'speed');
                    if (e.code === 'KeyI') this.usePower('player2', 'freeze');
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('resize', () => this.resizeCanvas());

        document.querySelectorAll('.setting-btn[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.setting-btn[data-mode]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gameMode = btn.dataset.mode;
                
                const aiGroup = document.getElementById('aiDifficultyGroup');
                aiGroup.style.display = this.gameMode === 'ai' ? 'block' : 'none';
                
                const seasonStats = document.getElementById('seasonStats');
                seasonStats.style.display = this.gameMode === 'tournament' ? 'block' : 'none';
                
                this.updatePlayerLabels();
            });
        });

        document.querySelectorAll('.setting-btn[data-difficulty]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.setting-btn[data-difficulty]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.aiDifficulty = btn.dataset.difficulty;
            });
        });

        document.querySelectorAll('.setting-btn[data-theme]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.setting-btn[data-theme]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.fieldTheme = btn.dataset.theme;
            });
        });

        document.querySelectorAll('.setting-btn[data-material]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.setting-btn[data-material]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.physicsMaterial = btn.dataset.material;
            });
        });

        document.querySelectorAll('.setting-btn[data-score]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.setting-btn[data-score]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.config.winningScore = parseInt(btn.dataset.score);
            });
        });

        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('resetBtn1').addEventListener('click', () => this.reset());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.playAgain());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.reset());
    }

    updatePlayerLabels() {
        const label1 = document.getElementById('player1Label');
        const label2 = document.getElementById('player2Label');

        if (this.gameMode === 'pvp') {
            label1.textContent = '玩家1 (W/S)';
            label2.textContent = '玩家2 (↑/↓)';
        } else if (this.gameMode === 'ai') {
            label1.textContent = '玩家1 (W/S)';
            label2.textContent = `AI (${AI_DIFFICULTIES[this.aiDifficulty] ? this.aiDifficulty : '简单'})`;
        } else if (this.gameMode === 'tournament') {
            label1.textContent = '你 (W/S)';
            label2.textContent = '对手';
        } else if (this.gameMode === 'spectator') {
            label1.textContent = 'AI 1';
            label2.textContent = 'AI 2';
        }
    }

    resizeCanvas() {
        const maxWidth = Math.min(window.innerWidth - 80, this.config.width);
        const scale = maxWidth / this.config.width;

        this.canvas.style.width = `${this.config.width * scale}px`;
        this.canvas.style.height = `${this.config.height * scale}px`;
    }

    start() {
        document.getElementById('startOverlay').classList.add('hidden');
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.startTime = Date.now();
        this.lastTime = this.startTime;
        this.gameTime = 0;
        this.score1 = 0;
        this.score2 = 0;
        this.particles = [];
        this.powerUps = [];
        this.isGoalScored = false;

        this.powers = {
            player1: { grow: 1, speed: 1, freeze: 1 },
            player2: { grow: 1, speed: 1, freeze: 1 }
        };

        if (this.gameMode === 'tournament') {
            this.initTournament();
        }

        this.initObjects();
        this.updatePlayerLabels();
        this.updateScoreDisplay();
        this.updatePowerDisplay();
        this.ball.reset(this.config.width, this.config.height);
        this.gameLoop();
    }

    initTournament() {
        const seasonNames = Object.keys(SEASONS);
        const currentSeason = seasonNames[new Date().getMonth() % 4];
        this.tournament = {
            season: currentSeason,
            round: 1,
            totalRounds: 5,
            opponentScore: 0,
            playerScore: 0
        };
    }

    togglePause() {
        if (!this.isRunning || this.isGameOver) return;

        this.isPaused = !this.isPaused;
        const pauseOverlay = document.getElementById('pauseOverlay');

        if (this.isPaused) {
            pauseOverlay.classList.remove('hidden');
            document.getElementById('pauseBtn').textContent = '继续';
        } else {
            pauseOverlay.classList.add('hidden');
            document.getElementById('pauseBtn').textContent = '暂停';
            this.startTime = Date.now() - this.gameTime * 1000;
            this.lastTime = Date.now();
            this.gameLoop();
        }
    }

    reset() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.isGoalScored = false;
        this.score1 = 0;
        this.score2 = 0;
        this.gameTime = 0;
        this.particles = [];
        this.powerUps = [];

        this.powers = {
            player1: { grow: 1, speed: 1, freeze: 1 },
            player2: { grow: 1, speed: 1, freeze: 1 }
        };

        this.initObjects();
        this.updateScoreDisplay();
        this.updateTimeDisplay();
        this.updatePowerDisplay();
        document.getElementById('bounceCount').textContent = '0';
        document.getElementById('speedFill').style.width = '50%';

        document.getElementById('startOverlay').classList.remove('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('winOverlay').classList.add('hidden');
        document.getElementById('pauseBtn').textContent = '暂停';

        this.draw();
    }

    playAgain() {
        if (this.gameMode === 'tournament' && this.tournament) {
            this.tournament.round++;
            if (this.tournament.round > this.tournament.totalRounds) {
                this.endTournament();
                return;
            }
            this.score1 = 0;
            this.score2 = 0;
        }

        document.getElementById('winOverlay').classList.add('hidden');
        this.isGameOver = false;
        this.isGoalScored = false;
        this.gameTime = 0;
        this.startTime = Date.now();
        this.lastTime = this.startTime;
        this.particles = [];
        this.powerUps = [];

        this.powers = {
            player1: { grow: 1, speed: 1, freeze: 1 },
            player2: { grow: 1, speed: 1, freeze: 1 }
        };

        this.initObjects();
        this.updateScoreDisplay();
        this.updatePowerDisplay();
        this.ball.reset(this.config.width, this.config.height);
        this.gameLoop();
    }

    endTournament() {
        const seasonBonus = SEASONS[this.tournament.season].bonus;
        const points = Math.floor(this.tournament.playerScore * 10 * seasonBonus);
        this.seasonData.totalPoints += points;
        this.seasonData.gamesPlayed++;
        if (this.tournament.playerScore > this.tournament.opponentScore) {
            this.seasonData.gamesWon++;
        }
        this.saveSeasonData();
        this.updateSeasonStats();

        const winOverlay = document.getElementById('winOverlay');
        const winTitle = document.getElementById('winTitle');
        const tournamentInfo = document.getElementById('tournamentInfo');

        if (this.tournament.playerScore > this.tournament.opponentScore) {
            winTitle.textContent = '锦标赛胜利！';
            winTitle.className = 'win-title player1-win';
        } else {
            winTitle.textContent = '锦标赛结束';
            winTitle.className = 'win-title player2-win';
        }

        tournamentInfo.style.display = 'block';
        tournamentInfo.innerHTML = `
            赛季: ${SEASONS[this.tournament.season].name}<br>
            最终积分: ${this.tournament.playerScore} : ${this.tournament.opponentScore}<br>
            获得赛季积分: +${points}
        `;

        winOverlay.classList.remove('hidden');
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused || this.isGameOver) {
            return;
        }

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.updateGameTime();
        this.handleInput();
        this.updateAI();
        this.paddle1.update(this.config.height, deltaTime);
        this.paddle2.update(this.config.height, deltaTime);
        this.ball.update(this.config.width, this.config.height, this.physicsMaterial, deltaTime);
        this.checkCollisions();
        this.checkGoal();
        this.updateParticles();
        this.updatePowerUps(deltaTime);
        this.spawnPowerUp();
        this.updateBounceDisplay();
        this.updateSpeedIndicator();
    }

    updateGameTime() {
        this.gameTime = (Date.now() - this.startTime) / 1000;
        this.updateTimeDisplay();
    }

    updateTimeDisplay() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        document.getElementById('gameTime').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    handleInput() {
        if (this.gameMode !== 'ai' && this.gameMode !== 'spectator') {
            if (this.keys['KeyW']) {
                this.paddle1.moveUp();
            } else if (this.keys['KeyS']) {
                this.paddle1.moveDown();
            } else {
                this.paddle1.stop();
            }
        }

        if (this.gameMode === 'pvp') {
            if (this.keys['ArrowUp']) {
                this.paddle2.moveUp();
            } else if (this.keys['ArrowDown']) {
                this.paddle2.moveDown();
            } else {
                this.paddle2.stop();
            }
        }
    }

    updateAI() {
        if (this.paddle1.isAI) {
            this.paddle1.updateAITarget(this.ball, this.config.width, this.config.height, this.aiDifficulty);
        }
        if (this.paddle2.isAI) {
            this.paddle2.updateAITarget(this.ball, this.config.width, this.config.height, this.aiDifficulty);
        }
    }

    usePower(player, type) {
        if (this.powers[player][type] <= 0) return;

        this.powers[player][type]--;
        this.updatePowerDisplay();

        const paddle = player === 'player1' ? this.paddle1 : this.paddle2;
        const opponent = player === 'player1' ? this.paddle2 : this.paddle1;

        switch (type) {
            case 'grow':
                paddle.extend(5000);
                this.createPowerEffect(paddle.x + paddle.width / 2, paddle.y, '📏');
                break;
            case 'speed':
                this.ball.applySpeedBoost(3000);
                this.createPowerEffect(this.ball.x, this.ball.y, '⚡');
                break;
            case 'freeze':
                opponent.freeze(2000);
                this.createPowerEffect(opponent.x + opponent.width / 2, opponent.y, '❄️');
                break;
        }
    }

    createPowerEffect(x, y, icon) {
        const effect = document.createElement('div');
        effect.className = 'power-effect';
        effect.textContent = icon;
        effect.style.left = `${(x / this.config.width) * 100}%`;
        effect.style.top = `${(y / this.config.height) * 100}%`;
        document.querySelector('.game-wrapper').appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
    }

    updatePowerDisplay() {
        document.getElementById('powerGrow1').textContent = this.powers.player1.grow;
        document.getElementById('powerSpeed1').textContent = this.powers.player1.speed;
        document.getElementById('powerFreeze1').textContent = this.powers.player1.freeze;
        document.getElementById('powerGrow2').textContent = this.powers.player2.grow;
        document.getElementById('powerSpeed2').textContent = this.powers.player2.speed;
        document.getElementById('powerFreeze2').textContent = this.powers.player2.freeze;
    }

    checkCollisions() {
        this.checkPaddleCollision(this.paddle1);
        this.checkPaddleCollision(this.paddle2);
        this.checkPowerUpCollision();
    }

    checkPaddleCollision(paddle) {
        const ball = this.ball;

        if (ball.x + ball.radius > paddle.x &&
            ball.x - ball.radius < paddle.x + paddle.width &&
            ball.y + ball.radius > paddle.y &&
            ball.y - ball.radius < paddle.y + paddle.height) {

            const hitPoint = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
            const maxAngle = 60 * Math.PI / 180;
            const angle = hitPoint * maxAngle;

            const currentSpeed = Math.sqrt(ball.speedX ** 2 + ball.speedY ** 2);

            if (paddle.isLeft) {
                ball.speedX = Math.abs(currentSpeed * Math.cos(angle));
                ball.x = paddle.x + paddle.width + ball.radius;
            } else {
                ball.speedX = -Math.abs(currentSpeed * Math.cos(angle));
                ball.x = paddle.x - ball.radius;
            }

            ball.speedY = currentSpeed * Math.sin(angle);
            ball.spin = hitPoint * 3 + (paddle.velocityY / paddle.speed) * 2;

            const material = PHYSICS_MATERIALS[this.physicsMaterial];
            ball.speedX *= material.bounce;
            ball.speedY *= material.bounce;

            ball.increaseSpeed();
            this.createCollisionParticles(ball.x, ball.y, paddle.isLeft ? '#2563eb' : '#dc2626');
        }
    }

    checkPowerUpCollision() {
        const ball = this.ball;
        this.powerUps.forEach(powerUp => {
            const dx = ball.x - powerUp.x;
            const dy = ball.y - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ball.radius + powerUp.radius && !powerUp.collected) {
                powerUp.collected = true;
                const player = ball.speedX > 0 ? 'player1' : 'player2';
                this.powers[player][powerUp.type]++;
                this.updatePowerDisplay();
                this.createPowerEffect(powerUp.x, powerUp.y, this.getPowerIcon(powerUp.type));
                
                for (let i = 0; i < 15; i++) {
                    this.particles.push(new Particle(powerUp.x, powerUp.y, '#f59e0b', 'star'));
                }
            }
        });

        this.powerUps = this.powerUps.filter(p => !p.collected && p.life > 0);
    }

    getPowerIcon(type) {
        const icons = { grow: '📏', speed: '⚡', freeze: '❄️' };
        return icons[type];
    }

    spawnPowerUp() {
        if (this.powerUps.length < 2 && Math.random() < 0.005) {
            const types = ['grow', 'speed', 'freeze'];
            const type = types[Math.floor(Math.random() * types.length)];
            const x = this.config.width / 2 + (Math.random() - 0.5) * 200;
            const y = 100 + Math.random() * (this.config.height - 200);
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    updatePowerUps(deltaTime) {
        this.powerUps.forEach(p => p.update(deltaTime));
        this.powerUps = this.powerUps.filter(p => p.life > 0 && !p.collected);
    }

    checkGoal() {
        const { width, height, goalHeight } = this.config;
        const ball = this.ball;
        const goalTop = (height - goalHeight) / 2;
        const goalBottom = goalTop + goalHeight;

        if (this.isGoalScored) {
            if (ball.x > 50 && ball.x < width - 50) {
                this.isGoalScored = false;
            }
            return;
        }

        if (ball.y > goalTop && ball.y < goalBottom) {
            if (ball.x - ball.radius <= 0) {
                this.isGoalScored = true;
                this.score2++;
                ball.speedX = 0;
                ball.speedY = 0;
                if (this.tournament) this.tournament.opponentScore++;
                this.updateScoreDisplay();
                this.createGoalParticles(0, ball.y, '#dc2626');
                this.animateScore('score2');
                this.checkWin();
                if (!this.isGameOver) {
                    setTimeout(() => {
                        this.ball.reset(width, height, 1);
                        this.isGoalScored = false;
                    }, 1000);
                }
            } else if (ball.x + ball.radius >= width) {
                this.isGoalScored = true;
                this.score1++;
                ball.speedX = 0;
                ball.speedY = 0;
                if (this.tournament) this.tournament.playerScore++;
                this.updateScoreDisplay();
                this.createGoalParticles(width, ball.y, '#2563eb');
                this.animateScore('score1');
                this.checkWin();
                if (!this.isGameOver) {
                    setTimeout(() => {
                        this.ball.reset(width, height, -1);
                        this.isGoalScored = false;
                    }, 1000);
                }
            }
        } else {
            if (ball.x - ball.radius <= 0) {
                ball.x = ball.radius;
                ball.speedX = Math.abs(ball.speedX);
                ball.increaseSpeed();
            }
            if (ball.x + ball.radius >= width) {
                ball.x = width - ball.radius;
                ball.speedX = -Math.abs(ball.speedX);
                ball.increaseSpeed();
            }
        }
    }

    checkWin() {
        if (this.score1 >= this.config.winningScore || this.score2 >= this.config.winningScore) {
            this.isGameOver = true;

            if (this.gameMode === 'tournament' && this.tournament) {
                if (this.tournament.round < this.tournament.totalRounds) {
                    setTimeout(() => {
                        this.playAgain();
                    }, 2000);
                    return;
                }
            }

            this.showWinOverlay();
        }
    }

    showWinOverlay() {
        const winOverlay = document.getElementById('winOverlay');
        const winTitle = document.getElementById('winTitle');
        const tournamentInfo = document.getElementById('tournamentInfo');
        const winner = this.score1 >= this.config.winningScore ? 1 : 2;

        winTitle.textContent = this.gameMode === 'ai' && winner === 2
            ? 'AI 获胜！'
            : `玩家${winner} 获胜！`;
        winTitle.className = `win-title ${winner === 1 ? 'player1-win' : 'player2-win'}`;

        document.getElementById('finalScore1').textContent = this.score1;
        document.getElementById('finalScore2').textContent = this.score2;

        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        document.getElementById('finalTime').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (this.gameMode === 'tournament' && this.tournament) {
            this.endTournament();
        } else {
            tournamentInfo.style.display = 'none';
            setTimeout(() => {
                winOverlay.classList.remove('hidden');
            }, 500);
        }
    }

    animateScore(elementId) {
        const element = document.getElementById(elementId);
        element.classList.add('bump');
        setTimeout(() => element.classList.remove('bump'), 500);
    }

    updateScoreDisplay() {
        document.getElementById('score1').textContent = this.score1;
        document.getElementById('score2').textContent = this.score2;
    }

    updateBounceDisplay() {
        document.getElementById('bounceCount').textContent = this.ball.bounceCount;
    }

    updateSpeedIndicator() {
        const percentage = ((this.ball.speedMultiplier - 1) / (this.ball.maxSpeedMultiplier - 1)) * 50 + 50;
        document.getElementById('speedFill').style.width = `${percentage}%`;
    }

    createCollisionParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    createGoalParticles(x, y, color) {
        for (let i = 0; i < 30; i++) {
            this.particles.push(new Particle(x, y, color, 'star'));
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.update();
            return p.life > 0;
        });
    }

    loadSeasonData() {
        const saved = localStorage.getItem('hockeySeasonData');
        if (saved) {
            return JSON.parse(saved);
        }
        return { totalPoints: 0, gamesPlayed: 0, gamesWon: 0 };
    }

    saveSeasonData() {
        localStorage.setItem('hockeySeasonData', JSON.stringify(this.seasonData));
    }

    updateSeasonStats() {
        document.getElementById('seasonPoints').textContent = this.seasonData.totalPoints;
        const winRate = this.seasonData.gamesPlayed > 0
            ? Math.round((this.seasonData.gamesWon / this.seasonData.gamesPlayed) * 100)
            : 0;
        document.getElementById('winRate').textContent = `${winRate}%`;
    }

    draw() {
        const ctx = this.ctx;
        const { width, height } = this.config;
        const theme = FIELD_THEMES[this.fieldTheme];

        ctx.clearRect(0, 0, width, height);

        this.drawBackground(theme);
        this.drawField(theme);
        this.drawGoal(theme);

        this.powerUps.forEach(p => p.draw(ctx));
        this.paddle1.draw(ctx);
        this.paddle2.draw(ctx);
        this.ball.draw(ctx);
        this.particles.forEach(p => p.draw(ctx));
    }

    drawBackground(theme) {
        const ctx = this.ctx;
        const { width, height } = this.config;

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        theme.background.forEach((color, i) => {
            gradient.addColorStop(i / (theme.background.length - 1), color);
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % width;
            const y = (i * 53) % height;
            const size = 1 + (i % 3);
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawField(theme) {
        const ctx = this.ctx;
        const { width, height } = this.config;

        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, width - 4, height - 4);

        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
        ctx.stroke();

        const centerGradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, 60
        );
        centerGradient.addColorStop(0, `rgba(${theme.accent}, 0.2)`);
        centerGradient.addColorStop(1, `rgba(${theme.accent}, 0)`);
        ctx.fillStyle = centerGradient;
        ctx.fill();

        ctx.fillStyle = `${theme.goal1}15`;
        ctx.fillRect(0, 0, 100, height);
        ctx.fillStyle = `${theme.goal2}15`;
        ctx.fillRect(width - 100, 0, 100, height);
    }

    drawGoal(theme) {
        const ctx = this.ctx;
        const { width, height, goalHeight } = this.config;
        const goalTop = (height - goalHeight) / 2;

        ctx.fillStyle = `${theme.goal1}30`;
        ctx.fillRect(0, goalTop, 20, goalHeight);
        ctx.strokeStyle = theme.goal1;
        ctx.lineWidth = 4;
        ctx.strokeRect(0, goalTop, 20, goalHeight);

        ctx.fillStyle = `${theme.goal2}30`;
        ctx.fillRect(width - 20, goalTop, 20, goalHeight);
        ctx.strokeStyle = theme.goal2;
        ctx.lineWidth = 4;
        ctx.strokeRect(width - 20, goalTop, 20, goalHeight);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(0, goalTop + i * (goalHeight / 5));
            ctx.lineTo(20, goalTop + i * (goalHeight / 5));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(width - 20, goalTop + i * (goalHeight / 5));
            ctx.lineTo(width, goalTop + i * (goalHeight / 5));
            ctx.stroke();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
