class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.state = 'MENU';
        this.player = new Player(this.canvas);
        this.coins = [];
        this.obstacles = [];
        this.clouds = [];
        this.collectedCoins = 0;
        this.coinScore = 0;
        this.landingScore = 0;
        this.totalScore = 0;
        this.targetX = this.canvas.width / 2;

        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };

        this.maxAltitude = 3000;
        this.currentAltitude = this.maxAltitude;
        this.parachuteOpenAltitude = 500;

        this.lastTime = 0;
        this.deltaTime = 0;

        this.initClouds();
        this.initEventListeners();
        this.updateHighScoreDisplay();
        
        if (Utils.isMobile()) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }

        this.gameLoop(0);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.player) {
            this.player.canvas = this.canvas;
        }
        this.targetX = this.canvas.width / 2;
    }

    initClouds() {
        for (let i = 0; i < 15; i++) {
            this.clouds.push({
                x: Utils.random(0, this.canvas.width),
                y: Utils.random(0, this.canvas.height),
                width: Utils.random(100, 250),
                height: Utils.random(40, 80),
                speed: Utils.random(0.2, 0.8),
                opacity: Utils.random(0.3, 0.7)
            });
        }
    }

    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.keys.left = true;
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.keys.right = true;
            }
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                this.keys.up = true;
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                this.keys.down = true;
            }
            if (e.key === ' ') {
                e.preventDefault();
                this.tryOpenParachute();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.keys.left = false;
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.keys.right = false;
            }
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                this.keys.up = false;
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                this.keys.down = false;
            }
        });

        this.canvas.addEventListener('click', () => {
            if (this.state === 'PLAYING') {
                this.tryOpenParachute();
            }
        });

        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());

        document.querySelectorAll('.dpad-btn').forEach(btn => {
            const key = btn.dataset.key;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[key] = true;
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[key] = false;
            });
        });

        document.getElementById('parachuteBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.tryOpenParachute();
        });
    }

    startGame() {
        this.state = 'PLAYING';
        this.player.reset();
        this.coins = [];
        this.obstacles = [];
        this.collectedCoins = 0;
        this.coinScore = 0;
        this.landingScore = 0;
        this.totalScore = 0;
        this.currentAltitude = this.maxAltitude;

        this.generateLevel();

        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        
        if (Utils.isMobile()) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }
    }

    generateLevel() {
        const levelLength = 3000;
        
        for (let y = 200; y < levelLength; y += Utils.random(80, 150)) {
            this.coins.push(new Coin(this.canvas, y));
        }

        const obstacleTypes = ['bird', 'balloon', 'drone'];
        for (let y = 300; y < levelLength; y += Utils.random(150, 250)) {
            const type = obstacleTypes[Utils.randomInt(0, obstacleTypes.length - 1)];
            this.obstacles.push(new Obstacle(this.canvas, y, type));
        }
    }

    tryOpenParachute() {
        if (this.state === 'PLAYING' && this.currentAltitude <= this.parachuteOpenAltitude) {
            this.player.openParachute();
            document.getElementById('parachuteHint').classList.add('hidden');
        }
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING' && this.state !== 'PARACHUTE') return;

        const timeScale = deltaTime * 60;

        this.player.update(this.keys, deltaTime);

        const fallSpeed = this.player.parachuteOpen ? 1 : 3;
        this.currentAltitude = Math.max(0, this.currentAltitude - fallSpeed * 2 * timeScale);

        if (this.currentAltitude <= this.parachuteOpenAltitude && !this.player.parachuteOpen) {
            document.getElementById('parachuteHint').classList.remove('hidden');
        }

        this.coins.forEach(coin => {
            coin.update(this.player.y);
            if (coin.checkCollision(this.player)) {
                coin.collect();
                this.collectedCoins++;
                this.coinScore += 100;
            }
        });

        this.obstacles.forEach(obstacle => {
            obstacle.update(this.player.y);
            if (obstacle.checkCollision(this.player)) {
                this.currentAltitude = Math.max(0, this.currentAltitude - 200);
                obstacle.y = -1000;
            }
        });

        if (this.player.parachuteOpen) {
            this.state = 'PARACHUTE';
        }

        if (this.currentAltitude <= 0) {
            this.endGame();
        }

        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('altitude').textContent = Math.round(this.currentAltitude) + 'm';
        document.getElementById('coins').textContent = '🪙 ' + this.collectedCoins;
    }

    endGame() {
        this.state = 'GAME_OVER';

        const distanceFromTarget = Math.abs(this.player.x - this.targetX);
        const maxDistance = this.canvas.width / 2;

        if (distanceFromTarget < 30) {
            this.landingScore = 500;
        } else if (distanceFromTarget < 80) {
            this.landingScore = 300;
        } else if (distanceFromTarget < 150) {
            this.landingScore = 150;
        } else if (distanceFromTarget < 250) {
            this.landingScore = 50;
        } else {
            this.landingScore = 0;
        }

        this.totalScore = this.coinScore + this.landingScore;

        const highScore = Utils.getHighScore();
        const isNewHighScore = this.totalScore > highScore;
        if (isNewHighScore) {
            Utils.setHighScore(this.totalScore);
        }

        document.getElementById('hud').classList.add('hidden');
        document.getElementById('mobileControls').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.remove('hidden');
        document.getElementById('coinScore').textContent = this.coinScore;
        document.getElementById('landingScore').textContent = this.landingScore;
        document.getElementById('totalScore').textContent = this.totalScore;

        const newHighScoreEl = document.getElementById('newHighScore');
        if (isNewHighScore) {
            newHighScoreEl.classList.remove('hidden');
        } else {
            newHighScoreEl.classList.add('hidden');
        }

        document.getElementById('parachuteHint').classList.add('hidden');
    }

    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = Utils.getHighScore();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawSky();
        this.drawClouds();

        if (this.state === 'PLAYING' || this.state === 'PARACHUTE') {
            this.drawTarget();

            const allObjects = [
                ...this.coins.map(c => ({ obj: c, type: 'coin', y: c.y })),
                ...this.obstacles.map(o => ({ obj: o, type: 'obstacle', y: o.y }))
            ].sort((a, b) => b.y - a.y);

            allObjects.forEach(item => {
                if (item.type === 'coin') {
                    item.obj.draw(this.ctx, this.player.y);
                } else {
                    item.obj.draw(this.ctx, this.player.y);
                }
            });

            this.player.draw(this.ctx);

            if (!this.player.parachuteOpen) {
                this.drawSpeedLines();
            }
        }
    }

    drawSky() {
        const progress = 1 - this.currentAltitude / this.maxAltitude;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        const skyBlue = { r: 135, g: 206, b: 235 };
        const deepBlue = { r: 30, g: 144, b: 255 };
        const groundGreen = { r: 34, g: 139, b: 34 };

        if (progress < 0.7) {
            const t = progress / 0.7;
            gradient.addColorStop(0, `rgb(${Math.round(skyBlue.r + (deepBlue.r - skyBlue.r) * t)}, ${Math.round(skyBlue.g + (deepBlue.g - skyBlue.g) * t)}, ${Math.round(skyBlue.b + (deepBlue.b - skyBlue.b) * t)})`);
            gradient.addColorStop(1, `rgb(${Math.round(skyBlue.r * 0.8 + (deepBlue.r * 0.8 - skyBlue.r * 0.8) * t)}, ${Math.round(skyBlue.g * 0.8 + (deepBlue.g * 0.8 - skyBlue.g * 0.8) * t)}, ${Math.round(skyBlue.b * 0.8 + (deepBlue.b * 0.8 - skyBlue.b * 0.8) * t)})`);
        } else {
            const t = (progress - 0.7) / 0.3;
            gradient.addColorStop(0, `rgb(${Math.round(deepBlue.r + (groundGreen.r - deepBlue.r) * t * 0.5)}, ${Math.round(deepBlue.g + (groundGreen.g - deepBlue.g) * t * 0.5)}, ${Math.round(deepBlue.b + (groundGreen.b - deepBlue.b) * t * 0.3)})`);
            gradient.addColorStop(1, `rgb(${Math.round(deepBlue.r * 0.7 + (groundGreen.r - deepBlue.r * 0.7) * t)}, ${Math.round(deepBlue.g * 0.7 + (groundGreen.g - deepBlue.g * 0.7) * t)}, ${Math.round(deepBlue.b * 0.5 + (groundGreen.b - deepBlue.b * 0.5) * t * 0.5)})`);
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentAltitude < 300) {
            const groundAlpha = Utils.map(this.currentAltitude, 300, 0, 0, 1);
            this.ctx.fillStyle = `rgba(34, 139, 34, ${groundAlpha})`;
            this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);
        }
    }

    drawClouds() {
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width + cloud.width;
                cloud.y = Utils.random(0, this.canvas.height * 0.6);
            }

            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            this.ctx.beginPath();
            this.ctx.ellipse(cloud.x, cloud.y, cloud.width * 0.4, cloud.height * 0.5, 0, 0, Math.PI * 2);
            this.ctx.ellipse(cloud.x + cloud.width * 0.3, cloud.y - cloud.height * 0.2, cloud.width * 0.35, cloud.height * 0.5, 0, 0, Math.PI * 2);
            this.ctx.ellipse(cloud.x + cloud.width * 0.5, cloud.y + cloud.height * 0.1, cloud.width * 0.3, cloud.height * 0.4, 0, 0, Math.PI * 2);
            this.ctx.ellipse(cloud.x - cloud.width * 0.2, cloud.y + cloud.height * 0.1, cloud.width * 0.25, cloud.height * 0.4, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawTarget() {
        if (this.currentAltitude > 500) return;

        const alpha = Utils.map(this.currentAltitude, 500, 0, 0.3, 1);
        const targetY = this.canvas.height * 0.85;

        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        const rings = [
            { radius: 120, color: '#FFF' },
            { radius: 100, color: '#FF6B6B' },
            { radius: 70, color: '#FFF' },
            { radius: 40, color: '#FF6B6B' },
            { radius: 15, color: '#FFD700' }
        ];

        rings.forEach(ring => {
            this.ctx.fillStyle = ring.color;
            this.ctx.beginPath();
            this.ctx.ellipse(this.targetX, targetY, ring.radius, ring.radius * 0.3, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 16px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎯 目标区域', this.targetX, targetY + 80);

        this.ctx.restore();
    }

    drawSpeedLines() {
        const lineCount = 15;
        
        for (let i = 0; i < lineCount; i++) {
            const x = Utils.random(0, this.canvas.width);
            const y = Utils.random(0, this.canvas.height);
            const length = Utils.random(30, 80);
            const alpha = Utils.random(0.1, 0.3);

            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + length);
            this.ctx.stroke();
        }
    }

    gameLoop(timestamp) {
        this.deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(this.deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

window.addEventListener('load', () => {
    new Game();
});
