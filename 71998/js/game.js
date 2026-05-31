const GameState = {
    MENU: 'menu',
    LEVEL_SELECT: 'levelSelect',
    SKIN_SELECT: 'skinSelect',
    LEADERBOARD: 'leaderboard',
    LEVEL_EDITOR: 'levelEditor',
    PLAYING: 'playing',
    WIN: 'win',
    FAIL: 'fail'
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.state = GameState.MENU;
        this.currentLevel = 0;
        this.score = 0;
        this.stars = 0;
        this.gems = 0;
        this.totalStars = 0;
        this.totalGems = 0;
        this.levelStars = 0;
        this.levelGems = 0;
        this.levelTime = 0;
        this.tookDamage = false;
        
        this.ball = null;
        this.platforms = [];
        this.starEntities = [];
        this.gemEntities = [];
        this.powerUpEntities = [];
        this.spinningSaws = [];
        this.goal = null;
        this.particles = [];
        this.scorePopups = [];
        this.time = 0;
        this.lastTime = 0;
        this.animationId = null;
        this.fireworkTimer = 0;

        console.log('GameProfile 类方法:', Object.getOwnPropertyNames(GameProfile.prototype));
        this.profile = new GameProfile();
        console.log('profile 实例方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.profile)));
        console.log('getLevelRating 存在:', typeof this.profile.getLevelRating);
        this.profile.load();

        this.dailyChallenge = generateDailyChallenge();

        this.input = new InputManager(this);
        this.setupUI();
        this.resize();
        this.loadLevel(0);
        this.gameLoop(0);
    }

    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('levelSelectBtn').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('skinSelectBtn').addEventListener('click', () => this.showSkinSelect());
        document.getElementById('leaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('editorBtn').addEventListener('click', () => this.showLevelEditor());
        document.getElementById('dailyChallengeBtn').addEventListener('click', () => this.startDailyChallenge());
        
        document.getElementById('retryBtn').addEventListener('click', () => this.restart());
        document.getElementById('menuBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('restartFromWinBtn').addEventListener('click', () => this.restart());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('backToMenuBtn2').addEventListener('click', () => this.showMenu());
        document.getElementById('backToMenuBtn3').addEventListener('click', () => this.showMenu());
        document.getElementById('backToMenuBtn4').addEventListener('click', () => this.showMenu());

        this.setupLevelButtons();
        this.setupSkinButtons();
    }

    setupLevelButtons() {
        const levelGrid = document.getElementById('levelGrid');
        levelGrid.innerHTML = '';
        
        levels.forEach((level, index) => {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.innerHTML = `
                <div class="level-num">${level.id}</div>
                <div class="level-name">${level.name}</div>
                <div class="level-stars">
                    ${this.getLevelStarsDisplay(index)}
                </div>
            `;
            btn.addEventListener('click', () => this.startLevel(index));
            levelGrid.appendChild(btn);
        });

        const dailyBtn = document.createElement('button');
        dailyBtn.className = 'level-btn daily-challenge';
        dailyBtn.innerHTML = `
            <div class="level-num">📅</div>
            <div class="level-name">每日挑战</div>
            <div class="level-stars">🎁 特殊奖励</div>
        `;
        dailyBtn.addEventListener('click', () => this.startDailyChallenge());
        levelGrid.appendChild(dailyBtn);
    }

    getLevelStarsDisplay(levelIndex) {
        const rating = this.profile.getLevelRating(levelIndex);
        if (!rating) return '☆☆☆';
        let stars = '';
        for (let i = 0; i < 3; i++) {
            stars += i < rating.stars ? '⭐' : '☆';
        }
        return stars;
    }

    setupSkinButtons() {
        const skinGrid = document.getElementById('skinGrid');
        skinGrid.innerHTML = '';
        
        Object.values(BallSkin).forEach(skin => {
            const unlocked = this.profile.isSkinUnlocked(skin.id);
            const btn = document.createElement('button');
            btn.className = `skin-btn ${unlocked ? '' : 'locked'} ${this.profile.currentSkin === skin.id ? 'selected' : ''}`;
            btn.innerHTML = `
                <div class="skin-preview" style="background: linear-gradient(135deg, ${skin.color1}, ${skin.color2})"></div>
                <div class="skin-name">${skin.name}</div>
                ${!unlocked ? `<div class="skin-lock">🔒 ${skin.unlockCondition}</div>` : ''}
            `;
            if (unlocked) {
                btn.addEventListener('click', () => this.selectSkin(skin.id));
            }
            skinGrid.appendChild(btn);
        });
    }

    selectSkin(skinId) {
        this.profile.currentSkin = skinId;
        this.profile.save();
        this.setupSkinButtons();
        if (this.ball) {
            this.ball.setSkin(skinId);
        }
    }

    resize() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(window.innerWidth, 900);
        const maxHeight = Math.min(window.innerHeight, 1200);
        const scale = Math.min(maxWidth / CANVAS_WIDTH, maxHeight / CANVAS_HEIGHT);
        
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        this.canvas.style.width = `${CANVAS_WIDTH * scale}px`;
        this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
        
        this.renderer.resize(window.innerWidth, window.innerHeight);
    }

    loadLevel(levelIndex, isDailyChallenge = false) {
        this.currentLevel = levelIndex;
        this.isDailyChallenge = isDailyChallenge;
        
        let levelData;
        if (isDailyChallenge) {
            levelData = this.dailyChallenge;
        } else {
            levelData = levels[levelIndex];
        }
        
        if (!levelData) {
            this.showAllLevelsComplete();
            return;
        }

        const entities = createLevelEntities(levelData);
        
        this.platforms = entities.platforms;
        this.starEntities = entities.stars;
        this.gemEntities = entities.gems;
        this.powerUpEntities = entities.powerUps || [];
        this.spinningSaws = entities.spinningSaws || [];
        this.goal = entities.goal;
        this.ball = new Ball(levelData.startPos.x, levelData.startPos.y, BALL_RADIUS);
        this.ball.setSkin(this.profile.currentSkin);
        
        this.particles = [];
        this.scorePopups = [];
        
        this.levelStars = this.starEntities.length;
        this.levelGems = this.gemEntities.length;
        
        this.stars = 0;
        this.gems = 0;
        this.levelTime = 0;
        this.tookDamage = false;
        
        this.updateHUD();
        
        const levelDisplay = isDailyChallenge ? '每日挑战' : `关卡 ${levelData.id}`;
        document.getElementById('levelDisplay').textContent = levelDisplay;
    }

    showMenu() {
        this.setState(GameState.MENU);
        this.hideAllScreens();
        this.showScreen('menuScreen', true);
        document.getElementById('dashIndicator').classList.add('hidden');
    }

    showLevelSelect() {
        this.setState(GameState.LEVEL_SELECT);
        this.setupLevelButtons();
        this.hideAllScreens();
        this.showScreen('levelSelectScreen', true);
        document.getElementById('dashIndicator').classList.add('hidden');
    }

    showSkinSelect() {
        this.setState(GameState.SKIN_SELECT);
        this.setupSkinButtons();
        this.updateSkinStats();
        this.hideAllScreens();
        this.showScreen('skinSelectScreen', true);
        document.getElementById('dashIndicator').classList.add('hidden');
    }

    updateSkinStats() {
        document.getElementById('totalStarsCollected').textContent = this.profile.totalStars;
        document.getElementById('levelsCompleted').textContent = this.profile.completedLevels.size;
        document.getElementById('noDamageRuns').textContent = this.profile.noDamageCount;
    }

    showLeaderboard() {
        this.setState(GameState.LEADERBOARD);
        this.updateLeaderboardDisplay();
        this.hideAllScreens();
        this.showScreen('leaderboardScreen', true);
        document.getElementById('dashIndicator').classList.add('hidden');
    }

    updateLeaderboardDisplay() {
        const list = document.getElementById('leaderboardList');
        list.innerHTML = '';
        
        const scores = this.profile.highScores
            .map((score, index) => ({ ...score, index }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        if (scores.length === 0) {
            list.innerHTML = '<div class="no-scores">暂无记录，开始游戏创造你的记录吧！</div>';
            return;
        }
        
        scores.forEach((entry, rank) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
            item.innerHTML = `
                <span class="rank">${medal}</span>
                <span class="score-info">
                    <span class="player-name">${entry.isDailyChallenge ? '每日挑战' : `关卡 ${entry.levelId}`}</span>
                    <span class="score-date">${entry.date}</span>
                </span>
                <span class="score-value">${entry.score.toLocaleString()}</span>
            `;
            list.appendChild(item);
        });
    }

    showLevelEditor() {
        this.setState(GameState.LEVEL_EDITOR);
        this.hideAllScreens();
        this.showScreen('levelEditorScreen', true);
        document.getElementById('dashIndicator').classList.add('hidden');
        this.initLevelEditor();
    }

    initLevelEditor() {
        if (this.editorInitialized) return;
        this.editorInitialized = true;
        
        document.getElementById('testLevelBtn').addEventListener('click', () => this.testCustomLevel());
        document.getElementById('saveLevelBtn').addEventListener('click', () => this.saveCustomLevel());
        document.getElementById('clearLevelBtn').addEventListener('click', () => this.clearCustomLevel());
        document.getElementById('loadCommunityBtn').addEventListener('click', () => this.loadCommunityLevels());
        
        this.updateCommunityLevelsList();
    }

    testCustomLevel() {
        const levelData = this.getEditorLevelData();
        if (!levelData) return;
        
        const entities = createLevelEntities(levelData);
        this.platforms = entities.platforms;
        this.starEntities = entities.stars;
        this.gemEntities = entities.gems;
        this.powerUpEntities = entities.powerUps || [];
        this.spinningSaws = entities.spinningSaws || [];
        this.goal = entities.goal;
        this.ball = new Ball(levelData.startPos.x, levelData.startPos.y, BALL_RADIUS);
        this.ball.setSkin(this.profile.currentSkin);
        
        this.levelStars = this.starEntities.length;
        this.levelGems = this.gemEntities.length;
        this.stars = 0;
        this.gems = 0;
        this.levelTime = 0;
        this.tookDamage = false;
        this.isCustomLevel = true;
        
        this.setState(GameState.PLAYING);
        this.hideAllScreens();
        document.getElementById('dashIndicator').classList.remove('hidden');
    }

    getEditorLevelData() {
        try {
            const jsonStr = document.getElementById('levelJsonInput').value;
            return JSON.parse(jsonStr);
        } catch (e) {
            alert('JSON格式错误，请检查输入！');
            return null;
        }
    }

    saveCustomLevel() {
        const levelData = this.getEditorLevelData();
        if (!levelData) return;
        
        const name = prompt('请输入关卡名称：');
        if (!name) return;
        
        levelData.name = name;
        levelData.id = 'C' + Date.now();
        levelData.author = prompt('请输入作者名：') || '匿名';
        levelData.createdAt = new Date().toISOString();
        
        this.profile.addCommunityLevel(levelData);
        this.profile.save();
        this.updateCommunityLevelsList();
        alert('关卡保存成功！');
    }

    clearCustomLevel() {
        document.getElementById('levelJsonInput').value = JSON.stringify({
            id: 99,
            name: '自定义关卡',
            startPos: { x: 400, y: 100 },
            targetTime: 60,
            platforms: [
                { x: 100, y: 200, width: 600, height: 20, type: 'normal' },
                { x: 200, y: 400, width: 400, height: 20, type: 'normal' }
            ],
            stars: [{ x: 400, y: 300 }],
            gems: [],
            powerUps: [],
            spinningSaws: [],
            goal: { x: 400, y: 1100, width: 120, height: 60 }
        }, null, 2);
    }

    loadCommunityLevels() {
        const list = document.getElementById('communityLevelsList');
        const level = this.profile.communityLevels[list.selectedIndex];
        if (level) {
            document.getElementById('levelJsonInput').value = JSON.stringify(level, null, 2);
        }
    }

    updateCommunityLevelsList() {
        const list = document.getElementById('communityLevelsList');
        list.innerHTML = '';
        
        if (this.profile.communityLevels.length === 0) {
            list.innerHTML = '<option>暂无社区关卡</option>';
            return;
        }
        
        this.profile.communityLevels.forEach(level => {
            const option = document.createElement('option');
            option.textContent = `${level.name} - ${level.author}`;
            list.appendChild(option);
        });
    }

    startLevel(levelIndex) {
        this.score = 0;
        this.loadLevel(levelIndex, false);
        this.setState(GameState.PLAYING);
        this.hideAllScreens();
        document.getElementById('dashIndicator').classList.remove('hidden');
    }

    startDailyChallenge() {
        this.score = 0;
        this.loadLevel(0, true);
        this.setState(GameState.PLAYING);
        this.hideAllScreens();
        document.getElementById('dashIndicator').classList.remove('hidden');
    }

    startGame() {
        this.score = 0;
        this.totalStars = 0;
        this.totalGems = 0;
        this.currentLevel = 0;
        this.loadLevel(0);
        this.setState(GameState.PLAYING);
        this.hideAllScreens();
        document.getElementById('dashIndicator').classList.remove('hidden');
    }

    restart() {
        if (this.isCustomLevel) {
            this.testCustomLevel();
            return;
        }
        this.loadLevel(this.currentLevel, this.isDailyChallenge);
        this.setState(GameState.PLAYING);
        this.hideAllScreens();
        document.getElementById('dashIndicator').classList.remove('hidden');
    }

    nextLevel() {
        if (this.isDailyChallenge) {
            this.showMenu();
            return;
        }
        this.loadLevel(this.currentLevel + 1, false);
        this.setState(GameState.PLAYING);
        this.hideAllScreens();
        document.getElementById('dashIndicator').classList.remove('hidden');
    }

    showAllLevelsComplete() {
        document.querySelector('.win-title').textContent = '🎉 全部通关！';
        document.getElementById('nextLevelBtn').style.display = 'none';
        this.showScreen('winScreen', true);
    }

    setState(newState) {
        this.state = newState;
    }

    showScreen(screenId, show) {
        const screen = document.getElementById(screenId);
        if (show) {
            screen.classList.remove('hidden');
        } else {
            screen.classList.add('hidden');
        }
    }

    hideAllScreens() {
        ['menuScreen', 'levelSelectScreen', 'skinSelectScreen', 'leaderboardScreen', 
         'levelEditorScreen', 'winScreen', 'failScreen'].forEach(id => {
            this.showScreen(id, false);
        });
        document.getElementById('nextLevelBtn').style.display = 'inline-block';
    }

    updateHUD() {
        document.getElementById('starCount').textContent = this.stars;
        document.getElementById('gemCount').textContent = this.gems;
        document.getElementById('score').textContent = this.score;
    }

    updateDashIndicator() {
        const dashFill = document.getElementById('dashFill');
        const percentage = Math.max(0, 1 - this.ball.dashCooldown / DASH_COOLDOWN_TIME);
        dashFill.style.width = `${percentage * 100}%`;
        
        if (percentage >= 1) {
            dashFill.classList.add('ready');
        } else {
            dashFill.classList.remove('ready');
        }
    }

    dash() {
        if (this.state === GameState.PLAYING && this.ball && dash(this.ball)) {
            const newParticles = createDashParticles(this.ball);
            this.particles.push(...newParticles);
        }
    }

    gameLoop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;
        this.time += dt;

        if (this.state === GameState.PLAYING) {
            this.update(dt);
        }

        this.render(dt);

        this.animationId = requestAnimationFrame(time => this.gameLoop(time));
    }

    update(dt) {
        this.levelTime += dt;
        
        const timeScale = this.ball && this.ball.slowMotion ? SLOW_MO_TIME_SCALE : 1;
        const scaledDt = dt * timeScale;

        if (this.ball) {
            this.ball.updatePowerUps(dt);
            updatePhysics(this.ball, scaledDt);
        }

        this.platforms.forEach(platform => {
            platform.update(this.time);
        });

        this.spinningSaws.forEach(saw => {
            saw.update(scaledDt);
        });

        this.powerUpEntities.forEach(powerUp => {
            powerUp.update(this.time);
        });

        this.handleCollisions();

        this.particles = this.particles.filter(p => {
            p.update(scaledDt);
            return p.active;
        });

        this.scorePopups = this.scorePopups.filter(p => {
            p.update(scaledDt);
            return p.active;
        });

        if (checkOutOfBounds(this.ball)) {
            this.fail();
        }

        this.updateDashIndicator();
    }

    handleCollisions() {
        for (const platform of this.platforms) {
            const result = handlePlatformCollision(this.ball, platform);
            
            if (result.deadly && !this.ball.isInvincible) {
                this.tookDamage = true;
                this.fail();
                return;
            }
            
            if (result.bounce) {
                const color = platform.type === PlatformType.BOUNCE_PAD ? '#22c55e' : '#6366f1';
                const bounceParticles = createParticles(
                    this.ball.x,
                    platform.top,
                    8,
                    color,
                    [100, 200],
                    [3, 6],
                    [0.3, 0.6]
                );
                this.particles.push(...bounceParticles);
            }
        }

        for (const saw of this.spinningSaws) {
            if (checkSpinningSawCollision(this.ball, saw)) {
                if (this.ball.isInvincible) {
                    const bounceParticles = createParticles(
                        this.ball.x,
                        this.ball.y,
                        12,
                        '#fbbf24',
                        [150, 250],
                        [4, 8],
                        [0.4, 0.7]
                    );
                    this.particles.push(...bounceParticles);
                    this.ball.vy = -Math.abs(this.ball.vy) * 0.8;
                } else {
                    this.tookDamage = true;
                    this.fail();
                    return;
                }
            }
        }

        this.powerUpEntities.forEach(powerUp => {
            if (!powerUp.collected && checkPowerUpCollision(this.ball, powerUp)) {
                powerUp.collected = true;
                this.ball.activatePowerUp(powerUp.type);
                this.score += 200;
                
                const powerUpParticles = createPowerUpParticles(powerUp.x, powerUp.y, powerUp.type);
                this.particles.push(...powerUpParticles);
                
                const typeNames = {
                    [PowerUpType.FLY]: '🪶 飞行！',
                    [PowerUpType.INVINCIBLE]: '⭐ 无敌！',
                    [PowerUpType.SLOW_MO]: '⏱️ 慢动作！'
                };
                this.scorePopups.push(new ScorePopup(powerUp.x, powerUp.y, typeNames[powerUp.type] || '能量！', '#a855f7'));
                
                this.updateHUD();
            }
        });

        this.powerUpEntities = this.powerUpEntities.filter(p => !p.collected);

        this.starEntities.forEach(star => {
            if (checkStarCollision(this.ball, star)) {
                star.collected = true;
                this.stars++;
                this.score += star.points;
                this.totalStars++;
                this.profile.addStars(1);
                
                const collectParticles = createCollectParticles(star.x, star.y, '#fbbf24');
                this.particles.push(...collectParticles);
                
                this.scorePopups.push(new ScorePopup(star.x, star.y, `+${star.points}`, '#fbbf24'));
                
                this.updateHUD();
            }
        });

        this.starEntities = this.starEntities.filter(s => !s.collected);

        this.gemEntities.forEach(gem => {
            if (checkGemCollision(this.ball, gem)) {
                gem.collected = true;
                this.gems++;
                this.score += gem.points;
                this.totalGems++;
                
                const gemColor = gem.color === 'purple' ? '#a855f7' :
                                gem.color === 'green' ? '#22c55e' :
                                gem.color === 'blue' ? '#3b82f6' : '#ec4899';
                
                const collectParticles = createCollectParticles(gem.x, gem.y, gemColor);
                this.particles.push(...collectParticles);
                
                this.scorePopups.push(new ScorePopup(gem.x, gem.y, `+${gem.points}`, gemColor));
                
                this.updateHUD();
            }
        });

        this.gemEntities = this.gemEntities.filter(g => !g.collected);

        if (this.goal && checkGoalCollision(this.ball, this.goal)) {
            this.win();
        }
    }

    win() {
        this.setState(GameState.WIN);
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const x = this.goal.x + (Math.random() - 0.5) * this.goal.width;
                const y = this.goal.y;
                const fireworks = createFireworkParticles(x, y);
                this.particles.push(...fireworks);
            }, i * 200);
        }

        const levelData = this.isDailyChallenge ? this.dailyChallenge : levels[this.currentLevel];
        const rating = new LevelRating(
            this.currentLevel,
            this.stars === this.levelStars,
            !this.tookDamage,
            this.levelTime <= levelData.targetTime,
            this.levelTime,
            this.score
        );

        if (!this.isDailyChallenge && !this.isCustomLevel) {
            this.profile.setLevelRating(this.currentLevel, rating);
            this.profile.addCompletedLevel(this.currentLevel);
            if (!this.tookDamage) {
                this.profile.addNoDamageRun();
            }
        }

        if (!this.isCustomLevel) {
            this.profile.addHighScore({
                levelId: this.currentLevel,
                score: this.score,
                stars: rating.stars,
                time: this.levelTime,
                date: new Date().toLocaleDateString('zh-CN'),
                isDailyChallenge: this.isDailyChallenge
            });
        }

        this.profile.checkSkinUnlocks();
        this.profile.save();

        this.showWinScreen(rating);
        
        setTimeout(() => {
            this.showScreen('winScreen', true);
        }, 500);
        document.getElementById('dashIndicator').classList.add('hidden');
    }

    showWinScreen(rating) {
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('finalStars').textContent = `${this.stars}/${this.levelStars}`;
        document.getElementById('finalGems').textContent = `${this.gems}/${this.levelGems}`;
        document.getElementById('finalTime').textContent = this.formatTime(this.levelTime);
        
        const starsContainer = document.getElementById('winStars');
        starsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = `result-star ${i < rating.stars ? 'earned' : ''}`;
            star.textContent = '⭐';
            star.style.animationDelay = `${i * 0.3}s`;
            starsContainer.appendChild(star);
        }

        const criteriaList = document.getElementById('ratingCriteria');
        criteriaList.innerHTML = `
            <div class="criteria-item ${rating.allStars ? 'completed' : ''}">
                <span class="criteria-icon">${rating.allStars ? '✅' : '⬜'}</span>
                <span>收集全部星星</span>
            </div>
            <div class="criteria-item ${rating.noDamage ? 'completed' : ''}">
                <span class="criteria-icon">${rating.noDamage ? '✅' : '⬜'}</span>
                <span>无伤通关</span>
            </div>
            <div class="criteria-item ${rating.timeBonus ? 'completed' : ''}">
                <span class="criteria-icon">${rating.timeBonus ? '✅' : '⬜'}</span>
                <span>限时通关 (目标: ${this.formatTime(levels[this.currentLevel]?.targetTime || 60)})</span>
            </div>
        `;

        if (this.isDailyChallenge) {
            document.getElementById('nextLevelBtn').textContent = '返回菜单';
        } else if (this.currentLevel >= levels.length - 1) {
            document.getElementById('nextLevelBtn').textContent = '🏆 全部通关！';
        } else {
            document.getElementById('nextLevelBtn').textContent = '下一关';
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    fail() {
        if (this.state === GameState.FAIL) return;
        this.setState(GameState.FAIL);
        
        this.renderer.shake(15, 0.5);
        this.renderer.flash('rgba(239, 68, 68, 0.5)', 0.3);
        
        const explosionParticles = createExplosionParticles(this.ball.x, this.ball.y);
        this.particles.push(...explosionParticles);
        
        document.getElementById('failScore').textContent = this.score.toLocaleString();
        
        setTimeout(() => {
            this.showScreen('failScreen', true);
        }, 300);
        document.getElementById('dashIndicator').classList.add('hidden');
    }

    render(dt) {
        this.renderer.clear();
        this.renderer.drawBackground(this.time);

        if (this.state === GameState.PLAYING || this.state === GameState.WIN || this.state === GameState.FAIL) {
            this.renderer.updateCamera(this.ball, dt);
            this.renderer.applyCamera();

            this.platforms.forEach(platform => {
                this.renderer.drawPlatform(platform, this.time);
            });

            this.spinningSaws.forEach(saw => {
                this.renderer.drawSpinningSaw(saw, this.time);
            });

            this.powerUpEntities.forEach(powerUp => {
                this.renderer.drawPowerUp(powerUp, this.time);
            });

            this.starEntities.forEach(star => {
                this.renderer.drawStar(star, this.time);
            });

            this.gemEntities.forEach(gem => {
                this.renderer.drawGem(gem, this.time);
            });

            if (this.goal) {
                this.renderer.drawGoal(this.goal, this.time);
            }

            this.renderer.drawParticles(this.particles);
            this.renderer.drawScorePopups(this.scorePopups);

            if (this.ball) {
                this.renderer.drawDashLines(this.ball);
                this.renderer.drawBall(this.ball, this.time);
            }

            this.renderer.resetCamera();

            if (this.state === GameState.PLAYING && this.ball) {
                this.renderer.drawPowerUpHUD(this.ball);
                this.renderer.drawTimer(this.levelTime);
            }
        }

        this.renderer.drawFlash();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
