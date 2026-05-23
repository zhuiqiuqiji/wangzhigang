const WAVES = [
    { monsters: [{ type: 'normal', count: 5 }], delay: 1200 },
    { monsters: [{ type: 'normal', count: 8 }], delay: 1000 },
    { monsters: [{ type: 'normal', count: 6 }, { type: 'fast', count: 3 }], delay: 900 },
    { monsters: [{ type: 'fast', count: 8 }], delay: 700 },
    { monsters: [{ type: 'normal', count: 5 }, { type: 'tank', count: 2 }], delay: 1000 },
    { monsters: [{ type: 'tank', count: 5 }], delay: 1500 },
    { monsters: [{ type: 'flying', count: 6 }], delay: 900 },
    { monsters: [{ type: 'normal', count: 10 }, { type: 'fast', count: 5 }], delay: 700 },
    { monsters: [{ type: 'fast', count: 10 }, { type: 'tank', count: 3 }], delay: 600 },
    { monsters: [{ type: 'miniBoss', count: 2 }, { type: 'normal', count: 10 }], delay: 800 },
    { monsters: [{ type: 'flying', count: 8 }, { type: 'tank', count: 4 }], delay: 700 },
    { monsters: [{ type: 'boss', count: 1 }, { type: 'tank', count: 3 }, { type: 'fast', count: 5 }], delay: 1000 }
];

const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    WAVE_COMPLETE: 'wave_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    EDITOR: 'editor'
};

class Game {
    constructor(canvas, theme = 'grassland') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.cellSize = 50;
        this.currentTheme = theme;

        this.map = new GameMap(this.width, this.height, this.cellSize, theme);
        this.pathPoints = this.map.getPathPixelPoints();

        this.towers = [];
        this.monsters = [];
        this.projectiles = [];

        this.gold = 250;
        this.lives = 15;
        this.maxLives = 15;
        this.currentWave = 0;
        this.totalWaves = WAVES.length;
        this.state = GAME_STATE.MENU;

        this.lastTime = 0;
        this.waveInProgress = false;
        this.monstersToSpawn = [];
        this.spawnTimer = 0;
        this.spawnDelay = 1000;

        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hoveredCell = null;

        this.animationFrameId = null;

        this.hero = null;
        this.heroType = 'warrior';
        this.skillSystem = new SkillSystem();
        this.editor = null;

