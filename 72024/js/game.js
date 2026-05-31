(function () {
    'use strict';

    var Config = window.GameConfig;

    var state = {
        score: 0,
        coins: 0,
        lives: Config.MAX_LIVES,
        timeLeft: Config.GAME_DURATION,
        isRunning: false,
        isPaused: false,
        isGameOver: false,
        difficulty: 1,
        highScore: 0,
        totalCoins: 0,
        farmLevel: 1,
        currentLevel: 1,
        gameMode: 'single',
        activePowerups: {},
        stats: {
            totalEggsCaught: 0,
            goldenEggsCaught: 0,
            chicksCaught: 0,
            powerupsUsed: 0,
            perfectGames: 0,
            coopGamesPlayed: 0,
            eggsThisSession: 0,
            scoreThisGame: 0,
            goldenThisSession: 0,
            powerupsThisSession: 0,
            gamesThisSession: 0,
            maxComboThisSession: 0,
            currentCombo: 0
        },
        collection: {},
        achievements: [],
        dailyTasks: [],
        lastDailyReset: null
    };

    var dropItems = [];
    var dropItemIdCounter = 0;
    var hens = [];
    var animationFrameId = null;
    var timerIntervalId = null;
    var dropItemSpawnTimeoutId = null;

    var keys = { left: false, right: false, p1Left: false, p1Right: false, p2Left: false, p2Right: false };
    var mouseControlActive = false;
    var mouseX = 0;
    var touchControlActive = false;

    var gameArea, skyLayer, cloudLayer, groundLayer, fenceLayer;
    var basket1, basket2;
    var scoreValue, livesHearts, timerValue, difficultyValue, coinValue, farmLevelDisplay, levelValue;
    var startBtn, pauseBtn, backBtn;
    var gameOverOverlay, finalScoreEl, highScoreEl, newRecordBadge, coinsEarnedEl, restartBtn;
    var startOverlay, overlayStartBtn;
    var mainMenu, gameScreen, levelSelect, levelGrid, levelBackBtn;
    var menuButtons = {};
    var powerupsBar;

    var gameAreaRect;
    var weatherEffects = [];
    var lightningIntervalId = null;

    function init() {
        cacheElements();
        loadSavedData();
        initDailyTasks();
        bindEvents();
        updateMainMenuDisplay();
        showMainMenu();
    }

    function cacheElements() {
        gameArea = document.getElementById('game-area');
        skyLayer = document.getElementById('sky-layer');
        cloudLayer = document.getElementById('cloud-layer');
        groundLayer = document.getElementById('ground-layer');
        fenceLayer = document.getElementById('fence-layer');
        basket1 = document.getElementById('basket');
        basket2 = document.getElementById('basket-2');
        scoreValue = document.getElementById('score-value');
        livesHearts = document.getElementById('lives-hearts');
        timerValue = document.getElementById('timer-value');
        difficultyValue = document.getElementById('difficulty-value');
        coinValue = document.getElementById('coin-value');
        farmLevelDisplay = document.getElementById('farm-level-display');
        levelValue = document.getElementById('level-value');
        startBtn = document.getElementById('start-btn');
        pauseBtn = document.getElementById('pause-btn');
        backBtn = document.getElementById('back-btn');
        gameOverOverlay = document.getElementById('game-over-overlay');
        finalScoreEl = document.getElementById('final-score');
        highScoreEl = document.getElementById('high-score');
        newRecordBadge = document.getElementById('new-record-badge');
        coinsEarnedEl = document.getElementById('coins-earned');
        restartBtn = document.getElementById('restart-btn');
        startOverlay = document.getElementById('start-overlay');
        overlayStartBtn = document.getElementById('overlay-start-btn');
        mainMenu = document.getElementById('main-menu');
        gameScreen = document.getElementById('game-screen');
        powerupsBar = document.getElementById('powerups-bar');
        levelSelect = document.getElementById('level-select');
        levelGrid = document.getElementById('level-grid');
        levelBackBtn = document.getElementById('level-back-btn');

        menuButtons = {
            singlePlayer: document.getElementById('menu-single'),
            twoPlayer: document.getElementById('menu-two-player'),
            upgrade: document.getElementById('menu-upgrade'),
            achievements: document.getElementById('menu-achievements'),
            tasks: document.getElementById('menu-tasks')
        };
    }

    function loadSavedData() {
        try {
            var saved = localStorage.getItem('eggGameSave');
            if (saved) {
                var data = JSON.parse(saved);
                state.highScore = data.highScore || 0;
                state.totalCoins = data.totalCoins || 0;
                state.farmLevel = data.farmLevel || 1;
                state.stats = data.stats || state.stats;
                state.collection = data.collection || {};
                state.achievements = data.achievements || [];
                state.lastDailyReset = data.lastDailyReset || null;
                state.dailyTasks = data.dailyTasks || [];
            }
        } catch (e) {
            console.warn('加载存档失败:', e);
        }
    }

    function saveData() {
        try {
            var data = {
                highScore: state.highScore,
                totalCoins: state.totalCoins,
                farmLevel: state.farmLevel,
                stats: state.stats,
                collection: state.collection,
                achievements: state.achievements,
                lastDailyReset: state.lastDailyReset,
                dailyTasks: state.dailyTasks
            };
            localStorage.setItem('eggGameSave', JSON.stringify(data));
        } catch (e) {
            console.warn('保存存档失败:', e);
        }
    }

    function initDailyTasks() {
        var today = new Date().toDateString();
        if (state.lastDailyReset !== today) {
            var templates = Config.DAILY_TASK_TEMPLATES;
            var shuffled = templates.slice().sort(function () { return 0.5 - Math.random(); });
            state.dailyTasks = shuffled.slice(0, 3).map(function (t) {
                return {
                    id: t.id,
                    description: t.description,
                    target: t.target,
                    reward: t.reward,
                    statKey: t.statKey,
                    progress: 0,
                    completed: false,
                    claimed: false
                };
            });
            state.lastDailyReset = today;
            state.stats.eggsThisSession = 0;
            state.stats.scoreThisGame = 0;
            state.stats.goldenThisSession = 0;
            state.stats.powerupsThisSession = 0;
            state.stats.gamesThisSession = 0;
            state.stats.maxComboThisSession = 0;
            saveData();
        }
    }

    function bindEvents() {
        overlayStartBtn.addEventListener('click', function () {
            startOverlay.classList.add('hidden');
            showMainMenu();
        });

        startBtn.addEventListener('click', function () {
            if (!state.isRunning) startGame();
        });

        pauseBtn.addEventListener('click', togglePause);
        backBtn.addEventListener('click', backToMenu);
        restartBtn.addEventListener('click', function () {
            gameOverOverlay.classList.add('hidden');
            startGame();
        });

        var menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', backToMenu);
        }

        menuButtons.singlePlayer.addEventListener('click', function () {
            state.gameMode = 'single';
            showLevelSelect();
        });

        menuButtons.twoPlayer.addEventListener('click', function () {
            if (window.innerWidth >= 1024) {
                state.gameMode = 'coop';
                showLevelSelect();
            } else {
                alert('双人模式需要更大屏幕（≥1024px）');
            }
        });

        menuButtons.upgrade.addEventListener('click', showUpgradePanel);
        menuButtons.achievements.addEventListener('click', showAchievementsPanel);
        menuButtons.tasks.addEventListener('click', showTasksPanel);

        levelBackBtn.addEventListener('click', function () {
            levelSelect.classList.add('hidden');
            mainMenu.classList.remove('hidden');
        });

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        gameArea.addEventListener('mousemove', onMouseMove);
        gameArea.addEventListener('touchmove', onTouchMove, { passive: false });
        gameArea.addEventListener('touchstart', onTouchStart, { passive: false });

        window.addEventListener('resize', updateGameAreaRect);
    }

    function showMainMenu() {
        cleanupGameResources();
        mainMenu.classList.remove('hidden');
        levelSelect.classList.add('hidden');
        gameScreen.classList.add('hidden');
        startOverlay.classList.add('hidden');
        gameOverOverlay.classList.add('hidden');
        updateMainMenuDisplay();
    }

    function updateMainMenuDisplay() {
        var menuHighScore = document.getElementById('menu-high-score');
        var menuCoins = document.getElementById('menu-coins');
        var menuFarmLevel = document.getElementById('menu-farm-level');

        if (menuHighScore) menuHighScore.textContent = state.highScore;
        if (menuCoins) menuCoins.textContent = state.totalCoins;
        if (menuFarmLevel) menuFarmLevel.textContent = state.farmLevel;
    }

    function showLevelSelect() {
        mainMenu.classList.add('hidden');
        levelSelect.classList.remove('hidden');
        levelGrid.innerHTML = '';

        var highestUnlocked = Math.min(state.farmLevel, Object.keys(Config.LEVELS).length);

        for (var i = 1; i <= 5; i++) {
            var levelConfig = Config.LEVELS[i];
            if (!levelConfig) continue;

            var isUnlocked = i <= highestUnlocked;
            var card = document.createElement('div');
            card.className = 'level-card ' + (isUnlocked ? 'unlocked' : 'locked');
            card.style.background = levelConfig.backgroundGradient;

            var weatherEmoji = {
                sunny: '☀️',
                wind: '🍃',
                rain: '🌧️',
                snow: '❄️',
                lightning: '⚡'
            };

            card.innerHTML = '<div class="level-number">第 ' + i + ' 关</div>' +
                '<div class="level-name">' + levelConfig.name + '</div>' +
                '<div class="level-weather">' + (weatherEmoji[levelConfig.weather] || '☀️') + ' ' +
                (levelConfig.weather === 'sunny' ? '晴朗' :
                    levelConfig.weather === 'wind' ? '微风' :
                        levelConfig.weather === 'rain' ? '下雨' :
                            levelConfig.weather === 'snow' ? '下雪' : '雷电') + '</div>' +
                '<div class="level-bonus">' +
                (levelConfig.goldenEggBonus ? '金蛋概率 +' + (levelConfig.goldenEggBonus * 100).toFixed(0) + '%' : '') +
                (levelConfig.dropSpeedModifier > 1 ? ' | 速度 +' + ((levelConfig.dropSpeedModifier - 1) * 100).toFixed(0) + '%' : '') +
                (levelConfig.windStrength ? ' | 风力 ' + levelConfig.windStrength : '') +
                '</div>' +
                '<div class="level-status">' + (isUnlocked ? '✓ 已解锁' : '🔒 需要农场 Lv.' + i) + '</div>';

            if (isUnlocked) {
                card.addEventListener('click', function (levelNum) {
                    return function () {
                        state.currentLevel = levelNum;
                        levelSelect.classList.add('hidden');
                        startGame();
                    };
                }(i));
            }

            levelGrid.appendChild(card);
        }
    }

    function updateGameAreaRect() {
        gameAreaRect = gameArea.getBoundingClientRect();
    }

    function startGame() {
        mainMenu.classList.add('hidden');
        levelSelect.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        gameOverOverlay.classList.add('hidden');

        state.score = 0;
        state.lives = Config.MAX_LIVES;
        state.timeLeft = Config.GAME_DURATION;
        state.isRunning = true;
        state.isPaused = false;
        state.isGameOver = false;
        state.difficulty = 1;
        state.activePowerups = {};
        state.stats.scoreThisGame = 0;
        state.stats.currentCombo = 0;

        clearAllDropItems();
        clearWeatherEffects();
        setupLevel();
        setupHens();
        setupBaskets();

        updateScoreDisplay();
        updateLivesDisplay();
        updateTimerDisplay();
        updateDifficultyDisplay();
        updateCoinsDisplay();
        updateFarmLevelDisplay();
        updateLevelDisplay();
        updatePowerupsDisplay();

        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        pauseBtn.textContent = '暂停';
        backBtn.classList.remove('hidden');

        if (state.gameMode === 'coop') {
            basket2.classList.remove('hidden');
            state.stats.coopGamesPlayed++;
        } else {
            basket2.classList.add('hidden');
        }

        updateGameAreaRect();
        state.stats.gamesThisSession++;

        timerIntervalId = setInterval(timerTick, 1000);
        scheduleDropItemSpawn();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function setupLevel() {
        var levelConfig = Config.LEVELS[state.currentLevel];
        if (!levelConfig) return;

        gameArea.style.background = levelConfig.backgroundGradient;
        if (groundLayer) groundLayer.style.backgroundColor = levelConfig.groundColor;

        spawnWeatherEffects(levelConfig.weather);
        updateLevelDisplay();
    }

    function updateLevelDisplay() {
        var levelConfig = Config.LEVELS[state.currentLevel];
        if (levelConfig && levelValue) {
            levelValue.textContent = levelConfig.name;
        }
    }

    function spawnWeatherEffects(weather) {
        clearWeatherEffects();

        if (weather === 'rain') {
            for (var i = 0; i < 50; i++) {
                createRainDrop();
            }
        } else if (weather === 'snow') {
            for (var j = 0; j < 40; j++) {
                createSnowFlake();
            }
        } else if (weather === 'lightning') {
            if (lightningIntervalId) {
                clearInterval(lightningIntervalId);
            }
            lightningIntervalId = setInterval(function () {
                if (state.isRunning && !state.isPaused && Math.random() < 0.02) {
                    createLightning();
                }
            }, 500);
        }
    }

    function createRainDrop() {
        var drop = document.createElement('div');
        drop.className = 'weather-effect rain-drop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.top = Math.random() * 100 + '%';
        drop.style.animationDelay = Math.random() * 2 + 's';
        skyLayer.appendChild(drop);
        weatherEffects.push(drop);
    }

    function createSnowFlake() {
        var flake = document.createElement('div');
        flake.className = 'weather-effect snow-flake';
        flake.textContent = '❄';
        flake.style.left = Math.random() * 100 + '%';
        flake.style.top = Math.random() * 100 + '%';
        flake.style.animationDelay = Math.random() * 5 + 's';
        flake.style.fontSize = (8 + Math.random() * 12) + 'px';
        skyLayer.appendChild(flake);
        weatherEffects.push(flake);
    }

    function createLightning() {
        var flash = document.createElement('div');
        flash.className = 'lightning-flash';
        gameArea.appendChild(flash);
        setTimeout(function () {
            if (flash.parentNode) flash.parentNode.removeChild(flash);
        }, 200);
    }

    function clearWeatherEffects() {
        if (lightningIntervalId) {
            clearInterval(lightningIntervalId);
            lightningIntervalId = null;
        }
        weatherEffects.forEach(function (el) {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
        weatherEffects = [];
    }

    function setupHens() {
        var existingHens = document.querySelectorAll('.hen');
        existingHens.forEach(function (h) {
            if (h.id !== 'hen') h.parentNode.removeChild(h);
        });
        hens = [];

        var farmConfig = Config.FARM_LEVELS[state.farmLevel];
        var henCount = farmConfig ? farmConfig.henCount : 1;

        var baseHen = document.getElementById('hen');
        baseHen.style.left = '100px';
        baseHen.classList.remove('face-left');
        hens.push({
            element: baseHen,
            direction: 1,
            speed: Config.HEN_SPEED
        });

        for (var i = 1; i < henCount; i++) {
            var newHen = baseHen.cloneNode(true);
            newHen.id = 'hen-' + i;
            newHen.style.left = (100 + i * 150) + 'px';
            gameArea.appendChild(newHen);
            hens.push({
                element: newHen,
                direction: Math.random() > 0.5 ? 1 : -1,
                speed: Config.HEN_SPEED * (0.8 + Math.random() * 0.4)
            });
        }
    }

    function setupBaskets() {
        var areaWidth = gameArea.offsetWidth;
        basket1.style.left = ((areaWidth - Config.BASKET_WIDTH) / 2) + 'px';
        basket1.classList.remove('shield-active');
        basket1.style.width = Config.BASKET_WIDTH + 'px';

        if (state.gameMode === 'coop') {
            basket2.style.left = (areaWidth / 2 + 50) + 'px';
            basket2.classList.remove('shield-active');
            basket2.style.width = Config.BASKET_WIDTH + 'px';
        }
    }

    function togglePause() {
        if (state.isGameOver) return;

        state.isPaused = !state.isPaused;
        pauseBtn.textContent = state.isPaused ? '继续' : '暂停';

        if (state.isPaused) {
            cleanupGameResources();
        } else {
            updateGameAreaRect();
            timerIntervalId = setInterval(timerTick, 1000);
            scheduleDropItemSpawn();
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }

    function backToMenu() {
        cleanupGameResources();
        state.isRunning = false;
        state.isGameOver = true;
        showMainMenu();
    }

    function gameLoop() {
        if (state.isGameOver || !state.isRunning || state.isPaused) return;

        moveHens();
        moveBaskets();
        updateDropItems();
        checkCollisions();
        updatePowerups();
        updateWeatherEffects();

        if (!state.isGameOver && state.isRunning && !state.isPaused) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }

    function moveHens() {
        var areaWidth = gameArea.offsetWidth;
        var henWidth = 50;

        hens.forEach(function (hen) {
            var currentLeft = parseInt(hen.element.style.left, 10) || 100;
            currentLeft += hen.speed * hen.direction;

            if (currentLeft + henWidth >= areaWidth) {
                currentLeft = areaWidth - henWidth;
                hen.direction = -1;
                hen.element.classList.add('face-left');
            } else if (currentLeft <= 0) {
                currentLeft = 0;
                hen.direction = 1;
                hen.element.classList.remove('face-left');
            }

            hen.element.style.left = currentLeft + 'px';
        });
    }

    function moveBaskets() {
        if (state.gameMode === 'coop') {
            moveBasket(basket1, keys.p1Left, keys.p1Right, 1);
            moveBasket(basket2, keys.left, keys.right, 2);
        } else {
            moveBasket(basket1, keys.left, keys.right, 1);
        }
    }

    function moveBasket(basket, leftKey, rightKey, playerNum) {
        var currentLeft = parseInt(basket.style.left, 10) || 0;
        var areaWidth = gameArea.offsetWidth;
        var basketWidth = getCurrentBasketWidth();
        var speed = getCurrentBasketSpeed();

        var useMouse = playerNum === 1 && state.gameMode === 'single' && mouseControlActive;

        if (useMouse) {
            var targetX = mouseX - gameAreaRect.left - basketWidth / 2;
            targetX = Math.max(0, Math.min(areaWidth - basketWidth, targetX));
            var diff = targetX - currentLeft;
            var step = Math.sign(diff) * Math.min(Math.abs(diff), speed + 3);
            currentLeft += step;
        } else {
            if (leftKey) currentLeft -= speed;
            if (rightKey) currentLeft += speed;
        }

        var minX = playerNum === 2 ? areaWidth / 2 : 0;
        var maxX = playerNum === 2 ? areaWidth - basketWidth : areaWidth - basketWidth;

        currentLeft = Math.max(minX, Math.min(maxX, currentLeft));
        basket.style.left = currentLeft + 'px';
        basket.style.width = basketWidth + 'px';
    }

    function getCurrentBasketSpeed() {
        var speed = Config.BASKET_SPEED;
        if (state.activePowerups.speed) {
            speed *= 1.5;
        }
        return speed;
    }

    function getCurrentBasketWidth() {
        var width = Config.BASKET_WIDTH;
        if (state.activePowerups.wide) {
            width *= 1.5;
        }
        return width;
    }

    function scheduleDropItemSpawn() {
        if (!state.isRunning || state.isPaused) return;

        var farmConfig = Config.FARM_LEVELS[state.farmLevel] || Config.FARM_LEVELS[1];
        var interval = Config.EGG_INTERVAL_MIN + Math.random() * (Config.EGG_INTERVAL_MAX - Config.EGG_INTERVAL_MIN);
        var speedMultiplier = 1 - (state.difficulty - 1) * 0.08;
        interval *= Math.max(0.5, speedMultiplier);
        interval *= farmConfig.eggIntervalMultiplier;

        var levelConfig = Config.LEVELS[state.currentLevel];
        if (levelConfig && levelConfig.dropSpeedModifier) {
            interval /= levelConfig.dropSpeedModifier;
        }

        dropItemSpawnTimeoutId = setTimeout(function () {
            if (state.isRunning && !state.isPaused) {
                spawnDropItem();
            }
            scheduleDropItemSpawn();
        }, interval);
    }

    function spawnDropItem() {
        if (!state.isRunning || state.isPaused || hens.length === 0) return;

        var hen = hens[Math.floor(Math.random() * hens.length)];
        var henLeft = parseInt(hen.element.style.left, 10) || 100;
        var dropX = henLeft + 10;

        var itemType = selectDropItemType();
        var itemConfig = Config.DROP_ITEMS[itemType];

        var itemEl = document.createElement('div');
        itemEl.className = 'drop-item ' + itemConfig.className;
        itemEl.textContent = itemConfig.emoji;
        itemEl.style.left = dropX + 'px';
        itemEl.style.top = Config.ROOF_HEIGHT + 'px';

        gameArea.appendChild(itemEl);

        var fallSpeed = Config.BASE_FALL_SPEED + (state.difficulty - 1) * 0.5;
        if (state.activePowerups.slowmo) {
            fallSpeed *= 0.5;
        }

        var levelConfig = Config.LEVELS[state.currentLevel];
        if (levelConfig && levelConfig.dropSpeedModifier) {
            fallSpeed *= levelConfig.dropSpeedModifier;
        }

        var dropItem = {
            id: dropItemIdCounter++,
            type: itemType,
            x: dropX,
            y: Config.ROOF_HEIGHT,
            speed: fallSpeed,
            element: itemEl,
            swingPhase: Math.random() * Math.PI * 2,
            windOffset: 0
        };

        dropItems.push(dropItem);
    }

    function selectDropItemType() {
        var farmConfig = Config.FARM_LEVELS[state.farmLevel] || Config.FARM_LEVELS[1];
        var unlockedItems = farmConfig.unlockedItems;
        var levelConfig = Config.LEVELS[state.currentLevel];

        var availableItems = {};
        var totalWeight = 0;

        unlockedItems.forEach(function (itemType) {
            var item = Config.DROP_ITEMS[itemType];
            if (item) {
                var weight = item.probability;
                if (levelConfig && levelConfig.goldenEggBonus && itemType === 'golden') {
                    weight += levelConfig.goldenEggBonus;
                }
                availableItems[itemType] = weight;
                totalWeight += weight;
            }
        });

        var rand = Math.random() * totalWeight;
        var cumulative = 0;

        for (var itemType in availableItems) {
            cumulative += availableItems[itemType];
            if (rand <= cumulative) {
                return itemType;
            }
        }

        return unlockedItems[0] || 'normal';
    }

    function updateDropItems() {
        var groundY = gameArea.offsetHeight - Config.GROUND_HEIGHT;
        var toRemove = [];
        var levelConfig = Config.LEVELS[state.currentLevel];

        for (var i = 0; i < dropItems.length; i++) {
            var item = dropItems[i];
            item.y += item.speed;

            if (levelConfig && levelConfig.windStrength) {
                item.windOffset += levelConfig.windStrength * 0.5;
                item.x += Math.sin(item.windOffset * 0.1) * levelConfig.windStrength;
            }

            item.x += Math.sin(item.swingPhase + item.y * 0.02) * 0.3;
            item.x = Math.max(0, Math.min(gameArea.offsetWidth - Config.EGG_WIDTH, item.x));

            item.element.style.top = item.y + 'px';
            item.element.style.left = item.x + 'px';

            if (state.activePowerups.magnet) {
                applyMagnetEffect(item);
            }

            if (item.y >= groundY) {
                toRemove.push(i);
                handleDropItemGroundHit(item);
            }

            if (state.isGameOver) break;
        }

        for (var j = toRemove.length - 1; j >= 0; j--) {
            removeDropItem(toRemove[j]);
        }
    }

    function applyMagnetEffect(item) {
        var basketX = parseInt(basket1.style.left, 10) + getCurrentBasketWidth() / 2;
        var itemX = item.x + Config.EGG_WIDTH / 2;
        var diff = basketX - itemX;
        var distance = Math.abs(diff);

        if (distance < 200 && item.type !== 'bomb' && item.type !== 'poop') {
            item.x += Math.sign(diff) * Math.min(3, distance * 0.05);
        }
    }

    function handleDropItemGroundHit(item) {
        var itemConfig = Config.DROP_ITEMS[item.type];
        if (!itemConfig) return;

        if (item.type === 'normal' || item.type === 'golden' || item.type === 'chick' || item.type === 'heart') {
            loseLife();
            if (!state.isGameOver) {
                showBreakAnimation(item.x, gameArea.offsetHeight - Config.GROUND_HEIGHT);
                showScorePopup(item.x, item.y - 20, '-1 ❤️', false);
            }
            state.stats.currentCombo = 0;
        }
    }

    function checkCollisions() {
        if (state.isGameOver) return;

        var baskets = [basket1];
        if (state.gameMode === 'coop') baskets.push(basket2);

        var toRemove = [];

        for (var i = 0; i < dropItems.length; i++) {
            var item = dropItems[i];

            for (var b = 0; b < baskets.length; b++) {
                var basket = baskets[b];
                if (checkBasketCollision(item, basket)) {
                    toRemove.push(i);
                    handleCatch(item, basket);
                    break;
                }
            }

            if (state.isGameOver) break;
        }

        for (var j = toRemove.length - 1; j >= 0; j--) {
            removeDropItem(toRemove[j]);
        }
    }

    function checkBasketCollision(item, basket) {
        var basketLeft = parseInt(basket.style.left, 10) || 0;
        var basketTop = gameArea.offsetHeight - Config.GROUND_HEIGHT - 45;
        var basketWidth = getCurrentBasketWidth();
        var basketCollisionWidth = basketWidth + Config.BASKET_COLLISION_PADDING;
        var basketRight = basketLeft + basketCollisionWidth;
        var basketBottom = basketTop + 45;
        var basketCenterX = basketLeft + basketWidth / 2;

        var itemLeft = item.x;
        var itemRight = item.x + Config.EGG_WIDTH;
        var itemTop = item.y;
        var itemBottom = item.y + Config.EGG_HEIGHT;
        var itemCenterX = item.x + Config.EGG_WIDTH / 2;

        var collisionX = itemRight > basketLeft - Config.BASKET_EDGE_TOLERANCE &&
                        itemLeft < basketRight + Config.BASKET_EDGE_TOLERANCE;
        var collisionY = itemBottom > basketTop && itemTop < basketBottom;
        var centerOverlap = Math.abs(itemCenterX - basketCenterX) <
                           (basketWidth / 2 + Config.BASKET_CENTER_OVERLAP_THRESHOLD);

        return collisionX && collisionY && centerOverlap;
    }

    function handleCatch(item, basket) {
        if (state.isGameOver) return;

        var itemConfig = Config.DROP_ITEMS[item.type];
        if (!itemConfig) return;

        var hasShield = basket.classList.contains('shield-active');

        if (!hasShield && (item.type === 'bomb' || item.type === 'poop')) {
            if (item.type === 'bomb') {
                loseLife();
                showScorePopup(item.x, item.y - 20, '-1 ❤️', false);
            } else {
                addScore(itemConfig.score);
                showScorePopup(item.x, item.y - 20, itemConfig.score.toString(), false);
            }
            state.stats.currentCombo = 0;
        } else {
            basket.classList.remove('bounce');
            void basket.offsetWidth;
            basket.classList.add('bounce');

            if (itemConfig.isPowerup) {
                activateRandomPowerup(basket);
                showScorePopup(item.x, item.y - 20, '🎁 道具!', true);
            } else {
                if (itemConfig.score !== 0) {
                    addScore(itemConfig.score);
                    showScorePopup(item.x, item.y - 20, '+' + itemConfig.score, true);
                }
                if (itemConfig.lifeChange !== 0) {
                    if (itemConfig.lifeChange > 0) {
                        state.lives = Math.min(Config.MAX_LIVES, state.lives + itemConfig.lifeChange);
                        updateLivesDisplay();
                        showScorePopup(item.x, item.y - 40, '+1 ❤️', true);
                    } else {
                        loseLife();
                    }
                }
            }

            updateCollection(item.type);
            updateStats(item.type);
            state.stats.currentCombo++;
            state.stats.maxComboThisSession = Math.max(state.stats.maxComboThisSession, state.stats.currentCombo);
        }
    }

    function updateStats(itemType) {
        state.stats.totalEggsCaught++;
        state.stats.eggsThisSession++;
        state.stats.scoreThisGame = state.score;

        if (itemType === 'golden') {
            state.stats.goldenEggsCaught++;
            state.stats.goldenThisSession++;
        } else if (itemType === 'chick') {
            state.stats.chicksCaught++;
        }

        checkAchievements();
        updateDailyTaskProgress();
    }

    function updateCollection(itemType) {
        if (!state.collection[itemType]) {
            state.collection[itemType] = 0;
        }
        state.collection[itemType]++;
        saveData();
    }

    function activateRandomPowerup(basket) {
        var powerupTypes = Object.keys(Config.POWERUP_TYPES);
        var randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        var powerupConfig = Config.POWERUP_TYPES[randomType];

        state.activePowerups[randomType] = Date.now() + powerupConfig.duration;
        state.stats.powerupsUsed++;
        state.stats.powerupsThisSession++;

        if (randomType === 'shield') {
            basket.classList.add('shield-active');
        }

        showPowerupNotification(powerupConfig);
        updatePowerupsDisplay();
        checkAchievements();
    }

    function showPowerupNotification(config) {
        var notification = document.createElement('div');
        notification.className = 'powerup-notification';
        notification.innerHTML = '<span class="powerup-icon">' + config.emoji + '</span>' +
                                 '<span class="powerup-name">' + config.name + '</span>' +
                                 '<span class="powerup-desc">' + config.description + '</span>';
        gameArea.appendChild(notification);

        setTimeout(function () {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 2000);
    }

    function updatePowerups() {
        var now = Date.now();
        var updated = false;

        for (var type in state.activePowerups) {
            if (state.activePowerups[type] <= now) {
                delete state.activePowerups[type];
                updated = true;

                if (type === 'shield') {
                    basket1.classList.remove('shield-active');
                    if (basket2) basket2.classList.remove('shield-active');
                }
            }
        }

        if (updated) {
            updatePowerupsDisplay();
        }
    }

    function updatePowerupsDisplay() {
        if (!powerupsBar) return;
        powerupsBar.innerHTML = '';

        for (var type in state.activePowerups) {
            var remaining = Math.ceil((state.activePowerups[type] - Date.now()) / 1000);
            if (remaining > 0) {
                var config = Config.POWERUP_TYPES[type];
                var badge = document.createElement('div');
                badge.className = 'powerup-badge';
                badge.style.backgroundColor = config.color;
                badge.innerHTML = '<span class="powerup-emoji">' + config.emoji + '</span>' +
                                  '<span class="powerup-time">' + remaining + 's</span>';
                powerupsBar.appendChild(badge);
            }
        }
    }

    function updateWeatherEffects() {
        var levelConfig = Config.LEVELS[state.currentLevel];
        if (!levelConfig) return;

        if (levelConfig.weather === 'rain' && Math.random() < 0.1) {
            createRainDrop();
            if (weatherEffects.length > 100) {
                var old = weatherEffects.shift();
                if (old.parentNode) old.parentNode.removeChild(old);
            }
        } else if (levelConfig.weather === 'snow' && Math.random() < 0.05) {
            createSnowFlake();
            if (weatherEffects.length > 80) {
                var oldFlake = weatherEffects.shift();
                if (oldFlake.parentNode) oldFlake.parentNode.removeChild(oldFlake);
            }
        }
    }

    function addScore(points) {
        state.score = Math.max(0, state.score + points);

        var newDifficulty = Math.floor(state.score / Config.DIFFICULTY_THRESHOLD) + 1;
        if (newDifficulty !== state.difficulty) {
            state.difficulty = newDifficulty;
            updateDifficultyDisplay();
        }

        updateScoreDisplay();
        updateDailyTaskProgress();
    }

    function loseLife() {
        state.lives--;
        updateLivesDisplay();

        if (state.lives <= 0) {
            endGame();
        }
    }

    function showBreakAnimation(x, y) {
        var breakEl = document.createElement('div');
        breakEl.className = 'egg-break';
        breakEl.style.left = x + 'px';
        breakEl.style.top = y + 'px';

        var yolk = document.createElement('div');
        yolk.className = 'yolk';
        breakEl.appendChild(yolk);

        var shellAngles = [
            { sx: '-15px', sy: '-20px', sr: '-45deg' },
            { sx: '15px', sy: '-25px', sr: '30deg' },
            { sx: '-20px', sy: '-10px', sr: '-60deg' },
            { sx: '20px', sy: '-15px', sr: '50deg' }
        ];

        for (var i = 0; i < shellAngles.length; i++) {
            var shell = document.createElement('div');
            shell.className = 'shell-piece';
            shell.style.setProperty('--sx', shellAngles[i].sx);
            shell.style.setProperty('--sy', shellAngles[i].sy);
            shell.style.setProperty('--sr', shellAngles[i].sr);
            breakEl.appendChild(shell);
        }

        gameArea.appendChild(breakEl);

        setTimeout(function () {
            if (breakEl.parentNode) breakEl.parentNode.removeChild(breakEl);
        }, 600);
    }

    function showScorePopup(x, y, text, isPositive) {
        var popup = document.createElement('div');
        popup.className = 'score-popup ' + (isPositive ? 'positive' : 'negative');
        popup.textContent = text;
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';

        gameArea.appendChild(popup);

        setTimeout(function () {
            if (popup.parentNode) popup.parentNode.removeChild(popup);
        }, 800);
    }

    function removeDropItem(index) {
        var item = dropItems[index];
        if (item.element.parentNode) {
            item.element.parentNode.removeChild(item.element);
        }
        dropItems.splice(index, 1);
    }

    function clearAllDropItems() {
        for (var i = 0; i < dropItems.length; i++) {
            if (dropItems[i].element.parentNode) {
                dropItems[i].element.parentNode.removeChild(dropItems[i].element);
            }
        }
        dropItems = [];
    }

    function timerTick() {
        if (!state.isRunning || state.isPaused) return;

        state.timeLeft--;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            endGame();
        }
    }

    function cleanupGameResources() {
        cancelAnimationFrame(animationFrameId);
        clearInterval(timerIntervalId);
        clearTimeout(dropItemSpawnTimeoutId);
        animationFrameId = null;
        timerIntervalId = null;
        dropItemSpawnTimeoutId = null;
    }

    function endGame() {
        if (state.isGameOver) return;

        state.isGameOver = true;
        state.isRunning = false;

        cleanupGameResources();
        clearWeatherEffects();

        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');

        var coinsEarned = Math.floor(state.score * Config.COIN_TO_SCORE_RATIO);
        state.coins = coinsEarned;
        state.totalCoins += coinsEarned;

        var isNewRecord = state.score > state.highScore;
        if (isNewRecord) {
            state.highScore = state.score;
        }

        if (state.stats.currentCombo > 0 && state.lives === Config.MAX_LIVES) {
            state.stats.perfectGames++;
        }

        checkAchievements();
        saveData();

        finalScoreEl.textContent = state.score;
        highScoreEl.textContent = state.highScore;
        coinsEarnedEl.textContent = coinsEarned;

        if (isNewRecord && state.score > 0) {
            newRecordBadge.classList.remove('hidden');
        } else {
            newRecordBadge.classList.add('hidden');
        }

        gameOverOverlay.classList.remove('hidden');
    }

    function checkAchievements() {
        Config.ACHIEVEMENTS.forEach(function (achievement) {
            if (state.achievements.indexOf(achievement.id) === -1) {
                try {
                    if (achievement.condition(state.stats)) {
                        state.achievements.push(achievement.id);
                        showAchievementUnlock(achievement);
                    }
                } catch (e) {
                    console.warn('成就检查失败:', achievement.id, e);
                }
            }
        });
    }

    function showAchievementUnlock(achievement) {
        var unlock = document.createElement('div');
        unlock.className = 'achievement-unlock';
        unlock.innerHTML = '<div class="achievement-icon">' + achievement.icon + '</div>' +
                           '<div class="achievement-info">' +
                           '<div class="achievement-title">成就解锁!</div>' +
                           '<div class="achievement-name">' + achievement.name + '</div>' +
                           '</div>';
        document.body.appendChild(unlock);

        setTimeout(function () {
            if (unlock.parentNode) unlock.parentNode.removeChild(unlock);
        }, 3000);
    }

    function updateDailyTaskProgress() {
        state.dailyTasks.forEach(function (task) {
            if (!task.completed) {
                var currentValue = state.stats[task.statKey] || 0;
                task.progress = Math.min(task.target, currentValue);
                if (task.progress >= task.target) {
                    task.completed = true;
                }
            }
        });
    }

    function showUpgradePanel() {
        var panel = document.getElementById('upgrade-panel');
        if (!panel) {
            createUpgradePanel();
            panel = document.getElementById('upgrade-panel');
        }
        updateUpgradePanelContent();
        panel.classList.remove('hidden');
    }

    function createUpgradePanel() {
        var panel = document.createElement('div');
        panel.id = 'upgrade-panel';
        panel.className = 'overlay-panel hidden';
        panel.innerHTML = '<div class="panel-content">' +
            '<h2>🏠 农场升级</h2>' +
            '<div id="upgrade-list"></div>' +
            '<div class="panel-footer">' +
            '<span class="panel-coins">💰 金币: <span id="upgrade-coins">0</span></span>' +
            '<button class="panel-close-btn">关闭</button>' +
            '</div></div>';
        document.body.appendChild(panel);

        panel.querySelector('.panel-close-btn').addEventListener('click', function () {
            panel.classList.add('hidden');
        });
    }

    function updateUpgradePanelContent() {
        var list = document.getElementById('upgrade-list');
        var coinsDisplay = document.getElementById('upgrade-coins');
        if (!list) return;

        coinsDisplay.textContent = state.totalCoins;
        list.innerHTML = '';

        for (var level in Config.FARM_LEVELS) {
            var config = Config.FARM_LEVELS[level];
            var isUnlocked = parseInt(level) <= state.farmLevel;
            var canAfford = state.totalCoins >= config.cost;
            var isCurrent = parseInt(level) === state.farmLevel;

            var item = document.createElement('div');
            item.className = 'upgrade-item ' + (isUnlocked ? 'unlocked' : 'locked') + (isCurrent ? ' current' : '');
            item.innerHTML = '<div class="upgrade-level">Lv.' + config.level + '</div>' +
                '<div class="upgrade-info">' +
                '<div class="upgrade-name">' + config.name + '</div>' +
                '<div class="upgrade-desc">' +
                '🐔 母鸡数量: ' + config.henCount + ' | ' +
                '⏱️ 下蛋频率: ' + Math.round((1 - config.eggIntervalMultiplier) * 100) + '% 加速' +
                '</div></div>' +
                '<div class="upgrade-action">' +
                (isCurrent ? '<span class="current-badge">当前</span>' :
                    isUnlocked ? '<span class="unlocked-badge">已解锁</span>' :
                        '<button class="upgrade-btn" data-level="' + level + '" ' +
                        (canAfford ? '' : 'disabled') + '>' +
                        '💰 ' + config.cost + '</button>') +
                '</div>';

            list.appendChild(item);
        }

        list.querySelectorAll('.upgrade-btn:not([disabled])').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var targetLevel = parseInt(this.dataset.level);
                upgradeFarm(targetLevel);
            });
        });
    }

    function upgradeFarm(targetLevel) {
        var config = Config.FARM_LEVELS[targetLevel];
        if (!config || state.totalCoins < config.cost || targetLevel !== state.farmLevel + 1) return;

        state.totalCoins -= config.cost;
        state.farmLevel = targetLevel;
        saveData();

        checkAchievements();
        updateUpgradePanelContent();
        updateMainMenuDisplay();

        var firework = document.createElement('div');
        firework.className = 'upgrade-firework';
        firework.textContent = '🎉 升级成功!';
        document.body.appendChild(firework);
        setTimeout(function () {
            if (firework.parentNode) firework.parentNode.removeChild(firework);
        }, 2000);
    }

    function showAchievementsPanel() {
        var panel = document.getElementById('achievements-panel');
        if (!panel) {
            createAchievementsPanel();
            panel = document.getElementById('achievements-panel');
        }
        updateAchievementsPanelContent();
        panel.classList.remove('hidden');
    }

    function createAchievementsPanel() {
        var panel = document.createElement('div');
        panel.id = 'achievements-panel';
        panel.className = 'overlay-panel hidden';
        panel.innerHTML = '<div class="panel-content achievements-content">' +
            '<h2>🏆 成就图鉴</h2>' +
            '<div class="achievements-tabs">' +
            '<button class="tab-btn active" data-tab="achievements">成就</button>' +
            '<button class="tab-btn" data-tab="collection">图鉴</button>' +
            '</div>' +
            '<div id="achievements-list" class="tab-content active"></div>' +
            '<div id="collection-list" class="tab-content"></div>' +
            '<div class="panel-footer">' +
            '<button class="panel-close-btn">关闭</button>' +
            '</div></div>';
        document.body.appendChild(panel);

        panel.querySelector('.panel-close-btn').addEventListener('click', function () {
            panel.classList.add('hidden');
        });

        panel.querySelectorAll('.tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tab = this.dataset.tab;
                panel.querySelectorAll('.tab-btn').forEach(function (b) {
                    b.classList.remove('active');
                });
                panel.querySelectorAll('.tab-content').forEach(function (c) {
                    c.classList.remove('active');
                });
                this.classList.add('active');
                document.getElementById(tab + '-list').classList.add('active');
            });
        });
    }

    function updateAchievementsPanelContent() {
        var achievementsList = document.getElementById('achievements-list');
        var collectionList = document.getElementById('collection-list');

        achievementsList.innerHTML = '';
        Config.ACHIEVEMENTS.forEach(function (achievement) {
            var isUnlocked = state.achievements.indexOf(achievement.id) !== -1;
            var item = document.createElement('div');
            item.className = 'achievement-item ' + (isUnlocked ? 'unlocked' : 'locked');
            item.innerHTML = '<div class="achievement-icon">' + achievement.icon + '</div>' +
                '<div class="achievement-info">' +
                '<div class="achievement-name">' + achievement.name + '</div>' +
                '<div class="achievement-desc">' + achievement.description + '</div>' +
                '</div>' +
                '<div class="achievement-status">' + (isUnlocked ? '✓' : '🔒') + '</div>';
            achievementsList.appendChild(item);
        });

        collectionList.innerHTML = '';
        Config.COLLECTION_ITEMS.forEach(function (item) {
            var count = state.collection[item.id] || 0;
            var isCollected = count > 0;
            var el = document.createElement('div');
            el.className = 'collection-item ' + (isCollected ? 'collected' : 'locked');
            el.innerHTML = '<div class="collection-icon" style="' + (item.style || '') + '">' + item.emoji + '</div>' +
                '<div class="collection-name">' + item.name + '</div>' +
                '<div class="collection-count">' + (isCollected ? 'x' + count : '未收集') + '</div>' +
                '<div class="collection-desc">' + item.description + '</div>';
            collectionList.appendChild(el);
        });
    }

    function showTasksPanel() {
        var panel = document.getElementById('tasks-panel');
        if (!panel) {
            createTasksPanel();
            panel = document.getElementById('tasks-panel');
        }
        updateTasksPanelContent();
        panel.classList.remove('hidden');
    }

    function createTasksPanel() {
        var panel = document.createElement('div');
        panel.id = 'tasks-panel';
        panel.className = 'overlay-panel hidden';
        panel.innerHTML = '<div class="panel-content tasks-content">' +
            '<h2>📋 每日任务</h2>' +
            '<div id="tasks-list"></div>' +
            '<div class="panel-footer">' +
            '<span class="panel-coins">💰 金币: <span id="tasks-coins">0</span></span>' +
            '<button class="panel-close-btn">关闭</button>' +
            '</div></div>';
        document.body.appendChild(panel);

        panel.querySelector('.panel-close-btn').addEventListener('click', function () {
            panel.classList.add('hidden');
        });
    }

    function updateTasksPanelContent() {
        var list = document.getElementById('tasks-list');
        var coinsDisplay = document.getElementById('tasks-coins');
        if (!list) return;

        coinsDisplay.textContent = state.totalCoins;
        list.innerHTML = '';

        state.dailyTasks.forEach(function (task, index) {
            var progress = Math.min(task.progress, task.target);
            var percentage = Math.round((progress / task.target) * 100);

            var item = document.createElement('div');
            item.className = 'task-item ' + (task.completed ? 'completed' : '') + (task.claimed ? 'claimed' : '');
            item.innerHTML = '<div class="task-header">' +
                '<span class="task-title">任务 ' + (index + 1) + ': ' + task.description + '</span>' +
                '<span class="task-reward">💰 +' + task.reward + '</span>' +
                '</div>' +
                '<div class="task-progress-bar">' +
                '<div class="task-progress-fill" style="width: ' + percentage + '%"></div>' +
                '</div>' +
                '<div class="task-footer">' +
                '<span class="task-progress-text">' + progress + '/' + task.target + '</span>' +
                (task.claimed ? '<span class="claimed-badge">已领取</span>' :
                    task.completed ?
                        '<button class="claim-btn" data-index="' + index + '">领取奖励</button>' :
                        '<span class="in-progress-badge">进行中</span>') +
                '</div>';
            list.appendChild(item);
        });

        list.querySelectorAll('.claim-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var taskIndex = parseInt(this.dataset.index);
                claimTaskReward(taskIndex);
            });
        });
    }

    function claimTaskReward(index) {
        var task = state.dailyTasks[index];
        if (!task || !task.completed || task.claimed) return;

        task.claimed = true;
        state.totalCoins += task.reward;
        saveData();

        updateTasksPanelContent();
        updateMainMenuDisplay();
    }

    function updateScoreDisplay() {
        scoreValue.textContent = state.score;
        scoreValue.classList.remove('pop');
        void scoreValue.offsetWidth;
        scoreValue.classList.add('pop');
    }

    function updateLivesDisplay() {
        var hearts = '';
        for (var i = 0; i < Config.MAX_LIVES; i++) {
            hearts += i < state.lives ? '❤️' : '🖤';
        }
        livesHearts.textContent = hearts;
    }

    function updateTimerDisplay() {
        var minutes = Math.floor(state.timeLeft / 60);
        var seconds = state.timeLeft % 60;
        timerValue.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        timerValue.style.color = state.timeLeft <= 10 ? '#E74C3C' : '#FFD700';
    }

    function updateDifficultyDisplay() {
        difficultyValue.textContent = state.difficulty;
    }

    function updateCoinsDisplay() {
        if (coinValue) coinValue.textContent = state.totalCoins;
    }

    function updateFarmLevelDisplay() {
        if (farmLevelDisplay) farmLevelDisplay.textContent = state.farmLevel;
    }

    function onKeyDown(e) {
        if (state.gameMode === 'coop') {
            if (e.key === 'a' || e.key === 'A') {
                keys.p1Left = true;
                e.preventDefault();
            }
            if (e.key === 'd' || e.key === 'D') {
                keys.p1Right = true;
                e.preventDefault();
            }
            if (e.key === 'ArrowLeft') {
                keys.left = true;
                e.preventDefault();
            }
            if (e.key === 'ArrowRight') {
                keys.right = true;
                e.preventDefault();
            }
        } else {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                keys.left = true;
                mouseControlActive = false;
                e.preventDefault();
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                keys.right = true;
                mouseControlActive = false;
                e.preventDefault();
            }
        }

        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (state.isRunning) togglePause();
        }
    }

    function onKeyUp(e) {
        if (state.gameMode === 'coop') {
            if (e.key === 'a' || e.key === 'A') {
                keys.p1Left = false;
            }
            if (e.key === 'd' || e.key === 'D') {
                keys.p1Right = false;
            }
            if (e.key === 'ArrowLeft') {
                keys.left = false;
            }
            if (e.key === 'ArrowRight') {
                keys.right = false;
            }
        } else {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                keys.left = false;
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                keys.right = false;
            }
        }
    }

    function onMouseMove(e) {
        if (state.isRunning && !state.isPaused && state.gameMode === 'single') {
            mouseControlActive = true;
            mouseX = e.clientX;
        }
    }

    function onTouchStart(e) {
        if (state.isRunning && !state.isPaused && state.gameMode === 'single') {
            touchControlActive = true;
            mouseControlActive = true;
            mouseX = e.touches[0].clientX;
            e.preventDefault();
        }
    }

    function onTouchMove(e) {
        if (state.isRunning && !state.isPaused && state.gameMode === 'single') {
            mouseControlActive = true;
            mouseX = e.touches[0].clientX;
            e.preventDefault();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
