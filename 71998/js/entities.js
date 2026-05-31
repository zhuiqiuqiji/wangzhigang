const PlatformType = {
    NORMAL: 'normal',
    MOVING: 'moving',
    DISAPPEARING: 'disappearing',
    BOUNCE_PAD: 'bouncePad'
};

const PowerUpType = {
    FLY: 'fly',
    INVINCIBLE: 'invincible',
    SLOW_MO: 'slowMo'
};

const BallSkin = {
    DEFAULT: {
        id: 'default',
        name: '默认球',
        color1: '#67e8f9',
        color2: '#06b6d4',
        color3: '#0891b2',
        unlocked: true
    },
    BASKETBALL: {
        id: 'basketball',
        name: '篮球',
        color1: '#fbbf24',
        color2: '#f97316',
        color3: '#ea580c',
        lines: true,
        unlocked: true
    },
    SOCCER: {
        id: 'soccer',
        name: '足球',
        color1: '#ffffff',
        color2: '#f1f5f9',
        color3: '#cbd5e1',
        pattern: 'soccer',
        unlocked: true
    },
    BUBBLE: {
        id: 'bubble',
        name: '泡泡',
        color1: '#c084fc',
        color2: '#a855f7',
        color3: '#7c3aed',
        transparent: true,
        unlocked: false,
        unlockCondition: '收集50颗星星'
    },
    EYEBALL: {
        id: 'eyeball',
        name: '眼球',
        color1: '#ffffff',
        color2: '#fef3c7',
        color3: '#fbbf24',
        eye: true,
        unlocked: false,
        unlockCondition: '通关3个关卡'
    },
    FIRE: {
        id: 'fire',
        name: '火球',
        color1: '#fbbf24',
        color2: '#f97316',
        color3: '#dc2626',
        fire: true,
        unlocked: false,
        unlockCondition: '达成10次无伤通关'
    }
};

class Entity {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.active = true;
    }

    get left() {
        return this.x - this.width / 2;
    }

    get right() {
        return this.x + this.width / 2;
    }

    get top() {
        return this.y - this.height / 2;
    }

    get bottom() {
        return this.y + this.height / 2;
    }
}

class Ball extends Entity {
    constructor(x, y, radius, skinId = 'default') {
        super(x, y, radius * 2, radius * 2, 'ball');
        this.radius = radius;
        this.vx = 0;
        this.vy = 0;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.trail = [];
        this.squash = 1;
        this.stretch = 1;
        this.maxTrailLength = 20;
        this.rotation = 0;
        this.skinId = skinId;
        this.skin = BallSkin[skinId.toUpperCase()] || BallSkin.DEFAULT;
        
        this.isFlying = false;
        this.flyTimer = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.slowMotion = false;
        this.slowMoTimer = 0;
        
        this.hitCount = 0;
        this.eyePupilX = 0;
        this.eyePupilY = 0;
    }

