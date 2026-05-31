const ConsumableDB = {
    healthPotionS: { id: 'healthPotionS', name: '小生命药水', type: 'consumable', effect: 'heal', value: 30, desc: '恢复30点生命值', icon: '🧪' },
    healthPotionL: { id: 'healthPotionL', name: '大生命药水', type: 'consumable', effect: 'heal', value: 80, desc: '恢复80点生命值', icon: '🧪' },
    manaPotionS: { id: 'manaPotionS', name: '小魔法药水', type: 'consumable', effect: 'mana', value: 20, desc: '恢复20点魔法值', icon: '💧' },
    manaPotionL: { id: 'manaPotionL', name: '大魔法药水', type: 'consumable', effect: 'mana', value: 50, desc: '恢复50点魔法值', icon: '💧' },
    scrollOfFire: { id: 'scrollOfFire', name: '火焰卷轴', type: 'consumable', effect: 'damage', value: 40, desc: '对周围敌人造成40点伤害', icon: '📜' },
    scrollOfTeleport: { id: 'scrollOfTeleport', name: '传送卷轴', type: 'consumable', effect: 'teleport', value: 0, desc: '随机传送到安全位置', icon: '📜' },
    spellbook: { id: 'spellbook', name: '魔法书', type: 'consumable', effect: 'exp', value: 50, desc: '获得50点经验值', icon: '📖' },
    antidote: { id: 'antidote', name: '解毒剂', type: 'consumable', effect: 'cure', value: 0, desc: '清除所有负面状态', icon: '💊' },
    elixir: { id: 'elixir', name: '万灵药', type: 'consumable', effect: 'fullRestore', value: 0, desc: '完全恢复生命和魔法', icon: '✨' }
};

class InventorySystem {
    constructor(maxSlots = 20) {
        this.maxSlots = maxSlots;
        this.items = [];
    }

    addItem(item) {
        if (this.items.length >= this.maxSlots) return false;
        this.items.push({ ...item, uid: Date.now() + Math.random() });
        return true;
    }

    removeItem(uid) {
        const index = this.items.findIndex(i => i.uid === uid);
        if (index >= 0) {
            return this.items.splice(index, 1)[0];
        }
        return null;
    }

    getItem(uid) {
        return this.items.find(i => i.uid === uid);
    }

    useItem(uid, player, game) {
        const item = this.getItem(uid);
        if (!item) return null;

        let result = null;

        switch (item.effect) {
            case 'heal':
                player.heal(item.value);
                result = { message: `使用${item.name}，恢复${item.value}生命值`, type: 'heal' };
                break;
            case 'mana':
                player.restoreMp(item.value);
                result = { message: `使用${item.name}，恢复${item.value}魔法值`, type: 'mana' };
                break;
            case 'damage':
                if (game) {
                    const nearby = game.enemies.filter(e => !e.dead && Math.abs(e.x - player.x) <= 2 && Math.abs(e.y - player.y) <= 2);
                    nearby.forEach(e => e.takeDamage(item.value));
                    result = { message: `使用${item.name}，对${nearby.length}个敌人造成${item.value}伤害`, type: 'damage' };
                }
                break;
            case 'teleport':
                if (game && game.map) {
                    const positions = game.map.getRandomFloorPositions(1);
                    if (positions.length > 0) {
                        player.x = positions[0].x;
                        player.y = positions[0].y;
                        result = { message: `使用${item.name}，传送到新位置`, type: 'teleport' };
                    }
                }
                break;
            case 'exp':
                const leveled = player.gainExp(item.value);
                result = { message: `使用${item.name}，获得${item.value}经验值${leveled ? '，升级了！' : ''}`, type: 'exp' };
                break;
            case 'cure':
                if (player.skillSystem) {
                    player.skillSystem.dots = [];
                }
                result = { message: `使用${item.name}，清除负面状态`, type: 'cure' };
                break;
            case 'fullRestore':
                player.hp = player.maxHp;
                player.mp = player.maxMp;
                if (player.skillSystem) {
                    player.skillSystem.dots = [];
                }
                result = { message: `使用${item.name}，完全恢复！`, type: 'fullRestore' };
                break;
        }

        if (result) {
            this.removeItem(uid);
        }
        return result;
    }

    getItemsByType(type) {
        return this.items.filter(i => i.type === type);
    }

    isFull() {
        return this.items.length >= this.maxSlots;
    }

    static generateRandomConsumable(rng, floor) {
        const pool = [];
        pool.push(ConsumableDB.healthPotionS, ConsumableDB.healthPotionS, ConsumableDB.healthPotionS);
        pool.push(ConsumableDB.manaPotionS, ConsumableDB.manaPotionS);
        if (floor >= 2) {
            pool.push(ConsumableDB.healthPotionL, ConsumableDB.scrollOfFire);
        }
        if (floor >= 3) {
            pool.push(ConsumableDB.manaPotionL, ConsumableDB.scrollOfTeleport, ConsumableDB.spellbook);
        }
        if (floor >= 4) {
            pool.push(ConsumableDB.antidote, ConsumableDB.elixir);
        }
        const template = rng.pick(pool);
        return { ...template, uid: Date.now() + Math.random() };
    }
}
