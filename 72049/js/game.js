(function () {
    'use strict';

    var VEHICLES = {
        sports: {
            id: 'sports',
            name: '霓虹跑车',
            type: '跑车',
            width: 55,
            height: 95,
            speed: 1.3,
            handling: 1.2,
            acceleration: 1.4,
            coinBonus: 1.0,
            price: 0,
            unlocked: true,
            color: '#00ffff',
            accent: '#ff00ff'
        },
        suv: {
            id: 'suv',
            name: '越野战车',
            type: '越野',
            width: 65,
            height: 105,
            speed: 0.85,
            handling: 0.9,
            acceleration: 0.8,
            coinBonus: 1.2,
            price: 5000,
            unlocked: false,
            color: '#00ff88',
            accent: '#ffcc00'
        },
        bike: {
            id: 'bike',
            name: '极速摩托',
            type: '摩托',
            width: 35,
            height: 75,
            speed: 1.5,
            handling: 1.5,
            acceleration: 1.6,
            coinBonus: 0.9,
            price: 8000,
            unlocked: false,
            color: '#ff00ff',
            accent: '#00ffff'
        }
    };

    var SCENES = {
        city: {
            id: 'city',
            name: '霓虹都市',
            description: '繁华都市夜景',
            bgTop: '#0a0a2e',
            bgBottom: '#1a1a4e',
            road: '#1a1a2e',
            roadEdge: '#2a2a4a',
            roadLine: '#ffffff',
            buildingColors: ['#00ffff', '#ff00ff', '#ffcc00'],
            particles: 'neon',
            weather: 'clear'
        },
        desert: {
            id: 'desert',
            name: '沙漠公路',
            description: '炎热沙漠荒野',
            bgTop: '#4a3000',
            bgBottom: '#8b6914',
            road: '#8b7355',
            roadEdge: '#a0826d',
            roadLine: '#ffffff',
            buildingColors: ['#cd853f', '#daa520'],
            particles: 'sand',
            weather: 'clear'
        },
        snow: {
            id: 'snow',
            name: '雪山高速',
            description: '冰雪世界',
            bgTop: '#1a3a5a',
            bgBottom: '#4a6a8a',
            road: '#2a4a6a',
            roadEdge: '#5a8aaa',
            roadLine: '#ffffff',
            buildingColors: ['#87ceeb', '#b0e0e6'],
            particles: 'snow',
            weather: 'snow'
        },
        rainyNight: {
            id: 'rainyNight',
            name: '雨夜追缉',
            description: '暴雨夜路',
            bgTop: '#050510',
            bgBottom: '#0a0a20',
            road: '#0f0f1f',
            roadEdge: '#1f1f3f',
            roadLine: '#4488ff',
            buildingColors: ['#0066cc', '#003366'],
            particles: 'rain',
            weather: 'rain'
        }
    };

    var POWERUPS = {
        magnet: {
            id: 'magnet',
            name: '磁铁',
            duration: 8000,
            color: '#ff00ff',
            icon: '🧲',
            effect: '吸引金币'
        },
        shield: {
            id: 'shield',
            name: '护盾',
            duration: 10000,
            color: '#00ffff',
            icon: '🛡️',
            effect: '免疫碰撞'
        },
        nitro: {
            id: 'nitro',
            name: '氮气',
            duration: 5000,
            color: '#ff6600',
            icon: '⚡',
            effect: '极速加速'
        },
        double: {
            id: 'double',
            name: '双倍金币',
            duration: 15000,
            color: '#ffcc00',
            icon: '✨',
            effect: '金币翻倍'
        }
    };

    var UPGRADES = {
        speed: { name: '极速', maxLevel: 5, baseCost: 500, costMultiplier: 1.8 },
        handling: { name: '操控', maxLevel: 5, baseCost: 500, costMultiplier: 1.8 },
        coinBonus: { name: '金币加成', maxLevel: 5, baseCost: 800, costMultiplier: 2.0 },
        armor: { name: '装甲', maxLevel: 3, baseCost: 1500, costMultiplier: 2.5 }
    };

    var DAILY_CHALLENGES = [
        { id: 'distance1', title: '行驶1000米', target: 1000, type: 'distance', reward: 500 },
        { id: 'coins1', title: '收集50个金币', target: 50, type: 'coins', reward: 300 },
        { id: 'score1', title: '获得5000分', target: 5000, type: 'score', reward: 400 },
        { id: 'dodge1', title: '躲避20辆车', target: 20, type: 'dodge', reward: 200 },
        { id: 'powerup1', title: '使用5个道具', target: 5, type: 'powerup', reward: 350 }
    ];

    var Game = {
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        roadWidth: 0,
        roadX: 0,
        laneWidth: 0,
        laneCenters: [],
        running: false,
        paused: false,
        state: 'menu',
        lastTime: 0,
        deltaTime: 0,
        speed: 4,
        baseSpeed: 4,
        maxSpeed: 12,
        roadOffset: 0,
        score: 0,
        distance: 0,
        coins: 0,
        totalCoins: 0,
        lives: 3,
        maxLives: 3,
        player: null,
        obstacles: [],
        coinItems: [],
        powerupItems: [],
        particles: [],
        weatherParticles: [],
        buildings: [],
        lastObstacleSpawn: 0,
        lastCoinSpawn: 0,
        lastPowerupSpawn: 0,
        collisionCooldown: 0,
        touchStartX: 0,
        touchStartY: 0,

        selectedVehicle: 'sports',
        selectedScene: 'city',
        vehicleUpgrades: {},
        activePowerups: {},
        wantedLevel: 0,
        policeCars: [],
        lastPoliceSpawn: 0,
        dodgeCount: 0,
        powerupCount: 0,

        leaderboard: { score: [], distance: [], coins: [] },
        dailyProgress: {},
        lastDailyReset: 0,

        init: function () {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.loadSaveData();
            this.resize();
            window.addEventListener('resize', this.resize.bind(this));
            this.setupInput();
            this.setupUI();
            this.setupMenuNavigation();
            this.initWeatherParticles();
            this.initBuildings();
            this.updateHUDSize();
            this.loop(performance.now());
        },

        loadSaveData: function () {
            try {
                var data = localStorage.getItem('neonHighwaySave');
                if (data) {
                    var save = JSON.parse(data);
                    this.totalCoins = isNaN(save.totalCoins) ? 0 : (save.totalCoins || 0);
                    this.selectedVehicle = save.selectedVehicle || 'sports';
                    this.selectedScene = save.selectedScene || 'city';
                    this.vehicleUpgrades = typeof save.vehicleUpgrades === 'object' ? save.vehicleUpgrades : {};
                    if (save.unlockedVehicles && typeof save.unlockedVehicles === 'object') {
                        for (var vid in save.unlockedVehicles) {
                            if (VEHICLES[vid]) VEHICLES[vid].unlocked = save.unlockedVehicles[vid];
                        }
                    }
                    this.leaderboard = typeof save.leaderboard === 'object' ? save.leaderboard : { score: [], distance: [], coins: [] };
                    this.dailyProgress = typeof save.dailyProgress === 'object' ? save.dailyProgress : {};
                    this.lastDailyReset = isNaN(save.lastDailyReset) ? Date.now() : (save.lastDailyReset || Date.now());
                }
            } catch (e) {
                console.error('加载存档失败', e);
                this.totalCoins = 0;
                this.vehicleUpgrades = {};
                this.leaderboard = { score: [], distance: [], coins: [] };
                this.dailyProgress = {};
                this.lastDailyReset = Date.now();
            }
            try {
                this.checkDailyReset();
            } catch (e) {
                console.error('检查每日重置失败', e);
                this.dailyProgress = {};
                this.lastDailyReset = Date.now();
            }
        },

        saveData: function () {
            try {
                var unlocked = {};
                for (var vid in VEHICLES) unlocked[vid] = VEHICLES[vid].unlocked;
                var data = {
                    totalCoins: this.totalCoins,
                    selectedVehicle: this.selectedVehicle,
                    selectedScene: this.selectedScene,
                    vehicleUpgrades: this.vehicleUpgrades,
                    unlockedVehicles: unlocked,
                    leaderboard: this.leaderboard,
                    dailyProgress: this.dailyProgress,
                    lastDailyReset: this.lastDailyReset
                };
                localStorage.setItem('neonHighwaySave', JSON.stringify(data));
            } catch (e) { console.error('保存失败', e); }
        },

        checkDailyReset: function () {
            var now = Date.now();
            var oneDay = 24 * 60 * 60 * 1000;
            var lastReset = new Date(this.lastDailyReset);
            var today = new Date();
            if (lastReset.toDateString() !== today.toDateString()) {
                this.dailyProgress = {};
                this.lastDailyReset = now;
                this.saveData();
            }
        },

        resize: function () {
            var maxWidth = Math.min(480, window.innerWidth);
            var maxHeight = Math.min(800, window.innerHeight);
            var aspectRatio = 9 / 16;
            var w = maxWidth;
            var h = w / aspectRatio;
            if (h > maxHeight) {
                h = maxHeight;
                w = h * aspectRatio;
            }
            this.width = w;
            this.height = h;
            this.canvas.width = w;
            this.canvas.height = h;
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
            this.roadWidth = this.width * 0.85;
            this.roadX = (this.width - this.roadWidth) / 2;
            this.laneWidth = this.roadWidth / 3;
            this.laneCenters = [];
            for (var i = 0; i < 3; i++) {
                this.laneCenters.push(this.roadX + this.laneWidth * (i + 0.5));
            }
            if (this.player) {
                this.player.targetLane = Math.min(this.player.targetLane, 2);
                this.player.lane = Math.min(this.player.lane, 2);
                this.player.startLane = Math.min(this.player.startLane, 2);
                if (this.player.laneChangeProgress < 1) {
                    var t = this.easeInOut(this.player.laneChangeProgress);
                    var startX = this.laneCenters[this.player.startLane];
                    var endX = this.laneCenters[this.player.targetLane];
                    this.player.x = startX + (endX - startX) * t;
                } else {
                    this.player.x = this.laneCenters[this.player.lane];
                }
                this.player.y = this.height - this.player.height - 40;
            }
            this.initBuildings();
            this.updateHUDSize();
        },

        updateHUDSize: function () {
            var hud = document.getElementById('hud');
            hud.style.width = this.width + 'px';
            hud.style.transform = 'translateX(-50%)';
        },

        initWeatherParticles: function () {
            this.weatherParticles = [];
            var scene = SCENES[this.selectedScene];
            if (!scene) return;
            if (scene.particles === 'rain') {
                for (var i = 0; i < 60; i++) {
                    this.weatherParticles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        length: 15 + Math.random() * 20,
                        speed: 15 + Math.random() * 10
                    });
                }
            } else if (scene.particles === 'snow') {
                for (var j = 0; j < 40; j++) {
                    this.weatherParticles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        size: 2 + Math.random() * 4,
                        speed: 1 + Math.random() * 2,
                        wobble: Math.random() * Math.PI * 2
                    });
                }
            } else if (scene.particles === 'sand') {
                for (var k = 0; k < 30; k++) {
                    this.weatherParticles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        size: 1 + Math.random() * 3,
                        speed: 3 + Math.random() * 5,
                        alpha: 0.3 + Math.random() * 0.3
                    });
                }
            }
        },

        initBuildings: function () {
            this.buildings = [];
            var scene = SCENES[this.selectedScene];
            if (!scene) return;
            for (var side = 0; side < 2; side++) {
                var buildings = [];
                var y = -100;
                while (y < this.height + 200) {
                    var h = 60 + Math.random() * 120;
                    var w = 30 + Math.random() * 40;
                    buildings.push({
                        x: side === 0 ? this.roadX - w - 5 - Math.random() * 30 : this.roadX + this.roadWidth + 5 + Math.random() * 30,
                        y: y,
                        width: w,
                        height: h,
                        color: scene.buildingColors[Math.floor(Math.random() * scene.buildingColors.length)],
                        windows: Math.floor(Math.random() * 6) + 2
                    });
                    y += h + 20 + Math.random() * 40;
                }
                this.buildings.push(buildings);
            }
        },

        setupInput: function () {
            var self = this;
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    if (self.state === 'playing') self.togglePause();
                    return;
                }
                if (self.state !== 'playing') return;
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    self.moveLeft();
                    e.preventDefault();
                } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    self.moveRight();
                    e.preventDefault();
                }
            });
            this.canvas.addEventListener('touchstart', function (e) {
                self.touchStartX = e.touches[0].clientX;
                self.touchStartY = e.touches[0].clientY;
                e.preventDefault();
            }, { passive: false });
            this.canvas.addEventListener('touchend', function (e) {
                if (self.state !== 'playing') return;
                var touch = e.changedTouches[0];
                var dx = touch.clientX - self.touchStartX;
                var dy = touch.clientY - self.touchStartY;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
                    if (dx > 0) {
                        self.moveRight();
                    } else {
                        self.moveLeft();
                    }
                }
                e.preventDefault();
            }, { passive: false });
        },

        setupUI: function () {
            var self = this;
            document.getElementById('startBtn').addEventListener('click', function () {
                self.startGame();
            });
            document.getElementById('restartBtn').addEventListener('click', function () {
                self.startGame();
            });
            document.getElementById('mainMenuBtn').addEventListener('click', function () {
                self.showMainMenu();
            });
            document.getElementById('resumeBtn').addEventListener('click', function () {
                self.togglePause();
            });
            document.getElementById('quitBtn').addEventListener('click', function () {
                self.showMainMenu();
            });
        },

        setupMenuNavigation: function () {
            var self = this;
            document.getElementById('playBtn').addEventListener('click', function () {
                self.showScreen('vehicleSelectScreen');
                self.renderVehicleSelection();
            });
            document.getElementById('garageBtn').addEventListener('click', function () {
                self.showScreen('garageScreen');
                self.renderGarage();
            });
            document.getElementById('leaderboardBtn').addEventListener('click', function () {
                self.showScreen('leaderboardScreen');
                self.renderLeaderboard('score');
            });
            document.getElementById('dailyBtn').addEventListener('click', function () {
                self.showScreen('dailyChallengeScreen');
                self.renderDailyChallenges();
            });

            document.getElementById('vehicleBackBtn').addEventListener('click', function () {
                self.showScreen('mainMenuScreen');
            });
            document.getElementById('vehicleConfirmBtn').addEventListener('click', function () {
                self.showScreen('sceneSelectScreen');
                self.renderSceneSelection();
            });

            document.getElementById('sceneBackBtn').addEventListener('click', function () {
                self.showScreen('vehicleSelectScreen');
                self.renderVehicleSelection();
            });
            document.getElementById('sceneConfirmBtn').addEventListener('click', function () {
                self.saveData();
                self.startGame();
            });

            document.getElementById('garageBackBtn').addEventListener('click', function () {
                self.showScreen('mainMenuScreen');
            });

            document.getElementById('leaderboardBackBtn').addEventListener('click', function () {
                self.showScreen('mainMenuScreen');
            });
            document.querySelectorAll('.tab-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    self.renderLeaderboard(btn.dataset.tab);
                });
            });

            document.getElementById('dailyBackBtn').addEventListener('click', function () {
                self.showScreen('mainMenuScreen');
            });
        },

        showScreen: function (screenId) {
            document.querySelectorAll('.overlay').forEach(function (o) { o.classList.add('hidden'); });
            document.getElementById(screenId).classList.remove('hidden');
            this.state = 'menu';
        },

        showMainMenu: function () {
            this.showScreen('mainMenuScreen');
        },

        renderVehicleSelection: function () {
            var grid = document.getElementById('vehicleGrid');
            var stats = document.getElementById('vehicleStats');
            grid.innerHTML = '';
            var self = this;
            for (var vid in VEHICLES) {
                var v = VEHICLES[vid];
                var card = document.createElement('div');
                card.className = 'vehicle-card';
                if (vid === this.selectedVehicle) card.classList.add('selected');
                if (!v.unlocked) card.classList.add('locked');
                card.innerHTML = '<div class="vehicle-preview" style="background: linear-gradient(135deg, ' + v.color + ', ' + v.accent + '); box-shadow: 0 0 20px ' + v.color + ';"></div>' +
                    '<div class="vehicle-name">' + v.name + '</div>' +
                    '<div class="vehicle-type">' + v.type + '</div>' +
                    (v.price > 0 && !v.unlocked ? '<div class="vehicle-type" style="color:#ffcc00;">💰 ' + v.price + '</div>' : '');
                card.addEventListener('click', function () {
                    if (!v.unlocked) {
                        if (self.totalCoins >= v.price) {
                            if (confirm('花费 ' + v.price + ' 金币解锁 ' + v.name + '?')) {
                                self.totalCoins -= v.price;
                                v.unlocked = true;
                                self.saveData();
                                self.renderVehicleSelection();
                            }
                        } else {
                            alert('金币不足！需要 ' + v.price + ' 金币');
                        }
                        return;
                    }
                    self.selectedVehicle = vid;
                    self.saveData();
                    self.renderVehicleSelection();
                });
                grid.appendChild(card);
            }
            var sv = VEHICLES[this.selectedVehicle];
            var upgrades = this.vehicleUpgrades[this.selectedVehicle] || {};
            var speedBonus = (upgrades.speed || 0) * 0.1;
            var handlingBonus = (upgrades.handling || 0) * 0.1;
            var coinBonusVal = (upgrades.coinBonus || 0) * 0.15;
            stats.innerHTML = '<div class="stat-item"><span class="stat-label">速度</span><div class="stat-bar"><div class="stat-bar-fill" style="width:' + (sv.speed * 60 + speedBonus * 60) + '%;"></div></div></div>' +
                '<div class="stat-item"><span class="stat-label">操控</span><div class="stat-bar"><div class="stat-bar-fill" style="width:' + (sv.handling * 60 + handlingBonus * 60) + '%;"></div></div></div>' +
                '<div class="stat-item"><span class="stat-label">金币加成</span><div class="stat-bar"><div class="stat-bar-fill" style="width:' + ((sv.coinBonus + coinBonusVal) * 60) + '%;"></div></div></div>';
        },

        renderSceneSelection: function () {
            var grid = document.getElementById('sceneGrid');
            grid.innerHTML = '';
            var self = this;
            for (var sid in SCENES) {
                var s = SCENES[sid];
                var card = document.createElement('div');
                card.className = 'scene-card';
                if (sid === this.selectedScene) card.classList.add('selected');
                card.innerHTML = '<div class="scene-preview" style="background: linear-gradient(180deg, ' + s.bgTop + ', ' + s.bgBottom + ');"></div>' +
                    '<div class="scene-name">' + s.name + '</div>' +
                    '<div class="scene-description">' + s.description + '</div>';
                card.addEventListener('click', function () {
                    self.selectedScene = sid;
                    self.saveData();
                    self.initWeatherParticles();
                    self.initBuildings();
                    self.renderSceneSelection();
                });
                grid.appendChild(card);
            }
        },

        renderGarage: function () {
            var display = document.getElementById('garageVehicleDisplay');
            var panel = document.getElementById('upgradePanel');
            document.getElementById('garageCoinsValue').textContent = this.totalCoins;
            var v = VEHICLES[this.selectedVehicle];
            display.innerHTML = '<div style="text-align:center;"><div style="width:80px;height:120px;margin:0 auto 16px;background:linear-gradient(135deg,' + v.color + ',' + v.accent + ');border-radius:12px;box-shadow:0 0 30px ' + v.color + ';"></div>' +
                '<div style="font-size:18px;font-weight:700;color:' + v.color + ';text-shadow:0 0 10px ' + v.color + ';">' + v.name + '</div></div>';
            var upgrades = this.vehicleUpgrades[this.selectedVehicle] = this.vehicleUpgrades[this.selectedVehicle] || {};
            panel.innerHTML = '';
            var self = this;
            for (var uid in UPGRADES) {
                var u = UPGRADES[uid];
                var level = upgrades[uid] || 0;
                var cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, level));
                var isMax = level >= u.maxLevel;
                var item = document.createElement('div');
                item.className = 'upgrade-item';
                item.innerHTML = '<div class="upgrade-header"><span class="upgrade-name">' + u.name + '</span><span class="upgrade-level">Lv.' + level + '/' + u.maxLevel + '</span></div>' +
                    '<div class="upgrade-controls">' +
                    '<button class="upgrade-btn" data-uid="' + uid + '" ' + (isMax || this.totalCoins < cost ? 'disabled' : '') + '>+</button>' +
                    '<span class="upgrade-cost">' + (isMax ? 'MAX' : '💰 ' + cost) + '</span>' +
                    '</div>';
                panel.appendChild(item);
            }
            panel.querySelectorAll('.upgrade-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var uid = btn.dataset.uid;
                    var u = UPGRADES[uid];
                    var level = upgrades[uid] || 0;
                    var cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, level));
                    if (level < u.maxLevel && self.totalCoins >= cost) {
                        self.totalCoins -= cost;
                        upgrades[uid] = level + 1;
                        self.saveData();
                        self.renderGarage();
                    }
                });
            });
        },

        renderLeaderboard: function (type) {
            var list = document.getElementById('leaderboardList');
            var data = this.leaderboard[type] || [];
            if (data.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px;">暂无记录</div>';
                return;
            }
            var labels = { score: '分', distance: 'm', coins: '💰' };
            list.innerHTML = '';
            for (var i = 0; i < Math.min(data.length, 10); i++) {
                var entry = data[i];
                var rankClass = '';
                if (i === 0) rankClass = 'gold';
                else if (i === 1) rankClass = 'silver';
                else if (i === 2) rankClass = 'bronze';
                var div = document.createElement('div');
                div.className = 'leaderboard-entry';
                div.innerHTML = '<div class="leaderboard-rank ' + rankClass + '">' + (i + 1) + '</div>' +
                    '<div class="leaderboard-value">' + Math.floor(entry.value) + labels[type] + '</div>';
                list.appendChild(div);
            }
        },

        renderDailyChallenges: function () {
            var list = document.getElementById('dailyChallengeList');
            var resetTime = document.getElementById('dailyResetTime');
            list.innerHTML = '';
            var now = Date.now();
            var tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            var msUntilReset = tomorrow.getTime() - now;
            var hours = Math.floor(msUntilReset / 3600000);
            var minutes = Math.floor((msUntilReset % 3600000) / 60000);
            resetTime.textContent = '重置时间: ' + hours + '小时' + minutes + '分钟后';

            for (var i = 0; i < DAILY_CHALLENGES.length; i++) {
                var c = DAILY_CHALLENGES[i];
                var progress = this.dailyProgress[c.id] || { value: 0, completed: false };
                var pct = Math.min(progress.value / c.target, 1);
                var item = document.createElement('div');
                item.className = 'daily-challenge-item';
                if (progress.completed) item.classList.add('completed');
                item.innerHTML = '<div class="challenge-header"><span class="challenge-title">' + c.title + '</span><span class="challenge-reward">💰' + c.reward + '</span></div>' +
                    '<div class="challenge-progress"><div class="challenge-progress-fill" style="width:' + (pct * 100) + '%;"></div></div>' +
                    '<div class="challenge-text">' + Math.floor(progress.value) + '/' + c.target + (progress.completed ? ' - 已完成!' : '') + '</div>';
                list.appendChild(item);
            }
        },

        startGame: function () {
            this.state = 'playing';
            this.running = true;
            this.score = 0;
            this.distance = 0;
            this.coins = 0;
            this.lives = 3;
            this.maxLives = 3;
            this.speed = 4;
            this.baseSpeed = 4;
            this.wantedLevel = 0;
            this.dodgeCount = 0;
            this.powerupCount = 0;
            this.currentSessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.obstacles = [];
            this.coinItems = [];
            this.powerupItems = [];
            this.particles = [];
            this.policeCars = [];
            this.activePowerups = {};
            this.lastObstacleSpawn = 0;
            this.lastCoinSpawn = 0;
            this.lastPowerupSpawn = 0;
            this.lastPoliceSpawn = 0;
            this.collisionCooldown = 0;
            this.roadOffset = 0;
            var v = VEHICLES[this.selectedVehicle];
            var upgrades = this.vehicleUpgrades[this.selectedVehicle] || {};
            var armorBonus = (upgrades.armor || 0) * 1;
            this.maxLives = 3 + armorBonus;
            this.lives = this.maxLives;
            this.player = {
                lane: 1,
                targetLane: 1,
                laneChangeProgress: 1,
                startLane: 1,
                laneChangeStart: 0,
                x: this.laneCenters[1],
                y: this.height - v.height - 40,
                flashing: 0,
                width: v.width,
                height: v.height,
                vehicle: v,
                upgrades: upgrades
            };
            document.querySelectorAll('.overlay').forEach(function (o) { o.classList.add('hidden'); });
            this.updateLivesUI();
            this.updateWantedDisplay();
            this.updatePowerupDisplay();
        },

        gameOver: function () {
            this.state = 'gameover';
            this.running = false;
            var isNewRecord = this.addToLeaderboard('score', this.score);
            this.addToLeaderboard('distance', this.distance);
            this.addToLeaderboard('coins', this.coins);
            this.totalCoins += this.coins;
            this.updateDailyChallengeProgress();
            this.saveData();
            document.getElementById('finalScore').textContent = Math.floor(this.score);
            document.getElementById('finalDistance').textContent = Math.floor(this.distance) + 'm';
            document.getElementById('finalCoins').textContent = this.coins;
            document.getElementById('newRecordRow').style.display = isNewRecord ? 'flex' : 'none';
            document.getElementById('gameOverScreen').classList.remove('hidden');
        },

        addToLeaderboard: function (type, value) {
            if (!this.leaderboard[type]) this.leaderboard[type] = [];
            var list = this.leaderboard[type];
            var entry = { value: value, date: Date.now() };
            list.push(entry);
            list.sort(function (a, b) { return b.value - a.value; });
            if (list.length > 10) list.length = 10;
            return list[0].value === value;
        },

        updateDailyChallengeProgress: function () {
            this.checkDailyReset();
            if (!this.currentSessionId) return;
            var sessionKey = 's_' + this.currentSessionId;
            if (this.dailyProgress[sessionKey]) return;
            this.dailyProgress[sessionKey] = true;
            var challenges = [
                { type: 'distance', value: this.distance },
                { type: 'coins', value: this.coins },
                { type: 'score', value: this.score },
                { type: 'dodge', value: this.dodgeCount },
                { type: 'powerup', value: this.powerupCount }
            ];
            for (var i = 0; i < DAILY_CHALLENGES.length; i++) {
                var c = DAILY_CHALLENGES[i];
                var prog = this.dailyProgress[c.id] || { value: 0, completed: false };
                for (var j = 0; j < challenges.length; j++) {
                    if (challenges[j].type === c.type) {
                        prog.value = Math.min(prog.value + challenges[j].value, c.target * 2);
                        if (prog.value >= c.target && !prog.completed) {
                            prog.completed = true;
                            this.totalCoins += c.reward;
                        }
                    }
                }
                this.dailyProgress[c.id] = prog;
            }
        },

        togglePause: function () {
            if (this.state === 'playing') {
                this.state = 'paused';
                this.paused = true;
                document.getElementById('pauseScreen').classList.remove('hidden');
            } else if (this.state === 'paused') {
                this.state = 'playing';
                this.paused = false;
                document.getElementById('pauseScreen').classList.add('hidden');
            }
        },

        moveLeft: function () {
            if (this.player.targetLane > 0 && this.player.laneChangeProgress >= 1) {
                this.player.startLane = this.player.targetLane;
                this.player.targetLane--;
                this.player.laneChangeStart = performance.now();
                this.player.laneChangeProgress = 0;
            }
        },

        moveRight: function () {
            if (this.player.targetLane < 2 && this.player.laneChangeProgress >= 1) {
                this.player.startLane = this.player.targetLane;
                this.player.targetLane++;
                this.player.laneChangeStart = performance.now();
                this.player.laneChangeProgress = 0;
            }
        },

        loop: function (currentTime) {
            var self = this;
            this.deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            if (this.state === 'playing') {
                this.update(currentTime);
            }
            this.render();
            requestAnimationFrame(function (t) { self.loop(t); });
        },

        update: function (currentTime) {
            var dt = Math.min(this.deltaTime, 50);
            var v = this.player.vehicle;
            var upgrades = this.player.upgrades;
            var speedMult = v.speed * (1 + (upgrades.speed || 0) * 0.1);
            if (this.activePowerups.nitro) speedMult *= 1.5;
            if (this.speed < this.maxSpeed * speedMult) {
                this.speed += 0.0008 * speedMult * dt;
            }
            this.roadOffset += this.speed * dt * 0.1;
            if (this.roadOffset > 130) this.roadOffset -= 130;
            this.distance += this.speed * dt * 0.002;
            this.score += 0.1 * this.speed * dt * 0.01;
            this.updatePlayer(dt);
            this.spawnObstacles(currentTime);
            this.spawnCoins(currentTime);
            this.spawnPowerups(currentTime);
            this.updatePolice(dt, currentTime);
            this.updateObstacles(dt);
            this.updateCoins(dt);
            this.updatePowerups(dt);
            this.updateParticles(dt);
            this.updateWeather(dt);
            this.updateBuildings(dt);
            this.checkCollisions();
            if (this.collisionCooldown > 0) this.collisionCooldown -= dt;
            this.updatePowerupTimers(dt);
            this.updateHUD();
        },

        updatePlayer: function (dt) {
            if (this.player.laneChangeProgress < 1) {
                var elapsed = performance.now() - this.player.laneChangeStart;
                var v = this.player.vehicle;
                var upgrades = this.player.upgrades;
                var handlingMult = v.handling * (1 + (upgrades.handling || 0) * 0.1);
                var duration = 250 / handlingMult;
                this.player.laneChangeProgress = Math.min(elapsed / duration, 1);
                var t = this.easeInOut(this.player.laneChangeProgress);
                var startX = this.laneCenters[this.player.startLane];
                var endX = this.laneCenters[this.player.targetLane];
                this.player.x = startX + (endX - startX) * t;
                if (this.player.laneChangeProgress >= 1) {
                    this.player.lane = this.player.targetLane;
                }
            }
            if (this.player.flashing > 0) this.player.flashing -= dt;
        },

        easeInOut: function (t) {
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        },

        spawnObstacles: function (currentTime) {
            var interval = Math.max(600, 1500 - this.speed * 80);
            if (currentTime - this.lastObstacleSpawn > interval) {
                this.lastObstacleSpawn = currentTime;
                var lane = Math.floor(Math.random() * 3);
                var type = Math.random() < 0.7 ? 'car' : 'barrier';
                this.obstacles.push({
                    lane: lane,
                    x: this.laneCenters[lane],
                    y: -100,
                    type: type,
                    width: type === 'barrier' ? 55 : 55,
                    height: type === 'barrier' ? 40 : 95,
                    speed: type === 'car' ? this.speed * 0.3 : 0,
                    passed: false
                });
            }
        },

        spawnCoins: function (currentTime) {
            if (currentTime - this.lastCoinSpawn > 2000) {
                this.lastCoinSpawn = currentTime;
                var lane = Math.floor(Math.random() * 3);
                this.coinItems.push({
                    lane: lane,
                    x: this.laneCenters[lane],
                    y: -30,
                    rotation: 0,
                    collected: false
                });
            }
        },

        spawnPowerups: function (currentTime) {
            if (currentTime - this.lastPowerupSpawn > 8000 && Math.random() < 0.6) {
                this.lastPowerupSpawn = currentTime;
                var lane = Math.floor(Math.random() * 3);
                var types = ['magnet', 'shield', 'nitro', 'double'];
                var type = types[Math.floor(Math.random() * types.length)];
                this.powerupItems.push({
                    lane: lane,
                    x: this.laneCenters[lane],
                    y: -40,
                    type: type,
                    rotation: 0
                });
            }
        },

        updatePolice: function (dt, currentTime) {
            if (this.wantedLevel > 0) {
                var policeInterval = Math.max(3000, 8000 - this.wantedLevel * 1000);
                if (currentTime - this.lastPoliceSpawn > policeInterval && this.policeCars.length < this.wantedLevel) {
                    this.lastPoliceSpawn = currentTime;
                    var lane = Math.floor(Math.random() * 3);
                    this.policeCars.push({
                        lane: lane,
                        x: this.laneCenters[lane],
                        y: -120,
                        width: 55,
                        height: 100,
                        speed: this.speed * 0.6,
                        siren: 0
                    });
                }
                for (var i = this.policeCars.length - 1; i >= 0; i--) {
                    var p = this.policeCars[i];
                    p.y += (this.speed - p.speed) * dt * 0.1;
                    p.siren += dt * 0.01;
                    if (p.y > this.height + 50) {
                        this.policeCars.splice(i, 1);
                    }
                }
                if (this.wantedLevel > 0 && Math.random() < 0.0005 * dt) {
                    this.wantedLevel = Math.max(0, this.wantedLevel - 1);
                    this.updateWantedDisplay();
                }
            }
        },

        updateObstacles: function (dt) {
            var moveAmount = this.speed * dt * 0.12;
            for (var i = this.obstacles.length - 1; i >= 0; i--) {
                var obs = this.obstacles[i];
                obs.y += moveAmount + obs.speed * dt * 0.1;
                if (!obs.passed && obs.y > this.player.y + 50) {
                    obs.passed = true;
                    this.dodgeCount++;
                    if (this.wantedLevel > 0 && Math.random() < 0.1) {
                        this.wantedLevel = Math.min(5, this.wantedLevel + 1);
                        this.updateWantedDisplay();
                    }
                }
                if (obs.y > this.height + 50) {
                    this.obstacles.splice(i, 1);
                }
            }
        },

        updateCoins: function (dt) {
            var moveAmount = this.speed * dt * 0.12;
            for (var i = this.coinItems.length - 1; i >= 0; i--) {
                var coin = this.coinItems[i];
                coin.y += moveAmount;
                coin.rotation += dt * 0.005;
                if (this.activePowerups.magnet) {
                    var dx = this.player.x - coin.x;
                    var dy = this.player.y - coin.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        coin.x += dx * 0.08;
                        coin.y += dy * 0.08;
                    }
                }
                if (coin.y > this.height + 50 || coin.collected) {
                    this.coinItems.splice(i, 1);
                }
            }
        },

        updatePowerups: function (dt) {
            var moveAmount = this.speed * dt * 0.12;
            for (var i = this.powerupItems.length - 1; i >= 0; i--) {
                var p = this.powerupItems[i];
                p.y += moveAmount;
                p.rotation += dt * 0.003;
                if (p.y > this.height + 50 || p.collected) {
                    this.powerupItems.splice(i, 1);
                }
            }
        },

        updateParticles: function (dt) {
            for (var i = this.particles.length - 1; i >= 0; i--) {
                var p = this.particles[i];
                p.x += p.vx * dt * 0.05;
                p.y += p.vy * dt * 0.05;
                p.life -= dt * 0.002;
                p.alpha = Math.max(0, p.life);
                if (p.life <= 0) this.particles.splice(i, 1);
            }
        },

        updateWeather: function (dt) {
            var scene = SCENES[this.selectedScene];
            if (!scene) return;
            if (scene.particles === 'rain') {
                for (var i = 0; i < this.weatherParticles.length; i++) {
                    var r = this.weatherParticles[i];
                    r.y += r.speed * dt * 0.3;
                    r.x -= r.speed * dt * 0.05;
                    if (r.y > this.height) {
                        r.y = -20;
                        r.x = Math.random() * this.width;
                    }
                    if (r.x < 0) r.x = this.width;
                }
            } else if (scene.particles === 'snow') {
                for (var j = 0; j < this.weatherParticles.length; j++) {
                    var s = this.weatherParticles[j];
                    s.y += s.speed * dt * 0.2;
                    s.wobble += dt * 0.002;
                    s.x += Math.sin(s.wobble) * 0.5;
                    if (s.y > this.height) {
                        s.y = -10;
                        s.x = Math.random() * this.width;
                    }
                }
            } else if (scene.particles === 'sand') {
                for (var k = 0; k < this.weatherParticles.length; k++) {
                    var sd = this.weatherParticles[k];
                    sd.y += sd.speed * dt * 0.15;
                    sd.x -= sd.speed * dt * 0.1;
                    if (sd.y > this.height) {
                        sd.y = -10;
                        sd.x = Math.random() * this.width;
                    }
                }
            }
        },

        updateBuildings: function (dt) {
            var moveAmount = this.speed * dt * 0.1;
            for (var side = 0; side < 2; side++) {
                var buildings = this.buildings[side];
                for (var i = 0; i < buildings.length; i++) {
                    buildings[i].y += moveAmount;
                    if (buildings[i].y > this.height + 100) {
                        var minY = Math.min.apply(null, buildings.map(function (b) { return b.y; }));
                        buildings[i].y = minY - buildings[i].height - 20 - Math.random() * 40;
                        buildings[i].windows = Math.floor(Math.random() * 6) + 2;
                    }
                }
            }
        },

        updatePowerupTimers: function (dt) {
            var changed = false;
            for (var id in this.activePowerups) {
                this.activePowerups[id] -= dt;
                if (this.activePowerups[id] <= 0) {
                    delete this.activePowerups[id];
                    changed = true;
                }
            }
            if (changed) this.updatePowerupDisplay();
        },

        checkCollisions: function () {
            if (this.collisionCooldown > 0) return;
            var px = this.player.x;
            var py = this.player.y;
            var pw = this.player.width * 0.6;
            var ph = this.player.height * 0.6;
            if (this.activePowerups.shield) return;
            for (var i = 0; i < this.obstacles.length; i++) {
                var obs = this.obstacles[i];
                var ow = obs.width * 0.7;
                var oh = obs.height * 0.7;
                if (this.rectOverlap(px, py, pw, ph, obs.x, obs.y, ow, oh)) {
                    this.onCollision(obs);
                    return;
                }
            }
            for (var j = 0; j < this.policeCars.length; j++) {
                var pol = this.policeCars[j];
                var pw2 = pol.width * 0.7;
                var ph2 = pol.height * 0.7;
                if (this.rectOverlap(px, py, pw, ph, pol.x, pol.y, pw2, ph2)) {
                    this.onPoliceCollision(pol);
                    return;
                }
            }
            for (var k = 0; k < this.coinItems.length; k++) {
                var coin = this.coinItems[k];
                if (coin.collected) continue;
                var cs = 30 * 0.8;
                if (this.rectOverlap(px, py, pw, ph, coin.x, coin.y, cs, cs)) {
                    this.onCoinCollect(coin);
                }
            }
            for (var m = 0; m < this.powerupItems.length; m++) {
                var pu = this.powerupItems[m];
                if (pu.collected) continue;
                var ps = 35 * 0.8;
                if (this.rectOverlap(px, py, pw, ph, pu.x, pu.y, ps, ps)) {
                    this.onPowerupCollect(pu);
                }
            }
        },

        rectOverlap: function (x1, y1, w1, h1, x2, y2, w2, h2) {
            return Math.abs(x1 - x2) < (w1 + w2) / 2 && Math.abs(y1 - y2) < (h1 + h2) / 2;
        },

        onCollision: function (obs) {
            this.lives--;
            this.collisionCooldown = 1500;
            this.speed = Math.max(2, this.speed * 0.5);
            this.player.flashing = 1500;
            this.spawnCollisionParticles(obs.x, obs.y);
            this.updateLivesUI();
            var idx = this.obstacles.indexOf(obs);
            if (idx > -1) this.obstacles.splice(idx, 1);
            if (this.wantedLevel > 0) {
                this.wantedLevel = Math.min(5, this.wantedLevel + 1);
                this.updateWantedDisplay();
            }
            if (this.lives <= 0) this.gameOver();
        },

        onPoliceCollision: function (pol) {
            this.lives -= 2;
            this.collisionCooldown = 1500;
            this.speed = Math.max(2, this.speed * 0.3);
            this.player.flashing = 1500;
            this.spawnCollisionParticles(pol.x, pol.y);
            this.updateLivesUI();
            var idx = this.policeCars.indexOf(pol);
            if (idx > -1) this.policeCars.splice(idx, 1);
            if (this.lives <= 0) this.gameOver();
        },

        onCoinCollect: function (coin) {
            coin.collected = true;
            var v = this.player.vehicle;
            var upgrades = this.player.upgrades;
            var coinMult = v.coinBonus * (1 + (upgrades.coinBonus || 0) * 0.15);
            if (this.activePowerups.double) coinMult *= 2;
            var coinsGained = Math.ceil(1 * coinMult);
            this.coins += coinsGained;
            this.score += 10 * coinsGained;
            this.spawnCoinParticles(coin.x, coin.y);
        },

        onPowerupCollect: function (pu) {
            pu.collected = true;
            var powerup = POWERUPS[pu.type];
            this.activePowerups[pu.type] = powerup.duration;
            this.powerupCount++;
            this.updatePowerupDisplay();
            this.spawnPowerupParticles(pu.x, pu.y, powerup.color);
        },

        spawnCollisionParticles: function (x, y) {
            for (var i = 0; i < 12; i++) {
                var angle = (Math.PI * 2 * i) / 12;
                var speed = 2 + Math.random() * 3;
                this.particles.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1, alpha: 1,
                    color: '#ff3366',
                    size: 4 + Math.random() * 4
                });
            }
        },

        spawnCoinParticles: function (x, y) {
            for (var i = 0; i < 8; i++) {
                var angle = (Math.PI * 2 * i) / 8;
                var speed = 1 + Math.random() * 2;
                this.particles.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.8, alpha: 1,
                    color: '#ffcc00',
                    size: 3 + Math.random() * 3
                });
            }
        },

        spawnPowerupParticles: function (x, y, color) {
            for (var i = 0; i < 15; i++) {
                var angle = (Math.PI * 2 * i) / 15;
                var speed = 1 + Math.random() * 3;
                this.particles.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1, alpha: 1,
                    color: color,
                    size: 4 + Math.random() * 4
                });
            }
        },

        updateLivesUI: function () {
            var container = document.getElementById('livesContainer');
            container.innerHTML = '';
            for (var i = 0; i < this.maxLives; i++) {
                var heart = document.createElement('div');
                heart.className = 'heart' + (i >= this.lives ? ' lost' : '');
                container.appendChild(heart);
            }
        },

        updateWantedDisplay: function () {
            var display = document.getElementById('wantedDisplay');
            var stars = document.getElementById('wantedStars');
            if (this.wantedLevel > 0) {
                display.style.display = 'block';
                stars.innerHTML = '';
                for (var i = 0; i < 5; i++) {
                    var star = document.createElement('span');
                    star.className = 'wanted-star' + (i < this.wantedLevel ? ' active' : '');
                    stars.appendChild(star);
                }
            } else {
                display.style.display = 'none';
            }
        },

        updatePowerupDisplay: function () {
            var container = document.getElementById('powerupDisplay');
            container.innerHTML = '';
            for (var id in this.activePowerups) {
                var p = POWERUPS[id];
                var remaining = Math.ceil(this.activePowerups[id] / 1000);
                var icon = document.createElement('div');
                icon.className = 'powerup-icon ' + id;
                icon.innerHTML = p.icon + '<div class="powerup-timer">' + remaining + '</div>';
                container.appendChild(icon);
            }
        },

        updateHUD: function () {
            document.getElementById('scoreValue').textContent = Math.floor(this.score);
            document.getElementById('distanceValue').textContent = Math.floor(this.distance) + 'm';
            document.getElementById('coinValue').textContent = this.coins;
            this.updatePowerupDisplay();
        },

        render: function () {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.drawBackground();
            this.drawBuildings();
            this.drawRoad();
            if (this.state === 'menu' || this.state === 'gameover') {
                this.drawBackgroundCars();
            }
            this.drawRoadLines();
            this.drawCoins();
            this.drawPowerupItems();
            this.drawObstacles();
            this.drawPoliceCars();
            this.drawParticles();
            this.drawPlayer();
            this.drawWeather();
        },

        drawBackground: function () {
            var scene = SCENES[this.selectedScene];
            if (!scene) return;
            var gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, scene.bgTop);
            gradient.addColorStop(1, scene.bgBottom);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        },

        drawBuildings: function () {
            var scene = SCENES[this.selectedScene];
            if (!scene) return;
            for (var side = 0; side < 2; side++) {
                var buildings = this.buildings[side];
                for (var i = 0; i < buildings.length; i++) {
                    var b = buildings[i];
                    this.ctx.fillStyle = '#111122';
                    this.ctx.fillRect(b.x, b.y, b.width, b.height);
                    this.ctx.fillStyle = b.color;
                    for (var w = 0; w < b.windows; w++) {
                        var wx = b.x + 4 + (w % 2) * (b.width / 2 - 4);
                        var wy = b.y + 8 + Math.floor(w / 2) * 15;
                        if (wy < b.y + b.height - 8) {
                            this.ctx.globalAlpha = 0.6 + Math.random() * 0.4;
                            this.ctx.fillRect(wx, wy, b.width / 3, 8);
                        }
                    }
                    this.ctx.globalAlpha = 1;
                }
            }
        },

        drawRoad: function () {
            var scene = SCENES[this.selectedScene];
            if (!scene) return;
            var horizonY = this.height * 0.3;
            var centerX = this.width / 2;
            var bottomWidth = this.roadWidth;
            var topWidth = this.roadWidth * 0.3;
            this.ctx.fillStyle = scene.road;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - topWidth / 2, horizonY);
            this.ctx.lineTo(centerX + topWidth / 2, horizonY);
            this.ctx.lineTo(this.roadX + bottomWidth, this.height);
            this.ctx.lineTo(this.roadX, this.height);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = scene.roadEdge;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - topWidth / 2 - 6, horizonY);
            this.ctx.lineTo(centerX - topWidth / 2, horizonY);
            this.ctx.lineTo(this.roadX, this.height);
            this.ctx.lineTo(this.roadX - 4, this.height);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + topWidth / 2, horizonY);
            this.ctx.lineTo(centerX + topWidth / 2 + 6, horizonY);
            this.ctx.lineTo(this.roadX + bottomWidth + 4, this.height);
            this.ctx.lineTo(this.roadX + bottomWidth, this.height);
            this.ctx.closePath();
            this.ctx.fill();
        },

        drawRoadLines: function () {
            var scene = SCENES[this.selectedScene];
            if (!scene) return;
            var horizonY = this.height * 0.3;
            var centerX = this.width / 2;
            this.ctx.strokeStyle = scene.roadLine;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([20, 30]);
            this.ctx.lineDashOffset = -this.roadOffset;
            for (var i = 1; i < 3; i++) {
                var ratio = i / 3;
                var topX = centerX - this.roadWidth * 0.15 + ratio * this.roadWidth * 0.3;
                var bottomX = this.roadX + ratio * this.roadWidth;
                this.ctx.beginPath();
                this.ctx.moveTo(topX, horizonY);
                this.ctx.lineTo(bottomX, this.height);
                this.ctx.stroke();
            }
            this.ctx.setLineDash([]);
        },

        drawPlayer: function () {
            if (!this.player) return;
            var x = this.player.x;
            var y = this.player.y;
            var w = this.player.width;
            var h = this.player.height;
            var v = this.player.vehicle;
            if (this.player.flashing > 0 && Math.floor(this.player.flashing / 100) % 2 === 0) {
                this.ctx.globalAlpha = 0.3;
            }
            if (this.activePowerups.shield) {
                this.ctx.strokeStyle = '#00ffff';
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 20;
                this.ctx.beginPath();
                this.ctx.arc(x, y, Math.max(w, h) / 2 + 10, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
            this.ctx.shadowColor = v.color + '40';
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = v.color;
            this.roundRect(x - w / 2, y - h / 2, w, h, 8, true);
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = v.accent;
            this.roundRect(x - w / 2 + 4, y - h / 2 + h * 0.35, w - 8, h * 0.3, 4, true);
            this.ctx.fillStyle = '#1a1a3a';
            this.roundRect(x - w / 2 + 8, y - h / 2 + 12, w - 16, h * 0.22, 4, true);
            this.roundRect(x - w / 2 + 8, y - h / 2 + h * 0.7, w - 16, h * 0.18, 4, true);
            this.ctx.fillStyle = '#ff3333';
            this.ctx.fillRect(x - w / 2 + 10, y + h / 2 - 8, 8, 4);
            this.ctx.fillRect(x + w / 2 - 18, y + h / 2 - 8, 8, 4);
            this.ctx.fillStyle = '#ffff66';
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 8;
            this.ctx.fillRect(x - w / 2 + 10, y - h / 2 + 4, 8, 5);
            this.ctx.fillRect(x + w / 2 - 18, y - h / 2 + 4, 8, 5);
            this.ctx.shadowBlur = 0;
            if (this.activePowerups.nitro) {
                this.ctx.fillStyle = '#ff6600';
                this.ctx.shadowColor = '#ff6600';
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.moveTo(x - 12, y + h / 2);
                this.ctx.lineTo(x + 12, y + h / 2);
                this.ctx.lineTo(x, y + h / 2 + 25 + Math.random() * 10);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.fillStyle = '#ffff00';
                this.ctx.beginPath();
                this.ctx.moveTo(x - 6, y + h / 2);
                this.ctx.lineTo(x + 6, y + h / 2);
                this.ctx.lineTo(x, y + h / 2 + 15);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
            this.ctx.globalAlpha = 1;
        },

        drawObstacles: function () {
            for (var i = 0; i < this.obstacles.length; i++) {
                var obs = this.obstacles[i];
                if (obs.type === 'car') {
                    this.drawObstacleCar(obs);
                } else {
                    this.drawBarrier(obs);
                }
            }
        },

        drawObstacleCar: function (obs) {
            var x = obs.x;
            var y = obs.y;
            var w = obs.width;
            var h = obs.height;
            var scale = this.getScale(y);
            this.ctx.globalAlpha = 0.3 + scale * 0.7;
            this.ctx.shadowColor = 'rgba(255, 51, 102, 0.3)';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = '#ff3366';
            this.roundRect(x - w / 2 * scale, y - h / 2 * scale, w * scale, h * scale, 8, true);
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#ffcc00';
            this.roundRect(x - w / 2 * scale + 4 * scale, y - h / 2 * scale + h * scale * 0.35, (w - 8) * scale, h * scale * 0.3, 4, true);
            this.ctx.fillStyle = '#3a1a1a';
            this.roundRect(x - w / 2 * scale + 8 * scale, y - h / 2 * scale + 12 * scale, (w - 16) * scale, h * scale * 0.22, 4, true);
            this.roundRect(x - w / 2 * scale + 8 * scale, y - h / 2 * scale + h * scale * 0.7, (w - 16) * scale, h * scale * 0.18, 4, true);
            this.ctx.fillStyle = '#ffff66';
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 8 * scale;
            this.ctx.fillRect(x - w / 2 * scale + 10 * scale, y + h / 2 * scale - 8 * scale, 8 * scale, 4 * scale);
            this.ctx.fillRect(x + w / 2 * scale - 18 * scale, y + h / 2 * scale - 8 * scale, 8 * scale, 4 * scale);
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
        },

        drawBarrier: function (obs) {
            var x = obs.x;
            var y = obs.y;
            var w = obs.width;
            var h = obs.height;
            var scale = this.getScale(y);
            this.ctx.globalAlpha = 0.3 + scale * 0.7;
            this.ctx.fillStyle = '#ff6600';
            this.roundRect(x - w / 2 * scale, y - h / 2 * scale, w * scale, h * scale, 4 * scale, true);
            this.ctx.fillStyle = '#ffffff';
            for (var i = 0; i < 4; i++) {
                var sx = x - w / 2 * scale + i * (w / 4) * scale;
                this.ctx.fillRect(sx, y - h / 2 * scale, (w / 8) * scale, h * scale);
            }
            this.ctx.shadowColor = '#ff6600';
            this.ctx.shadowBlur = 6 * scale;
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.fillRect(x - w / 2 * scale + 4 * scale, y - h / 2 * scale - 3 * scale, (w - 8) * scale, 3 * scale);
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
        },

        drawPoliceCars: function () {
            for (var i = 0; i < this.policeCars.length; i++) {
                var p = this.policeCars[i];
                var scale = this.getScale(p.y);
                this.ctx.globalAlpha = 0.3 + scale * 0.7;
                this.ctx.shadowColor = 'rgba(0, 100, 255, 0.5)';
                this.ctx.shadowBlur = 20 * scale;
                this.ctx.fillStyle = '#1a3a8a';
                this.roundRect(p.x - p.width / 2 * scale, p.y - p.height / 2 * scale, p.width * scale, p.height * scale, 8 * scale, true);
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#ffffff';
                this.roundRect(p.x - p.width / 2 * scale + 4 * scale, p.y - p.height / 2 * scale + p.height * scale * 0.35, (p.width - 8) * scale, p.height * scale * 0.3, 4 * scale, true);
                var sirenColor = Math.sin(p.siren) > 0 ? '#ff0000' : '#0000ff';
                this.ctx.fillStyle = sirenColor;
                this.ctx.shadowColor = sirenColor;
                this.ctx.shadowBlur = 15 * scale;
                this.ctx.fillRect(p.x - p.width / 4 * scale, p.y - p.height / 2 * scale - 6 * scale, p.width / 2 * scale, 6 * scale);
                this.ctx.shadowBlur = 0;
                this.ctx.globalAlpha = 1;
            }
        },

        drawCoins: function () {
            for (var i = 0; i < this.coinItems.length; i++) {
                var coin = this.coinItems[i];
                if (coin.collected) continue;
                var size = 30;
                var scale = this.getScale(coin.y);
                var scaleX = Math.abs(Math.cos(coin.rotation)) * scale;
                this.ctx.save();
                this.ctx.globalAlpha = 0.3 + scale * 0.7;
                this.ctx.translate(coin.x, coin.y);
                this.ctx.shadowColor = '#ffcc00';
                this.ctx.shadowBlur = 15 * scale;
                this.ctx.fillStyle = '#ffcc00';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, size / 2 * scaleX, size / 2 * scale, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, size / 2 * scaleX * 0.7, size / 2 * scale * 0.7, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#fffacd';
                this.ctx.beginPath();
                this.ctx.ellipse(-size / 6, -size / 6, size / 6 * scaleX, size / 8 * scale, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                this.ctx.globalAlpha = 1;
                this.ctx.restore();
            }
        },

        drawPowerupItems: function () {
            for (var i = 0; i < this.powerupItems.length; i++) {
                var pu = this.powerupItems[i];
                if (pu.collected) continue;
                var powerup = POWERUPS[pu.type];
                var size = 35;
                var scale = this.getScale(pu.y);
                this.ctx.save();
                this.ctx.globalAlpha = 0.3 + scale * 0.7;
                this.ctx.translate(pu.x, pu.y);
                this.ctx.rotate(pu.rotation);
                this.ctx.shadowColor = powerup.color;
                this.ctx.shadowBlur = 20 * scale;
                this.ctx.fillStyle = powerup.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size / 2 * scale, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size / 2 * scale * 0.7, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = powerup.color;
                this.ctx.font = (16 * scale) + 'px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(powerup.icon, 0, 0);
                this.ctx.shadowBlur = 0;
                this.ctx.globalAlpha = 1;
                this.ctx.restore();
            }
        },

        drawParticles: function () {
            for (var i = 0; i < this.particles.length; i++) {
                var p = this.particles[i];
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 8;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                this.ctx.globalAlpha = 1;
            }
        },

        drawWeather: function () {
            var scene = SCENES[this.selectedScene];
            if (!scene) return;
            if (scene.particles === 'rain') {
                this.ctx.strokeStyle = '#88aaff';
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 0.6;
                for (var i = 0; i < this.weatherParticles.length; i++) {
                    var r = this.weatherParticles[i];
                    this.ctx.beginPath();
                    this.ctx.moveTo(r.x, r.y);
                    this.ctx.lineTo(r.x - 3, r.y + r.length);
                    this.ctx.stroke();
                }
                this.ctx.globalAlpha = 1;
            } else if (scene.particles === 'snow') {
                this.ctx.fillStyle = '#ffffff';
                for (var j = 0; j < this.weatherParticles.length; j++) {
                    var s = this.weatherParticles[j];
                    this.ctx.globalAlpha = 0.7;
                    this.ctx.beginPath();
                    this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.globalAlpha = 1;
            } else if (scene.particles === 'sand') {
                for (var k = 0; k < this.weatherParticles.length; k++) {
                    var sd = this.weatherParticles[k];
                    this.ctx.globalAlpha = sd.alpha;
                    this.ctx.fillStyle = '#d4a574';
                    this.ctx.beginPath();
                    this.ctx.arc(sd.x, sd.y, sd.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.globalAlpha = 1;
            }
        },

        drawBackgroundCars: function () {
            this.ctx.save();
            this.ctx.globalAlpha = 0.6;
            for (var i = 0; i < 3; i++) {
                var x = this.laneCenters[i];
                var y = this.height * 0.3 + i * 120;
                this.ctx.shadowColor = 'rgba(255, 51, 102, 0.4)';
                this.ctx.shadowBlur = 20;
                this.ctx.fillStyle = '#ff3366';
                this.roundRect(x - 27.5, y - 47.5, 55, 95, 8, true);
                this.ctx.shadowBlur = 0;
            }
            this.ctx.restore();
        },

        getScale: function (y) {
            var horizonY = this.height * 0.3;
            var t = (y - horizonY) / (this.height - horizonY);
            return Math.max(0.3, Math.min(1, t));
        },

        roundRect: function (x, y, w, h, r, fill) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + r, y);
            this.ctx.arcTo(x + w, y, x + w, y + h, r);
            this.ctx.arcTo(x + w, y + h, x, y + h, r);
            this.ctx.arcTo(x, y + h, x, y, r);
            this.ctx.arcTo(x, y, x + w, y, r);
            this.ctx.closePath();
            if (fill) this.ctx.fill();
        }
    };

    window.addEventListener('load', function () {
        Game.init();
    });
})();
