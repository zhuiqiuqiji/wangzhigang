const GameState = {
    READY: 'ready',
    PLAYING: 'playing',
    AIMING: 'aiming',
    SHOOTING: 'shooting',
    ENDED: 'ended',
    PAUSED: 'paused'
};

const GameMode = {
    TIMED: 'timed',
    STREAK: 'streak',
    THREE_POINT: 'threePoint',
    VERSUS: 'versus'
};

const HoopType = {
    STANDARD: 'standard',
    MOVING: 'moving',
    SMALL: 'small',
    DOUBLE: 'double'
};

const ShotType = {
    HIGH: 'high',
    LOW: 'low',
    BANK: 'bank'
};

const UpgradeConfig = {
    strength: { name: '力量', baseCost: 100, costMultiplier: 1.5, maxLevel: 10, effect: 0.1 },
    accuracy: { name: '准确度', baseCost: 100, costMultiplier: 1.5, maxLevel: 10, effect: 0.08 },
    spin: { name: '旋转球', baseCost: 150, costMultiplier: 1.6, maxLevel: 10, effect: 0.15 },
    comboBoost: { name: '连击加成', baseCost: 200, costMultiplier: 1.7, maxLevel: 10, effect: 0.1 },
    slowMotion: { name: '时间延长', baseCost: 250, costMultiplier: 1.8, maxLevel: 10, effect: 5 },
    luckyShot: { name: '幸运投篮', baseCost: 300, costMultiplier: 2, maxLevel: 10, effect: 2 }
};

class BasketballGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GameState.READY;
        
        this.score = 0;
        this.p2Score = 0;
        this.currentPlayer = 1;
        this.versusShotsPerPlayer = 5;
        this.p1ShotsLeft = 5;
        this.p2ShotsLeft = 5;
        
        this.timeLeft = 60;
        this.baseTime = 60;
        this.combo = 0;
        this.maxCombo = 0;
        this.shotsMade = 0;
        this.shotsTotal = 0;
        this.streak = 0;
        this.threeMade = 0;
        this.threeShotsLeft = 25;
        
        this.gameMode = GameMode.TIMED;
        this.hoopType = HoopType.STANDARD;
        this.shotType = ShotType.HIGH;
        
        this.coinsEarned = 0;
        
        this.playerStats = this.loadStats();
        this.upgrades = this.loadUpgrades();
        
        this.audioCtx = null;
        
        this.pendingSwitch = false;
        this.pendingEnd = false;
        
        this.ball = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            radius: 20,
            rotation: 0,
            rotationSpeed: 0,
            isScored: false,
            scoredThisShot: false,
            isMoving: false,
            shootX: 0,
            shootY: 0,
            trajectory: 'high',
            shadowX: 0,
            shadowY: 0,
            scale: 1
        };
        
        this.hoop = {
            x: 0,
            y: 0,
            width: 80,
            height: 15,
            speed: 2,
            direction: 1,
            backboardX: 0,
            backboardWidth: 10
        };
        
        this.hoop2 = {
            x: 0,
            y: 0,
            width: 80,
            height: 15,
            speed: 2,
            direction: 1,
            backboardX: 0,
            backboardWidth: 10
        };
        
        this.drag = {
            isDragging: false,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0
        };
        
        this.gravity = 0.5;
        this.powerMultiplier = 0.15;
        this.pointLine2 = 0;
        this.pointLine3 = 0;
        this.resetTimeout = null;
        
        this.particles = [];
        this.trail = [];
        
        this.dailyChallenge = this.getDailyChallenge();
        this.challengeProgress = 0;
        
        this.init();
    }
    
    loadStats() {
        const saved = localStorage.getItem('basketballStats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            totalScore: 0,
            totalShots: 0,
            totalMade: 0,
            bestScore: 0,
            bestCombo: 0,
            coins: 500,
            playerName: '玩家1'
        };
    }
    
    saveStats() {
        localStorage.setItem('basketballStats', JSON.stringify(this.playerStats));
    }
    
    loadUpgrades() {
        const saved = localStorage.getItem('basketballUpgrades');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            strength: 1,
            accuracy: 1,
            spin: 1,
            comboBoost: 1,
            slowMotion: 1,
            luckyShot: 1
        };
    }
    
    saveUpgrades() {
        localStorage.setItem('basketballUpgrades', JSON.stringify(this.upgrades));
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('basketballLeaderboard');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            timed: [],
            streak: [],
            threePoint: [],
            versus: []
        };
    }
    
    saveToLeaderboard(score, mode) {
        const leaderboard = this.loadLeaderboard();
        const entry = {
            name: this.playerStats.playerName,
            score: score,
            date: new Date().toISOString().split('T')[0]
        };
        
        if (!leaderboard[mode]) leaderboard[mode] = [];
        leaderboard[mode].push(entry);
        leaderboard[mode].sort((a, b) => b.score - a.score);
        
        const rank = leaderboard[mode].findIndex(e => e === entry) + 1;
        
        leaderboard[mode] = leaderboard[mode].slice(0, 10);
        
        localStorage.setItem('basketballLeaderboard', JSON.stringify(leaderboard));
        return rank;
    }
    
    getDailyChallenge() {
        const today = new Date().toISOString().split('T')[0];
        const saved = localStorage.getItem('basketballDailyChallenge');
        
        if (saved) {
            const challenge = JSON.parse(saved);
            if (challenge.date === today && !challenge.completed) {
                return challenge;
            }
            if (challenge.date === today && challenge.completed) {
                return challenge;
            }
        }
        
        const challenges = [
            { title: '得分高手', desc: '在一局游戏中获得50分以上', target: 50, type: 'score', reward: 200 },
            { title: '连击大师', desc: '达成10连击', target: 10, type: 'combo', reward: 150 },
            { title: '神射手', desc: '单局命中率达到60%以上', target: 60, type: 'accuracy', reward: 180 },
            { title: '三分狂魔', desc: '单局投中5个三分球', target: 5, type: 'three', reward: 200 },
            { title: '铁人', desc: '单局出手20次以上', target: 20, type: 'shots', reward: 120 }
        ];
        
        const selected = challenges[Math.floor(Math.random() * challenges.length)];
        const challenge = {
            date: today,
            ...selected,
            completed: false,
            progress: 0
        };
        
        localStorage.setItem('basketballDailyChallenge', JSON.stringify(challenge));
        return challenge;
    }
    
    updateChallengeProgress(type, value) {
        if (this.dailyChallenge.completed) return;
        
        if (this.dailyChallenge.type === type) {
            this.dailyChallenge.progress = Math.max(this.dailyChallenge.progress, value);
            if (this.dailyChallenge.progress >= this.dailyChallenge.target) {
                this.dailyChallenge.completed = true;
                this.playerStats.coins += this.dailyChallenge.reward;
                this.saveStats();
                this.showCoinPopup(window.innerWidth / 2, window.innerHeight / 2, this.dailyChallenge.reward);
            }
            localStorage.setItem('basketballDailyChallenge', JSON.stringify(this.dailyChallenge));
        }
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', (e) => this.handleEnd(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseleave', (e) => this.handleEnd(e.clientX, e.clientY));
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleStart(touch.clientX, touch.clientY);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMove(touch.clientX, touch.clientY);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.handleEnd(touch.clientX, touch.clientY);
        });
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.backToMenu());
        
        document.getElementById('shopBtn').addEventListener('click', () => this.openShop());
        document.getElementById('rankBtn').addEventListener('click', () => this.openRank());
        document.getElementById('challengeBtn').addEventListener('click', () => this.openChallenge());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        document.getElementById('closeShopBtn').addEventListener('click', () => this.closeShop());
        document.getElementById('closeRankBtn').addEventListener('click', () => this.closeRank());
        document.getElementById('closeChallengeBtn').addEventListener('click', () => this.closeChallenge());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitGame());
        
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.gameMode = card.dataset.mode;
                this.updateModeUI();
            });
        });
        
        document.querySelectorAll('.hoop-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.hoop-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.hoopType = card.dataset.hoop;
                this.updateHoopInfo();
            });
        });
        
        document.querySelectorAll('.shot-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.state !== GameState.PLAYING) return;
                document.querySelectorAll('.shot-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.shotType = btn.dataset.shot;
            });
        });
        
        document.querySelectorAll('.rank-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderLeaderboard(tab.dataset.rank);
            });
        });
        
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const upgradeType = btn.dataset.upgrade;
                this.upgradeSkill(upgradeType);
            });
        });
        
        this.updateHoopInfo();
        this.updateModeUI();
        
        this.resetBall();
        this.gameLoop();
    }
    
    updateModeUI() {
        const streakPanel = document.getElementById('streakPanel');
        const threePointPanel = document.getElementById('threePointPanel');
        const p2ScorePanel = document.getElementById('p2ScorePanel');
        const playerIndicator = document.getElementById('playerIndicator');
        
        streakPanel.style.display = 'none';
        threePointPanel.style.display = 'none';
        p2ScorePanel.style.display = 'none';
        playerIndicator.style.display = 'none';
        
        if (this.gameMode === GameMode.STREAK) {
            streakPanel.style.display = 'flex';
        } else if (this.gameMode === GameMode.THREE_POINT) {
            threePointPanel.style.display = 'flex';
        } else if (this.gameMode === GameMode.VERSUS) {
            p2ScorePanel.style.display = 'flex';
            playerIndicator.style.display = 'block';
        }
    }
    
    updateHoopInfo() {
        const labels = {
            standard: '标准篮筐',
            moving: '移动篮筐',
            small: '缩小篮筐',
            double: '双篮筐'
        };
        document.getElementById('hoopTypeLabel').textContent = labels[this.hoopType];
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        const hoopWidth = this.hoopType === HoopType.SMALL ? 50 : 80;
        this.hoop.width = hoopWidth;
        this.hoop2.width = hoopWidth;
        
        this.hoop.y = this.canvas.height * 0.2;
        this.hoop.x = this.canvas.width / 2 - this.hoop.width / 2;
        this.hoop.backboardX = this.hoop.x - 5;
        
        this.hoop2.y = this.canvas.height * 0.2;
        this.hoop2.x = this.canvas.width * 0.25 - this.hoop2.width / 2;
        this.hoop2.backboardX = this.hoop2.x - 5;
        
        this.pointLine2 = this.canvas.height * 0.55;
        this.pointLine3 = this.canvas.height * 0.65;
        
        if (this.state === GameState.READY || !this.ball.isMoving) {
            this.resetBall();
        }
    }
    
    resetBall() {
        if (this.resetTimeout) {
            clearTimeout(this.resetTimeout);
            this.resetTimeout = null;
        }
        
        if (this.gameMode === GameMode.THREE_POINT) {
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height * 0.7;
        } else {
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height - 100;
        }
        
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.vz = 0;
        this.ball.rotation = 0;
        this.ball.rotationSpeed = 0;
        this.ball.isMoving = false;
        this.ball.isScored = false;
        this.ball.scoredThisShot = false;
        this.ball.trajectory = this.shotType;
        this.ball.scale = 1;
        this.trail = [];
        
        if (this.state === GameState.PLAYING) {
            if (this.pendingSwitch) {
                this.pendingSwitch = false;
                setTimeout(() => this.switchPlayer(), 300);
            } else if (this.pendingEnd) {
                this.pendingEnd = false;
                setTimeout(() => this.endGame(), 300);
            }
        }
    }
    
    startGame() {
        this.score = 0;
        this.p2Score = 0;
        this.currentPlayer = 1;
        this.p1ShotsLeft = this.versusShotsPerPlayer;
        this.p2ShotsLeft = this.versusShotsPerPlayer;
        
        this.baseTime = 60 + (this.upgrades.slowMotion - 1) * UpgradeConfig.slowMotion.effect;
        this.timeLeft = this.baseTime;
        
        this.combo = 0;
        this.maxCombo = 0;
        this.shotsMade = 0;
        this.shotsTotal = 0;
        this.streak = 0;
        this.threeMade = 0;
        this.threeShotsLeft = 25;
        this.coinsEarned = 0;
        this.challengeProgress = 0;
        this.dailyChallenge = this.getDailyChallenge();
        this.pendingSwitch = false;
        this.pendingEnd = false;
        
        if (this.dailyChallenge.completed) {
        }
        
        this.state = GameState.PLAYING;
        
        this.updateUI();
        this.updatePlayerIndicator();
        
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('endScreen').classList.add('hidden');
        
        this.resetBall();
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        if (this.gameMode === GameMode.TIMED || 
            this.gameMode === GameMode.STREAK ||
            this.gameMode === GameMode.VERSUS) {
            this.timerInterval = setInterval(() => this.tick(), 1000);
        }
    }
    
    tick() {
        if (this.state !== GameState.PLAYING) return;
        this.timeLeft--;
        this.updateUI();
        
        if (this.timeLeft <= 0) {
            if (this.gameMode === GameMode.VERSUS) {
                if (this.ball.isMoving) {
                    if (this.currentPlayer === 1) {
                        this.pendingSwitch = true;
                    } else {
                        this.pendingEnd = true;
                    }
                } else {
                    this.switchPlayer();
                }
            } else {
                if (this.ball.isMoving) {
                    this.pendingEnd = true;
                } else {
                    this.endGame();
                }
            }
        }
    }
    
    switchPlayer() {
        if (this.currentPlayer === 1) {
            this.p1ShotsLeft = 0;
            this.currentPlayer = 2;
            this.p2ShotsLeft = this.versusShotsPerPlayer;
            this.timeLeft = this.baseTime;
            this.combo = 0;
            this.updatePlayerIndicator();
        } else {
            this.endGame();
        }
        this.updateUI();
    }
    
    updatePlayerIndicator() {
        if (this.gameMode !== GameMode.VERSUS) return;
        
        const turnEl = document.getElementById('playerTurn');
        const shotsEl = document.getElementById('playerShots');
        
        if (this.currentPlayer === 1) {
            turnEl.textContent = '玩家 1 回合';
            shotsEl.textContent = `剩余: ${this.p1ShotsLeft} 球`;
        } else {
            turnEl.textContent = '玩家 2 回合';
            shotsEl.textContent = `剩余: ${this.p2ShotsLeft} 球`;
        }
    }
    
    endGame() {
        this.state = GameState.ENDED;
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        if (this.resetTimeout) {
            clearTimeout(this.resetTimeout);
            this.resetTimeout = null;
        }
        
        if (this.audioCtx) {
            this.audioCtx.close().catch(() => {});
            this.audioCtx = null;
        }
        
        this.playerStats.totalScore += this.score;
        this.playerStats.totalShots += this.shotsTotal;
        this.playerStats.totalMade += this.shotsMade;
        if (this.score > this.playerStats.bestScore) {
            this.playerStats.bestScore = this.score;
        }
        if (this.maxCombo > this.playerStats.bestCombo) {
            this.playerStats.bestCombo = this.maxCombo;
        }
        
        const coinsFromScore = Math.floor(this.score / 5);
        const luckyBonus = Math.random() < 0.1 * this.upgrades.luckyShot ? Math.floor(Math.random() * this.upgrades.luckyShot * 20) : 0;
        this.coinsEarned = coinsFromScore + luckyBonus;
        this.playerStats.coins += this.coinsEarned;
        
        this.updateChallengeProgress('score', this.score);
        this.updateChallengeProgress('combo', this.maxCombo);
        const accuracy = this.shotsTotal > 0 ? (this.shotsMade / this.shotsTotal * 100) : 0;
        this.updateChallengeProgress('accuracy', Math.round(accuracy));
        this.updateChallengeProgress('three', this.threeMade);
        this.updateChallengeProgress('shots', this.shotsTotal);
        
        this.saveStats();
        
        let rank = null;
        if (this.gameMode === GameMode.VERSUS) {
            rank = this.saveToLeaderboard(Math.max(this.score, this.p2Score), this.gameMode);
        } else {
            rank = this.saveToLeaderboard(this.score, this.gameMode);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('shotsMade').textContent = this.shotsMade;
        document.getElementById('shotsTotal').textContent = this.shotsTotal;
        document.getElementById('maxCombo').textContent = this.maxCombo;
        
        document.getElementById('stats1').style.display = 'block';
        document.getElementById('stats2').style.display = 'block';
        document.getElementById('stats3').style.display = 'none';
        
        document.getElementById('accuracy').textContent = this.shotsTotal > 0 ? Math.round(this.shotsMade / this.shotsTotal * 100) + '%' : '0%';
        document.getElementById('coinsEarned').textContent = this.coinsEarned;
        
        if (this.gameMode === GameMode.VERSUS) {
            document.getElementById('stats3').style.display = 'block';
            document.getElementById('p2FinalScore').textContent = this.p2Score;
            const winner = this.score > this.p2Score ? '玩家 1 获胜!' : (this.p2Score > this.score ? '玩家 2 获胜!' : '平局!');
            document.getElementById('winner').textContent = winner;
        }
        
        const endTitle = document.getElementById('endTitle');
        if (rank && rank <= 3) {
            const medals = ['🥇', '🥈', '🥉'];
            endTitle.textContent = `${medals[rank - 1]} 第${rank}名!`;
        } else {
            endTitle.textContent = '游戏结束!';
        }
        
        document.getElementById('endScreen').classList.remove('hidden');
    }
    
    backToMenu() {
        this.state = GameState.READY;
        document.getElementById('endScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        this.resetBall();
    }
    
    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    quitGame() {
        this.state = GameState.READY;
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        if (this.timerInterval) clearInterval(this.timerInterval);
    }
    
    openShop() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
        }
        this.updateShopUI();
        document.getElementById('shopScreen').classList.remove('hidden');
    }
    
    closeShop() {
        document.getElementById('shopScreen').classList.add('hidden');
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
        }
    }
    
    updateShopUI() {
        document.getElementById('shopCoins').textContent = this.playerStats.coins;
        
        for (const [key, config] of Object.entries(UpgradeConfig)) {
            const level = this.upgrades[key];
            const cost = Math.floor(config.baseCost * Math.pow(config.costMultiplier, level - 1));
            document.getElementById(`${key}Level`).textContent = level;
            document.getElementById(`${key}Cost`).textContent = cost;
            
            const btn = document.querySelector(`.upgrade-btn[data-upgrade="${key}"]`);
            if (level >= config.maxLevel) {
                btn.textContent = '已满级';
                btn.disabled = true;
            } else if (this.playerStats.coins < cost) {
                btn.textContent = '金币不足';
                btn.disabled = true;
            } else {
                btn.textContent = '升级';
                btn.disabled = false;
            }
        }
    }
    
    upgradeSkill(type) {
        const config = UpgradeConfig[type];
        const level = this.upgrades[type];
        
        if (level >= config.maxLevel) return;
        
        const cost = Math.floor(config.baseCost * Math.pow(config.costMultiplier, level - 1));
        if (this.playerStats.coins < cost) return;
        
        this.playerStats.coins -= cost;
        this.upgrades[type]++;
        
        this.saveStats();
        this.saveUpgrades();
        this.updateShopUI();
        
        this.playSound('upgrade');
    }
    
    openRank() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
        }
        this.renderLeaderboard(this.gameMode);
        document.getElementById('rankScreen').classList.remove('hidden');
    }
    
    closeRank() {
        document.getElementById('rankScreen').classList.add('hidden');
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
        }
    }
    
    renderLeaderboard(mode) {
        const leaderboard = this.loadLeaderboard();
        const list = document.getElementById('rankList');
        const scores = leaderboard[mode] || [];
        
        if (scores.length === 0) {
            list.innerHTML = '<div class="rank-empty">暂无记录，快来创造纪录吧！</div>';
            return;
        }
        
        const modeNames = {
            timed: '限时模式',
            streak: '连中模式',
            threePoint: '三分大赛',
            versus: '双人对战'
        };
        
        let html = '';
        scores.forEach((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            html += `
                <div class="rank-item">
                    <span class="rank-number">${medal || (index + 1)}</span>
                    <span class="rank-name">${entry.name} <small style="color: rgba(255,255,255,0.5); font-size: 10px;">${entry.date}</small></span>
                    <span class="rank-score">${entry.score}</span>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }
    
    openChallenge() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
        }
        
        this.dailyChallenge = this.getDailyChallenge();
        
        const content = document.getElementById('challengeContent');
        content.innerHTML = `
            <div class="challenge-title">${this.dailyChallenge.title}</div>
            <div class="challenge-desc">${this.dailyChallenge.desc}</div>
        `;
        
        document.getElementById('challengeCoins').textContent = this.dailyChallenge.reward;
        document.getElementById('challengeProgressText').textContent = 
            `${Math.min(this.dailyChallenge.progress, this.dailyChallenge.target)}/${this.dailyChallenge.target}`;
        
        document.getElementById('challengeScreen').classList.remove('hidden');
    }
    
    closeChallenge() {
        document.getElementById('challengeScreen').classList.add('hidden');
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
        }
    }
    
    handleStart(x, y) {
        if (this.state !== GameState.PLAYING || this.ball.isMoving) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const ballX = this.ball.x;
        const ballY = this.ball.y;
        const clickX = x - rect.left;
        const clickY = y - rect.top;
        
        const dist = Math.sqrt((clickX - ballX) ** 2 + (clickY - ballY) ** 2);
        if (dist < 60) {
            this.drag.isDragging = true;
            this.drag.startX = ballX;
            this.drag.startY = ballY;
            this.drag.endX = clickX;
            this.drag.endY = clickY;
        }
    }
    
    handleMove(x, y) {
        if (!this.drag.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.drag.endX = x - rect.left;
        this.drag.endY = y - rect.top;
    }
    
    handleEnd(x, y) {
        if (!this.drag.isDragging) return;
        
        this.shoot();
        this.drag.isDragging = false;
    }
    
    shoot() {
        if (this.state !== GameState.PLAYING) return;
        
        if (this.resetTimeout) {
            clearTimeout(this.resetTimeout);
            this.resetTimeout = null;
        }
        
        const dx = this.drag.startX - this.drag.endX;
        const dy = this.drag.startY - this.drag.endY;
        
        if (Math.abs(dy) < 20) return;
        
        const strengthBonus = 1 + (this.upgrades.strength - 1) * UpgradeConfig.strength.effect;
        const accuracyBonus = (this.upgrades.accuracy - 1) * UpgradeConfig.accuracy.effect;
        const spinBonus = 1 + (this.upgrades.spin - 1) * UpgradeConfig.spin.effect;
        
        let vx = dx * this.powerMultiplier * strengthBonus;
        let vy = dy * this.powerMultiplier * strengthBonus;
        
        const accuracyNoise = (1 - accuracyBonus) * (Math.random() - 0.5) * 2;
        vx *= (1 + accuracyNoise * 0.1);
        
        if (this.shotType === ShotType.HIGH) {
            vy *= 1.3;
            vx *= 0.9;
            this.ball.rotationSpeed = -0.1 * spinBonus;
        } else if (this.shotType === ShotType.LOW) {
            vy *= 0.7;
            vx *= 1.3;
            this.ball.rotationSpeed = 0.05 * spinBonus;
        } else if (this.shotType === ShotType.BANK) {
            vy *= 0.9;
            vx *= 1.1;
            this.ball.rotationSpeed = -0.15 * spinBonus;
        }
        
        this.ball.vx = vx;
        this.ball.vy = vy;
        this.ball.isMoving = true;
        this.ball.shootX = this.ball.x;
        this.ball.shootY = this.ball.y;
        this.ball.trajectory = this.shotType;
        this.shotsTotal++;
        
        if (this.gameMode === GameMode.THREE_POINT) {
            this.threeShotsLeft--;
            if (this.threeShotsLeft <= 0) {
                setTimeout(() => this.endGame(), 1500);
            }
        }
        
        if (this.gameMode === GameMode.VERSUS) {
            if (this.currentPlayer === 1) {
                this.p1ShotsLeft--;
            } else {
                this.p2ShotsLeft--;
            }
            this.updatePlayerIndicator();
            
            if (this.currentPlayer === 1 && this.p1ShotsLeft <= 0) {
                this.pendingSwitch = true;
            } else if (this.currentPlayer === 2 && this.p2ShotsLeft <= 0) {
                this.pendingEnd = true;
            }
        }
        
        this.playSound('shoot');
    }
    
    update() {
        if (this.state === GameState.PLAYING) {
            if (this.hoopType === HoopType.MOVING) {
                this.hoop.x += this.hoop.speed * this.hoop.direction;
                
                if (this.hoop.x <= 100) {
                    this.hoop.x = 100;
                    this.hoop.direction = 1;
                } else if (this.hoop.x >= this.canvas.width - this.hoop.width - 100) {
                    this.hoop.x = this.canvas.width - this.hoop.width - 100;
                    this.hoop.direction = -1;
                }
                this.hoop.backboardX = this.hoop.x - 5;
            }
            
            if (this.ball.isMoving) {
                this.ball.vy += this.gravity;
                this.ball.x += this.ball.vx;
                this.ball.y += this.ball.vy;
                this.ball.rotation += this.ball.rotationSpeed;
                
                this.trail.push({ x: this.ball.x, y: this.ball.y, age: 0 });
                if (this.trail.length > 20) this.trail.shift();
                this.trail.forEach(t => t.age++);
                
                this.checkCollision();
                
                if (this.ball.y > this.canvas.height + 50 || 
                    this.ball.x < -50 || 
                    this.ball.x > this.canvas.width + 50) {
                    if (!this.ball.isScored) {
                        this.handleMiss();
                        this.resetBall();
                    }
                }
            }
            
            this.updateParticles();
        }
    }
    
    handleMiss() {
        if (this.gameMode === GameMode.STREAK) {
            this.streak = 0;
        }
        this.combo = 0;
        this.updateUI();
    }
    
    checkCollision() {
        if (this.ball.isScored) return;
        
        this.checkHoopCollision(this.hoop);
        
        if (this.hoopType === HoopType.DOUBLE) {
            this.checkHoopCollision(this.hoop2);
        }
        
        this.checkBackboardCollision(this.hoop);
        
        if (this.hoopType === HoopType.DOUBLE) {
            this.checkBackboardCollision(this.hoop2);
        }
    }
    
    checkHoopCollision(hoop) {
        if (this.ball.isScored) return;
        
        const hoopLeft = hoop.x;
        const hoopRight = hoop.x + hoop.width;
        const hoopTop = hoop.y;
        const hoopBottom = hoop.y + hoop.height;
        
        const ballBottom = this.ball.y + this.ball.radius;
        const ballTop = this.ball.y - this.ball.radius;
        
        if (this.ball.vy > 0 && 
            ballBottom >= hoopTop && 
            ballTop <= hoopBottom &&
            this.ball.x > hoopLeft + 8 && 
            this.ball.x < hoopRight - 8) {
            
            this.ball.isScored = true;
            this.handleScore(hoop);
        }
        
        const leftRimX = hoopLeft;
        const rightRimX = hoopRight;
        const rimY = hoopTop;
        
        const distLeft = Math.sqrt((this.ball.x - leftRimX) ** 2 + (this.ball.y - rimY) ** 2);
        if (distLeft < this.ball.radius + 5 && this.ball.vy > 0) {
            const angle = Math.atan2(this.ball.y - rimY, this.ball.x - leftRimX);
            const speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
            this.ball.vx = Math.cos(angle) * speed * 0.6;
            this.ball.vy = -Math.abs(Math.sin(angle) * speed * 0.6);
            this.playSound('rim');
        }
        
        const distRight = Math.sqrt((this.ball.x - rightRimX) ** 2 + (this.ball.y - rimY) ** 2);
        if (distRight < this.ball.radius + 5 && this.ball.vy > 0) {
            const angle = Math.atan2(this.ball.y - rimY, this.ball.x - rightRimX);
            const speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
            this.ball.vx = Math.cos(angle) * speed * 0.6;
            this.ball.vy = -Math.abs(Math.sin(angle) * speed * 0.6);
            this.playSound('rim');
        }
    }
    
    checkBackboardCollision(hoop) {
        if (this.ball.isScored) return;
        
        const bbX = hoop.backboardX;
        const bbTop = hoop.y - 60;
        const bbBottom = hoop.y + 20;
        
        if (this.ball.x + this.ball.radius > bbX && 
            this.ball.x - this.ball.radius < bbX + 5 &&
            this.ball.y > bbTop && 
            this.ball.y < bbBottom &&
            this.ball.vx > 0) {
            
            this.ball.vx = -this.ball.vx * 0.7;
            this.ball.x = bbX - this.ball.radius;
            
            const spinEffect = this.ball.rotationSpeed * 2;
            this.ball.vy += spinEffect;
            
            this.playSound('backboard');
        }
    }
    
    handleScore(hoop) {
        let points = 2;
        
        if (this.gameMode === GameMode.THREE_POINT) {
            points = 3;
            this.threeMade++;
        } else if (this.ball.shootY > this.pointLine3) {
            points = 3;
            this.threeMade++;
        } else if (this.ball.shootY > this.pointLine2) {
            points = 2;
        }
        
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        if (this.gameMode === GameMode.STREAK) {
            this.streak++;
            points += Math.floor(this.streak * 0.5);
        }
        
        const comboBonus = Math.floor(this.combo * 0.5 * (1 + (this.upgrades.comboBoost - 1) * UpgradeConfig.comboBoost.effect));
        const totalPoints = points + comboBonus;
        
        if (this.gameMode === GameMode.VERSUS && this.currentPlayer === 2) {
            this.p2Score += totalPoints;
        } else {
            this.score += totalPoints;
        }
        
        this.shotsMade++;
        
        this.createParticles(this.ball.x, this.ball.y);
        this.showScorePopup(this.ball.x, this.ball.y, totalPoints, this.combo);
        
        if (this.combo > 0 && this.combo % 5 === 0) {
            this.showComboPopup(this.combo);
        }
        
        const coinGain = Math.floor(totalPoints / 2) + 1;
        if (Math.random() < 0.1 * this.upgrades.luckyShot) {
            const bonus = Math.floor(Math.random() * 10 * this.upgrades.luckyShot);
            this.playerStats.coins += bonus;
            this.showCoinPopup(this.ball.x + 30, this.ball.y, bonus);
        }
        
        this.updateUI();
        this.playSound('score');
        
        this.ball.isMoving = false;
        
        this.resetTimeout = setTimeout(() => {
            this.resetBall();
        }, 500);
    }
    
    createParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                life: 1,
                color: Math.random() > 0.5 ? '#ffd700' : '#ff6b35',
                size: Math.random() * 6 + 3
            });
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;
            return p.life > 0;
        });
    }
    
    showScorePopup(x, y, points, combo) {
        const popup = document.getElementById('scorePopup');
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        popup.textContent = combo > 1 ? `+${points} x${combo}COMBO!` : `+${points}`;
        popup.classList.toggle('combo', combo > 1);
        popup.classList.remove('hidden');
        
        popup.style.animation = 'none';
        popup.offsetHeight;
        popup.style.animation = '';
        
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 1000);
    }
    
    showComboPopup(combo) {
        const popup = document.getElementById('comboPopup');
        popup.textContent = `${combo} COMBO!`;
        popup.classList.remove('hidden');
        
        popup.style.animation = 'none';
        popup.offsetHeight;
        popup.style.animation = '';
        
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 800);
    }
    
    showCoinPopup(x, y, coins) {
        const popup = document.getElementById('coinPopup');
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        popup.textContent = `+${coins} 💰`;
        popup.classList.remove('hidden');
        
        popup.style.animation = 'none';
        popup.offsetHeight;
        popup.style.animation = '';
        
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 1200);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        
        if (this.gameMode === GameMode.THREE_POINT) {
            document.getElementById('timer').textContent = this.threeShotsLeft;
        } else {
            document.getElementById('timer').textContent = this.timeLeft;
        }
        
        const comboEl = document.getElementById('combo');
        comboEl.textContent = this.combo;
        
        if (this.combo > 1) {
            comboEl.classList.add('combo-active');
            setTimeout(() => comboEl.classList.remove('combo-active'), 500);
        }
        
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('threeMade').textContent = this.threeMade;
        document.getElementById('p2Score').textContent = this.p2Score;
    }
    
    playSound(type) {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            let duration = 0.1;
            if (type === 'shoot') {
                oscillator.frequency.setValueAtTime(300, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
                duration = 0.1;
            } else if (type === 'score') {
                oscillator.frequency.setValueAtTime(523, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(659, this.audioCtx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, this.audioCtx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
                duration = 0.3;
            } else if (type === 'rim') {
                oscillator.frequency.setValueAtTime(200, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
                duration = 0.15;
            } else if (type === 'backboard') {
                oscillator.frequency.setValueAtTime(150, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
                duration = 0.1;
            } else if (type === 'upgrade') {
                oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
                duration = 0.3;
            }
            
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
            
            oscillator.start(this.audioCtx.currentTime);
            oscillator.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground();
        this.drawCourt();
        this.drawBackboard(this.hoop);
        this.drawHoop(this.hoop);
        
        if (this.hoopType === HoopType.DOUBLE) {
            this.drawBackboard(this.hoop2);
            this.drawHoop(this.hoop2);
        }
        
        this.drawTrail();
        this.drawTrajectory();
        this.drawBall();
        this.drawParticles();
    }
    
    drawBackground() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#1a365d');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137) % w;
            const y = (i * 97) % h;
            const size = (i % 3) + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.gameMode === GameMode.VERSUS) {
            ctx.fillStyle = this.currentPlayer === 1 ? 'rgba(255, 107, 53, 0.05)' : 'rgba(100, 149, 237, 0.05)';
            ctx.fillRect(0, 0, w, h);
        }
    }
    
    drawCourt() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        
        ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        
        ctx.beginPath();
        ctx.moveTo(0, this.pointLine2);
        ctx.lineTo(w, this.pointLine2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 10]);
        
        ctx.beginPath();
        ctx.moveTo(0, this.pointLine3);
        ctx.lineTo(w, this.pointLine3);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        ctx.font = 'bold 14px Roboto';
        ctx.fillStyle = 'rgba(255, 107, 53, 0.7)';
        ctx.fillText('2分线', 20, this.pointLine2 - 10);
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.fillText('3分线', 20, this.pointLine3 - 10);
    }
    
    drawBackboard(hoop) {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hoop.backboardX - 5, hoop.y - 60, 8, 80);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(hoop.backboardX - 30, hoop.y - 50, 25, 50);
        
        ctx.strokeStyle = 'rgba(255, 107, 53, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(hoop.backboardX - 25, hoop.y - 40, 15, 30);
    }
    
    drawHoop(hoop) {
        const ctx = this.ctx;
        const h = hoop;
        
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(h.x, h.y);
        ctx.lineTo(h.x + h.width, h.y);
        ctx.stroke();
        
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(h.x + h.width, h.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        const netSegments = 8;
        const netHeight = 40;
        
        for (let i = 0; i <= netSegments; i++) {
            const startX = h.x + (h.width / netSegments) * i;
            const endX = h.x + h.width / 2 + (i - netSegments / 2) * 3;
            const endY = h.y + netHeight;
            
            ctx.beginPath();
            ctx.moveTo(startX, h.y);
            ctx.quadraticCurveTo(
                startX + (endX - startX) / 2,
                h.y + netHeight / 2,
                endX,
                endY
            );
            ctx.stroke();
        }
        
        for (let i = 0; i < 4; i++) {
            const y = h.y + 10 + i * 10;
            ctx.beginPath();
            ctx.moveTo(h.x + 5, y);
            ctx.lineTo(h.x + h.width - 5, y);
            ctx.stroke();
        }
    }
    
    drawTrail() {
        if (this.trail.length < 2) return;
        
        const ctx = this.ctx;
        
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (1 - t.age / 20) * 0.4;
            const size = this.ball.radius * (1 - t.age / 20) * 0.8;
            
            ctx.fillStyle = `rgba(255, 140, 66, ${alpha})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawTrajectory() {
        if (!this.drag.isDragging) return;
        
        const ctx = this.ctx;
        const dx = this.drag.startX - this.drag.endX;
        const dy = this.drag.startY - this.drag.endY;
        
        if (dy < 20) return;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(this.drag.startX, this.drag.startY);
        ctx.lineTo(this.drag.endX, this.drag.endY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 200, 1);
        ctx.fillStyle = `hsl(${120 - power * 120}, 80%, 50%)`;
        ctx.fillRect(this.drag.endX - 25, this.drag.endY - 15, 50 * power, 8);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.drag.endX - 25, this.drag.endY - 15, 50, 8);
        
        const strengthBonus = 1 + (this.upgrades.strength - 1) * UpgradeConfig.strength.effect;
        let vx = dx * this.powerMultiplier * strengthBonus;
        let vy = dy * this.powerMultiplier * strengthBonus;
        
        if (this.shotType === ShotType.HIGH) {
            vy *= 1.3;
            vx *= 0.9;
        } else if (this.shotType === ShotType.LOW) {
            vy *= 0.7;
            vx *= 1.3;
        } else if (this.shotType === ShotType.BANK) {
            vy *= 0.9;
            vx *= 1.1;
        }
        
        const colors = {
            high: 'rgba(255, 215, 0, 0.4)',
            low: 'rgba(0, 255, 255, 0.4)',
            bank: 'rgba(255, 107, 53, 0.4)'
        };
        ctx.strokeStyle = colors[this.shotType] || 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        let px = this.ball.x;
        let py = this.ball.y;
        let pvx = vx;
        let pvy = vy;
        
        ctx.moveTo(px, py);
        
        for (let i = 0; i < 60; i++) {
            pvy += this.gravity;
            px += pvx;
            py += pvy;
            
            if (py > this.canvas.height || py < 0) break;
            
            if (this.shotType === ShotType.BANK) {
                const bbX = this.hoop.backboardX;
                if (px + this.ball.radius > bbX && px - this.ball.radius < bbX + 5) {
                    pvx = -pvx * 0.7;
                    px = bbX - this.ball.radius;
                }
            }
            
            ctx.lineTo(px, py);
        }
        
        ctx.stroke();
    }
    
    drawBall() {
        const ctx = this.ctx;
        const b = this.ball;
        
        ctx.save();
        ctx.translate(b.x, b.y);
        
        if (b.isMoving) {
            ctx.rotate(b.rotation);
        }
        
        const shadowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, b.radius * 1.5);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.arc(0, 2, b.radius * 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        const gradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, b.radius);
        gradient.addColorStop(0, '#ff8c42');
        gradient.addColorStop(0.5, '#ff6b35');
        gradient.addColorStop(1, '#cc4a1a');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-b.radius, 0);
        ctx.lineTo(b.radius, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -b.radius);
        ctx.quadraticCurveTo(b.radius * 0.5, 0, 0, b.radius);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -b.radius);
        ctx.quadraticCurveTo(-b.radius * 0.5, 0, 0, b.radius);
        ctx.stroke();
        
        const lines = 8;
        for (let i = 0; i < lines; i++) {
            const angle = (i / lines) * Math.PI * 2;
            const x1 = Math.cos(angle) * b.radius * 0.7;
            const y1 = Math.sin(angle) * b.radius * 0.7;
            const x2 = Math.cos(angle) * b.radius;
            const y2 = Math.sin(angle) * b.radius;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-5, -5, b.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.globalAlpha = 1;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new BasketballGame();
});