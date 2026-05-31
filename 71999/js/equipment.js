const EquipmentDB = {
    weapons: [
        { id: 'woodenSword', name: '木剑', type: 'weapon', slot: 'weapon', attack: 3, defense: 0, mp: 0, rarity: 'common', tier: 1 },
        { id: 'ironSword', name: '铁剑', type: 'weapon', slot: 'weapon', attack: 6, defense: 0, mp: 0, rarity: 'uncommon', tier: 1 },
        { id: 'steelSword', name: '钢剑', type: 'weapon', slot: 'weapon', attack: 10, defense: 0, mp: 0, rarity: 'rare', tier: 2 },
        { id: 'flameBlade', name: '炎刃', type: 'weapon', slot: 'weapon', attack: 15, defense: 0, mp: 5, rarity: 'epic', tier: 2 },
        { id: 'dragonSword', name: '龙牙剑', type: 'weapon', slot: 'weapon', attack: 22, defense: 2, mp: 0, rarity: 'legendary', tier: 3 },
        { id: 'staff', name: '法杖', type: 'weapon', slot: 'weapon', attack: 4, defense: 0, mp: 10, rarity: 'common', tier: 1 },
        { id: 'crystalStaff', name: '水晶法杖', type: 'weapon', slot: 'weapon', attack: 8, defense: 0, mp: 20, rarity: 'rare', tier: 2 },
        { id: 'arcaneStaff', name: '奥术法杖', type: 'weapon', slot: 'weapon', attack: 12, defense: 0, mp: 35, rarity: 'epic', tier: 2 },
        { id: 'dagger', name: '匕首', type: 'weapon', slot: 'weapon', attack: 5, defense: 0, mp: 0, rarity: 'common', tier: 1 },
        { id: 'shadowDagger', name: '暗影匕首', type: 'weapon', slot: 'weapon', attack: 9, defense: 0, mp: 5, rarity: 'rare', tier: 2 },
        { id: 'assassinBlade', name: '刺客之刃', type: 'weapon', slot: 'weapon', attack: 18, defense: 0, mp: 0, rarity: 'epic', tier: 2 }
    ],
    armors: [
        { id: 'leatherArmor', name: '皮甲', type: 'armor', slot: 'armor', attack: 0, defense: 4, mp: 0, rarity: 'common', tier: 1 },
        { id: 'chainMail', name: '锁子甲', type: 'armor', slot: 'armor', attack: 0, defense: 7, mp: 0, rarity: 'uncommon', tier: 1 },
        { id: 'plateArmor', name: '板甲', type: 'armor', slot: 'armor', attack: 0, defense: 12, mp: 0, rarity: 'rare', tier: 2 },
        { id: 'dragonArmor', name: '龙鳞甲', type: 'armor', slot: 'armor', attack: 3, defense: 18, mp: 0, rarity: 'epic', tier: 2 },
        { id: 'robe', name: '法袍', type: 'armor', slot: 'armor', attack: 0, defense: 2, mp: 15, rarity: 'common', tier: 1 },
        { id: 'mysticRobe', name: '秘法袍', type: 'armor', slot: 'armor', attack: 0, defense: 5, mp: 25, rarity: 'rare', tier: 2 },
        { id: 'shadowCloak', name: '暗影斗篷', type: 'armor', slot: 'armor', attack: 2, defense: 6, mp: 10, rarity: 'rare', tier: 2 }
    ],
    accessories: [
        { id: 'ringOfLife', name: '生命戒指', type: 'accessory', slot: 'accessory', attack: 0, defense: 0, mp: 0, hpBonus: 20, rarity: 'common', tier: 1 },
        { id: 'ringOfPower', name: '力量戒指', type: 'accessory', slot: 'accessory', attack: 4, defense: 0, mp: 0, rarity: 'uncommon', tier: 1 },
        { id: 'amuletOfWisdom', name: '智慧护符', type: 'accessory', slot: 'accessory', attack: 0, defense: 0, mp: 15, rarity: 'uncommon', tier: 1 },
        { id: 'guardianCharm', name: '守护符咒', type: 'accessory', slot: 'accessory', attack: 0, defense: 5, mp: 0, hpBonus: 10, rarity: 'rare', tier: 2 },
        { id: 'dragonHeart', name: '龙之心', type: 'accessory', slot: 'accessory', attack: 5, defense: 5, mp: 10, hpBonus: 30, rarity: 'legendary', tier: 3 }
    ]
};

const RarityColors = {
    common: '#aaa',
    uncommon: '#1eff00',
    rare: '#0070dd',
    epic: '#a335ee',
    legendary: '#ff8000'
};

const RarityNames = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
};

class EquipmentSystem {
    constructor() {
        this.equipped = {
            weapon: null,
            armor: null,
            accessory: null
        };
    }

    equip(item) {
        const old = this.equipped[item.slot];
        this.equipped[item.slot] = item;
        return old;
    }

    unequip(slot) {
        const item = this.equipped[slot];
        this.equipped[slot] = null;
        return item;
    }

    getTotalAttack() {
        let total = 0;
        for (const slot in this.equipped) {
            if (this.equipped[slot]) {
                total += this.equipped[slot].attack || 0;
            }
        }
        return total;
    }

    getTotalDefense() {
        let total = 0;
        for (const slot in this.equipped) {
            if (this.equipped[slot]) {
                total += this.equipped[slot].defense || 0;
            }
        }
        return total;
    }

    getTotalMp() {
        let total = 0;
        for (const slot in this.equipped) {
            if (this.equipped[slot]) {
                total += this.equipped[slot].mp || 0;
            }
        }
        return total;
    }

    getTotalHpBonus() {
        let total = 0;
        for (const slot in this.equipped) {
            if (this.equipped[slot]) {
                total += this.equipped[slot].hpBonus || 0;
            }
        }
        return total;
    }

    static generateRandomEquipment(rng, floor, classId) {
        const maxRarity = Math.min(floor, 4);
        const rarities = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'rare', 'epic', 'legendary'];
        const rarity = rarities[Math.min(rng.nextInt(maxRarity + 2), rarities.length - 1)];

        let pool = [];
        if (classId === 'warrior') {
            pool = [...EquipmentDB.weapons.filter(w => w.name.includes('剑') || w.name.includes('刃')),
                     ...EquipmentDB.armors.filter(a => a.name.includes('甲')),
                     ...EquipmentDB.accessories];
        } else if (classId === 'mage') {
            pool = [...EquipmentDB.weapons.filter(w => w.name.includes('法杖')),
                     ...EquipmentDB.armors.filter(a => a.name.includes('袍')),
                     ...EquipmentDB.accessories];
        } else {
            pool = [...EquipmentDB.weapons.filter(w => w.name.includes('匕首') || w.name.includes('刃')),
                     ...EquipmentDB.armors.filter(a => a.name.includes('斗篷') || a.name.includes('皮甲')),
                     ...EquipmentDB.accessories];
        }

        const tierMatch = pool.filter(e => e.rarity === rarity);
        if (tierMatch.length > 0) {
            return { ...rng.pick(tierMatch) };
        }
        return { ...rng.pick(pool) };
    }
}
