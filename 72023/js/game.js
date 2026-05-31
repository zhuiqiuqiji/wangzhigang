class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = 'menu';
        this.score = 0;
        this.currentLevel = 1;
        this.collectedCount = 0;
        this.totalCollected = 0;

        this.players = [];
        this.enemies = [];
        this.treasures = [];
        this.particles = new ParticleSystem(200);
        this.level = null;
        this.hud = null;
        this.oxygen = null;
        this.boss = null;
        this.cave = null;
        this.fishSchool = null;
        this.mapSystem = new MapSystem(canvas.width, canvas.height);

        this.gameMode = 'single';
        this.selectedCharacters = ['spongebob'];
        this.selectedMapId = 'reef';

        this.unlockedCharacters = ['spongebob'];
        this.unlockedMaps = ['reef'];
        this.highestLevel = 1;

        this.keys = {};
        this.time = 0;
        this.lastTime = 0;
        this.menuBubbles = [];
        this.levelCompleteTimer = 0;
        this.gameOverTimer = 0;

        this.selectedModeIndex = 0;
        this.characterSelectIndices = [0];
        this.eKeyPressed = false;

        this._loadProgress();
        this._initInput();
        this._initMenuBubbles();
        this.resize();
    }

    _loadProgress() {
        try {
            const saved = localStorage.getItem('spongebob_game_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.unlockedCharacters = data.unlockedCharacters || ['spongebob'];
                this.unlockedMaps = data.unlockedMaps || ['reef'];
                this.highestLevel = data.highestLevel || 1;
            }
        } catch (e) {
            console.log('No save data found');
        }
    }

    _saveProgress() {
        try {
            const data = {
                unlockedCharacters: this.unlockedCharacters,
                unlockedMaps: this.unlockedMaps,
                highestLevel: this.highestLevel
            };
            localStorage.setItem('spongebob_game_progress', JSON.stringify(data));
        } catch (e) {
            console.log('Failed to save progress');
        }
    }

    _unlockCharacter(characterId) {
        if (!this.unlockedCharacters.includes(characterId)) {
            this.unlockedCharacters.push(characterId);
            this._saveProgress();
        }
    }

    _unlockMap(mapId) {
        if (!this.unlockedMaps.includes(mapId)) {
            this.unlockedMaps.push(mapId);
            this._saveProgress();
        }
    }

    _checkUnlocks() {
        const allChars = Character.getAllCharacters();
        const charUnlockLevels = {
            patrick: 2,
            squidward: 3,
            krabs: 5,
            sandy: 7
        };
        for (const [charId, level] of Object.entries(charUnlockLevels)) {
            if (this.highestLevel >= level) {
                this._unlockCharacter(charId);
            }
        }

        const mapUnlockLevels = {
            trench: 2,
            shipwreck: 4,
            volcano: 6
        };
        for (const [mapId, level] of Object.entries(mapUnlockLevels)) {
            if (this.highestLevel >= level) {
                this._unlockMap(mapId);
            }
        }

        for (const char of allChars) {
            char.unlocked = this.unlockedCharacters.includes(char.id);
        }
    }

    _initInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }

            if (this.state === 'menu' && e.code === 'Space') {
                this._startModeSelect();
            } else if (this.state === 'modeSelect') {
                if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                    this.selectedModeIndex = e.code === 'ArrowLeft' ? 0 : 1;
                } else if (e.code === 'Space') {
                    this._confirmModeSelect();
                }
            } else if (this.state === 'characterSelect') {
                this._handleCharacterSelectInput(e.code);
            } else if (this.state === 'mapSelect') {
                this.mapSystem.handleInput(e.code);
                if (e.code === 'Space') {
                    this._confirmMapSelect();
                }
            } else if (this.state === 'playing') {
                if (e.code === 'KeyE' && !this.eKeyPressed) {
                    this.eKeyPressed = true;
                    this._tryEnterCave();
                }
            } else if (this.state === 'inCave') {
                if (e.code === 'KeyE' && !this.eKeyPressed) {
                    this.eKeyPressed = true;
                    this._exitCave();
                }
            } else if (this.state === 'levelComplete' && e.code === 'Space') {
                this.nextLevel();
            } else if (this.state === 'gameOver' && e.code === 'Space') {
                this.reset();
            } else if (this.state === 'bossFight') {
                if (e.code === 'KeyE' && !this.eKeyPressed) {
                    this.eKeyPressed = true;
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'KeyE') {
                this.eKeyPressed = false;
            }
        });

        this.canvas.addEventListener('click', () => {
            if (this.state === 'menu') {
                this._startModeSelect();
            } else if (this.state === 'modeSelect') {
                this._confirmModeSelect();
            } else if (this.state === 'characterSelect') {
                this._confirmCharacterSelect();
            } else if (this.state === 'mapSelect') {
                this._confirmMapSelect();
            } else if (this.state === 'levelComplete') {
                this.nextLevel();
            } else if (this.state === 'gameOver') {
                this.reset();
            }
        });
    }

    _startModeSelect() {
        this.state = 'modeSelect';
        this.selectedModeIndex = 0;
    }

    _confirmModeSelect() {
        this.gameMode = this.selectedModeIndex === 0 ? 'single' : 'coop';
        this.characterSelectIndices = this.gameMode === 'coop' ? [0, 0] : [0];
        this._checkUnlocks();
        this.state = 'characterSelect';
    }

    _handleCharacterSelectInput(keyCode) {
        const allChars = Character.getAllCharacters();

        if (this.gameMode === 'single') {
            if (keyCode === 'ArrowLeft') {
                do {
                    this.characterSelectIndices[0] = (this.characterSelectIndices[0] - 1 + allChars.length) % allChars.length;
                } while (!allChars[this.characterSelectIndices[0]].unlocked);
            } else if (keyCode === 'ArrowRight') {
                do {
                    this.characterSelectIndices[0] = (this.characterSelectIndices[0] + 1) % allChars.length;
                } while (!allChars[this.characterSelectIndices[0]].unlocked);
            } else if (keyCode === 'Space') {
                this._confirmCharacterSelect();
            }
        } else {
            if (keyCode === 'ArrowLeft') {
                do {
                    this.characterSelectIndices[0] = (this.characterSelectIndices[0] - 1 + allChars.length) % allChars.length;
                } while (!allChars[this.characterSelectIndices[0]].unlocked);
            } else if (keyCode === 'ArrowRight') {
                do {
                    this.characterSelectIndices[0] = (this.characterSelectIndices[0] + 1) % allChars.length;
                } while (!allChars[this.characterSelectIndices[0]].unlocked);
            } else if (keyCode === 'KeyA') {
                do {
                    this.characterSelectIndices[1] = (this.characterSelectIndices[1] - 1 + allChars.length) % allChars.length;
                } while (!allChars[this.characterSelectIndices[1]].unlocked);
            } else if (keyCode === 'KeyD') {
                do {
                    this.characterSelectIndices[1] = (this.characterSelectIndices[1] + 1) % allChars.length;
                } while (!allChars[this.characterSelectIndices[1]].unlocked);
            } else if (keyCode === 'Space') {
                this._confirmCharacterSelect();
            }
        }
    }

    _confirmCharacterSelect() {
        const allChars = Character.getAllCharacters();
        this.selectedCharacters = this.characterSelectIndices.map(i => allChars[i].id);
        this._checkUnlocks();
        this.state = 'mapSelect';
    }

    _confirmMapSelect() {
        const selectedMap = this.mapSystem.getSelectedMap();
        if (this.unlockedMaps.includes(selectedMap.id)) {
            this.selectedMapId = selectedMap.id;
            this.startGame();
        }
    }

    _tryEnterCave() {
        if (!this.cave || !this.cave.discovered || this.cave.entered) return;

        const entranceBox = this.cave.getEntranceHitbox();
        for (const player of this.players) {
            if (!player.alive) continue;
            const playerBox = {
                x: player.x,
                y: player.y,
                width: player.width,
                height: player.height
            };
            if (Utils.rectCollision(playerBox, entranceBox)) {
                this.cave.entered = true;
                this.cave.generateContent(this.currentLevel);
                this.state = 'inCave';
                this.particles.emitSplash(this.cave.x + this.cave.width / 2, this.cave.y + this.cave.height / 2);
                return;
            }
        }
    }

    _exitCave() {
        if (!this.cave || !this.cave.entered) return;

        this.treasures = this.treasures.filter(t => !t.collected);
        for (const t of this.cave.treasures) {
            if (!t.collected) {
                t.x = Utils.random(50, this.canvas.width - 50);
                t.y = Utils.random(80, this.canvas.height - 80);
                this.treasures.push(t);
            }
        }
        this.enemies = this.enemies.filter(e => e.active);
        for (const e of this.cave.enemies) {
            if (e.active) {
                e.x = Utils.random(50, this.canvas.width - 50);
                e.y = Utils.random(80, this.canvas.height - 80);
                this.enemies.push(e);
            }
        }

        this.cave.entered = false;
        this.cave.discovered = false;
        this.state = 'playing';
        this.particles.emitCelebration(this.canvas.width / 2, this.canvas.height / 3);
    }

    _tryStartBossFight() {
        if (this.boss && this.boss.active) return;
        if (this.currentLevel % 2 !== 0) return;

        const bossType = this.level.getBossType();
        this.boss = new Boss(bossType, this.canvas.width, this.canvas.height);
        this.state = 'bossFight';
        this.particles.emitCelebration(this.canvas.width / 2, this.canvas.height / 3);
    }

    _initMenuBubbles() {
        this.menuBubbles = [];
        for (let i = 0; i < 25; i++) {
            this.menuBubbles.push({
                x: Utils.random(0, this.canvas.width),
                y: Utils.random(0, this.canvas.height),
                r: Utils.random(3, 12),
                speed: Utils.random(0.3, 1.2),
                wobble: Utils.random(0, Math.PI * 2)
            });
        }
    }

    resize() {
        const container = document.getElementById('game-container');
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;

        if (this.hud) {
            this.hud.resize(this.canvas.width, this.canvas.height);
        }
        for (const player of this.players) {
            player.canvasWidth = this.canvas.width;
            player.canvasHeight = this.canvas.height;
        }
        for (const e of this.enemies) {
            e.resize(this.canvas.width, this.canvas.height);
        }
        for (const t of this.treasures) {
            t.resize(this.canvas.width, this.canvas.height);
        }
        if (this.cave) {
            this.cave.canvasWidth = this.canvas.width;
            this.cave.canvasHeight = this.canvas.height;
            for (const e of this.cave.enemies) {
                e.resize(this.canvas.width, this.canvas.height);
            }
            for (const t of this.cave.treasures) {
                t.resize(this.canvas.width, this.canvas.height);
            }
        }
        if (this.boss) {
            this.boss.canvasWidth = this.canvas.width;
            this.boss.canvasHeight = this.canvas.height;
        }
        if (this.fishSchool) {
            this.fishSchool.canvasWidth = this.canvas.width;
            this.fishSchool.canvasHeight = this.canvas.height;
        }
        this.particles.resize(this.canvas.width, this.canvas.height);
        this.mapSystem.canvasWidth = this.canvas.width;
        this.mapSystem.canvasHeight = this.canvas.height;
        this._initMenuBubbles();
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.currentLevel = 1;
        this.collectedCount = 0;
        this.totalCollected = 0;
        window.__playerLives = { P1: 3, P2: 3 };
        this._loadLevel();
    }

    _loadLevel() {
        this.level = new Level(this.currentLevel, this.selectedMapId, this.canvas.width, this.canvas.height);
        this.enemies = this.level.generateEnemies();
        this.treasures = this.level.generateTreasures();
        this.hud = new HUD(this.canvas.width, this.canvas.height);
        this.collectedCount = 0;
        this.particles = new ParticleSystem(200);
        this.oxygen = new OxygenSystem(100, 0.8);
        this.boss = null;

        this.players = [];
        const chars = this.selectedCharacters;
        const startY = this.canvas.height / 2 - 22;

        const p1 = new Player(
            this.canvas.width / 4 - 18,
            startY,
            this.canvas.width,
            this.canvas.height,
            chars[0],
            'P1'
        );
        this.players.push(p1);

        if (this.gameMode === 'coop' && chars.length > 1) {
            const p2 = new Player(
                this.canvas.width * 3 / 4 - 18,
                startY,
                this.canvas.width,
                this.canvas.height,
                chars[1],
                'P2'
            );
            this.players.push(p2);
        }

        if (this.currentLevel >= 2 && Math.random() < 0.6) {
            this.cave = new HiddenCave(this.canvas.width, this.canvas.height);
        } else {
            this.cave = null;
        }

        this.fishSchool = new FishSchool(this.canvas.width, this.canvas.height, 6 + this.currentLevel);
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel > this.highestLevel) {
            this.highestLevel = this.currentLevel;
            this._saveProgress();
        }
        this._checkUnlocks();

        const mapOrder = ['reef', 'trench', 'shipwreck', 'volcano'];
        const currentMapIdx = mapOrder.indexOf(this.selectedMapId);
        if (this.currentLevel % 2 === 0 && currentMapIdx < mapOrder.length - 1) {
            const nextMapId = mapOrder[currentMapIdx + 1];
            if (this.unlockedMaps.includes(nextMapId)) {
                this.selectedMapId = nextMapId;
            }
        }

        this.state = 'playing';
        this._loadLevel();
    }

    reset() {
        this.state = 'menu';
        this.score = 0;
        this.currentLevel = 1;
        this.collectedCount = 0;
        this.totalCollected = 0;
        this.players = [];
        this.enemies = [];
        this.treasures = [];
        this.particles = new ParticleSystem(200);
        this.level = null;
        this.oxygen = null;
        this.boss = null;
        this.cave = null;
        this.fishSchool = null;
        window.__playerLives = { P1: 3, P2: 3 };
    }

    update(dt) {
        this.time += dt;

        switch (this.state) {
            case 'menu':
                this._updateMenu(dt);
                break;
            case 'modeSelect':
            case 'characterSelect':
            case 'mapSelect':
                this._updateMenu(dt);
                break;
            case 'playing':
                this._updatePlaying(dt);
                break;
            case 'bossFight':
                this._updateBossFight(dt);
                break;
            case 'inCave':
                this._updateInCave(dt);
                break;
            case 'levelComplete':
                this._updateLevelComplete(dt);
                break;
            case 'gameOver':
                this._updateGameOver(dt);
                break;
        }

        this.particles.update(dt, this.canvas.width, this.canvas.height);
    }

    _updateMenu(dt) {
        for (const b of this.menuBubbles) {
            b.y -= b.speed * dt * 60;
            b.wobble += dt * 2;
            b.x += Math.sin(b.wobble) * 0.3;
            if (b.y < -b.r) {
                b.y = this.canvas.height + b.r;
                b.x = Utils.random(0, this.canvas.width);
            }
        }
    }

    _updatePlaying(dt) {
        for (const player of this.players) {
            player.handleInput(this.keys);
            player.update(dt);
        }

        for (const enemy of this.enemies) {
            enemy.update(dt, this.players);
        }

        for (const treasure of this.treasures) {
            treasure.update(dt, this.time);
        }

        if (this.fishSchool) {
            this.fishSchool.update(dt);
        }

        if (this.cave) {
            this.cave.update(dt);
            if (!this.cave.discovered) {
                for (const player of this.players) {
                    if (!player.alive) continue;
                    const dx = player.x - this.cave.x;
                    const dy = player.y - this.cave.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 150) {
                        this.cave.discovered = true;
                        this.particles.emitCelebration(this.cave.x + this.cave.width / 2, this.cave.y);
                        break;
                    }
                }
            }
        }

        const avgOxygenModifier = this.players.reduce((sum, p) => sum + p.oxygenModifier, 0) / this.players.length;
        this.oxygen.update(dt, avgOxygenModifier);

        if (this.oxygen.isEmpty()) {
            for (const player of this.players) {
                if (player.alive && !player.invincible) {
                    if (player.takeDamage()) {
                        this._applyDamage(player, 1);
                        this.particles.emitDamage(player.x + player.width / 2, player.y + player.height / 2);
                        this.oxygen.replenish(30);
                    }
                }
            }
        }

        this._checkCollisions();

        if (Math.random() < 0.02) {
            this.particles.emitBubble(
                Utils.random(0, this.canvas.width),
                this.canvas.height,
                this.canvas.width,
                this.canvas.height
            );
        }

        if (Math.random() < 0.005) {
            this.particles.emitLightRay(Utils.random(0, this.canvas.width), 0);
        }

        if (this.level.isComplete(this.collectedCount)) {
            if (this.currentLevel % 2 === 0) {
                this._tryStartBossFight();
            } else {
                this.state = 'levelComplete';
                this.levelCompleteTimer = 0;
                this.particles.emitCelebration(this.canvas.width / 2, this.canvas.height / 2);
            }
        }

        this._checkGameOver();
    }

    _updateBossFight(dt) {
        for (const player of this.players) {
            player.handleInput(this.keys);
            player.update(dt);
        }

        for (const enemy of this.enemies) {
            enemy.update(dt, this.players);
        }

        if (this.boss) {
            this.boss.update(dt, this.players);
        }

        for (const treasure of this.treasures) {
            treasure.update(dt, this.time);
        }

        const avgOxygenModifier = this.players.reduce((sum, p) => sum + p.oxygenModifier, 0) / this.players.length;
        this.oxygen.update(dt, avgOxygenModifier);

        if (this.oxygen.isEmpty()) {
            for (const player of this.players) {
                if (player.alive && !player.invincible) {
                    if (player.takeDamage()) {
                        this._applyDamage(player, 1);
                        this.particles.emitDamage(player.x + player.width / 2, player.y + player.height / 2);
                        this.oxygen.replenish(30);
                    }
                }
            }
        }

        this._checkBossCollisions();

        if (Math.random() < 0.03) {
            this.particles.emitBubble(
                Utils.random(0, this.canvas.width),
                this.canvas.height,
                this.canvas.width,
                this.canvas.height
            );
        }

        if (this.boss && !this.boss.active) {
            this.score += 200;
            this.state = 'levelComplete';
            this.levelCompleteTimer = 0;
            this.particles.emitCelebration(this.canvas.width / 2, this.canvas.height / 2);
            this.particles.emitCelebration(this.canvas.width / 2 - 100, this.canvas.height / 3);
            this.particles.emitCelebration(this.canvas.width / 2 + 100, this.canvas.height / 3);
        }

        this._checkGameOver();
    }

    _updateInCave(dt) {
        for (const player of this.players) {
            player.handleInput(this.keys);
            player.update(dt);
        }

        for (const enemy of this.cave.enemies) {
            enemy.update(dt, this.players);
        }

        for (const treasure of this.cave.treasures) {
            treasure.update(dt, this.time);
        }

        const avgOxygenModifier = this.players.reduce((sum, p) => sum + p.oxygenModifier, 0) / this.players.length;
        this.oxygen.update(dt, avgOxygenModifier);

        if (this.oxygen.isEmpty()) {
            for (const player of this.players) {
                if (player.alive && !player.invincible) {
                    if (player.takeDamage()) {
                        this._applyDamage(player, 1);
                        this.particles.emitDamage(player.x + player.width / 2, player.y + player.height / 2);
                        this.oxygen.replenish(30);
                    }
                }
            }
        }

        this._checkCaveCollisions();

        if (Math.random() < 0.02) {
            this.particles.emitBubble(
                Utils.random(0, this.canvas.width),
                this.canvas.height,
                this.canvas.width,
                this.canvas.height
            );
        }

        this._checkGameOver();
    }

    _checkCollisions() {
        for (const player of this.players) {
            if (!player.alive) continue;
            const playerRect = {
                x: player.x + 4,
                y: player.y + 4,
                width: player.width - 8,
                height: player.height - 8
            };

            for (const treasure of this.treasures) {
                if (treasure.collected) continue;
                const tRect = {
                    x: treasure.x,
                    y: treasure.getDisplayY(),
                    width: treasure.width,
                    height: treasure.height
                };
                if (Utils.rectCollision(playerRect, tRect)) {
                    treasure.collected = true;
                    if (treasure.type === 'oxygenTank') {
                        this.oxygen.replenish(treasure.oxygenAmount);
                        this.particles.emitSplash(
                            treasure.x + treasure.width / 2,
                            treasure.getDisplayY() + treasure.height / 2,
                            'rgba(79, 195, 247, 0.7)'
                        );
                    } else {
                        const actualValue = Math.floor(treasure.value * player.scoreModifier);
                        this.score += actualValue;
                        this.collectedCount++;
                        this.totalCollected++;
                        this.particles.emitCollect(
                            treasure.x + treasure.width / 2,
                            treasure.getDisplayY() + treasure.height / 2,
                            treasure.type
                        );
                    }
                }
            }

            for (const enemy of this.enemies) {
                if (!enemy.active) continue;
                const eRect = {
                    x: enemy.x + 4,
                    y: enemy.y + 4,
                    width: enemy.width - 8,
                    height: enemy.height - 8
                };
                if (Utils.rectCollision(playerRect, eRect)) {
                    if (player.takeDamage()) {
                        this._applyDamage(player, 1);
                        this.particles.emitDamage(
                            player.x + player.width / 2,
                            player.y + player.height / 2
                        );
                    }
                }
            }
        }
    }

    _checkBossCollisions() {
        for (const player of this.players) {
            if (!player.alive) continue;
            const playerRect = {
                x: player.x + 4,
                y: player.y + 4,
                width: player.width - 8,
                height: player.height - 8
            };

            for (const treasure of this.treasures) {
                if (treasure.collected) continue;
                const tRect = {
                    x: treasure.x,
                    y: treasure.getDisplayY(),
                    width: treasure.width,
                    height: treasure.height
                };
                if (Utils.rectCollision(playerRect, tRect)) {
                    treasure.collected = true;
                    if (treasure.type === 'oxygenTank') {
                        this.oxygen.replenish(treasure.oxygenAmount);
                    } else {
                        const actualValue = Math.floor(treasure.value * player.scoreModifier);
                        this.score += actualValue;
                    }
                    this.particles.emitCollect(
                        treasure.x + treasure.width / 2,
                        treasure.getDisplayY() + treasure.height / 2,
                        treasure.type
                    );
                }
            }

            for (const enemy of this.enemies) {
                if (!enemy.active) continue;
                const eRect = {
                    x: enemy.x + 4,
                    y: enemy.y + 4,
                    width: enemy.width - 8,
                    height: enemy.height - 8
                };
                if (Utils.rectCollision(playerRect, eRect)) {
                    if (player.takeDamage()) {
                        this._applyDamage(player, 1);
                        this.particles.emitDamage(
                            player.x + player.width / 2,
                            player.y + player.height / 2
                        );
                    }
                }
            }

            if (this.boss && this.boss.active) {
                const bossBox = this.boss.getHitbox();
                if (Utils.rectCollision(playerRect, bossBox)) {
                    if (player.takeDamage()) {
                        this._applyDamage(player, this.boss.damage);
                        this.particles.emitDamage(
                            player.x + player.width / 2,
                            player.y + player.height / 2
                        );
                    }
                    this.boss.takeDamage(10);
                    this.particles.emitSplash(
                        this.boss.x + this.boss.width / 2,
                        this.boss.y + this.boss.height / 2,
                        'rgba(255, 100, 100, 0.7)'
                    );
                }
            }
        }
    }

    _checkCaveCollisions() {
        for (const player of this.players) {
            if (!player.alive) continue;
            const playerRect = {
                x: player.x + 4,
                y: player.y + 4,
                width: player.width - 8,
                height: player.height - 8
            };

            for (const treasure of this.cave.treasures) {
                if (treasure.collected) continue;
                const tRect = {
                    x: treasure.x,
                    y: treasure.getDisplayY(),
                    width: treasure.width,
                    height: treasure.height
                };
                if (Utils.rectCollision(playerRect, tRect)) {
                    treasure.collected = true;
                    if (treasure.type === 'oxygenTank') {
                        this.oxygen.replenish(treasure.oxygenAmount);
                    } else {
                        const actualValue = Math.floor(treasure.value * player.scoreModifier);
                        this.score += actualValue;
                        this.collectedCount++;
                        this.totalCollected++;
                    }
                    this.particles.emitCollect(
                        treasure.x + treasure.width / 2,
                        treasure.getDisplayY() + treasure.height / 2,
                        treasure.type
                    );
                }
            }

            for (const enemy of this.cave.enemies) {
                if (!enemy.active) continue;
                const eRect = {
                    x: enemy.x + 4,
                    y: enemy.y + 4,
                    width: enemy.width - 8,
                    height: enemy.height - 8
                };
                if (Utils.rectCollision(playerRect, eRect)) {
                    if (player.takeDamage()) {
                        this._applyDamage(player, 1);
                        this.particles.emitDamage(
                            player.x + player.width / 2,
                            player.y + player.height / 2
                        );
                    }
                }
            }
        }
    }

    _checkGameOver() {
        const allDead = this.players.every(p => !p.alive || window.__playerLives[p.id] <= 0);
        if (allDead) {
            for (const p of this.players) {
                p.alive = false;
            }
            this.state = 'gameOver';
            this.gameOverTimer = 0;
        }
    }

    _applyDamage(player, baseDamage) {
        const actualDamage = Math.ceil(baseDamage * player.healthModifier);
        if (actualDamage > 0) {
            window.__playerLives[player.id] = Math.max(0, window.__playerLives[player.id] - actualDamage);
            return true;
        }
        return false;
    }

    _updateLevelComplete(dt) {
        this.levelCompleteTimer += dt;
        if (this.levelCompleteTimer > 0.5 && Math.random() < 0.1) {
            this.particles.emitCelebration(
                Utils.random(this.canvas.width * 0.2, this.canvas.width * 0.8),
                Utils.random(this.canvas.height * 0.2, this.canvas.height * 0.6)
            );
        }
    }

    _updateGameOver(dt) {
        this.gameOverTimer += dt;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.state) {
            case 'menu':
                this._renderMenu();
                break;
            case 'modeSelect':
                this._renderMenu();
                this.hud.renderModeSelect(this.ctx, this.selectedModeIndex === 0 ? 'single' : 'coop', this.time);
                break;
            case 'characterSelect':
                this._renderMenu();
                const allChars = Character.getAllCharacters();
                this._checkUnlocks();
                this.hud.renderCharacterSelect(this.ctx, allChars, this.characterSelectIndices, this.gameMode, this.time);
                break;
            case 'mapSelect':
                this._renderMenu();
                this.mapSystem.render(this.ctx, this.time, this.unlockedMaps);
                break;
            case 'playing':
                this._renderPlaying();
                break;
            case 'bossFight':
                this._renderBossFight();
                break;
            case 'inCave':
                this._renderInCave();
                break;
            case 'levelComplete':
                this._renderLevelComplete();
                break;
            case 'gameOver':
                this._renderGameOver();
                break;
        }
    }

    _renderMenu() {
        const ctx = this.ctx;
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#0a1e3d');
        grad.addColorStop(0.5, '#0d2847');
        grad.addColorStop(1, '#061a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const b of this.menuBubbles) {
            ctx.fillStyle = `rgba(150, 220, 255, ${0.2 + b.r / 20})`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(200, 240, 255, ${0.3 + b.r / 15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        this.particles.render(ctx);

        if (this.state === 'menu') {
            const cx = this.canvas.width / 2;
            const titleY = this.canvas.height * 0.28;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ffd93d';
            ctx.font = 'bold 52px Fredoka, Comic Sans MS, sans-serif';
            ctx.fillText('海绵宝宝', cx, titleY - 20);

            ctx.shadowColor = '#ff6b35';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#00e5ff';
            ctx.font = 'bold 36px Fredoka, Comic Sans MS, sans-serif';
            ctx.fillText('海底冒险', cx, titleY + 35);
            ctx.shadowBlur = 0;
            ctx.restore();

            const spongeY = titleY + 100;
            this._renderMenuSpongeBob(ctx, cx, spongeY);

            const startY = this.canvas.height * 0.72;
            const pulse = 0.8 + Math.sin(this.time * 3) * 0.2;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#00e5ff';
            ctx.font = 'bold 22px Fredoka, Nunito, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('点击或按空格键开始', cx, startY);
            ctx.restore();

            const instrY = this.canvas.height * 0.82;
            ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
            ctx.font = '15px Nunito, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('方向键 / WASD 控制移动', cx, instrY);
            ctx.fillText('收集珍珠和金币，躲避海底生物！', cx, instrY + 24);
        }
    }

    _renderMenuSpongeBob(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        const bob = Math.sin(this.time * 2) * 5;
        ctx.translate(0, bob);

        const grad = ctx.createLinearGradient(-25, -30, 25, 30);
        grad.addColorStop(0, '#ffe135');
        grad.addColorStop(1, '#e6c200');
        ctx.fillStyle = grad;
        this._roundRect(ctx, -22, -30, 44, 56, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-9, -10, 9, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(9, -10, 9, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(-9, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(9, -8, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-8, -7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -7, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-7, -9, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, -9, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff8a80';
        ctx.beginPath();
        ctx.ellipse(0, 2, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#c9a800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(3, 5, 7, 0.1, Math.PI * 0.8);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(9, 5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(10, 5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-22, 16, 44, 7);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-22, 22, 44, 8);

        ctx.restore();
    }

    _renderPlaying() {
        const ctx = this.ctx;

        if (this.level) {
            this.level.renderBackground(ctx, this.time);
        }

        if (this.fishSchool) {
            this.fishSchool.render(ctx);
        }

        for (const treasure of this.treasures) {
            treasure.render(ctx, this.time);
        }

        for (const enemy of this.enemies) {
            enemy.render(ctx);
        }

        if (this.cave) {
            this.cave.render(ctx);
        }

        for (const player of this.players) {
            player.render(ctx);
        }

        this.particles.render(ctx);

        if (this.hud) {
            this.hud.render(ctx, this.state, this.players, this.oxygen, this.score, this.collectedCount,
                this.level ? this.level.requiredTreasures : 0, this.currentLevel,
                this.level ? this.level.getMapName() : '', null);
        }
    }

    _renderBossFight() {
        const ctx = this.ctx;

        if (this.level) {
            this.level.renderBackground(ctx, this.time);
        }

        for (const treasure of this.treasures) {
            treasure.render(ctx, this.time);
        }

        for (const enemy of this.enemies) {
            enemy.render(ctx);
        }

        if (this.boss) {
            this.boss.render(ctx);
        }

        for (const player of this.players) {
            player.render(ctx);
        }

        this.particles.render(ctx);

        if (this.hud) {
            this.hud.render(ctx, this.state, this.players, this.oxygen, this.score, this.collectedCount,
                this.level ? this.level.requiredTreasures : 0, this.currentLevel,
                this.level ? this.level.getMapName() : '', this.boss);
        }

        ctx.save();
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.font = 'bold 18px Fredoka, Comic Sans MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚔ BOSS 战 ⚔', this.canvas.width / 2, 85);
        ctx.restore();
    }

    _renderInCave() {
        const ctx = this.ctx;

        if (this.cave) {
            this.cave.renderInterior(ctx, this.time);
        }

        for (const treasure of this.cave.treasures) {
            treasure.render(ctx, this.time);
        }

        for (const enemy of this.cave.enemies) {
            enemy.render(ctx);
        }

        for (const player of this.players) {
            player.render(ctx);
        }

        this.particles.render(ctx);

        if (this.hud) {
            this.hud.render(ctx, this.state, this.players, this.oxygen, this.score, this.collectedCount,
                this.level ? this.level.requiredTreasures : 0, this.currentLevel,
                '隐藏洞穴', null);
        }
    }

    _renderLevelComplete() {
        this._renderPlaying();

        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 20, 40, 0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 30, 60, 0.85)';
        const boxW = 400;
        const boxH = 250;
        this._roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 15);
        ctx.fill();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = '#ffd93d';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffd93d';
        ctx.font = 'bold 40px Fredoka, Comic Sans MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('过关！', cx, cy - 70);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#00e5ff';
        ctx.font = '20px Nunito, sans-serif';
        ctx.fillText(`第 ${this.currentLevel} 关 · ${this.level.getMapName()}`, cx, cy - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Nunito, sans-serif';
        ctx.fillText(`当前得分: ${this.score}`, cx, cy + 15);
        ctx.fillText(`收集宝物: ${this.totalCollected} 个`, cx, cy + 45);

        const pulse = 0.6 + Math.sin(this.time * 3) * 0.4;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 16px Nunito, sans-serif';
        ctx.fillText('点击或按空格键继续', cx, cy + 85);
        ctx.globalAlpha = 1;

        ctx.restore();

        this.particles.render(ctx);
    }

    _renderGameOver() {
        if (this.level) {
            this.level.renderBackground(this.ctx, this.time);
        }

        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(10, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(40, 0, 0, 0.85)';
        const boxW = 400;
        const boxH = 280;
        this._roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 15);
        ctx.fill();

        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ff4757';
        ctx.font = 'bold 40px Fredoka, Comic Sans MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('游戏结束', cx, cy - 70);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffd93d';
        ctx.font = '22px Nunito, sans-serif';
        ctx.fillText(`最终得分: ${this.score}`, cx, cy - 15);

        ctx.fillStyle = '#00e5ff';
        ctx.font = '16px Nunito, sans-serif';
        ctx.fillText(`到达第 ${this.currentLevel} 关 · 收集 ${this.totalCollected} 个宝物`, cx, cy + 20);

        const allChars = Character.getAllCharacters();
        const nextUnlock = allChars.find(c => !this.unlockedCharacters.includes(c.id));
        if (nextUnlock) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '14px Nunito, sans-serif';
            ctx.fillText(`下次解锁: ${nextUnlock.name} (第${this._getUnlockLevel(nextUnlock.id)}关)`, cx, cy + 50);
        }

        const pulse = 0.6 + Math.sin(this.time * 3) * 0.4;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ff6b81';
        ctx.font = 'bold 16px Nunito, sans-serif';
        ctx.fillText('点击或按空格键返回主菜单', cx, cy + 95);
        ctx.globalAlpha = 1;

        ctx.restore();

        this.particles.render(ctx);
    }

    _getUnlockLevel(characterId) {
        const levels = { patrick: 2, squidward: 3, krabs: 5, sandy: 7 };
        return levels[characterId] || '?';
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        dt = Math.min(dt, 0.05);

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }
}
