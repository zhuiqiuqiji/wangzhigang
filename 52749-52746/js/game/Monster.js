const MONSTER_TYPES = {
    normal: {
        name: '小怪',
        health: 50,
        speed: 1,
        reward: 10,
        color: '#2ECC71',
        size: 16,
        emoji: '🐛',
        isFlying: false,
        armor: 0
    },
    fast: {
        name: '速跑怪',
        health: 35,
        speed: 2.2,
        reward: 15,
        color: '#F39C12',
        size: 14,
        emoji: '🐇',
        isFlying: false,
        armor: 0
    },
    tank: {
        name: '坦克怪',
        health: 250,
        speed: 0.45,
        reward: 35,
        color: '#8B4513',
        size: 24,
        emoji: '🐢',
        isFlying: false,
        armor: 5
    },
    flying: {
        name: '飞行怪',
        health: 60,
        speed: 1.5,
        reward: 25,
        color: '#9B59B6',
        size: 15,
        emoji: '🦅',
        isFlying: true,
        armor: 0
    },
    boss: {
        name: 'Boss怪',
        health: 800,
        speed: 0.35,
        reward: 150,
        color: '#8E44AD',
        size: 32,
        emoji: '👹',
        isFlying: false,
        armor: 10
    },
    miniBoss: {
        name: '精英怪',
        health: 300,
        speed: 0.7,
        reward: 60,
        color: '#C0392B',
        size: 22,
        emoji: '👺',
        isFlying: false,
        armor: 5
    }
};

class Monster {
    constructor(type, pathPoints, waveMultiplier = 1) {
        const config = MONSTER_TYPES[type];
        this.type = type;
        this.name = config.name;
        this.maxHealth = Math.floor(config.health * waveMultiplier);
        this.health = this.maxHealth;
        this.baseSpeed = config.speed;
        this.speed = config.speed;
        this.reward = Math.floor(config.reward * waveMultiplier);
        this.color = config.color;
        this.size = config.size;
        this.emoji = config.emoji;
        this.isFlying = config.isFlying;
        this.armor = config.armor;

        this.pathPoints = pathPoints;
        this.pathIndex = 0;
        this.progress = 0;
        this.x = pathPoints[0].x;
        this.y = pathPoints[0].y;
        this.isDead = false;
        this.reachedEnd = false;
        this.hitFlash = 0;

        this.slowEffect = { amount: 0, duration: 0 };
        this.poisonEffect = { damage: 0, duration: 0, timer: 0 };
        this.freezeEffect = { duration: 0 };
    }

    update(deltaTime) {
        if (this.isDead || this.reachedEnd) return;

        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
            if (this.hitFlash < 0) this.hitFlash = 0;
        }

        if (this.freezeEffect.duration > 0) {
            this.freezeEffect.duration -= deltaTime;
            if (this.freezeEffect.duration <= 0) {
                this.freezeEffect.duration = 0;
            }
            return;
        }

        if (this.slowEffect.duration > 0) {
            this.slowEffect.duration -= deltaTime;
            if (this.slowEffect.duration <= 0) {
                this.slowEffect.duration = 0;
                this.slowEffect.amount = 0;
            }
        }

        if (this.poisonEffect.duration > 0) {
            this.poisonEffect.duration -= deltaTime;
            this.poisonEffect.timer -= deltaTime;
            if (this.poisonEffect.timer <= 0) {
                this.takeDamage(this.poisonEffect.damage);
                this.poisonEffect.timer = 1;
            }
            if (this.poisonEffect.duration <= 0) {
                this.poisonEffect.duration = 0;
                this.poisonEffect.damage = 0;
            }
        }

        this.speed = this.baseSpeed * (1 - this.slowEffect.amount);

        if (this.pathIndex >= this.pathPoints.length - 1) {
            this.reachedEnd = true;
            return;
        }

        const currentPoint = this.pathPoints[this.pathIndex];
        const nextPoint = this.pathPoints[this.pathIndex + 1];
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.progress += (this.speed * deltaTime * 60) / distance;

        if (this.progress >= 1) {
            this.progress = 0;
            this.pathIndex++;
            if (this.pathIndex >= this.pathPoints.length - 1) {
                this.reachedEnd = true;
                return;
            }
        }

        const newCurrent = this.pathPoints[this.pathIndex];
        const newNext = this.pathPoints[this.pathIndex + 1];
        this.x = newCurrent.x + (newNext.x - newCurrent.x) * this.progress;
        this.y = newCurrent.y + (newNext.y - newCurrent.y) * this.progress;
    }

    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.armor);
        this.health -= actualDamage;
        this.hitFlash = 0.15;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }

    applySlow(amount, duration) {
        this.slowEffect.amount = Math.max(this.slowEffect.amount, amount);
        this.slowEffect.duration = Math.max(this.slowEffect.duration, duration);
    }

    applyPoison(damage, duration) {
        this.poisonEffect.damage = Math.max(this.poisonEffect.damage, damage);
        this.poisonEffect.duration = Math.max(this.poisonEffect.duration, duration);
        if (this.poisonEffect.timer <= 0) {
            this.poisonEffect.timer = 1;
        }
    }

    applyFreeze(duration) {
        this.freezeEffect.duration = Math.max(this.freezeEffect.duration, duration);
    }

    getPathProgress() {
        return this.pathIndex + this.progress;
    }

    render(ctx) {
        if (this.isDead) return;

        ctx.save();

        if (this.isFlying) {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.size + 5, this.size * 0.8, this.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
        }

        if (this.hitFlash > 0) {
            const flashCycle = (this.hitFlash * 30) % 1;
            ctx.globalAlpha = 0.6 + flashCycle * 0.4;
        }

        if (this.poisonEffect.duration > 0) {
            ctx.shadowColor = '#9B59B6';
            ctx.shadowBlur = 10;
        }

        if (this.freezeEffect.duration > 0) {
            ctx.shadowColor = '#3498DB';
            ctx.shadowBlur = 15;
        }

        const renderY = this.isFlying ? this.y - 15 : this.y;

        ctx.beginPath();
        ctx.arc(this.x, renderY, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, renderY);

        ctx.restore();

        if (this.slowEffect.duration > 0) {
            ctx.font = '12px Arial';
            ctx.fillText('❄️', this.x + this.size, renderY - this.size);
        }
        if (this.poisonEffect.duration > 0) {
            ctx.font = '12px Arial';
            ctx.fillText('☠️', this.x - this.size, renderY - this.size);
        }
        if (this.freezeEffect.duration > 0) {
            ctx.font = '14px Arial';
            ctx.fillText('🧊', this.x, renderY - this.size - 10);
        }

        this.renderHealthBar(ctx, renderY);
    }

    renderHealthBar(ctx, renderY) {
        const barWidth = this.size * 2;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = renderY - this.size - 12;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#2ECC71' : healthPercent > 0.25 ? '#F39C12' : '#E74C3C';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        if (this.armor > 0) {
            ctx.fillStyle = '#95A5A6';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`🛡️${this.armor}`, this.x, barY - 4);
        }
    }
}
