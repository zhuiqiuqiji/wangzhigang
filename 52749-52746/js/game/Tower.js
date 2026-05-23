const TOWER_TYPES = {
    arrow: {
        name: '箭塔',
        cost: 50,
        damage: 12,
        range: 110,
        fireRate: 800,
        color: '#2ECC71',
        emoji: '🏹',
        projectileColor: '#8B4513',
        projectileSpeed: 12,
        type: 'single',
        upgrades: [
            { cost: 75, damage: 18, range: 130, fireRate: 700, emoji: '🎯' },
            { cost: 150, damage: 28, range: 150, fireRate: 550, emoji: '⚔️' }
        ]
    },
    cannon: {
        name: '炮塔',
        cost: 100,
        damage: 35,
        range: 90,
        fireRate: 1500,
        color: '#E74C3C',
        emoji: '💣',
        projectileColor: '#333',
        projectileSpeed: 6,
        splashRadius: 50,
        type: 'splash',
        upgrades: [
            { cost: 130, damage: 55, range: 105, fireRate: 1300, splashRadius: 60, emoji: '💥' },
            { cost: 220, damage: 85, range: 120, fireRate: 1100, splashRadius: 75, emoji: '☄️' }
        ]
    },
    ice: {
        name: '冰塔',
        cost: 80,
        damage: 8,
        range: 100,
        fireRate: 1200,
        color: '#3498DB',
        emoji: '❄️',
        projectileColor: '#ADD8E6',
        projectileSpeed: 8,
        slowAmount: 0.5,
        slowDuration: 2,
        type: 'slow',
        upgrades: [
            { cost: 100, damage: 12, range: 115, fireRate: 1000, slowAmount: 0.4, slowDuration: 2.5, emoji: '🧊' },
            { cost: 180, damage: 18, range: 130, fireRate: 800, slowAmount: 0.3, slowDuration: 3, emoji: '🌨️' }
        ]
    },
    poison: {
        name: '毒塔',
        cost: 90,
        damage: 6,
        range: 95,
        fireRate: 1000,
        color: '#9B59B6',
        emoji: '☠️',
        projectileColor: '#9B59B6',
        projectileSpeed: 7,
        poisonDamage: 3,
        poisonDuration: 3,
        type: 'poison',
        upgrades: [
            { cost: 110, damage: 10, range: 110, fireRate: 900, poisonDamage: 5, poisonDuration: 4, emoji: '🦠' },
            { cost: 190, damage: 15, range: 125, fireRate: 750, poisonDamage: 8, poisonDuration: 5, emoji: '💀' }
        ]
    },
    laser: {
        name: '激光塔',
        cost: 150,
        damage: 5,
        range: 130,
        fireRate: 50,
        color: '#F1C40F',
        emoji: '🔆',
        projectileColor: '#FFD700',
        type: 'laser',
        upgrades: [
            { cost: 180, damage: 8, range: 145, fireRate: 40, emoji: '⚡' },
            { cost: 280, damage: 12, range: 160, fireRate: 30, emoji: '🌟' }
        ]
    },
    missile: {
        name: '导弹塔',
        cost: 200,
        damage: 60,
        range: 150,
        fireRate: 2500,
        color: '#E67E22',
        emoji: '🚀',
        projectileColor: '#E67E22',
        projectileSpeed: 5,
        splashRadius: 70,
        type: 'missile',
        homing: true,
        upgrades: [
            { cost: 250, damage: 90, range: 170, fireRate: 2200, splashRadius: 85, emoji: '🛸' },
            { cost: 380, damage: 130, range: 190, fireRate: 1900, splashRadius: 100, emoji: '🛡️' }
        ]
    }
};

class Tower {
    constructor(type, col, row, cellSize) {
        const config = TOWER_TYPES[type];
        this.type = type;
        this.col = col;
        this.row = row;
        this.cellSize = cellSize;
        this.x = col * cellSize + cellSize / 2;
        this.y = row * cellSize + cellSize / 2;

        this.name = config.name;
        this.cost = config.cost;
        this.damage = config.damage;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.color = config.color;
        this.emoji = config.emoji;
        this.projectileColor = config.projectileColor;
        this.projectileSpeed = config.projectileSpeed || 8;
        this.splashRadius = config.splashRadius || 0;
        this.slowAmount = config.slowAmount || 0;
        this.slowDuration = config.slowDuration || 0;
        this.poisonDamage = config.poisonDamage || 0;
        this.poisonDuration = config.poisonDuration || 0;
        this.towerType = config.type;
        this.homing = config.homing || false;
        this.upgrades = config.upgrades;
        this.baseEmoji = config.emoji;

        this.level = 1;
        this.maxLevel = this.upgrades.length + 1;
        this.lastFireTime = 0;
        this.target = null;
        this.angle = 0;
        this.totalCost = this.cost;
        this.laserTarget = null;
    }

