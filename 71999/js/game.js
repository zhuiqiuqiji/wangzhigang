class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu';
        this.mapWidth = 20;
        this.mapHeight = 15;
        this.maxFloor = 5;
        this.currentFloor = 1;
        this.map = null;
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.seed = '';
        this.rng = null;
        this.selectedClass = null;
        this.combatSystem = new CombatSystem();
        this.particleSystem = new ParticleSystem();
        this.uiManager = new UIManager(this);
        this.inputHandler = new InputHandler(this);
        this.stats = { kills: 0, rooms: 0 };
        this.activePanel = null;
        this.setup();
        this.gameLoop();
    }

    setup() {
        this.uiManager.setupMenuButtons(
            () => this.showClassSelect(),
            () => this.startGame(),
            () => this.goToMenu()
        );
        this.uiManager.setupClassButtons((classId) => this.selectClass(classId));
    }

    showClassSelect() {
        this.uiManager.showScreen('class-screen');
    }

    selectClass(classId) {
        this.selectedClass = classId;
        this.uiManager.updateClassSelect(classId);
    }

    startGame() {
        if (!this.selectedClass) {
            this.uiManager.showMessage('请先选择职业！', 2000);
            return;
        }
        this.seed = document.getElementById('seed-input') ? document.getElementById('seed-input').value.trim() : '';
        if (!this.seed) this.seed = SeededRNG.generateSeed();
        this.rng = new SeededRNG(this.seed);
        this.currentFloor = 1;
        this.gameState = 'playing';
        this.stats = { kills: 0, rooms: 0 };
        this.generateFloor();
        this.uiManager.showScreen('game-screen');
        this.uiManager.updateHUD(this.player);
        this.uiManager.updateFloorDisplay(this.currentFloor, this.seed);
    }

    generateFloor() {
        this.enemies = [];
        this.items = [];
        this.rng = new SeededRNG(this.seed + '-' + this.currentFloor);
        this.map = new GameMap(this.mapWidth, this.mapHeight, this.rng, this.currentFloor);
        this.map.generate();
        const spawnPos = this.map.getSpawnPosition();
        if (!this.player) {
            this.player = new Player(spawnPos.x, spawnPos.y, this.selectedClass);
        } else {
            this.player.x = spawnPos.x;
            this.player.y = spawnPos.y;
        }
        this.spawnEntities();
        this.stats.rooms += this.map.rooms.length;
    }

    spawnEntities() {
        const spawnPos = this.map.getSpawnPosition();
        const enemyCount = 6 + this.currentFloor * 2;
        const itemCount = 4 + this.currentFloor;
        const totalCount = enemyCount + itemCount;
        const allPositions = this.map.getFloorPositionsExcludingStart(totalCount, spawnPos.x, spawnPos.y, 3);

        const enemyTypes = ['skeleton', 'slime', 'bat'];
        if (this.currentFloor >= 2) enemyTypes.push('ghost');
        if (this.currentFloor >= 3) enemyTypes.push('demon');

        for (let i = 0; i < enemyCount && i < allPositions.length; i++) {
            const pos = allPositions[i];
            let type;
            if (i === enemyCount - 1) {
                type = 'boss';
            } else {
                type = this.rng.pick(enemyTypes);
            }
            this.enemies.push(new Enemy(pos.x, pos.y, type, this.currentFloor));
        }

        for (let i = 0; i < itemCount && (enemyCount + i) < allPositions.length; i++) {
            const pos = allPositions[enemyCount + i];
            if (i < 2) {
                const item = new Item(pos.x, pos.y, 'key');
                this.items.push(item);
            } else if (i < itemCount - 2) {
                const consumable = InventorySystem.generateRandomConsumable(this.rng, this.currentFloor);
                const item = new Item(pos.x, pos.y, 'consumable');
                item.data = consumable;
                this.items.push(item);
            } else {
                const equip = EquipmentSystem.generateRandomEquipment(this.rng, this.currentFloor, this.selectedClass);
                const item = new Item(pos.x, pos.y, 'equipment');
                item.data = equip;
                this.items.push(item);
            }
        }
    }

    goToMenu() {
        this.gameState = 'menu';
        this.player = null;
        this.selectedClass = null;
        this.uiManager.showScreen('start-screen');
    }

    tryMovePlayer(dx, dy) {
        if (this.gameState !== 'playing') return;
        if (this.combatSystem.isTurnBased() && this.combatSystem.turnState && this.combatSystem.turnState.turn === 'enemy') return;

        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        if (this.map.isLockedDoor(newX, newY)) {
            if (this.player.keys > 0) {
                this.player.keys--;
                this.map.openDoor(newX, newY);
                this.uiManager.showMessage('门已打开！');
                this.particleSystem.createCollectEffect(newX * 32 + 16, newY * 32 + 16, '#ffd700');
                this.uiManager.updateHUD(this.player);
            } else {
                this.uiManager.showMessage('需要钥匙！');
            }
            return;
        }

        if (this.map.isChest(newX, newY)) {
            this.map.openChest(newX, newY);
            const chestItems = this.generateChestLoot();
            for (const ci of chestItems) {
                this.player.inventorySystem.addItem(ci);
            }
            const itemNames = chestItems.map(ci => ci.name).join(', ');
            this.uiManager.showMessage(`打开宝箱！获得: ${itemNames}`);
            this.particleSystem.createCollectEffect(newX * 32 + 16, newY * 32 + 16, '#ffd700');
            this.player.x = newX;
            this.player.y = newY;
            this.uiManager.updateHUD(this.player);
            return;
        }

        const moved = this.player.move(dx, dy, this.map, this.enemies);
        if (moved) {
            this.checkItemPickup();
            this.checkExit();
            this.checkStairs();
            this.checkEnemyCollision();
            if (this.combatSystem.isTurnBased()) this.processTurnBasedEnemy();
        }
    }

    generateChestLoot() {
        const loot = [];
        if (this.rng.nextBool(0.6)) {
            loot.push(EquipmentSystem.generateRandomEquipment(this.rng, this.currentFloor, this.selectedClass));
        }
        if (this.rng.nextBool(0.7)) {
            loot.push(InventorySystem.generateRandomConsumable(this.rng, this.currentFloor));
        }
        if (this.rng.nextBool(0.3)) {
            loot.push({ ...ConsumableDB.healthPotionS, uid: Date.now() + Math.random() });
        }
        if (loot.length === 0) {
            loot.push(InventorySystem.generateRandomConsumable(this.rng, this.currentFloor));
        }
        return loot;
    }

    checkItemPickup() {
        for (const item of this.items) {
            if (!item.collected && item.x === this.player.x && item.y === this.player.y) {
                this.collectItem(item);
            }
        }
    }

    collectItem(item) {
        item.collected = true;
        let message = '';

        switch (item.type) {
            case 'key':
                this.player.keys++;
                message = '获得钥匙！';
                break;
            case 'gold':
                const goldAmount = 10 + Math.floor(Math.random() * 20) * this.currentFloor;
                this.player.gold += goldAmount;
                message = `获得 ${goldAmount} 金币！`;
                break;
            case 'health':
                this.player.heal(30 + this.currentFloor * 10);
                message = '恢复生命值！';
                break;
            case 'mana':
                this.player.restoreMp(20 + this.currentFloor * 5);
                message = '恢复魔法值！';
                break;
            case 'equipment':
                if (item.data) {
                    if (!this.player.inventorySystem.isFull()) {
                        this.player.inventorySystem.addItem(item.data);
                        message = `获得装备: ${item.data.name}！`;
                    } else {
                        message = '背包已满，无法拾取！';
                        item.collected = false;
                        return;
                    }
                }
                break;
            case 'consumable':
                if (item.data) {
                    if (!this.player.inventorySystem.isFull()) {
                        this.player.inventorySystem.addItem(item.data);
                        message = `获得道具: ${item.data.name}！`;
                    } else {
                        message = '背包已满，无法拾取！';
                        item.collected = false;
                        return;
                    }
                }
                break;
        }

        this.particleSystem.createCollectEffect(
            item.getPixelX() + 16, item.getPixelY() + 16,
            item.type === 'key' ? '#ffd700' : item.type === 'gold' ? '#ffd700' : item.type === 'health' ? '#dc143c' : item.type === 'mana' ? '#4169e1' : '#9370db'
        );
        this.uiManager.showMessage(message);
        this.uiManager.updateHUD(this.player);
    }

    checkExit() {
        if (this.map.isExit(this.player.x, this.player.y)) {
            this.victory();
        }
    }

    checkStairs() {
        if (this.map.isStairsDown(this.player.x, this.player.y)) {
            if (this.currentFloor >= this.maxFloor) {
                this.victory();
            } else {
                this.currentFloor++;
                this.uiManager.showMessage(`进入第 ${this.currentFloor} 层！`, 1500);
                this.generateFloor();
                this.uiManager.updateFloorDisplay(this.currentFloor, this.seed);
                this.uiManager.updateHUD(this.player);
            }
        }
    }

    checkEnemyCollision() {
        for (const enemy of this.enemies) {
            if (!enemy.dead && enemy.isAdjacentToPlayer(this.player)) {
                if (this.combatSystem.isTurnBased()) {
                    if (!this.combatSystem.turnState) {
                        this.combatSystem.startTurnBasedCombat(this.player, enemy);
                    }
                } else {
                    this.combatSystem.enemyAttack(enemy, this.player);
                    this.uiManager.updateHUD(this.player);
                    if (this.player.hp <= 0) this.defeat();
                }
            }
        }
    }

    processTurnBasedEnemy() {
        if (!this.combatSystem.turnState) return;
        const ts = this.combatSystem.turnState;
        if (ts.turn === 'enemy' || ts.enemyTurnProcessing) return;
        ts.enemyTurnProcessing = true;
        ts.turn = 'enemy';
        setTimeout(() => {
            if (!ts.enemy.dead && ts.enemy.isAdjacentToPlayer(this.player)) {
                this.combatSystem.enemyAttack(ts.enemy, this.player);
                this.uiManager.updateHUD(this.player);
                if (this.player.hp <= 0) { this.defeat(); return; }
            }
            if (ts.enemy.dead || !ts.enemy.isAdjacentToPlayer(this.player)) {
                this.combatSystem.endTurnBasedCombat();
            } else {
                ts.turn = 'player';
                ts.enemyTurnProcessing = false;
            }
        }, 500);
    }

    playerAttack() {
        if (this.gameState !== 'playing') return;
        if (this.combatSystem.isTurnBased() && !this.combatSystem.isPlayerTurn()) return;
        const targetEnemy = this.player.tryAttack(this.enemies);
        if (targetEnemy) {
            const result = this.combatSystem.playerAttack(this.player, targetEnemy);
            if (result && result.killed) this.handleEnemyKill(result.enemy);
        }
        if (this.combatSystem.isTurnBased()) this.processTurnBasedEnemy();
        this.uiManager.updateHUD(this.player);
    }

    useSkill(skillIndex) {
        if (this.gameState !== 'playing') return;
        if (this.combatSystem.isTurnBased() && !this.combatSystem.isPlayerTurn()) return;
        const skills = this.player.skillSystem.getAvailableSkills(this.player.level);
        if (skillIndex >= skills.length) return;
        const skill = skills[skillIndex];
        if (!this.player.skillSystem.canUseSkill(skill.id, this.player.mp)) {
            this.uiManager.showMessage(skill.id === 'backstab' ? '需要从背后攻击！' : '魔法不足或技能冷却中！');
            return;
        }
        const result = this.combatSystem.playerSkillAttack(this.player, skill, this.enemies);
        if (result.success) {
            if (result.isBuff) {
                this.uiManager.showMessage(`使用${skill.name}！${skill.buff.stat === 'attack' ? '攻击力' : skill.buff.stat === 'defense' ? '防御力' : '闪避'}提升！`);
            } else if (result.results && result.results.length > 0) {
                for (const r of result.results) {
                    if (r.killed) this.handleEnemyKill(r.enemy);
                }
                this.uiManager.showMessage(`使用${skill.name}！`);
            }
        } else {
            this.uiManager.showMessage('范围内没有敌人！');
        }
        if (this.combatSystem.isTurnBased()) this.processTurnBasedEnemy();
        this.uiManager.updateHUD(this.player);
    }

    handleEnemyKill(enemy) {
        const rewards = this.combatSystem.handleKill(this.player, enemy);
        this.stats.kills++;
        this.particleSystem.createExplosion(enemy.getPixelX() + 16, enemy.getPixelY() + 16, enemy.type === 'boss' ? '#ffd700' : '#888');
        let message = `击败 ${this.getEnemyName(enemy.type)}！获得 ${rewards.expGain} 经验, ${rewards.goldGain} 金币`;
        if (rewards.leveledUp) {
            message += ' 升级了！';
            this.particleSystem.createLevelUpEffect(this.player.getPixelX() + 16, this.player.getPixelY() + 16);
        }
        this.uiManager.showMessage(message);
        this.uiManager.updateHUD(this.player);
        if (enemy.type === 'boss') {
            if (this.currentFloor >= this.maxFloor) {
                setTimeout(() => this.victory(), 1000);
            } else {
                this.uiManager.showMessage('BOSS被击败！可以继续探索或下楼！', 3000);
            }
        }
        if (this.combatSystem.turnState && this.combatSystem.turnState.enemy === enemy) {
            this.combatSystem.endTurnBasedCombat();
        }
    }

    getEnemyName(type) {
        const names = { skeleton: '骷髅', slime: '史莱姆', bat: '蝙蝠', ghost: '幽灵', demon: '恶魔', boss: 'BOSS' };
        return names[type] || type;
    }

    victory() {
        if (this.gameState !== 'playing') return;
        this.gameState = 'victory';
        this.uiManager.showGameOver(true, {
            level: this.player.level, gold: this.player.gold,
            kills: this.stats.kills, rooms: this.stats.rooms, floor: this.currentFloor, seed: this.seed, classId: this.selectedClass
        });
    }

    defeat() {
        if (this.gameState !== 'playing') return;
        this.gameState = 'defeat';
        setTimeout(() => {
            this.uiManager.showGameOver(false, {
                level: this.player.level, gold: this.player.gold,
                kills: this.stats.kills, rooms: this.stats.rooms, floor: this.currentFloor, seed: this.seed, classId: this.selectedClass
            });
        }, 500);
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.uiManager.showMessage('游戏暂停 - ESC继续', 999999);
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.uiManager.showMessage('');
        }
    }

    toggleCombatMode() {
        this.combatSystem.toggleCombatMode();
        const mode = this.combatSystem.isTurnBased() ? '回合制' : '即时制';
        this.uiManager.showMessage(`战斗模式切换为: ${mode}`);
        this.uiManager.updateHUD(this.player);
    }

    togglePanel(panelName) {
        if (this.activePanel === panelName) {
            this.activePanel = null;
            this.uiManager.hideAllPanels();
        } else {
            this.activePanel = panelName;
            this.uiManager.showPanel(panelName);
        }
    }

    update() {
        if (this.gameState !== 'playing') return;
        this.player.update();
        this.player.skillSystem.tickCooldowns();
        this.player.skillSystem.tickBuffs();
        const dotDamages = this.player.skillSystem.tickDots();
        for (const d of dotDamages) {
            this.player.hp -= d;
            if (this.player.hp < 0) this.player.hp = 0;
        }
        if (this.player.hp <= 0) { this.defeat(); return; }

        if (!this.combatSystem.isTurnBased()) {
            for (const enemy of this.enemies) {
                enemy.update(this.player, this.map, this.enemies);
                if (!enemy.dead && enemy.isAdjacentToPlayer(this.player)) {
                    if (Math.random() < 0.02) {
                        this.combatSystem.enemyAttack(enemy, this.player);
                        this.uiManager.updateHUD(this.player);
                        if (this.player.hp <= 0) { this.defeat(); return; }
                    }
                }
            }
        }
        this.combatSystem.update();
        this.particleSystem.update();
    }

    render() {
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.gameState === 'menu' || this.gameState === 'classSelect') return;
        if (this.map) this.map.render(this.ctx);
        for (const item of this.items) item.render(this.ctx);
        for (const enemy of this.enemies) enemy.render(this.ctx);
        if (this.player) this.player.render(this.ctx);
        this.combatSystem.render(this.ctx);
        this.particleSystem.render(this.ctx);

        if (this.combatSystem.isTurnBased()) {
            this.ctx.fillStyle = 'rgba(255,200,0,0.8)';
            this.ctx.font = '8px "Press Start 2P"';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('回合制', 4, 12);
        }
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => { new Game(); });
