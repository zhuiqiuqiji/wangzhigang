class BowlingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.physics = new PhysicsEngine();
        this.scoring = new ScoringSystem();
        
        this.gameState = 'menu';
        this.currentScreen = 'menu';
        
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCurrentX = 0;
        this.dragCurrentY = 0;
        this.power = 0;
        
        this.laneBounds = this.renderer.getLaneBounds();
        this.ballStartX = this.laneBounds.centerX;
        this.ballStartY = this.laneBounds.bottom - 80;
        
        this.resultMessage = '';
        this.resultTimer = 0;
        
        this.currentPlayer = 1;
        this.aiScore = 0;
        
        this.init();
    }

    init() {
        this.physics.initPins(this.laneBounds.centerX, this.laneBounds.top + 60);
        this.physics.resetBall(this.ballStartX, this.ballStartY);
        this.scoring.updateScoreboard();
        
        this.setupEventListeners();
        this.initializeUI();
        this.gameLoop();
    }

    initializeUI() {
        skinSystem.renderSkinSelector();
        skinSystem.renderThemeSelector();
        gameModes.renderModeSelector();
        aiOpponent.renderOpponentSelector();
        spinControl.renderControls();
        
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGameFromMenu());
        document.getElementById('menuBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('spinSlider').addEventListener('input', (e) => {
            spinControl.setManualSpin(parseFloat(e.target.value));
        });
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseDown(touch);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseMove(touch);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        });
    }

    showMenu() {
        this.currentScreen = 'menu';
        this.gameState = 'menu';
        document.getElementById('menuScreen').style.display = 'flex';
        document.getElementById('gameScreen').style.display = 'none';
    }

    startGameFromMenu() {
        document.getElementById('menuScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'flex';
        this.currentScreen = 'game';
        this.startGame();
    }

    handleMouseDown(e) {
        if (this.gameState !== 'ready') return;
        if (aiOpponent.isAITurn) return;
        if (this.currentPlayer === 2 && aiOpponent.isMultiplayer()) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.dragStartX = e.clientX - rect.left;
        this.dragStartY = e.clientY - rect.top;
        this.dragCurrentX = this.dragStartX;
        this.dragCurrentY = this.dragStartY;
        this.isDragging = true;
        this.gameState = 'aiming';
        
        document.getElementById('aimIndicator').classList.add('active');
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.dragCurrentX = e.clientX - rect.left;
        this.dragCurrentY = e.clientY - rect.top;
        
        const dx = this.dragStartX - this.dragCurrentX;
        const dy = this.dragStartY - this.dragCurrentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.power = Math.min(distance / 150, 1);
        
        document.getElementById('powerFill').style.height = `${this.power * 100}%`;
        document.getElementById('powerValue').textContent = Math.round(this.power * 100);
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        document.getElementById('aimIndicator').classList.remove('active');
        
        if (this.power < 0.1) {
            this.gameState = 'ready';
            return;
        }
        
        this.throwBall();
    }

    getThrowAngle() {
        const dx = this.dragStartX - this.dragCurrentX;
        let throwAngle = Math.PI / 2 - (dx * 0.008);
        throwAngle = Math.max(Math.PI / 2 - 0.4, Math.min(Math.PI / 2 + 0.4, throwAngle));
        return throwAngle;
    }

    throwBall() {
        const speed = this.power * 15 + 5;
        const throwAngle = this.getThrowAngle();
        
        this.physics.ball.vx = Math.cos(throwAngle - Math.PI / 2) * speed * 0.5;
        this.physics.ball.vy = -Math.sin(throwAngle - Math.PI / 2) * speed * 0.5;
        
        const spinData = spinControl.getCurrentSpin();
        if (spinData.type !== 'straight') {
            this.physics.ball.spin = spinData.spin;
            this.physics.ball.hook = Math.abs(spinData.spin) * 1.5;
            this.physics.ball.hookVelocity = spinData.spin * speed * 0.002;
            this.physics.ball.rotationSpeed = spinData.spin * 0.5;
        }
        
        this.gameState = 'throwing';
        this.updateGameStatus('球正在滚动...');
    }

    startGame() {
        this.resetGame();
        this.gameState = 'ready';
        this.updateGameStatus('准备掷球');
        this.currentPlayer = 1;
        this.updatePlayerIndicator();
    }

    resetGame() {
        this.scoring.initFrames();
        this.scoring.updateScoreboard();
        
        const currentMode = gameModes.getCurrentMode();
        this.physics.initPins(this.laneBounds.centerX, this.laneBounds.top + 60, currentMode.pinType);
        this.physics.resetBall(this.ballStartX, this.ballStartY);
        
        this.gameState = 'ready';
        this.resultMessage = '';
        this.power = 0;
        this.currentPlayer = 1;
        
        this.updateUI();
        this.updateGameStatus('准备掷球');
        this.updatePlayerIndicator();
    }

    nextRoll() {
        this.physics.removeKnockedPins();
        this.physics.resetBall(this.ballStartX, this.ballStartY);
        
        if (aiOpponent.isMultiplayer() && this.currentPlayer === 1) {
            this.startAITurn();
        } else if (aiOpponent.isMultiplayer() && this.currentPlayer === 2) {
            this.currentPlayer = 1;
            this.gameState = 'ready';
            this.updatePlayerIndicator();
        } else {
            this.gameState = 'ready';
        }
        
        this.power = 0;
        this.updateUI();
        this.updateGameStatus('准备掷球');
    }

    nextFrame() {
        const currentMode = gameModes.getCurrentMode();
        this.physics.initPins(this.laneBounds.centerX, this.laneBounds.top + 60, currentMode.pinType);
        this.physics.resetBall(this.ballStartX, this.ballStartY);
        
        if (aiOpponent.isMultiplayer() && this.currentPlayer === 1) {
            this.startAITurn();
        } else if (aiOpponent.isMultiplayer() && this.currentPlayer === 2) {
            this.currentPlayer = 1;
            this.gameState = 'ready';
            this.updatePlayerIndicator();
        } else {
            this.gameState = 'ready';
        }
        
        this.power = 0;
        this.updateUI();
        this.updateGameStatus('准备掷球');
        this.updatePlayerIndicator();
    }

    startAITurn() {
        this.currentPlayer = 2;
        this.updatePlayerIndicator();
        aiOpponent.isAITurn = true;
        this.gameState = 'aiThinking';
        this.updateGameStatus('AI正在思考...');
        
        aiOpponent.executeAIThrow(
            this.physics,
            this.laneBounds,
            this.physics.pins,
            gameModes.getCurrentMode(),
            (move) => {
                this.gameState = 'throwing';
                this.updateGameStatus('AI掷球中...');
            }
        );
    }

    calculateRoll() {
        const knockedCount = this.physics.getKnockedPinsCount();
        const prevFrame = this.scoring.currentFrame;
        const prevRoll = this.scoring.currentRoll;
        
        const currentMode = gameModes.getCurrentMode();
        const scoreResult = currentMode.calculateScore(knockedCount, prevRoll, this.scoring);
        
        this.scoring.recordRoll(knockedCount);
        this.scoring.updateScoreboard();
        
        if (knockedCount === 10) {
            if (prevRoll === 0) {
                this.showResultMessage('STRIKE!');
            } else {
                this.showResultMessage('SPARE!');
            }
        } else if (knockedCount > 0) {
            this.showResultMessage(`击倒 ${knockedCount} 个!`);
        } else {
            this.showResultMessage('GUTTER BALL');
        }
        
        setTimeout(() => {
            if (this.scoring.isGameComplete()) {
                this.gameState = 'gameOver';
                this.updateGameStatus('游戏结束!');
                const totalScore = this.scoring.getTotalScore();
                this.showResultMessage(`最终得分: ${totalScore}`);
            } else {
                const needSecondRoll = (prevRoll === 0 && knockedCount < 10);
                if (needSecondRoll) {
                    this.nextRoll();
                } else {
                    this.nextFrame();
                }
            }
        }, 2000);
    }

    showResultMessage(message) {
        this.resultMessage = message;
        this.resultTimer = 120;
    }

    updateUI() {
        document.getElementById('currentFrame').textContent = Math.min(this.scoring.currentFrame + 1, 10);
        document.getElementById('currentRoll').textContent = this.scoring.currentRoll + 1;
        document.getElementById('currentScore').textContent = this.scoring.getTotalScore();
    }

    updatePlayerIndicator() {
        const player1Card = document.getElementById('player1Card');
        const player2Card = document.getElementById('player2Card');
        
        if (player1Card && player2Card) {
            if (this.currentPlayer === 1) {
                player1Card.classList.add('active');
                player2Card.classList.remove('active');
            } else {
                player1Card.classList.remove('active');
                player2Card.classList.add('active');
            }
        }
    }

    updateGameStatus(status) {
        document.getElementById('gameStatus').textContent = status;
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.currentScreen !== 'game') return;
        
        if (this.gameState === 'throwing') {
            this.physics.update({
                left: this.laneBounds.left,
                right: this.laneBounds.right
            });
            
            if (this.physics.ball.y < this.laneBounds.top - 50) {
                this.gameState = 'calculating';
            }
            
            if (!this.physics.isBallMoving() && !this.physics.arePinsMoving()) {
                this.gameState = 'calculating';
            }
        }
        
        if (this.gameState === 'calculating') {
            this.physics.update({
                left: this.laneBounds.left,
                right: this.laneBounds.right
            });
            
            if (!this.physics.arePinsMoving()) {
                this.calculateRoll();
                this.gameState = 'waiting';
            }
        }
        
        if (this.resultTimer > 0) {
            this.resultTimer--;
        }
    }

    render() {
        this.renderer.clear();
        
        if (this.currentScreen === 'menu') {
            this.renderMenuBackground();
            return;
        }
        
        this.renderer.drawLane();
        this.renderer.drawPins(this.physics.pins);
        this.renderer.drawBall(this.physics.ball);
        
        if (this.isDragging && this.gameState === 'aiming') {
            const aimAngle = this.getThrowAngle();
            
            const lineLength = 150 + this.power * 100;
            const endX = this.physics.ball.x + Math.cos(aimAngle - Math.PI / 2) * lineLength;
            const endY = this.physics.ball.y - Math.sin(aimAngle - Math.PI / 2) * lineLength;
            
            this.renderer.drawAimLine(
                this.physics.ball.x,
                this.physics.ball.y,
                endX,
                endY,
                this.power
            );
            
            const spinData = spinControl.getCurrentSpin();
            if (spinData.type !== 'straight') {
                const trajectory = spinControl.getTrajectoryPreview(
                    this.physics.ball.x,
                    this.physics.ball.y,
                    aimAngle,
                    this.power,
                    this.laneBounds
                );
                this.renderer.drawSpinTrajectory(trajectory, this.power);
            }
        }
        
        if (aiOpponent.isAITurn && this.gameState === 'aiThinking') {
            this.renderer.drawAITurnIndicator(true, aiOpponent.getCurrentOpponent().name);
        }
        
        if (this.resultTimer > 0 && this.resultMessage) {
            const alpha = Math.min(this.resultTimer / 60, 1);
            this.renderer.ctx.save();
            this.renderer.ctx.globalAlpha = alpha;
            this.renderer.drawResultMessage(
                this.resultMessage,
                this.canvas.width / 2,
                this.canvas.height / 2
            );
            this.renderer.ctx.restore();
        }
        
        if (this.gameState === 'ready') {
            this.renderer.drawText(
                '按住鼠标拖动来瞄准',
                this.canvas.width / 2,
                this.canvas.height - 30,
                20,
                '#aaa'
            );
        }
        
        if (this.gameState === 'gameOver') {
            this.renderer.drawText(
                '游戏结束! 点击重置游戏重新开始',
                this.canvas.width / 2,
                this.canvas.height - 30,
                20,
                '#48dbfb'
            );
        }
    }

    renderMenuBackground() {
        const gradient = this.renderer.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.renderer.ctx.fillStyle = gradient;
        this.renderer.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < 20; i++) {
            const x = (i / 20) * this.canvas.width + Math.sin(Date.now() / 1000 + i) * 10;
            const y = Math.cos(Date.now() / 800 + i) * 50 + this.canvas.height / 2;
            
            this.renderer.ctx.fillStyle = `rgba(254, 202, 87, ${0.1 + Math.sin(Date.now() / 500 + i) * 0.05})`;
            this.renderer.ctx.beginPath();
            this.renderer.ctx.arc(x, y, 3 + Math.sin(Date.now() / 300 + i) * 2, 0, Math.PI * 2);
            this.renderer.ctx.fill();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BowlingGame();
});
