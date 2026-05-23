const SKILLS = {
    freeze: {
        name: '全屏冰冻',
        description: '冻结所有怪物3秒',
        cooldown: 25,
        icon: '🧊',
        color: '#3498DB'
    },
    meteor: {
        name: '陨石轰炸',
        description: '对所有怪物造成大量伤害',
        cooldown: 30,
        icon: '☄️',
        color: '#E74C3C',
        damage: 80
    },
    goldRain: {
        name: '金币雨',
        description: '获得大量金币',
        cooldown: 40,
        icon: '💰',
        color: '#F1C40F',
        goldAmount: 150
    }
};

class SkillSystem {
    constructor() {
        this.skills = {};
        this.cooldowns = {};
        this.activeEffects = [];
        
        for (const [key, config] of Object.entries(SKILLS)) {
            this.skills[key] = config;
            this.cooldowns[key] = 0;
        }
    }

    update(deltaTime) {
        for (const key of Object.keys(this.cooldowns)) {
            if (this.cooldowns[key] > 0) {
                this.cooldowns[key] -= deltaTime;
                if (this.cooldowns[key] < 0) {
                    this.cooldowns[key] = 0;
                }
            }
        }

        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            this.activeEffects[i].duration -= deltaTime;
            if (this.activeEffects[i].duration <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }
    }

    canUseSkill(skillKey) {
        return this.cooldowns[skillKey] <= 0;
    }

    useSkill(skillKey, monsters) {
        if (!this.canUseSkill(skillKey)) return null;

        const skill = this.skills[skillKey];
        this.cooldowns[skillKey] = skill.cooldown;

        const effect = {
            type: skillKey,
            duration: 0.5,
            maxDuration: 0.5
        };

        switch (skillKey) {
            case 'freeze':
                this.applyFreeze(monsters);
                effect.duration = 3;
                effect.maxDuration = 3;
                break;
            case 'meteor':
                this.applyMeteor(monsters);
                break;
            case 'goldRain':
                effect.goldAmount = skill.goldAmount;
                break;
        }

        this.activeEffects.push(effect);
        return effect;
    }

    applyFreeze(monsters) {
        for (const monster of monsters) {
            if (!monster.isDead && !monster.reachedEnd) {
                monster.applyFreeze(3);
            }
        }
    }

    applyMeteor(monsters) {
        const damage = SKILLS.meteor.damage;
        for (const monster of monsters) {
            if (!monster.isDead && !monster.reachedEnd) {
                monster.takeDamage(damage);
            }
        }
    }

    getCooldownPercent(skillKey) {
        if (this.cooldowns[skillKey] <= 0) return 0;
        return this.cooldowns[skillKey] / this.skills[skillKey].cooldown;
    }

    renderEffects(ctx, width, height) {
        const time = Date.now() / 100;
        
        for (const effect of this.activeEffects) {
            const alpha = effect.duration / effect.maxDuration;
            
            if (effect.type === 'freeze') {
                ctx.fillStyle = `rgba(52, 152, 219, ${alpha * 0.2})`;
                ctx.fillRect(0, 0, width, height);
                
                for (let i = 0; i < 30; i++) {
                    const x = (Math.sin(time + i * 0.5) * 0.5 + 0.5) * width;
                    const y = ((time * 50 + i * 30) % height);
                    ctx.font = '16px Arial';
                    ctx.globalAlpha = alpha * 0.7;
                    ctx.fillText('❄️', x, y);
                    ctx.globalAlpha = 1;
                }
            } else if (effect.type === 'meteor') {
                ctx.fillStyle = `rgba(231, 76, 60, ${alpha * 0.3})`;
                ctx.fillRect(0, 0, width, height);
                
                for (let i = 0; i < 15; i++) {
                    const x = (Math.sin(time * 2 + i) * 0.5 + 0.5) * width;
                    const y = ((time * 100 + i * 50) % (height + 100)) - 50;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI / 4);
                    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
                    ctx.fillRect(-5, -20, 10, 40);
                    ctx.restore();
                }
            } else if (effect.type === 'goldRain') {
                for (let i = 0; i < 25; i++) {
                    const x = (Math.sin(time + i * 0.7) * 0.5 + 0.5) * width;
                    const y = ((time * 80 + i * 40) % height);
                    ctx.font = '20px Arial';
                    ctx.globalAlpha = alpha * 0.8;
                    ctx.fillText('💰', x, y);
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    static getSkillList() {
        return Object.entries(SKILLS).map(([key, config]) => ({
            key,
            ...config
        }));
    }
}
