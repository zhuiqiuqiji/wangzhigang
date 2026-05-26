class ArcheryGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        this.gravity = 0.4;
        this.airResistance = 0.998;
        this.totalArrows = 10;
        this.currentArrow = 0;
        this.currentScore = 0;
        this.totalScore = 0;
        this.gameOver = false;
        this.canShoot = true;
        this.cameraShakeIntensity = 0;

        this.currentScene = 'range';
        this.currentWeapon = 'longbow';
        this.currentMode = 'classic';
        this.isFPV = false;
        this.isScopeMode = false;
        this.isVRMode = false;

        this.bow = {
            x: 150,
            y: 0,
            angle: -Math.PI / 4,
            power: 0,
            maxPower: 25,
            isDragging: false
        };

        this.weapons = {
            longbow: { name: '长弓', power: 1.0, accuracy: 0.9, speed: 1.0, maxPower: 25, color: '#8B4513', description: '传统长弓，威力适中，稳定性好' },
            compound: { name: '复合弓', power: 0.85, accuracy: 1.0, speed: 1.2, maxPower: 22, color: '#4a5568', description: '现代复合弓，射速快，精准度高' },
            crossbow: { name: '弩', power: 1.2, accuracy: 1.1, speed: 0.8, maxPower: 30, color: '#2d3748', description: '强力弩，威力最大，穿透力强' }
        };

        this.arrows = [];
        this.stuckArrows = [];
        this.hitEffects = [];

        this.target = {
            x: 0,
            y: 0,
            radius: 120,
            originalX: 0,
            moving: false,
            moveSpeed: 2,
            moveRange: 150,
            moveOffset: 0,
            rings: [
                { radius: 120, color: '#ffffff', points: 1 },
                { radius: 100, color: '#000000', points: 2 },
                { radius: 80, color: '#0000ff', points: 3 },
                { radius: 60, color: '#ff0000', points: 5 },
                { radius: 40, color: '#ffff00', points: 7 },
                { radius: 20, color: '#ffd700', points: 10 }
            ]
        };

        this.wind = {
            speed: 0,
            direction: 1,
            gustChance: 0.01,
            currentGust: 0
        };

        this.trail = [];
        this.timer = 60;
        this.timerInterval = null;
        this.isSeasonMode = false;
        this.seasonInfo = { name: '春季锦标赛', endDate: '2026-06-30' };

        this.leaderboard = this.loadLeaderboard();
        this.particles = [];

        this.decorations = {
            stars: [],
            forestTrees: [],
            forestFloor: [],
            ferns: [],
            grass: [],
            stones: [],
            animals: []
        };

        this.initDecorations();
        this.init();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.bow.y = this.canvas.height * 0.6;
        this.target.x = this.canvas.width - 200;
        this.target.originalX = this.target.x;
        this.target.y = this.canvas.height * 0.5;
        this.initDecorations();
    }

    initDecorations() {
        this.decorations.stars = [];
        for (let i = 0; i < 50; i++) {
            this.decorations.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.4,
                size: Math.random() * 2,
                alpha: Math.random() * 0.5 + 0.3
            });
        }

        this.decorations.forestTrees = [];
        for (let i = 0; i < 20; i++) {
            this.decorations.forestTrees.push({
                x: i * 80 + Math.sin(i) * 30,
                height: 100 + Math.random() * 150
            });
        }

        this.decorations.forestFloor = [];
        for (let i = 0; i < 30; i++) {
            this.decorations.forestFloor.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height * 0.55 + Math.random() * 30
            });
        }

        this.decorations.ferns = [];
        for (let i = 0; i < 15; i++) {
            this.decorations.ferns.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height * 0.5 + 50 + Math.random() * 100
            });
        }

        this.decorations.grass = [];
        for (let i = 0; i < 100; i++) {
            this.decorations.grass.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height * 0.65 + Math.random() * 20,
                offset: (Math.random() - 0.5) * 10,
                height: 10 + Math.random() * 15,
                alpha: 0.5 + Math.random() * 0.5
            });
        }

        this.decorations.stones = [];
        for (let i = 0; i < 50; i++) {
            this.decorations.stones.push({
                x: (i * 47) % this.canvas.width,
                y: this.canvas.height * 0.65 + Math.random() * 30,
                width: 20 + Math.random() * 30,
                height: 10 + Math.random() * 15,
                alpha: 0.3 + Math.random() * 0.3
            });
        }

        this.decorations.animals = [];
        if (Math.random() < 0.3) {
            this.decorations.animals.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height * 0.55
            });
        }
    }

    init() {
        this.generateWind();
        this.setupEventListeners();
        this.setupSelectionButtons();
        this.setupScopeMode();
        this.setupUIPanels();
        this.updateWeaponStats();
        this.gameLoop();
    }

    setupSelectionButtons() {
        document.querySelectorAll('[data-scene]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-scene]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentScene = e.target.dataset.scene;
                this.updateScene();
            });
        });

        document.querySelectorAll('[data-weapon]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-weapon]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentWeapon = e.target.dataset.weapon;
                this.applyWeaponSettings();
                this.updateWeaponStats();
            });
        });

        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMode = e.target.dataset.mode;
                this.applyModeSettings();
            });
        });
    }

    setupScopeMode() {
        const scopeBtn = document.getElementById('scopeBtn');
        scopeBtn.addEventListener('click', () => {
            this.isScopeMode = !this.isScopeMode;
            scopeBtn.classList.toggle('active', this.isScopeMode);
        });

        const fpvBtn = document.getElementById('fpvBtn');
        fpvBtn.addEventListener('click', () => {
            this.isFPV = !this.isFPV;
            fpvBtn.classList.toggle('active', this.isFPV);
            this.updateFPVView();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'v' || e.key === 'V') {
                this.isFPV = !this.isFPV;
                document.getElementById('fpvBtn').classList.toggle('active', this.isFPV);
                this.updateFPVView();
            }
            if (e.key === 'r' || e.key === 'R') {
                this.isScopeMode = !this.isScopeMode;
                document.getElementById('scopeBtn').classList.toggle('active', this.isScopeMode);
            }
        });
    }

    setupUIPanels() {
        const leaderboardBtn = document.getElementById('leaderboardBtn');
        leaderboardBtn.addEventListener('click', () => {
            this.showLeaderboard();
        });

        document.getElementById('closeLeaderboard').addEventListener('click', () => {
            document.getElementById('leaderboardPanel').classList.remove('show');
        });

        const vrBtn = document.getElementById('vrBtn');
        vrBtn.addEventListener('click', () => {
            this.isVRMode = !this.isVRMode;
            vrBtn.classList.toggle('active', this.isVRMode);
            if (this.isVRMode) {
                this.showVRPanel();
            }
        });

        document.getElementById('closeVR').addEventListener('click', () => {
            this.isVRMode = false;
            document.getElementById('vrBtn').classList.remove('active');
            document.getElementById('vrPanel').classList.remove('show');
        });

        document.getElementById('calibrateBtn').addEventListener('click', () => {
            this.calibrateVR();
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareScore();
        });
    }

    updateWeaponStats() {
        const weapon = this.weapons[this.currentWeapon];
        document.getElementById('powerStat').style.width = `${weapon.power * 100}%`;
        document.getElementById('accuracyStat').style.width = `${weapon.accuracy * 100}%`;
        document.getElementById('speedStat').style.width = `${weapon.speed * 100}%`;
    }

    showLeaderboard() {
        const panel = document.getElementById('leaderboardPanel');
        const list = document.getElementById('leaderboardList');

        list.innerHTML = '';

        if (this.leaderboard.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">暂无记录，快来创造第一个纪录吧！</p>';
        } else {
            this.leaderboard.forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = 'leaderboard-item';

                const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'normal';
                const date = new Date(entry.date);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

                const weaponNames = { longbow: '长弓', compound: '复合弓', crossbow: '弩' };
                const sceneNames = { range: '射箭场', forest: '森林', castle: '城堡' };
                const modeNames = { classic: '经典', moving: '移动靶', timed: '限时' };

                item.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="leaderboard-rank ${rankClass}">${index + 1}</div>
                        <div>
                            <div style="font-size: 16px; color: #fff;">${weaponNames[entry.weapon] || entry.weapon} - ${sceneNames[entry.scene] || entry.scene}</div>
                            <div class="leaderboard-meta">${modeNames[entry.mode] || entry.mode} · ${dateStr}</div>
                        </div>
                    </div>
                    <div class="leaderboard-score">${entry.score}</div>
                `;
                list.appendChild(item);
            });
        }

        panel.classList.add('show');
    }

    showVRPanel() {
        document.getElementById('vrPanel').classList.add('show');
        this.setupVRDetection();
    }

    setupVRDetection() {
        const indicator = document.getElementById('vrIndicator');

        if (window.DeviceOrientationEvent) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(response => {
                    if (response === 'granted') {
                        indicator.textContent = '● 已连接';
                        indicator.classList.add('connected');
                    }
                }).catch(console.error);
            } else {
                indicator.textContent = '● 已连接';
                indicator.classList.add('connected');
            }
        }
    }

    calibrateVR() {
        const indicator = document.getElementById('vrIndicator');
        indicator.textContent = '● 校准中...';

        setTimeout(() => {
            indicator.textContent = '● 已校准';
            indicator.classList.add('connected');
        }, 1500);
    }

    shareScore() {
        const text = `🏹 我在弓箭射击模拟中获得了 ${this.totalScore} 分！来挑战我吧！`;
        if (navigator.share) {
            navigator.share({
                title: '弓箭射击模拟',
                text: text
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text).then(() => {
                alert('成绩已复制到剪贴板！');
            }).catch(() => {
                alert('分享功能不可用');
            });
        }
    }

    updateScene() {
        this.stuckArrows = [];
    }

    applyWeaponSettings() {
        const weapon = this.weapons[this.currentWeapon];
        this.bow.maxPower = weapon.maxPower;
    }

    applyModeSettings() {
        if (this.currentMode === 'moving') {
            this.target.moving = true;
        } else {
            this.target.moving = false;
            this.target.x = this.target.originalX;
        }

        if (this.currentMode === 'timed') {
            document.getElementById('timerItem').style.display = 'flex';
            this.startTimer();
        } else {
            document.getElementById('timerItem').style.display = 'none';
            this.stopTimer();
        }
    }

    startTimer() {
        this.timer = 60;
        document.getElementById('timer').textContent = this.timer;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer--;
            document.getElementById('timer').textContent = this.timer;
            if (this.timer <= 0) {
                this.stopTimer();
                this.endGame();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateFPVView() {
        if (this.isFPV) {
            this.canvas.style.transform = 'scale(1.15)';
            this.canvas.style.transformOrigin = 'center center';
            this.canvas.style.transition = 'transform 0.3s ease';
        } else {
            this.canvas.style.transform = 'scale(1)';
        }
    }

    generateWind() {
        this.wind.speed = (Math.random() - 0.5) * 0.4;
        this.wind.direction = this.wind.speed >= 0 ? 1 : -1;
        this.wind.currentGust = 0;
        this.updateWindDisplay();
    }

    updateWindDisplay() {
        const windArrow = document.getElementById('windArrow');
        const windSpeed = document.getElementById('windSpeed');
        const totalWind = this.wind.speed + this.wind.currentGust;
        windArrow.textContent = totalWind >= 0 ? '→' : '←';
        windSpeed.textContent = Math.abs(totalWind * 100).toFixed(0);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        });

        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => this.handleDeviceOrientation(e));
        }
    }

    handleDeviceOrientation(e) {
        if (!this.isVRMode && !this.isFPV) return;
        const tiltX = e.gamma;
        const tiltY = e.beta;
        if (tiltX !== null && tiltY !== null) {
            const targetAngle = Math.atan2(tiltY - 45, tiltX);
            this.bow.angle += (targetAngle * 0.3 - this.bow.angle) * 0.1;
        }
    }

    handleMouseDown(e) {
        if (this.gameOver || !this.canShoot) return;
        if (this.currentArrow >= this.totalArrows) return;

        this.bow.isDragging = true;
        this.bow.power = 0;
        updatePowerBar(0);
    }

    handleMouseMove(e) {
        if (!this.bow.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let mouseY = e.clientY - rect.top;

        const weapon = this.weapons[this.currentWeapon];

        const dx = mouseX - this.bow.x;
        const dy = mouseY - this.bow.y;

        this.bow.angle = Math.atan2(dy, dx);

        const distance = Math.sqrt(dx * dx + dy * dy);
        const accuracyFactor = weapon.accuracy;
        this.bow.power = Math.min((distance / 15) * accuracyFactor, this.bow.maxPower);

        const powerPercent = (this.bow.power / this.bow.maxPower) * 100;
        updatePowerBar(powerPercent);
    }

    handleMouseUp(e) {
        if (!this.bow.isDragging) return;

        this.bow.isDragging = false;

        if (this.bow.power > 2) {
            this.shootArrow();
        }

        updatePowerBar(0);
    }

    shootArrow() {
        if (!this.canShoot) return;

        this.canShoot = false;
        this.currentArrow++;
        this.currentScore = 0;
        document.getElementById('currentScore').textContent = '-';
        this.updateArrowCount();

        const weapon = this.weapons[this.currentWeapon];
        const speedMultiplier = weapon.speed;
        const powerMultiplier = weapon.power;

        const arrow = {
            x: this.bow.x,
            y: this.bow.y,
            vx: Math.cos(this.bow.angle) * this.bow.power * speedMultiplier * powerMultiplier,
            vy: Math.sin(this.bow.angle) * this.bow.power * speedMultiplier * powerMultiplier,
            angle: this.bow.angle,
            active: true,
            trail: [],
            rotation: 0,
            angularVelocity: 0.05,
            isStuck: false
        };

        this.arrows.push(arrow);
        this.createShootParticles();

        setTimeout(() => {
            this.canShoot = true;
            if (this.currentArrow < this.totalArrows && this.currentMode !== 'timed') {
                this.generateWind();
            }
        }, 500);
    }

    createShootParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.bow.x,
                y: this.bow.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 30,
                color: '#ffd700'
            });
        }
    }

    createHitParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 40,
                color: '#ff6b6b'
            });
        }
    }

    updateArrowCount() {
        document.getElementById('arrowCount').textContent = `${this.currentArrow} / ${this.totalArrows}`;
    }

    updatePhysics() {
        if (this.target.moving) {
            this.target.moveOffset += this.target.moveSpeed * 0.02;
            this.target.x = this.target.originalX + Math.sin(this.target.moveOffset) * this.target.moveRange;
        }

        if (Math.random() < this.wind.gustChance) {
            this.wind.currentGust = (Math.random() - 0.5) * 0.2;
            this.updateWindDisplay();
            setTimeout(() => {
                this.wind.currentGust = 0;
                this.updateWindDisplay();
            }, 1000 + Math.random() * 2000);
        }

        for (let i = this.arrows.length - 1; i >= 0; i--) {
            const arrow = this.arrows[i];

            if (arrow.active && !arrow.isStuck) {
                arrow.trail.push({ x: arrow.x, y: arrow.y });
                if (arrow.trail.length > 30) arrow.trail.shift();

                arrow.vy += this.gravity;
                arrow.vx += this.wind.speed + this.wind.currentGust;

                arrow.vx *= this.airResistance;
                arrow.vy *= this.airResistance;

                arrow.x += arrow.vx;
                arrow.y += arrow.vy;

                arrow.angle = Math.atan2(arrow.vy, arrow.vx);
                arrow.rotation += arrow.angularVelocity;

                const hit = this.checkTargetCollision(arrow);
                if (hit) {
                    arrow.active = false;
                    arrow.isStuck = true;
                    this.stuckArrows.push({
                        x: hit.arrowX,
                        y: hit.arrowY,
                        angle: hit.arrowAngle,
                        weapon: this.currentWeapon
                    });
                    this.calculateScore(hit.distance);
                    this.addHitEffect(hit.x, hit.y, hit.points);
                    this.createHitParticles(hit.x, hit.y);
                    this.addCameraShake(5);
                    continue;
                }

                if (arrow.y > this.canvas.height + 50 || arrow.x > this.canvas.width + 50 || arrow.x < -50) {
                    arrow.active = false;
                    this.currentScore = 0;
                    this.updateScoreDisplay();
                }
            } else {
                if (arrow.trail.length > 0) {
                    arrow.trail.shift();
                }
            }
        }

        this.arrows = this.arrows.filter(a => a.active || a.trail.length > 0);

        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            this.hitEffects[i].life--;
            if (this.hitEffects[i].life <= 0) {
                this.hitEffects.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.cameraShakeIntensity > 0) {
            this.cameraShakeIntensity *= 0.9;
            if (this.cameraShakeIntensity < 0.1) this.cameraShakeIntensity = 0;
        }

        if (this.currentArrow >= this.totalArrows && this.arrows.every(a => !a.active)) {
            this.endGame();
        }
    }

    addCameraShake(intensity) {
        this.cameraShakeIntensity = intensity;
    }

    checkTargetCollision(arrow) {
        const arrowTipX = arrow.x + Math.cos(arrow.angle) * 15;
        const arrowTipY = arrow.y + Math.sin(arrow.angle) * 15;

        const dx = arrowTipX - this.target.x;
        const dy = arrowTipY - this.target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.target.radius) {
            return { x: arrowTipX, y: arrowTipY, distance, arrowX: arrow.x, arrowY: arrow.y, arrowAngle: arrow.angle };
        }
        return null;
    }

    calculateScore(distance) {
        let points = 0;
        const weapon = this.weapons[this.currentWeapon];
        for (const ring of this.target.rings) {
            if (distance <= ring.radius) {
                points = ring.points;
            }
        }

        points = Math.round(points * weapon.accuracy);
        this.currentScore = points;
        this.totalScore += points;
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        document.getElementById('currentScore').textContent = this.currentScore;
        document.getElementById('totalScore').textContent = this.totalScore;
    }

    addHitEffect(x, y, points) {
        this.hitEffects.push({
            x, y, points,
            life: 80,
            maxLife: 80,
            type: points >= 10 ? 'perfect' : points >= 7 ? 'great' : 'good'
        });
    }

    endGame() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.stopTimer();

        this.saveScore(this.totalScore);

        document.getElementById('finalScore').textContent = this.totalScore;
        document.getElementById('gameOver').classList.add('show');

        const gameOverContent = document.querySelector('.game-over-content');
        const rank = this.getRank(this.totalScore);
        const rankDisplay = document.createElement('p');
        rankDisplay.className = 'rank-display';
        rankDisplay.innerHTML = `评级: <span style="color: #ffd700; font-size: 36px;">${rank}</span>`;
        const existingRank = gameOverContent.querySelector('.rank-display');
        if (existingRank) existingRank.remove();
        gameOverContent.insertBefore(rankDisplay, document.querySelector('.final-score').nextSibling);
    }

    getRank(score) {
        const perfectScore = this.totalArrows * 10;
        const percentage = (score / perfectScore) * 100;
        if (percentage >= 90) return 'S';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 40) return 'D';
        return 'F';
    }

    restartGame() {
        this.currentArrow = 0;
        this.currentScore = 0;
        this.totalScore = 0;
        this.gameOver = false;
        this.canShoot = true;
        this.arrows = [];
        this.stuckArrows = [];
        this.hitEffects = [];
        this.particles = [];

        this.updateArrowCount();
        this.updateScoreDisplay();
        document.getElementById('currentScore').textContent = '-';
        document.getElementById('gameOver').classList.remove('show');

        this.generateWind();
        if (this.currentMode === 'timed') {
            this.startTimer();
        }
    }

    loadLeaderboard() {
        const saved = localStorage.getItem('archeryLeaderboard');
        return saved ? JSON.parse(saved) : [];
    }

    saveScore(score) {
        const entry = {
            score,
            date: new Date().toISOString(),
            weapon: this.currentWeapon,
            scene: this.currentScene,
            mode: this.currentMode
        };
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);
        localStorage.setItem('archeryLeaderboard', JSON.stringify(this.leaderboard));
    }

    render() {
        this.ctx.save();

        if (this.cameraShakeIntensity > 0) {
            this.ctx.translate(
                (Math.random() - 0.5) * this.cameraShakeIntensity,
                (Math.random() - 0.5) * this.cameraShakeIntensity
            );
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();
        this.drawTarget();

        for (const stuckArrow of this.stuckArrows) {
            this.drawStuckArrow(stuckArrow);
        }

        this.drawBow();

        for (const arrow of this.arrows) {
            this.drawArrow(arrow);
        }

        for (const effect of this.hitEffects) {
            this.drawHitEffect(effect);
        }

        for (const p of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.life / 40;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        if (this.bow.isDragging) {
            this.drawTrajectoryPreview();
        }

        if (this.isScopeMode) {
            this.drawScopeView();
        }

        this.ctx.restore();
    }

    drawBackground() {
        switch (this.currentScene) {
            case 'forest':
                this.drawForestScene();
                break;
            case 'castle':
                this.drawCastleScene();
                break;
            default:
                this.drawRangeScene();
        }
    }

    drawRangeScene() {
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
        skyGradient.addColorStop(0, '#1a1a2e');
        skyGradient.addColorStop(1, '#4a90d9');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);

        this.drawStars();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(100, 80, 60);
        this.drawCloud(300, 120, 40);
        this.drawCloud(600, 60, 50);
        this.drawCloud(900, 100, 45);

        const gradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.6, 0, this.canvas.height);
        gradient.addColorStop(0, '#228B22');
        gradient.addColorStop(0.5, '#006400');
        gradient.addColorStop(1, '#004d00');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);

        this.drawGrass();

        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, 10);

        this.drawFiringLine();
    }

    drawForestScene() {
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.5);
        skyGradient.addColorStop(0, '#0d3320');
        skyGradient.addColorStop(0.5, '#1a4d2e');
        skyGradient.addColorStop(1, '#2d5a3d');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.5);

        this.drawLightRays();

        for (const tree of this.decorations.forestTrees) {
            this.drawTree(tree.x, this.canvas.height * 0.5, tree.height);
        }

        const groundGradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.5, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#2d5a3d');
        groundGradient.addColorStop(0.3, '#1a4d2e');
        groundGradient.addColorStop(1, '#0d3320');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.5, this.canvas.width, this.canvas.height * 0.5);

        this.drawForestFloor();

        for (const fern of this.decorations.ferns) {
            this.drawFern(fern.x, fern.y);
        }

        this.drawAnimals();
    }

    drawCastleScene() {
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
        skyGradient.addColorStop(0, '#2d1b4e');
        skyGradient.addColorStop(0.3, '#4a2c6a');
        skyGradient.addColorStop(0.7, '#8b4513');
        skyGradient.addColorStop(1, '#cd853f');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);

        this.drawSun();
        this.drawClouds();

        this.drawCastleWalls();

        const groundGradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.6, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#8b7355');
        groundGradient.addColorStop(0.5, '#6b5344');
        groundGradient.addColorStop(1, '#4a3728');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);

        this.drawStoneGround();
        this.drawBattlements();
        this.drawFlags();
    }

    drawStars() {
        for (const star of this.decorations.stars) {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            this.ctx.fill();
        }
    }

    drawLightRays() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.1;
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(200 + i * 150, 0);
            this.ctx.lineTo(150 + i * 150, this.canvas.height);
            this.ctx.lineTo(250 + i * 150, this.canvas.height);
            this.ctx.closePath();
            this.ctx.fillStyle = '#90EE90';
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawTree(x, y, height) {
        this.ctx.fillStyle = '#4a3728';
        this.ctx.fillRect(x - 10, y - height * 0.3, 20, height * 0.3);

        this.ctx.fillStyle = '#1a4d2e';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - height);
        this.ctx.lineTo(x - 40, y - height * 0.5);
        this.ctx.lineTo(x - 30, y - height * 0.5);
        this.ctx.lineTo(x - 50, y - height * 0.2);
        this.ctx.lineTo(x - 35, y - height * 0.2);
        this.ctx.lineTo(x - 20, y);
        this.ctx.lineTo(x + 20, y);
        this.ctx.lineTo(x + 35, y - height * 0.2);
        this.ctx.lineTo(x + 50, y - height * 0.2);
        this.ctx.lineTo(x + 30, y - height * 0.5);
        this.ctx.lineTo(x + 40, y - height * 0.5);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#2d5a3d';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - height * 0.9);
        this.ctx.lineTo(x - 35, y - height * 0.4);
        this.ctx.lineTo(x + 35, y - height * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawForestFloor() {
        for (const item of this.decorations.forestFloor) {
            this.ctx.beginPath();
            this.ctx.ellipse(item.x, item.y, 3, 2, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = '#228B22';
            this.ctx.fill();
        }
    }

    drawFern(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);
        for (let i = 0; i < 5; i++) {
            this.ctx.save();
            this.ctx.rotate((i - 2) * 0.3);
            this.ctx.beginPath();
            this.ctx.ellipse(0, -20, 5, 25, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = '#228B22';
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.restore();
    }

    drawAnimals() {
        for (const animal of this.decorations.animals) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.ellipse(animal.x, animal.y, 15, 10, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(animal.x + 10, animal.y - 8, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawSun() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width * 0.8, this.canvas.height * 0.2, 60, 0, Math.PI * 2);
        const sunGradient = this.ctx.createRadialGradient(
            this.canvas.width * 0.8, this.canvas.height * 0.2, 0,
            this.canvas.width * 0.8, this.canvas.height * 0.2, 60
        );
        sunGradient.addColorStop(0, '#ffdd00');
        sunGradient.addColorStop(0.5, '#ff8800');
        sunGradient.addColorStop(1, 'rgba(255, 136, 0, 0)');
        this.ctx.fillStyle = sunGradient;
        this.ctx.fill();
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
        this.drawCloud(200, 100, 80);
        this.drawCloud(500, 80, 60);
        this.drawCloud(800, 120, 70);
    }

    drawCastleWalls() {
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(0, this.canvas.height * 0.45, 80, this.canvas.height * 0.2);

        for (let i = 0; i < 5; i++) {
            this.ctx.fillRect(i * 20, this.canvas.height * 0.4, 15, 15);
        }

        this.ctx.fillStyle = '#808080';
        this.ctx.fillRect(this.canvas.width - 150, this.canvas.height * 0.35, 120, this.canvas.height * 0.3);

        for (let i = 0; i < 6; i++) {
            this.ctx.fillRect(this.canvas.width - 150 + i * 22, this.canvas.height * 0.3, 18, 18);
        }

        this.ctx.fillStyle = '#5a5a5a';
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - 150, this.canvas.height * 0.35);
        this.ctx.lineTo(this.canvas.width - 90, this.canvas.height * 0.25);
        this.ctx.lineTo(this.canvas.width - 30, this.canvas.height * 0.35);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawStoneGround() {
        for (const stone of this.decorations.stones) {
            this.ctx.fillStyle = `rgba(100, 100, 100, ${stone.alpha})`;
            this.ctx.fillRect(stone.x, stone.y, stone.width, stone.height);
        }
    }

    drawBattlements() {
        this.ctx.strokeStyle = '#4a4a4a';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            const x = i * (this.canvas.width / 10);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.canvas.height * 0.6);
            this.ctx.lineTo(x + 30, this.canvas.height * 0.6);
            this.ctx.stroke();
        }
    }

    drawFlags() {
        const flagColors = ['#8B0000', '#FFD700', '#000080'];
        for (let i = 0; i < 3; i++) {
            const x = this.canvas.width - 130 + i * 40;
            const y = this.canvas.height * 0.2;
            this.ctx.fillStyle = '#4a3728';
            this.ctx.fillRect(x, y, 3, 40);
            this.ctx.fillStyle = flagColors[i];
            this.ctx.beginPath();
            this.ctx.moveTo(x + 3, y);
            this.ctx.lineTo(x + 25, y + 10);
            this.ctx.lineTo(x + 3, y + 20);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawGrass() {
        for (const grass of this.decorations.grass) {
            this.ctx.strokeStyle = `rgba(0, 100, 0, ${grass.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(grass.x, grass.y);
            this.ctx.lineTo(grass.x + grass.offset, grass.y - grass.height);
            this.ctx.stroke();
        }
    }

    drawFiringLine() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.bow.x + 50, 0);
        this.ctx.lineTo(this.bow.x + 50, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTarget() {
        const { x, y, rings } = this.target;

        this.ctx.fillStyle = '#8B4513';
        if (this.currentScene === 'castle') {
            this.ctx.fillRect(x - 8, y - 30, 16, this.canvas.height * 0.55 - y + 30);
        } else {
            this.ctx.fillRect(x - 5, y - 20, 10, this.canvas.height * 0.6 - y + 20);
        }

        for (let i = 0; i < rings.length; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, rings[i].radius, 0, Math.PI * 2);
            this.ctx.fillStyle = rings[i].color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fill();

        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        for (let i = 0; i < rings.length; i++) {
            const angle = -Math.PI / 4;
            const textX = x + Math.cos(angle) * rings[i].radius * 0.7;
            const textY = y + Math.sin(angle) * rings[i].radius * 0.7;
            this.ctx.fillText(rings[i].points.toString(), textX, textY);
        }
    }

    drawBow() {
        const { x, y, angle, power, isDragging } = this.bow;
        const weapon = this.weapons[this.currentWeapon];

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        this.ctx.fillStyle = weapon.color;
        this.ctx.fillRect(-10, -5, 20, 10);

        const bowLength = 80;
        const pullBack = isDragging ? power * 2 : 0;

        if (this.currentWeapon === 'crossbow') {
            this.ctx.fillStyle = '#2d3748';
            this.ctx.fillRect(0, -8, 60, 16);
            this.ctx.fillStyle = '#4a5568';
            this.ctx.fillRect(50, -12, 10, 24);
            this.ctx.beginPath();
            this.ctx.moveTo(55, -bowLength / 2);
            this.ctx.lineTo(55, bowLength / 2);
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 8;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(55, -bowLength / 2);
            this.ctx.lineTo(-pullBack, 0);
            this.ctx.lineTo(55, bowLength / 2);
            this.ctx.strokeStyle = '#ddd';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            if (isDragging) {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(-pullBack - 40, -3, 40, 6);
                this.ctx.beginPath();
                this.ctx.moveTo(-pullBack, 0);
                this.ctx.lineTo(-pullBack - 15, -10);
                this.ctx.lineTo(-pullBack - 15, 10);
                this.ctx.closePath();
                this.ctx.fillStyle = '#C0C0C0';
                this.ctx.fill();
            }
        } else if (this.currentWeapon === 'compound') {
            this.ctx.beginPath();
            this.ctx.ellipse(30, 0, 20, 35, 0, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#4a5568';
            this.ctx.lineWidth = 5;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(10, -bowLength / 2);
            this.ctx.quadraticCurveTo(50 + pullBack, 0, 10, bowLength / 2);
            this.ctx.strokeStyle = '#68D391';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(10, -bowLength / 2);
            this.ctx.lineTo(-pullBack, 0);
            this.ctx.lineTo(10, bowLength / 2);
            this.ctx.strokeStyle = '#aaa';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            if (isDragging) {
                this.ctx.fillStyle = '#4a5568';
                this.ctx.fillRect(-pullBack - 35, -3, 35, 6);
                this.ctx.beginPath();
                this.ctx.moveTo(-pullBack, 0);
                this.ctx.lineTo(-pullBack - 12, -7);
                this.ctx.lineTo(-pullBack - 12, 7);
                this.ctx.closePath();
                this.ctx.fillStyle = '#68D391';
                this.ctx.fill();
            }
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(10, -bowLength / 2);
            this.ctx.quadraticCurveTo(50 + pullBack, 0, 10, bowLength / 2);
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 6;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(10, -bowLength / 2);
            this.ctx.lineTo(-pullBack, 0);
            this.ctx.lineTo(10, bowLength / 2);
            this.ctx.strokeStyle = '#ddd';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            if (isDragging) {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(-pullBack - 40, -2, 40, 4);
                this.ctx.beginPath();
                this.ctx.moveTo(-pullBack, 0);
                this.ctx.lineTo(-pullBack - 15, -8);
                this.ctx.lineTo(-pullBack - 15, 8);
                this.ctx.closePath();
                this.ctx.fillStyle = '#C0C0C0';
                this.ctx.fill();
            }
        }

        this.ctx.restore();
    }

    drawArrow(arrow) {
        if (arrow.trail.length > 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(arrow.trail[0].x, arrow.trail[0].y);
            for (let i = 1; i < arrow.trail.length; i++) {
                this.ctx.lineTo(arrow.trail[i].x, arrow.trail[i].y);
            }
            this.ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            this.ctx.strokeStyle = 'rgba(255, 150, 50, 0.2)';
            this.ctx.lineWidth = 8;
            this.ctx.stroke();
        }

        if (!arrow.active) return;

        this.ctx.save();
        this.ctx.translate(arrow.x, arrow.y);
        this.ctx.rotate(arrow.angle);

        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-35, -3, 45, 6);

        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-30 + i * 8, -3);
            this.ctx.lineTo(-30 + i * 8, 3);
            this.ctx.stroke();
        }

        this.ctx.beginPath();
        this.ctx.moveTo(10, 0);
        this.ctx.lineTo(-5, -10);
        this.ctx.lineTo(-5, 10);
        this.ctx.closePath();
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fill();

        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.moveTo(-35, 0);
        this.ctx.lineTo(-45, -10);
        this.ctx.lineTo(-40, 0);
        this.ctx.lineTo(-45, 10);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
        this.ctx.beginPath();
        this.ctx.moveTo(-5, 0);
        this.ctx.lineTo(-20, -8);
        this.ctx.lineTo(-20, 8);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawStuckArrow(stuckArrow) {
        this.ctx.save();
        this.ctx.translate(stuckArrow.x, stuckArrow.y);
        this.ctx.rotate(stuckArrow.angle);

        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-30, -2, 40, 4);

        this.ctx.beginPath();
        this.ctx.moveTo(10, 0);
        this.ctx.lineTo(-5, -8);
        this.ctx.lineTo(-5, 8);
        this.ctx.closePath();
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fill();

        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.moveTo(-30, 0);
        this.ctx.lineTo(-40, -8);
        this.ctx.lineTo(-35, 0);
        this.ctx.lineTo(-40, 8);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawHitEffect(effect) {
        const alpha = effect.life / effect.maxLife;
        const scale = 1 + (1 - alpha) * 0.5;
        const offsetY = (1 - alpha) * 60;

        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        if (effect.type === 'perfect') {
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, (1 - alpha) * 50, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.5})`;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const sparkX = effect.x + Math.cos(angle) * (1 - alpha) * 40;
                const sparkY = effect.y + Math.sin(angle) * (1 - alpha) * 40;
                this.ctx.beginPath();
                this.ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                this.ctx.fill();
            }
        }

        this.ctx.font = `bold ${48 * scale}px Arial`;
        this.ctx.fillStyle = effect.type === 'perfect' ? '#ffd700' :
            effect.type === 'great' ? '#00ff00' : '#ffffff';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(`+${effect.points}`, effect.x, effect.y - offsetY);
        this.ctx.fillText(`+${effect.points}`, effect.x, effect.y - offsetY);

        if (effect.type === 'perfect') {
            this.ctx.font = `bold ${24 * scale}px Arial`;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.strokeText('完美!', effect.x, effect.y - offsetY - 40);
            this.ctx.fillText('完美!', effect.x, effect.y - offsetY - 40);
        }

        this.ctx.restore();
    }

    drawTrajectoryPreview() {
        const { x, y, angle, power } = this.bow;
        const weapon = this.weapons[this.currentWeapon];
        let vx = Math.cos(angle) * power * weapon.speed * weapon.power;
        let vy = Math.sin(angle) * power * weapon.speed * weapon.power;
        let px = x;
        let py = y;

        this.ctx.beginPath();
        this.ctx.moveTo(px, py);

        for (let i = 0; i < 60; i++) {
            vy += this.gravity;
            vx += this.wind.speed + this.wind.currentGust;
            vx *= this.airResistance;
            vy *= this.airResistance;
            px += vx;
            py += vy;

            if (py > this.canvas.height || px > this.canvas.width) break;

            this.ctx.lineTo(px, py);
        }

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`预估距离: ${Math.round((px - x) / 10)}m`, x + 50, y - 50);
    }

    drawScopeView() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const scopeRadius = Math.min(this.canvas.width, this.canvas.height) * 0.35;

        this.ctx.save();

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, scopeRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, scopeRadius - 10, 0, Math.PI * 2);
        this.ctx.clip();

        this.drawBackground();
        this.drawTarget();
        this.drawBow();

        this.ctx.restore();

        this.ctx.save();

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 20;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, scopeRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, scopeRadius - 20, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(centerX - scopeRadius + 20, centerY);
        this.ctx.lineTo(centerX + scopeRadius - 20, centerY);
        this.ctx.moveTo(centerX, centerY - scopeRadius + 20);
        this.ctx.lineTo(centerX, centerY + scopeRadius - 20);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        this.ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, i * 20, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(centerX - 80, centerY + scopeRadius - 60, 160, 50);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`距离: ${Math.round((this.target.x - this.bow.x) / 10)}m`, centerX, centerY + scopeRadius - 40);
        this.ctx.fillText(`风力: ${Math.abs((this.wind.speed + this.wind.currentGust) * 100).toFixed(0)}`, centerX, centerY + scopeRadius - 20);

        this.ctx.restore();
    }

    gameLoop() {
        this.updatePhysics();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

function updatePowerBar(percent) {
    document.getElementById('powerFill').style.height = `${percent}%`;
}

window.addEventListener('load', () => {
    new ArcheryGame();
});
