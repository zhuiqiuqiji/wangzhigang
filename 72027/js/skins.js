var Skins = (function () {
    var SKINS = [
        {
            id: 'default',
            name: '霓虹球',
            description: '标准平衡球，适合新手',
            color: 0x00f5d4,
            metalness: 0.7,
            roughness: 0.15,
            emissive: 0x003322,
            emissiveIntensity: 0.3,
            mass: 1.0,
            friction: 0.5,
            bounce: 0.3,
            speedMultiplier: 1.0,
            glowColor: 0x00f5d4,
            glowOpacity: 0.12,
            unlocked: true
        },
        {
            id: 'wood',
            name: '木球',
            description: '轻质球体，高摩擦力，稳定但较慢',
            color: 0x8B4513,
            metalness: 0.05,
            roughness: 0.85,
            emissive: 0x1a0a00,
            emissiveIntensity: 0.05,
            mass: 0.6,
            friction: 0.8,
            bounce: 0.2,
            speedMultiplier: 0.9,
            glowColor: 0x8B4513,
            glowOpacity: 0.05,
            unlocked: true
        },
        {
            id: 'iron',
            name: '铁球',
            description: '重型球体，惯性大，难以操控但速度快',
            color: 0x8899aa,
            metalness: 0.95,
            roughness: 0.2,
            emissive: 0x111122,
            emissiveIntensity: 0.1,
            mass: 1.5,
            friction: 0.4,
            bounce: 0.1,
            speedMultiplier: 1.15,
            glowColor: 0x8899aa,
            glowOpacity: 0.08,
            unlocked: false,
            unlockCondition: '累计获得100分'
        },
        {
            id: 'crystal',
            name: '水晶球',
            description: '晶莹剔透，低摩擦力，高弹跳',
            color: 0x88ccff,
            metalness: 0.1,
            roughness: 0.05,
            emissive: 0x2244aa,
            emissiveIntensity: 0.5,
            mass: 0.8,
            friction: 0.3,
            bounce: 0.5,
            speedMultiplier: 1.1,
            glowColor: 0x88ccff,
            glowOpacity: 0.2,
            unlocked: false,
            unlockCondition: '累计获得300分'
        },
        {
            id: 'rubber',
            name: '橡胶球',
            description: '超高摩擦力，极强弹性，容错率高',
            color: 0xff3366,
            metalness: 0.05,
            roughness: 0.95,
            emissive: 0x220011,
            emissiveIntensity: 0.05,
            mass: 1.0,
            friction: 0.9,
            bounce: 0.8,
            speedMultiplier: 0.85,
            glowColor: 0xff3366,
            glowOpacity: 0.1,
            unlocked: false,
            unlockCondition: '累计获得500分'
        },
        {
            id: 'gold',
            name: '黄金球',
            description: '传说中的黄金球，各属性均衡强化',
            color: 0xffd700,
            metalness: 1.0,
            roughness: 0.1,
            emissive: 0x664400,
            emissiveIntensity: 0.4,
            mass: 1.2,
            friction: 0.6,
            bounce: 0.4,
            speedMultiplier: 1.2,
            glowColor: 0xffd700,
            glowOpacity: 0.15,
            unlocked: false,
            unlockCondition: '所有关卡获得3星'
        }
    ];

    function getAll() {
        return SKINS.slice();
    }

    function getById(id) {
        for (var i = 0; i < SKINS.length; i++) {
            if (SKINS[i].id === id) return SKINS[i];
        }
        return SKINS[0];
    }

    function isUnlocked(id) {
        var skin = getById(id);
        if (!skin) return false;
        if (skin.unlocked) return true;
        try {
            var data = JSON.parse(localStorage.getItem('bb_skins_unlocked') || '[]');
            return data.indexOf(id) !== -1;
        } catch (e) { return false; }
    }

    function unlock(id) {
        try {
            var data = JSON.parse(localStorage.getItem('bb_skins_unlocked') || '[]');
            if (data.indexOf(id) === -1) {
                data.push(id);
                localStorage.setItem('bb_skins_unlocked', JSON.stringify(data));
            }
        } catch (e) { }
    }

    function getUnlockedList() {
        var list = [];
        for (var i = 0; i < SKINS.length; i++) {
            if (isUnlocked(SKINS[i].id)) {
                list.push(SKINS[i]);
            }
        }
        return list;
    }

    function checkUnlocks(totalScore) {
        var changed = false;
        if (totalScore >= 100 && !isUnlocked('iron')) { unlock('iron'); changed = true; }
        if (totalScore >= 300 && !isUnlocked('crystal')) { unlock('crystal'); changed = true; }
        if (totalScore >= 500 && !isUnlocked('rubber')) { unlock('rubber'); changed = true; }
        return changed;
    }

    return {
        getAll: getAll,
        getById: getById,
        isUnlocked: isUnlocked,
        unlock: unlock,
        getUnlockedList: getUnlockedList,
        checkUnlocks: checkUnlocks
    };
})();