        this.onGoldChange = null;
        this.onLivesChange = null;
        this.onWaveChange = null;
        this.onGameOver = null;
        this.onVictory = null;
        this.onTowerSelected = null;
        this.onWaveComplete = null;
        this.onSkillUsed = null;
    }

    start() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.state = GAME_STATE.PLAYING;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    restart(newTheme = null) {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (newTheme) {
            this.currentTheme = newTheme;
        }

        this.towers = [];
        this.monsters = [];
        this.projectiles = [];
        this.gold = 250;
        this.lives = 15;
        this.currentWave = 0;
        this.state = GAME_STATE.MENU;
        this.waveInProgress = false;
        this.monstersToSpawn = [];
        this.spawnTimer = 0;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hoveredCell = null;
        this.map = new GameMap(this.width, this.height, this.cellSize, this.currentTheme);
        this.pathPoints = this.map.getPathPixelPoints();
        
        this.skillSystem = new SkillSystem();
        this.hero = null;

        if (this.onGoldChange) this.onGoldChange(this.gold);
        if (this.onLivesChange) this.onLivesChange(this.lives, this.maxLives);
        if (this.onWaveChange) this.onWaveChange(this.currentWave, this.totalWaves);

        this.start();
    }

    spawnHero(type = 'warrior') {
        if (this.hero && !this.hero.isDead) return;
        
        this.heroType = type;
        const startPoint = this.pathPoints[0];
        this.hero = new Hero(type, startPoint.x + 50, startPoint.y);
    }

    gameLoop() {
        if (this.state === GAME_STATE.GAME_OVER || this.state === GAME_STATE.VICTORY) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            return;
        }

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.state === GAME_STATE.PLAYING) {
            this.update(deltaTime, currentTime);
        }

        this.render();

        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime, currentTime) {
        this.updateMonsterSpawning(deltaTime);

        for (const tower of this.towers) {
            tower.update(currentTime, this.monsters, this.projectiles);
        }

        for (const monster of this.monsters) {
            monster.update(deltaTime);
        }

        for (const projectile of this.projectiles) {
            projectile.update(deltaTime, this.monsters);
        }

        if (this.hero && !this.hero.isDead) {
            const heroResult = this.hero.update(deltaTime, currentTime, this.monsters);
            if (heroResult && heroResult.projectile) {
                this.projectiles.push(heroResult.projectile);
            }
            
            for (const monster of this.monsters) {
                if (!monster.isDead && !monster.reachedEnd) {
                    const dx = monster.x - this.hero.x;
                    const dy = monster.y - this.hero.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < monster.size + 15) {
                        this.hero.takeDamage(5 * deltaTime);
                    }
                }
            }
        }

        this.skillSystem.update(deltaTime);

        this.cleanup();
        this.checkWaveComplete();
    }

    updateMonsterSpawning(deltaTime) {
        if (!this.waveInProgress || this.monstersToSpawn.length === 0) return;

        this.spawnTimer -= deltaTime * 1000;
        if (this.spawnTimer <= 0) {
            const monsterType = this.monstersToSpawn.shift();
            const waveMultiplier = 1 + (this.currentWave - 1) * 0.12;
            const monster = new Monster(monsterType, this.pathPoints, waveMultiplier);
            this.monsters.push(monster);
            this.spawnTimer = this.spawnDelay;
        }
    }

    cleanup() {
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const monster = this.monsters[i];
            if (monster.isDead) {
                this.gold += monster.reward;
                if (this.hero) {
                    this.hero.gainExp(monster.reward / 2);
                }
                if (this.onGoldChange) this.onGoldChange(this.gold);
                this.monsters.splice(i, 1);
            } else if (monster.reachedEnd) {
                this.lives--;
                if (this.onLivesChange) this.onLivesChange(this.lives, this.maxLives);
                this.monsters.splice(i, 1);
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }

        this.projectiles = this.projectiles.filter(p => p.isActive);
    }

    checkWaveComplete() {
        if (this.waveInProgress && this.monstersToSpawn.length === 0 && this.monsters.length === 0) {
            this.waveInProgress = false;
            if (this.currentWave >= this.totalWaves) {
                this.victory();
            } else {
                this.state = GAME_STATE.WAVE_COMPLETE;
                this.gold += 75;
                if (this.onGoldChange) this.onGoldChange(this.gold);
                if (this.onWaveComplete) this.onWaveComplete();
            }
        }
    }

    startWave() {
        if (this.waveInProgress || this.currentWave >= this.totalWaves) return;

        this.currentWave++;
        this.state = GAME_STATE.PLAYING;
        this.waveInProgress = true;

        const wave = WAVES[this.currentWave - 1];
        this.spawnDelay = wave.delay;
        this.monstersToSpawn = [];

        for (const monsterGroup of wave.monsters) {
            for (let i = 0; i < monsterGroup.count; i++) {
                this.monstersToSpawn.push(monsterGroup.type);
            }
        }

        this.spawnTimer = 500;

        if (this.onWaveChange) this.onWaveChange(this.currentWave, this.totalWaves);
    }

    useSkill(skillKey) {
        const effect = this.skillSystem.useSkill(skillKey, this.monsters);
        if (effect && effect.goldAmount) {
            this.gold += effect.goldAmount;
            if (this.onGoldChange) this.onGoldChange(this.gold);
        }
        if (this.onSkillUsed) this.onSkillUsed(skillKey, effect);
        return effect;
    }

    useHeroSkill() {
        if (!this.hero || this.hero.isDead) return null;
        const result = this.hero.useSkill(this.monsters);
        if (result && result.type === 'archer') {
            const arrowProjectile = new Projectile(
                this.hero.x,
                this.hero.y,
                { x: result.targetX, y: result.targetY, isDead: false },
                result.damage * 2,
                15,
                '#FFD700',
                { type: 'single' }
            );
            this.projectiles.push(arrowProjectile);
        } else if (result && result.type === 'mage') {
            for (const monster of this.monsters) {
                const dx = monster.x - result.targetX;
                const dy = monster.y - result.targetY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < result.splash && !monster.isDead) {
                    monster.takeDamage(result.damage);
                }
            }
        }
        return result;
    }

    gameOver() {
        this.state = GAME_STATE.GAME_OVER;
        if (this.onGameOver) this.onGameOver();
    }

    victory() {
        this.state = GAME_STATE.VICTORY;
        if (this.onVictory) this.onVictory();
    }

    pause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
        } else if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            this.lastTime = performance.now();
        }
    }

    placeTower(col, row) {
        if (!this.selectedTowerType) return false;

        const config = TOWER_TYPES[this.selectedTowerType];
        if (this.gold < config.cost) return false;
        if (!this.map.placeTower(col, row)) return false;

        const tower = new Tower(this.selectedTowerType, col, row, this.cellSize);
        this.towers.push(tower);
        this.gold -= config.cost;
        if (this.onGoldChange) this.onGoldChange(this.gold);

        return true;
    }

    selectTower(tower) {
        this.selectedTower = tower;
        if (this.onTowerSelected) this.onTowerSelected(tower);
    }

    deselectTower() {
        this.selectedTower = null;
        if (this.onTowerSelected) this.onTowerSelected(null);
    }

    upgradeSelectedTower() {
        if (!this.selectedTower || !this.selectedTower.canUpgrade()) return false;

        const cost = this.selectedTower.getUpgradeCost();
        if (this.gold < cost) return false;

        this.gold -= cost;
        this.selectedTower.upgrade();
        if (this.onGoldChange) this.onGoldChange(this.gold);
        if (this.onTowerSelected) this.onTowerSelected(this.selectedTower);

        return true;
    }

    sellSelectedTower() {
        if (!this.selectedTower) return false;

        const value = this.selectedTower.getSellValue();
        this.gold += value;
        this.map.removeTower(this.selectedTower.col, this.selectedTower.row);

        const index = this.towers.indexOf(this.selectedTower);
        if (index > -1) {
            this.towers.splice(index, 1);
        }

        this.deselectTower();
        if (this.onGoldChange) this.onGoldChange(this.gold);

        return true;
    }

    getTowerAtPosition(x, y) {
        for (const tower of this.towers) {
            if (tower.isInRange(x, y)) {
                return tower;
            }
        }
        return null;
    }

    handleMouseMove(x, y) {
        const gridPos = this.map.getGridPosition(x, y);
        this.hoveredCell = gridPos;
    }

    handleClick(x, y, isRightClick = false) {
        if (this.hero && !this.hero.isDead && isRightClick) {
            this.hero.moveTo(x, y);
            return;
        }

        if (this.selectedTowerType) {
            const gridPos = this.map.getGridPosition(x, y);
            this.placeTower(gridPos.col, gridPos.row);
            return;
        }

        const tower = this.getTowerAtPosition(x, y);
        if (tower) {
            this.selectTower(tower);
        } else {
            this.deselectTower();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.map.render(this.ctx);

        if (this.selectedTowerType && this.hoveredCell) {
            const isValid = this.map.canPlaceTower(this.hoveredCell.col, this.hoveredCell.row) &&
                           this.gold >= TOWER_TYPES[this.selectedTowerType].cost;
            this.map.drawPlacementPreview(this.ctx, this.hoveredCell.col, this.hoveredCell.row, isValid);
        }

        for (const tower of this.towers) {
            tower.render(this.ctx, tower === this.selectedTower);
        }

        for (const monster of this.monsters) {
            monster.render(this.ctx);
        }

        for (const projectile of this.projectiles) {
            projectile.render(this.ctx);
        }

        if (this.hero) {
            this.hero.render(this.ctx);
        }

        this.skillSystem.renderEffects(this.ctx, this.width, this.height);

        if (this.state === GAME_STATE.WAVE_COMPLETE) {
            this.renderWaveComplete();
        }
    }

    renderWaveComplete() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.font = 'bold 36px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`波次 ${this.currentWave} 完成!`, this.width / 2, this.height / 2 - 30);

        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('点击"开始下一波"继续', this.width / 2, this.height / 2 + 20);
    }
}