    updateTrail() {
        this.trail.unshift({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }
        this.trail.forEach((point, i) => {
            point.alpha = 1 - (i / this.maxTrailLength);
        });
    }

    updatePowerUps(dt) {
        if (this.isFlying) {
            this.flyTimer -= dt;
            if (this.flyTimer <= 0) {
                this.isFlying = false;
            }
        }
        if (this.isInvincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }
        if (this.slowMotion) {
            this.slowMoTimer -= dt;
            if (this.slowMoTimer <= 0) {
                this.slowMotion = false;
            }
        }

        this.eyePupilX += (this.vx * 0.01 - this.eyePupilX) * 0.2;
        this.eyePupilY += (this.vy * 0.01 - this.eyePupilY) * 0.2;
    }

    activatePowerUp(type) {
        if (type === PowerUpType.FLY) {
            this.isFlying = true;
            this.flyTimer = POWER_UP_DURATION;
            this.vy = -8;
        } else if (type === PowerUpType.INVINCIBLE) {
            this.isInvincible = true;
            this.invincibleTimer = POWER_UP_DURATION;
        } else if (type === PowerUpType.SLOW_MO) {
            this.slowMotion = true;
            this.slowMoTimer = SLOW_MO_DURATION;
        }
    }

    setSkin(skinId) {
        this.skinId = skinId;
        this.skin = BallSkin[skinId.toUpperCase()] || BallSkin.DEFAULT;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.trail = [];
        this.squash = 1;
        this.stretch = 1;
        this.rotation = 0;
        this.isFlying = false;
        this.flyTimer = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.slowMotion = false;
        this.slowMoTimer = 0;
        this.hitCount = 0;
    }
}

class Platform extends Entity {
    constructor(x, y, width, height, hasSpike = false, spikeSide = 'top', type = PlatformType.NORMAL, extraData = {}) {
        super(x, y, width, height, 'platform');
        this.hasSpike = hasSpike;
        this.spikeSide = spikeSide;
        this.spikeCount = Math.floor(width / 25);
        this.floatOffset = Math.random() * Math.PI * 2;
        this.baseY = y;
        this.baseX = x;
        this.type = type;
        this.extraData = extraData;
        
        if (type === PlatformType.MOVING) {
            this.moveRange = extraData.moveRange || 100;
            this.moveSpeed = extraData.moveSpeed || 1;
            this.moveAxis = extraData.moveAxis || 'x';
            this.movePhase = extraData.movePhase || 0;
        } else if (type === PlatformType.DISAPPEARING) {
            this.disappearDelay = extraData.disappearDelay || 1;
            this.disappearDuration = extraData.disappearDuration || 2;
            this.reappearDuration = extraData.reappearDuration || 2;
            this.visible = true;
            this.touchTimer = 0;
            this.disappearTimer = 0;
            this.warningFlash = false;
        } else if (type === PlatformType.BOUNCE_PAD) {
            this.bounceMultiplier = extraData.bounceMultiplier || 2;
        }
    }

    update(time) {
        if (this.type === PlatformType.MOVING) {
            const offset = Math.sin(time * this.moveSpeed + this.movePhase) * this.moveRange;
            if (this.moveAxis === 'x') {
                this.x = this.baseX + offset;
            } else {
                this.y = this.baseY + offset;
            }
        } else if (this.type === PlatformType.DISAPPEARING) {
            if (this.visible) {
                if (this.touchTimer > 0) {
                    this.touchTimer -= 0.016;
                    this.warningFlash = Math.floor(this.touchTimer * 8) % 2 === 0;
                    if (this.touchTimer <= 0) {
                        this.visible = false;
                        this.disappearTimer = this.reappearDuration;
                        this.active = false;
                    }
                }
            } else {
                this.disappearTimer -= 0.016;
                if (this.disappearTimer <= 0) {
                    this.visible = true;
                    this.active = true;
                    this.touchTimer = 0;
                }
            }
        } else {
            this.y = this.baseY + Math.sin(time * 2 + this.floatOffset) * 2;
        }
    }

    onTouch() {
        if (this.type === PlatformType.DISAPPEARING && this.visible && this.touchTimer === 0) {
            this.touchTimer = this.disappearDelay;
        }
    }
}

class SpinningSaw extends Entity {
    constructor(x, y, radius = 25, moveData = null) {
        super(x, y, radius * 2, radius * 2, 'spinningSaw');
        this.radius = radius;
        this.rotation = 0;
        this.rotationSpeed = 8;
        this.moveData = moveData;
        this.baseX = x;
        this.baseY = y;
    }

    update(dt) {
        this.rotation += this.rotationSpeed * dt;
        
        if (this.moveData) {
            const time = Date.now() / 1000;
            const offset = Math.sin(time * (this.moveData.speed || 1)) * (this.moveData.range || 100);
            if (this.moveData.axis === 'x') {
                this.x = this.baseX + offset;
            } else {
                this.y = this.baseY + offset;
            }
        }
    }
}

class PowerUp extends Entity {
    constructor(x, y, type) {
        super(x, y, 40, 40, 'powerUp');
        this.type = type;
        this.collected = false;
        this.rotation = 0;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.scale = 1;
        this.radius = 20;
    }

    update(time) {
        this.rotation += 0.02;
        this.scale = 1 + Math.sin(time * 3 + this.floatOffset) * 0.15;
    }

