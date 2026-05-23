(function () {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        };
    }

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const GROUND_Y = 108;
    const PIVOT_X = W / 2;
    const PIVOT_Y = 60;
    const PIVOT_X_P1 = W / 4;
    const PIVOT_X_P2 = W * 3 / 4;

    const ORE_TYPES = {
        gold_small: {
            color: '#FFD700', borderColor: '#DAA520', shineColor: '#FFF8DC',
            minSize: 10, maxSize: 18, minValue: 50, maxValue: 150,
            weightMultiplier: 0.8, shape: 'chunk', name: '小金块'
        },
        gold_medium: {
            color: '#FFD700', borderColor: '#DAA520', shineColor: '#FFF8DC',
            minSize: 20, maxSize: 35, minValue: 200, maxValue: 500,
            weightMultiplier: 1.0, shape: 'chunk', name: '金块'
        },
        gold_big: {
            color: '#FFD700', borderColor: '#DAA520', shineColor: '#FFF8DC',
            minSize: 40, maxSize: 55, minValue: 600, maxValue: 1000,
            weightMultiplier: 1.5, shape: 'chunk', name: '大金块'
        },
        diamond: {
            color: '#00CED1', borderColor: '#008B8B', shineColor: '#E0FFFF',
            minSize: 8, maxSize: 20, minValue: 500, maxValue: 1200,
            weightMultiplier: 0.5, shape: 'diamond', name: '钻石'
        },
        ruby: {
            color: '#E0115F', borderColor: '#8B0000', shineColor: '#FFB6C1',
            minSize: 10, maxSize: 22, minValue: 300, maxValue: 800,
            weightMultiplier: 0.6, shape: 'gem', name: '红宝石'
        },
        emerald: {
            color: '#50C878', borderColor: '#006400', shineColor: '#98FB98',
            minSize: 10, maxSize: 22, minValue: 300, maxValue: 800,
            weightMultiplier: 0.6, shape: 'gem', name: '祖母绿'
        },
        sapphire: {
            color: '#0F52BA', borderColor: '#000080', shineColor: '#ADD8E6',
            minSize: 10, maxSize: 22, minValue: 300, maxValue: 800,
            weightMultiplier: 0.6, shape: 'gem', name: '蓝宝石'
        },
        fossil: {
            color: '#8B7355', borderColor: '#5C3A1E', shineColor: '#D2B48C',
            minSize: 25, maxSize: 45, minValue: 400, maxValue: 900,
            weightMultiplier: 1.2, shape: 'fossil', name: '古化石'
        },
        chest: {
            color: '#8B4513', borderColor: '#5C3A1E', shineColor: '#FFD700',
            minSize: 30, maxSize: 40, minValue: 800, maxValue: 2000,
            weightMultiplier: 1.4, shape: 'chest', name: '神秘宝箱', isChest: true
        },
        bone: {
            color: '#F5F5DC', borderColor: '#A9A9A9', shineColor: '#FFFAF0',
            minSize: 18, maxSize: 32, minValue: 150, maxValue: 350,
            weightMultiplier: 0.9, shape: 'bone', name: '远古骨头'
        },
        crystal: {
            color: '#9370DB', borderColor: '#4B0082', shineColor: '#E6E6FA',
            minSize: 12, maxSize: 28, minValue: 250, maxValue: 600,
            weightMultiplier: 0.7, shape: 'crystal', name: '紫水晶'
        },
        pearl: {
            color: '#FFFAF0', borderColor: '#DCDCDC', shineColor: '#FFFFFF',
            minSize: 8, maxSize: 16, minValue: 350, maxValue: 700,
            weightMultiplier: 0.4, shape: 'pearl', name: '珍珠'
        },
        stone: {
            color: '#808080', borderColor: '#505050', shineColor: '#A0A0A0',
            minSize: 16, maxSize: 48, minValue: 20, maxValue: 80,
            weightMultiplier: 1.3, shape: 'rock', name: '石头', isObstacle: true
        },
        tnt: {
            color: '#FF4444', borderColor: '#8B0000', shineColor: '#FF6666',
            minSize: 20, maxSize: 30, minValue: -300, maxValue: -300,
            weightMultiplier: 1.0, shape: 'tnt', name: '炸药桶', isTNT: true, timePenalty: 5
        }
    };

    const SHOP_ITEMS = {
        dynamite: {
            name: '炸药', icon: '💥', price: 200,
            desc: '钩爪收回时按1键使用，炸掉当前抓住的物品'
        },
        potion: {
            name: '时间药水', icon: '⏳', price: 300,
            desc: '按2键使用，增加10秒游戏时间'
        },
        strength: {
            name: '力量药剂', icon: '💪', price: 250,
            desc: '按3键使用，本关钩爪速度提升50%'
        },
        magnet: {
            name: '磁铁', icon: '🧲', price: 400,
            desc: '按4键使用，10秒内自动吸引附近的矿石'
        },
        lucky: {
            name: '幸运符', icon: '🍀', price: 500,
            desc: '下一关高价值矿石出现概率提升'
        }
    };

    const CHARACTER_SKINS = [
        { id: 'default', name: '经典矿工', icon: '👷', color: '#4169E1', price: 0, unlocked: true },
        { id: 'cowboy', name: '牛仔', icon: '🤠', color: '#8B4513', price: 1000, unlocked: false },
        { id: 'ninja', name: '忍者', icon: '🥷', color: '#2F2F2F', price: 1500, unlocked: false },
        { id: 'robot', name: '机器人', icon: '🤖', color: '#708090', price: 2000, unlocked: false },
        { id: 'wizard', name: '魔法师', icon: '🧙', color: '#8A2BE2', price: 2500, unlocked: false },
        { id: 'astronaut', name: '宇航员', icon: '👨‍🚀', color: '#F0F0F0', price: 3000, unlocked: false }
    ];

    const MINE_SKINS = [
        { id: 'default', name: '经典矿场', price: 0, unlocked: true,
          sky: ['#87CEEB', '#B0E0E6'], ground: ['#D2B48C', '#B8956E', '#8B7355', '#654321', '#3d2817'] },
        { id: 'ice', name: '冰原矿场', price: 1500, unlocked: false,
          sky: ['#E0FFFF', '#B0E0E6'], ground: ['#E0FFFF', '#ADD8E6', '#87CEEB', '#4682B4', '#191970'] },
        { id: 'volcano', name: '火山矿场', price: 2000, unlocked: false,
          sky: ['#FF6347', '#8B0000'], ground: ['#8B0000', '#B22222', '#4A0000', '#2F0000', '#1A0000'] },
        { id: 'forest', name: '森林矿场', price: 1500, unlocked: false,
          sky: ['#98FB98', '#228B22'], ground: ['#228B22', '#006400', '#004d00', '#003300', '#001a00'] },
        { id: 'desert', name: '沙漠矿场', price: 1800, unlocked: false,
          sky: ['#FFD700', '#FFA500'], ground: ['#F4A460', '#DEB887', '#D2691E', '#8B4513', '#5C3A1E'] },
        { id: 'space', name: '太空矿场', price: 3000, unlocked: false,
          sky: ['#0a0a2e', '#1a0a3e'], ground: ['#4B0082', '#2E0854', '#1a0033', '#0d001a', '#05000a'] }
    ];

    const LEVEL_MAPS = [
        {
            name: '新手矿洞', time: 60, target: 1000,
            oreWeights: { gold_small: 30, gold_medium: 20, gold_big: 5, diamond: 5, stone: 25, tnt: 5, bone: 10 },
            oreCount: 10, special: 'none'
        },
        {
            name: '宝石矿脉', time: 55, target: 1500,
            oreWeights: { gold_small: 15, gold_medium: 20, gold_big: 8, diamond: 12, ruby: 10, emerald: 10, stone: 15, tnt: 10 },
            oreCount: 12, special: 'none'
        },
        {
            name: '化石遗迹', time: 65, target: 2200,
            oreWeights: { gold_medium: 15, gold_big: 10, diamond: 8, fossil: 20, bone: 15, stone: 20, tnt: 12 },
            oreCount: 12, special: 'none'
        },
        {
            name: '宝藏洞穴', time: 60, target: 3000,
            oreWeights: { gold_big: 15, diamond: 15, ruby: 10, emerald: 10, sapphire: 10, chest: 8, stone: 15, tnt: 17 },
            oreCount: 14, special: 'doubleCoins'
        },
        {
            name: '水晶洞窟', time: 55, target: 4000,
            oreWeights: { diamond: 15, ruby: 12, emerald: 12, sapphire: 12, crystal: 15, pearl: 10, chest: 5, stone: 10, tnt: 9 },
            oreCount: 14, special: 'earthquake'
        },
        {
            name: '危险地带', time: 50, target: 5000,
            oreWeights: { gold_big: 20, diamond: 15, chest: 10, crystal: 10, stone: 15, tnt: 30 },
            oreCount: 16, special: 'none'
        },
        {
            name: '远古遗迹', time: 65, target: 6500,
            oreWeights: { fossil: 20, bone: 15, gold_big: 15, diamond: 10, chest: 15, ruby: 10, tnt: 15 },
            oreCount: 14, special: 'earthquake'
        },
        {
            name: '终极挑战', time: 45, target: 8000,
            oreWeights: { diamond: 15, ruby: 15, emerald: 15, sapphire: 15, chest: 15, tnt: 25 },
            oreCount: 16, special: 'doubleCoins'
        }
    ];

    const RANDOM_EVENTS = [
        { id: 'earthquake', name: '🌋 地震！', duration: 3000, effect: 'shuffleOres' },
        { id: 'doubleCoins', name: '💰 双倍金币！', duration: 10000, effect: 'doubleMoney' },
        { id: 'slowTime', name: '🐢 时间减缓！', duration: 8000, effect: 'slowTime' },
        { id: 'fastHook', name: '⚡ 钩爪加速！', duration: 8000, effect: 'fastHook' },
        { id: 'treasureRush', name: '✨ 宝藏涌现！', duration: 0, effect: 'spawnTreasure' }
    ];

    const game = {
        mode: 'single',
        level: 1,
        money: 0,
        totalCoins: parseInt(localStorage.getItem('goldMinerTotalCoins') || '0'),
        targetMoney: 0,
        timeLeft: 60,
        ores: [],
        hook: null,
        hook2: null,
        isPlaying: false,
        isLevelComplete: false,
        lastTime: 0,
        timerInterval: null,
        floatingTexts: [],
        particles: [],
        inventory: JSON.parse(localStorage.getItem('goldMinerInventory') || '{}'),
        activeEffects: {},
        currentEvent: null,
        eventTimeLeft: 0,
        selectedCharacter: localStorage.getItem('goldMinerCharacter') || 'default',
        selectedMine: localStorage.getItem('goldMinerMine') || 'default',
        unlockedSkins: JSON.parse(localStorage.getItem('goldMinerUnlockedSkins') || '{}'),
        player1Money: 0,
        player2Money: 0,
        strengthActive: false,
        magnetActive: false,
        magnetTimeLeft: 0,
        shakeOffset: { x: 0, y: 0 },
        shakeTime: 0
    };

    function saveGameData() {
        localStorage.setItem('goldMinerTotalCoins', game.totalCoins.toString());
        localStorage.setItem('goldMinerInventory', JSON.stringify(game.inventory));
        localStorage.setItem('goldMinerCharacter', game.selectedCharacter);
        localStorage.setItem('goldMinerMine', game.selectedMine);
        localStorage.setItem('goldMinerUnlockedSkins', JSON.stringify(game.unlockedSkins));
    }

    function getCharacterSkin() {
        return CHARACTER_SKINS.find(s => s.id === game.selectedCharacter) || CHARACTER_SKINS[0];
    }

    function getMineSkin() {
        return MINE_SKINS.find(s => s.id === game.selectedMine) || MINE_SKINS[0];
    }

    function initHook(pivotX, playerIndex = 0) {
        return {
            angle: 0,
            swingDir: 1,
            length: 30,
            baseLength: 30,
            state: 'swinging',
            caughtOre: null,
            speed: 0.025,
            pivotX: pivotX,
            playerIndex: playerIndex,
            speedMultiplier: 1
        };
    }

    function pickOreType(level, useWeights = null) {
        const levelConfig = LEVEL_MAPS[Math.min(level - 1, LEVEL_MAPS.length - 1)];
        const weights = useWeights || levelConfig.oreWeights;
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        
        for (const [type, weight] of Object.entries(weights)) {
            r -= weight;
            if (r <= 0) return type;
        }
        return 'gold_small';
    }

    function generateOres(level) {
        const ores = [];
        const levelConfig = LEVEL_MAPS[Math.min(level - 1, LEVEL_MAPS.length - 1)];
        const count = levelConfig.oreCount;
        const minY = GROUND_Y + 30;
        const maxY = H - 40;
        const marginX = 50;
        const minSpacing = 55;

        let weights = { ...levelConfig.oreWeights };
        if (game.inventory.lucky > 0) {
            weights.diamond = (weights.diamond || 0) * 1.5;
            weights.chest = (weights.chest || 0) * 1.5;
            weights.ruby = (weights.ruby || 0) * 1.5;
            weights.emerald = (weights.emerald || 0) * 1.5;
            weights.sapphire = (weights.sapphire || 0) * 1.5;
        }

        for (let i = 0; i < count; i++) {
            const type = pickOreType(level, weights);
            const config = ORE_TYPES[type];
            const size = randBetween(config.minSize, config.maxSize);
            const value = Math.round(config.minValue + (size - config.minSize) / (config.maxSize - config.minSize) * (config.maxValue - config.minValue));
            const weight = config.weightMultiplier * (size / config.maxSize) * 10;

            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 200) {
                const x = randBetween(marginX + size, W - marginX - size);
                const y = randBetween(minY + size, maxY - size);
                let overlaps = false;
                for (const o of ores) {
                    const dx = x - o.x;
                    const dy = y - o.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < size + o.size + minSpacing * 0.4) {
                        overlaps = true;
                        break;
                    }
                }
                if (!overlaps) {
                    ores.push({ 
                        type, x, y, size, value, weight, 
                        caught: false, 
                        rotation: Math.random() * Math.PI * 2,
                        originalX: x,
                        originalY: y
                    });
                    placed = true;
                }
                attempts++;
            }
        }
        return ores;
    }

    function randBetween(a, b) {
        return a + Math.random() * (b - a);
    }

    function initLevel(level) {
        const levelConfig = LEVEL_MAPS[Math.min(level - 1, LEVEL_MAPS.length - 1)];
        game.level = level;
        game.targetMoney = levelConfig.target;
        game.timeLeft = levelConfig.time;
        game.ores = generateOres(level);
        game.isLevelComplete = false;
        game.floatingTexts = [];
        game.particles = [];
        game.activeEffects = {};
        game.currentEvent = null;
        game.strengthActive = false;
        game.magnetActive = false;
        game.magnetTimeLeft = 0;
        game.shakeTime = 0;

        if (game.mode === 'single') {
            game.hook = initHook(PIVOT_X, 0);
            game.hook2 = null;
            game.money = 0;
        } else {
            game.hook = initHook(PIVOT_X_P1, 0);
            game.hook2 = initHook(PIVOT_X_P2, 1);
            game.player1Money = 0;
            game.player2Money = 0;
        }

        if (game.inventory.lucky > 0) {
            game.inventory.lucky--;
            saveGameData();
        }
    }

    function startGame() {
        game.level = 1;
        game.money = 0;
        if (game.mode === 'single') {
            initLevel(1);
        } else {
            initLevel(1);
        }
        game.isPlaying = true;
        startTimer();
        hideAllOverlays();
        updateItemBar();
        document.getElementById('itemBar').classList.remove('hidden');
        if (game.mode === 'versus') {
            document.getElementById('p2ItemBar').classList.remove('hidden');
        }
    }

    function startTimer() {
        if (game.timerInterval) clearInterval(game.timerInterval);
        game.timerInterval = setInterval(function () {
            if (!game.isPlaying) return;
            
            let timeDec = 1;
            if (game.activeEffects.slowTime) {
                timeDec = 0.5;
            }
            game.timeLeft -= timeDec;
            
            if (game.timeLeft <= 0) {
                game.timeLeft = 0;
                endLevel(false);
            }
            
            if (Math.random() < 0.02 && !game.currentEvent && game.mode === 'single') {
                triggerRandomEvent();
            }
        }, 1000);
    }

    function triggerRandomEvent() {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        game.currentEvent = event;
        game.eventTimeLeft = event.duration;
        
        showEventNotification(event.name);
        
        if (event.effect === 'shuffleOres') {
            game.shakeTime = event.duration;
            setTimeout(() => shuffleOres(), event.duration);
        } else if (event.effect === 'doubleMoney') {
            game.activeEffects.doubleMoney = true;
        } else if (event.effect === 'slowTime') {
            game.activeEffects.slowTime = true;
        } else if (event.effect === 'fastHook') {
            game.activeEffects.fastHook = true;
        } else if (event.effect === 'spawnTreasure') {
            spawnTreasure();
        }

        if (event.duration > 0) {
            setTimeout(() => {
                game.currentEvent = null;
                game.activeEffects[event.effect] = false;
                game.shakeTime = 0;
            }, event.duration);
        }
    }

    function shuffleOres() {
        const minSpacing = 55;
        const placedOres = [];
        
        for (const ore of game.ores) {
            if (!ore.caught) {
                let placed = false;
                let attempts = 0;
                while (!placed && attempts < 200) {
                    const x = randBetween(50 + ore.size, W - 50 - ore.size);
                    const y = randBetween(GROUND_Y + 30 + ore.size, H - 40 - ore.size);
                    let overlaps = false;
                    for (const o of placedOres) {
                        const dx = x - o.x;
                        const dy = y - o.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < ore.size + o.size + minSpacing * 0.4) {
                            overlaps = true;
                            break;
                        }
                    }
                    if (!overlaps) {
                        ore.x = x;
                        ore.y = y;
                        placedOres.push(ore);
                        placed = true;
                    }
                    attempts++;
                }
            }
        }
        addFloatingText('矿石位置改变了！', W / 2, H / 2, '#FF6B6B', true);
    }

    function spawnTreasure() {
        const config = ORE_TYPES.chest;
        const size = randBetween(config.minSize, config.maxSize);
        const value = Math.round(config.minValue + (size - config.minSize) / (config.maxSize - config.minSize) * (config.maxValue - config.minValue));
        const weight = config.weightMultiplier * (size / config.maxSize) * 10;

        const chest = {
            type: 'chest',
            x: randBetween(100, W - 100),
            y: randBetween(GROUND_Y + 50, H - 80),
            size: size,
            value: value,
            weight: weight,
            caught: false,
            rotation: 0,
            originalX: 0,
            originalY: 0
        };
        game.ores.push(chest);
        addFloatingText('神秘宝箱出现了！', W / 2, H / 2, '#FFD700', true);
    }

    function showEventNotification(text) {
        const el = document.getElementById('eventNotification');
        el.textContent = text;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3000);
    }

    function endLevel(success) {
        game.isPlaying = false;
        if (game.timerInterval) {
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }

        document.getElementById('itemBar').classList.add('hidden');
        document.getElementById('p2ItemBar').classList.add('hidden');

        if (game.mode === 'versus') {
            showVersusResult();
            return;
        }

        if (success) {
            game.totalCoins += game.money;
            saveGameData();
            document.getElementById('levelCompleteInfo').textContent =
                '第 ' + game.level + ' 关完成！获得：$' + game.money + ' | 目标：$' + game.targetMoney;
            document.getElementById('levelCompleteScreen').classList.remove('hidden');
        } else {
            game.totalCoins += Math.floor(game.money * 0.5);
            saveGameData();
            document.getElementById('gameOverTitle').textContent = '⏰ 时间到！';
            document.getElementById('gameOverInfo').textContent =
                '获得：$' + game.money + ' | 目标：$' + game.targetMoney + ' | 到达第 ' + game.level + ' 关';
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }
    }

    function showVersusResult() {
        const p1 = game.player1Money;
        const p2 = game.player2Money;
        document.getElementById('p1Score').textContent = '$' + p1;
        document.getElementById('p2Score').textContent = '$' + p2;
        
        let winner = '';
        if (p1 > p2) {
            winner = '🎉 玩家1 获胜！';
            document.getElementById('versusTitle').textContent = '🏆 玩家1 获胜！';
        } else if (p2 > p1) {
            winner = '🎉 玩家2 获胜！';
            document.getElementById('versusTitle').textContent = '🏆 玩家2 获胜！';
        } else {
            winner = '🤝 平局！';
            document.getElementById('versusTitle').textContent = '🤝 平局！';
        }
        document.getElementById('versusWinner').textContent = winner;
        document.getElementById('versusResultScreen').classList.remove('hidden');
    }

    function nextLevel() {
        initLevel(game.level + 1);
        game.isPlaying = true;
        startTimer();
        hideAllOverlays();
        updateItemBar();
        document.getElementById('itemBar').classList.remove('hidden');
    }

    function hideAllOverlays() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('shopScreen').classList.add('hidden');
        document.getElementById('skinScreen').classList.add('hidden');
        document.getElementById('versusResultScreen').classList.add('hidden');
    }

    function launchHook(hook) {
        if (hook && hook.state === 'swinging') {
            hook.state = 'extending';
        }
    }

    function getHookTip(hook) {
        const angle = hook.angle;
        const x = hook.pivotX + Math.sin(angle) * hook.length;
        const y = PIVOT_Y + Math.cos(angle) * hook.length;
        return { x, y };
    }

    function updateHook(hook, dt) {
        if (!hook) return;

        const baseTimeScale = Math.min(dt / 16.67, 3);
        let timeScale = baseTimeScale;
        let speedMult = hook.speedMultiplier;
        
        if (game.strengthActive) speedMult *= 1.5;
        if (game.activeEffects.fastHook) speedMult *= 1.5;

        if (hook.state === 'swinging') {
            hook.angle += hook.swingDir * hook.speed * timeScale * speedMult;
            if (hook.angle > Math.PI * 0.42) {
                hook.angle = Math.PI * 0.42;
                hook.swingDir = -1;
            } else if (hook.angle < -Math.PI * 0.42) {
                hook.angle = -Math.PI * 0.42;
                hook.swingDir = 1;
            }
        } else if (hook.state === 'extending') {
            hook.length += 6 * timeScale * speedMult;
            const tip = getHookTip(hook);

            if (tip.x < 0 || tip.x > W || tip.y > H) {
                hook.state = 'retracting';
                return;
            }

            for (const ore of game.ores) {
                if (ore.caught) continue;
                const dx = tip.x - ore.x;
                const dy = tip.y - ore.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < ore.size + 6) {
                    ore.caught = true;
                    hook.caughtOre = ore;
                    hook.state = 'retracting';
                    break;
                }
            }
        } else if (hook.state === 'retracting') {
            let speed = 5;
            if (hook.caughtOre) {
                const w = hook.caughtOre.weight;
                speed = 5 / (1 + w * 0.08);
            }
            speed *= speedMult;
            hook.length -= speed * timeScale;

            if (hook.caughtOre) {
                const tip = getHookTip(hook);
                hook.caughtOre.x = tip.x;
                hook.caughtOre.y = tip.y;
            }

            if (hook.length <= hook.baseLength) {
                hook.length = hook.baseLength;
                if (hook.caughtOre) {
                    const ore = hook.caughtOre;
                    let value = ore.value;
                    
                    if (ORE_TYPES[ore.type].isTNT) {
                        const penalty = ORE_TYPES[ore.type].timePenalty;
                        game.timeLeft = Math.max(0, game.timeLeft - penalty);
                        createExplosion(ore.x, ore.y);
                        addFloatingText('-$' + Math.abs(value) + ' -' + penalty + 's', hook.pivotX, PIVOT_Y - 10, '#FF4444');
                    } else if (ORE_TYPES[ore.type].isChest) {
                        value = Math.floor(value * (0.8 + Math.random() * 0.6));
                        if (game.activeEffects.doubleMoney) value *= 2;
                        addFloatingText('+$' + value + ' 🎁', hook.pivotX, PIVOT_Y - 10, '#FFD700');
                        createSparkles(hook.pivotX, PIVOT_Y + 20, '#FFD700');
                    } else {
                        if (game.activeEffects.doubleMoney) value *= 2;
                        addFloatingText('+$' + value, hook.pivotX, PIVOT_Y - 10, ORE_TYPES[ore.type].color);
                        createSparkles(hook.pivotX, PIVOT_Y + 20, ORE_TYPES[ore.type].color);
                    }

                    if (hook.playerIndex === 0) {
                        if (game.mode === 'single') {
                            game.money += value;
                        } else {
                            game.player1Money += value;
                        }
                    } else {
                        game.player2Money += value;
                    }

                    hook.caughtOre = null;

                    if (game.mode === 'single' && game.money >= game.targetMoney && !game.isLevelComplete) {
                        game.isLevelComplete = true;
                        if (game.timerInterval) {
                            clearInterval(game.timerInterval);
                            game.timerInterval = null;
                        }
                        setTimeout(function () {
                            if (game.isPlaying) endLevel(true);
                        }, 300);
                    }
                }
                hook.state = 'swinging';
            }
        }
    }

    function addFloatingText(text, x, y, color, big = false) {
        game.floatingTexts.push({
            text: text, x: x, y: y, color: color,
            life: big ? 90 : 60, vy: big ? -1 : -1.5, big: big
        });
    }

    function createSparkles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            game.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                color: color, life: 30 + Math.random() * 20, maxLife: 50,
                size: 2 + Math.random() * 3
            });
        }
    }

    function createExplosion(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            game.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                color: ['#FF4444', '#FF6600', '#FFFF00'][Math.floor(Math.random() * 3)],
                life: 40 + Math.random() * 20, maxLife: 60,
                size: 3 + Math.random() * 5
            });
        }
    }

    function updateEffects(dt) {
        const timeScale = Math.min(dt / 16.67, 3);

        for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
            const ft = game.floatingTexts[i];
            ft.y += ft.vy * timeScale;
            ft.life -= timeScale;
            if (ft.life <= 0) game.floatingTexts.splice(i, 1);
        }

        for (let i = game.particles.length - 1; i >= 0; i--) {
            const p = game.particles[i];
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.vy += 0.1 * timeScale;
            p.life -= timeScale;
            if (p.life <= 0) game.particles.splice(i, 1);
        }

        if (game.magnetActive) {
            game.magnetTimeLeft -= dt;
            if (game.magnetTimeLeft <= 0) {
                game.magnetActive = false;
            } else {
                const hooks = [game.hook, game.hook2].filter(h => h && h.state === 'extending');
                for (const hook of hooks) {
                    const tip = getHookTip(hook);
                    for (const ore of game.ores) {
                        if (ore.caught) continue;
                        const dx = tip.x - ore.x;
                        const dy = tip.y - ore.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 100) {
                            const attractSpeed = 0.5 * timeScale;
                            ore.x += (dx / dist) * attractSpeed;
                            ore.y += (dy / dist) * attractSpeed;
                        }
                    }
                }
            }
        }

        if (game.shakeTime > 0) {
            game.shakeTime -= dt;
            game.shakeOffset.x = (Math.random() - 0.5) * 8;
            game.shakeOffset.y = (Math.random() - 0.5) * 8;
        } else {
            game.shakeOffset.x = 0;
            game.shakeOffset.y = 0;
        }
    }

    function useItem(itemName, playerIndex = 0) {
        if (!game.isPlaying) return;
        if (!game.inventory[itemName] || game.inventory[itemName] <= 0) return;

        const hook = playerIndex === 0 ? game.hook : game.hook2;

        if (itemName === 'dynamite') {
            if (hook && hook.state === 'retracting' && hook.caughtOre) {
                const ore = hook.caughtOre;
                createExplosion(ore.x, ore.y);
                game.ores = game.ores.filter(o => o !== ore);
                hook.caughtOre = null;
                hook.state = 'retracting';
                game.inventory.dynamite--;
            }
        } else if (itemName === 'potion') {
            game.timeLeft += 10;
            addFloatingText('+10秒 ⏳', W / 2, H / 2, '#90EE90', true);
            game.inventory.potion--;
        } else if (itemName === 'strength') {
            game.strengthActive = true;
            addFloatingText('力量提升！💪', W / 2, H / 2, '#FFD700', true);
            game.inventory.strength--;
        } else if (itemName === 'magnet') {
            game.magnetActive = true;
            game.magnetTimeLeft = 10000;
            addFloatingText('磁铁激活！🧲', W / 2, H / 2, '#9370DB', true);
            game.inventory.magnet--;
        }

        saveGameData();
        updateItemBar();
    }

    function updateItemBar() {
        document.getElementById('dynamiteCount').textContent = game.inventory.dynamite || 0;
        document.getElementById('potionCount').textContent = game.inventory.potion || 0;
        document.getElementById('strengthCount').textContent = game.inventory.strength || 0;
        document.getElementById('magnetCount').textContent = game.inventory.magnet || 0;
        
        document.getElementById('p2DynamiteCount').textContent = game.inventory.dynamite || 0;
        document.getElementById('p2PotionCount').textContent = game.inventory.potion || 0;
        document.getElementById('p2StrengthCount').textContent = game.inventory.strength || 0;

        document.querySelectorAll('.item-slot').forEach(slot => {
            const item = slot.dataset.item;
            const count = game.inventory[item] || 0;
            if (count <= 0) {
                slot.classList.add('disabled');
            } else {
                slot.classList.remove('disabled');
            }
        });
    }

    function drawBackground() {
        const mineSkin = getMineSkin();
        const sky = mineSkin.sky;
        const ground = mineSkin.ground;
        
        ctx.save();
        ctx.translate(game.shakeOffset.x, game.shakeOffset.y);

        const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        skyGrad.addColorStop(0, sky[0]);
        skyGrad.addColorStop(1, sky[1]);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, GROUND_Y);

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(780, 35, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.arc(780, 35, 14, 0, Math.PI * 2);
        ctx.fill();

        const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
        groundGrad.addColorStop(0, ground[0]);
        groundGrad.addColorStop(0.08, ground[1]);
        groundGrad.addColorStop(0.3, ground[2]);
        groundGrad.addColorStop(0.65, ground[3]);
        groundGrad.addColorStop(1, ground[4]);
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

        ctx.fillStyle = ground[3];
        for (let i = 0; i < 30; i++) {
            const x = (i * 37) % W;
            const y = GROUND_Y + 15 + (i * 23) % (H - GROUND_Y - 30);
            ctx.beginPath();
            ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function drawMiner(pivotX, color, isPlayer2 = false) {
        const mx = pivotX;
        const my = 40;
        const charSkin = getCharacterSkin();
        const bodyColor = isPlayer2 ? '#FF6347' : charSkin.color;

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(mx - 18, my + 5, 36, 35, 4);
        ctx.fill();
        ctx.strokeStyle = '#2E4A9E';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(mx, my - 2, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D4A574';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(mx, my - 10, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx, my - 12, 12, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(mx, my - 10, 18, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mx, my - 12, 12, Math.PI, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(mx - 5, my - 3, 3, 0, Math.PI * 2);
        ctx.arc(mx + 5, my - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(mx - 5, my - 3, 1.5, 0, Math.PI * 2);
        ctx.arc(mx + 5, my - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mx, my + 3, 4, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        if (isPlayer2) {
            ctx.fillStyle = '#FF6347';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('P2', mx, my - 30);
        } else if (game.mode === 'versus') {
            ctx.fillStyle = '#4169E1';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('P1', mx, my - 30);
        }

        ctx.fillStyle = '#A0522D';
        ctx.fillRect(mx + 14, my + 8, 22, 8);
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(mx + 36, my + 4);
        ctx.lineTo(mx + 44, my + 12);
        ctx.lineTo(mx + 44, my + 16);
        ctx.lineTo(mx + 36, my + 20);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawHook(hook) {
        if (!hook) return;

        const tip = getHookTip(hook);

        ctx.strokeStyle = '#3d2817';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hook.pivotX, PIVOT_Y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(tip.x, tip.y);
        ctx.rotate(hook.angle);

        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, 8, Math.PI * 0.3, Math.PI * 1.7);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8 * Math.cos(Math.PI * 0.3), 8 * Math.sin(Math.PI * 0.3));
        ctx.lineTo(8 * Math.cos(Math.PI * 0.3) + 6, 8 * Math.sin(Math.PI * 0.3) + 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8 * Math.cos(Math.PI * 1.7), 8 * Math.sin(Math.PI * 1.7));
        ctx.lineTo(8 * Math.cos(Math.PI * 1.7) - 6, 8 * Math.sin(Math.PI * 1.7) + 3);
        ctx.stroke();

        ctx.fillStyle = '#A0A0A0';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawOre(ore) {
        if (ore.caught) return;
        const config = ORE_TYPES[ore.type];
        ctx.save();
        ctx.translate(ore.x, ore.y);
        ctx.rotate(ore.rotation);

        const shape = config.shape;
        if (shape === 'chunk') drawGoldChunk(ore, config);
        else if (shape === 'diamond') drawDiamond(ore, config);
        else if (shape === 'gem') drawGem(ore, config);
        else if (shape === 'rock') drawRock(ore, config);
        else if (shape === 'fossil') drawFossil(ore, config);
        else if (shape === 'chest') drawChest(ore, config);
        else if (shape === 'bone') drawBone(ore, config);
        else if (shape === 'crystal') drawCrystal(ore, config);
        else if (shape === 'pearl') drawPearl(ore, config);
        else if (shape === 'tnt') drawTNT(ore, config);

        ctx.restore();
    }

    function drawGoldChunk(ore, config) {
        const s = ore.size;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, -s * 0.3);
        ctx.lineTo(-s * 0.5, -s * 0.8);
        ctx.lineTo(s * 0.1, -s * 0.9);
        ctx.lineTo(s * 0.7, -s * 0.5);
        ctx.lineTo(s * 0.9, s * 0.1);
        ctx.lineTo(s * 0.6, s * 0.8);
        ctx.lineTo(-s * 0.2, s * 0.9);
        ctx.lineTo(-s * 0.8, s * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = config.shineColor;
        ctx.beginPath();
        ctx.ellipse(-s * 0.2, -s * 0.3, s * 0.3, s * 0.15, -0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawDiamond(ore, config) {
        const s = ore.size;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.7, -s * 0.2);
        ctx.lineTo(s * 0.5, s * 0.8);
        ctx.lineTo(-s * 0.5, s * 0.8);
        ctx.lineTo(-s * 0.7, -s * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = config.shineColor;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.9);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(0, -s * 0.1);
        ctx.lineTo(-s * 0.3, -s * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.2);
        ctx.lineTo(s * 0.7, -s * 0.2);
        ctx.moveTo(0, -s * 0.2);
        ctx.lineTo(0, s * 0.8);
        ctx.stroke();
    }

    function drawGem(ore, config) {
        const s = ore.size;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? s : s * 0.6;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = config.shineColor;
        ctx.beginPath();
        ctx.arc(-s * 0.2, -s * 0.3, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawRock(ore, config) {
        const s = ore.size;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.moveTo(-s, -s * 0.3);
        ctx.lineTo(-s * 0.6, -s * 0.9);
        ctx.lineTo(s * 0.2, -s * 0.85);
        ctx.lineTo(s * 0.9, -s * 0.4);
        ctx.lineTo(s * 0.7, s * 0.6);
        ctx.lineTo(s * 0.1, s);
        ctx.lineTo(-s * 0.5, s * 0.7);
        ctx.lineTo(-s * 0.9, s * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = config.shineColor;
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, -s * 0.4, s * 0.25, s * 0.12, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, 0);
        ctx.lineTo(s * 0.2, s * 0.3);
        ctx.moveTo(s * 0.1, -s * 0.3);
        ctx.lineTo(-s * 0.2, s * 0.2);
        ctx.stroke();
    }

    function drawFossil(ore, config) {
        const s = ore.size;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, 0);
        ctx.lineTo(s * 0.6, 0);
        ctx.moveTo(0, -s * 0.4);
        ctx.lineTo(0, s * 0.4);
        for (let i = -3; i <= 3; i++) {
            ctx.moveTo(i * s * 0.15, -s * 0.2);
            ctx.lineTo(i * s * 0.15, s * 0.2);
        }
        ctx.stroke();

        ctx.fillStyle = config.shineColor;
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, -s * 0.25, s * 0.15, s * 0.08, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawChest(ore, config) {
        const s = ore.size;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.roundRect(-s, -s * 0.6, s * 2, s * 1.2, 4);
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = config.borderColor;
        ctx.fillRect(-s, -s * 0.1, s * 2, s * 0.2);

        ctx.fillStyle = config.shineColor;
        ctx.fillRect(-s * 0.15, -s * 0.2, s * 0.3, s * 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        ctx.fillStyle = config.shineColor;
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.4, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBone(ore, config) {
        const s = ore.size;
        ctx.fillStyle = config.color;
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(-s * 0.7, 0, s * 0.3, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(s * 0.7, 0, s * 0.3, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(-s * 0.6, -s * 0.12, s * 1.2, s * 0.24, s * 0.1);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = config.shineColor;
        ctx.beginPath();
        ctx.ellipse(-s * 0.5, -s * 0.15, s * 0.1, s * 0.06, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawCrystal(ore, config) {
        const s = ore.size;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.5, 0);
        ctx.lineTo(s * 0.3, s * 0.8);
        ctx.lineTo(-s * 0.3, s * 0.8);
        ctx.lineTo(-s * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = config.shineColor;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.8);
        ctx.lineTo(s * 0.25, 0);
        ctx.lineTo(0, s * 0.5);
        ctx.lineTo(-s * 0.25, 0);
        ctx.closePath();
        ctx.fill();
    }

    function drawPearl(ore, config) {
        const s = ore.size;
        const grad = ctx.createRadialGradient(-s * 0.3, -s * 0.3, 0, 0, 0, s);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.5, config.color);
        grad.addColorStop(1, config.borderColor);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, -s * 0.3, s * 0.25, s * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawTNT(ore, config) {
        const s = ore.size;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.roundRect(-s * 0.7, -s * 0.9, s * 1.4, s * 1.8, 3);
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = 'bold ' + Math.floor(s * 0.8) + 'px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFF';
        ctx.fillText('TNT', 0, 0);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.9);
        ctx.quadraticCurveTo(s * 0.3, -s * 1.3, s * 0.5, -s * 1.1);
        ctx.stroke();

        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.arc(s * 0.5, -s * 1.1, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(s * 0.5, -s * 1.1, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawCaughtOre(hook) {
        if (!hook || !hook.caughtOre) return;
        const ore = hook.caughtOre;
        const config = ORE_TYPES[ore.type];
        ctx.save();
        ctx.translate(ore.x, ore.y);
        ctx.rotate(ore.rotation);

        const shape = config.shape;
        if (shape === 'chunk') drawGoldChunk(ore, config);
        else if (shape === 'diamond') drawDiamond(ore, config);
        else if (shape === 'gem') drawGem(ore, config);
        else if (shape === 'rock') drawRock(ore, config);
        else if (shape === 'fossil') drawFossil(ore, config);
        else if (shape === 'chest') drawChest(ore, config);
        else if (shape === 'bone') drawBone(ore, config);
        else if (shape === 'crystal') drawCrystal(ore, config);
        else if (shape === 'pearl') drawPearl(ore, config);
        else if (shape === 'tnt') drawTNT(ore, config);

        ctx.restore();
    }

    function drawHUD() {
        const barH = 40;
        const barGrad = ctx.createLinearGradient(0, 0, 0, barH);
        barGrad.addColorStop(0, 'rgba(45, 25, 10, 0.92)');
        barGrad.addColorStop(1, 'rgba(30, 18, 8, 0.92)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(0, 0, W, barH);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, barH);
        ctx.lineTo(W, barH);
        ctx.stroke();

        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textBaseline = 'middle';

        if (game.mode === 'single') {
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'left';
            ctx.fillText('💰 $' + game.money, 20, barH / 2);

            ctx.fillStyle = '#D2B48C';
            ctx.textAlign = 'center';
            ctx.fillText('目标: $' + game.targetMoney, W / 2, barH / 2);

            ctx.fillStyle = game.timeLeft <= 10 ? '#FF6B6B' : '#FFFFFF';
            ctx.textAlign = 'right';
            var timeStr = '⏱ ' + Math.ceil(game.timeLeft) + 's';
            if (game.timeLeft <= 10 && Math.floor(game.timeLeft * 2) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
            ctx.fillText(timeStr, W - 120, barH / 2);
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#90EE90';
            ctx.textAlign = 'right';
            ctx.fillText('关卡: ' + game.level, W - 20, barH / 2);

            if (game.currentEvent) {
                ctx.fillStyle = '#FF6B6B';
                ctx.textAlign = 'center';
                ctx.fillText(game.currentEvent.name, W / 2, barH + 25);
            }
        } else {
            ctx.fillStyle = '#4169E1';
            ctx.textAlign = 'left';
            ctx.fillText('P1: $' + game.player1Money, 20, barH / 2);

            ctx.fillStyle = game.timeLeft <= 10 ? '#FF6B6B' : '#FFFFFF';
            ctx.textAlign = 'center';
            var timeStr = '⏱ ' + Math.ceil(game.timeLeft) + 's';
            if (game.timeLeft <= 10 && Math.floor(game.timeLeft * 2) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
            ctx.fillText(timeStr, W / 2, barH / 2);
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#FF6347';
            ctx.textAlign = 'right';
            ctx.fillText('P2: $' + game.player2Money, W - 20, barH / 2);
        }
    }

    function drawEffects() {
        for (const ft of game.floatingTexts) {
            const alpha = Math.min(1, ft.life / (ft.big ? 45 : 30));
            ctx.globalAlpha = alpha;
            ctx.font = (ft.big ? 'bold 28px ' : 'bold 22px ') + '"Courier New", monospace';
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.globalAlpha = 1;
        }

        for (const p of game.particles) {
            const alpha = Math.min(1, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function render() {
        ctx.clearRect(0, 0, W, H);
        drawBackground();

        for (const ore of game.ores) {
            if (!ore.caught) drawOre(ore);
        }

        drawCaughtOre(game.hook);
        drawCaughtOre(game.hook2);

        if (game.mode === 'single') {
            drawMiner(PIVOT_X, getCharacterSkin().color);
            drawHook(game.hook);
        } else {
            drawMiner(PIVOT_X_P1, '#4169E1', false);
            drawMiner(PIVOT_X_P2, '#FF6347', true);
            drawHook(game.hook);
            drawHook(game.hook2);
        }

        drawHUD();
        drawEffects();
    }

    function gameLoop(timestamp) {
        if (!game.lastTime) game.lastTime = timestamp;
        const dt = timestamp - game.lastTime;
        game.lastTime = timestamp;

        if (game.isPlaying) {
            updateHook(game.hook, dt);
            updateHook(game.hook2, dt);
            updateEffects(dt);
        }

        render();
        requestAnimationFrame(gameLoop);
    }

    function initShopUI() {
        const shopItemsEl = document.getElementById('shopItems');
        shopItemsEl.innerHTML = '';
        
        for (const [key, item] of Object.entries(SHOP_ITEMS)) {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <div class="shop-item-header">
                    <span class="shop-item-icon">${item.icon}</span>
                    <span class="shop-item-name">${item.name}</span>
                    <span class="shop-item-price">$${item.price}</span>
                </div>
                <p class="shop-item-desc">${item.desc}</p>
                <button class="buy-btn" data-item="${key}">购买</button>
            `;
            shopItemsEl.appendChild(div);
        }

        shopItemsEl.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const itemKey = this.dataset.item;
                buyItem(itemKey);
            });
        });

        updateShopUI();
    }

    function buyItem(itemKey) {
        const item = SHOP_ITEMS[itemKey];
        if (game.totalCoins >= item.price) {
            game.totalCoins -= item.price;
            game.inventory[itemKey] = (game.inventory[itemKey] || 0) + 1;
            saveGameData();
            updateShopUI();
            updateItemBar();
        }
    }

    function updateShopUI() {
        document.getElementById('shopCoins').textContent = game.totalCoins;
        document.getElementById('totalCoins').textContent = game.totalCoins;

        document.querySelectorAll('.buy-btn').forEach(btn => {
            const itemKey = btn.dataset.item;
            const item = SHOP_ITEMS[itemKey];
            btn.disabled = game.totalCoins < item.price;
        });

        const inventoryEl = document.getElementById('inventoryDisplay');
        inventoryEl.innerHTML = '';
        for (const [key, count] of Object.entries(game.inventory)) {
            if (count > 0) {
                const item = SHOP_ITEMS[key];
                if (item) {
                    const div = document.createElement('div');
                    div.className = 'inventory-item';
                    div.innerHTML = `${item.icon} ${item.name} <span class="count">x${count}</span>`;
                    inventoryEl.appendChild(div);
                }
            }
        }
        if (inventoryEl.children.length === 0) {
            inventoryEl.innerHTML = '<span style="color: #888;">暂无道具</span>';
        }
    }

    function initSkinUI() {
        const charEl = document.getElementById('characterSkins');
        const mineEl = document.getElementById('mineSkins');

        charEl.innerHTML = '';
        mineEl.innerHTML = '';

        for (const skin of CHARACTER_SKINS) {
            const unlocked = skin.unlocked || game.unlockedSkins['char_' + skin.id];
            const selected = game.selectedCharacter === skin.id;
            const div = document.createElement('div');
            div.className = 'skin-card' + (selected ? ' selected' : '') + (!unlocked ? ' locked' : '');
            div.innerHTML = `
                <div class="skin-preview" style="background: ${skin.color};">${skin.icon}</div>
                <div class="skin-name">${skin.name}</div>
                <div class="skin-price">${unlocked ? (selected ? '✓ 已装备' : '点击装备') : '$' + skin.price}</div>
            `;
            div.addEventListener('click', () => handleSkinClick('char', skin));
            charEl.appendChild(div);
        }

        for (const skin of MINE_SKINS) {
            const unlocked = skin.unlocked || game.unlockedSkins['mine_' + skin.id];
            const selected = game.selectedMine === skin.id;
            const div = document.createElement('div');
            div.className = 'skin-card' + (selected ? ' selected' : '') + (!unlocked ? ' locked' : '');
            const previewStyle = `background: linear-gradient(180deg, ${skin.sky[0]} 0%, ${skin.ground[4]} 100%);`;
            div.innerHTML = `
                <div class="skin-preview" style="${previewStyle}">⛏️</div>
                <div class="skin-name">${skin.name}</div>
                <div class="skin-price">${unlocked ? (selected ? '✓ 已装备' : '点击装备') : '$' + skin.price}</div>
            `;
            div.addEventListener('click', () => handleSkinClick('mine', skin));
            mineEl.appendChild(div);
        }
    }

    function handleSkinClick(type, skin) {
        const key = type + '_' + skin.id;
        const unlocked = skin.unlocked || game.unlockedSkins[key];

        if (unlocked) {
            if (type === 'char') {
                game.selectedCharacter = skin.id;
            } else {
                game.selectedMine = skin.id;
            }
            saveGameData();
            initSkinUI();
        } else {
            if (game.totalCoins >= skin.price) {
                if (confirm(`确定花费 $${skin.price} 解锁 ${skin.name} 吗？`)) {
                    game.totalCoins -= skin.price;
                    game.unlockedSkins[key] = true;
                    if (type === 'char') {
                        game.selectedCharacter = skin.id;
                    } else {
                        game.selectedMine = skin.id;
                    }
                    saveGameData();
                    initSkinUI();
                    updateShopUI();
                }
            } else {
                alert('金币不足！');
            }
        }
    }

    canvas.addEventListener('click', function () {
        if (game.isPlaying && game.mode === 'single') {
            launchHook(game.hook);
        }
    });

    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (game.isPlaying && game.mode === 'single') {
            launchHook(game.hook);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (!game.isPlaying) return;

        if (game.mode === 'single') {
            if (e.code === 'Space') {
                e.preventDefault();
                launchHook(game.hook);
            } else if (e.code === 'Digit1') {
                useItem('dynamite', 0);
            } else if (e.code === 'Digit2') {
                useItem('potion', 0);
            } else if (e.code === 'Digit3') {
                useItem('strength', 0);
            } else if (e.code === 'Digit4') {
                useItem('magnet', 0);
            }
        } else {
            if (e.code === 'Space') {
                e.preventDefault();
                launchHook(game.hook);
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                launchHook(game.hook2);
            } else if (e.code === 'Digit1') {
                useItem('dynamite', 0);
            } else if (e.code === 'Digit2') {
                useItem('potion', 0);
            } else if (e.code === 'Digit3') {
                useItem('strength', 0);
            } else if (e.code === 'Digit4') {
                useItem('magnet', 0);
            } else if (e.code === 'Digit7') {
                useItem('dynamite', 1);
            } else if (e.code === 'Digit8') {
                useItem('potion', 1);
            } else if (e.code === 'Digit9') {
                useItem('strength', 1);
            } else if (e.code === 'Digit0') {
                useItem('magnet', 1);
            }
        }
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            game.mode = this.dataset.mode;
        });
    });

    document.getElementById('itemBar').addEventListener('click', function (e) {
        const slot = e.target.closest('.item-slot');
        if (slot && !slot.classList.contains('disabled')) {
            useItem(slot.dataset.item, 0);
        }
    });

    document.getElementById('p2ItemBar').addEventListener('click', function (e) {
        const slot = e.target.closest('.item-slot');
        if (slot && !slot.classList.contains('disabled')) {
            useItem(slot.dataset.item, 1);
        }
    });

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
    document.getElementById('restartBtn').addEventListener('click', startGame);
    document.getElementById('versusRestartBtn').addEventListener('click', startGame);

    document.getElementById('shopBtn').addEventListener('click', function () {
        initShopUI();
        document.getElementById('shopScreen').classList.remove('hidden');
    });

    document.getElementById('shopBetweenBtn').addEventListener('click', function () {
        initShopUI();
        document.getElementById('shopScreen').classList.remove('hidden');
    });

    document.getElementById('shopAfterBtn').addEventListener('click', function () {
        initShopUI();
        document.getElementById('shopScreen').classList.remove('hidden');
    });

    document.getElementById('closeShopBtn').addEventListener('click', function () {
        document.getElementById('shopScreen').classList.add('hidden');
        updateItemBar();
    });

    document.getElementById('skinBtn').addEventListener('click', function () {
        initSkinUI();
        document.getElementById('skinScreen').classList.remove('hidden');
    });

    document.getElementById('closeSkinBtn').addEventListener('click', function () {
        document.getElementById('skinScreen').classList.add('hidden');
    });

    document.getElementById('totalCoins').textContent = game.totalCoins;
    initHook(PIVOT_X);
    initShopUI();
    initSkinUI();
    requestAnimationFrame(gameLoop);
})();