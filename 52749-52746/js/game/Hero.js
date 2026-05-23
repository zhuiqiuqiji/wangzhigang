const HERO_TYPES = {
    warrior: {
        name: '战士',
        health: 200,
        damage: 25,
        speed: 3,
        range: 45,
        attackRate: 800,
        color: '#E74C3C',
        emoji: '⚔️',
        skill: { name: '旋风斩', cooldown: 10, damage: 50, range: 80 }
    },
    archer: {
        name: '弓箭手',
        health: 120,
        damage: 35,
        speed: 3.5,
        range: 150,
        attackRate: 600,
        color: '#2ECC71',
        emoji: '🏹',
        skill: { name: '穿透箭', cooldown: 8, damage: 80, range: 250 }
    },
    mage: {
        name: '法师',
        health: 100,
        damage: 45,
        speed: 2.8,
        range: 120,
        attackRate: 1000,
        color: '#9B59B6',
        emoji: '🧙',
        skill: { name: '火球术', cooldown: 12, damage: 100, range: 100, splash: 60 }
    }
};

class Hero {
    constructor(type, x, y) {
        const config = HERO_TYPES[type];
        this.type = type;
        this.name = config.name;
        this.maxHealth = config.health;
        this.health = config.health;
        this.damage = config.damage;
        this.speed = config.speed;
        this.range = config.range;
        this.attackRate = config.attackRate;
        this.color = config.color;
        this.emoji = config.emoji;
        this.skill = config.skill;
        
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.target = null;
        this.lastAttackTime = 0;
        this.skillCooldown = 0;
        this.skillMaxCooldown = config.skill.cooldown;
        this.isDead = false;
        this.isMoving = false;
        this.attacking = false;
        this.attackAnimation = 0;
        
        this.level = 1;
        this.exp = 0;
        this.expToLevel = 100;
        this.kills = 0;
    }

    update(deltaTime, currentTime, monsters) {
        if (this.isDead) return null;

        if (this.skillCooldown > 0) {
            this.skillCooldown -= deltaTime;
            if (this.skillCooldown < 0) this.skillCooldown = 0;
        }

        if (this.attackAnimation > 0) {
            this.attackAnimation -= deltaTime;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.isMoving = true;
            const moveX = (dx / distance) * this.speed * deltaTime * 60;
            const moveY = (dy / distance) * this.speed * deltaTime * 60;
            this.x += moveX;
            this.y += moveY;
        } else {
            this.isMoving = false;
        }

        this.target = this.findTarget(monsters);

        if (this.target && currentTime - this.lastAttackTime >= this.attackRate) {
            const targetDx = this.target.x - this.x;
            const targetDy = this.target.y - this.y;
            const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
            
            if (targetDist <= this.range) {
                const result = this.attack();
                this.lastAttackTime = currentTime;
                this.attackAnimation = 0.2;
                return result;
            }
        }

        return null;
    }

    findTarget(monsters) {
        let bestTarget = null;
        let bestDistance = Infinity;

        for (const monster of monsters) {
            if (monster.isDead || monster.reachedEnd) continue;

            const dx = monster.x - this.x;
            const dy = monster.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestTarget = monster;
            }
        }

        return bestTarget;
    }

    attack() {
        if (!this.target || this.target.isDead) return null;
        
        if (this.type === 'archer') {
            const projectile = new Projectile(
                this.x,
                this.y,
                this.target,
                this.damage,
                12,
                '#8B4513',
                { type: 'single' }
            );
            return { projectile };
        } else {
            this.target.takeDamage(this.damage);
            if (this.target.isDead) {
                this.kills++;
            }
        }
        return null;
    }

    useSkill(monsters) {
        if (this.skillCooldown > 0) return null;
        
        this.skillCooldown = this.skillMaxCooldown;
        const skillResult = {
            name: this.skill.name,
            x: this.x,
            y: this.y,
            range: this.skill.range,
            damage: this.skill.damage,
            splash: this.skill.splash || 0,
            type: this.type
        };

        if (this.type === 'warrior') {
            for (const monster of monsters) {
                const dx = monster.x - this.x;
                const dy = monster.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.skill.range && !monster.isDead) {
                    monster.takeDamage(this.skill.damage);
                    if (monster.isDead) {
                        this.gainExp(monster.reward);
                        this.kills++;
                    }
                }
            }
        } else if (this.type === 'mage') {
            skillResult.targetX = this.target ? this.target.x : this.x;
            skillResult.targetY = this.target ? this.target.y : this.y + 100;
        } else if (this.type === 'archer') {
            skillResult.targetX = this.target ? this.target.x : this.x + 200;
            skillResult.targetY = this.target ? this.target.y : this.y;
        }

        return skillResult;
    }

    moveTo(x, y) {
        this.targetX = Math.max(20, Math.min(780, x));
        this.targetY = Math.max(20, Math.min(580, y));
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }

    gainExp(amount) {
        this.exp += amount;
        while (this.exp >= this.expToLevel) {
            this.exp -= this.expToLevel;
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.damage += 5;
        this.expToLevel = Math.floor(this.expToLevel * 1.5);
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    render(ctx) {
        if (this.isDead) return;

        ctx.save();

        ctx.beginPath();
        ctx.arc(this.x, this.y + 18, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        const bounce = this.isMoving ? Math.sin(Date.now() / 100) * 3 : 0;
        const attackOffset = this.attackAnimation > 0 ? Math.sin(this.attackAnimation * 30) * 5 : 0;

        ctx.beginPath();
        ctx.arc(this.x, this.y - bounce, 18, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(this.x - 5, this.y - 5 - bounce, 0, this.x, this.y - bounce, 18);
        gradient.addColorStop(0, this.lightenColor(this.color, 30));
        gradient.addColorStop(1, this.color);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x + attackOffset, this.y - bounce);

        ctx.restore();

        this.renderHealthBar(ctx);
        this.renderLevel(ctx);
        this.renderSkillCooldown(ctx);
    }

    renderHealthBar(ctx) {
        const barWidth = 40;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 30;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    renderLevel(ctx) {
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        const levelText = `Lv.${this.level}`;
        ctx.strokeText(levelText, this.x, this.y - 38);
        ctx.fillText(levelText, this.x, this.y - 38);

        const expBarWidth = 30;
        const expBarHeight = 3;
        const expX = this.x - expBarWidth / 2;
        const expY = this.y + 25;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(expX, expY, expBarWidth, expBarHeight);
        ctx.fillStyle = '#3498DB';
        ctx.fillRect(expX, expY, expBarWidth * (this.exp / this.expToLevel), expBarHeight);
    }

    renderSkillCooldown(ctx) {
        if (this.skillCooldown <= 0) return;

        const cooldownPercent = this.skillCooldown / this.skillMaxCooldown;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 22, -Math.PI / 2, -Math.PI / 2 + (1 - cooldownPercent) * Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }
}
