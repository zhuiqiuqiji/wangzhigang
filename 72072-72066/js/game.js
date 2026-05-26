class CookingMasterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.pizzaRecipes = [
            {
                id: 'margherita',
                name: '玛格丽特披萨',
                emoji: '🍕',
                basePrice: 15,
                toppings: ['cheese', 'basil'],
                baseColor: '#F4D03F',
                unlockLevel: 1
            },
            {
                id: 'pepperoni',
                name: '意大利辣肠披萨',
                emoji: '🍕',
                basePrice: 20,
                toppings: ['cheese', 'pepperoni'],
                baseColor: '#E74C3C',
                unlockLevel: 2
            },
            {
                id: 'seafood',
                name: '海鲜披萨',
                emoji: '🦐',
                basePrice: 28,
                toppings: ['cheese', 'shrimp', 'squid'],
                baseColor: '#3498DB',
                unlockLevel: 4
            },
            {
                id: 'veggie',
                name: '田园蔬菜披萨',
                emoji: '🥬',
                basePrice: 18,
                toppings: ['cheese', 'pepper', 'mushroom', 'olive'],
                baseColor: '#27AE60',
                unlockLevel: 3
            },
            {
                id: 'bbq',
                name: 'BBQ烤肉披萨',
                emoji: '🍖',
                basePrice: 25,
                toppings: ['cheese', 'bacon', 'chicken'],
                baseColor: '#8B4513',
                unlockLevel: 5
            },
            {
                id: 'hawaiian',
                name: '夏威夷披萨',
                emoji: '🍍',
                basePrice: 22,
                toppings: ['cheese', 'ham', 'pineapple'],
                baseColor: '#F39C12',
                unlockLevel: 3
            }
        ];

        this.cakeRecipes = [
            {
                id: 'strawberry',
                name: '草莓蛋糕',
                emoji: '🍰',
                basePrice: 25,
                layers: ['cream', 'strawberry'],
                baseColor: '#FFB6C1',
                unlockLevel: 2
            },
            {
                id: 'chocolate',
                name: '巧克力蛋糕',
                emoji: '🎂',
                basePrice: 30,
                layers: ['chocolate', 'cream'],
                baseColor: '#8B4513',
                unlockLevel: 4
            },
            {
                id: 'matcha',
                name: '抹茶蛋糕',
                emoji: '🍵',
                basePrice: 32,
                layers: ['cream', 'matcha'],
                baseColor: '#90EE90',
                unlockLevel: 5
            },
            {
                id: 'cheesecake',
                name: '芝士蛋糕',
                emoji: '🧀',
                basePrice: 35,
                layers: ['cheese', 'cream'],
                baseColor: '#FFEFD5',
                unlockLevel: 6
            }
        ];

        this.sushiRecipes = [
            {
                id: 'salmon',
                name: '三文鱼寿司卷',
                emoji: '🍣',
                basePrice: 35,
                fillings: ['salmon', 'cucumber'],
                baseColor: '#FFA07A',
                unlockLevel: 5
            },
            {
                id: 'tuna',
                name: '金枪鱼寿司卷',
                emoji: '🐟',
                basePrice: 38,
                fillings: ['tuna', 'cucumber'],
                baseColor: '#DC143C',
                unlockLevel: 6
            },
            {
                id: 'california',
                name: '加州卷',
                emoji: '🥑',
                basePrice: 32,
                fillings: ['avocado', 'cucumber'],
                baseColor: '#98FB98',
                unlockLevel: 4
            }
        ];

        this.ingredients = {
            cheese: { name: '芝士', emoji: '🧀', price: 5, stock: 50 },
            pepperoni: { name: '辣肠', emoji: '🔴', price: 8, stock: 30 },
            mushroom: { name: '蘑菇', emoji: '🍄', price: 4, stock: 40 },
            pepper: { name: '青椒', emoji: '🟢', price: 3, stock: 40 },
            olive: { name: '橄榄', emoji: '⚫', price: 6, stock: 30 },
            bacon: { name: '培根', emoji: '🥓', price: 10, stock: 25 },
            shrimp: { name: '虾', emoji: '🦐', price: 15, stock: 20 },
            squid: { name: '鱿鱼', emoji: '🦑', price: 12, stock: 20 },
            chicken: { name: '鸡肉', emoji: '🍗', price: 12, stock: 25 },
            ham: { name: '火腿', emoji: '🍖', price: 8, stock: 30 },
            pineapple: { name: '菠萝', emoji: '🍍', price: 6, stock: 25 },
            basil: { name: '罗勒', emoji: '🌿', price: 3, stock: 30 },
            cream: { name: '奶油', emoji: '🥛', price: 8, stock: 35 },
            strawberry: { name: '草莓', emoji: '🍓', price: 10, stock: 25 },
            chocolate: { name: '巧克力', emoji: '🍫', price: 12, stock: 25 },
            salmon: { name: '三文鱼', emoji: '🐟', price: 18, stock: 15 },
            cucumber: { name: '黄瓜', emoji: '🥒', price: 3, stock: 40 },
            rice: { name: '米饭', emoji: '🍚', price: 2, stock: 60 },
            nori: { name: '海苔', emoji: '🌊', price: 5, stock: 30 },
            matcha: { name: '抹茶', emoji: '🍵', price: 15, stock: 20 },
            tuna: { name: '金枪鱼', emoji: '🐠', price: 20, stock: 15 },
            avocado: { name: '牛油果', emoji: '🥑', price: 12, stock: 20 }
        };

        this.equipment = [
            {
                id: 'knife',
                name: '主厨刀',
                emoji: '🔪',
                level: 1,
                maxLevel: 5,
                effect: '切割精准度+10%/级',
                upgradeCost: [100, 250, 500, 1000, 2000],
                unlocked: true
            },
            {
                id: 'oven',
                name: '烤炉',
                emoji: '🔥',
                level: 1,
                maxLevel: 5,
                effect: '金币收益+15%/级',
                upgradeCost: [150, 350, 700, 1400, 2800],
                unlocked: true
            },
            {
                id: 'table',
                name: '操作台',
                emoji: '🧱',
                level: 1,
                maxLevel: 5,
                effect: '时间+5秒/级',
                upgradeCost: [80, 200, 400, 800, 1600],
                unlocked: true
            },
            {
                id: 'fridge',
                name: '冰箱',
                emoji: '❄️',
                level: 1,
                maxLevel: 3,
                effect: '仓库容量+50/级',
                upgradeCost: [200, 500, 1000],
                unlocked: false
            }
        ];

        this.customers = [
            { name: '小明', avatar: '😊', type: 'normal', satisfactionMultiplier: 1 },
            { name: '小红', avatar: '😄', type: 'normal', satisfactionMultiplier: 1 },
            { name: '小华', avatar: '🙂', type: 'normal', satisfactionMultiplier: 1 },
            { name: '小李', avatar: '😁', type: 'normal', satisfactionMultiplier: 1 },
            { name: '美食家', avatar: '🤓', type: 'foodie', satisfactionMultiplier: 1.2, rewardMultiplier: 1.5 },
            { name: '老饕客', avatar: '😋', type: 'foodie', satisfactionMultiplier: 1.3, rewardMultiplier: 1.6 },
            { name: 'VIP客人', avatar: '😎', type: 'vip', satisfactionMultiplier: 1.5, rewardMultiplier: 2 },
            { name: '钻石会员', avatar: '🤩', type: 'vip', satisfactionMultiplier: 1.8, rewardMultiplier: 2.5, bonusReward: 50 },
            { name: '暴躁老哥', avatar: '😠', type: 'impatient', satisfactionMultiplier: 0.8, timeLimit: 45 },
            { name: '闪电侠', avatar: '⚡', type: 'impatient', satisfactionMultiplier: 0.9, timeLimit: 40 }
        ];

        this.ranks = [
            { title: '新手厨师', badge: '🥉', minScore: 0, maxScore: 500 },
            { title: '初级厨师', badge: '🥈', minScore: 500, maxScore: 1500 },
            { title: '资深厨师', badge: '🥇', minScore: 1500, maxScore: 3500 },
            { title: '料理达人', badge: '🏅', minScore: 3500, maxScore: 7000 },
            { title: '美食大师', badge: '👨‍🍳', minScore: 7000, maxScore: 15000 },
            { title: '传奇厨神', badge: '👑', minScore: 15000, maxScore: Infinity }
        ];

        this.achievements = [
            { id: 'first_order', name: '第一单', icon: '📦', unlocked: true },
            { id: 'perfect10', name: '完美10次', icon: '💯', unlocked: false },
            { id: 'speed_demon', name: '速度之王', icon: '⚡', unlocked: false },
            { id: 'millionaire', name: '百万富翁', icon: '💰', unlocked: false },
            { id: 'vip_master', name: 'VIP之友', icon: '💎', unlocked: false },
            { id: 'all_recipes', name: '菜谱收藏家', icon: '📚', unlocked: false }
        ];

        this.leaderboardData = [
            { rank: 1, name: '厨神阿杰', avatar: '👨‍🍳', score: 25680 },
            { rank: 2, name: '披萨女王', avatar: '👩‍🍳', score: 22150 },
            { rank: 3, name: '刀工大师', avatar: '🥷', score: 19880 },
            { rank: 4, name: '美食猎人', avatar: '🏃', score: 17520 },
            { rank: 5, name: '新手小白', avatar: '😊', score: 15200 },
            { rank: 6, name: '深夜食堂', avatar: '🌙', score: 12800 },
            { rank: 7, name: '快乐厨师', avatar: '😄', score: 9600 },
            { rank: 8, name: '努力的人', avatar: '💪', score: 7200 }
        ];

        this.initGameState();
        this.init();
    }

    initGameState() {
        const saved = localStorage.getItem('cookingMasterSave');
        if (saved) {
            const data = JSON.parse(saved);
            this.gameState = {
                coins: data.coins || 100,
                totalScore: data.totalScore || 0,
                restaurantLevel: data.restaurantLevel || 1,
                totalRevenue: data.totalRevenue || 0,
                totalOrders: data.totalOrders || 0,
                totalPerfectCuts: data.totalPerfectCuts || 0,
                maxCapacity: data.maxCapacity || 100,
                currentDish: 'pizza',
                currentRecipe: null,
                currentCutting: null,
                cuts: [],
                isPlaying: false,
                completedOrders: 0,
                sessionScore: 0,
                sessionCoins: 0,
                bestAccuracy: 0,
                avgSatisfaction: 100,
                timeLeft: 60,
                totalTime: 60,
                gameMode: 'timed',
                challengeLevel: 1,
                challengeTarget: 0,
                dailyChallenge: data.dailyChallenge || this.generateDailyChallenge(),
                lastDailyReset: data.lastDailyReset || null
            };
            this.equipment = data.equipment || this.equipment;
            Object.keys(this.ingredients).forEach(key => {
                if (data.ingredients && data.ingredients[key]) {
                    this.ingredients[key].stock = data.ingredients[key].stock;
                }
            });
        } else {
            this.gameState = {
                coins: 100,
                totalScore: 0,
                restaurantLevel: 1,
                totalRevenue: 0,
                totalOrders: 0,
                totalPerfectCuts: 0,
                maxCapacity: 100,
                currentDish: 'pizza',
                currentRecipe: null,
                currentCutting: null,
                cuts: [],
                isPlaying: false,
                completedOrders: 0,
                sessionScore: 0,
                sessionCoins: 0,
                bestAccuracy: 0,
                avgSatisfaction: 100,
                timeLeft: 60,
                totalTime: 60,
                gameMode: 'timed',
                challengeLevel: 1,
                challengeTarget: 0,
                dailyChallenge: this.generateDailyChallenge(),
                lastDailyReset: null
            };
        }
        this.checkDailyReset();
    }

    saveGame() {
        const data = {
            coins: this.gameState.coins,
            totalScore: this.gameState.totalScore,
            restaurantLevel: this.gameState.restaurantLevel,
            totalRevenue: this.gameState.totalRevenue,
            totalOrders: this.gameState.totalOrders,
            totalPerfectCuts: this.gameState.totalPerfectCuts,
            maxCapacity: this.gameState.maxCapacity,
            equipment: this.equipment,
            ingredients: this.ingredients,
            dailyChallenge: this.gameState.dailyChallenge,
            lastDailyReset: this.gameState.lastDailyReset
        };
        localStorage.setItem('cookingMasterSave', JSON.stringify(data));
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.updateAllUI();
        this.updateDailyChallengeUI();
        this.render();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth - 32, 500);
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvasSize = size;
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', (e) => this.endDrawing(e));
        this.canvas.addEventListener('mouseleave', (e) => this.endDrawing(e));

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endDrawing(e.changedTouches[0]);
        });

        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetDish());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.querySelectorAll('.dish-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.gameState.isPlaying) {
                    this.switchDish(e.target.dataset.dish);
                }
            });
        });

        document.getElementById('cancelUpgrade').addEventListener('click', () => {
            document.getElementById('upgradeModal').classList.remove('show');
        });

        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === 'tab-' + tabName);
        });

        if (tabName === 'restaurant') {
            this.renderRestaurant();
        } else if (tabName === 'inventory') {
            this.renderInventory();
        } else if (tabName === 'ranking') {
            this.renderRanking();
        }
    }

    switchDish(dishType) {
        this.gameState.currentDish = dishType;
        document.querySelectorAll('.dish-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.dish === dishType);
        });
        this.render();
    }

    getCurrentRecipes() {
        switch (this.gameState.currentDish) {
            case 'pizza': return this.pizzaRecipes;
            case 'cake': return this.cakeRecipes;
            case 'sushi': return this.sushiRecipes;
            default: return this.pizzaRecipes;
        }
    }

    getAvailableRecipes() {
        return this.getCurrentRecipes().filter(r => 
            r.unlockLevel <= this.gameState.restaurantLevel
        );
    }

    startGame() {
        const modeSelect = document.getElementById('gameMode');
        this.gameState.gameMode = modeSelect ? modeSelect.value : 'timed';
        
        const tableLevel = this.equipment.find(e => e.id === 'table').level;
        const bonusTime = (tableLevel - 1) * 5;
        
        this.gameState.isPlaying = true;
        this.gameState.completedOrders = 0;
        this.gameState.sessionScore = 0;
        this.gameState.sessionCoins = 0;
        this.gameState.bestAccuracy = 0;

        if (this.gameState.gameMode === 'timed') {
            this.gameState.timeLeft = 60 + bonusTime;
            this.gameState.totalTime = 60 + bonusTime;
        } else if (this.gameState.gameMode === 'endless') {
            this.gameState.timeLeft = 999;
            this.gameState.totalTime = 999;
        } else if (this.gameState.gameMode === 'challenge') {
            this.gameState.challengeTarget = this.gameState.challengeLevel * 5;
            this.gameState.timeLeft = 120 + bonusTime;
            this.gameState.totalTime = 120 + bonusTime;
        }

        document.getElementById('startBtn').disabled = true;
        document.getElementById('gameOverModal').classList.remove('show');
        document.getElementById('platesArea').innerHTML = '';

        this.updateModeDisplay();
        this.generateNewOrder();
        if (this.gameState.gameMode !== 'endless') {
            this.startTimer();
        }
        this.updateAllUI();
    }

    updateModeDisplay() {
        const modeLabels = {
            timed: '⏱️ 限时挑战',
            endless: '♾️ 无尽模式',
            challenge: '🎯 关卡挑战'
        };
        const targetDisplay = document.getElementById('targetDisplay');
        if (targetDisplay) {
            if (this.gameState.gameMode === 'challenge') {
                targetDisplay.textContent = `目标: ${this.gameState.completedOrders}/${this.gameState.challengeTarget} 单`;
                targetDisplay.style.display = 'block';
            } else {
                targetDisplay.style.display = 'none';
            }
        }
    }

    restartGame() {
        document.getElementById('gameOverModal').classList.remove('show');
        this.startGame();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.gameState.timeLeft--;
            this.updateTimerUI();
            
            if (this.gameState.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimerUI() {
        document.getElementById('timeLeft').textContent = this.gameState.timeLeft;
        
        const progress = (this.gameState.timeLeft / this.gameState.totalTime) * 100;
        const progressBar = document.getElementById('timeProgressBar');
        progressBar.style.width = progress + '%';
        
        const timeItem = document.querySelector('.status-item.time');
        if (this.gameState.timeLeft <= 10) {
            timeItem.classList.add('warning');
            progressBar.classList.add('warning');
        } else {
            timeItem.classList.remove('warning');
            progressBar.classList.remove('warning');
        }
    }

    endGame() {
        clearInterval(this.timerInterval);
        this.gameState.isPlaying = false;

        this.gameState.totalScore += this.gameState.sessionScore;
        this.gameState.coins += this.gameState.sessionCoins;
        this.gameState.totalRevenue += this.gameState.sessionCoins;
        this.saveGame();

        document.getElementById('finalCoins').textContent = this.gameState.sessionCoins;
        document.getElementById('finalScore').textContent = this.gameState.sessionScore;
        document.getElementById('finalOrders').textContent = this.gameState.completedOrders;
        document.getElementById('finalSatisfaction').textContent = Math.round(this.gameState.avgSatisfaction) + '%';
        
        const finalStars = Math.min(3, Math.floor(this.gameState.completedOrders / 3) + 1);
        this.updateStarsDisplay('finalStars', finalStars);
        
        document.getElementById('gameOverModal').classList.add('show');
        document.getElementById('startBtn').disabled = false;
        
        this.checkRankUp();
        this.updateAllUI();
    }

    generateNewOrder() {
        const availableRecipes = this.getAvailableRecipes();
        if (availableRecipes.length === 0) {
            this.gameState.currentRecipe = this.getCurrentRecipes()[0];
        } else {
            this.gameState.currentRecipe = availableRecipes[
                Math.floor(Math.random() * availableRecipes.length)
            ];
        }

        const customerPool = this.customers.filter(c => {
            if (c.type === 'vip' && this.gameState.restaurantLevel < 3) return false;
            if (c.type === 'foodie' && this.gameState.restaurantLevel < 2) return false;
            return true;
        });
        this.gameState.currentCustomer = customerPool[Math.floor(Math.random() * customerPool.length)];

        const sliceOptions = [3, 4, 6, 8];
        const targetSlices = sliceOptions[Math.floor(Math.random() * sliceOptions.length)];

        const ovenLevel = this.equipment.find(e => e.id === 'oven').level;
        const coinMultiplier = 1 + (ovenLevel - 1) * 0.15;
        
        const baseCoins = Math.round(this.gameState.currentRecipe.basePrice * coinMultiplier);
        const baseScore = baseCoins * 5;

        this.gameState.currentOrder = {
            slices: targetSlices,
            reward: {
                coins: baseCoins,
                minScore: baseScore
            },
            satisfaction: 100
        };

        this.gameState.cuts = [];
        this.createDish();
        this.updateCustomerUI();
        this.updateOrderUI();
        this.render();
    }

    createDish() {
        const centerX = this.canvasSize / 2;
        const centerY = this.canvasSize / 2;
        const radius = this.canvasSize * 0.4;

        const recipe = this.gameState.currentRecipe;
        const toppings = [];
        
        if (recipe.toppings) {
            recipe.toppings.forEach(toppingName => {
                const count = Math.floor(Math.random() * 6) + 4;
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * (radius - 30);
                    toppings.push({
                        type: toppingName,
                        x: centerX + Math.cos(angle) * distance,
                        y: centerY + Math.sin(angle) * distance,
                        size: 8 + Math.random() * 6,
                        rotation: Math.random() * Math.PI * 2
                    });
                }
            });
        }

        this.gameState.currentCutting = {
            x: centerX,
            y: centerY,
            radius: radius,
            toppings: toppings,
            baseColor: recipe.baseColor || '#F4D03F',
            dishType: this.gameState.currentDish
        };
    }

    getRequiredCuts() {
        if (!this.gameState.currentOrder) return 0;
        return this.gameState.currentOrder.slices;
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    startDrawing(e) {
        if (!this.gameState.isPlaying) return;
        if (this.gameState.cuts.length >= this.getRequiredCuts()) return;

        const coords = this.getCanvasCoords(e);
        const dish = this.gameState.currentCutting;
        if (!dish) return;

        const dist = Math.sqrt(
            Math.pow(coords.x - dish.x, 2) + Math.pow(coords.y - dish.y, 2)
        );
        if (dist > dish.radius * 0.6) return;

        this.isDrawing = true;
        this.currentLine = {
            startX: coords.x,
            startY: coords.y,
            endX: coords.x,
            endY: coords.y
        };
    }

    draw(e) {
        if (!this.isDrawing || !this.currentLine) return;

        const coords = this.getCanvasCoords(e);
        this.currentLine.endX = coords.x;
        this.currentLine.endY = coords.y;
        this.render();
    }

    endDrawing(e) {
        if (!this.isDrawing || !this.currentLine) return;

        this.isDrawing = false;
        
        if (this.isValidCut(this.currentLine)) {
            const angle = this.calculateAngle(this.currentLine);
            this.currentLine.angle = angle;
            
            if (this.isAngleUnique(angle)) {
                this.gameState.cuts.push({ ...this.currentLine });
                this.showFloatingText('+1 刀', this.currentLine.endX, this.currentLine.endY, 'positive');
                
                if (this.gameState.cuts.length >= this.getRequiredCuts()) {
                    this.evaluateCut();
                }
            } else {
                this.showFloatingText('角度重复', this.currentLine.endX, this.currentLine.endY, 'negative');
                this.shakeCanvas();
            }
        } else {
            this.showFloatingText('切割无效', this.currentLine.endX, this.currentLine.endY, 'negative');
            this.shakeCanvas();
        }

        this.currentLine = null;
        this.updateUI();
        this.render();
    }

    isValidCut(line) {
        const dish = this.gameState.currentCutting;
        if (!dish) return false;

        const startDist = Math.sqrt(
            Math.pow(line.startX - dish.x, 2) + Math.pow(line.startY - dish.y, 2)
        );
        const endDist = Math.sqrt(
            Math.pow(line.endX - dish.x, 2) + Math.pow(line.endY - dish.y, 2)
        );

        const lineLength = Math.sqrt(
            Math.pow(line.endX - line.startX, 2) + Math.pow(line.endY - line.startY, 2)
        );

        if (lineLength < dish.radius * 0.4) return false;

        let nearCenter = startDist < dish.radius * 0.5;
        let nearEdge = endDist > dish.radius * 0.5 && endDist <= dish.radius * 1.1;

        if (!nearCenter) {
            nearCenter = endDist < dish.radius * 0.5;
            nearEdge = startDist > dish.radius * 0.5 && startDist <= dish.radius * 1.1;
        }

        if (!nearCenter || !nearEdge) return false;

        return true;
    }

    calculateAngle(line) {
        const dish = this.gameState.currentCutting;
        if (!dish) return 0;

        let startDist = Math.sqrt(
            Math.pow(line.startX - dish.x, 2) + Math.pow(line.startY - dish.y, 2)
        );
        let endDist = Math.sqrt(
            Math.pow(line.endX - dish.x, 2) + Math.pow(line.endY - dish.y, 2)
        );

        let toX, toY;
        if (startDist < endDist) {
            toX = line.endX;
            toY = line.endY;
        } else {
            toX = line.startX;
            toY = line.startY;
        }

        let angle = Math.atan2(toY - dish.y, toX - dish.x);
        if (angle < 0) angle += Math.PI * 2;
        return angle;
    }

    isAngleUnique(newAngle) {
        const tolerance = 0.26;
        for (const cut of this.gameState.cuts) {
            let diff = Math.abs(cut.angle - newAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < tolerance) return false;
        }
        return true;
    }

    evaluateCut() {
        const order = this.gameState.currentOrder;
        const customer = this.gameState.currentCustomer;
        const targetSlices = order.slices;
        const idealAngle = (Math.PI * 2) / targetSlices;

        const allAngles = this.gameState.cuts.map(c => c.angle).sort((a, b) => a - b);

        let totalError = 0;
        for (let i = 0; i < allAngles.length; i++) {
            const next = (i + 1) % allAngles.length;
            let diff = allAngles[next] - allAngles[i];
            if (diff < 0) diff += Math.PI * 2;
            totalError += Math.abs(diff - idealAngle);
        }

        const avgError = totalError / allAngles.length;
        const maxError = idealAngle * 0.5;
        
        const knifeLevel = this.equipment.find(e => e.id === 'knife').level;
        const accuracyBonus = (knifeLevel - 1) * 0.1;
        const accuracy = Math.min(100, Math.max(0, 100 - (avgError / maxError) * 100 * (1 - accuracyBonus)));

        if (accuracy > this.gameState.bestAccuracy) {
            this.gameState.bestAccuracy = accuracy;
        }

        const stars = accuracy >= 95 ? 3 : accuracy >= 80 ? 2 : accuracy >= 60 ? 1 : 0;
        
        const customerMultiplier = customer.rewardMultiplier || 1;
        const earnedScore = Math.round(order.reward.minScore * (accuracy / 100) * customerMultiplier);
        const earnedCoins = Math.round(order.reward.coins * (accuracy / 100) * customerMultiplier);

        this.gameState.sessionScore += earnedScore;
        this.gameState.sessionCoins += earnedCoins;
        this.gameState.completedOrders++;
        this.gameState.totalOrders++;

        const satisfactionChange = (accuracy - 70) * (customer.satisfactionMultiplier || 1) * 0.3;
        this.gameState.avgSatisfaction = Math.max(0, Math.min(100, 
            (this.gameState.avgSatisfaction * (this.gameState.completedOrders - 1) + (70 + satisfactionChange)) / 
            this.gameState.completedOrders
        ));

        const consumeResult = this.consumeIngredients(this.gameState.currentRecipe);
        if (!consumeResult.success) {
            this.showFloatingText(consumeResult.message, this.canvasSize / 2, this.canvasSize / 2 - 60, 'negative');
        }

        if (accuracy >= 95) {
            this.gameState.totalPerfectCuts++;
            this.showFloatingText('完美切割！', this.canvasSize / 2, this.canvasSize / 2 - 60, 'positive');
        } else if (accuracy >= 80) {
            this.showFloatingText('很棒！', this.canvasSize / 2, this.canvasSize / 2 - 60, 'positive');
        } else if (accuracy >= 60) {
            this.showFloatingText('还不错', this.canvasSize / 2, this.canvasSize / 2 - 60, 'positive');
        }

        setTimeout(() => {
            this.showFloatingText(`+${earnedScore} 声望`, this.canvasSize / 2, this.canvasSize / 2 - 20, 'positive');
        }, 200);
        setTimeout(() => {
            this.showFloatingText(`+${earnedCoins} 🪙`, this.canvasSize / 2, this.canvasSize / 2 + 20, 'coins');
        }, 400);

        this.updateStarsDisplay('starsDisplay', stars);
        this.animateSlicesToPlates(targetSlices);

        const orderCard = document.getElementById('orderCard');
        orderCard.classList.add('completed');
        setTimeout(() => orderCard.classList.remove('completed'), 600);

        this.updateDailyChallengeProgress(accuracy);
        this.updateModeDisplay();

        if (this.gameState.gameMode === 'challenge' && this.gameState.completedOrders >= this.gameState.challengeTarget) {
            this.gameState.challengeLevel++;
            this.showFloatingText(`🎉 关卡 ${this.gameState.challengeLevel - 1} 完成！`, 
                this.canvasSize / 2, this.canvasSize / 2 - 100, 'positive');
            setTimeout(() => {
                if (this.gameState.isPlaying) {
                    this.gameState.challengeTarget = this.gameState.challengeLevel * 5;
                    this.generateNewOrder();
                    this.updateModeDisplay();
                }
            }, 2000);
        } else {
            setTimeout(() => {
                if (this.gameState.isPlaying) {
                    this.generateNewOrder();
                }
            }, 1500);
        }

        this.checkAchievements();
        this.checkRankUp();
        this.saveGame();
    }

    updateStarsDisplay(elementId, stars) {
        const container = document.getElementById(elementId);
        const starElements = container.querySelectorAll('.star');
        starElements.forEach((el, i) => {
            el.classList.toggle('filled', i < stars);
            el.classList.toggle('empty', i >= stars);
        });
    }

    animateSlicesToPlates(slices) {
        const platesArea = document.getElementById('platesArea');
        platesArea.innerHTML = '';

        for (let i = 0; i < slices; i++) {
            const plate = document.createElement('div');
            plate.className = 'plate';
            
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = 80;
            sliceCanvas.height = 80;
            sliceCanvas.className = 'pizza-slice';
            
            const ctx = sliceCanvas.getContext('2d');
            this.drawSliceOnCanvas(ctx, i, slices, 40, 40, 35);
            
            plate.appendChild(sliceCanvas);
            plate.style.animationDelay = (i * 0.1) + 's';
            platesArea.appendChild(plate);
        }
    }

    drawSliceOnCanvas(ctx, sliceIndex, totalSlices, centerX, centerY, radius) {
        const startAngle = (sliceIndex / totalSlices) * Math.PI * 2 - Math.PI / 2;
        const endAngle = ((sliceIndex + 1) / totalSlices) * Math.PI * 2 - Math.PI / 2;
        const dish = this.gameState.currentCutting;
        const baseColor = dish ? dish.baseColor : '#F4D03F';

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(0.7, baseColor);
        gradient.addColorStop(1, '#B9770E');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    resetDish() {
        if (!this.gameState.isPlaying) return;
        this.gameState.cuts = [];
        this.createDish();
        this.updateUI();
        this.render();
        this.showFloatingText('已重做', this.canvasSize / 2, this.canvasSize / 2, 'negative');
    }

    checkRankUp() {
        const currentRank = this.getCurrentRank();
        const totalScoreWithSession = this.gameState.totalScore + this.gameState.sessionScore;
        const newRank = this.ranks.find(r => 
            totalScoreWithSession >= r.minScore && totalScoreWithSession < r.maxScore
        );
        if (newRank && newRank !== currentRank) {
            this.showFloatingText(`🎉 升级为 ${newRank.title}！`, 
                window.innerWidth / 2, window.innerHeight / 2, 'positive');
        }
    }

    getCurrentRank() {
        return this.ranks.find(r => 
            this.gameState.totalScore >= r.minScore && this.gameState.totalScore < r.maxScore
        ) || this.ranks[0];
    }

    checkAchievements() {
        if (this.gameState.totalOrders === 1) {
            this.achievements.find(a => a.id === 'first_order').unlocked = true;
        }
        if (this.gameState.totalPerfectCuts >= 10) {
            this.achievements.find(a => a.id === 'perfect10').unlocked = true;
        }
        if (this.gameState.totalOrders >= 50) {
            this.achievements.find(a => a.id === 'speed_demon').unlocked = true;
        }
        if (this.gameState.coins >= 10000) {
            this.achievements.find(a => a.id === 'millionaire').unlocked = true;
        }
        if (this.gameState.totalOrders >= 20 && this.gameState.avgSatisfaction >= 90) {
            this.achievements.find(a => a.id === 'vip_master').unlocked = true;
        }
        const allRecipes = [...this.pizzaRecipes, ...this.cakeRecipes, ...this.sushiRecipes];
        const unlockedCount = allRecipes.filter(r => r.unlockLevel <= this.gameState.restaurantLevel).length;
        if (unlockedCount >= allRecipes.length) {
            this.achievements.find(a => a.id === 'all_recipes').unlocked = true;
        }
    }

    consumeIngredients(recipe) {
        const requiredIngredients = recipe.toppings || recipe.layers || recipe.fillings || [];
        
        for (const ing of requiredIngredients) {
            if (this.ingredients[ing] && this.ingredients[ing].stock <= 0) {
                return { success: false, message: `${this.ingredients[ing].name}不足！` };
            }
        }

        for (const ing of requiredIngredients) {
            if (this.ingredients[ing]) {
                this.ingredients[ing].stock = Math.max(0, this.ingredients[ing].stock - 1);
            }
        }

        this.saveGame();
        return { success: true };
    }

    generateDailyChallenge() {
        const challenges = [
            { id: 'perfect5', name: '完成5次完美切割', target: 5, reward: 50, progress: 0, completed: false },
            { id: 'orders10', name: '完成10个订单', target: 10, reward: 80, progress: 0, completed: false },
            { id: 'accuracy90', name: '平均精度达到90%', target: 90, reward: 100, progress: 0, completed: false },
            { id: 'vip3', name: '服务3位VIP顾客', target: 3, reward: 150, progress: 0, completed: false }
        ];
        const shuffled = challenges.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2);
    }

    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.gameState.lastDailyReset !== today) {
            this.gameState.dailyChallenge = this.generateDailyChallenge();
            this.gameState.lastDailyReset = today;
            this.saveGame();
        }
    }

    updateDailyChallengeProgress(accuracy) {
        if (!this.gameState.dailyChallenge) return;

        this.gameState.dailyChallenge.forEach(challenge => {
            if (challenge.completed) return;

            switch (challenge.id) {
                case 'perfect5':
                    if (accuracy >= 95) {
                        challenge.progress++;
                    }
                    break;
                case 'orders10':
                    challenge.progress++;
                    break;
                case 'accuracy90':
                    challenge.progress = Math.max(challenge.progress, Math.round(accuracy));
                    break;
                case 'vip3':
                    if (this.gameState.currentCustomer && this.gameState.currentCustomer.type === 'vip') {
                        challenge.progress++;
                    }
                    break;
            }

            if (challenge.progress >= challenge.target && !challenge.completed) {
                challenge.completed = true;
                this.gameState.coins += challenge.reward;
                this.showFloatingText(`🎁 每日挑战完成 +${challenge.reward}🪙`, 
                    this.canvasSize / 2, this.canvasSize / 2 - 140, 'coins');
                this.saveGame();
            }
        });

        this.updateDailyChallengeUI();
    }

    updateDailyChallengeUI() {
        const container = document.querySelector('.daily-challenge');
        if (!container || !this.gameState.dailyChallenge) return;

        const challengeHTML = this.gameState.dailyChallenge.map(c => `
            <div class="challenge-item ${c.completed ? 'completed' : ''}">
                <span>${c.name} (${c.progress}/${c.target})</span>
                <span class="challenge-reward">${c.completed ? '✅' : '+${c.reward}🪙'}</span>
            </div>
        `).join('');

        container.innerHTML = `
            <h3>📅 每日挑战</h3>
            ${challengeHTML}
        `;
    }

    showFloatingText(text, x, y, type) {
        const floatingEl = document.getElementById('floatingText');
        const newText = floatingEl.cloneNode(true);
        newText.id = '';
        newText.textContent = text;
        newText.classList.add(type);
        newText.style.left = x + 'px';
        newText.style.top = y + 'px';
        document.body.appendChild(newText);
        
        setTimeout(() => {
            newText.remove();
        }, 1000);
    }

    shakeCanvas() {
        this.canvas.classList.add('shake');
        setTimeout(() => this.canvas.classList.remove('shake'), 300);
    }

    updateAllUI() {
        this.updateUI();
        this.updateRankUI();
    }

    updateUI() {
        document.getElementById('coins').textContent = this.gameState.coins;
        document.getElementById('score').textContent = this.gameState.totalScore;
        document.getElementById('completedOrders').textContent = this.gameState.completedOrders;
        
        const cutsNeeded = this.getRequiredCuts();
        document.getElementById('cutsMade').textContent = this.gameState.cuts.length;
        document.getElementById('cutsNeeded').textContent = cutsNeeded;
        
        const progress = cutsNeeded > 0 ? (this.gameState.cuts.length / cutsNeeded) * 100 : 0;
        document.getElementById('cutProgress').style.width = progress + '%';
    }

    updateRankUI() {
        const rank = this.getCurrentRank();
        document.getElementById('rankTitle').textContent = rank.title;
        document.getElementById('rankTitleDisplay').textContent = rank.title;
        document.getElementById('rankBadge').textContent = rank.badge;

        const rankIndex = this.ranks.indexOf(rank);
        const nextRank = this.ranks[rankIndex + 1];
        if (nextRank && nextRank.maxScore !== Infinity) {
            const progress = ((this.gameState.totalScore - rank.minScore) / (nextRank.minScore - rank.minScore)) * 100;
            document.getElementById('rankProgressFill').style.width = Math.min(100, progress) + '%';
        } else {
            document.getElementById('rankProgressFill').style.width = '100%';
        }
    }

    updateCustomerUI() {
        const customer = this.gameState.currentCustomer;
        if (!customer) return;

        document.getElementById('customerAvatar').textContent = customer.avatar;
        document.getElementById('customerName').textContent = customer.name;
        
        const typeLabels = {
            normal: '普通顾客',
            foodie: '美食家',
            vip: 'VIP客人',
            impatient: '急性子'
        };
        document.getElementById('customerType').textContent = typeLabels[customer.type] || '普通顾客';

        const satisfactionFill = document.getElementById('satisfactionFill');
        if (satisfactionFill) {
            satisfactionFill.style.width = this.gameState.avgSatisfaction + '%';
        }

        const card = document.getElementById('customerCard');
        card.classList.toggle('vip', customer.type === 'vip');
    }

    updateOrderUI() {
        const order = this.gameState.currentOrder;
        const recipe = this.gameState.currentRecipe;
        if (!order || !recipe) return;

        document.getElementById('dishName').textContent = recipe.name;
        document.getElementById('orderNumber').textContent = '#' + this.gameState.completedOrders;
        document.getElementById('requiredSlices').textContent = order.slices;
        document.getElementById('rewardCoins').textContent = order.reward.coins;
        document.getElementById('rewardScore').textContent = order.reward.minScore;

        this.updateOrderDiagram(order.slices);
        this.updateStarsDisplay('starsDisplay', 0);
        this.updateUI();
    }

    updateOrderDiagram(slices) {
        const container = document.getElementById('orderDiagram');
        let svg = '<svg viewBox="0 0 100 100">';
        
        const dish = this.gameState.currentCutting;
        const fillColor = dish ? dish.baseColor : '#F39C12';
        svg += `<circle cx="50" cy="50" r="45" fill="${fillColor}" stroke="#8B4513" stroke-width="2"/>`;
        
        for (let i = 0; i < slices; i++) {
            const angle = (i / slices) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 45;
            const y = 50 + Math.sin(angle) * 45;
            svg += `<line x1="50" y1="50" x2="${x}" y2="${y}" stroke="#8B4513" stroke-width="2"/>`;
        }
        
        svg += '</svg>';
        container.innerHTML = svg;
    }

    renderRestaurant() {
        document.getElementById('restaurantLevel').textContent = 'Lv.' + this.gameState.restaurantLevel;
        document.getElementById('totalRevenue').textContent = this.gameState.totalRevenue;
        document.getElementById('totalOrders').textContent = this.gameState.totalOrders;

        const equipmentGrid = document.getElementById('equipmentGrid');
        equipmentGrid.innerHTML = this.equipment.map(eq => `
            <div class="equipment-card ${!eq.unlocked ? 'locked' : ''}" 
                 onclick="game.upgradeEquipment('${eq.id}')">
                <span class="equipment-icon">${eq.emoji}</span>
                <span class="equipment-name">${eq.name}</span>
                <span class="equipment-level">Lv.${eq.level}/${eq.maxLevel}</span>
                <span class="equipment-cost">${eq.level < eq.maxLevel ? '🪙 ' + eq.upgradeCost[eq.level] : '已满级'}</span>
            </div>
        `).join('');

        const allRecipes = [...this.pizzaRecipes, ...this.cakeRecipes, ...this.sushiRecipes];
        const recipeGrid = document.getElementById('recipeGrid');
        recipeGrid.innerHTML = allRecipes.map(recipe => {
            const unlocked = recipe.unlockLevel <= this.gameState.restaurantLevel;
            return `
                <div class="recipe-card ${!unlocked ? 'locked' : ''}">
                    <span class="recipe-icon">${recipe.emoji}</span>
                    <span class="recipe-name">${recipe.name}</span>
                    <span class="recipe-difficulty">${unlocked ? '已解锁' : 'Lv.' + recipe.unlockLevel + '解锁'}</span>
                    <span class="recipe-price">🪙 ${recipe.basePrice}</span>
                </div>
            `;
        }).join('');
    }

    upgradeEquipment(equipmentId) {
        const eq = this.equipment.find(e => e.id === equipmentId);
        if (!eq || !eq.unlocked || eq.level >= eq.maxLevel) return;

        const cost = eq.upgradeCost[eq.level];
        if (this.gameState.coins < cost) {
            this.showFloatingText('金币不足！', window.innerWidth / 2, window.innerHeight / 2, 'negative');
            return;
        }

        this.pendingUpgrade = equipmentId;
        document.getElementById('upgradeText').textContent = 
            `确定要升级 ${eq.name} 到 Lv.${eq.level + 1} 吗？\n花费: 🪙 ${cost}`;
        document.getElementById('upgradeModal').classList.add('show');

        document.getElementById('confirmUpgrade').onclick = () => {
            this.gameState.coins -= cost;
            eq.level++;
            
            if (eq.id === 'fridge') {
                this.gameState.maxCapacity += 50;
            }
            
            this.checkRestaurantLevelUp();
            
            this.saveGame();
            this.renderRestaurant();
            this.updateAllUI();
            document.getElementById('upgradeModal').classList.remove('show');
            this.showFloatingText('升级成功！', window.innerWidth / 2, window.innerHeight / 2, 'positive');
        };
    }

    checkRestaurantLevelUp() {
        const totalLevels = this.equipment.reduce((sum, e) => sum + (e.unlocked ? e.level : 0), 0);
        const newLevel = Math.floor(totalLevels / 4) + 1;
        if (newLevel > this.gameState.restaurantLevel) {
            this.gameState.restaurantLevel = newLevel;
            this.showFloatingText(`🏪 餐厅升级到 Lv.${newLevel}！`, 
                window.innerWidth / 2, window.innerHeight / 2 - 50, 'positive');
        }
    }

    renderInventory() {
        const usedCapacity = Object.values(this.ingredients).reduce((sum, i) => sum + i.stock, 0);
        document.getElementById('usedCapacity').textContent = usedCapacity;
        document.getElementById('maxCapacity').textContent = this.gameState.maxCapacity;

        const ingredientGrid = document.getElementById('ingredientGrid');
        ingredientGrid.innerHTML = Object.entries(this.ingredients)
            .map(([key, item]) => `
                <div class="ingredient-card ${item.stock <= 0 ? 'empty' : ''}">
                    <span class="ingredient-icon">${item.emoji}</span>
                    <span class="ingredient-name">${item.name}</span>
                    <span class="ingredient-quantity">库存: ${item.stock}</span>
                </div>
            `).join('');

        const marketGrid = document.getElementById('marketGrid');
        marketGrid.innerHTML = Object.entries(this.ingredients)
            .map(([key, item]) => `
                <div class="market-card" onclick="game.buyIngredient('${key}')">
                    <span class="ingredient-icon">${item.emoji}</span>
                    <span class="ingredient-name">${item.name}</span>
                    <span class="market-price">🪙 ${item.price}/份</span>
                    <button class="btn btn-small btn-primary" style="margin-top:8px;width:100%">购买</button>
                </div>
            `).join('');
    }

    buyIngredient(ingredientKey) {
        const item = this.ingredients[ingredientKey];
        if (!item) return;

        const usedCapacity = Object.values(this.ingredients).reduce((sum, i) => sum + i.stock, 0);
        if (usedCapacity >= this.gameState.maxCapacity) {
            this.showFloatingText('仓库已满！', window.innerWidth / 2, window.innerHeight / 2, 'negative');
            return;
        }

        if (this.gameState.coins < item.price) {
            this.showFloatingText('金币不足！', window.innerWidth / 2, window.innerHeight / 2, 'negative');
            return;
        }

        const buyAmount = 10;
        this.gameState.coins -= item.price * buyAmount;
        item.stock += buyAmount;
        this.saveGame();
        this.renderInventory();
        this.updateAllUI();
        this.showFloatingText(`购买了 ${buyAmount} 份 ${item.name}`, 
            window.innerWidth / 2, window.innerHeight / 2, 'positive');
    }

    renderRanking() {
        this.updateRankUI();

        const myRank = this.leaderboardData.length + 1;
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = [
            ...this.leaderboardData.slice(0, 5),
            { rank: myRank, name: '我', avatar: '😊', score: this.gameState.totalScore, isMe: true }
        ].map(player => {
            let rankClass = '';
            if (player.rank === 1) rankClass = 'gold';
            else if (player.rank === 2) rankClass = 'silver';
            else if (player.rank === 3) rankClass = 'bronze';
            
            return `
                <div class="leaderboard-item ${player.isMe ? 'my-rank' : ''}">
                    <span class="leaderboard-rank ${rankClass}">${player.rank}</span>
                    <span class="leaderboard-avatar">${player.avatar}</span>
                    <span class="leaderboard-name">${player.name}</span>
                    <span class="leaderboard-score">${player.score}</span>
                </div>
            `;
        }).join('');

        const achievementsGrid = document.getElementById('achievementsGrid');
        achievementsGrid.innerHTML = this.achievements.map(a => `
            <div class="achievement-card ${!a.unlocked ? 'locked' : ''}">
                <span class="achievement-icon">${a.icon}</span>
                <span class="achievement-name">${a.name}</span>
            </div>
        `).join('');
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        
        if (this.gameState.currentCutting) {
            this.drawDish();
            this.drawCutGuides();
            this.drawCuts();
            
            if (this.currentLine && this.isDrawing) {
                this.drawCurrentLine();
            }
        } else {
            this.drawPlaceholder();
        }
    }

    drawBackground() {
        const gradient = this.ctx.createRadialGradient(
            this.canvasSize / 2, this.canvasSize / 2, 0,
            this.canvasSize / 2, this.canvasSize / 2, this.canvasSize / 2
        );
        gradient.addColorStop(0, '#2C1810');
        gradient.addColorStop(1, '#1a0f0a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
    }

    drawDish() {
        const dish = this.gameState.currentCutting;
        const { x, y, radius, dishType } = dish;

        this.ctx.save();
        
        if (dishType === 'cake') {
            this.drawCake(dish);
        } else if (dishType === 'sushi') {
            this.drawSushi(dish);
        } else {
            this.drawPizza(dish);
        }

        this.ctx.restore();
    }

    drawPizza(dish) {
        const { x, y, radius, toppings, baseColor } = dish;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius - 8, 0, Math.PI * 2);
        const crustGradient = this.ctx.createRadialGradient(x, y, radius - 20, x, y, radius - 8);
        crustGradient.addColorStop(0, baseColor);
        crustGradient.addColorStop(1, '#D4AC0D');
        this.ctx.fillStyle = crustGradient;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius - 15, 0, Math.PI * 2);
        const cheeseGradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius - 15);
        cheeseGradient.addColorStop(0, '#FFF8DC');
        cheeseGradient.addColorStop(0.7, baseColor);
        cheeseGradient.addColorStop(1, '#D4AC0D');
        this.ctx.fillStyle = cheeseGradient;
        this.ctx.fill();

        this.ctx.globalAlpha = 0.2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius - 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        toppings.forEach(topping => {
            this.drawTopping(topping);
        });

        this.ctx.strokeStyle = '#6B4423';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius - 8, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawCake(dish) {
        const { x, y, radius, baseColor } = dish;

        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x, y + i * 8, radius - i * 15, 0, Math.PI * 2);
            const layerGradient = this.ctx.createRadialGradient(x, y + i * 8, 0, x, y + i * 8, radius - i * 15);
            layerGradient.addColorStop(0, i === 1 ? baseColor : '#FFF0F5');
            layerGradient.addColorStop(1, i === 1 ? '#FFB6C1' : '#FFE4E1');
            this.ctx.fillStyle = layerGradient;
            this.ctx.fill();
            this.ctx.strokeStyle = '#DEB887';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.fillStyle = baseColor;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const sx = x + Math.cos(angle) * (radius - 25);
            const sy = y - 15 + Math.sin(angle) * (radius - 25);
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.font = '30px serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🍓', x, y - radius + 35);
    }

    drawSushi(dish) {
        const { x, y, radius } = dish;

        this.ctx.beginPath();
        this.ctx.ellipse(x, y, radius, radius * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(x, y, radius - 10, radius * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FAF0E6';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(x, y, radius - 20, radius * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFA07A';
        this.ctx.fill();

        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x - radius + 5, y);
        this.ctx.lineTo(x + radius - 5, y);
        this.ctx.stroke();
    }

    drawTopping(topping) {
        const { type, x, y, size, rotation } = topping;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        switch (type) {
            case 'pepperoni':
            case 'ham':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                const gradient = this.ctx.createRadialGradient(-size * 0.3, -size * 0.3, 0, 0, 0, size);
                gradient.addColorStop(0, '#E74C3C');
                gradient.addColorStop(1, '#922B21');
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
                break;

            case 'mushroom':
                this.ctx.beginPath();
                this.ctx.ellipse(0, -size * 0.2, size, size * 0.7, 0, 0, Math.PI * 2);
                this.ctx.fillStyle = '#F5CBA7';
                this.ctx.fill();
                break;

            case 'pepper':
            case 'basil':
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, size, size * 0.4, Math.PI / 4, 0, Math.PI * 2);
                this.ctx.fillStyle = type === 'basil' ? '#228B22' : '#27AE60';
                this.ctx.fill();
                break;

            case 'olive':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                this.ctx.fillStyle = '#2C3E50';
                this.ctx.fill();
                break;

            case 'cheese':
            case 'cream':
            case 'pineapple':
                this.ctx.fillStyle = type === 'pineapple' ? '#FFD700' : '#FFF8DC';
                this.ctx.fillRect(-size, -size * 0.4, size * 2, size * 0.8);
                break;

            case 'bacon':
            case 'chicken':
                this.ctx.fillStyle = '#E74C3C';
                this.ctx.fillRect(-size, -size * 0.3, size * 2, size * 0.6);
                break;

            case 'shrimp':
            case 'squid':
            case 'salmon':
            case 'tuna':
                const seafoodColors = {
                    shrimp: '#FFA07A',
                    squid: '#FFE4E1',
                    salmon: '#FFA07A',
                    tuna: '#DC143C'
                };
                this.ctx.fillStyle = seafoodColors[type] || '#FFA07A';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, size * 1.2, size * 0.6, 0, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case 'matcha':
                this.ctx.fillStyle = '#90EE90';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case 'avocado':
                this.ctx.fillStyle = '#98FB98';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, size * 1.1, size * 0.7, 0, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            default:
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                this.ctx.fillStyle = '#F39C12';
                this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawCutGuides() {
        if (!this.gameState.isPlaying) return;
        if (this.gameState.cuts.length >= this.getRequiredCuts()) return;

        const dish = this.gameState.currentCutting;
        const order = this.gameState.currentOrder;
        if (!order || !dish) return;

        const targetSlices = order.slices;
        
        this.ctx.save();
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;

        const existingAngles = this.gameState.cuts.map(c => c.angle);
        
        for (let i = 0; i < targetSlices; i++) {
            const idealAngle = (i / targetSlices) * Math.PI * 2;
            let isGuided = true;
            
            for (const angle of existingAngles) {
                let diff = Math.abs(angle - idealAngle);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (diff < 0.3) {
                    isGuided = false;
                    break;
                }
            }

            if (isGuided) {
                const endX = dish.x + Math.cos(idealAngle) * dish.radius;
                const endY = dish.y + Math.sin(idealAngle) * dish.radius;

                this.ctx.beginPath();
                this.ctx.moveTo(dish.x, dish.y);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    drawCuts() {
        const dish = this.gameState.currentCutting;
        if (!dish) return;

        this.ctx.save();
        
        this.gameState.cuts.forEach((cut) => {
            const endX = dish.x + Math.cos(cut.angle) * dish.radius;
            const endY = dish.y + Math.sin(cut.angle) * dish.radius;
            
            this.ctx.shadowColor = '#FFFFFF';
            this.ctx.shadowBlur = 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(dish.x, dish.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = '#ECF0F1';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();

            this.ctx.shadowBlur = 0;
            this.ctx.beginPath();
            this.ctx.moveTo(dish.x, dish.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = '#BDC3C7';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        this.ctx.restore();
    }

    drawCurrentLine() {
        if (!this.currentLine || !this.gameState.currentCutting) return;

        const dish = this.gameState.currentCutting;
        const previewAngle = Math.atan2(
            this.currentLine.endY - dish.y,
            this.currentLine.endX - dish.x
        );
        const previewEndX = dish.x + Math.cos(previewAngle) * dish.radius;
        const previewEndY = dish.y + Math.sin(previewAngle) * dish.radius;

        this.ctx.save();
        
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.currentLine.startX, this.currentLine.startY);
        this.ctx.lineTo(this.currentLine.endX, this.currentLine.endY);
        this.ctx.strokeStyle = '#95A5A6';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;

        this.ctx.shadowColor = '#3498DB';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(dish.x, dish.y);
        this.ctx.lineTo(previewEndX, previewEndY);
        this.ctx.strokeStyle = '#3498DB';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(dish.x, dish.y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#3498DB';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(previewEndX, previewEndY, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#3498DB';
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPlaceholder() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = 'bold 22px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('点击「开始营业」', this.canvasSize / 2, this.canvasSize / 2 - 20);
        this.ctx.fillText('开始今天的工作！', this.canvasSize / 2, this.canvasSize / 2 + 20);
        this.ctx.restore();
    }
}

let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new CookingMasterGame();
});
