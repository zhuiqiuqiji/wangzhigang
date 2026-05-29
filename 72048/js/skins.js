class SkinSystem {
    constructor() {
        this.currentSkin = 'classic';
        this.currentEquipment = {
            helmet: 'default',
            goggles: 'default',
            suit: 'default'
        };
        
        this.unlockedSkins = ['classic'];
        this.unlockedEquipment = {
            helmet: ['default'],
            goggles: ['default'],
            suit: ['default']
        };
        
        this.skins = {
            classic: { name: '经典红', color: 0xFF6B6B, price: 0 },
            camo: { name: '迷彩', color: 0x556B2F, price: 500 },
            neon: { name: '荧光', color: 0x00FFFF, price: 1000 },
            rainbow: { name: '彩虹', color: 0xFF00FF, price: 2000, gradient: true },
            gold: { name: '黄金', color: 0xFFD700, price: 5000, metalness: 0.8 }
        };
        
        this.equipment = {
            helmet: {
                default: { name: '标准头盔', color: 0x333333, price: 0 },
                sport: { name: '运动头盔', color: 0xFF0000, price: 300 },
                pro: { name: '专业头盔', color: 0x0000FF, price: 800 },
                carbon: { name: '碳纤维头盔', color: 0x1a1a1a, price: 1500, metalness: 0.5 }
            },
            goggles: {
                default: { name: '标准护目镜', color: 0x444444, price: 0 },
                tinted: { name: '染色护目镜', color: 0x000088, price: 200 },
                mirrored: { name: '镜面护目镜', color: 0x88CCFF, price: 600, metalness: 0.9 },
                night: { name: '夜视护目镜', color: 0x00FF00, price: 1200, emissive: 0x00FF00 }
            },
            suit: {
                default: { name: '标准飞行服', color: 0x1E90FF, price: 0 },
                speed: { name: '速度服', color: 0xFF4500, price: 400 },
                stealth: { name: '隐身服', color: 0x2F4F4F, price: 900 },
                wing: { name: '翼装', color: 0xFFD700, price: 1800 }
            }
        };
        
        this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem('skyDivingSkins');
        if (saved) {
            const data = JSON.parse(saved);
            this.unlockedSkins = data.unlockedSkins || ['classic'];
            this.unlockedEquipment = data.unlockedEquipment || {
                helmet: ['default'],
                goggles: ['default'],
                suit: ['default']
            };
            this.currentSkin = data.currentSkin || 'classic';
            this.currentEquipment = data.currentEquipment || {
                helmet: 'default',
                goggles: 'default',
                suit: 'default'
            };
        }
    }

    saveProgress() {
        localStorage.setItem('skyDivingSkins', JSON.stringify({
            unlockedSkins: this.unlockedSkins,
            unlockedEquipment: this.unlockedEquipment,
            currentSkin: this.currentSkin,
            currentEquipment: this.currentEquipment
        }));
    }

    unlockSkin(skinId, coins) {
        const skin = this.skins[skinId];
        if (!skin || this.unlockedSkins.includes(skinId)) return false;
        if (coins < skin.price) return false;
        
        this.unlockedSkins.push(skinId);
        this.saveProgress();
        return skin.price;
    }

    unlockEquipment(type, equipId, coins) {
        const equip = this.equipment[type]?.[equipId];
        if (!equip || this.unlockedEquipment[type]?.includes(equipId)) return false;
        if (coins < equip.price) return false;
        
        this.unlockedEquipment[type].push(equipId);
        this.saveProgress();
        return equip.price;
    }

    setSkin(skinId) {
        if (this.unlockedSkins.includes(skinId)) {
            this.currentSkin = skinId;
            this.saveProgress();
            return true;
        }
        return false;
    }

    setEquipment(type, equipId) {
        if (this.unlockedEquipment[type]?.includes(equipId)) {
            this.currentEquipment[type] = equipId;
            this.saveProgress();
            return true;
        }
        return false;
    }

    getSkinColor() {
        return this.skins[this.currentSkin]?.color || 0xFF6B6B;
    }

    getSkinMaterial() {
        const skin = this.skins[this.currentSkin];
        const material = new THREE.MeshStandardMaterial({
            color: skin.color,
            roughness: 0.7,
            metalness: skin.metalness || 0.1
        });
        return material;
    }

    getEquipmentColor(type) {
        const equipId = this.currentEquipment[type];
        return this.equipment[type]?.[equipId]?.color || 0x333333;
    }

    getEquipmentMaterial(type) {
        const equipId = this.currentEquipment[type];
        const equip = this.equipment[type]?.[equipId];
        if (!equip) return new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        return new THREE.MeshStandardMaterial({
            color: equip.color,
            roughness: 0.5,
            metalness: equip.metalness || 0.1,
            emissive: equip.emissive || 0x000000,
            emissiveIntensity: equip.emissive ? 0.3 : 0
        });
    }

    isSkinUnlocked(skinId) {
        return this.unlockedSkins.includes(skinId);
    }

    isEquipmentUnlocked(type, equipId) {
        return this.unlockedEquipment[type]?.includes(equipId);
    }

    getAvailableSkins() {
        return Object.entries(this.skins).map(([id, skin]) => ({
            id,
            ...skin,
            unlocked: this.isSkinUnlocked(id),
            selected: this.currentSkin === id
        }));
    }

    getAvailableEquipment(type) {
        return Object.entries(this.equipment[type] || {}).map(([id, equip]) => ({
            id,
            ...equip,
            unlocked: this.isEquipmentUnlocked(type, id),
            selected: this.currentEquipment[type] === id
        }));
    }

    getTotalCoinsSpent() {
        let total = 0;
        this.unlockedSkins.forEach(id => {
            if (id !== 'classic') total += this.skins[id]?.price || 0;
        });
        Object.keys(this.unlockedEquipment).forEach(type => {
            this.unlockedEquipment[type].forEach(id => {
                if (id !== 'default') total += this.equipment[type]?.[id]?.price || 0;
            });
        });
        return total;
    }
}
