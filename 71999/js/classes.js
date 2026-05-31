const ClassData = {
    warrior: {
        name: '战士',
        icon: '⚔️',
        color: '#dc143c',
        description: '高生命值与防御，近战伤害加成',
        baseStats: { hp: 120, mp: 30, attack: 14, defense: 8, speed: 2 },
        levelUpBonus: { hp: 25, mp: 5, attack: 4, defense: 3 },
        skills: [
            { id: 'powerStrike', name: '强力打击', desc: '造成1.8倍伤害', mpCost: 10, unlockLevel: 1, cooldown: 0, damageMultiplier: 1.8 },
            { id: 'shieldBash', name: '盾击', desc: '造成伤害并眩晕1回合', mpCost: 15, unlockLevel: 3, cooldown: 3, damageMultiplier: 1.2, stun: 1 },
            { id: 'warCry', name: '战吼', desc: '提升3点攻击力持续5回合', mpCost: 12, unlockLevel: 5, cooldown: 5, buff: { stat: 'attack', value: 3, duration: 5 } },
            { id: 'whirlwind', name: '旋风斩', desc: '攻击周围所有敌人', mpCost: 20, unlockLevel: 8, cooldown: 4, damageMultiplier: 1.5, aoe: true }
        ]
    },
    mage: {
        name: '法师',
        icon: '🔮',
        color: '#4169e1',
        description: '高魔法值与魔法伤害，远程法术攻击',
        baseStats: { hp: 70, mp: 80, attack: 8, defense: 3, speed: 3 },
        levelUpBonus: { hp: 12, mp: 15, attack: 2, defense: 1 },
        skills: [
            { id: 'fireball', name: '火球术', desc: '造成2倍魔法伤害', mpCost: 12, unlockLevel: 1, cooldown: 0, damageMultiplier: 2.0, range: 3 },
            { id: 'iceShield', name: '冰盾', desc: '提升5点防御力持续4回合', mpCost: 15, unlockLevel: 3, cooldown: 4, buff: { stat: 'defense', value: 5, duration: 4 } },
            { id: 'thunder', name: '雷电术', desc: '对范围内敌人造成1.5倍伤害', mpCost: 20, unlockLevel: 5, cooldown: 3, damageMultiplier: 1.5, aoe: true, range: 2 },
            { id: 'arcaneBlast', name: '奥术冲击', desc: '造成3倍伤害无视防御', mpCost: 30, unlockLevel: 8, cooldown: 5, damageMultiplier: 3.0, ignoreDefense: true, range: 2 }
        ]
    },
    thief: {
        name: '盗贼',
        icon: '🗡️',
        color: '#32cd32',
        description: '高速度与暴击率，闪避与暗杀',
        baseStats: { hp: 85, mp: 50, attack: 12, defense: 4, speed: 5 },
        levelUpBonus: { hp: 18, mp: 8, attack: 3, defense: 2 },
        skills: [
            { id: 'backstab', name: '背刺', desc: '从背后攻击造成2.5倍伤害', mpCost: 10, unlockLevel: 1, cooldown: 0, damageMultiplier: 2.5, requireBack: true },
            { id: 'evasion', name: '闪避', desc: '下次攻击100%闪避', mpCost: 8, unlockLevel: 3, cooldown: 3, buff: { stat: 'dodge', value: 100, duration: 1 } },
            { id: 'poisonBlade', name: '毒刃', desc: '攻击附带中毒3回合', mpCost: 12, unlockLevel: 5, cooldown: 3, damageMultiplier: 1.3, dot: { damage: 5, duration: 3 } },
            { id: 'shadowStep', name: '暗影步', desc: '瞬移到敌人背后攻击', mpCost: 18, unlockLevel: 8, cooldown: 4, damageMultiplier: 2.0, teleport: true }
        ]
    }
};

class SkillSystem {
    constructor(classId) {
        this.classId = classId;
        this.classData = ClassData[classId];
        this.cooldowns = {};
        this.buffs = [];
        this.dots = [];
    }

    getAvailableSkills(playerLevel) {
        return this.classData.skills.filter(s => playerLevel >= s.unlockLevel);
    }

    canUseSkill(skillId, playerMp) {
        const skill = this.classData.skills.find(s => s.id === skillId);
        if (!skill) return false;
        if (this.cooldowns[skillId] && this.cooldowns[skillId] > 0) return false;
        if (playerMp < skill.mpCost) return false;
        return true;
    }

    useSkill(skillId) {
        const skill = this.classData.skills.find(s => s.id === skillId);
        if (!skill) return null;

        this.cooldowns[skillId] = skill.cooldown || 0;

        if (skill.buff) {
            this.buffs.push({
                stat: skill.buff.stat,
                value: skill.buff.value,
                duration: skill.buff.duration
            });
        }

        if (skill.dot) {
            this.dots.push({
                damage: skill.dot.damage,
                duration: skill.dot.duration
            });
        }

        return skill;
    }

    tickCooldowns() {
        for (const id in this.cooldowns) {
            if (this.cooldowns[id] > 0) {
                this.cooldowns[id]--;
            }
        }
    }

    tickBuffs() {
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            this.buffs[i].duration--;
            if (this.buffs[i].duration <= 0) {
                this.buffs.splice(i, 1);
            }
        }
    }

    tickDots() {
        const damages = [];
        for (let i = this.dots.length - 1; i >= 0; i--) {
            damages.push(this.dots[i].damage);
            this.dots[i].duration--;
            if (this.dots[i].duration <= 0) {
                this.dots.splice(i, 1);
            }
        }
        return damages;
    }

    getBuffValue(stat) {
        return this.buffs
            .filter(b => b.stat === stat)
            .reduce((sum, b) => sum + b.value, 0);
    }
}