    canUpgrade() {
        return this.level < this.maxLevel;
    }

    getUpgradeCost() {
        if (!this.canUpgrade()) return 0;
        return this.upgrades[this.level - 1].cost;
    }

    getSellValue() {
        return Math.floor(this.totalCost * 0.6);
    }

    upgrade() {
        if (!this.canUpgrade()) return false;

        const upgradeData = this.upgrades[this.level - 1];
        this.damage = upgradeData.damage;
        this.range = upgradeData.range;
        this.fireRate = upgradeData.fireRate;
        if (upgradeData.splashRadius) this.splashRadius = upgradeData.splashRadius;
        if (upgradeData.slowAmount) this.slowAmount = upgradeData.slowAmount;
        if (upgradeData.slowDuration) this.slowDuration = upgradeData.slowDuration;
        if (upgradeData.poisonDamage) this.poisonDamage = upgradeData.poisonDamage;
        if (upgradeData.poisonDuration) this.poisonDuration = upgradeData.poisonDuration;
        if (upgradeData.emoji) this.emoji = upgradeData.emoji;
        this.totalCost += upgradeData.cost;
        this.level++;
        return true;
    }

    update(currentTime, monsters, projectiles) {
        this.target = this.findTarget(monsters);

        if (this.towerType === 'laser') {
            this.laserTarget = this.target;
            if (this.target && currentTime - this.lastFireTime >= this.fireRate) {
                this.target.takeDamage(this.damage);
                this.lastFireTime = currentTime;
            }
            return;
        }

        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.angle = Math.atan2(dy, dx);

            if (currentTime - this.lastFireTime >= this.fireRate) {
                this.fire(projectiles);
                this.lastFireTime = currentTime;
            }
        }
    }

    findTarget(monsters) {
        let bestTarget = null;
        let bestProgress = -1;

        const antiAirTypes = ['arrow', 'poison', 'laser', 'missile'];

        for (const monster of monsters) {
            if (monster.isDead || monster.reachedEnd) continue;
            if (monster.isFlying && !antiAirTypes.includes(this.towerType)) continue;

            const dx = monster.x - this.x;
            const dy = monster.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.range) {
                const progress = monster.getPathProgress();
                if (progress > bestProgress) {
                    bestProgress = progress;
                    bestTarget = monster;
                }
            }
        }

        return bestTarget;
    }

    fire(projectiles) {
        if (!this.target) return;

        const projectile = new Projectile(
            this.x,
            this.y,
            this.target,
            this.damage,
            this.projectileSpeed,
            this.projectileColor,
            {
                splashRadius: this.splashRadius,
                slowAmount: this.slowAmount,
                slowDuration: this.slowDuration,
                poisonDamage: this.poisonDamage,
                poisonDuration: this.poisonDuration,
                type: this.towerType,
                homing: this.homing
            }
        );
        projectiles.push(projectile);
    }

    isInRange(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.cellSize / 2;
    }

    render(ctx, isSelected = false) {
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fillStyle = this.hexToRgba(this.color, 0.15);
            ctx.fill();
            ctx.strokeStyle = this.hexToRgba(this.color, 0.5);
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (this.towerType === 'laser' && this.laserTarget && !this.laserTarget.isDead) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.laserTarget.x, this.laserTarget.y);
            ctx.strokeStyle = this.projectileColor;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.cellSize / 2);
        gradient.addColorStop(0, this.lightenColor(this.color, 30));
        gradient.addColorStop(1, this.color);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.cellSize / 2 - 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.cellSize / 2 - 10, 0, Math.PI * 2);
        ctx.fillStyle = this.lightenColor(this.color, 40 + (this.level - 1) * 15);
        ctx.fill();

        ctx.font = `${24 + (this.level - 1) * 4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);

        if (this.level > 1) {
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            const stars = '⭐'.repeat(this.level - 1);
            ctx.strokeText(stars, this.x, this.y - this.cellSize / 2 + 10);
            ctx.fillText(stars, this.x, this.y - this.cellSize / 2 + 10);
        }

        if (this.level >= 3) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.cellSize / 2 + 3, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
