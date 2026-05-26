const SkinSystem = {
    skins: [
        {
            id: 'neon-green',
            name: '霓虹绿',
            unlocked: true,
            price: 0,
            headColor: '#00ffff',
            bodyColors: ['#00ff88'],
            bodyGradient: false,
            hasTrail: false,
            hasGlow: true,
            glowColor: '#00ff88',
            particleType: 'none',
            unlockCondition: 'default'
        },
        {
            id: 'flame',
            name: '烈焰红',
            unlocked: true,
            price: 0,
            headColor: '#ff6b6b',
            bodyColors: ['#ff6b6b', '#ffd93d'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#ff6b6b',
            hasGlow: true,
            glowColor: '#ff6b6b',
            particleType: 'fire',
            unlockCondition: 'default'
        },
        {
            id: 'ocean',
            name: '海洋蓝',
            unlocked: true,
            price: 0,
            headColor: '#38bdf8',
            bodyColors: ['#38bdf8', '#0ea5e9', '#0284c7'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#38bdf8',
            hasGlow: true,
            glowColor: '#38bdf8',
            particleType: 'water',
            unlockCondition: 'default'
        },
        {
            id: 'magic',
            name: '暗夜紫',
            unlocked: false,
            price: 500,
            headColor: '#a855f7',
            bodyColors: ['#a855f7', '#7c3aed', '#6366f1'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#a855f7',
            hasGlow: true,
            glowColor: '#a855f7',
            particleType: 'magic',
            unlockCondition: 'score'
        },
        {
            id: 'gold',
            name: '黄金龙',
            unlocked: false,
            price: 1000,
            headColor: '#ffd700',
            bodyColors: ['#ffd700', '#fbbf24', '#f59e0b'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#ffd700',
            hasGlow: true,
            glowColor: '#ffd700',
            particleType: 'sparkle',
            unlockCondition: 'score'
        },
        {
            id: 'rainbow',
            name: '彩虹蛇',
            unlocked: false,
            price: 2000,
            headColor: '#ff6b6b',
            bodyColors: ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#a855f7'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#ffffff',
            hasGlow: true,
            glowColor: '#ffffff',
            particleType: 'rainbow',
            unlockCondition: 'score'
        },
        {
            id: 'shadow',
            name: '暗影刺客',
            unlocked: false,
            price: 800,
            headColor: '#4a5568',
            bodyColors: ['#2d3748', '#1a202c', '#171923'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#4a5568',
            hasGlow: true,
            glowColor: '#718096',
            particleType: 'shadow',
            unlockCondition: 'score'
        },
        {
            id: 'phoenix',
            name: '不死凤凰',
            unlocked: false,
            price: 3000,
            headColor: '#f97316',
            bodyColors: ['#f97316', '#ef4444', '#dc2626', '#fbbf24'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#fbbf24',
            hasGlow: true,
            glowColor: '#f97316',
            particleType: 'fire',
            unlockCondition: 'wins'
        },
        {
            id: 'toxic',
            name: '剧毒之蛇',
            unlocked: false,
            price: 600,
            headColor: '#84cc16',
            bodyColors: ['#84cc16', '#65a30d', '#4d7c0f'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#84cc16',
            hasGlow: true,
            glowColor: '#84cc16',
            particleType: 'toxic',
            unlockCondition: 'score'
        },
        {
            id: 'frost',
            name: '冰霜女王',
            unlocked: false,
            price: 1500,
            headColor: '#e0f2fe',
            bodyColors: ['#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#e0f2fe',
            hasGlow: true,
            glowColor: '#7dd3fc',
            particleType: 'ice',
            unlockCondition: 'score'
        },
        {
            id: 'galaxy',
            name: '银河星空',
            unlocked: false,
            price: 5000,
            headColor: '#c4b5fd',
            bodyColors: ['#1e1b4b', '#312e81', '#4338ca', '#6366f1', '#a78bfa'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#a78bfa',
            hasGlow: true,
            glowColor: '#c4b5fd',
            particleType: 'star',
            unlockCondition: 'wins'
        },
        {
            id: 'volcano',
            name: '火山熔岩',
            unlocked: false,
            price: 1200,
            headColor: '#991b1b',
            bodyColors: ['#991b1b', '#dc2626', '#f97316', '#fbbf24'],
            bodyGradient: true,
            hasTrail: true,
            trailColor: '#fbbf24',
            hasGlow: true,
            glowColor: '#dc2626',
            particleType: 'fire',
            unlockCondition: 'score'
        }
    ],

    currentSkinId: 'neon-green',
    playerStats: {
        totalScore: 0,
        totalWins: 0,
        totalKills: 0,
        totalLength: 0,
        gamesPlayed: 0
    },

    init() {
        this.loadProgress();
        this.checkUnlocks();
    },

    getCurrentSkin() {
        return this.skins.find(s => s.id === this.currentSkinId);
    },

    getSkinById(id) {
        return this.skins.find(s => s.id === id);
    },

    setCurrentSkin(id) {
        const skin = this.skins.find(s => s.id === id);
        if (skin && skin.unlocked) {
            this.currentSkinId = id;
            this.saveProgress();
            return true;
        }
        return false;
    },

    unlockSkin(id) {
        const skin = this.skins.find(s => s.id === id);
        if (!skin || skin.unlocked) return false;

        let canUnlock = false;
        switch (skin.unlockCondition) {
            case 'default':
                canUnlock = true;
                break;
            case 'score':
                canUnlock = this.playerStats.totalScore >= skin.price;
                break;
            case 'wins':
                canUnlock = this.playerStats.totalWins >= skin.price / 100;
                break;
            default:
                canUnlock = true;
        }

        if (canUnlock) {
            skin.unlocked = true;
            this.saveProgress();
            return true;
        }
        return false;
    },

    checkUnlocks() {
        for (const skin of this.skins) {
            if (!skin.unlocked) {
                this.unlockSkin(skin.id);
            }
        }
        this.saveProgress();
    },

    recordGame(score, kills, length, won) {
        this.playerStats.gamesPlayed++;
        this.playerStats.totalScore += score;
        this.playerStats.totalKills += kills;
        this.playerStats.totalLength += length;
        if (won) {
            this.playerStats.totalWins++;
        }
        this.checkUnlocks();
        this.saveProgress();
    },

    getUnlockedSkins() {
        return this.skins.filter(s => s.unlocked);
    },

    getLockedSkins() {
        return this.skins.filter(s => !s.unlocked);
    },

    saveProgress() {
        const data = {
            currentSkinId: this.currentSkinId,
            skins: this.skins.map(s => ({ id: s.id, unlocked: s.unlocked })),
            playerStats: this.playerStats
        };
        localStorage.setItem('snakeSkins', JSON.stringify(data));
    },

    loadProgress() {
        const saved = localStorage.getItem('snakeSkins');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentSkinId = data.currentSkinId || 'neon-green';
                this.playerStats = data.playerStats || this.playerStats;

                for (const skinData of data.skins || []) {
                    const skin = this.skins.find(s => s.id === skinData.id);
                    if (skin) {
                        skin.unlocked = skinData.unlocked;
                    }
                }
            } catch (e) {
                console.error('Failed to load skin progress:', e);
            }
        }
    },

    getBodyColor(skin, bodyIndex, totalLength) {
        if (!skin.bodyGradient || skin.bodyColors.length === 1) {
            return skin.bodyColors[0];
        }

        const colorIndex = Math.floor((bodyIndex / totalLength) * skin.bodyColors.length);
        return skin.bodyColors[Math.min(colorIndex, skin.bodyColors.length - 1)];
    },

    getParticleColor(particleType) {
        const colors = {
            'fire': ['#ff6b6b', '#ffd93d', '#f97316', '#ea580c'],
            'water': ['#38bdf8', '#0ea5e9', '#0284c7', '#7dd3fc'],
            'magic': ['#a855f7', '#7c3aed', '#c084fc', '#ddd6fe'],
            'sparkle': ['#ffd700', '#fef3c7', '#fbbf24', '#f59e0b'],
            'rainbow': ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#a855f7'],
            'shadow': ['#2d3748', '#1a202c', '#4a5568', '#718096'],
            'toxic': ['#84cc16', '#65a30d', '#4d7c0f', '#86efac'],
            'ice': ['#e0f2fe', '#7dd3fc', '#0ea5e9', '#bae6fd'],
            'star': ['#fef3c7', '#fbbf24', '#c4b5fd', '#a78bfa', '#ddd6fe'],
            'none': ['#ffffff']
        };
        return colors[particleType] || colors['none'];
    },

    getUnlockDescription(skin) {
        if (skin.unlocked) return '已解锁';
        switch (skin.unlockCondition) {
            case 'score':
                const currentScore = this.playerStats.totalScore;
                return `累计${skin.price}分解锁 (${currentScore}/${skin.price})`;
            case 'wins':
                const requiredWins = Math.ceil(skin.price / 100);
                return `${requiredWins}次胜场解锁 (${this.playerStats.totalWins}/${requiredWins})`;
            default:
                return `${skin.price}分解锁`;
        }
    }
};