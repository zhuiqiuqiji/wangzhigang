const BRICK_TYPES = {
    NORMAL: 'normal',
    HARD: 'hard',
    HIDDEN: 'hidden',
    EXPLOSIVE: 'explosive',
    TELEPORT: 'teleport'
};

const POWERUP_TYPES = {
    EXTEND_PADDLE: 'extend_paddle',
    MULTI_BALL: 'multi_ball',
    LASER: 'laser',
    SLOW_BALL: 'slow_ball',
    MAGNET: 'magnet',
    SPEED_BOOST: 'speed_boost'
};

const ACHIEVEMENTS = {
    FIRST_WIN: { id: 'first_win', name: '初出茅庐', desc: '首次通关第一关', icon: '🎯' },
    PERFECT: { id: 'perfect', name: '完美无瑕', desc: '不失一命通关一关', icon: '💎' },
    COMBO_10: { id: 'combo_10', name: '连击达人', desc: '单局连续击碎10块砖块', icon: '🔥' },
    SCORE_5000: { id: 'score_5000', name: '高分选手', desc: '单局得分超过5000', icon: '🏆' },
    EXPLOSION: { id: 'explosion', name: '爆破专家', desc: '引爆10个爆炸砖块', icon: '💥' },
    TELEPORT_MASTER: { id: 'teleport_master', name: '传送大师', desc: '使用传送砖50次', icon: '🌀' },
    ALL_LEVELS: { id: 'all_levels', name: '通关达人', desc: '通关所有关卡', icon: '👑' }
};

class BreakoutGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.maxLevel = 10;
        this.gameState = 'idle';
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectRun = true;
        this.explosionsTriggered = 0;
        this.teleportsUsed = 0;

        this.paddle = {
            width: 120,
            height: 15,
            x: (this.width - 120) / 2,
            y: this.height - 40,
            speed: 8,
            originalWidth: 120,
            magnetActive: false,
            magnetTimer: 0,
            laserActive: false,
            laserTimer: 0,
            speedBoost: false,
            speedBoostTimer: 0
        };

        this.balls = [];
        this.mainBall = null;

        this.brickConfig = {
            rows: 6,
            cols: 10,
            width: 70,
            height: 25,
            padding: 5,
            offsetTop: 50,
            offsetLeft: 30
        };

        this.brickColors = {
            normal: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ff9ff3'],
            hard: ['#c0392b', '#d35400'],
            hidden: ['#2c3e50'],
            explosive: ['#e74c3c'],
            teleport: ['#9b59b6']
        };

        this.bricks = [];
        this.powerups = [];
        this.lasers = [];
        this.particles = [];
        this.keys = {};
        this.mouseInCanvas = false;
        this.activePowerups = {};

        this.achievements = this.loadAchievements();
        this.leaderboard = this.loadLeaderboard();
        this.playerName = 'Player';

        this.polyfillRoundRect();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createInitialBall();
        this.loadLevel(this.level);
        this.gameLoop();
        this.updateAchievementsUI();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseenter', () => this.mouseInCanvas = true);
        this.canvas.addEventListener('mouseleave', () => this.mouseInCanvas = false);
        this.canvas.addEventListener('click', () => this.launchBall());

        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('overlayBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('editorBtn').addEventListener('click', () => this.openEditor());
        document.getElementById('leaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('achievementsBtn').addEventListener('click', () => this.showAchievements());
        document.getElementById('closeOverlay').addEventListener('click', () => this.closeCustomOverlay());
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
        if (e.key === ' ' && this.gameState === 'playing') {
            e.preventDefault();
            this.launchBall();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
        }
        if (e.key === 'l' && this.paddle.laserActive && this.gameState === 'playing') {
            this.shootLaser();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    handleMouseMove(e) {
        if (!this.mouseInCanvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        this.paddle.x = mouseX - this.paddle.width / 2;
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));
        
        if (this.mainBall && !this.mainBall.launched) {
            this.mainBall.x = this.paddle.x + this.paddle.width / 2;
        }
    }

    createInitialBall() {
        this.balls = [];
        this.mainBall = this.createBall(
            this.paddle.x + this.paddle.width / 2,
            this.height - 60
        );
        this.balls.push(this.mainBall);
    }

    createBall(x, y, launched = false) {
        return {
            x,
            y,
            radius: 10,
            speed: 5 + (this.level - 1) * 0.3,
            baseSpeed: 5 + (this.level - 1) * 0.3,
            dx: 0,
            dy: 0,
            color: '#ffd700',
            launched,
            slowTimer: 0
        };
    }

    loadLevel(levelNum) {
        this.bricks = [];
        const levelData = this.getLevelData(levelNum);
        
        levelData.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell.type === 'empty') return;
                
                const x = colIndex * (this.brickConfig.width + this.brickConfig.padding) + this.brickConfig.offsetLeft;
                const y = rowIndex * (this.brickConfig.height + this.brickConfig.padding) + this.brickConfig.offsetTop;
                
                let brick = {
                    x,
                    y,
                    width: this.brickConfig.width,
                    height: this.brickConfig.height,
                    type: cell.type,
                    visible: cell.type !== 'hidden',
                    revealed: cell.type !== 'hidden',
                    hits: cell.hits || 1,
                    maxHits: cell.hits || 1,
                    points: cell.points || 10,
                    color: this.getBrickColor(cell.type, rowIndex),
                    teleportTarget: cell.teleportTarget || null,
                    dropPowerup: cell.dropPowerup || Math.random() < 0.15
                };
                
                this.bricks.push(brick);
            });
        });
    }

    getLevelData(levelNum) {
        const levels = [
            this.createLevel1(),
            this.createLevel2(),
            this.createLevel3(),
            this.createLevel4(),
            this.createLevel5(),
            this.createLevel6(),
            this.createLevel7(),
            this.createLevel8(),
            this.createLevel9(),
            this.createLevel10()
        ];
        return levels[Math.min(levelNum - 1, levels.length - 1)];
    }

    createEmptyGrid(rows, cols) {
        return Array(rows).fill(null).map(() => 
            Array(cols).fill(null).map(() => ({ type: 'empty' }))
        );
    }

    createLevel1() {
        const grid = this.createEmptyGrid(5, 10);
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 10; col++) {
                grid[row][col] = { type: 'normal', hits: 1, points: 10 };
            }
        }
        return grid;
    }

    createLevel2() {
        const grid = this.createEmptyGrid(6, 10);
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                if (row < 2) {
                    grid[row][col] = { type: 'hard', hits: 2, points: 25 };
                } else {
                    grid[row][col] = { type: 'normal', hits: 1, points: 10 };
                }
            }
        }
        return grid;
    }

    createLevel3() {
        const grid = this.createEmptyGrid(6, 10);
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                if ((row + col) % 3 === 0) {
                    grid[row][col] = { type: 'hard', hits: 2, points: 25 };
                } else if ((row + col) % 5 === 0) {
                    grid[row][col] = { type: 'explosive', hits: 1, points: 50, dropPowerup: true };
                } else {
                    grid[row][col] = { type: 'normal', hits: 1, points: 10 };
                }
            }
        }
        return grid;
    }

    createLevel4() {
        const grid = this.createEmptyGrid(6, 10);
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                if (row === 0 || row === 5) {
                    grid[row][col] = { type: 'normal', hits: 1, points: 10 };
                } else if (col === 0 || col === 9) {
                    grid[row][col] = { type: 'normal', hits: 1, points: 10 };
                } else if (row === 2 && col >= 3 && col <= 6) {
                    grid[row][col] = { type: 'hidden', hits: 1, points: 30 };
                } else {
                    grid[row][col] = { type: 'empty' };
                }
            }
        }
        return grid;
    }

    createLevel5() {
        const grid = this.createEmptyGrid(6, 10);
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                if (col === 0 || col === 9) {
                    grid[row][col] = { type: 'teleport', hits: 1, points: 20, teleportTarget: { row, col: col === 0 ? 9 : 0 } };
                } else if (row < 2) {
                    grid[row][col] = { type: 'hard', hits: 3, points: 40 };
                } else {
                    grid[row][col] = { type: 'normal', hits: 1, points: 10 };
                }
            }
        }
        return grid;
    }

    createLevel6() {
        const grid = this.createEmptyGrid(7, 10);
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 10; col++) {
                const dist = Math.abs(col - 4.5);
                const rowDist = Math.abs(row - 3);
                if (Math.abs(rowDist - dist) < 0.6) {
                    grid[row][col] = { type: 'explosive', hits: 1, points: 50 };
                } else if (dist <= 3.5 && rowDist <= 3) {
                    grid[row][col] = { type: 'normal', hits: 1, points: 10 };
                }
            }
        }
        return grid;
    }

    createLevel7() {
        const grid = this.createEmptyGrid(7, 10);
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 10; col++) {
                if (col % 2 === 0) {
                    if (row % 2 === 0) {
                        grid[row][col] = { type: 'hard', hits: 2, points: 25 };
                    } else {
                        grid[row][col] = { type: 'hidden', hits: 1, points: 30 };
                    }
                } else {
                    if (row % 2 === 0) {
                        grid[row][col] = { type: 'teleport', hits: 1, points: 20, teleportTarget: { row, col: col < 5 ? col + 5 : col - 5 } };
                    } else {
                        grid[row][col] = { type: 'normal', hits: 1, points: 10 };
                    }
                }
            }
        }
        return grid;
    }

    createLevel8() {
        const grid = this.createEmptyGrid(8, 10);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 10; col++) {
                if (row === 0 && (col === 2 || col === 7)) {
                    grid[row][col] = { type: 'explosive', hits: 1, points: 50 };
                } else if (col >= 2 && col <= 7) {
                    if (row < 3) {
                        grid[row][col] = { type: 'hard', hits: 3, points: 40 };
                    } else if (row === 3) {
                        grid[row][col] = { type: 'hidden', hits: 2, points: 50 };
                    } else {
                        grid[row][col] = { type: 'normal', hits: 1, points: 10 };
                    }
                }
            }
        }
        return grid;
    }

    createLevel9() {
        const grid = this.createEmptyGrid(8, 10);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 10; col++) {
                const spiral = this.isSpiral(row, col, 8, 10);
                if (spiral === 'hard') {
                    grid[row][col] = { type: 'hard', hits: 3, points: 40 };
                } else if (spiral === 'explosive') {
                    grid[row][col] = { type: 'explosive', hits: 1, points: 50 };
                } else if (spiral === 'teleport') {
                    grid[row][col] = { type: 'teleport', hits: 1, points: 20, teleportTarget: { row: 7 - row, col: 9 - col } };
                } else if (spiral === 'normal') {
                    grid[row][col] = { type: 'normal', hits: 1, points: 10 };
                }
            }
        }
        return grid;
    }

    createLevel10() {
        const grid = this.createEmptyGrid(8, 10);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 10; col++) {
                if (row === 0) {
                    grid[row][col] = { type: 'hard', hits: 4, points: 60 };
                } else if (row === 1) {
                    grid[row][col] = { type: 'explosive', hits: 1, points: 50 };
                } else if (row === 2 || row === 3) {
                    grid[row][col] = { type: 'hidden', hits: 2, points: 50 };
                } else if (row === 4 || row === 5) {
                    grid[row][col] = { type: 'teleport', hits: 1, points: 30, teleportTarget: { row: 7 - row, col: 9 - col } };
                } else {
                    grid[row][col] = { type: 'hard', hits: 2, points: 25 };
                }
            }
        }
        return grid;
    }

    isSpiral(row, col, rows, cols) {
        let layer = Math.min(row, col, rows - 1 - row, cols - 1 - col);
        if (layer === 0) return 'hard';
        if (layer === 1) return 'explosive';
        if (layer === 2) return 'teleport';
        if (layer === 3) return 'normal';
        return 'normal';
    }

    getBrickColor(type, row) {
        const colors = this.brickColors[type] || this.brickColors.normal;
        return colors[row % colors.length];
    }

    startGame() {
        if (this.gameState === 'idle' || this.gameState === 'gameOver' || this.gameState === 'win') {
            this.resetGame();
        }
        this.gameState = 'playing';
        document.getElementById('gameOverlay').classList.add('hidden');
        this.closeCustomOverlay();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseBtn').textContent = '继续';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseBtn').textContent = '暂停';
        }
    }

    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectRun = true;
        this.explosionsTriggered = 0;
        this.teleportsUsed = 0;
        this.resetPowerups();
        this.resetGame();
        this.gameState = 'playing';
        document.getElementById('gameOverlay').classList.add('hidden');
        document.getElementById('pauseBtn').textContent = '暂停';
    }

    resetGame() {
        this.paddle.x = (this.width - this.paddle.originalWidth) / 2;
        this.paddle.width = this.paddle.originalWidth;
        this.paddle.magnetActive = false;
        this.paddle.laserActive = false;
        this.paddle.speedBoost = false;
        this.lasers = [];
        this.powerups = [];
        this.createInitialBall();
        this.loadLevel(this.level);
        this.particles = [];
        this.updateUI();
    }

    resetPowerups() {
        this.activePowerups = {};
    }

    launchBall() {
        if (this.gameState !== 'playing') return;
        
        this.balls.forEach(ball => {
            if (!ball.launched) {
                ball.launched = true;
                const angle = (Math.random() * 60 + 60) * Math.PI / 180;
                const direction = Math.random() > 0.5 ? 1 : -1;
                ball.dx = Math.cos(angle) * ball.speed * direction;
                ball.dy = -Math.sin(angle) * ball.speed;
            }
        });
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.updatePaddle();
        this.updateBalls();
        this.updateLasers();
        this.updatePowerups();
        this.updateParticles();
        this.updatePowerupTimers();
        this.checkWinCondition();
    }

    updatePaddle() {
        if (!this.mouseInCanvas) {
            let speed = this.paddle.speed;
            if (this.paddle.speedBoost) speed *= 1.5;
            
            if (this.keys['ArrowLeft']) {
                this.paddle.x -= speed;
            }
            if (this.keys['ArrowRight']) {
                this.paddle.x += speed;
            }
        }

        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));

        this.balls.forEach(ball => {
            if (!ball.launched) {
                ball.x = this.paddle.x + this.paddle.width / 2;
            }
        });
    }

    updateBalls() {
        const ballsToRemove = [];

        this.balls.forEach((ball, index) => {
            if (!ball.launched) return;

            if (ball.slowTimer > 0) {
                ball.slowTimer--;
                ball.speed = ball.baseSpeed * 0.5;
            } else {
                ball.speed = ball.baseSpeed;
            }

            ball.x += ball.dx;
            ball.y += ball.dy;

            const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            if (currentSpeed !== ball.speed) {
                const ratio = ball.speed / currentSpeed;
                ball.dx *= ratio;
                ball.dy *= ratio;
            }

            if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= this.width) {
                ball.dx = -ball.dx;
                ball.x = Math.max(ball.radius, Math.min(this.width - ball.radius, ball.x));
            }

            if (ball.y - ball.radius <= 0) {
                ball.dy = -ball.dy;
                ball.y = ball.radius;
            }

            if (ball.y + ball.radius >= this.height) {
                ballsToRemove.push(index);
                return;
            }

            this.checkPaddleCollision(ball);
            this.checkBrickCollision(ball);
        });

        ballsToRemove.sort((a, b) => b - a).forEach(index => {
            this.balls.splice(index, 1);
        });

        if (this.balls.length === 0) {
            this.loseLife();
        }
    }

    checkPaddleCollision(ball) {
        if (
            ball.y + ball.radius >= this.paddle.y &&
            ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
            ball.x + ball.radius >= this.paddle.x &&
            ball.x - ball.radius <= this.paddle.x + this.paddle.width &&
            ball.dy > 0
        ) {
            let hitPos = (ball.x - this.paddle.x) / this.paddle.width;
            
            if (this.paddle.magnetActive) {
                hitPos = 0.5 + (hitPos - 0.5) * 0.5;
            }

            const maxAngle = Math.PI * 0.45;
            let angle = (hitPos - 0.5) * maxAngle * 2;

            if (this.keys['ArrowRight'] || (this.mouseInCanvas && this.paddle.speedBoost)) {
                angle += 0.2;
                ball.baseSpeed = Math.min(ball.baseSpeed * 1.02, 12);
            }
            if (this.keys['ArrowLeft']) {
                angle -= 0.2;
                ball.baseSpeed = Math.min(ball.baseSpeed * 1.02, 12);
            }

            angle = Math.max(-maxAngle, Math.min(maxAngle, angle));
            ball.dx = Math.sin(angle) * ball.speed;
            ball.dy = -Math.abs(Math.cos(angle) * ball.speed);
            ball.y = this.paddle.y - ball.radius;
            
            this.createParticles(ball.x, ball.y, this.paddle.magnetActive ? '#ff00ff' : '#4ecdc4', 5);
            this.combo = 0;
        }
    }

    checkBrickCollision(ball) {
        for (let brick of this.bricks) {
            if (!brick.visible) continue;

            if (
                ball.x + ball.radius > brick.x &&
                ball.x - ball.radius < brick.x + brick.width &&
                ball.y + ball.radius > brick.y &&
                ball.y - ball.radius < brick.y + brick.height
            ) {
                this.hitBrick(brick, ball);

                const overlapLeft = ball.x + ball.radius - brick.x;
                const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
                const overlapTop = ball.y + ball.radius - brick.y;
                const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                    ball.dx = -ball.dx;
                } else {
                    ball.dy = -ball.dy;
                }

                break;
            }
        }
    }

    hitBrick(brick, ball) {
        if (!brick.revealed) {
            brick.revealed = true;
            brick.visible = true;
            this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 20);
            return;
        }

        brick.hits--;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        if (this.combo >= 10) this.unlockAchievement(ACHIEVEMENTS.COMBO_10);

        if (brick.hits <= 0) {
            brick.visible = false;
            this.score += brick.points * (1 + Math.floor(this.combo / 5) * 0.5);

            if (brick.type === 'explosive') {
                this.triggerExplosion(brick);
                this.explosionsTriggered++;
                if (this.explosionsTriggered >= 10) this.unlockAchievement(ACHIEVEMENTS.EXPLOSION);
            }

            if (brick.type === 'teleport' && brick.teleportTarget) {
                this.teleportBall(ball, brick.teleportTarget);
                this.teleportsUsed++;
                if (this.teleportsUsed >= 50) this.unlockAchievement(ACHIEVEMENTS.TELEPORT_MASTER);
            }

            if (brick.dropPowerup) {
                this.spawnPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2);
            }

            this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 15);
        } else {
            this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 5);
        }

        this.updateUI();
    }

    triggerExplosion(brick) {
        const explosionRadius = 1.5;
        this.bricks.forEach(b => {
            if (!b.visible) return;
            const dx = (b.x + b.width / 2) - (brick.x + brick.width / 2);
            const dy = (b.y + b.height / 2) - (brick.y + brick.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < (brick.width + b.width) * explosionRadius && b !== brick) {
                b.hits--;
                if (b.hits <= 0) {
                    b.visible = false;
                    this.score += b.points;
                }
            }
        });

        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: brick.x + brick.width / 2,
                y: brick.y + brick.height / 2,
                dx: (Math.random() - 0.5) * 15,
                dy: (Math.random() - 0.5) * 15,
                radius: Math.random() * 6 + 3,
                color: i % 2 === 0 ? '#ff6b6b' : '#ffa502',
                life: 1
            });
        }
    }

    teleportBall(ball, target) {
        const targetX = target.col * (this.brickConfig.width + this.brickConfig.padding) + this.brickConfig.offsetLeft + this.brickConfig.width / 2;
        const targetY = target.row * (this.brickConfig.height + this.brickConfig.padding) + this.brickConfig.offsetTop + this.brickConfig.height / 2;
        
        ball.x = targetX;
        ball.y = targetY;
        
        this.createParticles(ball.x, ball.y, '#9b59b6', 25);
    }

    spawnPowerup(x, y) {
        const types = Object.values(POWERUP_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.powerups.push({
            x,
            y,
            type,
            dy: 2,
            radius: 15
        });
    }

    updatePowerups() {
        const powerupsToRemove = [];

        this.powerups.forEach((powerup, index) => {
            powerup.y += powerup.dy;

            if (
                powerup.y + powerup.radius >= this.paddle.y &&
                powerup.y - powerup.radius <= this.paddle.y + this.paddle.height &&
                powerup.x + powerup.radius >= this.paddle.x &&
                powerup.x - powerup.radius <= this.paddle.x + this.paddle.width
            ) {
                this.activatePowerup(powerup.type);
                powerupsToRemove.push(index);
            }

            if (powerup.y > this.height) {
                powerupsToRemove.push(index);
            }
        });

        powerupsToRemove.sort((a, b) => b - a).forEach(index => {
            this.powerups.splice(index, 1);
        });
    }

    activatePowerup(type) {
        switch (type) {
            case POWERUP_TYPES.EXTEND_PADDLE:
                this.paddle.width = Math.min(this.paddle.width * 1.5, 250);
                this.activePowerups.extend = 600;
                break;
            case POWERUP_TYPES.MULTI_BALL:
                const currentBalls = [...this.balls];
                currentBalls.forEach(ball => {
                    if (ball.launched) {
                        const newBall1 = this.createBall(ball.x, ball.y, true);
                        const newBall2 = this.createBall(ball.x, ball.y, true);
                        newBall1.dx = ball.dx * 0.8 + ball.speed * 0.3;
                        newBall1.dy = ball.dy;
                        newBall2.dx = ball.dx * 0.8 - ball.speed * 0.3;
                        newBall2.dy = ball.dy;
                        this.balls.push(newBall1, newBall2);
                    }
                });
                break;
            case POWERUP_TYPES.LASER:
                this.paddle.laserActive = true;
                this.paddle.laserTimer = 600;
                break;
            case POWERUP_TYPES.SLOW_BALL:
                this.balls.forEach(ball => {
                    ball.slowTimer = 300;
                });
                break;
            case POWERUP_TYPES.MAGNET:
                this.paddle.magnetActive = true;
                this.paddle.magnetTimer = 600;
                break;
            case POWERUP_TYPES.SPEED_BOOST:
                this.paddle.speedBoost = true;
                this.paddle.speedBoostTimer = 400;
                break;
        }

        this.createParticles(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#00ff00', 15);
    }

    updatePowerupTimers() {
        if (this.activePowerups.extend) {
            this.activePowerups.extend--;
            if (this.activePowerups.extend <= 0) {
                this.paddle.width = this.paddle.originalWidth;
                delete this.activePowerups.extend;
            }
        }
        if (this.paddle.laserTimer) {
            this.paddle.laserTimer--;
            if (this.paddle.laserTimer <= 0) {
                this.paddle.laserActive = false;
            }
        }
        if (this.paddle.magnetTimer) {
            this.paddle.magnetTimer--;
            if (this.paddle.magnetTimer <= 0) {
                this.paddle.magnetActive = false;
            }
        }
        if (this.paddle.speedBoostTimer) {
            this.paddle.speedBoostTimer--;
            if (this.paddle.speedBoostTimer <= 0) {
                this.paddle.speedBoost = false;
            }
        }
    }

    shootLaser() {
        this.lasers.push({
            x: this.paddle.x + this.paddle.width / 2,
            y: this.paddle.y,
            dy: -10,
            width: 4,
            height: 20
        });
    }

    updateLasers() {
        const lasersToRemove = [];

        this.lasers.forEach((laser, laserIndex) => {
            laser.y += laser.dy;

            if (laser.y < 0) {
                lasersToRemove.push(laserIndex);
                return;
            }

            for (let brick of this.bricks) {
                if (!brick.visible) continue;

                if (
                    laser.x > brick.x &&
                    laser.x < brick.x + brick.width &&
                    laser.y > brick.y &&
                    laser.y < brick.y + brick.height
                ) {
                    brick.hits--;
                    if (brick.hits <= 0) {
                        brick.visible = false;
                        this.score += brick.points;
                        this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 10);
                    }
                    lasersToRemove.push(laserIndex);
                    this.updateUI();
                    break;
                }
            }
        });

        lasersToRemove.sort((a, b) => b - a).forEach(index => {
            this.lasers.splice(index, 1);
        });
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 4 + 2,
                color,
                life: 1
            });
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.life -= 0.02;
            p.dy += 0.1;
            return p.life > 0;
        });
    }

    loseLife() {
        this.lives--;
        this.perfectRun = false;
        this.combo = 0;
        this.updateUI();

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPowerups();
            this.paddle.width = this.paddle.originalWidth;
            this.createInitialBall();
        }
    }

    checkWinCondition() {
        const remainingBricks = this.bricks.filter(b => b.visible || (b.type === 'hidden' && !b.revealed)).length;
        if (remainingBricks === 0) {
            this.levelUp();
        }
    }

    levelUp() {
        if (this.level === 1) this.unlockAchievement(ACHIEVEMENTS.FIRST_WIN);
        if (this.perfectRun) this.unlockAchievement(ACHIEVEMENTS.PERFECT);
        
        this.level++;
        
        if (this.level > this.maxLevel) {
            this.unlockAchievement(ACHIEVEMENTS.ALL_LEVELS);
            this.winGame();
            return;
        }

        this.perfectRun = true;
        this.resetPowerups();
        this.paddle.width = this.paddle.originalWidth;
        this.createInitialBall();
        this.loadLevel(this.level);
        this.updateUI();
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.saveScore();
        this.showOverlay('游戏结束', `最终得分: ${Math.floor(this.score)}\n最高连击: ${this.maxCombo}`, '再来一局');
    }

    winGame() {
        this.gameState = 'win';
        if (this.score >= 5000) this.unlockAchievement(ACHIEVEMENTS.SCORE_5000);
        this.saveScore();
        this.showOverlay('🎉 恭喜通关！', `总分: ${Math.floor(this.score)}\n最高连击: ${this.maxCombo}`, '再玩一次');
    }

    showOverlay(title, message, buttonText) {
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').textContent = message;
        document.getElementById('overlayBtn').textContent = buttonText;
        document.getElementById('gameOverlay').classList.remove('hidden');
    }

    updateUI() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        document.getElementById('combo').textContent = this.combo;
    }

    polyfillRoundRect() {
        if (!CanvasRenderingContext2D.prototype.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
                if (typeof radius === 'number') {
                    radius = {tl: radius, tr: radius, br: radius, bl: radius};
                } else {
                    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
                    for (var side in defaultRadius) {
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
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBricks();
        this.drawPowerups();
        this.drawPaddle();
        this.drawBalls();
        this.drawLasers();
        this.drawParticles();
        this.drawPowerupIndicators();
        
        if (this.gameState === 'idle') {
            this.drawCenteredText('点击"开始游戏"按钮开始', this.height / 2);
            this.drawCenteredText('使用方向键或鼠标移动挡板', this.height / 2 + 40, 20);
            this.drawCenteredText('按空格键发射小球，L键发射激光', this.height / 2 + 70, 20);
        } else if (this.gameState === 'paused') {
            this.drawCenteredText('游戏暂停', this.height / 2, 40);
        }
    }

    drawBricks() {
        for (let brick of this.bricks) {
            if (!brick.visible && brick.revealed) continue;

            let color = brick.color;
            if (!brick.revealed && brick.type === 'hidden') {
                color = '#1a1a2e';
            }

            const gradient = this.ctx.createLinearGradient(
                brick.x, brick.y,
                brick.x, brick.y + brick.height
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, this.darkenColor(color, 30));

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.roundRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height / 3, 2);
            this.ctx.fill();

            if (brick.type === 'hard' && brick.hits > 1) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(brick.hits.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2 + 5);
            }

            if (brick.type === 'explosive') {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('💥', brick.x + brick.width / 2, brick.y + brick.height / 2 + 6);
            }

            if (brick.type === 'teleport') {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🌀', brick.x + brick.width / 2, brick.y + brick.height / 2 + 6);
            }
        }
    }

    drawPaddle() {
        const gradient = this.ctx.createLinearGradient(
            this.paddle.x, this.paddle.y,
            this.paddle.x, this.paddle.y + this.paddle.height
        );
        
        let color1 = '#4ecdc4';
        let color2 = '#44a08d';
        
        if (this.paddle.magnetActive) {
            color1 = '#ff00ff';
            color2 = '#9900cc';
        }
        if (this.paddle.laserActive) {
            color1 = '#ff0000';
            color2 = '#cc0000';
        }
        if (this.paddle.speedBoost) {
            color1 = '#ffff00';
            color2 = '#ffaa00';
        }
        
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 8);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddle.x + 5, this.paddle.y + 3, this.paddle.width - 10, 4, 2);
        this.ctx.fill();

        if (this.paddle.laserActive) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(this.paddle.x + 15, this.paddle.y + this.paddle.height / 2, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(this.paddle.x + this.paddle.width - 15, this.paddle.y + this.paddle.height / 2, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawBalls() {
        this.balls.forEach(ball => {
            const gradient = this.ctx.createRadialGradient(
                ball.x - 3, ball.y - 3, 0,
                ball.x, ball.y, ball.radius
            );
            
            if (ball.slowTimer > 0) {
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, '#00ffff');
                gradient.addColorStop(1, '#0088ff');
            } else {
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, '#ffd700');
                gradient.addColorStop(1, '#ff8c00');
            }

            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.shadowColor = ball.slowTimer > 0 ? '#00ffff' : '#ffd700';
            this.ctx.shadowBlur = 15;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    drawLasers() {
        this.lasers.forEach(laser => {
            const gradient = this.ctx.createLinearGradient(laser.x, laser.y, laser.x, laser.y + laser.height);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(1, '#ff6600');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(laser.x - laser.width / 2, laser.y, laser.width, laser.height);
            
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(laser.x - laser.width / 2, laser.y, laser.width, laser.height);
            this.ctx.shadowBlur = 0;
        });
    }

    drawPowerups() {
        const powerupIcons = {
            [POWERUP_TYPES.EXTEND_PADDLE]: '📏',
            [POWERUP_TYPES.MULTI_BALL]: '⚽',
            [POWERUP_TYPES.LASER]: '🔫',
            [POWERUP_TYPES.SLOW_BALL]: '❄️',
            [POWERUP_TYPES.MAGNET]: '🧲',
            [POWERUP_TYPES.SPEED_BOOST]: '⚡'
        };

        this.powerups.forEach(powerup => {
            this.ctx.beginPath();
            this.ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
            
            const gradient = this.ctx.createRadialGradient(
                powerup.x, powerup.y, 0,
                powerup.x, powerup.y, powerup.radius
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#00ff00');
            gradient.addColorStop(1, '#008800');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(powerupIcons[powerup.type], powerup.x, powerup.y + 6);
        });
    }

    drawParticles() {
        for (let p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }

    drawPowerupIndicators() {
        let y = 100;
        const indicators = [];
        
        if (this.paddle.magnetActive) indicators.push({ icon: '🧲', time: this.paddle.magnetTimer });
        if (this.paddle.laserActive) indicators.push({ icon: '🔫', time: this.paddle.laserTimer });
        if (this.paddle.speedBoost) indicators.push({ icon: '⚡', time: this.paddle.speedBoostTimer });
        if (this.activePowerups.extend) indicators.push({ icon: '📏', time: this.activePowerups.extend });
        
        indicators.forEach((ind, i) => {
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(ind.icon, 10, y + i * 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(Math.ceil(ind.time / 60) + 's', 35, y + i * 30 + 5);
        });
    }

    drawCenteredText(text, y, fontSize = 28) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${fontSize}px 'Segoe UI', sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#4ecdc4';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(text, this.width / 2, y);
        this.ctx.shadowBlur = 0;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    saveScore() {
        const entry = {
            name: this.playerName,
            score: Math.floor(this.score),
            level: this.level,
            date: new Date().toLocaleDateString()
        };
        
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);
        localStorage.setItem('breakout_leaderboard', JSON.stringify(this.leaderboard));
    }

    loadLeaderboard() {
        const data = localStorage.getItem('breakout_leaderboard');
        return data ? JSON.parse(data) : [];
    }

    unlockAchievement(achievement) {
        if (!this.achievements[achievement.id]) {
            this.achievements[achievement.id] = true;
            localStorage.setItem('breakout_achievements', JSON.stringify(this.achievements));
            this.showAchievementNotification(achievement);
            this.updateAchievementsUI();
        }
    }

    loadAchievements() {
        const data = localStorage.getItem('breakout_achievements');
        return data ? JSON.parse(data) : {};
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <div>
                <div class="achievement-title">成就解锁！</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    updateAchievementsUI() {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        
        container.innerHTML = '';
        Object.values(ACHIEVEMENTS).forEach(achievement => {
            const div = document.createElement('div');
            div.className = 'achievement-item ' + (this.achievements[achievement.id] ? 'unlocked' : 'locked');
            div.innerHTML = `
                <span class="achievement-icon">${achievement.icon}</span>
                <div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    showLeaderboard() {
        const overlay = document.getElementById('customOverlay');
        document.getElementById('customOverlayTitle').textContent = '🏆 排行榜';
        
        const container = document.getElementById('customOverlayContent');
        if (this.leaderboard.length === 0) {
            container.innerHTML = '<p class="empty-message">暂无记录，快来创造第一个记录吧！</p>';
        } else {
            container.innerHTML = this.leaderboard.map((entry, i) => `
                <div class="leaderboard-item">
                    <span class="rank">${i + 1}</span>
                    <span class="name">${entry.name}</span>
                    <span class="score">${entry.score}</span>
                    <span class="level">第${entry.level}关</span>
                </div>
            `).join('');
        }
        
        overlay.classList.remove('hidden');
    }

    showAchievements() {
        const overlay = document.getElementById('customOverlay');
        document.getElementById('customOverlayTitle').textContent = '🏅 成就徽章';
        
        const container = document.getElementById('customOverlayContent');
        container.innerHTML = '<div id="achievementsList" class="achievements-grid"></div>';
        
        overlay.classList.remove('hidden');
        this.updateAchievementsUI();
    }

    openEditor() {
        const overlay = document.getElementById('customOverlay');
        document.getElementById('customOverlayTitle').textContent = '🎨 关卡编辑器';
        
        const container = document.getElementById('customOverlayContent');
        container.innerHTML = `
            <div class="editor-container">
                <div class="editor-tools">
                    <button class="editor-tool" data-type="normal">普通砖</button>
                    <button class="editor-tool" data-type="hard">硬砖(2HP)</button>
                    <button class="editor-tool" data-type="hidden">隐藏砖</button>
                    <button class="editor-tool" data-type="explosive">爆炸砖</button>
                    <button class="editor-tool" data-type="teleport">传送砖</button>
                    <button class="editor-tool" data-type="empty">橡皮擦</button>
                </div>
                <div id="editorGrid" class="editor-grid"></div>
                <div class="editor-buttons">
                    <button id="clearEditorBtn" class="btn btn-secondary">清空</button>
                    <button id="fillEditorBtn" class="btn btn-secondary">填充普通</button>
                    <button id="exportLevelBtn" class="btn btn-primary">导出JSON</button>
                    <button id="importLevelBtn" class="btn btn-primary">导入JSON</button>
                    <button id="testLevelBtn" class="btn btn-danger">测试关卡</button>
                </div>
            </div>
        `;
        
        overlay.classList.remove('hidden');
        this.initEditor();
    }

    initEditor() {
        const grid = document.getElementById('editorGrid');
        let selectedType = 'normal';
        
        this.editorData = this.createEmptyGrid(8, 10);
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'editor-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => {
                    this.editorData[row][col] = this.createEditorCell(selectedType);
                    this.updateEditorCell(cell, selectedType);
                });
                grid.appendChild(cell);
            }
        }
        
        document.querySelectorAll('.editor-tool').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.editor-tool').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedType = btn.dataset.type;
            });
        });
        
        document.getElementById('clearEditorBtn').addEventListener('click', () => {
            this.editorData = this.createEmptyGrid(8, 10);
            document.querySelectorAll('.editor-cell').forEach(cell => {
                cell.className = 'editor-cell';
            });
        });
        
        document.getElementById('fillEditorBtn').addEventListener('click', () => {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 10; col++) {
                    this.editorData[row][col] = { type: 'normal', hits: 1, points: 10 };
                    const cell = document.querySelector(`.editor-cell[data-row="${row}"][data-col="${col}"]`);
                    this.updateEditorCell(cell, 'normal');
                }
            }
        });

        document.getElementById('exportLevelBtn').addEventListener('click', () => this.exportLevel());
        document.getElementById('importLevelBtn').addEventListener('click', () => this.importLevel());
        document.getElementById('testLevelBtn').addEventListener('click', () => this.testLevel());
    }

    createEditorCell(type) {
        switch (type) {
            case 'normal': return { type: 'normal', hits: 1, points: 10 };
            case 'hard': return { type: 'hard', hits: 2, points: 25 };
            case 'hidden': return { type: 'hidden', hits: 1, points: 30 };
            case 'explosive': return { type: 'explosive', hits: 1, points: 50, dropPowerup: true };
            case 'teleport': return { type: 'teleport', hits: 1, points: 20, teleportTarget: null };
            default: return { type: 'empty' };
        }
    }

    updateEditorCell(cell, type) {
        cell.className = 'editor-cell type-' + type;
    }

    exportLevel() {
        const dataStr = JSON.stringify(this.editorData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom-level.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importLevel() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.editorData = JSON.parse(e.target.result);
                    this.syncEditorGrid();
                } catch (err) {
                    alert('文件格式错误！');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    syncEditorGrid() {
        document.querySelectorAll('.editor-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const cellData = this.editorData[row]?.[col];
            if (cellData) {
                this.updateEditorCell(cell, cellData.type);
            }
        });
    }

    testLevel() {
        this.customLevelData = this.editorData;
        this.closeCustomOverlay();
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectRun = true;
        this.resetPowerups();
        this.paddle.x = (this.width - this.paddle.originalWidth) / 2;
        this.paddle.width = this.paddle.originalWidth;
        this.createInitialBall();
        
        this.bricks = [];
        this.editorData.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell.type === 'empty') return;
                const x = colIndex * (this.brickConfig.width + this.brickConfig.padding) + this.brickConfig.offsetLeft;
                const y = rowIndex * (this.brickConfig.height + this.brickConfig.padding) + this.brickConfig.offsetTop;
                this.bricks.push({
                    x, y,
                    width: this.brickConfig.width,
                    height: this.brickConfig.height,
                    type: cell.type,
                    visible: cell.type !== 'hidden',
                    revealed: cell.type !== 'hidden',
                    hits: cell.hits || 1,
                    maxHits: cell.hits || 1,
                    points: cell.points || 10,
                    color: this.getBrickColor(cell.type, rowIndex),
                    teleportTarget: cell.teleportTarget || null,
                    dropPowerup: cell.dropPowerup || false
                });
            });
        });
        
        this.gameState = 'playing';
        document.getElementById('gameOverlay').classList.add('hidden');
        this.updateUI();
    }

    closeCustomOverlay() {
        document.getElementById('customOverlay').classList.add('hidden');
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BreakoutGame();
});