    getColor() {
        switch (this.type) {
            case PowerUpType.FLY: return '#22d3ee';
            case PowerUpType.INVINCIBLE: return '#facc15';
            case PowerUpType.SLOW_MO: return '#a855f7';
            default: return '#fff';
        }
    }

    getIcon() {
        switch (this.type) {
            case PowerUpType.FLY: return '🦋';
            case PowerUpType.INVINCIBLE: return '🛡️';
            case PowerUpType.SLOW_MO: return '⏱️';
            default: return '✨';
        }
    }

    getName() {
        switch (this.type) {
            case PowerUpType.FLY: return '飞行能力';
            case PowerUpType.INVINCIBLE: return '无敌护盾';
            case PowerUpType.SLOW_MO: return '时间减缓';
            default: return '神秘道具';
        }
    }
}

class Star extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30, 'star');
        this.collected = false;
        this.rotation = 0;
        this.scale = 1;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.points = 100;
    }

    update(time) {
        this.rotation += 0.03;
        this.scale = 1 + Math.sin(time * 3 + this.floatOffset) * 0.1;
    }
}

class Gem extends Entity {
    constructor(x, y, color = 'purple') {
        super(x, y, 35, 35, 'gem');
        this.collected = false;
        this.rotation = 0;
        this.color = color;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.points = 500;
    }

    update(time) {
        this.rotation += 0.02;
        this.y += Math.sin(time * 2 + this.floatOffset) * 0.5;
    }

    getGradient(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.width
        );
        
        if (this.color === 'purple') {
            gradient.addColorStop(0, '#c084fc');
            gradient.addColorStop(0.5, '#a855f7');
            gradient.addColorStop(1, '#7c3aed');
        } else if (this.color === 'green') {
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(0.5, '#22c55e');
            gradient.addColorStop(1, '#16a34a');
        } else if (this.color === 'blue') {
            gradient.addColorStop(0, '#60a5fa');
            gradient.addColorStop(0.5, '#3b82f6');
            gradient.addColorStop(1, '#2563eb');
        } else {
            gradient.addColorStop(0, '#f472b6');
            gradient.addColorStop(0.5, '#ec4899');
            gradient.addColorStop(1, '#db2777');
        }
        
        return gradient;
    }
}

class Goal extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'goal');
        this.rainbowOffset = 0;
    }

    update(time) {
        this.rainbowOffset = time * 0.5;
    }

    getGradient(ctx) {
        const gradient = ctx.createLinearGradient(
            this.x - this.width / 2, this.y,
            this.x + this.width / 2, this.y
        );
        
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
        const offset = this.rainbowOffset % 1;
        
        colors.forEach((color, i) => {
            let pos = (i / colors.length + offset) % 1;
            gradient.addColorStop(pos, color);
        });
        
        return gradient;
    }
}

class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.active = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.5 * dt;
        this.life -= dt;
        this.size *= 0.98;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }

    get alpha() {
        return Math.max(0, this.life / this.maxLife);
    }
}

class ScorePopup {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1;
        this.maxLife = 1;
        this.active = true;
    }

    update(dt) {
        this.y -= 60 * dt;
        this.life -= dt;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }

    get alpha() {
        return Math.max(0, this.life / this.maxLife);
    }
}

class LevelRating {
    constructor(levelId) {
        this.levelId = levelId;
        this.stars = 0;
        this.perfectStars = false;
        this.noDamage = false;
        this.timeBonus = false;
        this.bestScore = 0;
        this.bestTime = Infinity;
        this.attempts = 0;
        this.completed = false;
    }

    calculateStars(starCollected, totalStars, hitCount, time, targetTime) {
        let count = 0;
        
        if (starCollected === totalStars) {
            this.perfectStars = true;
            count++;
        }
        
        if (hitCount === 0) {
            this.noDamage = true;
            count++;
        }
        
        if (time < targetTime) {
            this.timeBonus = true;
            count++;
        }
        
        this.stars = Math.max(this.stars, count);
        return count;
    }
}

