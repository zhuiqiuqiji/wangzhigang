class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();

        this.state = 'menu';
        this.score = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.lastTime = 0;
        this.deltaTime = 0;

        this.keys = {};

        this.player = new Player(this.canvas);
        this.enemyManager = new EnemyManager();
        this.bulletManager = new BulletManager();
        this.itemManager = new ItemManager();
        this.particles = new ParticleSystem();
        this.starField = new StarField(this.canvas);
        this.spellCardSystem = new SpellCardSystem(this);
        this.characterManager = new CharacterManager();

        this.currentCharacter = this.characterManager.getCharacter('reimu');
        this.selectedCharacterId = 'reimu';

        this.slowFieldActive = false;
        this.slowFieldTimer = 0;
        this.screenClearActive = false;
        this.screenClearTimer = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.bombCount = 3;
        this.selectedSpellCard = 'dream_seal';

        this.screenShake = 0;
        this.flashColor = null;
        this.flashAlpha = 0;

        this.grazeEffects = [];
        this.bossDefeated = false;

        this.setupInput();
        this.setupUI();
        this.setupEventListeners();
        this.setupCharacterScreen();

        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    setupCanvas() {
        this.canvas.width = Math.min(window.innerWidth - 40, 800);
        this.canvas.height = Math.min(window.innerHeight - 40, 600);
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'Space') {
                e.preventDefault();
                this.player.isShooting = true;
            }

            if (e.code === 'KeyX' && this.state === 'playing') {
                this.useSpellCard();
            }

            if (e.code === 'Escape') {
                if (this.state === 'playing') {
                    this.pauseGame();
                } else if (this.state === 'paused') {
                    this.resumeGame();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;

            if (e.code === 'Space') {
                this.player.isShooting = false;
            }
        });

        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.player.resize(this.canvas.width, this.canvas.height);
            this.starField.resize(this.canvas.width, this.canvas.height);
        });
    }

    setupUI() {
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.coinsElement = document.getElementById('coins');
        this.grazeElement = document.getElementById('graze');
        this.powerLevelElement = document.getElementById('powerLevel');
        this.bombsElement = document.getElementById('bombs');
        this.shieldIndicator = document.getElementById('shieldIndicator');
        this.slowField = document.getElementById('slowField');
        this.startScreen = document.getElementById('startScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.survivalTimeElement = document.getElementById('survivalTime');
        this.finalCoinsElement = document.getElementById('finalCoins');
        this.finalGrazeElement = document.getElementById('finalGraze');
        this.finalComboElement = document.getElementById('finalCombo');
        this.pauseScoreElement = document.getElementById('pauseScore');
        this.pauseGrazeElement = document.getElementById('pauseGraze');
        this.spellCardDisplay = document.getElementById('spellCardDisplay');
        this.spellNameElement = document.getElementById('spellName');
        this.spellTimerElement = document.getElementById('spellTimer');
        this.spellCardBanner = document.getElementById('spellCardBanner');
        this.bannerSpellName = document.getElementById('bannerSpellName');
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtnPause').addEventListener('click', () => this.startGame());
        document.getElementById('quitBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('backToMenuBtn2').addEventListener('click', () => this.backToMenu());

        document.getElementById('characterBtn').addEventListener('click', () => {
            this.startScreen.classList.add('hidden');
            this.characterScreen = document.getElementById('characterScreen');
            this.characterScreen.classList.remove('hidden');
        });
    }

    setupCharacterScreen() {
        this.characterScreen = document.getElementById('characterScreen');
        this.characterGrid = document.getElementById('characterGrid');
        this.renderCharacterGrid();

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.characterScreen.classList.add('hidden');
            this.startScreen.classList.remove('hidden');
        });

        document.getElementById('confirmCharBtn').addEventListener('click', () => {
            this.currentCharacter = this.characterManager.getCharacter(this.selectedCharacterId);
            this.characterScreen.classList.add('hidden');
            this.startScreen.classList.remove('hidden');
        });
    }

    renderCharacterGrid() {
        const characters = this.characterManager.getCharacters();
        this.characterGrid.innerHTML = '';

        characters.forEach(char => {
            const card = document.createElement('div');
            card.className = `character-card ${char.id === this.selectedCharacterId ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="character-preview">
                    <canvas width="80" height="80" id="preview_${char.id}"></canvas>
                </div>
                <div class="character-name">${char.name}</div>
                <div class="character-desc">${char.description}</div>
                <div class="character-stats">
                    <div class="stat-row"><span>速度</span><span class="stat-val">${char.speed}</span></div>
                    <div class="stat-row"><span>火力</span><span class="stat-val">${char.damageMultiplier}</span></div>
                    <div class="stat-row"><span>射速</span><span class="stat-val">${(1000 / char.shootCooldown).toFixed(1)}</span></div>
                    <div class="stat-row"><span>判定</span><span class="stat-val">${char.hitboxRadius}</span></div>
                </div>
            `;
            card.addEventListener('click', () => {
                this.selectedCharacterId = char.id;
                this.renderCharacterGrid();
            });
            this.characterGrid.appendChild(card);

            setTimeout(() => {
                const previewCanvas = document.getElementById(`preview_${char.id}`);
                if (previewCanvas) {
                    const ctx = previewCanvas.getContext('2d');
                    this.characterManager.drawCharacterPreview(ctx, char, 40, 45, 60);
                }
            }, 0);
        });
    }

    useSpellCard() {
        if (this.bombCount <= 0) return;
        if (this.spellCardSystem.isActive()) return;

        const card = this.spellCardSystem.spellCards.find(c => c.id === this.selectedSpellCard);
        if (!card) return;

        if (this.spellCardSystem.useSpellCard(this.selectedSpellCard, this.player)) {
            this.bombCount--;
            this.showSpellCardBanner(card.spellName);
            this.screenShake = 10;
            this.flashColor = card.color;
            this.flashAlpha = 0.4;
        }
    }

    showSpellCardBanner(name) {
        this.bannerSpellName.textContent = name;
        this.spellCardBanner.classList.remove('hidden');
        setTimeout(() => {
            this.spellCardBanner.classList.add('hidden');
        }, 3000);
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.bombCount = 3;
        this.bossDefeated = false;
        this.grazeEffects = [];

        this.player.reset();
        if (this.currentCharacter) {
            this.characterManager.applyCharacterToPlayer(this.player, this.currentCharacter.id);
        }

        this.enemyManager.reset();
        this.bulletManager.reset();
        this.itemManager.clear();
        this.particles.clear();
        this.spellCardSystem.clearAll();

        this.slowFieldActive = false;
        this.slowFieldTimer = 0;

        this.hideAllScreens();
        this.updateHUD();
    }

    pauseGame() {
        this.state = 'paused';
        this.pauseScoreElement.textContent = Math.floor(this.score);
        this.pauseGrazeElement.textContent = this.player.maxGraze;
        this.pauseScreen.classList.remove('hidden');
    }

    resumeGame() {
        this.state = 'playing';
        this.pauseScreen.classList.add('hidden');
    }

    backToMenu() {
        this.state = 'menu';
        this.hideAllScreens();
        this.startScreen.classList.remove('hidden');
    }

    gameOver() {
        this.state = 'gameover';
        this.finalScoreElement.textContent = Math.floor(this.score);
        this.survivalTimeElement.textContent = Math.floor(this.elapsedTime / 1000) + '秒';
        this.finalCoinsElement.textContent = this.player.coins;
        this.finalGrazeElement.textContent = this.player.maxGraze;
        this.finalComboElement.textContent = this.player.maxCombo;
        this.gameOverScreen.classList.remove('hidden');

        this.screenShake = 20;
        this.flashColor = '#ff0000';
        this.flashAlpha = 0.5;
    }

    hideAllScreens() {
        this.startScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        if (this.characterScreen) {
            this.characterScreen.classList.add('hidden');
        }
    }

    handleInput() {
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.player.moveUp();
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.player.moveDown();
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.player.moveLeft();
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.player.moveRight();
        }
    }

    triggerScreenClear() {
        this.bulletManager.enemyBullets.forEach(b => {
            this.particles.emit(b.x, b.y, '#ff6600', 5, 3, 25, 3);
            b.active = false;
        });
        this.bulletManager.enemyBullets = [];
        this.flashColor = '#ff6600';
        this.flashAlpha = 0.4;
        this.screenShake = 10;
    }

    activateSlowField(duration) {
        this.slowFieldActive = true;
        this.slowFieldTimer = duration;
        this.slowField.classList.remove('hidden');
    }

    onGraze(x, y) {
        this.score += 50;
        this.player.addGraze(1);
        this.grazeEffects.push({ x, y, time: 0, maxTime: 1000 });

        if (this.player.combo % 10 === 0 && this.player.combo > 0) {
            this.score += 100;
        }
    }

    onBossDefeated(boss) {
        this.score += boss.points * 10;
        this.itemManager.spawnBossDrop(boss.x, boss.y);
        this.bossDefeated = true;
        this.screenShake = 20;
        this.flashColor = '#ffd700';
        this.flashAlpha = 0.5;
    }

    update() {
        if (this.state !== 'playing') return;

        const currentTime = Date.now();
        this.elapsedTime = currentTime - this.startTime;
        this.score += 10 * (this.deltaTime / 1000);

        this.handleInput();

        this.player.update(this.deltaTime, this.particles);

        if (this.player.isShooting) {
            const bullets = this.player.shoot(currentTime);
            this.bulletManager.addPlayerBullets(bullets);
        }

        this.enemyManager.update(this.player, this.canvas, this.deltaTime, this.bulletManager, this.particles, this);
        this.bulletManager.update(this.canvas, this.player, this.enemyManager);
        this.spellCardSystem.update(this.deltaTime);

        this.bulletManager.checkGraze(this.player, this);

        const hitScore = this.bulletManager.checkPlayerBulletCollision(this.enemyManager, this.particles, this.itemManager);
        if (hitScore > 0) {
            this.score += hitScore;
            this.screenShake = 5;
        }

        if (this.slowFieldActive) {
            this.slowFieldTimer -= this.deltaTime;
            if (this.slowFieldTimer <= 0) {
                this.slowFieldActive = false;
                this.slowField.classList.add('hidden');
            }
        }

        const playerHit = this.bulletManager.checkEnemyBulletCollision(this.player, this.particles) ||
                          this.enemyManager.checkPlayerCollision(this.player, this.particles);

        if (playerHit) {
            this.screenShake = 15;
            this.flashColor = '#ff0000';
            this.flashAlpha = 0.3;

            if (this.player.lives <= 0) {
                this.gameOver();
            }
        }

        this.itemManager.update(this.player, this.canvas);
        this.itemManager.checkCollision(this.player, this.particles, this);
        this.particles.update();
        this.starField.update();

        this.grazeEffects = this.grazeEffects.filter(effect => {
            effect.time += this.deltaTime;
            return effect.time < effect.maxTime;
        });

        if (this.screenShake > 0) this.screenShake *= 0.9;
        if (this.flashAlpha > 0) this.flashAlpha *= 0.9;

        this.updateHUD();
    }

    updateHUD() {
        this.scoreElement.textContent = Math.floor(this.score);
        this.coinsElement.textContent = this.player.coins;
        this.grazeElement.textContent = this.player.maxGraze;
        this.powerLevelElement.textContent = this.player.powerLevel.toFixed(2);

        let hearts = '';
        for (let i = 0; i < this.player.lives; i++) {
            hearts += '❤';
        }
        this.livesElement.textContent = hearts;

        let bombs = '';
        for (let i = 0; i < this.bombCount; i++) {
            bombs += '✦';
        }
        this.bombsElement.textContent = bombs || '—';

        if (this.player.hasShield) {
            this.shieldIndicator.classList.remove('hidden');
        } else {
            this.shieldIndicator.classList.add('hidden');
        }

        if (this.spellCardSystem.isActive()) {
            const card = this.spellCardSystem.getActiveCard();
            this.spellCardDisplay.classList.remove('hidden');
            this.spellNameElement.textContent = card.spellName;
            const remaining = Math.ceil(this.spellCardSystem.activeTimer / 1000);
            this.spellTimerElement.textContent = `00:${remaining.toString().padStart(2, '0')}`;
        } else {
            this.spellCardDisplay.classList.add('hidden');
        }
    }

    draw() {
        this.ctx.save();

        if (this.screenShake > 0.5) {
            this.ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
        }

        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.starField.draw(this.ctx);

        if (this.state === 'playing' || this.state === 'paused' || this.state === 'gameover') {
            this.itemManager.draw(this.ctx);
            this.bulletManager.draw(this.ctx);
            this.enemyManager.draw(this.ctx);
            this.player.draw(this.ctx);
            this.particles.draw(this.ctx);
            this.spellCardSystem.draw(this.ctx);

            this.grazeEffects.forEach(effect => {
                const progress = effect.time / effect.maxTime;
                this.ctx.save();
                this.ctx.globalAlpha = 1 - progress;
                this.ctx.fillStyle = '#00ff88';
                this.ctx.font = 'bold 14px "Press Start 2P"';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GRAZE +50', effect.x, effect.y - progress * 30);
                this.ctx.restore();
            });
        }

        if (this.flashAlpha > 0.05) {
            this.ctx.globalAlpha = this.flashAlpha;
            this.ctx.fillStyle = this.flashColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;
        }

        this.ctx.restore();
    }

    gameLoop(timestamp) {
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.deltaTime > 100) this.deltaTime = 16;

        this.update();
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }
}

window.addEventListener('load', () => {
    window.gameInstance = new Game();
});