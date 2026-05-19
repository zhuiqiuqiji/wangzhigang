class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.state = {
            score: 0,
            highScore: Utils.getHighScore('classic'),
            isPlaying: false,
            isGameOver: false,
            isNewRecord: false,
            missedCount: 0,
            maxMissed: 3,
            combo: 0,
            maxCombo: 0,
            comboTimer: 0,
            comboTimeout: 60,
            scoreMultiplier: 1,
            slowMotion: false,
            slowMotionTimer: 0,
            doubleScoreTimer: 0,
            gameMode: 'classic',
            timeLeft: 60,
            timeLimit: 60,
            showModeSelect: true,
            difficulty: 1
        };

        this.particles = [];
        this.fruitManager = new FruitManager();
        this.bombManager = new BombManager();
        this.inputManager = new InputManager(this.canvas);
        this.renderer = new Renderer(this.canvas);

        this.animationId = null;
        this.lastTime = 0;

        this.setupCanvas();
        this.bindEvents();
        this.gameLoop();
    }

    setupCanvas() {
        const resize = () => {
            const width = Math.min(window.innerWidth, 900);
            const height = Math.min(window.innerHeight, 700);
            this.renderer.resize(width, height);
        };

        resize();
        window.addEventListener('resize', Utils.debounce(resize, 200));
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => {
            const pos = this.getCanvasPosition(e);
            if (this.state.showModeSelect && !this.state.isPlaying && !this.state.isGameOver) {
                const mode = this.getModeFromClick(pos.x, pos.y);
                if (mode) {
                    this.state.gameMode = mode;
                    this.state.showModeSelect = false;
                    this.startGame();
                }
            } else if (!this.state.isPlaying && !this.state.isGameOver) {
                this.state.showModeSelect = true;
            } else if (this.state.isGameOver) {
                this.state.showModeSelect = true;
                this.restartGame();
            }
        });

        this.canvas.addEventListener('touchstart', (e) => {
            if (this.state.showModeSelect && !this.state.isPlaying && !this.state.isGameOver) {
                e.preventDefault();
                const pos = this.getCanvasPosition(e.touches[0]);
                const mode = this.getModeFromClick(pos.x, pos.y);
                if (mode) {
                    this.state.gameMode = mode;
                    this.state.showModeSelect = false;
                    this.startGame();
                }
            } else if (!this.state.isPlaying && !this.state.isGameOver) {
                e.preventDefault();
                this.state.showModeSelect = true;
            } else if (this.state.isGameOver) {
                e.preventDefault();
                this.state.showModeSelect = true;
                this.restartGame();
            }
        }, { passive: false });
    }

    getCanvasPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    getModeFromClick(x, y) {
        const centerX = this.renderer.width / 2;
        const centerY = this.renderer.height / 2;
        const buttonWidth = 250;
        const buttonHeight = 70;
        const buttonY = centerY - 20;

        if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2) {
            if (y >= buttonY - 100 && y <= buttonY - 100 + buttonHeight) {
                return 'classic';
            } else if (y >= buttonY && y <= buttonY + buttonHeight) {
                return 'timed';
            } else if (y >= buttonY + 100 && y <= buttonY + 100 + buttonHeight) {
                return 'endless';
            }
        }
        return null;
    }

    startGame() {
        this.state.isPlaying = true;
        this.state.isGameOver = false;
        this.state.score = 0;
        this.state.missedCount = 0;
        this.state.isNewRecord = false;
        this.state.combo = 0;
        this.state.maxCombo = 0;
        this.state.comboTimer = 0;
        this.state.scoreMultiplier = 1;
        this.state.slowMotion = false;
        this.state.slowMotionTimer = 0;
        this.state.doubleScoreTimer = 0;
        this.state.difficulty = 1;
        this.state.highScore = Utils.getHighScore(this.state.gameMode);

        if (this.state.gameMode === 'timed') {
            this.state.timeLeft = 60;
            this.state.maxMissed = 999;
        } else if (this.state.gameMode === 'endless') {
            this.state.maxMissed = 3;
            this.state.difficulty = 1;
        } else {
            this.state.maxMissed = 3;
        }

        this.particles = [];
        this.fruitManager.reset();
        this.bombManager.reset();
        this.inputManager.clearTrail();
        this.inputManager.trailEffect = 'normal';
        this.renderer.clearPopups();

        this.gameTime = 0;
        this.lastTimeUpdate = Date.now();
    }

    restartGame() {
        this.startGame();
    }

    endGame() {
        this.state.isPlaying = false;
        this.state.isGameOver = true;

        const currentHighScore = Utils.getHighScore(this.state.gameMode);
        if (this.state.score > currentHighScore) {
            this.state.highScore = this.state.score;
            this.state.isNewRecord = true;
            Utils.setHighScore(this.state.score, this.state.gameMode);
        }

        this.bombManager.explodeAll();
    }

    update() {
        if (!this.state.isPlaying) {
            this.fruitManager.update(this.renderer.width, this.renderer.height, this.state.slowMotion);
            this.bombManager.update(this.renderer.width, this.renderer.height, this.state.slowMotion);
            this.particles = this.renderer.updateParticles(this.particles);
            return;
        }

        this.gameTime++;

        if (this.state.gameMode === 'timed') {
            const now = Date.now();
            if (now - this.lastTimeUpdate >= 1000) {
                this.state.timeLeft--;
                this.lastTimeUpdate = now;
                if (this.state.timeLeft <= 0) {
                    this.endGame();
                    return;
                }
            }
        }

        if (this.state.gameMode === 'endless') {
            this.state.difficulty = 1 + Math.floor(this.gameTime / 600) * 0.2;
            this.fruitManager.spawnInterval = Math.max(20, 60 - this.state.difficulty * 10);
            this.bombManager.bombChance = Math.min(0.3, 0.15 + this.state.difficulty * 0.03);
        }

        this.fruitManager.update(this.renderer.width, this.renderer.height, this.state.slowMotion);
        this.bombManager.update(this.renderer.width, this.renderer.height, this.state.slowMotion);
        this.inputManager.update();

        const trailPoints = this.inputManager.getTrailPoints();
        if (trailPoints.length >= 2) {
            const sliceResult = this.fruitManager.checkSlices(trailPoints, this.particles);
            if (sliceResult.score > 0 || sliceResult.effects.length > 0) {
                let bonusScore = 0;
                if (sliceResult.count >= 2) {
                    this.state.combo += sliceResult.count;
                    this.state.comboTimer = this.state.comboTimeout;
                    const comboBonus = sliceResult.count * 10;
                    bonusScore = comboBonus;
                    this.inputManager.glowIntensity = 2;

                    const lastPoint = trailPoints[trailPoints.length - 1];
                    this.renderer.addComboPopup(lastPoint.x, lastPoint.y - 30, sliceResult.count, this.state.combo);
                }

                if (this.state.combo > this.state.maxCombo) {
                    this.state.maxCombo = this.state.combo;
                }

                sliceResult.effects.forEach(effect => {
                    if (effect.type === 'slow') {
                        this.state.slowMotion = true;
                        this.state.slowMotionTimer = 300;
                        this.inputManager.trailEffect = 'ice';
                        this.renderer.addEffectPopup(effect.x, effect.y, '❄️ 冰冻！');
                    } else if (effect.type === 'double') {
                        this.state.scoreMultiplier = 2;
                        this.state.doubleScoreTimer = 600;
                        this.inputManager.trailEffect = 'rainbow';
                        this.renderer.addEffectPopup(effect.x, effect.y, '✨ 双倍分数！');
                    } else if (effect.type === 'life') {
                        if (this.state.missedCount > 0) {
                            this.state.missedCount--;
                        }
                        this.inputManager.trailEffect = 'fire';
                        this.renderer.addEffectPopup(effect.x, effect.y, '❤️ 生命+1！');
                    }
                });

                const totalGained = Math.floor((sliceResult.score + bonusScore) * this.state.scoreMultiplier);
                this.state.score += totalGained;
                const lastPoint = trailPoints[trailPoints.length - 1];
                this.renderer.addScorePopup(lastPoint.x, lastPoint.y, totalGained);
            }

            const hitBomb = this.bombManager.checkSlices(trailPoints);
            if (hitBomb) {
                this.endGame();
                return;
            }
        }

        if (this.state.comboTimer > 0) {
            this.state.comboTimer--;
            if (this.state.comboTimer === 0) {
                this.state.combo = 0;
            }
        }

        if (this.inputManager.glowIntensity > 1) {
            this.inputManager.glowIntensity -= 0.05;
        }

        if (this.state.slowMotion) {
            this.state.slowMotionTimer--;
            if (this.state.slowMotionTimer <= 0) {
                this.state.slowMotion = false;
                this.inputManager.trailEffect = 'normal';
            }
        }

        if (this.state.doubleScoreTimer > 0) {
            this.state.doubleScoreTimer--;
            if (this.state.doubleScoreTimer <= 0) {
                this.state.scoreMultiplier = 1;
                this.inputManager.trailEffect = 'normal';
            }
        }

        const missed = this.fruitManager.checkMissed(this.renderer.height);
        this.state.missedCount += missed;

        if (this.state.missedCount >= this.state.maxMissed) {
            this.endGame();
            return;
        }

        this.bombManager.checkMissed(this.renderer.height);

        this.particles = this.renderer.updateParticles(this.particles);
        this.renderer.updateScorePopups();
    }

    render() {
        this.renderer.render(
            this.state,
            this.inputManager,
            this.fruitManager,
            this.bombManager,
            this.particles
        );
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update();
        this.render();

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