class GameProfile {
    constructor() {
        this.totalStars = 0;
        this.totalGems = 0;
        this.gamesPlayed = 0;
        this.noDamageCount = 0;
        this.unlockedSkins = ['default', 'basketball', 'soccer'];
        this.currentSkin = 'default';
        this.levelRatings = {};
        this.highScores = [];
        this.dailyChallengeCompleted = null;
        this.communityLevels = [];
        this.completedLevels = new Set();
        this.load();
    }

    save() {
        try {
            localStorage.setItem('bounceBallProfile', JSON.stringify({
                totalStars: this.totalStars,
                totalGems: this.totalGems,
                gamesPlayed: this.gamesPlayed,
                noDamageCount: this.noDamageCount,
                noDamageRuns: this.noDamageCount,
                unlockedSkins: this.unlockedSkins,
                currentSkin: this.currentSkin,
                levelRatings: this.levelRatings,
                highScores: this.highScores,
                dailyChallengeCompleted: this.dailyChallengeCompleted,
                communityLevels: this.communityLevels,
                customLevels: this.communityLevels,
                completedLevels: Array.from(this.completedLevels)
            }));
        } catch (e) {
            console.log('无法保存存档:', e);
        }
    }

    load() {
        try {
            const saved = localStorage.getItem('bounceBallProfile');
            if (saved) {
                const data = JSON.parse(saved);
                this.totalStars = data.totalStars || 0;
                this.totalGems = data.totalGems || 0;
                this.gamesPlayed = data.gamesPlayed || 0;
                this.noDamageCount = data.noDamageCount || (data.noDamageRuns || 0);
                this.unlockedSkins = data.unlockedSkins || ['default', 'basketball', 'soccer'];
                this.currentSkin = data.currentSkin || 'default';
                this.levelRatings = data.levelRatings || {};
                this.highScores = data.highScores || [];
                this.dailyChallengeCompleted = data.dailyChallengeCompleted || null;
                this.communityLevels = data.communityLevels || (data.customLevels || []);
                this.completedLevels = new Set(data.completedLevels || []);
            }
        } catch (e) {
            console.log('无法读取存档:', e);
        }
    }

    getLevelRating(levelId) {
        return this.levelRatings[levelId] || null;
    }

    setLevelRating(levelId, rating) {
        const existing = this.levelRatings[levelId];
        if (!existing || rating.stars > existing.stars) {
            this.levelRatings[levelId] = rating;
        }
        this.save();
    }

    addCompletedLevel(levelId) {
        this.completedLevels.add(levelId);
        this.gamesPlayed++;
        this.save();
    }

    addNoDamageRun() {
        this.noDamageCount++;
        this.save();
    }

    addStars(count) {
        this.totalStars += count;
        this.save();
    }

    addGems(count) {
        this.totalGems += count;
        this.save();
    }

    addCommunityLevel(levelData) {
        this.communityLevels.push(levelData);
        this.save();
    }

    isSkinUnlocked(skinId) {
        return this.unlockedSkins.includes(skinId);
    }

    unlockSkin(skinId) {
        if (!this.unlockedSkins.includes(skinId)) {
            this.unlockedSkins.push(skinId);
            this.save();
            return true;
        }
        return false;
    }

    checkSkinUnlocks() {
        const unlocks = [];
        
        if (this.totalStars >= 50 && !this.unlockedSkins.includes('bubble')) {
            this.unlockSkin('bubble');
            unlocks.push(BallSkin.BUBBLE);
        }
        
        if (this.completedLevels.size >= 3 && !this.unlockedSkins.includes('eyeball')) {
            this.unlockSkin('eyeball');
            unlocks.push(BallSkin.EYEBALL);
        }
        
        if (this.noDamageCount >= 10 && !this.unlockedSkins.includes('fire')) {
            this.unlockSkin('fire');
            unlocks.push(BallSkin.FIRE);
        }
        
        return unlocks;
    }

    addHighScore(entry) {
        this.highScores.push(entry);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 20);
        this.save();
    }

    getOrCreateLevelRating(levelId) {
        if (!this.levelRatings[levelId]) {
            this.levelRatings[levelId] = new LevelRating(levelId);
        }
        return this.levelRatings[levelId];
    }
}
