class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.tileSize = 32;
    }

    getPixelX() { return this.x * this.tileSize; }
    getPixelY() { return this.y * this.tileSize; }
}

class Player extends Entity {
    constructor(x, y, classId) {
        super(x, y);
        this.classId = classId;
        this.classData = ClassData[classId];
        this.skillSystem = new SkillSystem(classId);
        this.equipmentSystem = new EquipmentSystem();
        this.inventorySystem = new InventorySystem(20);

        const base = this.classData.baseStats;
        this.baseHp = base.hp;
        this.baseMp = base.mp;
        this.baseAttack = base.attack;
        this.baseDefense = base.defense;
        this.speed = base.speed;

        this.level = 1;
        this.exp = 0;
        this.expToLevel = 100;
        this.gold = 0;
        this.keys = 0;

        this._recalcStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;

        this.direction = 'down';
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.hurtTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.stunned = 0;
    }

    _recalcStats() {
        const bonus = this.classData.levelUpBonus;
        const eq = this.equipmentSystem;
        this.maxHp = this.baseHp + (this.level - 1) * bonus.hp + eq.getTotalHpBonus();
        this.maxMp = this.baseMp + (this.level - 1) * bonus.mp + eq.getTotalMp();
        this.attack = this.baseAttack + (this.level - 1) * bonus.attack + eq.getTotalAttack() + this.skillSystem.getBuffValue('attack');
        this.defense = this.baseDefense + (this.level - 1) * bonus.defense + eq.getTotalDefense() + this.skillSystem.getBuffValue('defense');
    }

    move(dx, dy, gameMap, enemies) {
        if (this.stunned > 0) return false;
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (dx < 0) this.direction = 'left';
        else if (dx > 0) this.direction = 'right';
        else if (dy < 0) this.direction = 'up';
        else if (dy > 0) this.direction = 'down';
        for (const enemy of enemies) {
            if (enemy.x === newX && enemy.y === newY && enemy.hp > 0) return false;
        }
        if (gameMap.isWalkable(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return true;
        }
        return false;
    }

    tryAttack(enemies) {
        if (this.attackCooldown > 0 || this.isAttacking || this.stunned > 0) return null;
        this.isAttacking = true;
        this.attackCooldown = 15;
        let attackX = this.x, attackY = this.y;
        switch (this.direction) {
            case 'up': attackY--; break;
            case 'down': attackY++; break;
            case 'left': attackX--; break;
            case 'right': attackX++; break;
        }
        for (const enemy of enemies) {
            if (enemy.x === attackX && enemy.y === attackY && enemy.hp > 0) return enemy;
        }
        setTimeout(() => { this.isAttacking = false; }, 200);
        return null;
    }

    takeDamage(damage) {
        if (this.invincible) return 0;
        if (this.skillSystem.getBuffValue('dodge') >= 100) {
            this.skillSystem.buffs = this.skillSystem.buffs.filter(b => b.stat !== 'dodge');
            return 0;
        }
        const actualDamage = Math.max(1, damage - this.defense);
        this.hp -= actualDamage;
        this.hurtTimer = 10;
        this.invincible = true;
        this.invincibleTimer = 60;
        if (this.hp < 0) this.hp = 0;
        return actualDamage;
    }

    gainExp(amount) {
        this.exp += amount;
        let leveledUp = false;
        while (this.exp >= this.expToLevel) {
            this.exp -= this.expToLevel;
            this.levelUp();
            leveledUp = true;
        }
        return leveledUp;
    }

    levelUp() {
        this.level++;
        this._recalcStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.expToLevel = Math.floor(this.expToLevel * 1.5);
    }

    heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }
    restoreMp(amount) { this.mp = Math.min(this.maxMp, this.mp + amount); }

