class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');

        this.config = {
            gridSize: 15,
            mapWidth: 200,
            mapHeight: 200,
            baseSpeed: 8,
            boostSpeed: 14,
            initialLength: 5,
            aiCount: 8,
            maxFoodCount: 50,
            viewRadius: 40,
            enableFogOfWar: true,
            gameTimer: 180000
        };

        this.gameMode = 'classic';
        this.snakes = [];
        this.playerSnake = null;
        this.foodSystem = null;
        this.particleSystem = null;
        this.camera = null;
        this.minimap = null;
        this.input = null;
        this.teamManager = null;

        this.gameStatus = 'menu';
        this.lastTime = 0;
        this.gameTime = 0;
        this.timeRemaining = 0;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        Leaderboard.init();
        SeasonSystem.init();
        SkinSystem.init();

        this.camera = new Camera(this.canvas, this.config.gridSize);
        this.camera.setMapSize(this.config.mapWidth, this.config.mapHeight);

        this.foodSystem = new FoodSystem(this.config.mapWidth, this.config.mapHeight);
        this.particleSystem = new ParticleSystem(800);

        this.minimap = new MiniMap(this.minimapCanvas, this.config.mapWidth, this.config.mapHeight);
        this.minimap.setViewRadius(this.config.viewRadius);

        this.input = new InputHandler();
        this.input.onStart = () => this.startGame();
        this.input.onPause = () => this.togglePause();
        this.input.onBoostStart = () => {
            if (this.playerSnake && this.playerSnake.isAlive) {
                this.playerSnake.startBoost();
            }
        };
        this.input.onBoostEnd = () => {
            if (this.playerSnake) {
                this.playerSnake.stopBoost();
            }
        };

        this.teamManager = new TeamManager();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setGameMode(mode) {
        this.gameMode = mode;
    }

    createPlayerSnake() {
        const centerX = Math.floor(this.config.mapWidth / 2);
        const centerY = Math.floor(this.config.mapHeight / 2);

        this.playerSnake = new Snake(centerX, centerY, this.config.initialLength, true);
        this.playerSnake.setSkin(SkinSystem.getCurrentSkin());

        if (this.gameMode === 'team') {
            this.playerSnake.teamId = 'red';
            this.teamManager.registerSnake(this.playerSnake, 'red');
        }

        this.snakes.push(this.playerSnake);

        const head = this.playerSnake.getHead();
        this.camera.x = head.x * this.config.gridSize - this.canvas.width / 2;
        this.camera.y = head.y * this.config.gridSize - this.canvas.height / 2;
    }

    createAISnakes() {
        const aiTypes = ['aggressive', 'evasive', 'patrol', 'hunter', 'scout'];
        const teams = this.gameMode === 'team' ? ['red', 'blue', 'green', 'yellow'] : null;

        for (let i = 0; i < this.config.aiCount; i++) {
            let x, y;
            let attempts = 0;
            const maxAttempts = 50;

            do {
                x = 20 + Math.floor(Math.random() * (this.config.mapWidth - 40));
                y = 20 + Math.floor(Math.random() * (this.config.mapHeight - 40));
                attempts++;
            } while (this.isPositionOccupied(x, y) && attempts < maxAttempts);

            if (attempts < maxAttempts) {
                const aiType = aiTypes[i % aiTypes.length];
                const teamId = teams ? teams[i % teams.length] : null;
                const aiSnake = new AISnake(x, y, this.config.initialLength, aiType, teamId);
                this.snakes.push(aiSnake);

                if (teamId) {
                    this.teamManager.registerSnake(aiSnake, teamId);
                }
            }
        }
    }

    isPositionOccupied(x, y) {
        for (const snake of this.snakes) {
            if (snake.containsPosition(x, y)) return true;
        }
        return false;
    }

    resetGame() {
        this.snakes = [];
        this.particleSystem.clear();
        this.teamManager = new TeamManager();

        this.createPlayerSnake();

        if (this.gameMode === 'battle' || this.gameMode === 'team' || this.gameMode === 'timed') {
            this.createAISnakes();
        }

        this.foodSystem.foods = [];
        this.foodSystem.update(0, this.snakes);

        if (this.gameMode === 'battle' || this.gameMode === 'team') {
            this.camera.fogOfWar = this.config.enableFogOfWar;
            this.camera.viewRadius = this.config.viewRadius;
        } else {
            this.camera.fogOfWar = false;
        }

        if (this.gameMode === 'timed') {
            this.timeRemaining = this.config.gameTimer;
        } else {
            this.timeRemaining = 0;
        }

        this.gameTime = 0;
        this.gameStatus = 'idle';
        this.input.reset();

        this.updateUI();
    }

    startGame() {
        if (this.gameStatus === 'idle' || this.gameStatus === 'gameOver') {
            if (this.gameStatus === 'gameOver') {
                this.resetGame();
            }
            this.gameStatus = 'playing';
        }
    }

    togglePause() {
        if (this.gameStatus === 'playing') {
            this.gameStatus = 'paused';
        } else if (this.gameStatus === 'paused') {
            this.gameStatus = 'playing';
        }
    }

    gameOver() {
        this.gameStatus = 'gameOver';

        const rank = this.getCurrentRank();
        const totalPlayers = this.getTotalPlayers();
        const won = (this.gameMode === 'battle' || this.gameMode === 'team') && rank === 1;

        SkinSystem.recordGame(
            this.playerSnake.score,
            this.playerSnake.kills,
            this.playerSnake.getLength(),
            won
        );

        Leaderboard.addEntry(
            this.playerSnake.name,
            this.playerSnake.score,
            this.playerSnake.getLength(),
            this.playerSnake.kills,
            this.gameMode
        );

        if (this.gameMode === 'battle' || this.gameMode === 'team') {
            SeasonSystem.recordGame(this.playerSnake.score, rank, totalPlayers);
        }

        this.showGameOverPanel(rank);
    }

    getCurrentRank() {
        const allSnakes = [...this.snakes].sort((a, b) => b.score - a.score);
        return allSnakes.findIndex(s => s.id === this.playerSnake.id) + 1;
    }

    getTotalPlayers() {
        return this.snakes.filter(s => s.isPlayer || s instanceof AISnake).length;
    }

    getAliveSnakes() {
        return this.snakes.filter(s => s.isAlive);
    }

    showGameOverPanel(rank) {
        const panel = document.getElementById('gameOverPanel');
        const finalLength = document.getElementById('finalLength');
        const finalScore = document.getElementById('finalScore');
        const finalKills = document.getElementById('finalKills');
        const finalRank = document.getElementById('finalRank');
        const highScore = document.getElementById('highScore');

        finalLength.textContent = this.playerSnake.getLength();
        finalScore.textContent = this.playerSnake.score;
        finalKills.textContent = this.playerSnake.kills;
        finalRank.textContent = rank;
        highScore.textContent = Leaderboard.getHighestScore();

        const seasonInfo = document.getElementById('seasonInfo');
        if (this.gameMode === 'battle' || this.gameMode === 'team') {
            const rankName = SeasonSystem.getRankName();
            const rankColor = SeasonSystem.getRankColor();
            const nextProgress = SeasonSystem.getNextRankProgress();
            const seasonProgress = SeasonSystem.getSeasonProgress();
            seasonInfo.innerHTML = `
                <div>赛季段位: <span style="color: ${rankColor}">${rankName}</span> (${SeasonSystem.rating}分)</div>
                <div style="font-size: 12px; margin-top: 5px;">
                    升级进度: ${Math.round(nextProgress.progress * 100)}% → ${nextProgress.nextRank}
                    | 赛季剩余: ${seasonProgress.daysRemaining}天
                </div>
            `;
            seasonInfo.style.display = 'block';
        } else if (this.gameMode === 'timed') {
            seasonInfo.innerHTML = `<div style="color: #f97316">限时挑战结束! 最终得分: ${this.playerSnake.score}</div>`;
            seasonInfo.style.display = 'block';
        } else {
            seasonInfo.style.display = 'none';
        }

        panel.classList.add('show');
    }

    hideGameOverPanel() {
        const panel = document.getElementById('gameOverPanel');
        panel.classList.remove('show');
    }

    updateUI() {
        if (!this.playerSnake) return;

        document.getElementById('scoreDisplay').textContent = this.playerSnake.score;
        document.getElementById('lengthDisplay').textContent = this.playerSnake.getLength();
        document.getElementById('killsDisplay').textContent = this.playerSnake.kills;

        if (this.gameMode === 'battle' || this.gameMode === 'team') {
            const aliveCount = this.getAliveSnakes().length;
            const currentRank = this.getCurrentRank();
            document.getElementById('rankDisplay').textContent = `#${currentRank}`;
            document.getElementById('aliveDisplay').textContent = aliveCount;

            document.querySelectorAll('.battle-only').forEach(el => el.style.display = 'flex');

            if (this.gameMode === 'team' && this.playerSnake.teamId) {
                const teamNames = { red: '红队', blue: '蓝队', green: '绿队', yellow: '黄队' };
                document.getElementById('teamDisplay').textContent = teamNames[this.playerSnake.teamId];
                document.querySelectorAll('.team-only').forEach(el => el.style.display = 'flex');
            } else {
                document.querySelectorAll('.team-only').forEach(el => el.style.display = 'none');
            }
        } else {
            document.querySelectorAll('.battle-only').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.team-only').forEach(el => el.style.display = 'none');
        }

        if (this.gameMode === 'timed') {
            const minutes = Math.floor(this.timeRemaining / 60000);
            const seconds = Math.floor((this.timeRemaining % 60000) / 1000);
            document.getElementById('rankDisplay').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('aliveDisplay').textContent = this.getAliveSnakes().length;
            document.querySelectorAll('.battle-only').forEach(el => el.style.display = 'flex');
        }

        const boostBar = document.getElementById('boostBar');
        const canBoost = this.playerSnake.body.length > 5;
        boostBar.style.opacity = canBoost ? (this.playerSnake.isBoosting ? '1' : '0.7') : '0.3';

        if (this.playerSnake.isBoosting) {
            const remainingBoost = Math.max(0, this.playerSnake.body.length - 5);
            boostBar.querySelector('.boost-text').textContent = `加速中 - 剩余: ${remainingBoost}`;
        } else {
            boostBar.querySelector('.boost-text').textContent = '按住空格加速';
        }
    }

    processInput() {
        if (!this.playerSnake || !this.playerSnake.isAlive) return;

        const direction = this.input.getNextDirection();
        if (direction) {
            this.playerSnake.setDirection(direction.x, direction.y);
        }
    }

    checkCollisions() {
        for (const snake of this.snakes) {
            if (!snake.isAlive) continue;

            if (snake.checkWallCollision(this.config.mapWidth, this.config.mapHeight)) {
                this.handleSnakeDeath(snake);
                continue;
            }

            if (snake.checkSelfCollision()) {
                this.handleSnakeDeath(snake);
                continue;
            }

            for (const otherSnake of this.snakes) {
                if (!otherSnake.isAlive || otherSnake.id === snake.id) continue;

                if (snake.teamId && otherSnake.teamId && snake.teamId === otherSnake.teamId) {
                    continue;
                }

                const collision = snake.checkSnakeCollision(otherSnake);
                if (collision.collided) {
                    if (collision.isHeadCollision) {
                        this.handleSnakeDeath(snake, null);
                        this.handleSnakeDeath(otherSnake, null);
                    } else {
                        const killer = otherSnake;
                        this.handleSnakeDeath(snake, killer);
                    }
                    break;
                }
            }
        }
    }

    checkFoodCollision() {
        for (const snake of this.snakes) {
            if (!snake.isAlive) continue;

            const head = snake.getHead();

            for (let i = this.foodSystem.foods.length - 1; i >= 0; i--) {
                const food = this.foodSystem.foods[i];
                if (food.x === head.x && food.y === head.y) {
                    food.applyEffect(snake);

                    if (snake.isPlayer) {
                        const colors = ['#ffffff', food.color];
                        this.particleSystem.emitFoodCollect(food.x, food.y, food.color, 12);
                    }

                    this.foodSystem.foods.splice(i, 1);
                    break;
                }
            }
        }
    }

    handleSnakeDeath(snake, killer = null) {
        if (!snake.isAlive) return;

        const shieldBroken = snake.die(killer) === false;

        if (shieldBroken) {
            const head = snake.getHead();
            this.particleSystem.emitShieldBreak(head.x, head.y);
            return;
        }

        if (killer) {
            const bonusLength = Math.floor(snake.getLength() * 0.3);
            for (let i = 0; i < bonusLength; i++) {
                killer.growSnake();
            }
            killer.score += 100 + Math.floor(snake.score * 0.2);
        }

        this.foodSystem.createRemains(snake);

        const head = snake.getHead();
        const colors = snake.isPlayer ? ['#00ffff', '#00ff88', '#ffffff', '#ff6b6b'] : [snake.customBodyColor || '#ff6b6b', '#ffffff', snake.customHeadColor || '#ff6b6b'];
        this.particleSystem.emitDeathExplosion(head.x, head.y, colors, 60);

        if (snake.isPlayer) {
            setTimeout(() => this.gameOver(), 500);
        }
    }

    update(deltaTime) {
        if (this.gameStatus !== 'playing') return;

        this.gameTime += deltaTime;

        if (this.gameMode === 'timed') {
            this.timeRemaining -= deltaTime;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.gameOver();
                return;
            }
        }

        this.processInput();

        if (this.playerSnake && this.playerSnake.isAlive) {
            this.playerSnake.update(deltaTime);
        }

        for (const snake of this.snakes) {
            if (!snake.isAlive) continue;
            if (snake.isPlayer) continue;

            if (snake instanceof AISnake) {
                snake.update(deltaTime, this.snakes, this.foodSystem, this.config.mapWidth, this.config.mapHeight);
            } else {
                snake.update(deltaTime);
            }
        }

        this.checkCollisions();
        this.checkFoodCollision();

        this.foodSystem.update(deltaTime, this.snakes);

        this.particleSystem.update(deltaTime);

        if (this.playerSnake && this.playerSnake.isAlive) {
            const head = this.playerSnake.getHead();
            this.camera.update(head.x, head.y);
        }

        this.minimap.update(this.playerSnake, this.snakes, this.foodSystem.foods);

        this.updateUI();
    }

    render() {
        this.camera.clear();

        if (this.gameStatus === 'menu') {
            this.renderMenuBackground();
            return;
        }

        this.camera.drawGrid();
        this.camera.drawBorders();

        this.particleSystem.draw(this.ctx, this.config.gridSize, this.camera);

        this.foodSystem.draw(this.ctx, this.config.gridSize, this.camera);

        for (const snake of this.snakes) {
            if (snake.isPlayer) continue;
            this.camera.drawSnake(snake, this.particleSystem);
        }

        if (this.playerSnake) {
            this.camera.drawSnake(this.playerSnake, this.particleSystem);
        }

        this.minimap.draw();

        if (this.playerSnake && this.playerSnake.isAlive) {
            const head = this.playerSnake.getHead();
            this.camera.drawFogOfWar(head);
            this.camera.drawStatusEffects(this.playerSnake);
        }

        if (this.gameStatus === 'idle') {
            this.renderStartMessage();
        } else if (this.gameStatus === 'paused') {
            this.renderPauseMessage();
        }
    }

    renderMenuBackground() {
        const ctx = this.ctx;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < 50; i++) {
            const x = (Math.sin(time * 0.5 + i * 0.5) + 1) / 2 * this.canvas.width;
            const y = (Math.cos(time * 0.3 + i * 0.7) + 1) / 2 * this.canvas.height;
            const size = 2 + Math.sin(time + i) * 1;
            const alpha = 0.3 + Math.sin(time * 2 + i) * 0.2;

            ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderStartMessage() {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const modeNames = { classic: '经典模式', battle: '竞技模式', team: '团队竞技', timed: '限时挑战' };
        const modeText = modeNames[this.gameMode] || '经典模式';
        ctx.fillText(`贪吃蛇大作战 - ${modeText}`, this.canvas.width / 2, this.canvas.height / 2 - 80);

        ctx.font = '24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#00ff88';
        ctx.fillText('按方向键或 WASD 开始游戏', this.canvas.width / 2, this.canvas.height / 2);

        ctx.font = '18px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#888888';
        ctx.fillText('空格键加速 | ESC/P 暂停', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    renderPauseMessage() {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText('暂停', this.canvas.width / 2, this.canvas.height / 2);

        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#888888';
        ctx.fillText('按 ESC 或 P 继续', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

function startGame(mode) {
    if (window.game) {
        window.game.hideGameOverPanel();
        window.game.setGameMode(mode);
        window.game.resetGame();
        window.game.gameStatus = 'idle';
        document.getElementById('mainMenu').classList.remove('show');
        document.getElementById('gameHUD').classList.add('show');
    }
}

function restartGame() {
    if (window.game) {
        window.game.hideGameOverPanel();
        window.game.resetGame();
    }
}

function showMenu() {
    if (window.game) {
        window.game.hideGameOverPanel();
        window.game.gameStatus = 'menu';
        document.getElementById('mainMenu').classList.add('show');
        document.getElementById('gameHUD').classList.remove('show');
    }
}

function showLeaderboard() {
    const panel = document.getElementById('leaderboardPanel');
    const list = document.getElementById('leaderboardList');

    const entries = Leaderboard.getTopEntries(10);
    const statsHTML = `
        <div class="stats-summary">
            <div class="stat-mini">
                <span class="stat-mini-label">总场次</span>
                <span class="stat-mini-value">${Leaderboard.getTotalGames()}</span>
            </div>
            <div class="stat-mini">
                <span class="stat-mini-label">最高分</span>
                <span class="stat-mini-value">${Leaderboard.getHighestScore()}</span>
            </div>
            <div class="stat-mini">
                <span class="stat-mini-label">平均分</span>
                <span class="stat-mini-value">${Leaderboard.getAverageScore()}</span>
            </div>
            <div class="stat-mini">
                <span class="stat-mini-label">最多击杀</span>
                <span class="stat-mini-value">${Leaderboard.getMostKills()}</span>
            </div>
            <div class="stat-mini">
                <span class="stat-mini-label">最佳排名</span>
                <span class="stat-mini-value">#${Leaderboard.getBestRank()}</span>
            </div>
            <div class="stat-mini">
                <span class="stat-mini-label">成就数</span>
                <span class="stat-mini-value">${Leaderboard.getAchievements().length}</span>
            </div>
        </div>
    `;

    list.innerHTML = statsHTML + entries.map((entry, i) => {
        const modeNames = { classic: '经典', battle: '竞技', team: '团队', timed: '限时' };
        const date = new Date(entry.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        return `
        <div class="leaderboard-item">
            <span class="rank ${i < 3 ? 'top' : ''}">#${entry.rank}</span>
            <span class="name">${entry.name}</span>
            <span class="mode">${modeNames[entry.gameMode] || entry.gameMode}</span>
            <span class="score">${entry.score}</span>
            <span class="date">${dateStr}</span>
        </div>
    `}).join('');

    panel.classList.add('show');
}

function hideLeaderboard() {
    document.getElementById('leaderboardPanel').classList.remove('show');
}

function showSkinSelector() {
    const panel = document.getElementById('skinPanel');
    const list = document.getElementById('skinList');
    const currentSkin = SkinSystem.getCurrentSkin();

    list.innerHTML = SkinSystem.skins.map(skin => {
        const isSelected = skin.id === currentSkin.id;
        const isLocked = !skin.unlocked;
        const unlockDesc = SkinSystem.getUnlockDescription(skin);

        return `
        <div class="skin-item ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}"
             onclick="${!isLocked ? `selectSkin('${skin.id}')` : ''}">
            <div class="skin-preview" style="background: linear-gradient(90deg, ${skin.bodyColors.join(', ')})"></div>
            <div class="skin-info">
                <span class="skin-name">${skin.name}</span>
                ${isLocked ? `<span class="skin-price">${unlockDesc}</span>` : ''}
            </div>
        </div>
    `}).join('');

    panel.classList.add('show');
}

function selectSkin(skinId) {
    SkinSystem.setCurrentSkin(skinId);
    showSkinSelector();
}

function hideSkinSelector() {
    document.getElementById('skinPanel').classList.remove('show');
}

window.addEventListener('load', () => {
    window.game = new Game();
});