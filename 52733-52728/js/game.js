class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 450;

        this.table = new Table(this.canvas.width, this.canvas.height);
        this.cue = new Cue();
        this.balls = [];
        this.ai = new BilliardAI('easy');

        this.gameMode = '8ball';
        this.opponentType = 'human';
        this.currentPlayer = 1;
        this.players = {
            1: { type: null, potted: [], isAI: false },
            2: { type: null, potted: [], isAI: false }
        };

        this.gameState = 'aiming';
        this.isDragging = false;
        this.dragStartPosition = null;
        this.mousePosition = new Vector2D(0, 0);
        this.breakShot = true;
        this.eightBallPotted = false;
        this.turnStartPottedCount = { 1: 0, 2: 0 };
        this.turnPottedBalls = [];

        this.aimAssist = true;
        this.trajectoryPrediction = true;
        this.cueSpin = { x: 0, y: 0 };

        this.replayData = null;
        this.isReplaying = false;
        this.slowMotion = false;
        this.gameSpeed = 1;

        this.stats = {
            totalShots: 0,
            successfulPots: 0,
            highScore: 0
        };

        this.paused = false;

        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }

    init() {
        this.balls = [];
        this.createBallsByMode();

        this.currentPlayer = 1;
        this.players = {
            1: { type: null, potted: [], isAI: false },
            2: { type: null, potted: [], isAI: this.opponentType.startsWith('ai') }
        };
        this.gameState = 'aiming';
        this.breakShot = true;
        this.eightBallPotted = false;
        this.turnStartPottedCount = { 1: 0, 2: 0 };
        this.turnPottedBalls = [];
        this.cue.visible = true;
        this.isReplaying = false;
        this.paused = false;

        this.updatePlayerLabels();
        this.updateUI();
        this.hideGameOverModal();
        this.updateStatsUI();
    }

    createBallsByMode() {
        switch (this.gameMode) {
            case '8ball':
                this.create8BallBalls();
                break;
            case '9ball':
                this.create9BallBalls();
                break;
            case 'straight':
                this.createStraightPoolBalls();
                break;
            case 'snooker':
                this.createSnookerBalls();
                break;
            default:
                this.create8BallBalls();
        }
    }

    create8BallBalls() {
        const startX = this.canvas.width * 0.75;
        const startY = this.canvas.height / 2;
        const spacing = Ball.RADIUS * 2.05;

        this.balls.push(new Ball(0, this.canvas.width * 0.25, this.canvas.height / 2));

        const triangleOrder = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
        let orderIndex = 0;

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
                const x = startX + row * spacing * 0.866;
                const y = startY - (row * spacing / 2) + col * spacing;
                this.balls.push(new Ball(triangleOrder[orderIndex], x, y));
                orderIndex++;
            }
        }
    }

    create9BallBalls() {
        const startX = this.canvas.width * 0.75;
        const startY = this.canvas.height / 2;
        const spacing = Ball.RADIUS * 2.05;

        this.balls.push(new Ball(0, this.canvas.width * 0.25, this.canvas.height / 2));

        const diamondOrder = [1, 6, 9, 2, 7, 3, 8, 4, 5];
        const positions = [
            [0, 0],
            [1, -1], [1, 1],
            [2, -2], [2, 0], [2, 2],
            [3, -1], [3, 1],
            [4, 0]
        ];

        for (let i = 0; i < 9; i++) {
            const [row, colOffset] = positions[i];
            const x = startX + row * spacing * 0.866;
            const y = startY + colOffset * spacing * 0.5;
            this.balls.push(new Ball(diamondOrder[i], x, y));
        }
    }

    createStraightPoolBalls() {
        const startX = this.canvas.width * 0.75;
        const startY = this.canvas.height / 2;
        const spacing = Ball.RADIUS * 2.05;

        this.balls.push(new Ball(0, this.canvas.width * 0.25, this.canvas.height / 2));

        const triangleOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        let orderIndex = 0;

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
                const x = startX + row * spacing * 0.866;
                const y = startY - (row * spacing / 2) + col * spacing;
                this.balls.push(new Ball(triangleOrder[orderIndex], x, y));
                orderIndex++;
            }
        }
    }

    createSnookerBalls() {
        const startX = this.canvas.width * 0.7;
        const startY = this.canvas.height / 2;
        const spacing = Ball.RADIUS * 2.05;

        this.balls.push(new Ball(0, this.canvas.width * 0.25, this.canvas.height / 2));

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col <= row; col++) {
                const x = startX + row * spacing * 0.866;
                const y = startY - (row * spacing / 2) + col * spacing;
                this.balls.push(new Ball(1, x, y));
            }
        }

        const colorPositions = [
            { num: 2, x: this.canvas.width * 0.3, y: this.canvas.height / 2 },
            { num: 3, x: this.canvas.width * 0.5, y: this.canvas.height / 2 },
            { num: 4, x: this.canvas.width * 0.15, y: this.canvas.height * 0.3 },
            { num: 5, x: this.canvas.width * 0.15, y: this.canvas.height * 0.7 }
        ];

        for (const pos of colorPositions) {
            this.balls.push(new Ball(pos.num, pos.x, pos.y));
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));

        document.getElementById('restartBtn').addEventListener('click', () => this.init());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.init());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());

        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            this.init();
        });

        document.getElementById('opponentType').addEventListener('change', (e) => {
            this.opponentType = e.target.value;
            if (e.target.value.startsWith('ai')) {
                const diff = e.target.value.replace('ai-', '');
                this.ai.setDifficulty(diff);
            }
            this.init();
        });

        document.querySelectorAll('.spin-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                document.querySelectorAll('.spin-cell').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                const spin = e.target.dataset.spin.split(',').map(Number);
                this.cueSpin = { x: spin[0] * 5, y: spin[1] * 5 };
            });
        });

        document.getElementById('aimAssist').addEventListener('change', (e) => {
            this.aimAssist = e.target.checked;
        });

        document.getElementById('trajectoryPred').addEventListener('change', (e) => {
            this.trajectoryPrediction = e.target.checked;
        });

        document.getElementById('replayBtn').addEventListener('click', () => this.playReplay());
        document.getElementById('slowMotionBtn').addEventListener('click', () => {
            this.slowMotion = !this.slowMotion;
            this.gameSpeed = this.slowMotion ? 0.3 : 1;
            document.getElementById('slowMotionBtn').textContent = this.slowMotion ? '⏱ 正常速度' : '⏱ 慢动作模式';
        });
    }

    updatePlayerLabels() {
        const label = document.getElementById('player2-label');
        label.textContent = this.opponentType.startsWith('ai') ? 'AI对手' : '玩家2';
    }

    getCanvasMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        return new Vector2D(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    }

    onMouseDown(e) {
        if (this.gameState !== 'aiming' || this.players[this.currentPlayer].isAI || this.paused) return;

        this.isDragging = true;
        this.dragStartPosition = this.getCanvasMousePosition(e);
    }

    onMouseMove(e) {
        this.mousePosition = this.getCanvasMousePosition(e);

        if (this.gameState === 'aiming' && !this.players[this.currentPlayer].isAI) {
            const cueBall = this.getCueBall();
            if (cueBall) {
                this.cue.update(cueBall.position, this.mousePosition, this.isDragging, this.dragStartPosition);
                this.updatePowerBar();
            }
        }
    }

    onMouseUp(e) {
        if (!this.isDragging || this.gameState !== 'aiming' || this.players[this.currentPlayer].isAI) {
            this.isDragging = false;
            return;
        }

        this.isDragging = false;
        const cueBall = this.getCueBall();

        if (cueBall && this.cue.power > 0.5) {
            this.saveReplayState();
            this.executeShot(cueBall);
        }
    }

    executeShot(cueBall, customSpin = null) {
        cueBall.spin = customSpin ? { ...customSpin } : { ...this.cueSpin };
        this.cue.shoot(cueBall);
        this.gameState = 'shooting';
        this.cue.visible = false;
        this.updatePowerBar(0);
        this.stats.totalShots++;
        this.turnStartPottedCount[this.currentPlayer] = this.players[this.currentPlayer].potted.length;
        this.turnPottedBalls = [];
        this.updateStatsUI();
    }

    saveReplayState() {
        this.replayData = {
            balls: this.balls.map(b => ({
                number: b.number,
                position: b.position.clone(),
                potted: b.potted
            })),
            cueAngle: this.cue.angle,
            cuePower: this.cue.power,
            cueSpin: { ...this.cueSpin },
            player: this.currentPlayer
        };
    }

    playReplay() {
        if (!this.replayData || this.gameState === 'shooting') return;

        this.isReplaying = true;
        this.gameState = 'replaying';

        for (let i = 0; i < this.replayData.balls.length; i++) {
            const data = this.replayData.balls[i];
            const ball = this.balls.find(b => b.number === data.number);
            if (ball) {
                ball.position = data.position.clone();
                ball.velocity = new Vector2D(0, 0);
                ball.potted = data.potted;
                ball.spin = { x: 0, y: 0 };
            }
        }

        const cueBall = this.getCueBall();
        if (cueBall) {
            cueBall.spin = { ...this.replayData.cueSpin };
            cueBall.velocity = new Vector2D(
                Math.cos(this.replayData.cueAngle) * this.replayData.cuePower,
                Math.sin(this.replayData.cueAngle) * this.replayData.cuePower
            );
        }

        this.cue.visible = false;
        this.gameState = 'shooting';

        setTimeout(() => {
            this.isReplaying = false;
        }, 3000);
    }

    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pauseBtn').textContent = this.paused ? '继续' : '暂停';
    }

    updatePowerBar(power = null) {
        const powerFill = document.getElementById('powerFill');
        const p = power !== null ? power : this.cue.power;
        const percentage = (p / this.cue.maxPower) * 100;
        powerFill.style.height = `${percentage}%`;
    }

    getCueBall() {
        return this.balls.find(b => b.number === 0 && !b.potted);
    }

    gameLoop() {
        if (!this.paused) {
            this.update();
        }
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.gameState === 'shooting') {
            const steps = this.slowMotion ? 1 : 2;
            for (let i = 0; i < steps; i++) {
                this.updatePhysics();
            }

            if (Physics.areAllBallsStopped(this.balls)) {
                this.onTurnEnd();
            }
        } else if (this.gameState === 'aiming' && this.players[this.currentPlayer].isAI) {
            this.handleAITurn();
        }
    }

    handleAITurn() {
        if (this.aiTimeout) return;

        this.aiTimeout = setTimeout(() => {
            const playerType = this.players[this.currentPlayer].type;
            const shot = this.ai.calculateShot(this.balls, this.table, playerType, this.balls);

            if (shot) {
                const cueBall = this.getCueBall();
                if (cueBall) {
                    this.cue.angle = shot.angle;
                    this.cue.power = shot.power;
                    this.saveReplayState();
                    this.executeShot(cueBall, shot.spin);
                }
            }

            this.aiTimeout = null;
        }, this.ai.shotDelay);
    }

    updatePhysics() {
        for (const ball of this.balls) {
            Physics.updateBall(ball);
        }

        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                if (Physics.checkBallCollision(this.balls[i], this.balls[j])) {
                    Physics.resolveBallCollision(this.balls[i], this.balls[j]);
                }
            }
        }

        for (const ball of this.balls) {
            if (!ball.potted) {
                Physics.checkWallCollision(ball, this.table);
            }
        }

        this.checkPockets();
    }

    checkPockets() {
        for (const ball of this.balls) {
            if (ball.potted) continue;

            if (this.table.isInPocket(ball)) {
                ball.potted = true;
                this.onBallPotted(ball);
            }
        }
    }

    onBallPotted(ball) {
        const ballType = ball.getType();

        if (ballType === 'cue') {
            this.setStatus('白球入袋！对方获得自由球');
        } else if (ballType === 'eight' && this.gameMode === '8ball') {
            this.eightBallPotted = true;
        } else {
            this.players[this.currentPlayer].potted.push(ball.number);
            this.turnPottedBalls.push({ number: ball.number, type: ballType });
            this.stats.successfulPots++;

            if (this.breakShot) {
                this.breakShot = false;
                if (this.players[this.currentPlayer].type === null && this.gameMode === '8ball') {
                    this.players[this.currentPlayer].type = ballType;
                    this.players[this.currentPlayer === 1 ? 2 : 1].type = ballType === 'solid' ? 'striped' : 'solid';
                }
            }
        }
    }

    onTurnEnd() {
        if (this.isReplaying) return;

        if (this.gameMode === '8ball' && this.eightBallPotted) {
            this.checkEightBallWin();
            return;
        }

        if (this.gameMode !== '8ball') {
            const nonCueBalls = this.balls.filter(b => b.number !== 0);
            const allPotted = nonCueBalls.every(b => b.potted);
            if (allPotted) {
                this.showGameOver(this.currentPlayer, '清台获胜！');
                return;
            }
        }

        const cueBall = this.getCueBall();
        if (!cueBall) {
            this.respawnCueBall();
            this.switchPlayer();
        } else {
            const startCount = this.turnStartPottedCount[this.currentPlayer];
            const currentCount = this.players[this.currentPlayer].potted.length;
            const pottedThisTurn = currentCount - startCount;
            const playerType = this.players[this.currentPlayer].type;

            if (this.gameMode === '8ball' && playerType && pottedThisTurn > 0) {
                const hasMyBallPotted = this.turnPottedBalls.some(b => b.type === playerType);
                if (hasMyBallPotted) {
                    this.setStatus('合法进球！继续击球');
                } else {
                    this.switchPlayer();
                }
            } else if (pottedThisTurn > 0) {
                this.setStatus('合法进球！继续击球');
            } else {
                this.switchPlayer();
            }
        }

        this.gameState = 'aiming';
        this.cue.visible = true;
        this.updateUI();
        this.updateStatsUI();
    }

    checkEightBallWin() {
        const player = this.players[this.currentPlayer];
        const allMyBallsPotted = this.checkAllBallsPotted(player.type);

        if (allMyBallsPotted) {
            this.showGameOver(this.currentPlayer, '合法打入8号球，获胜！');
        } else {
            const winner = this.currentPlayer === 1 ? 2 : 1;
            this.showGameOver(winner, '对方过早打入8号球，你获胜！');
        }
    }

    checkAllBallsPotted(type) {
        if (this.gameMode !== '8ball') return true;

        const ballsToCheck = type === 'solid'
            ? this.balls.filter(b => b.number >= 1 && b.number <= 7)
            : this.balls.filter(b => b.number >= 9 && b.number <= 15);

        return ballsToCheck.every(b => b.potted);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        const label = this.players[this.currentPlayer].isAI ? 'AI' : `玩家${this.currentPlayer}`;
        this.setStatus(`${label} 回合`);
    }

    respawnCueBall() {
        const cueBall = this.balls.find(b => b.number === 0);
        if (cueBall) {
            cueBall.potted = false;
            cueBall.position = new Vector2D(this.canvas.width * 0.25, this.canvas.height / 2);
            cueBall.velocity = new Vector2D(0, 0);
            cueBall.spin = { x: 0, y: 0 };
        }
    }

    setStatus(message) {
        document.getElementById('game-status').textContent = message;
    }

    updateUI() {
        const label = this.players[this.currentPlayer].isAI ? 'AI' : `玩家${this.currentPlayer}`;
        document.getElementById('current-turn').textContent = `${label} 回合`;

        const player1Type = this.players[1].type === 'solid' ? '单色球' :
                            this.players[1].type === 'striped' ? '花色球' : '-';
        const player2Type = this.players[2].type === 'solid' ? '单色球' :
                            this.players[2].type === 'striped' ? '花色球' : '-';

        document.getElementById('player1-type').textContent = player1Type;
        document.getElementById('player2-type').textContent = player2Type;

        document.getElementById('player1-count').textContent = this.players[1].potted.length;
        document.getElementById('player2-count').textContent = this.players[2].potted.length;

        document.querySelector('.player1').classList.toggle('active', this.currentPlayer === 1);
        document.querySelector('.player2').classList.toggle('active', this.currentPlayer === 2);
    }

    updateStatsUI() {
        document.getElementById('totalShots').textContent = this.stats.totalShots;
        const rate = this.stats.totalShots > 0
            ? Math.round((this.stats.successfulPots / this.stats.totalShots) * 100)
            : 0;
        document.getElementById('potRate').textContent = `${rate}%`;
        document.getElementById('highScore').textContent = Math.max(
            this.players[1].potted.length,
            this.players[2].potted.length
        );
    }

    showGameOver(winner, reason) {
        this.gameState = 'gameOver';
        const winnerLabel = this.players[winner].isAI ? 'AI' : `玩家${winner}`;
        document.getElementById('winnerText').textContent = `🎉 ${winnerLabel} 获胜！`;
        document.getElementById('winnerReason').textContent = reason;
        document.getElementById('gameOverModal').classList.add('show');
    }

    hideGameOverModal() {
        document.getElementById('gameOverModal').classList.remove('show');
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.table.draw(this.ctx);

        if (this.aimAssist || this.trajectoryPrediction) {
            this.drawAimAssist();
        }

        const sortedBalls = [...this.balls].sort((a, b) => {
            if (a.number === 0) return 1;
            if (b.number === 0) return -1;
            return a.position.y - b.position.y;
        });

        for (const ball of sortedBalls) {
            ball.draw(this.ctx);
        }

        const cueBall = this.getCueBall();
        if (cueBall && this.cue.visible) {
            this.cue.draw(this.ctx, cueBall.position);
        }

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('暂停', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    drawAimAssist() {
        const cueBall = this.getCueBall();
        if (!cueBall || !this.cue.visible) return;

        const power = Math.max(this.cue.power, 5);
        const trajectory = Physics.predictTrajectory(
            cueBall, this.balls, this.table,
            power, this.cue.angle, 300
        );

        if (trajectory.length < 2) return;

        this.ctx.save();

        if (this.trajectoryPrediction) {
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(trajectory[0].x, trajectory[0].y);

            for (let i = 1; i < trajectory.length; i++) {
                this.ctx.lineTo(trajectory[i].x, trajectory[i].y);
            }
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            for (const point of trajectory) {
                if (point.collision && point.collision !== 'wall') {
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, Ball.RADIUS * 1.2, 0, Math.PI * 2);
                    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                }
            }
        }

        if (this.aimAssist) {
            const endX = cueBall.position.x + Math.cos(this.cue.angle) * 200;
            const endY = cueBall.position.y + Math.sin(this.cue.angle) * 200;

            this.ctx.setLineDash([3, 6]);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(cueBall.position.x, cueBall.position.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