    update() {
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.hurtTimer > 0) this.hurtTimer--;
        if (this.stunned > 0) this.stunned--;
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }
        this._recalcStats();
    }

    render(ctx) {
        const px = this.getPixelX();
        const py = this.getPixelY();
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) return;
        ctx.save();
        if (this.hurtTimer > 0) ctx.filter = 'hue-rotate(-50deg) saturate(2)';
        this.drawCharacter(ctx, px, py);
        this.drawAttackEffect(ctx, px, py);
        ctx.restore();
    }

    drawCharacter(ctx, px, py) {
        const size = this.tileSize;
        const color = this.classData.color;
        ctx.fillStyle = color;
        ctx.fillRect(px + 8, py + 10, size - 16, size - 14);
        ctx.fillStyle = '#ffd1a4';
        ctx.beginPath();
        ctx.arc(px + size / 2, py + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.classId === 'mage' ? '#4169e1' : this.classId === 'thief' ? '#333' : '#8b4513';
        ctx.beginPath();
        ctx.arc(px + size / 2, py + 6, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#000';
        const eyeOffset = this.getEyeOffset();
        ctx.fillRect(px + size / 2 - 4 + eyeOffset, py + 9, 2, 2);
        ctx.fillRect(px + size / 2 + 2 + eyeOffset, py + 9, 2, 2);
        ctx.fillStyle = '#654321';
        ctx.fillRect(px + 10, py + size - 6, 5, 6);
        ctx.fillRect(px + size - 15, py + size - 6, 5, 6);
    }

    getEyeOffset() {
        switch (this.direction) {
            case 'left': return -2;
            case 'right': return 2;
            default: return 0;
        }
    }

    drawAttackEffect(ctx, px, py) {
        if (!this.isAttacking) return;
        const size = this.tileSize;
        ctx.strokeStyle = this.classData.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        let effectX = px + size / 2, effectY = py + size / 2;
        ctx.beginPath();
        switch (this.direction) {
            case 'up': ctx.moveTo(effectX - 10, effectY - 5); ctx.lineTo(effectX, effectY - 20); ctx.lineTo(effectX + 10, effectY - 5); break;
            case 'down': ctx.moveTo(effectX - 10, effectY + 5); ctx.lineTo(effectX, effectY + 20); ctx.lineTo(effectX + 10, effectY + 5); break;
            case 'left': ctx.moveTo(effectX - 5, effectY - 10); ctx.lineTo(effectX - 20, effectY); ctx.lineTo(effectX - 5, effectY + 10); break;
            case 'right': ctx.moveTo(effectX + 5, effectY - 10); ctx.lineTo(effectX + 20, effectY); ctx.lineTo(effectX + 5, effectY + 10); break;
        }
        ctx.stroke();
    }
}

class Enemy extends Entity {
    constructor(x, y, type, floor) {
        super(x, y);
        this.type = type;
        this.floor = floor || 1;
        this.hurtTimer = 0;
        this.dead = false;
        this.moveTimer = 0;
        this.stunned = 0;
        this.dotDamage = 0;
        this.dotDuration = 0;
        this.initializeStats();
    }

    initializeStats() {
        const s = this.floor;
        const bases = {
            skeleton: { hp: 30, attack: 8, exp: 25, gold: 10, speed: 40 },
            slime:    { hp: 20, attack: 5, exp: 15, gold: 5,  speed: 60 },
            bat:      { hp: 15, attack: 6, exp: 20, gold: 8,  speed: 25 },
            ghost:    { hp: 25, attack: 10, exp: 30, gold: 12, speed: 30 },
            demon:    { hp: 40, attack: 14, exp: 40, gold: 18, speed: 35 },
            boss:     { hp: 150, attack: 20, exp: 200, gold: 100, speed: 35 }
        };
        const b = bases[this.type] || bases.skeleton;
        const scale = 1 + (s - 1) * 0.3;
        this.hp = this.maxHp = Math.floor(b.hp * scale);
        this.attack = Math.floor(b.attack * scale);
        this.exp = Math.floor(b.exp * scale);
        this.gold = Math.floor(b.gold * scale);
        this.speed = b.speed;
    }

    update(player, gameMap, enemies) {
        if (this.dead) return;
        if (this.hurtTimer > 0) this.hurtTimer--;
        if (this.stunned > 0) { this.stunned--; return; }
        if (this.dotDuration > 0) {
            this.hp -= this.dotDamage;
            this.dotDuration--;
            if (this.hp <= 0) { this.hp = 0; this.dead = true; return; }
        }

        this.moveTimer++;
        if (this.moveTimer < this.speed) return;
        this.moveTimer = 0;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance > 8) return;

        let moveX = 0, moveY = 0;
        if (Math.abs(dx) > Math.abs(dy)) { moveX = dx > 0 ? 1 : -1; }
        else { moveY = dy > 0 ? 1 : -1; }

        const newX = this.x + moveX;
        const newY = this.y + moveY;
        if (newX === player.x && newY === player.y) return;
        for (const enemy of enemies) {
            if (enemy !== this && enemy.x === newX && enemy.y === newY && !enemy.dead) return;
        }
        if (gameMap.isWalkable(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        this.hurtTimer = 10;
        if (this.hp <= 0) { this.hp = 0; this.dead = true; return true; }
        return false;
    }

    isAdjacentToPlayer(player) {
        const dx = Math.abs(this.x - player.x);
        const dy = Math.abs(this.y - player.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    render(ctx) {
        if (this.dead) return;
        const px = this.getPixelX();
        const py = this.getPixelY();
        ctx.save();
        if (this.hurtTimer > 0) ctx.filter = 'brightness(2)';
        switch (this.type) {
            case 'skeleton': this.drawSkeleton(ctx, px, py); break;
            case 'slime': this.drawSlime(ctx, px, py); break;
            case 'bat': this.drawBat(ctx, px, py); break;
            case 'ghost': this.drawGhost(ctx, px, py); break;
            case 'demon': this.drawDemon(ctx, px, py); break;
            case 'boss': this.drawBoss(ctx, px, py); break;
        }
        this.drawHealthBar(ctx, px, py);
        ctx.restore();
    }

    drawSkeleton(ctx, px, py) {
        const size = this.tileSize;
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(px + 10, py + 14, size - 20, size - 18);
        ctx.beginPath(); ctx.arc(px + size / 2, py + 10, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(px + size / 2 - 4, py + 9, 3, 0, Math.PI * 2); ctx.arc(px + size / 2 + 4, py + 9, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(px + size / 2 - 4, py + 14, 8, 3);
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(px + 6, py + 8, 4, 12); ctx.fillRect(px + size - 10, py + 8, 4, 12);
    }

    drawSlime(ctx, px, py) {
        const size = this.tileSize;
        const bounce = Math.sin(Date.now() / 200) * 2;
        ctx.fillStyle = '#32cd32';
        ctx.beginPath(); ctx.ellipse(px + size / 2, py + size - 10 + bounce, 12, 10 - bounce / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.ellipse(px + size / 2 - 4, py + size - 14 + bounce, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(px + size / 2 - 4, py + size - 10 + bounce, 2, 0, Math.PI * 2); ctx.arc(px + size / 2 + 4, py + size - 10 + bounce, 2, 0, Math.PI * 2); ctx.fill();
    }

    drawBat(ctx, px, py) {
        const size = this.tileSize;
        const wingFlap = Math.sin(Date.now() / 80) * 5;
        ctx.fillStyle = '#4a0080';
        ctx.beginPath(); ctx.moveTo(px + size / 2, py + 12); ctx.lineTo(px + 4, py + 10 + wingFlap); ctx.lineTo(px + 10, py + 20); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px + size / 2, py + 12); ctx.lineTo(px + size - 4, py + 10 - wingFlap); ctx.lineTo(px + size - 10, py + 20); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2d004d';
        ctx.beginPath(); ctx.ellipse(px + size / 2, py + 16, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px + size / 2 - 6, py + 10); ctx.lineTo(px + size / 2 - 10, py + 4); ctx.lineTo(px + size / 2 - 2, py + 10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px + size / 2 + 6, py + 10); ctx.lineTo(px + size / 2 + 10, py + 4); ctx.lineTo(px + size / 2 + 2, py + 10); ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(px + size / 2 - 3, py + 14, 2, 0, Math.PI * 2); ctx.arc(px + size / 2 + 3, py + 14, 2, 0, Math.PI * 2); ctx.fill();
    }

    drawGhost(ctx, px, py) {
        const size = this.tileSize;
        const wave = Math.sin(Date.now() / 300) * 3;
        ctx.fillStyle = 'rgba(200,200,255,0.6)';
        ctx.beginPath(); ctx.ellipse(px + size / 2, py + 12 + wave, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.arc(px + 10 + i * 6, py + 24 + wave, 4, 0, Math.PI); ctx.fill();
        }
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(px + size / 2 - 4, py + 10 + wave, 3, 0, Math.PI * 2); ctx.arc(px + size / 2 + 4, py + 10 + wave, 3, 0, Math.PI * 2); ctx.fill();
    }

    drawDemon(ctx, px, py) {
        const size = this.tileSize;
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(px + 6, py + 12, size - 12, size - 16);
        ctx.fillStyle = '#a00000';
        ctx.beginPath(); ctx.arc(px + size / 2, py + 12, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.moveTo(px + size / 2 - 8, py + 6); ctx.lineTo(px + size / 2 - 12, py - 4); ctx.lineTo(px + size / 2 - 4, py + 4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px + size / 2 + 8, py + 6); ctx.lineTo(px + size / 2 + 12, py - 4); ctx.lineTo(px + size / 2 + 4, py + 4); ctx.fill();
        ctx.fillStyle = '#ff0';
        ctx.beginPath(); ctx.arc(px + size / 2 - 4, py + 12, 2, 0, Math.PI * 2); ctx.arc(px + size / 2 + 4, py + 12, 2, 0, Math.PI * 2); ctx.fill();
    }

    drawBoss(ctx, px, py) {
        const size = this.tileSize;
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(px + 4, py + 12, size - 8, size - 16);
        ctx.fillStyle = '#a00000';
        ctx.beginPath(); ctx.arc(px + size / 2, py + 12, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.moveTo(px + size / 2 - 10, py + 6); ctx.lineTo(px + size / 2 - 14, py - 4); ctx.lineTo(px + size / 2 - 6, py + 4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px + size / 2 + 10, py + 6); ctx.lineTo(px + size / 2 + 14, py - 4); ctx.lineTo(px + size / 2 + 6, py + 4); ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(px + size / 2 - 5, py + 12, 3, 0, Math.PI * 2); ctx.arc(px + size / 2 + 5, py + 12, 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(px, py + 8, 6, 14); ctx.fillRect(px + size - 6, py + 8, 6, 14);
    }

    drawHealthBar(ctx, px, py) {
        const size = this.tileSize;
        const barWidth = size - 8;
        const healthPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 4, py - 2, barWidth, 4);
        ctx.fillStyle = healthPercent > 0.3 ? '#dc143c' : '#ff0000';
        ctx.fillRect(px + 4, py - 2, barWidth * healthPercent, 4);
    }
}

class Item extends Entity {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    render(ctx) {
        if (this.collected) return;
        const px = this.getPixelX();
        const py = this.getPixelY();
        const bob = Math.sin(Date.now() / 300 + this.bobOffset) * 3;
        ctx.save();
        switch (this.type) {
            case 'key': this.drawKey(ctx, px, py + bob); break;
            case 'gold': this.drawGold(ctx, px, py + bob); break;
            case 'health': this.drawHealth(ctx, px, py + bob); break;
            case 'mana': this.drawMana(ctx, px, py + bob); break;
            case 'equipment': this.drawEquipmentItem(ctx, px, py + bob); break;
            case 'consumable': this.drawConsumableItem(ctx, px, py + bob); break;
        }
        ctx.restore();
    }

    drawKey(ctx, px, py) {
        const size = this.tileSize;
        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(px + size / 2 - 4, py + 12, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8b4513'; ctx.beginPath(); ctx.arc(px + size / 2 - 4, py + 12, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(px + size / 2, py + 10, 10, 4); ctx.fillRect(px + size / 2 + 6, py + 14, 4, 4); ctx.fillRect(px + size / 2 + 10, py + 14, 4, 4);
        ctx.shadowBlur = 0;
    }

    drawGold(ctx, px, py) {
        const size = this.tileSize;
        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(px + size / 2, py + size / 2, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffec8b'; ctx.beginPath(); ctx.arc(px + size / 2 - 2, py + size / 2 - 2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b8860b'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', px + size / 2, py + size / 2);
    }

    drawHealth(ctx, px, py) {
        const size = this.tileSize;
        ctx.fillStyle = '#dc143c'; ctx.shadowColor = '#dc143c'; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(px + size / 2, py + size / 2 + 6);
        ctx.bezierCurveTo(px + size / 2 - 10, py + size / 2, px + size / 2 - 10, py + size / 2 - 8, px + size / 2, py + size / 2 - 4);
        ctx.bezierCurveTo(px + size / 2 + 10, py + size / 2 - 8, px + size / 2 + 10, py + size / 2, px + size / 2, py + size / 2 + 6);
        ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(px + size / 2 - 3, py + size / 2 - 4, 2, 0, Math.PI * 2); ctx.fill();
    }

    drawMana(ctx, px, py) {
        const size = this.tileSize;
        ctx.fillStyle = '#4169e1'; ctx.shadowColor = '#4169e1'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(px + size / 2, py + 8); ctx.lineTo(px + size / 2 - 8, py + 18);
        ctx.lineTo(px + size / 2 - 6, py + size - 8);
        ctx.quadraticCurveTo(px + size / 2, py + size - 4, px + size / 2 + 6, py + size - 8);
        ctx.lineTo(px + size / 2 + 8, py + 18); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(px + size / 2 - 2, py + 16, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
    }

    drawEquipmentItem(ctx, px, py) {
        const size = this.tileSize;
        ctx.fillStyle = this.data ? (RarityColors[this.data.rarity] || '#fff') : '#fff';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(px + size / 2, py + size / 2, 10, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000'; ctx.font = '14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.data ? (this.data.slot === 'weapon' ? '⚔' : this.data.slot === 'armor' ? '🛡' : '💎') : '?', px + size / 2, py + size / 2);
    }

    drawConsumableItem(ctx, px, py) {
        const size = this.tileSize;
        ctx.fillStyle = '#9370db'; ctx.shadowColor = '#9370db'; ctx.shadowBlur = 8;
        ctx.fillRect(px + 10, py + 6, size - 20, size - 12);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.data ? this.data.icon : '?', px + size / 2, py + size / 2);
    }
}
